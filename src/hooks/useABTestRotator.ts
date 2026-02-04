// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useSearchParams } from 'react-router-dom';

interface ABTestVariant {
  testId: string;
  variant: 'a' | 'b';
  title: string | null;
  text: string | null;
}

/**
 * Хук для ротации A/B тестов на лендинге
 * Проверяет активные тесты для текущей страницы и применяет вариант с вероятностью 50%
 * projectId может быть передан напрямую, из URL параметра ?project_id=xxx или из localStorage
 */
export const useABTestRotator = (projectId?: string | null) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeVariant, setActiveVariant] = useState<ABTestVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем projectId из разных источников
    let effectiveProjectId = projectId;
    
    if (!effectiveProjectId) {
      // Пробуем получить из URL параметра
      effectiveProjectId = searchParams.get('project_id');
    }
    
    if (!effectiveProjectId) {
      // Пробуем получить из localStorage (если пользователь уже работал с системой)
      effectiveProjectId = localStorage.getItem('activeProjectId');
    }

    if (!effectiveProjectId) {
      setLoading(false);
      return;
    }

    const checkAndApplyTest = async () => {
      try {
        const currentPath = location.pathname;

        // Проверяем localStorage для сохраненного варианта
        const storageKey = `ab_test_${effectiveProjectId}_${currentPath}`;
        const savedVariant = localStorage.getItem(storageKey);

        if (savedVariant) {
          try {
            const parsed = JSON.parse(savedVariant);
            // Проверяем, что тест все еще активен
            const { data: test } = await supabase
              .from('ab_tests')
              .select('id, status, variant_a_title, variant_a_text, variant_b_title, variant_b_text')
              .eq('id', parsed.testId)
              .eq('status', 'running')
              .single();

            if (test) {
              setActiveVariant({
                testId: parsed.testId,
                variant: parsed.variant,
                title: parsed.variant === 'a' ? test.variant_a_title : test.variant_b_title,
                text: parsed.variant === 'a' ? test.variant_a_text : test.variant_b_text,
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            // Если тест не найден или не активен, продолжаем поиск
            console.log('Saved variant test no longer active, searching for new test');
          }
        }

        // Ищем активные тесты для текущей страницы
        const { data: activeTests, error } = await supabase
          .from('ab_tests')
          .select('id, variant_a_title, variant_a_text, variant_b_title, variant_b_text')
          .eq('project_id', effectiveProjectId)
          .eq('status', 'running')
          .eq('page_path', currentPath);

        if (error) throw error;

        if (!activeTests || activeTests.length === 0) {
          setLoading(false);
          return;
        }

        // Берем первый активный тест
        const test = activeTests[0];

        // С вероятностью 50% выбираем вариант
        const variant: 'a' | 'b' = Math.random() < 0.5 ? 'a' : 'b';

        // Сохраняем в localStorage
        const variantData = {
          testId: test.id,
          variant,
          title: variant === 'a' ? test.variant_a_title : test.variant_b_title,
          text: variant === 'a' ? test.variant_a_text : test.variant_b_text,
        };

        localStorage.setItem(storageKey, JSON.stringify({
          testId: test.id,
          variant,
          projectId: effectiveProjectId,
        }));

        // Увеличиваем счетчик посетителей
        await supabase.rpc('increment_ab_test_visitors', {
          test_id: test.id,
          variant_name: variant === 'a' ? 'variant_a_visitors' : 'variant_b_visitors',
        }).catch(err => {
          console.error('Error incrementing visitors:', err);
        });

        setActiveVariant(variantData);
      } catch (error) {
        console.error('Error in AB test rotator:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAndApplyTest();
  }, [location.pathname, projectId, searchParams]);

  return { activeVariant, loading };
};

/**
 * Функция для записи конверсии (когда лид создан)
 */
export const recordABTestConversion = async (
  projectId: string,
  leadId: string,
  testId: string,
  variant: 'a' | 'b'
) => {
  try {
    // Обновляем лид с информацией о тесте
    await supabase
      .from('leads')
      .update({
        ab_test_id: testId,
        ab_test_variant: variant,
      })
      .eq('id', leadId);

    // Увеличиваем счетчик конверсий через RPC функцию
    await supabase.rpc('increment_ab_test_conversions', {
      test_id: testId,
      variant_name: variant === 'a' ? 'variant_a_conversions' : 'variant_b_conversions',
    }).catch(err => {
      console.error('Error incrementing conversions:', err);
    });
  } catch (error) {
    console.error('Error recording AB test conversion:', error);
  }
};
