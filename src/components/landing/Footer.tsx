"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuroraText } from "@/components/ui/aurora-text";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";
import { Instagram, Send, Youtube, Phone, Mail } from "lucide-react";
import { IconBrandTiktok } from "@tabler/icons-react";
const platformLinks = [{
  name: "Главная панель",
  href: "/dashboard"
}, {
  name: "CRM",
  href: "/crm"
}, {
  name: "Сквозная аналитика",
  href: "/e2e-analytics"
}, {
  name: "Центр контента",
  href: "/factory"
}];
const ecosystemLinks = [{
  name: "Стать партнером",
  href: "/partners",
  badge: "Для фрилансеров"
}, {
  name: "Корпоративное обучение",
  href: "/training",
  badge: "Для владельцев"
}, {
  name: "Профессия: Интегратор",
  href: "/careers",
  badge: "Новая профессия"
}];
const resourceLinks = [{
  name: "Блог",
  href: "/blog"
}, {
  name: "Карьера",
  href: "/careers"
}, {
  name: "База знаний",
  href: "/knowledge"
}];
const legalLinks = [{
  name: "Политика конфиденциальности",
  href: "/privacy"
}, {
  name: "Пользовательское соглашение",
  href: "/terms"
}, {
  name: "Соответствие Закону РК",
  href: "/compliance"
}];
const socialLinks = [{
  name: "Instagram",
  icon: Instagram,
  href: "https://instagram.com/markvision.ai"
}, {
  name: "Telegram",
  icon: Send,
  href: "https://t.me/markvision_ai"
}, {
  name: "YouTube",
  icon: Youtube,
  href: "https://youtube.com/@markvision"
}, {
  name: "TikTok",
  icon: IconBrandTiktok,
  href: "https://tiktok.com/@markvision.ai"
}];
export const Footer = () => {
  return <footer className="relative bg-slate-100 border-t border-slate-200">
    {/* Main Footer Content */}
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
      {/* Desktop: 2-column grid, Mobile: stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

        {/* Left Side: Brand (full width on mobile, 4 cols on desktop) */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <MarkVisionLogo className="w-full h-full drop-shadow-lg" />
            </div>
            <span className="font-semibold text-xl">
              <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>
                MarkVision AI
              </AuroraText>
            </span>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
            Первая автономная система управления прибылью для медицинского бизнеса. Наследие, созданное для будущего.
          </p>
        </div>

        {/* Right Side: 4 columns of links (8 cols on desktop) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Column 1: Platform */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-wider">
                Платформа
              </h4>
              <ul className="space-y-2.5">
                {platformLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>)}
              </ul>
            </div>

            {/* Column 2: Ecosystem */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-wider">
                Экосистема
              </h4>
              <ul className="space-y-2.5">
                {ecosystemLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex flex-wrap items-center gap-1.5">
                    <span>{link.name}</span>
                    {link.badge && <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium whitespace-nowrap">
                      {link.badge}
                    </span>}
                  </Link>
                </li>)}
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-wider">
                Ресурсы
              </h4>
              <ul className="space-y-2.5">
                {resourceLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>)}
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-xs uppercase tracking-wider">
                Юридическое
              </h4>
              <ul className="space-y-2.5">
                {legalLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Divider */}
    <div className="border-t border-border" />

    {/* Bottom Bar */}
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Contact Info */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-muted-foreground">
          <a href="tel:+77472842595" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            <span>+7 747 284 2595</span>
          </a>
          <a href="mailto:markvision@mail.ru" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Mail className="w-4 h-4" />
            <span>markvision@mail.ru</span>
          </a>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-3">
          {socialLinks.map(social => <motion.a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.95
          }} className="w-9 h-9 rounded-full bg-muted hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary transition-all" aria-label={social.name}>
            <social.icon className="w-4 h-4" />
          </motion.a>)}
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center sm:text-right">
          © 2025 MarkVision AI
        </p>
      </div>
    </div>
  </footer>;
};