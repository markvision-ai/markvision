import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatAnalytic {
    id: string;
    project_id: string;
    manager_id?: string;
    manager_name?: string;
    is_bot: boolean;
    conversation_id: string;
    message_count: number;
    duration: number; // in seconds
    avg_response_time: number; // in seconds
    sentiment_score: number; // 0-100
    topics: string[];
    conversion_result: 'success' | 'failed' | 'pending';
    ai_score: number; // 0-100
    recommendations: string[];
    created_at: string;
}

export interface BotPerformance {
    total_conversations: number;
    success_rate: number;
    logic_errors: number;
    avg_conversation_length: number;
    handoff_rate: number;
    top_errors: {
        type: string;
        count: number;
        example: string;
    }[];
    prompt_recommendations: string[];
}

export function useChatAnalytics(projectId: string | null) {
    const [chats, setChats] = useState<ChatAnalytic[]>([]);
    const [botPerformance, setBotPerformance] = useState<BotPerformance>({
        total_conversations: 0,
        success_rate: 0,
        logic_errors: 0,
        avg_conversation_length: 0,
        handoff_rate: 0,
        top_errors: [],
        prompt_recommendations: [],
    });
    const [loading, setLoading] = useState(true);

    const fetchChatAnalytics = useCallback(async () => {
        // Mock data for demonstration
        const mockChats: ChatAnalytic[] = [
            {
                id: '1',
                project_id: projectId || 'demo',
                manager_id: 'm1',
                manager_name: 'Анна Иванова',
                is_bot: false,
                conversation_id: 'conv1',
                message_count: 24,
                duration: 1200,
                avg_response_time: 45,
                sentiment_score: 85,
                topics: ['Цены', 'Запись', 'Услуги'],
                conversion_result: 'success',
                ai_score: 88,
                recommendations: [
                    'Отличная скорость ответов',
                    'Профессиональный тон общения',
                    'Успешное закрытие сделки'
                ],
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '2',
                project_id: projectId || 'demo',
                manager_id: 'm2',
                manager_name: 'Дмитрий Петров',
                is_bot: false,
                conversation_id: 'conv2',
                message_count: 15,
                duration: 900,
                avg_response_time: 120,
                sentiment_score: 65,
                topics: ['Вопросы', 'Сомнения'],
                conversion_result: 'failed',
                ai_score: 60,
                recommendations: [
                    'Необходимо улучшить скорость ответов',
                    'Работа с возражениями требует доработки',
                    'Клиент ушел без записи'
                ],
                created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '3',
                project_id: projectId || 'demo',
                is_bot: true,
                conversation_id: 'bot_conv1',
                message_count: 12,
                duration: 480,
                avg_response_time: 2,
                sentiment_score: 90,
                topics: ['Запись', 'Время работы'],
                conversion_result: 'success',
                ai_score: 92,
                recommendations: [
                    'Отличная работа бота',
                    'Быстрые и точные ответы',
                    'Успешная запись клиента'
                ],
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: '4',
                project_id: projectId || 'demo',
                is_bot: true,
                conversation_id: 'bot_conv2',
                message_count: 8,
                duration: 240,
                avg_response_time: 2,
                sentiment_score: 50,
                topics: ['Ошибка', 'Непонимание'],
                conversion_result: 'failed',
                ai_score: 45,
                recommendations: [
                    'Бот не понял запрос клиента',
                    'Необходимо добавить обработку этого сценария',
                    'Клиент покинул чат'
                ],
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            },
        ];

        setChats(mockChats);

        // Mock bot performance data
        const botChats = mockChats.filter(c => c.is_bot);
        const successfulBotChats = botChats.filter(c => c.conversion_result === 'success').length;

        setBotPerformance({
            total_conversations: botChats.length,
            success_rate: (successfulBotChats / botChats.length) * 100,
            logic_errors: 3,
            avg_conversation_length: botChats.reduce((sum, c) => sum + c.message_count, 0) / botChats.length,
            handoff_rate: 15,
            top_errors: [
                {
                    type: 'Непонимание запроса',
                    count: 5,
                    example: 'Клиент спросил про акции, бот не распознал'
                },
                {
                    type: 'Некорректный ответ',
                    count: 3,
                    example: 'Бот дал неверную информацию о ценах'
                },
                {
                    type: 'Зацикливание',
                    count: 2,
                    example: 'Бот повторял один и тот же вопрос'
                },
            ],
            prompt_recommendations: [
                'Добавить обработку вопросов про акции и скидки',
                'Улучшить распознавание намерений клиента',
                'Добавить fallback для неизвестных запросов',
                'Обновить базу знаний о ценах и услугах',
                'Добавить проверку на зацикливание диалога'
            ],
        });

        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        fetchChatAnalytics();
    }, [fetchChatAnalytics]);

    const refresh = useCallback(() => {
        setLoading(true);
        fetchChatAnalytics();
    }, [fetchChatAnalytics]);

    return {
        chats,
        botPerformance,
        loading,
        refresh,
    };
}
