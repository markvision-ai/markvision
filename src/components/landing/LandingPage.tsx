import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedBeam } from './AnimatedBeam';
import { ModuleCard } from './ModuleCard';
import { ArrowRight, Sparkles } from 'lucide-react';

const modules = [
  {
    number: '01',
    title: 'Контент-Завод',
    description: '200+ публикаций в месяц. ИИ берет на себя всё: от идей до монтажа.',
    icon: '🎬',
  },
  {
    number: '02',
    title: 'Воронка 24/7',
    description: 'Автоматический ИИ-ассистент, который консультирует и записывает пациентов 24/7.',
    icon: '🤖',
  },
  {
    number: '03',
    title: 'Сквозная аналитика',
    description: 'Прозрачный путь от клика до чека. Контроль ROI и окупаемости рекламы.',
    icon: '📊',
  },
  {
    number: '04',
    title: 'Умная CRM и Финансы',
    description: 'PnL-отчеты и учет каждой копейки в вашем телефоне.',
    icon: '💰',
  },
  {
    number: '05',
    title: 'ИИ-РОП',
    description: 'Автоматический контроль работы персонала, анализ переписок и звонков.',
    icon: '👁️',
  },
  {
    number: '06',
    title: 'База знаний',
    description: 'Хранилище ваших скриптов и методологий для обучения команды и ИИ.',
    icon: '📚',
  },
];

export const LandingPage = () => {
  const navigate = useNavigate();

  const scrollToSignup = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">MarkVision AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="text-slate-600 hover:text-slate-900"
            >
              Войти
            </Button>
            <Button 
              onClick={scrollToSignup}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-6"
            >
              Начать бесплатно
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                MarkVision AI —{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Операционная система
                </span>{' '}
                для роста вашей клиники
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Единая ИТ-платформа для автоматизации маркетинга, продаж и контроля прибыли. 
                Всё, что нужно руководителю, в одном окне.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={scrollToSignup}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full px-8 py-6 text-lg group"
                >
                  Попробовать 7 дней бесплатно
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="rounded-full px-8 py-6 text-lg border-2"
                >
                  У меня уже есть аккаунт
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatedBeam />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              6 инструментов для{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                доминирования на рынке
              </span>
            </h2>
            <p className="text-lg text-slate-600">
              Полный набор инструментов для масштабирования вашей клиники
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.number}
                {...module}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Personal Story Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                  👶
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Личный штрих</h3>
                  <p className="text-slate-400">История создания</p>
                </div>
              </div>
              <p className="text-lg text-slate-300 leading-relaxed mb-4">
                MarkVision назван в честь моего сына — Марка. Это не просто программа, 
                это моё наследие, которое я создаю для него.
              </p>
              <p className="text-lg text-slate-300 leading-relaxed mb-4">
                Каждая функция, каждый алгоритм — это часть системы, которая поможет 
                тысячам клиник вырасти. Когда Марк вырастет, я хочу показать ему, 
                что его имя стало символом инноваций в медицинском маркетинге.
              </p>
              <p className="text-xl font-semibold text-white">
                Мы создаём софт, который не ошибается.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Готовы автоматизировать рост вашей клиники?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Начните 7-дневный бесплатный период прямо сейчас
            </p>
            <Button 
              size="lg"
              onClick={scrollToSignup}
              className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-12 py-6 text-lg font-semibold"
            >
              Зарегистрироваться бесплатно
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">MarkVision AI</span>
          </div>
          <p className="text-slate-400">
            © 2024 MarkVision AI. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
