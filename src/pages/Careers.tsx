import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Rocket, GraduationCap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";

const skills = [
    "Работа с CRM и аналитическими системами",
    "Настройка интеграций (Facebook, Instagram, n8n)",
    "Автоматизация бизнес-процессов",
    "Консультирование клиентов по маркетингу"
];

const Careers = () => {
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
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 backdrop-blur-sm rounded-full mb-6 border border-green-500/20">
                            <Rocket className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">Новая профессия</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Профессия: Интегратор MarkVision AI
                        </h1>

                        <p className="text-xl text-gray-200 mb-12">
                            Станьте специалистом по внедрению и настройке автономных систем управления
                            для медицинского бизнеса. Востребованная профессия будущего.
                        </p>

                        {/* What You'll Learn */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 mb-8"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <GraduationCap className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Чему вы научитесь</h2>
                            </div>
                            <ul className="space-y-3">
                                {skills.map((skill, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-200">
                                        <Star className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>{skill}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Program Details */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="grid md:grid-cols-2 gap-6 mb-8"
                        >
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
                                <Briefcase className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Формат обучения</h3>
                                <p className="text-gray-300">
                                    Онлайн-курс с практическими заданиями и реальными кейсами.
                                    Длительность: 2 месяца.
                                </p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
                                <Star className="w-8 h-8 text-primary mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Сертификация</h3>
                                <p className="text-gray-400">
                                    По окончании курса вы получите сертификат официального
                                    интегратора MarkVision AI.
                                </p>
                            </div>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="bg-gradient-to-r from-primary/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-primary/30 p-8 text-center"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">
                                Готовы начать карьеру интегратора?
                            </h3>
                            <p className="text-gray-200 mb-6">
                                Оставьте заявку, и мы свяжемся с вами для обсуждения деталей программы
                            </p>
                            <Button asChild size="lg" className="rounded-2xl px-8">
                                <a href="mailto:markvision@mail.ru?subject=Заявка на обучение - Интегратор">
                                    Оставить заявку
                                </a>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Careers;
