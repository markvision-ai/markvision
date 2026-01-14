import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

const Blog = () => {
  const upcomingPosts = [
    {
      title: "Как увеличить конверсию клиники на 40% с помощью ИИ",
      category: "Маркетинг",
      readTime: "5 мин",
      icon: TrendingUp,
    },
    {
      title: "5 ошибок в SMM медицинских клиник",
      category: "Контент",
      readTime: "7 мин",
      icon: FileText,
    },
    {
      title: "Автоматизация записи пациентов: полный гайд",
      category: "Автоматизация",
      readTime: "10 мин",
      icon: Clock,
    },
  ];

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
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Блог MarkVision</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Скоро здесь появятся статьи
            </h1>
            
            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto">
              Мы готовим полезный контент о маркетинге, автоматизации и развитии медицинского бизнеса.
            </p>
          </motion.div>

          {/* Preview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            {upcomingPosts.map((post, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <post.icon className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  {post.category}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mt-2 mb-3">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-400">{post.readTime} чтения</p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16"
          >
            <Button asChild size="lg" className="rounded-2xl px-8">
              <Link to="/">Вернуться на главную</Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
