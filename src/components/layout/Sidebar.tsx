import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import markvisionLogo from '@/assets/markvision-logo.png';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  Users,
  FileSpreadsheet,
  HelpCircle,
  ChevronDown,
  Plus,
  Folder,
  Zap,
  Menu,
  Plug,
  Kanban,
  LogOut,
  Shield,
  Factory,
  Megaphone,
  Sparkles,
  UserCog,
  BookOpen,
  Wallet,
  Inbox,
  FlameKindling,
  Trophy,
  FlaskConical,
  Activity,
  Compass,
  Trash2,
  MoreVertical,
  BarChart3,
  ShoppingCart,
  ClipboardCheck,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentProject?: string;
  projects?: { id: string; name: string; owner_id?: string }[];
  onProjectChange?: (projectId: string) => void;
  onStartOnboarding?: () => void;
  onDeleteProject?: (projectId: string) => Promise<boolean>;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  userProfile?: { name: string | null; email: string | null } | null;
  onForceLoadProject?: () => void; // NEW: Force load for super admin
}

// New 5-group structure with full Russian localization
const menuGroups = [
  {
    id: 'dashboard-group',
    label: 'ПАНЕЛЬ УПРАВЛЕНИЯ',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'Главная панель', icon: LayoutDashboard },
      { id: 'realtime', label: 'Живая лента', icon: Activity },
      { id: 'table', label: 'Таблица показателей', icon: CalendarDays },
    ]
  },
  {
    id: 'marketing-group',
    label: 'МАРКЕТИНГ',
    icon: Megaphone,
    items: [
      { id: 'quantom-ads', label: 'Управление рекламой', icon: Megaphone },
      { id: 'ab-testing', label: 'A/B Оптимизатор', icon: FlaskConical },
      { id: 'factory', label: 'Центр контента', icon: Factory },
    ]
  },
  {
    id: 'sales-group',
    label: 'ПРОДАЖИ',
    icon: ShoppingCart,
    items: [
      { id: 'crm', label: 'CRM', icon: Kanban },
      { id: 'visits', label: 'Диагностика', icon: ClipboardCheck },
      { id: 'inbox', label: 'Входящие', icon: Inbox },
      { id: 'scoring', label: 'Рейтинг заявок', icon: FlameKindling },
    ]
  },
  {
    id: 'analytics-group',
    label: 'АНАЛИТИКА',
    icon: BarChart3,
    items: [
      { id: 'e2e-analytics', label: 'Сквозная аналитика', icon: Zap },
      { id: 'finance', label: 'Финансы и прибыль', icon: Wallet },
      { id: 'reports', label: 'Отчёты', icon: FileSpreadsheet },
    ]
  },
  {
    id: 'infrastructure-group',
    label: 'НАСТРОЙКИ',
    icon: Settings,
    items: [
      { id: 'settings', label: 'Настройки', icon: Settings },
      { id: 'audit', label: 'Аудит', icon: Shield, adminOnly: true },
      { id: 'health', label: 'Состояние системы', icon: Activity },
      { id: 'help', label: 'Помощь', icon: HelpCircle },
    ]
  },
];

