import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Briefcase, Rocket, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

const Careers = () => {
  const values = [
    {
      icon: Rocket,
      title: "Инновации",
      description: "Работаем на переднем крае ИИ-технологий",
    },
    {
      icon: Heart,
      title: "Миссия",
      description: "Помогаем медицинскому бизнесу расти",
    },
    {
      icon: Globe,
      title: "Удаленка",
      description: "Работайте откуда угодно",
    },
  ];

  const openPositions = [
    {
      title: "Интегратор MarkVision",
      type: "Новая профессия",
      location: "Удаленно",
      description: "Станьте экспертом по внедрению системы MarkVision в клиники",
    },
    {
      title: "Frontend Developer",
      type: "Разработка",
      location: "Удаленно",
      description: "React, TypeScript, современный стек",
    },
    {
      title: "AI/ML Engineer",
      type: "Разработка",
      location: "Удаленно",
      description: "Разработка ИИ-моделей для автоматизации",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
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
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Карьера в MarkVision</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Создавай будущее медтеха
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Мы ищем талантливых людей, которые разделяют нашу миссию — автоматизировать медицинский бизнес с помощью ИИ
            </p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            {values.map((value, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Open Positions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Открытые позиции
            </h2>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <div
                  key={index}
                  className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-70"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {position.title}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                        {position.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{position.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">{position.location}</p>
                  </div>
                  <Button variant="outline" className="rounded-xl" disabled>
                    Скоро
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 text-center"
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

export default Careers;
