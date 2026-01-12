import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  projects?: { id: string; name: string; owner_id: string }[];
  onProjectChange?: (projectId: string) => void;
  onStartOnboarding?: () => void;
  onDeleteProject?: (projectId: string) => Promise<boolean>;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  userProfile?: { name: string | null; email: string | null } | null;
}

// New 5-group structure
const menuGroups = [
  {
    id: 'dashboard-group',
    label: 'ДАШБОРД',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'Главный дашборд', icon: LayoutDashboard },
      { id: 'realtime', label: 'Realtime', icon: Activity },
      { id: 'table', label: 'Таблица данных', icon: CalendarDays },
    ]
  },
  {
    id: 'marketing-group',
    label: 'МАРКЕТИНГ',
    icon: Megaphone,
    items: [
      { id: 'quantom-ads', label: 'Quantum Ads', icon: Megaphone },
      { id: 'ab-testing', label: 'A/B Тесты', icon: FlaskConical },
      { id: 'factory', label: 'Content Factory', icon: Factory },
    ]
  },
  {
    id: 'sales-group',
    label: 'ПРОДАЖИ',
    icon: ShoppingCart,
    items: [
      { id: 'crm', label: 'CRM', icon: Kanban },
      { id: 'calendar', label: 'Календарь', icon: CalendarDays },
      { id: 'diagnostics', label: 'Диагностика', icon: ClipboardCheck },
      { id: 'inbox', label: 'Inbox', icon: Inbox },
      { id: 'scoring', label: 'Lead Scoring', icon: FlameKindling },
      { id: 'gamification', label: 'Геймификация', icon: Trophy },
    ]
  },
  {
    id: 'analytics-group',
    label: 'АНАЛИТИКА',
    icon: BarChart3,
    items: [
      { id: 'e2e-analytics', label: 'Сквозная аналитика', icon: Zap },
      { id: 'finance', label: 'Финансы (P&L)', icon: Wallet },
      { id: 'reports', label: 'Отчёты', icon: FileSpreadsheet },
    ]
  },
  {
    id: 'infrastructure-group',
    label: 'ИНФРАСТРУКТУРА',
    icon: Settings,
    items: [
      { id: 'settings', label: 'Настройки', icon: Settings },
      { id: 'integrations', label: 'Интеграции', icon: Plug },
      { id: 'team', label: 'Команда', icon: Users },
      { id: 'staff', label: 'Персонал', icon: UserCog },
      { id: 'knowledge', label: 'База знаний', icon: BookOpen },
      { id: 'audit', label: 'Аудит', icon: Shield, adminOnly: true },
      { id: 'health', label: 'Здоровье системы', icon: Activity },
      { id: 'help', label: 'Помощь', icon: HelpCircle },
    ]
  },
];

export const Sidebar = ({ 
  activeTab, 
  onTabChange, 
  currentProject = 'default',
  projects = [{ id: 'default', name: 'Основной проект', owner_id: '' }],
  onProjectChange,
  onStartOnboarding,
  onDeleteProject,
  isMobileOpen = false,
  onMobileClose,
  userProfile
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
  const { isAdmin, user } = useAuth();
  
  const currentProjectData = projects.find(p => p.id === currentProject) || projects[0];

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

  const canDeleteProject = (project: { id: string; owner_id: string }) => {
    return isAdmin || project.owner_id === user?.id;
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    onMobileClose?.();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-sidebar-muted">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MarkVision AI</h1>
            <p className="text-xs text-sidebar-foreground/60">Умный маркетинг</p>
          </div>
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
              {currentProjectData?.name || 'Выберите проект'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-sidebar-muted rounded-lg shadow-lg overflow-hidden z-50">
              {projects.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-sidebar-foreground/60">
                  Нет проектов
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                      currentProject === project.id 
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
                            className={`p-1 rounded hover:bg-sidebar-foreground/20 transition-colors ${
                              currentProject === project.id 
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    hasActiveItem && !isOpen
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col h-screen fixed left-0 top-0 z-40">
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
