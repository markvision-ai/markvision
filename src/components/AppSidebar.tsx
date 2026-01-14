"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLabel,
  useSidebar,
} from "@/components/ui/aceternity-sidebar";
import {
  IconBrandTabler,
  IconAd2,
  IconVideo,
  IconUsers,
  IconCalendar,
  IconClipboardCheck,
  IconInbox,
  IconChartBar,
  IconWallet,
  IconSettings,
  IconUsersGroup,
  IconArrowLeft,
  IconActivity,
} from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Crown } from "lucide-react";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile?: { name: string | null; email: string | null } | null;
  realtimeStatus?: 'SUBSCRIBED' | 'CLOSED' | 'CONNECTING';
}

export const AppSidebar = ({ 
  activeTab, 
  onTabChange,
  userProfile,
  realtimeStatus = 'SUBSCRIBED'
}: AppSidebarProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    navigate("/auth");
  }, [navigate]);

  const handleNavigation = useCallback((tab: string, path: string) => {
    onTabChange(tab);
    navigate(path, { replace: true });
  }, [onTabChange, navigate]);

  const links = {
    dashboard: [
      {
        label: "Дашборд",
        href: "/",
        icon: <IconBrandTabler className="h-5 w-5 flex-shrink-0" />,
        tab: "dashboard",
      },
      {
        label: "Realtime",
        href: "/realtime",
        icon: <IconActivity className="h-5 w-5 flex-shrink-0" />,
        tab: "realtime",
      },
    ],
    marketing: [
      {
        label: "Quantum Ads",
        href: "/quantom-ads",
        icon: <IconAd2 className="h-5 w-5 flex-shrink-0" />,
        tab: "quantom-ads",
      },
      {
        label: "Content Factory",
        href: "/factory",
        icon: <IconVideo className="h-5 w-5 flex-shrink-0" />,
        tab: "factory",
      },
    ],
    sales: [
      {
        label: "CRM",
        href: "/crm",
        icon: <IconUsers className="h-5 w-5 flex-shrink-0" />,
        tab: "crm",
      },
      {
        label: "Календарь",
        href: "/calendar",
        icon: <IconCalendar className="h-5 w-5 flex-shrink-0" />,
        tab: "calendar",
      },
      {
        label: "Диагностика",
        href: "/diagnostics",
        icon: <IconClipboardCheck className="h-5 w-5 flex-shrink-0" />,
        tab: "diagnostics",
      },
      {
        label: "Inbox",
        href: "/inbox",
        icon: <IconInbox className="h-5 w-5 flex-shrink-0" />,
        tab: "inbox",
      },
    ],
    analytics: [
      {
        label: "Сквозная аналитика",
        href: "/e2e-analytics",
        icon: <IconChartBar className="h-5 w-5 flex-shrink-0" />,
        tab: "e2e-analytics",
      },
      {
        label: "Финансы (P&L)",
        href: "/finance",
        icon: <IconWallet className="h-5 w-5 flex-shrink-0" />,
        tab: "finance",
      },
    ],
    infrastructure: [
      {
        label: "Настройки",
        href: "/settings",
        icon: <IconSettings className="h-5 w-5 flex-shrink-0" />,
        tab: "settings",
      },
      {
        label: "Команда",
        href: "/team",
        icon: <IconUsersGroup className="h-5 w-5 flex-shrink-0" />,
        tab: "team",
      },
    ],
  };

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6 bg-[#0B0E14] border-r border-neutral-800/50">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <AnimatePresence>
            {open ? <Logo /> : <LogoIcon />}
          </AnimatePresence>

          {/* Realtime Indicator */}
          <div className="flex items-center gap-2 px-3 mt-4">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              realtimeStatus === 'SUBSCRIBED' ? "bg-green-500" : 
              realtimeStatus === 'CONNECTING' ? "bg-yellow-500" : "bg-red-500"
            )} />
            <motion.span
              animate={{
                display: open ? "inline-block" : "none",
                opacity: open ? 1 : 0,
              }}
              className="text-xs text-neutral-500"
            >
              {realtimeStatus === 'SUBSCRIBED' ? 'Live' : 
               realtimeStatus === 'CONNECTING' ? 'Connecting...' : 'Offline'}
            </motion.span>
          </div>

          {/* Navigation Groups */}
          <div className="mt-8 flex flex-col gap-1">
            <SidebarLabel label="Дашборд" />
            {links.dashboard.map((link) => (
              <SidebarLink
                key={link.tab}
                link={{
                  ...link,
                  onClick: () => handleNavigation(link.tab, link.href),
                }}
                isActive={activeTab === link.tab}
              />
            ))}

            <SidebarLabel label="Маркетинг" />
            {links.marketing.map((link) => (
              <SidebarLink
                key={link.tab}
                link={{
                  ...link,
                  onClick: () => handleNavigation(link.tab, link.href),
                }}
                isActive={activeTab === link.tab}
              />
            ))}

            <SidebarLabel label="Продажи" />
            {links.sales.map((link) => (
              <SidebarLink
                key={link.tab}
                link={{
                  ...link,
                  onClick: () => handleNavigation(link.tab, link.href),
                }}
                isActive={activeTab === link.tab}
              />
            ))}

            <SidebarLabel label="Аналитика" />
            {links.analytics.map((link) => (
              <SidebarLink
                key={link.tab}
                link={{
                  ...link,
                  onClick: () => handleNavigation(link.tab, link.href),
                }}
                isActive={activeTab === link.tab}
              />
            ))}

            <SidebarLabel label="Инфраструктура" />
            {links.infrastructure.map((link) => (
              <SidebarLink
                key={link.tab}
                link={{
                  ...link,
                  onClick: () => handleNavigation(link.tab, link.href),
                }}
                isActive={activeTab === link.tab}
              />
            ))}
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-neutral-800/50 pt-4">
          <SidebarLink
            link={{
              label: userProfile?.name || "Пользователь",
              href: "#",
              icon: (
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {userProfile?.name?.charAt(0).toUpperCase() || 
                   userProfile?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              ),
            }}
          />
          <SidebarLink
            link={{
              label: "Выйти",
              href: "#",
              icon: <IconArrowLeft className="h-5 w-5 flex-shrink-0 text-neutral-400" />,
              onClick: handleLogout,
            }}
            className="hover:bg-red-500/10 hover:text-red-400"
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
};

const Logo = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold flex items-center gap-3 text-sm text-white py-1 relative z-20 px-2"
    >
      <div className="h-9 w-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold text-base">
          MarkVision AI
        </span>
        <span className="text-[10px] text-neutral-500 font-normal">
          Умный маркетинг
        </span>
      </div>
    </motion.div>
  );
};

const LogoIcon = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold flex items-center gap-2 text-sm text-white py-1 relative z-20 px-2"
    >
      <div className="h-9 w-9 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
    </motion.div>
  );
};

export default AppSidebar;
