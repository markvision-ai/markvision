import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText, Video, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";

const categories = [
    {
        icon: <BookOpen className="w-6 h-6" />,
        title: "Руководства",
        description: "Пошаговые инструкции по работе с платформой",
        count: "12 статей"
    },
    {
        icon: <Video className="w-6 h-6" />,
        title: "Видеоуроки",
        description: "Обучающие видео по всем функциям системы",
        count: "8 видео"
    },
    {
        icon: <FileText className="w-6 h-6" />,
        title: "Документация API",
        description: "Техническая документация для разработчиков",
        count: "Полная документация"
    },
    {
        icon: <HelpCircle className="w-6 h-6" />,
        title: "FAQ",
        description: "Ответы на часто задаваемые вопросы",
        count: "25+ вопросов"
    }
];

const Knowledge = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 relative flex items-center justify-center">
                            <MarkVisionLogo className="w-full h-full drop-shadow-2xl shadow-blue-900/5" />
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
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full mb-6 border border-primary/20">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">База знаний</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            База знаний MarkVision AI
                        </h1>

                        <p className="text-xl text-gray-200 mb-12">
                            Все, что нужно знать для эффективной работы с платформой.
                            Руководства, видеоуроки и ответы на вопросы.
                        </p>

                        {/* Categories Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-12">
                            {categories.map((category, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 hover:border-primary/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                                        {category.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                                        {category.title}
                                    </h3>
                                    <p className="text-gray-300 mb-3">{category.description}</p>
                                    <div className="text-sm text-primary/80">{category.count}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Popular Articles */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Популярные статьи</h2>
                            <ul className="space-y-4">
                                {[
                                    "Как начать работу с MarkVision AI",
                                    "Настройка интеграции с Instagram и Facebook",
                                    "Создание автоматических воронок продаж",
                                    "Анализ эффективности рекламных кампаний",
                                    "Работа с CRM: лучшие практики"
                                ].map((article, index) => (
                                    <li key={index} className="flex items-center gap-3 text-gray-200 hover:text-primary transition-colors cursor-pointer">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span>{article}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Contact Support */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.4 }}
                            className="mt-8 bg-gradient-to-r from-primary/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-primary/20 p-8 text-center"
                        >
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Не нашли ответ на свой вопрос?
                            </h3>
                            <p className="text-gray-300 mb-6">
                                Наша команда поддержки всегда готова помочь
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild size="lg" className="rounded-2xl px-8">
                                    <a href="mailto:markvision@mail.ru?subject=Вопрос по работе с платформой">
                                        Связаться с поддержкой
                                    </a>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="rounded-2xl px-8">
                                    <Link to="/training">Корпоративное обучение</Link>
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Knowledge;
