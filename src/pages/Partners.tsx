import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Zap, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";

const benefits = [
    {
        icon: <TrendingUp className="w-6 h-6" />,
        title: "Высокий доход",
        description: "Получайте до 30% от каждой продажи и рекуррентные платежи"
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Поддержка команды",
        description: "Полная техническая и маркетинговая поддержка от нашей команды"
    },
    {
        icon: <Zap className="w-6 h-6" />,
        title: "Готовые материалы",
        description: "Презентации, кейсы и обучающие материалы для ваших клиентов"
    }
];

const Partners = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
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
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Для фрилансеров</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Станьте партнером MarkVision AI
                        </h1>

                        <p className="text-xl text-gray-200 mb-12 max-w-3xl">
                            Присоединяйтесь к нашей партнерской программе и помогайте медицинским клиникам
                            автоматизировать их бизнес, получая стабильный доход.
                        </p>

                        {/* Benefits Grid */}
                        <div className="grid md:grid-cols-3 gap-6 mb-12">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                                    className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-primary/30 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                                    <p className="text-gray-300">{benefit.description}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Requirements */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6">Требования к партнерам</h2>
                            <ul className="space-y-3">
                                {[
                                    "Опыт работы с медицинскими клиниками или в сфере B2B продаж",
                                    "Понимание основ маркетинга и аналитики",
                                    "Готовность пройти обучение по работе с платформой",
                                    "Активная позиция и нацеленность на результат"
                                ].map((req, index) => (
                                    <li key={index} className="flex items-start gap-3 text-gray-200">
                                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span>{req}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.4 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Button asChild size="lg" className="rounded-2xl px-8">
                                <a href="mailto:markvision@mail.ru?subject=Заявка на партнерство">
                                    Подать заявку
                                </a>
                            </Button>
                            <Button asChild size="lg" variant="outline" className="rounded-2xl px-8">
                                <Link to="/">Узнать больше</Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Partners;
