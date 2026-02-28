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
  Settings2,
  Check,
  ChevronRight,
  ExternalLink,
  Search,
  MoreHorizontal,
  Save
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
  DialogDescription,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useAuth } from '@/hooks/useAuth';
import { useManagePermissions, UserPermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Загрузка данных команды...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Admin-only notice */}
      {!isAdmin && (
        <Alert className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border-amber-500/20 bg-amber-500/5">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500 font-bold">Ограниченный доступ</AlertTitle>
          <AlertDescription className="text-amber-500/80">
            Только администраторы могут управлять командой. Вам доступен только просмотр списка сотрудников.
          </AlertDescription>
        </Alert>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Управление командой
          </h2>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {activeMembers.length} активных сотрудников в системе
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsInviteOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-primary/20 transition-all active:scale-[0.98] px-6">
                <UserPlus className="w-4 h-4 mr-2" />
                Добавить сотрудника
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-black/90 backdrop-blur-3xl border-white/5 shadow-2xl rounded-3xl p-0 overflow-hidden">
              <div className="p-8 border-b border-white/5 bg-white/5">
                <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  {createdCredentials ? 'Сотрудник создан' : 'Добавить сотрудника'}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {createdCredentials ? 'Пользователь успешно зарегистрирован' : 'Введите данные нового участника команды'}
                </DialogDescription>
              </div>

              <ScrollArea className="max-h-[70vh]">
                {createdCredentials ? (
                  <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-blue-500" />
                      </div>
                      <p className="text-lg font-bold text-white">Выполнено успешно</p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Email:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-white/5 px-2 py-1 rounded-md text-sm font-mono text-slate-700">{createdCredentials.email}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-white"
                            onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Пароль:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-white/5 px-2 py-1 rounded-md text-sm font-mono text-slate-700">{createdCredentials.password}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-white"
                            onClick={() => copyToClipboard(createdCredentials.password, 'Пароль')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {createdCredentials.emailSent ? (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-sm text-blue-500 justify-center font-medium">
                        <Mail className="w-4 h-4" />
                        Данные отправлены на email сотрудника
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-sm text-amber-500 justify-center">
                        <AlertCircle className="w-4 h-4" />
                        Сохраните эти данные и передайте сотруднику
                      </div>
                    )}

                    <Button onClick={handleCloseDialog} className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl">
                      Закрыть и продолжить
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-600 text-xs uppercase tracking-widest font-bold">Полное имя</Label>
                        <Input
                          placeholder="Иван Петров"
                          value={newMember.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="h-12 bg-white/5 border-slate-200 text-white rounded-xl focus:ring-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-600 text-xs uppercase tracking-widest font-bold">Email адрес</Label>
                        <Input
                          type="email"
                          placeholder="email@company.kz"
                          value={newMember.email}
                          onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                          className="h-12 bg-white/5 border-slate-200 text-white rounded-xl focus:ring-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-600 text-xs uppercase tracking-widest font-bold">Пароль доступа</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Минимум 6 символов"
                              value={newMember.password}
                              onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-11 pr-11 h-12 bg-white/5 border-slate-200 text-white rounded-xl focus:ring-primary/50"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGeneratePassword}
                            className="h-12 bg-white/5 border-slate-200 text-white rounded-xl hover:bg-white/10"
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-600 text-xs uppercase tracking-widest font-bold">Роль в системе</Label>
                        <Select
                          value={newMember.role}
                          onValueChange={(value: 'admin' | 'manager') => setNewMember(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="h-12 bg-white/5 border-slate-200 text-white rounded-xl focus:ring-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-900 border-slate-200 text-white">
                            <SelectItem value="admin">Администратор (Полный доступ)</SelectItem>
                            <SelectItem value="manager">Менеджер (Ограниченный доступ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newMember.role === 'manager' && (
                        <div className="space-y-3">
                          <Label className="text-slate-600 text-xs uppercase tracking-widest font-bold">Доступ к проектам</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 rounded-2xl p-4 custom-scrollbar">
                            {projects.map(project => (
                              <label key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                                <Checkbox
                                  checked={newMember.projectAccess.includes(project.id)}
                                  onCheckedChange={() => handleProjectToggle(project.id)}
                                  className="border-white/20 data-[state=checked]:bg-primary"
                                />
                                <span className="text-sm text-slate-600 group-hover:text-white">{project.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                        <Checkbox
                          id="sendEmail"
                          checked={sendEmailOnCreate}
                          onCheckedChange={(checked) => setSendEmailOnCreate(checked === true)}
                          className="border-white/20 data-[state=checked]:bg-primary"
                        />
                        <label htmlFor="sendEmail" className="text-sm text-slate-600 cursor-pointer">
                          Отправить данные для входа на email
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={handleCloseDialog} className="flex-1 h-12 bg-white/5 border-slate-200 text-white rounded-xl hover:bg-white/10">
                        Отмена
                      </Button>
                      <Button onClick={handleCreateUser} disabled={isCreating} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-primary/20">
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Создать
                      </Button>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Member List */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Сотрудник</th>
                <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Роль</th>
                <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Статус</th>
                <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Проекты</th>
                <th className="p-6 text-xs uppercase tracking-widest font-bold text-slate-500">Дата добавления</th>
                {isAdmin && <th className="p-6 text-right text-xs uppercase tracking-widest font-bold text-slate-500">Действия</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeMembers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-white/10 mb-4" />
                      <p className="text-muted-foreground">Нет зарегистрированных сотрудников</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeMembers.map(member => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center ring-1 ring-white/10 shadow-2xl shadow-blue-900/5 group-hover:ring-primary/30 transition-all">
                          <span className="text-base font-bold text-primary">
                            {(member.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-primary transition-colors">{member.name || 'Без имени'}</p>
                          <p className="text-xs text-slate-500 font-medium">{member.email || 'Нет email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {isAdmin ? (
                        <Select
                          value={member.role}
                          onValueChange={(value: 'admin' | 'manager') => handleRoleChange(member.user_id, value)}
                        >
                          <SelectTrigger className="w-36 bg-white/5 border-slate-200 text-white rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-neutral-900 border-slate-200 text-white">
                            <SelectItem value="admin">Администратор</SelectItem>
                            <SelectItem value="manager">Менеджер</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex">
                          {member.role === 'admin'
                            ? <Badge className="bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)] px-3 py-1">Админ</Badge>
                            : <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 py-1">Менеджер</Badge>}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          member.status === 'active' ? "bg-blue-500 pulse-emerald" :
                            member.status === 'pending' ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" :
                              "bg-white/20"
                        )} />
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          member.status === 'active' ? "text-blue-500" :
                            member.status === 'pending' ? "text-amber-500" :
                              "text-white/20"
                        )}>
                          {member.status === 'active' ? 'Активен' :
                            member.status === 'pending' ? 'Ожидает' : 'Неактивен'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      {editingMember === member.user_id ? (
                        <div className="space-y-3">
                          <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-black/20 rounded-xl border border-white/5 custom-scrollbar">
                            {projects.map(project => (
                              <label key={project.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs group/p">
                                <Checkbox
                                  checked={editProjectAccess.includes(project.id)}
                                  onCheckedChange={() => handleEditProjectToggle(project.id)}
                                  className="border-white/20 data-[state=checked]:bg-primary"
                                />
                                <span className="text-slate-600 group-hover/p:text-white">{project.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveProjectAccess(member.user_id)} className="flex-1 bg-primary h-8 rounded-lg text-xs">
                              Ок
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingMember(null)} className="h-8 rounded-lg text-slate-500 text-xs">
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {member.role === 'admin' ? (
                            <Badge variant="outline" className="bg-white/5 border-slate-200 text-slate-600 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
                              Все проекты
                            </Badge>
                          ) : member.projectAccess.length === 0 ? (
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Нет доступа</span>
                          ) : (
                            <>
                              {member.projectAccess.slice(0, 2).map(projectId => {
                                const project = projects.find(p => p.id === projectId);
                                return project ? (
                                  <Badge key={projectId} variant="outline" className="bg-white/5 border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5">
                                    {project.name.length > 20 ? project.name.slice(0, 20) + '...' : project.name}
                                  </Badge>
                                ) : null;
                              })}
                              {member.projectAccess.length > 2 && (
                                <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary text-[10px] font-bold px-2 py-0.5">
                                  +{member.projectAccess.length - 2}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-medium text-slate-500">{member.createdAt}</p>
                    </td>
                    {isAdmin && (
                      <td className="p-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-white/20 hover:text-white hover:bg-white/5 rounded-xl">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-neutral-900 border-white/5 p-1 min-w-[180px] rounded-2xl shadow-2xl">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingMember(member.user_id);
                                setEditProjectAccess(member.projectAccess);
                              }}
                              className="rounded-xl focus:bg-white/5 focus:text-white gap-2 p-3 text-sm"
                            >
                              <Shield className="w-4 h-4 text-primary" />
                              Изменить проекты
                            </DropdownMenuItem>
                            {member.role === 'manager' && member.projectAccess.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => handleOpenPermissionsDialog(member)}
                                className="rounded-xl focus:bg-white/5 focus:text-white gap-2 p-3 text-sm"
                              >
                                <Settings2 className="w-4 h-4 text-blue-500" />
                                Настроить права
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-white/5 my-1" />
                            <DropdownMenuItem
                              className="rounded-xl focus:bg-red-500/10 focus:text-red-500 text-red-500/80 gap-2 p-3 text-sm"
                              onClick={() => handleDeleteMember(member.user_id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Access Cards Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-blue-900/5 shadow-primary/10 transition-transform group-hover:scale-110">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">Администратор</h3>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase tracking-widest ring-1 ring-primary/20">Full Access</Badge>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Неограниченный уровень доступа ко всем проектам системы. Возможность управления сотрудниками, финансовой аналитикой и системными настройками безопасности.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-900/5 shadow-blue-500/10 transition-transform group-hover:scale-110">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">Менеджер</h3>
                <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-[10px] font-black uppercase tracking-widest px-2">Scoped Access</Badge>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Доступ только к назначенным проектам. Права на чтение, запись или экспорт настраиваются индивидуально для каждой маркетинговой единицы.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions List Legend */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 p-8 rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Детальные возможности менеджера</h4>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
          {[
            { label: 'Планы', desc: 'indicators' },
            { label: 'Данные', desc: 'daily records' },
            { label: 'Продажи', desc: 'analytics' },
            { label: 'Выручка', desc: 'financials' },
            { label: 'Лиды', desc: 'crm flow' },
            { label: 'Экспорт', desc: 'reporting' }
          ].map(p => (
            <div key={p.label} className="group cursor-default">
              <div className="flex items-center gap-2 text-slate-700 hover:text-primary transition-colors">
                <CheckCircle className="w-3.5 h-3.5 text-primary opacity-50 transition-opacity group-hover:opacity-100" />
                <span className="text-sm font-bold">{p.label}</span>
              </div>
              <p className="text-[10px] text-white/20 uppercase font-black tracking-tighter ml-5 group-hover:text-slate-500 transition-colors">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl bg-black/90 backdrop-blur-3xl border-white/5 shadow-2xl rounded-3xl p-0 overflow-hidden">
          <div className="p-8 border-b border-white/5 bg-white/5">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-2xl shadow-blue-900/5 shadow-blue-500/10">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl leading-tight">Права доступа</p>
                <p className="text-sm text-slate-500 font-medium">{selectedMemberForPermissions?.name}</p>
              </div>
            </DialogTitle>
          </div>

          <div className="p-0">
            {loadingPermissions ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-sm text-white/20 uppercase tracking-widest font-bold">Загрузка манифеста...</p>
              </div>
            ) : selectedMemberForPermissions?.projectAccess.length === 0 ? (
              <div className="text-center py-20">
                <Shield className="w-12 h-12 text-white/5 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Сначала назначьте проекты сотруднику</p>
              </div>
            ) : (
              <Tabs defaultValue={selectedMemberForPermissions?.projectAccess[0]} className="w-full">
                <TabsList className="w-full justify-start h-14 bg-white/5 border-b border-white/5 rounded-none p-2 gap-2 overflow-x-auto no-scrollbar">
                  {selectedMemberForPermissions?.projectAccess.map(projectId => {
                    const project = projects.find(p => p.id === projectId);
                    return (
                      <TabsTrigger
                        key={projectId}
                        value={projectId}
                        className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-tight data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-500 whitespace-nowrap"
                      >
                        {project?.name || 'Проект'}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <ScrollArea className="h-[450px]">
                  {selectedMemberForPermissions?.projectAccess.map(projectId => {
                    const perms = memberPermissions[projectId] || defaultPermissions;
                    return (
                      <TabsContent key={projectId} value={projectId} className="p-8 mt-0 space-y-4">
                        <div className="grid gap-3">
                          {[
                            { id: 'can_edit_plan', label: 'Редактирование плана', desc: 'Управление целевыми показателями KPI и планами продаж' },
                            { id: 'can_edit_daily_data', label: 'Редактирование данных', desc: 'Внесение ежедневных операционных данных и расходов' },
                            { id: 'can_view_sales', label: 'Просмотр продаж', desc: 'Доступ к детальной аналитике по закрытым сделкам' },
                            { id: 'can_view_revenue', label: 'Просмотр выручки', desc: 'Визуализация финансовых потоков и прибыльности' },
                            { id: 'can_manage_leads', label: 'Управление лидами', desc: 'Возможность изменять статусы и данные лидов в CRM' },
                            { id: 'can_export_data', label: 'Экспорт данных', desc: 'Выгрузка отчетов в Excel/PDF и внешний API экспорт' }
                          ].map(item => (
                            <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-slate-200 hover:bg-white/[0.07] transition-all group">
                              <div className="flex-1">
                                <Label htmlFor={`${projectId}-${item.id}`} className="text-base font-bold text-white group-hover:text-primary transition-colors cursor-pointer block">{item.label}</Label>
                                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                              </div>
                              <Switch
                                id={`${projectId}-${item.id}`}
                                checked={perms[item.id as keyof UserPermissions] as boolean}
                                onCheckedChange={() => handlePermissionToggle(projectId, item.id as keyof UserPermissions)}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    );
                  })}
                </ScrollArea>
              </Tabs>
            )}
          </div>

          <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-end gap-4 shadow-2xl">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)} className="h-12 bg-white/5 border-slate-200 text-white rounded-xl hover:bg-white/10 px-6">
              Отмена
            </Button>
            <Button onClick={handleSavePermissions} disabled={loadingPermissions} className="h-12 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-2xl shadow-blue-900/5 shadow-primary/20 px-10 font-bold tracking-tight">
              {loadingPermissions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