export const Sidebar = ({
  activeTab,
  onTabChange,
  currentProject = 'default',
  projects = [],
  onProjectChange,
  onStartOnboarding,
  onDeleteProject,
  isMobileOpen = false,
  onMobileClose,
  userProfile,
  onForceLoadProject
}: SidebarProps) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    // Open the group that contains the active tab by default
    const activeGroup = menuGroups.find(group =>
      group.items.some(item => item.id === activeTab)
    );
    return activeGroup ? [activeGroup.id] : ['dashboard-group'];
  });
  const { isAdmin, isSuperAdmin, user } = useAuth();

  const currentProjectData = projects.find(p => p.id === currentProject);
  const displayProjectName = currentProjectData?.name ||
    (isSuperAdmin ? 'MARKVISION ГЛОБАЛ' :
      (projects.length > 0 ? projects[0].name : 'Выберите проект'));

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Log logout event
  const logLogoutEvent = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        user_email: user.email || null,
        action: 'logout',
        entity_type: 'session',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      }]);
    } catch (error) {
      console.error('Failed to log logout event:', error);
    }
  }, [user]);

  const handleStartOnboarding = () => {
    setIsProjectDropdownOpen(false);
    onStartOnboarding?.();
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !onDeleteProject) return;

    setIsDeleting(true);
    const success = await onDeleteProject(projectToDelete.id);
    setIsDeleting(false);

    if (success) {
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (project: { id: string; name: string }) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
    setIsProjectDropdownOpen(false);
  };

  const canDeleteProject = (project: { id: string; owner_id?: string }) => {
    return isAdmin || isSuperAdmin || project.owner_id === user?.id;
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onMobileClose?.();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-2 border-b border-sidebar-muted">
        <div className="flex items-center gap-2">
          <div className="relative h-12 w-12 md:h-14 md:w-14 flex items-center justify-center overflow-hidden rounded-lg">
            <img src={markvisionLogo} alt="MarkVision AI" className="h-full w-full object-contain scale-125" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent truncate">
            MarkVision AI
          </span>
        </div>
      </div>

      {/* Project Selector */}
      <div className="p-3 md:p-4 border-b border-sidebar-muted">
        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-sidebar-muted rounded-lg hover:bg-sidebar-muted/80 transition-colors"
          >
            <Folder className="w-4 h-4 text-primary" />
            <span className="flex-1 text-left text-sm font-medium truncate">
              {displayProjectName}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-sidebar-muted rounded-lg shadow-lg overflow-hidden z-50">
              {projects.length === 0 ? (
                <div className="px-3 py-4 space-y-3">
                  <p className="text-center text-sm text-sidebar-foreground/60">
                    Нет проектов
                  </p>
                  {/* FORCE LOAD BUTTON for super admin */}
                  {isSuperAdmin && onForceLoadProject && (
                    <button
                      onClick={() => {
                        onForceLoadProject();
                        setIsProjectDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      FORCE LOAD PROJECT
                    </button>
                  )}
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${currentProject === project.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-sidebar-foreground/10'
                      }`}
                  >
                    <button
                      onClick={() => {
                        onProjectChange?.(project.id);
                        setIsProjectDropdownOpen(false);
                      }}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <Folder className="w-4 h-4" />
                      <span className="truncate">{project.name}</span>
                    </button>
                    {canDeleteProject(project) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`p-1 rounded hover:bg-sidebar-foreground/20 transition-colors ${currentProject === project.id
                                ? 'text-primary-foreground/70 hover:text-primary-foreground'
                                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
                              }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(project)}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))
              )}
              <button
                onClick={handleStartOnboarding}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-primary hover:bg-sidebar-foreground/10 border-t border-sidebar-foreground/10"
              >
                <Plus className="w-4 h-4" />
                <span>Создать проект</span>
              </button>
              {/* Force load button at bottom for super admin even when projects exist */}
              {isSuperAdmin && onForceLoadProject && projects.length > 0 && (
                <button
                  onClick={() => {
                    onForceLoadProject();
                    setIsProjectDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-warning hover:bg-warning/10 border-t border-sidebar-foreground/10"
                >
                  <Zap className="w-4 h-4" />
                  <span>Force Reload</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation - Collapsible Groups */}
      <nav className="flex-1 p-3 md:p-4 overflow-y-auto space-y-2">
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups.includes(group.id);
          const hasActiveItem = group.items.some(item => item.id === activeTab);
          const visibleItems = group.items.filter(item => !('adminOnly' in item) || !item.adminOnly || isAdmin);

          return (
            <Collapsible
              key={group.id}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.id)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${hasActiveItem && !isOpen
                      ? 'bg-primary/10 text-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground'
                    }`}
                >
                  <GroupIcon className="w-5 h-5" />
                  <span className="flex-1 text-left text-xs font-semibold tracking-wider uppercase">
                    {group.label}
                  </span>
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 ml-3 pl-3 border-l border-sidebar-muted space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${isActive
                          ? 'sidebar-item-active text-primary font-medium'
                          : 'text-sidebar-foreground/60 hover:bg-sidebar-muted hover:text-sidebar-foreground'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      {/* User Info with Logout */}
      <div className="p-3 md:p-4 border-t border-sidebar-muted">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-medium text-sm">
            {userProfile?.name?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userProfile?.name || 'Пользователь'}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{userProfile?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logLogoutEvent();
            await supabase.auth.signOut();
            toast.success('Вы вышли из аккаунта');
            window.location.href = '/auth';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Выйти</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Narrower and minimalist */}
      <aside className="hidden md:flex w-56 bg-sidebar/60 backdrop-blur-xl text-sidebar-foreground flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/10">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Delete Project Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить проект</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить проект <strong>"{projectToDelete?.name}"</strong>?
              Это действие нельзя отменить. Все данные проекта будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setProjectToDelete(null);
              }}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Export mobile menu trigger for use in Header
export const MobileMenuTrigger = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
    aria-label="Открыть меню"
  >
    <Menu className="w-6 h-6" />
  </button>
);
