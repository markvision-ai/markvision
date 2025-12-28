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
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentProject?: string;
  projects?: { id: string; name: string }[];
  onProjectChange?: (projectId: string) => void;
  onCreateProject?: (name: string) => Promise<boolean>;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  userProfile?: { name: string | null; email: string | null } | null;
}

// Main 6 sections as per ТЗ
const menuItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard, emoji: '🏠' },
  { id: 'table', label: 'Таблица данных', icon: CalendarDays, emoji: '📅' },
  { id: 'crm', label: 'CRM', icon: Kanban, emoji: '🤝' },
  { id: 'quantom-ads', label: 'Quantum Ads', icon: Megaphone, emoji: '🚀' },
  { id: 'factory', label: 'Content Factory', icon: Factory, emoji: '🎬' },
  { id: 'e2e-analytics', label: 'Сквозная аналитика', icon: Zap, emoji: '📊' },
];

const bottomItems = [
  { id: 'reports', label: 'Отчёты', icon: FileSpreadsheet },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'audit', label: 'Аудит', icon: Shield, adminOnly: true },
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'help', label: 'Помощь', icon: HelpCircle },
];

export const Sidebar = ({ 
  activeTab, 
  onTabChange, 
  currentProject = 'default',
  projects = [{ id: 'default', name: 'Основной проект' }],
  onProjectChange,
  onCreateProject,
  isMobileOpen = false,
  onMobileClose,
  userProfile
}: SidebarProps) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { isAdmin, user } = useAuth();
  
  const currentProjectData = projects.find(p => p.id === currentProject) || projects[0];

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

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !onCreateProject) return;
    
    setIsCreating(true);
    const success = await onCreateProject(newProjectName.trim());
    setIsCreating(false);
    
    if (success) {
      setNewProjectName('');
      setIsCreateDialogOpen(false);
    }
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
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectChange?.(project.id);
                      setIsProjectDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                      currentProject === project.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-sidebar-foreground/10'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))
              )}
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(false);
                  setIsCreateDialogOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-primary hover:bg-sidebar-foreground/10 border-t border-sidebar-foreground/10"
              >
                <Plus className="w-4 h-4" />
                <span>Создать проект</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 md:p-4 overflow-y-auto">
        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3">Меню</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider mb-3 px-3 mt-6 md:mt-8">Дополнительно</p>
        <ul className="space-y-1">
          {bottomItems
            .filter(item => !item.adminOnly || isAdmin)
            .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
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

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isCreating}
            >
              {isCreating ? 'Создание...' : 'Создать'}
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
