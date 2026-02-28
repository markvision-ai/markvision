"use client";
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLabel,
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
  IconUsersGroup,
  IconArrowLeft,
  IconActivity,
  IconTable,
  IconFlask,
  IconTrophy,
  IconTarget,
  IconReport,
  IconPlugConnected,
  IconUserCircle,
  IconShieldCheck,
  IconBook,
  IconShield,
  IconHeartbeat,
  IconHelp,
  IconChevronDown,
  IconPlus,
  IconCheck,
  IconSettings,
  IconRobot,
  IconBuildingSkyscraper,
} from "@tabler/icons-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { IconSun, IconMoon } from "@tabler/icons-react";

interface Project {
  id: string;
  name: string;
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile?: { name: string | null; email: string | null } | null;
  realtimeStatus?: 'SUBSCRIBED' | 'CLOSED' | 'CONNECTING';
  projects?: Project[];
  currentProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
  onCreateProject?: (name: string) => Promise<{ id: string; name: string } | null>;
  onDeleteProject?: (projectId: string) => Promise<void> | Promise<boolean>;
  isSuperAdmin?: boolean;
  systemHasErrors?: boolean;
  onForceLoadProject?: () => void; // NEW: Force load for super admin
}

export const AppSidebar = ({
  activeTab,
  onTabChange,
  userProfile,
  realtimeStatus = 'SUBSCRIBED',
  projects = [],
  currentProjectId,
  onProjectChange,
  onCreateProject,
  onDeleteProject,
  isSuperAdmin = false,
  systemHasErrors = false,
  onForceLoadProject,
}: AppSidebarProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    navigate("/auth");
  }, [navigate]);

  const handleNavigation = useCallback((tab: string, path: string) => {
    onTabChange(tab);
    navigate(path, { replace: true });
  }, [onTabChange, navigate]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !onCreateProject) return;
    setIsCreating(true);
    try {
      const result = await onCreateProject(newProjectName.trim());
      if (result) {
        toast.success("Проект создан!");
        setNewProjectName("");
        setIsCreateDialogOpen(false);
      }
    } catch (e) {
      toast.error("Ошибка создания проекта");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !onDeleteProject) return;
    try {
      await onDeleteProject(projectToDelete.id);
      toast.success("Проект удалён");
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      toast.error("Ошибка удаления проекта");
    }
  };

  const links = {
    dashboard: [
      {
        label: "Главная панель",
        href: "/dashboard",
        icon: <IconBrandTabler className="h-5 w-5 flex-shrink-0" />,
        tab: "dashboard",
      },
      {
        label: "Агентские кабинеты",
        href: "/agency-accounts",
        icon: <IconBuildingSkyscraper className="h-5 w-5 flex-shrink-0" />,
        tab: "agency-accounts",
      },
      {
        label: "Живая лента",
        href: "/realtime",
        icon: <IconActivity className="h-5 w-5 flex-shrink-0" />,
        tab: "realtime",
      },
      {
        label: "Таблица показателей",
        href: "/table",
        icon: <IconTable className="h-5 w-5 flex-shrink-0" />,
        tab: "table",
      },
    ],
    marketing: [
      {
        label: "Управление рекламой",
        href: "/quantum-ads",
        icon: <IconAd2 className="h-5 w-5 flex-shrink-0" />,
        tab: "quantom-ads",
      },
      {
        label: "A/B Оптимизатор",
        href: "/ab-tests",
        icon: <IconFlask className="h-5 w-5 flex-shrink-0" />,
        tab: "ab-testing",
      },
      {
        label: "Центр контента",
        href: "/content-factory",
        icon: <IconVideo className="h-5 w-5 flex-shrink-0" />,
        tab: "factory",
      },
      {
        label: "Публикации",
        href: "/publications",
        icon: <IconTable className="h-5 w-5 flex-shrink-0" />,
        tab: "publications",
      },
    ],
    sales: [
      //   tab: "crm",
      // },
      {
        label: "Диагностика",
        href: "/visits",
        icon: <IconClipboardCheck className="h-5 w-5 flex-shrink-0" />,
        tab: "visits",
      },
      {
        label: "Входящие",
        href: "/inbox",
        icon: <IconInbox className="h-5 w-5 flex-shrink-0" />,
        tab: "inbox",
      },
      {
        label: "Рейтинг заявок",
        href: "/scoring",
        icon: <IconTarget className="h-5 w-5 flex-shrink-0" />,
        tab: "scoring",
      },
      {
        label: "ИИ-РОП",
        href: "/rop",
        icon: <IconShieldCheck className="h-5 w-5 flex-shrink-0" />,
        tab: "rop",
      },
      {
        label: "ИИ Агенты",
        href: "/agents",
        icon: <IconRobot className="h-5 w-5 flex-shrink-0" />,
        tab: "agents",
      },
    ],
    analytics: [
      {
        label: "Сквозная аналитика",
        href: "/analytics",
        icon: <IconChartBar className="h-5 w-5 flex-shrink-0" />,
        tab: "e2e-analytics",
      },
      {
        label: "Финансы и прибыль",
        href: "/finance",
        icon: <IconWallet className="h-5 w-5 flex-shrink-0" />,
        tab: "finance",
      },
      {
        label: "Отчёты",
        href: "/reports",
        icon: <IconReport className="h-5 w-5 flex-shrink-0" />,
        tab: "reports",
      },
    ],
    settings: [
      {
        label: "Настройки",
        href: "/settings",
        icon: <IconSettings className="h-5 w-5 flex-shrink-0" />,
        tab: "settings",
      },
    ],
  };

  return (
    <>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4 bg-[#020617]/40 backdrop-blur-3xl border-r border-white/5 h-screen sticky top-0 shadow-interstellar transition-all duration-500">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden -mx-2 px-2">
            {/* Logo */}
            <AnimatePresence>
              {open ? <Logo hasErrors={systemHasErrors} /> : <LogoIcon hasErrors={systemHasErrors} />}
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
                className="text-sm font-medium text-sidebar-foreground/70"
              >
                {realtimeStatus === 'SUBSCRIBED' ? 'Подключено' :
                  realtimeStatus === 'CONNECTING' ? 'Подключение...' : 'Офлайн'}
              </motion.span>
            </div>

            {/* Navigation Groups */}
            <div className="mt-6 flex flex-col gap-1">
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



              <SidebarLabel label="Настройки" />
              {links.settings.map((link) => (
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
          <div className="border-t border-white/10 pt-4">
            <SidebarLink
              link={{
                label: userProfile?.name || "Профиль",
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-lime-500 flex items-center justify-center text-white text-sm font-medium">
                    {userProfile?.name?.charAt(0).toUpperCase() ||
                      userProfile?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                ),
              }}
            />
            {/* Theme Toggle Removed - Enforced Light Mode */}
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

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#020617]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-interstellar text-white max-w-md">
          <DialogHeader className="px-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-widest text-white">
              Инициализировать архитектуру
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 px-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Название проекта / Домен</Label>
            <Input
              placeholder="Медицинская клиника Альянс"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="interstellar-input h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <DialogFooter className="px-2 pb-2">
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-2xl h-14 uppercase text-[10px] font-black tracking-[0.2em] text-white/40 hover:bg-white/5">
              Отмена
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !newProjectName.trim()}
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-10 uppercase text-[10px] font-black tracking-[0.2em] shadow-interstellar"
            >
              {isCreating ? "Синхронизация..." : "Развернуть"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface LogoProps {
  hasErrors?: boolean;
}

const Logo = ({ hasErrors }: LogoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold flex items-center gap-4 text-sm text-sidebar-foreground py-4 relative z-20 px-4"
    >
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-1000" />
        <MarkVisionLogo size={42} />
        {/* Global Health Indicator */}
        <div className={cn(
          "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020617] shadow-lg",
          hasErrors ? "bg-red-500 shadow-red-500/50" : "bg-primary shadow-primary/50"
        )}>
          {!hasErrors && (
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black text-white uppercase tracking-[0.2em]">
          MARK<span className="text-primary italic">VISION</span>
        </span>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-0.5">
          Neural OS
        </span>
      </div>
    </motion.div>
  );
};

const LogoIcon = ({ hasErrors }: LogoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-bold flex items-center gap-2 text-sm text-sidebar-foreground py-2 relative z-20 px-4"
    >
      <div className="relative group">
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur-xl group-hover:opacity-100 opacity-50 transition-all duration-1000" />
        <MarkVisionLogo size={36} />
        {/* Global Health Indicator */}
        <div className={cn(
          "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#020617]",
          hasErrors ? "bg-red-500 shadow-red-500/50" : "bg-primary shadow-primary/50"
        )}>
          {!hasErrors && (
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AppSidebar;
