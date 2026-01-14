import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

const pageContent: Record<string, { title: string; icon: React.ReactNode; content: string[] }> = {
  "/privacy": {
    title: "Политика конфиденциальности",
    icon: <Shield className="w-4 h-4 text-blue-600" />,
    content: [
      "MarkVision AI уважает вашу конфиденциальность и обязуется защищать ваши персональные данные.",
      "Мы собираем только те данные, которые необходимы для предоставления наших услуг.",
      "Ваши данные не передаются третьим лицам без вашего согласия.",
      "Мы используем современные методы шифрования для защиты информации.",
      "Вы можете запросить удаление ваших данных в любой момент.",
    ],
  },
  "/terms": {
    title: "Пользовательское соглашение",
    icon: <FileText className="w-4 h-4 text-green-600" />,
    content: [
      "Добро пожаловать в MarkVision AI. Используя наш сервис, вы соглашаетесь с условиями.",
      "Сервис предоставляется «как есть» для автоматизации медицинского бизнеса.",
      "Пользователь несет ответственность за достоверность вводимых данных.",
      "Мы оставляем за собой право изменять условия с уведомлением пользователей.",
      "Все споры решаются в соответствии с законодательством Республики Казахстан.",
    ],
  },
  "/compliance": {
    title: "Соответствие Закону РК «О персональных данных»",
    icon: <Scale className="w-4 h-4 text-purple-600" />,
    content: [
      "MarkVision AI полностью соответствует требованиям Закона Республики Казахстан «О персональных данных и их защите».",
      "Обработка персональных данных осуществляется только с согласия субъекта.",
      "Данные хранятся на серверах с соблюдением требований локализации.",
      "Обеспечивается защита от несанкционированного доступа к персональным данным.",
      "Субъект данных имеет право на доступ, изменение и удаление своих данных.",
    ],
  },
  "/training": {
    title: "Корпоративное обучение",
    icon: <FileText className="w-4 h-4 text-orange-600" />,
    content: [
      "Программа корпоративного обучения для владельцев клиник и их команд.",
      "Полный курс по работе с системой MarkVision AI.",
      "Индивидуальные консультации и поддержка при внедрении.",
      "Сертификация сотрудников по работе с платформой.",
      "Регулярные обновления и вебинары о новых функциях.",
    ],
  },
};

const LegalPage = () => {
  const location = useLocation();
  const page = pageContent[location.pathname] || pageContent["/privacy"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-semibold text-lg">
              <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-6">
              {page.icon}
              <span className="text-sm font-medium text-slate-700">Юридическая информация</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
              {page.title}
            </h1>
            
            <div className="prose prose-slate max-w-none">
              {page.content.map((paragraph, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                  className="text-slate-600 text-lg leading-relaxed mb-4"
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-12 p-6 bg-slate-100 rounded-2xl"
            >
              <p className="text-sm text-slate-500">
                Последнее обновление: Январь 2026
              </p>
              <p className="text-sm text-slate-500 mt-2">
                По вопросам обращайтесь: markvision@mail.ru
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-8"
            >
              <Button asChild size="lg" className="rounded-2xl px-8">
                <Link to="/">Вернуться на главную</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
