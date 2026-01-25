import { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  X,
  Check,
  RefreshCw,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/hooks/useNotifications';

export const NotificationsDropdown = () => {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification,
    refresh,
    pushEnabled,
    enablePushNotifications
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleEnablePush = async () => {
    const granted = await enablePushNotifications();
    if (granted) {
      toast.success('Push-уведомления включены');
    } else {
      toast.error('Не удалось включить push-уведомления. Проверьте настройки браузера.');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getBgClass = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-secondary/30';
    switch (type) {
      case 'warning':
        return 'bg-warning/10 border-l-2 border-warning';
      case 'success':
        return 'bg-success/10 border-l-2 border-success';
      case 'error':
        return 'bg-destructive/10 border-l-2 border-destructive';
      default:
        return 'bg-primary/10 border-l-2 border-primary';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-medium rounded-full px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 md:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Уведомления</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!pushEnabled && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleEnablePush}
              >
                <BellRing className="w-3 h-3 mr-1" />
                Push
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => refresh()}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="w-3 h-3 mr-1" />
                Прочитать все
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Нет уведомлений</p>
              <p className="text-xs mt-1">Всё отлично!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 p-3 cursor-pointer hover:bg-secondary/50 transition-colors",
                    getBgClass(notification.type, notification.read)
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5 relative">
                    {getIcon(notification.type)}
                    {!notification.read && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        "text-sm",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(notification.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-secondary rounded opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.projectName && (
                      <span className="inline-block mt-1 text-xs bg-secondary px-1.5 py-0.5 rounded">
                        {notification.projectName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <p className="text-xs text-muted-foreground text-center">
              Уведомления на основе данных за последние 7 дней
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
