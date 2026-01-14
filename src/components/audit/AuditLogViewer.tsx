import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Shield, 
  User, 
  Clock, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp,
  Activity,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Download,
  Settings,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/externalSupabase';
import { useAuth } from '@/hooks/useAuth';
import { Json } from '@/integrations/supabase/types';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  project_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="w-4 h-4 text-green-500" />,
  logout: <LogOut className="w-4 h-4 text-yellow-500" />,
  create: <Plus className="w-4 h-4 text-blue-500" />,
  update: <Pencil className="w-4 h-4 text-orange-500" />,
  delete: <Trash2 className="w-4 h-4 text-red-500" />,
  view: <Eye className="w-4 h-4 text-gray-500" />,
  export: <Download className="w-4 h-4 text-purple-500" />,
  status_change: <Activity className="w-4 h-4 text-cyan-500" />,
  permission_change: <Settings className="w-4 h-4 text-indigo-500" />,
  role_change: <Shield className="w-4 h-4 text-pink-500" />,
};

const actionLabels: Record<string, string> = {
  login: 'Вход',
  logout: 'Выход',
  create: 'Создание',
  update: 'Обновление',
  delete: 'Удаление',
  view: 'Просмотр',
  export: 'Экспорт',
  status_change: 'Смена статуса',
  permission_change: 'Изменение прав',
  role_change: 'Изменение роли',
  project_access_grant: 'Доступ к проекту',
  project_access_revoke: 'Отзыв доступа',
  password_reset: 'Сброс пароля',
  file_upload: 'Загрузка файла',
  file_delete: 'Удаление файла',
};

const entityLabels: Record<string, string> = {
  user: 'Пользователь',
  lead: 'Лид',
  project: 'Проект',
  campaign: 'Кампания',
  daily_data: 'Данные',
  plan_data: 'План',
  webhook_config: 'Вебхук',
  report_template: 'Шаблон отчёта',
  ad_asset: 'Рекламный актив',
  message: 'Сообщение',
  task: 'Задача',
  permission: 'Права',
  role: 'Роль',
  file: 'Файл',
  session: 'Сессия',
};

export const AuditLogViewer = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(query) ||
      log.user_name?.toLowerCase().includes(query) ||
      log.entity_id?.toLowerCase().includes(query)
    );
  });

  const renderJsonDiff = (oldValues: Json | null, newValues: Json | null) => {
    if (!oldValues && !newValues) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-secondary/30 rounded-lg text-xs">
        <div>
          <p className="font-medium text-muted-foreground mb-1">Было:</p>
          <pre className="text-red-400 whitespace-pre-wrap break-all">
            {oldValues ? JSON.stringify(oldValues, null, 2) : '—'}
          </pre>
        </div>
        <div>
          <p className="font-medium text-muted-foreground mb-1">Стало:</p>
          <pre className="text-green-400 whitespace-pre-wrap break-all">
            {newValues ? JSON.stringify(newValues, null, 2) : '—'}
          </pre>
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Доступ ограничен</h3>
        <p className="text-muted-foreground">
          Только администраторы могут просматривать аудит-логи
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Аудит безопасности
          </h2>
          <p className="text-sm text-muted-foreground">
            Журнал всех действий пользователей в системе
          </p>
        </div>
        <Button variant="outline" onClick={fetchLogs}>
          <Activity className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по пользователю, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Действие" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все действия</SelectItem>
            <SelectItem value="login">Вход</SelectItem>
            <SelectItem value="logout">Выход</SelectItem>
            <SelectItem value="create">Создание</SelectItem>
            <SelectItem value="update">Обновление</SelectItem>
            <SelectItem value="delete">Удаление</SelectItem>
            <SelectItem value="status_change">Смена статуса</SelectItem>
            <SelectItem value="permission_change">Изменение прав</SelectItem>
            <SelectItem value="role_change">Изменение роли</SelectItem>
            <SelectItem value="export">Экспорт</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Объект" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все объекты</SelectItem>
            <SelectItem value="session">Сессия</SelectItem>
            <SelectItem value="lead">Лиды</SelectItem>
            <SelectItem value="user">Пользователи</SelectItem>
            <SelectItem value="project">Проекты</SelectItem>
            <SelectItem value="campaign">Кампании</SelectItem>
            <SelectItem value="permission">Права</SelectItem>
            <SelectItem value="role">Роли</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="border rounded-xl overflow-hidden">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Время</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Объект</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="w-6 h-6 rounded" /></TableCell>
                    <TableCell><Skeleton className="w-24 h-4" /></TableCell>
                    <TableCell><Skeleton className="w-32 h-4" /></TableCell>
                    <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                    <TableCell><Skeleton className="w-20 h-4" /></TableCell>
                    <TableCell><Skeleton className="w-6 h-6" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Нет записей для отображения
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <Collapsible key={log.id} open={expandedLog === log.id} onOpenChange={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <TableRow className="hover:bg-secondary/50 cursor-pointer">
                      <TableCell>
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          {actionIcons[log.action] || <Activity className="w-4 h-4" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), 'dd MMM HH:mm', { locale: ru })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{log.user_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{log.user_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{entityLabels[log.entity_type] || log.entity_type}</span>
                          {log.entity_id && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {log.entity_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {expandedLog === log.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="bg-secondary/20">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-2">
                            {log.user_agent && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">User Agent:</span> {log.user_agent}
                              </p>
                            )}
                            {(log.old_values || log.new_values) && renderJsonDiff(log.old_values, log.new_values)}
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Показано {filteredLogs.length} из {logs.length} записей</span>
        <span>Последние 100 записей</span>
      </div>
    </div>
  );
};
