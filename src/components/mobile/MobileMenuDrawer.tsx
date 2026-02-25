import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MarkVisionLogo } from '@/components/ui/MarkVisionLogo';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BarChart3,
  Megaphone,
  Video,
  Wallet,
  Settings,
  Plug,
  UsersRound,
  FileText,
  Inbox,
  Target,
  Trophy,
  FlaskConical,
  Activity,
  BookOpen,
  HeartPulse,
  Calendar,
  Zap,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile?: { name: string | null; email: string | null } | null;
  currentProjectName?: string;
}

const menuSections = [
  {
    title: 'Главное',
    items: [
      { id: 'dashboard', label: 'Главная панель', icon: LayoutDashboard },
      { id: 'agency-accounts', label: 'Агентские кабинеты', icon: Activity },
      { id: 'realtime', label: 'Живая лента', icon: Activity },
      { id: 'table', label: 'Таблица показателей', icon: CalendarDays },
    ]
  },
  {
    title: 'Маркетинг',
    items: [
      { id: 'quantom-ads', label: 'Управление рекламой', icon: Megaphone },
      { id: 'ab-testing', label: 'A/B Оптимизатор', icon: FlaskConical },
      { id: 'factory', label: 'Центр контента', icon: Video },
    ]
  },
  {
    title: 'Продажи',
    items: [
      { id: 'crm', label: 'CRM', icon: Users },
      { id: 'visits', label: 'Диагностика', icon: HeartPulse },
      { id: 'inbox', label: 'Входящие', icon: Inbox },
      { id: 'scoring', label: 'Рейтинг заявок', icon: Target },
    ]
  },
  {
    title: 'Аналитика',
    items: [
      { id: 'e2e-analytics', label: 'Сквозная аналитика', icon: BarChart3 },
      { id: 'meta-analytics', label: 'Meta аналитика', icon: BarChart3 },
      { id: 'finance', label: 'Финансы и прибыль', icon: Wallet },
      { id: 'reports', label: 'Отчёты', icon: FileText },
      { id: 'rop', label: 'ИИ-РОП', icon: Activity },
    ]
  },
  {
    title: 'Настройки',
    items: [
      { id: 'settings', label: 'Настройки', icon: Settings },
    ]
  }
];

export const MobileMenuDrawer = ({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  userProfile,
  currentProjectName
}: MobileMenuDrawerProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из аккаунта");
    onOpenChange(false);
    navigate("/auth");
  };

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[300px] p-0 flex flex-col"
      >
        {/* Header with Logo */}
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
              <MarkVisionLogo className="w-7 h-7" />
            </div>
            <div>
              <SheetTitle className="text-left text-base">MarkVision AI</SheetTitle>
              {currentProjectName && (
                <p className="text-xs text-muted-foreground">{currentProjectName}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Menu */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {menuSections.map((section) => (
              <div key={section.title} className="py-2">
                <p className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5 px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                          'active:scale-[0.98] touch-manipulation min-h-[48px]',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-opacity",
                          isActive ? "opacity-100" : "opacity-30"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User profile and logout - Fixed at bottom */}
        <div className="p-4 border-t border-border bg-background mt-auto space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">Тема оформления</span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="h-9 gap-2 rounded-xl"
            >
              {theme === 'dark' ? (
                <>
                  <IconSun className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs">Светлая</span>
                </>
              ) : (
                <>
                  <IconMoon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs">Тёмная</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                {userProfile?.name?.charAt(0).toUpperCase() ||
                  userProfile?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{userProfile?.name || 'Пользователь'}</p>
                <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-11 w-11 flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
