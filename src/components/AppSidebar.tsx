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
  userId?: string;
  systemHasErrors?: boolean;
  onForceLoadProject?: () => void; // NEW: Force load for super admin
}

// Super admin UIDs - these users should be in user_roles table with super_admin role
const SUPER_ADMIN_UIDS = [
  'd94043b0-1c76-4017-84de-df0dbf00a2c9',
  '71d54527-0eb1-461b-a51a-a49905c0c92e'
];

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
  userId,
  systemHasErrors = false,
  onForceLoadProject,
}: AppSidebarProps) => {
  const isSuperAdmin = userId ? SUPER_ADMIN_UIDS.includes(userId) : false;
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
      {
        label: "CRM",
        href: "/crm",
        icon: <IconUsers className="h-5 w-5 flex-shrink-0" />,
        tab: "crm",
      },
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
      {
        label: "ИИ-РОП",
        href: "/rop",
        icon: <IconShieldCheck className="h-5 w-5 flex-shrink-0" />,
        tab: "rop",
      },
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
        <SidebarBody className="justify-between gap-4 bg-sidebar/40 backdrop-blur-xl border-r border-sidebar-border/[0.05] h-screen sticky top-0 shadow-2xl transition-all duration-500">
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
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="border-t border-border/10 pt-4">
            <SidebarLink
              link={{
                label: userProfile?.name || "Профиль",
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center text-white text-sm font-medium">
                    {userProfile?.name?.charAt(0).toUpperCase() ||
                      userProfile?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                ),
              }}
            />
            <div className="px-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="w-full h-9 gap-2 rounded-xl border-border/10 hover:bg-white/5"
              >
                {theme === 'dark' ? (
                  <>
                    <IconSun className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs">Светлая тема</span>
                  </>
                ) : (
                  <>
                    <IconMoon className="w-4 h-4 text-blue-500" />
                    <span className="text-xs">Тёмная тема</span>
                  </>
                )}
              </Button>
            </div>
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

      {/* Create Project Dialog - still kept for Header access if needed via logic, but UI hidden from Sidebar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-background border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Создать новый проект</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название проекта (медицинская клиника)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="interstellar-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/10 hover:bg-white/5">
              Отмена
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()}>
              {isCreating ? "Создание..." : "Создать"}
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
      className="font-bold flex items-center gap-3 text-sm text-sidebar-foreground py-1 relative z-20 px-2"
    >
      <div className="relative">
        <MarkVisionLogo size={36} />
        {/* Global Health Indicator */}
        <div className={cn(
          "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
          hasErrors ? "bg-red-500" : "bg-green-500"
        )}>
          {!hasErrors && (
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          )}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent font-bold text-base">
          MarkVision AI
        </span>
        <span className="text-xs font-medium text-sidebar-foreground/70 leading-relaxed">
          Умный маркетинг
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
      className="font-bold flex items-center gap-2 text-sm text-sidebar-foreground py-1 relative z-20 px-2"
    >
      <div className="relative">
        <MarkVisionLogo size={36} />
        {/* Global Health Indicator */}
        <div className={cn(
          "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-sidebar",
          hasErrors ? "bg-red-500" : "bg-green-500"
        )}>
          {!hasErrors && (
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AppSidebar;
