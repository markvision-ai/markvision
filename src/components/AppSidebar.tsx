"use client";
import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MarkVisionLogo } from "@/components/ui/MarkVisionLogo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Table2,
  Megaphone,
  FlaskConical,
  Factory,
  FileText,
  Users,
  ClipboardCheck,
  Inbox,
  Target,
  ShieldCheck,
  Bot,
  BarChart3,
  Wallet,
  FileSpreadsheet,
  Building2,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Plus,
  Trash2,
  Menu,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onForceLoadProject?: () => void;
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

  const menuGroups = [
    {
      label: "Дашборд",
      items: [
        { label: "Главная панель", id: "dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Живая лента", id: "realtime", icon: Activity, path: "/realtime" },
        { label: "Таблица", id: "table", icon: Table2, path: "/table" },
      ]
    },
    {
      label: "Маркетинг",
      items: [
        { label: "Реклама", id: "quantom-ads", icon: Megaphone, path: "/quantum-ads" },
        { label: "A/B Тесты", id: "ab-testing", icon: FlaskConical, path: "/ab-tests" },
        { label: "Контент", id: "factory", icon: Factory, path: "/content-factory" },
        { label: "Публикации", id: "publications", icon: FileText, path: "/publications" },
      ]
    },
    {
      label: "Продажи",
      items: [
        { label: "CRM", id: "crm", icon: Users, path: "/crm" },
        { label: "Диагностика", id: "visits", icon: ClipboardCheck, path: "/visits" },
        { label: "Входящие", id: "inbox", icon: Inbox, path: "/inbox" },
        { label: "Скорринг", id: "scoring", icon: Target, path: "/scoring" },
        { label: "ИИ-РОП", id: "rop", icon: ShieldCheck, path: "/rop" },
        { label: "Агенты", id: "agents", icon: Bot, path: "/agents" },
      ]
    },
    {
      label: "Аналитика",
      items: [
        { label: "Сквозная", id: "e2e-analytics", icon: BarChart3, path: "/analytics" },
        { label: "Финансы", id: "finance", icon: Wallet, path: "/finance" },
        { label: "Отчёты", id: "reports", icon: FileSpreadsheet, path: "/reports" },
        { label: "Агентство", id: "agency", icon: Building2, path: "/agency" },
      ]
    },
    {
      label: "Система",
      items: [
        { label: "Настройки", id: "settings", icon: Settings, path: "/settings" },
      ]
    }
  ];

  return (
    <>
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-sidebar border-r border-border">
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border bg-sidebar">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MarkVisionLogo size={32} />
              <div className={cn(
                "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-sidebar",
                systemHasErrors ? "bg-red-500" : "bg-green-500"
              )} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">MarkVision</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Enterprise</span>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div className="px-4 py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between h-10 px-3 bg-background border-border hover:bg-muted text-foreground font-medium rounded-lg">
                <span className="truncate">{currentProject?.name || "Выберите проект"}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {projects.map(p => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onProjectChange?.(p.id)}
                  className="justify-between cursor-pointer"
                >
                  <span className="truncate">{p.name}</span>
                  {isSuperAdmin && (
                    <Trash2
                      className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p);
                        setIsDeleteDialogOpen(true);
                      }}
                    />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)} className="cursor-pointer text-primary font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Создать проект
              </DropdownMenuItem>
              {isSuperAdmin && onForceLoadProject && (
                <DropdownMenuItem onClick={onForceLoadProject} className="cursor-pointer text-orange-500">
                  <Activity className="h-4 w-4 mr-2" />
                  Force Reload
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-6">
            {menuGroups.map((group, idx) => (
              <div key={idx}>
                <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h4>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigation(item.id, item.path)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/70")} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-border bg-sidebar">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {userProfile?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{userProfile?.name || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{userProfile?.email}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="flex-1 h-8 text-xs text-muted-foreground">
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />}
              Тема
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1 h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()}>
              {isCreating ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppSidebar;
