import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Copy,
  MoreVertical,
  Trash2,
  Edit,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  Settings2
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useAuth } from '@/hooks/useAuth';
import { useManagePermissions, UserPermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/externalSupabase';

interface Project {
  id: string;
  name: string;
}

interface TeamManagementProps {
  projects: Project[];
}

// Generate random password
const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const TeamManagement = ({ projects }: TeamManagementProps) => {
  const { isAdmin } = useAuth();
  const { teamMembers, loading, updateMemberRole, updateProjectAccess, deleteMember, refetch } = useTeamMembers();
  const { getPermissionsForUser, setAllPermissionsForProject } = useManagePermissions();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(true);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; emailSent?: boolean } | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editProjectAccess, setEditProjectAccess] = useState<string[]>([]);
  
  // Permissions dialog state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedMemberForPermissions, setSelectedMemberForPermissions] = useState<TeamMember | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<Record<string, UserPermissions>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager' as 'admin' | 'manager',
    projectAccess: [] as string[],
  });

  const defaultPermissions: UserPermissions = {
    can_edit_plan: false,
    can_edit_daily_data: true,
    can_view_sales: false,
    can_view_revenue: false,
    can_manage_leads: true,
    can_export_data: false,
  };

  const handleOpenPermissionsDialog = async (member: TeamMember) => {
    setSelectedMemberForPermissions(member);
    setPermissionsDialogOpen(true);
    setLoadingPermissions(true);

    const perms: Record<string, UserPermissions> = {};
    for (const projectId of member.projectAccess) {
      const p = await getPermissionsForUser(member.user_id, projectId);
      perms[projectId] = p || { ...defaultPermissions };
    }
    setMemberPermissions(perms);
    setLoadingPermissions(false);
  };

  const handlePermissionToggle = (projectId: string, permission: keyof UserPermissions) => {
    setMemberPermissions(prev => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || defaultPermissions),
        [permission]: !(prev[projectId]?.[permission] ?? defaultPermissions[permission]),
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedMemberForPermissions) return;
    
    setLoadingPermissions(true);
    
    for (const projectId of selectedMemberForPermissions.projectAccess) {
      const perms = memberPermissions[projectId] || defaultPermissions;
      await setAllPermissionsForProject(selectedMemberForPermissions.user_id, projectId, perms);
    }
    
    toast.success('Права сохранены');
    setPermissionsDialogOpen(false);
    setSelectedMemberForPermissions(null);
    setLoadingPermissions(false);
  };

  const handleNameChange = (name: string) => {
    setNewMember(prev => ({ ...prev, name }));
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setNewMember(prev => ({ ...prev, password }));
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

  const handleCreateUser = async () => {
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error('Заполните все поля');
      return;
    }

    if (newMember.password.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newMember.email,
          password: newMember.password,
          name: newMember.name,
          role: newMember.role,
          projectAccess: newMember.projectAccess,
          sendEmail: sendEmailOnCreate
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      // Show credentials
      setCreatedCredentials({
        email: newMember.email,
        password: newMember.password,
        emailSent: response.data.emailSent
      });

      if (response.data.emailSent) {
        toast.success('Пользователь создан и данные отправлены на email!');
      } else if (sendEmailOnCreate && response.data.emailError) {
        toast.warning(`Пользователь создан, но email не отправлен: ${response.data.emailError}`);
      } else {
        toast.success('Пользователь создан!');
      }
      refetch();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Ошибка создания пользователя');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setIsInviteOpen(false);
    setCreatedCredentials(null);
    setNewMember({ name: '', email: '', password: '', role: 'manager', projectAccess: [] });
    setShowPassword(false);
    setSendEmailOnCreate(true);
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
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsInviteOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Добавить сотрудника
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {createdCredentials ? 'Сотрудник создан' : 'Добавить сотрудника'}
                </DialogTitle>
              </DialogHeader>
              
              {createdCredentials ? (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <Alert className="bg-secondary">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Данные для входа</AlertTitle>
                    <AlertDescription className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded text-sm">{createdCredentials.email}</code>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Пароль:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded text-sm">{createdCredentials.password}</code>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(createdCredentials.password, 'Пароль')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  {createdCredentials.emailSent ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 justify-center">
                      <Mail className="w-4 h-4" />
                      Данные отправлены на email сотрудника
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Сохраните эти данные и передайте сотруднику
                    </p>
                  )}
                  
                  <DialogFooter>
                    <Button onClick={handleCloseDialog} className="w-full">
                      Готово
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <>
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
                      <label className="text-sm font-medium">Пароль</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Минимум 6 символов"
                            value={newMember.password}
                            onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-10 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                          Сгенерировать
                        </Button>
                      </div>
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

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Checkbox
                        id="sendEmail"
                        checked={sendEmailOnCreate}
                        onCheckedChange={(checked) => setSendEmailOnCreate(checked === true)}
                      />
                      <label htmlFor="sendEmail" className="text-sm cursor-pointer">
                        Отправить данные для входа на email
                      </label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Отмена
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isCreating}>
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Создать
                    </Button>
                  </DialogFooter>
                </>
              )}
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
                            Изменить проекты
                          </DropdownMenuItem>
                          {member.role === 'manager' && member.projectAccess.length > 0 && (
                            <DropdownMenuItem onClick={() => handleOpenPermissionsDialog(member)}>
                              <Settings2 className="w-4 h-4 mr-2" />
                              Настроить права
                            </DropdownMenuItem>
                          )}
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
              <p className="font-medium">Настраиваемый доступ</p>
              <p className="text-muted-foreground">Доступ к назначенным проектам с детальными правами</p>
            </div>
          </div>
        </div>
        
        {/* Permissions Legend */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Детальные права менеджера:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>• Редактирование плана</div>
            <div>• Редактирование данных</div>
            <div>• Просмотр продаж</div>
            <div>• Просмотр выручки</div>
            <div>• Управление лидами</div>
            <div>• Экспорт данных</div>
          </div>
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Права доступа: {selectedMemberForPermissions?.name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : selectedMemberForPermissions?.projectAccess.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет назначенных проектов
            </div>
          ) : (
            <Tabs defaultValue={selectedMemberForPermissions?.projectAccess[0]} className="flex-1 overflow-hidden">
              <TabsList className="w-full justify-start overflow-x-auto">
                {selectedMemberForPermissions?.projectAccess.map(projectId => {
                  const project = projects.find(p => p.id === projectId);
                  return (
                    <TabsTrigger key={projectId} value={projectId} className="text-xs">
                      {project?.name || 'Проект'}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {selectedMemberForPermissions?.projectAccess.map(projectId => {
                const perms = memberPermissions[projectId] || defaultPermissions;
                return (
                  <TabsContent key={projectId} value={projectId} className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Редактирование плана</Label>
                          <p className="text-xs text-muted-foreground">Может изменять плановые показатели</p>
                        </div>
                        <Switch 
                          checked={perms.can_edit_plan} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_edit_plan')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Редактирование данных</Label>
                          <p className="text-xs text-muted-foreground">Может вносить ежедневные данные</p>
                        </div>
                        <Switch 
                          checked={perms.can_edit_daily_data} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_edit_daily_data')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Просмотр продаж</Label>
                          <p className="text-xs text-muted-foreground">Видит данные о продажах</p>
                        </div>
                        <Switch 
                          checked={perms.can_view_sales} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_view_sales')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Просмотр выручки</Label>
                          <p className="text-xs text-muted-foreground">Видит финансовые показатели</p>
                        </div>
                        <Switch 
                          checked={perms.can_view_revenue} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_view_revenue')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Управление лидами</Label>
                          <p className="text-xs text-muted-foreground">Может изменять статусы лидов в CRM</p>
                        </div>
                        <Switch 
                          checked={perms.can_manage_leads} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_manage_leads')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <Label className="font-medium">Экспорт данных</Label>
                          <p className="text-xs text-muted-foreground">Может скачивать отчёты и данные</p>
                        </div>
                        <Switch 
                          checked={perms.can_export_data} 
                          onCheckedChange={() => handlePermissionToggle(projectId, 'can_export_data')}
                        />
                      </div>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSavePermissions} disabled={loadingPermissions}>
              {loadingPermissions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
