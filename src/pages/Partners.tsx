import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Briefcase, DollarSign, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";

const Partners = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Комиссия до 30%",
      description: "Получайте вознаграждение за каждого привлеченного клиента",
    },
    {
      icon: Briefcase,
      title: "Обучение и поддержка",
      description: "Полный курс по продукту и маркетинговые материалы",
    },
    {
      icon: Award,
      title: "Сертификация",
      description: "Официальный статус партнера MarkVision AI",
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
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full mb-6">
              <Users className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Партнерская программа</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
              Стань партнером <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>MarkVision AI</AuroraText>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Для маркетологов, фрилансеров и агентств. Зарабатывайте вместе с нами, помогая клиникам расти.
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-2xl border border-border shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl"
          >
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Регистрация скоро откроется
            </h3>
            <p className="text-muted-foreground mb-6">
              Оставьте заявку, и мы свяжемся с вами первыми
            </p>
            <Button asChild size="lg" className="rounded-2xl px-8">
              <Link to="/">Вернуться на главную</Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Partners;
