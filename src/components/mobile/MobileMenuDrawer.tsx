import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
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
      { id: 'crm', label: 'База пациентов', icon: Users },
      { id: 'diagnostics', label: 'Диагностика', icon: HeartPulse },
      { id: 'inbox', label: 'Входящие', icon: Inbox },
      { id: 'scoring', label: 'Рейтинг заявок', icon: Target },
      { id: 'gamification', label: 'Мотивация', icon: Trophy },
      { id: 'automation', label: 'Автоматизация', icon: Zap },
    ]
  },
  {
    title: 'Аналитика',
    items: [
      { id: 'e2e-analytics', label: 'Сквозная аналитика', icon: BarChart3 },
      { id: 'finance', label: 'Финансы и прибыль', icon: Wallet },
      { id: 'reports', label: 'Отчёты', icon: FileText },
      { id: 'rop', label: 'ИИ-РОП', icon: Activity },
    ]
  },
  {
    title: 'Настройки',
    items: [
      { id: 'settings', label: 'Настройки', icon: Settings },
      { id: 'integrations', label: 'Подключения', icon: Plug },
      { id: 'team', label: 'Сотрудники', icon: UsersRound },
      { id: 'calendar', label: 'Календарь', icon: Calendar },
      { id: 'knowledge', label: 'База знаний', icon: BookOpen },
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
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-2" />
          <SheetTitle className="text-left">Меню</SheetTitle>
          {currentProjectName && (
            <p className="text-sm text-muted-foreground text-left">{currentProjectName}</p>
          )}
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(85vh-120px)] pb-safe">
          {menuSections.map((section) => (
            <div key={section.title} className="py-2">
              <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                        'active:scale-[0.98] touch-manipulation',
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
        
        {/* User profile and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background safe-area-bottom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-medium">
                {userProfile?.name?.charAt(0).toUpperCase() || 
                 userProfile?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-sm font-medium">{userProfile?.name || 'Пользователь'}</p>
                <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
