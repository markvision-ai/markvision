"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AuroraText } from "@/components/ui/aurora-text";
import { 
  Instagram, 
  Send, 
  Youtube, 
  Phone, 
  Mail,
  ExternalLink
} from "lucide-react";

const platformLinks = [
  { name: "Главная панель", href: "/dashboard" },
  { name: "База пациентов (CRM)", href: "/crm" },
  { name: "Сквозная аналитика", href: "/e2e-analytics" },
  { name: "Центр контента", href: "/factory" },
];

const ecosystemLinks = [
  { name: "Стать партнером", href: "/partners", badge: "Для фрилансеров" },
  { name: "Корпоративное обучение", href: "/training", badge: "Для владельцев" },
  { name: "Профессия: Интегратор", href: "/careers", badge: "Новая профессия" },
];

const resourceLinks = [
  { name: "Блог", href: "/blog" },
  { name: "Карьера", href: "/careers" },
  { name: "База знаний", href: "/knowledge" },
];

const legalLinks = [
  { name: "Политика конфиденциальности", href: "/privacy" },
  { name: "Пользовательское соглашение", href: "/terms" },
  { name: "Соответствие Закону РК", href: "/compliance" },
];

const socialLinks = [
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/markvision.ai" },
  { name: "Telegram", icon: Send, href: "https://t.me/markvision_ai" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/@markvision" },
  { name: "TikTok", icon: ExternalLink, href: "https://tiktok.com/@markvision.ai" },
];

export const Footer = () => {
  return (
    <footer className="relative bg-slate-50/80 backdrop-blur-xl border-t border-slate-200/50">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Column 1: Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-lg">
                <AuroraText colors={["#3b82f6", "#06b6d4", "#6366f1", "#3b82f6"]}>
                  MarkVision AI
                </AuroraText>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Первая автономная система управления прибылью для медицинского бизнеса. Наследие, созданное для будущего.
            </p>
          </div>

          {/* Column 2: Platform */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Платформа
            </h4>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-500 hover:text-blue-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Ecosystem */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Экосистема
            </h4>
            <ul className="space-y-3">
              {ecosystemLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-2"
                  >
                    {link.name}
                    {link.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Ресурсы
            </h4>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-500 hover:text-blue-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">
              Юридическая информация
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-slate-500 hover:text-blue-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200/70" />

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-500">
            <a 
              href="tel:+77472842595" 
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              +7 747 284 2595
            </a>
            <a 
              href="mailto:markvision@mail.ru" 
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-4 h-4" />
              markvision@mail.ru
            </a>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
                aria-label={social.name}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-slate-400 text-center md:text-right">
            © 2026 MarkVision AI. Сделано с любовью для будущего.
          </p>
        </div>
      </div>
    </footer>
  );
};
