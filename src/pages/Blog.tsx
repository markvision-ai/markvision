import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, TrendingUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";

const blogPosts = [
    {
        icon: <TrendingUp className="w-6 h-6" />,
        title: "Как увеличить конверсию клиники на 40%",
        description: "Практические советы по оптимизации воронки продаж в медицинском бизнесе",
        date: "15 февраля 2025"
    },
    {
        icon: <Lightbulb className="w-6 h-6" />,
        title: "AI в медицинском маркетинге",
        description: "Как искусственный интеллект меняет подход к привлечению пациентов",
        date: "10 февраля 2025"
    },
    {
        icon: <BookOpen className="w-6 h-6" />,
        title: "Автоматизация CRM: с чего начать",
        description: "Пошаговое руководство по внедрению автоматизации в клинике",
        date: "5 февраля 2025"
    }
];

const Blog = () => {
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
                            <span className="text-sm font-medium text-primary">Блог</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Блог MarkVision AI
                        </h1>

                        <p className="text-xl text-gray-300 mb-12">
                            Статьи, кейсы и экспертные материалы о маркетинге, автоматизации
                            и управлении медицинским бизнесом.
                        </p>

                        {/* Blog Posts Grid */}
                        <div className="space-y-6 mb-12">
                            {blogPosts.map((post, index) => (
                                <motion.article
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 hover:border-primary/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-6">
                                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                            {post.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                                            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                                                {post.title}
                                            </h2>
                                            <p className="text-gray-400 leading-relaxed">
                                                {post.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>

                        {/* Coming Soon Notice */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                            className="bg-gradient-to-r from-primary/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-primary/20 p-8 text-center"
                        >
                            <h3 className="text-xl font-semibold text-white mb-3">
                                Больше статей скоро появится
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Подпишитесь на нашу рассылку, чтобы не пропустить новые материалы
                            </p>
                            <Button asChild size="lg" className="rounded-2xl px-8">
                                <a href="mailto:markvision@mail.ru?subject=Подписка на блог">
                                    Подписаться
                                </a>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Blog;
