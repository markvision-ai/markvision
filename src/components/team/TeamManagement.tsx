import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Copy,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAuth } from '@/hooks/useAuth';

interface Project {
  id: string;
  name: string;
}

interface TeamManagementProps {
  projects: Project[];
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const generateLogin = (name: string) => {
  const translitMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  
  const login = name.toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  
  return login + Math.floor(Math.random() * 100);
};

export const TeamManagement = ({ projects }: TeamManagementProps) => {
  const { isAdmin } = useAuth();
  const { teamMembers, loading, updateMemberRole, updateProjectAccess, deleteMember } = useTeamMembers();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editProjectAccess, setEditProjectAccess] = useState<string[]>([]);
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'manager' as 'admin' | 'manager',
    projectAccess: [] as string[],
  });
  const [generatedCredentials, setGeneratedCredentials] = useState({
    login: '',
    password: '',
  });

  const handleNameChange = (name: string) => {
    setNewMember(prev => ({ ...prev, name }));
    if (name.length >= 2) {
      setGeneratedCredentials({
        login: generateLogin(name),
        password: generatePassword(),
      });
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setNewMember(prev => ({
      ...prev,
      projectAccess: prev.projectAccess.includes(projectId)
        ? prev.projectAccess.filter(id => id !== projectId)
        : [...prev.projectAccess, projectId],
    }));
  };

  const handleEditProjectToggle = (projectId: string) => {
    setEditProjectAccess(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleInvite = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Заполните имя и email');
      return;
    }

    // Note: Actual user creation requires Supabase Auth Admin API
    // For now, show instructions to the admin
    toast.info('Функция приглашения', {
      description: 'Для создания нового пользователя используйте панель управления Lovable Cloud или отправьте ссылку для регистрации.',
    });
    
    setIsInviteOpen(false);
    setNewMember({ name: '', email: '', role: 'manager', projectAccess: [] });
    setGeneratedCredentials({ login: '', password: '' });
  };

  const handleDeleteMember = async (userId: string) => {
    await deleteMember(userId);
  };

  const handleSaveProjectAccess = async (userId: string) => {
    await updateProjectAccess(userId, editProjectAccess);
    setEditingMember(null);
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'manager') => {
    await updateMemberRole(userId, role);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} скопирован`);
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' 
      ? <Badge className="bg-primary/20 text-primary border-primary/30">Админ</Badge>
      : <Badge variant="secondary">Менеджер</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30">Активен</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning border-warning/30">Ожидает</Badge>;
      default:
        return <Badge variant="outline">Неактивен</Badge>;
    }
  };

  // Filter out inactive members for display
  const activeMembers = teamMembers.filter(m => m.status !== 'inactive');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin-only notice */}
      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ограниченный доступ</AlertTitle>
          <AlertDescription>
            Только администраторы могут управлять командой. Вы можете просматривать список сотрудников.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Управление командой</h2>
          <p className="text-sm text-muted-foreground">
            {activeMembers.length} сотрудников
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Пригласить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Пригласить сотрудника</DialogTitle>
              </DialogHeader>
              
              <Alert className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Для создания учётных записей используйте регистрацию через форму авторизации. После регистрации назначьте права доступа здесь.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя</label>
                  <Input
                    placeholder="Иван Петров"
                    value={newMember.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="email@company.kz"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Роль</label>
                  <Select 
                    value={newMember.role} 
                    onValueChange={(value: 'admin' | 'manager') => setNewMember(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Админ (полный доступ)</SelectItem>
                      <SelectItem value="manager">Менеджер (ограниченный)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newMember.role === 'manager' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Доступ к проектам</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                      {projects.map(project => (
                        <label key={project.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={newMember.projectAccess.includes(project.id)}
                            onCheckedChange={() => handleProjectToggle(project.id)}
                          />
                          <span className="text-sm">{project.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {generatedCredentials.login && (
                  <div className="space-y-3 p-4 bg-secondary rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">Предварительные данные:</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Логин</p>
                        <p className="font-mono">{generatedCredentials.login}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(generatedCredentials.login, 'Логин')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Пароль</p>
                        <p className="font-mono">
                          {showPassword ? generatedCredentials.password : '••••••••••••'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(generatedCredentials.password, 'Пароль')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleInvite}>
                  <Mail className="w-4 h-4 mr-2" />
                  Готово
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Сотрудник</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Роль</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Статус</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Проекты</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Добавлен</th>
              {isAdmin && <th className="text-right p-4 text-sm font-medium text-muted-foreground">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeMembers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="p-8 text-center text-muted-foreground">
                  Нет зарегистрированных сотрудников
                </td>
              </tr>
            ) : (
              activeMembers.map(member => (
                <tr key={member.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(member.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name || 'Без имени'}</p>
                        <p className="text-sm text-muted-foreground">{member.email || 'Нет email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {isAdmin ? (
                      <Select 
                        value={member.role} 
                        onValueChange={(value: 'admin' | 'manager') => handleRoleChange(member.user_id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Админ</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(member.role)
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(member.status)}</td>
                  <td className="p-4">
                    {editingMember === member.user_id ? (
                      <div className="space-y-2">
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {projects.map(project => (
                            <label key={project.id} className="flex items-center gap-2 cursor-pointer text-sm">
                              <Checkbox
                                checked={editProjectAccess.includes(project.id)}
                                onCheckedChange={() => handleEditProjectToggle(project.id)}
                              />
                              <span>{project.name}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => handleSaveProjectAccess(member.user_id)}>
                            Сохранить
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingMember(null)}>
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {member.role === 'admin' ? (
                          <Badge variant="outline" className="text-xs">Все проекты</Badge>
                        ) : member.projectAccess.length === 0 ? (
                          <span className="text-sm text-muted-foreground">Нет доступа</span>
                        ) : (
                          <>
                            {member.projectAccess.slice(0, 2).map(projectId => {
                              const project = projects.find(p => p.id === projectId);
                              return project ? (
                                <Badge key={projectId} variant="outline" className="text-xs">
                                  {project.name.length > 15 ? project.name.slice(0, 15) + '...' : project.name}
                                </Badge>
                              ) : null;
                            })}
                            {member.projectAccess.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.projectAccess.length - 2}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{member.createdAt}</td>
                  {isAdmin && (
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingMember(member.user_id);
                            setEditProjectAccess(member.projectAccess);
                          }}>
                            <Shield className="w-4 h-4 mr-2" />
                            Изменить доступ
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteMember(member.user_id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Деактивировать
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Access Legend */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Уровни доступа
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <Badge className="bg-primary/20 text-primary border-primary/30 mt-0.5">Админ</Badge>
            <div className="text-sm">
              <p className="font-medium">Полный доступ</p>
              <p className="text-muted-foreground">Все проекты, добавление сотрудников, настройки, финансы</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
            <Badge variant="secondary" className="mt-0.5">Менеджер</Badge>
            <div className="text-sm">
              <p className="font-medium">Ограниченный доступ</p>
              <p className="text-muted-foreground">Только назначенные проекты, заполнение данных, просмотр дашборда</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
