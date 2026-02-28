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
        <Alert className="bg-amber-500/5 backdrop-blur-3xl border border-amber-500/20 shadow-interstellar">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Ограниченный доступ</AlertTitle>
          <AlertDescription className="text-amber-500/60 text-[10px] uppercase font-bold tracking-tight">
            Только администраторы могут управлять командой. Вам доступен только просмотр списка сотрудников.
          </AlertDescription>
        </Alert>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-8 py-2">
        <div>
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 uppercase tracking-tight">
            Управление командой
          </h2>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {activeMembers.length} активных сотрудников в системе
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isInviteOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsInviteOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] px-8 font-black uppercase tracking-widest text-[10px] gap-3">
                <UserPlus className="w-4 h-4" />
                Добавить сотрудника
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[#020617]/90 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-[32px] p-0 overflow-hidden">
              <div className="p-10 border-b border-white/5 bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                <DialogTitle className="text-2xl font-black text-white flex items-center gap-4 relative z-10 uppercase tracking-tight">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  {createdCredentials ? 'Сотрудник создан' : 'Добавить сотрудника'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-3 font-medium text-[10px] uppercase tracking-widest opacity-60 relative z-10">
                  {createdCredentials ? 'Пользователь успешно зарегистрирован' : 'Введите данные нового участника команды'}
                </DialogDescription>
              </div>

              <ScrollArea className="max-h-[70vh]">
                {createdCredentials ? (
                  <div className="p-10 space-y-8">
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-inner">
                        <CheckCircle className="w-12 h-12 text-blue-400" />
                      </div>
                      <p className="text-xl font-black text-white uppercase tracking-tight">Выполнено успешно</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 shadow-inner p-8 rounded-[24px] space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Email:</span>
                        <div className="flex items-center gap-3">
                          <code className="bg-white/5 px-3 py-1.5 rounded-lg text-sm font-mono text-blue-400 border border-white/5">{createdCredentials.email}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            onClick={() => copyToClipboard(createdCredentials.email, 'Email')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Пароль:</span>
                        <div className="flex items-center gap-3">
                          <code className="bg-white/5 px-3 py-1.5 rounded-lg text-sm font-mono text-blue-400 border border-white/5">{createdCredentials.password}</code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            onClick={() => copyToClipboard(createdCredentials.password, 'Пароль')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {createdCredentials.emailSent ? (
                      <div className="flex items-center gap-3 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-400 justify-center">
                        <Mail className="w-4 h-4 shrink-0" />
                        Данные отправлены на email сотрудника
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10px] font-black uppercase tracking-widest text-amber-500 justify-center">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Сохраните эти данные и передайте сотруднику
                      </div>
                    )}

                    <Button onClick={handleCloseDialog} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
                      Закрыть и продолжить
                    </Button>
                  </div>
                ) : (
                  <div className="p-10 space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Полное имя</Label>
                        <Input
                          placeholder="Иван Петров"
                          value={newMember.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-black uppercase tracking-widest text-[10px]"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Email адрес</Label>
                        <Input
                          type="email"
                          placeholder="email@company.kz"
                          value={newMember.email}
                          onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                          className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-black uppercase tracking-widest text-[10px]"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Пароль доступа</Label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Минимум 6 символов"
                              value={newMember.password}
                              onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-foreground rounded-2xl focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-black uppercase tracking-widest text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGeneratePassword}
                            className="h-14 w-14 bg-white/5 border-white/10 text-foreground rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all shrink-0 p-0"
                          >
                            <Settings2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Роль в системе</Label>
                        <Select
                          value={newMember.role}
                          onValueChange={(value: 'admin' | 'manager') => setNewMember(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl focus:ring-blue-500/40 transition-all font-black uppercase tracking-widest text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#020617] border-white/10 text-foreground rounded-2xl shadow-interstellar">
                            <SelectItem value="admin" className="font-black uppercase tracking-widest text-[10px] focus:bg-white/5 focus:text-white rounded-xl py-3">Администратор (Полный доступ)</SelectItem>
                            <SelectItem value="manager" className="font-black uppercase tracking-widest text-[10px] focus:bg-white/5 focus:text-white rounded-xl py-3">Менеджер (Ограниченный доступ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newMember.role === 'manager' && (
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 ml-1">Доступ к проектам</Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto bg-white/5 border border-white/5 rounded-[24px] p-5 custom-scrollbar">
                            {projects.map(project => (
                              <label key={project.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                                <Checkbox
                                  checked={newMember.projectAccess.includes(project.id)}
                                  onCheckedChange={() => handleProjectToggle(project.id)}
                                  className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">{project.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                        <Checkbox
                          id="sendEmail"
                          checked={sendEmailOnCreate}
                          onCheckedChange={(checked) => setSendEmailOnCreate(checked === true)}
                          className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                        />
                        <label htmlFor="sendEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-white transition-colors">
                          Отправить данные для входа на email
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={handleCloseDialog} className="flex-1 h-14 bg-white/5 border-white/10 text-foreground rounded-2xl hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px]">
                        Отмена
                      </Button>
                      <Button onClick={handleCreateUser} disabled={isCreating} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98]">
                        {isCreating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-3" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-3" />
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
      <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Сотрудник</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Роль</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Статус</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Проекты</th>
                <th className="p-8 text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Дата добавления</th>
                {isAdmin && <th className="p-8 text-right text-[10px] uppercase tracking-widest font-black text-muted-foreground opacity-60">Действия</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeMembers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-white/10" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Нет зарегистрированных сотрудников</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeMembers.map(member => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/5 group-hover:scale-105 transition-transform duration-500">
                          <span className="text-lg font-black text-blue-400">
                            {(member.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{member.name || 'Без имени'}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">{member.email || 'Нет email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      {isAdmin ? (
                        <Select
                          value={member.role}
                          onValueChange={(value: 'admin' | 'manager') => handleRoleChange(member.user_id, value)}
                        >
                          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-foreground rounded-xl h-12 transition-all font-black uppercase tracking-widest text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#020617] border-white/10 text-foreground rounded-[20px] shadow-interstellar">
                            <SelectItem value="admin" className="font-black uppercase tracking-widest text-[10px] focus:bg-white/5 focus:text-white rounded-xl py-3">Администратор</SelectItem>
                            <SelectItem value="manager" className="font-black uppercase tracking-widest text-[10px] focus:bg-white/5 focus:text-white rounded-xl py-3">Менеджер</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex">
                          {member.role === 'admin'
                            ? <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1 font-black uppercase tracking-widest text-[10px] shadow-inner">Админ</Badge>
                            : <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground px-3 py-1 font-black uppercase tracking-widest text-[10px]">Менеджер</Badge>}
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-2 h-2 rounded-full shadow-[0_0_12px_rgba(var(--blue-500),0.4)]",
                          member.status === 'active' ? "bg-blue-500 animate-pulse" :
                            member.status === 'pending' ? "bg-amber-500" :
                              "bg-white/20"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.1em]",
                          member.status === 'active' ? "text-blue-400" :
                            member.status === 'pending' ? "text-amber-500" :
                              "text-muted-foreground/40"
                        )}>
                          {member.status === 'active' ? 'Активен' :
                            member.status === 'pending' ? 'Ожидает' : 'Неактивен'}
                        </span>
                      </div>
                    </td>
                    <td className="p-8">
                      {editingMember === member.user_id ? (
                        <div className="space-y-4 min-w-[200px]">
                          <div className="max-h-32 overflow-y-auto space-y-2 p-3 bg-white/5 rounded-[20px] border border-white/5 custom-scrollbar shadow-inner">
                            {projects.map(project => (
                              <label key={project.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer text-[10px] group/p transition-colors">
                                <Checkbox
                                  checked={editProjectAccess.includes(project.id)}
                                  onCheckedChange={() => handleEditProjectToggle(project.id)}
                                  className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/p:text-white transition-colors">{project.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveProjectAccess(member.user_id)} className="flex-1 bg-blue-600 h-10 rounded-xl font-black uppercase tracking-widest text-[10px]">
                              Сохранить
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingMember(null)} className="h-10 rounded-xl text-muted-foreground transition-all font-black uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10">
                              Отмена
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 max-w-[240px]">
                          {member.role === 'admin' ? (
                            <Badge variant="outline" className="bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md shadow-inner">
                              Все проекты
                            </Badge>
                          ) : member.projectAccess.length === 0 ? (
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">Нет доступа</span>
                          ) : (
                            <>
                              {member.projectAccess.slice(0, 2).map(projectId => {
                                const project = projects.find(p => p.id === projectId);
                                return project ? (
                                  <Badge key={projectId} variant="outline" className="bg-white/5 border border-white/10 text-muted-foreground text-[9px] font-black uppercase tracking-tight px-2.5 py-1 rounded-md hover:border-white/20 transition-all">
                                    {project.name.length > 20 ? project.name.slice(0, 20) + '...' : project.name}
                                  </Badge>
                                ) : null;
                              })}
                              {member.projectAccess.length > 2 && (
                                <Badge variant="outline" className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black px-2.5 py-1 rounded-md shadow-inner">
                                  +{member.projectAccess.length - 2}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-8">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{member.createdAt}</p>
                    </td>
                    {isAdmin && (
                      <td className="p-8 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-2xl transition-all">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#020617] border-white/10 p-2 min-w-[220px] rounded-[24px] shadow-interstellar">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingMember(member.user_id);
                                setEditProjectAccess(member.projectAccess);
                              }}
                              className="rounded-xl focus:bg-white/5 focus:text-white gap-3 p-4 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <Shield className="w-4 h-4 text-blue-400" />
                              Изменить проекты
                            </DropdownMenuItem>
                            {member.role === 'manager' && member.projectAccess.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => handleOpenPermissionsDialog(member)}
                                className="rounded-xl focus:bg-white/5 focus:text-white gap-3 p-4 text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                <Settings2 className="w-4 h-4 text-blue-400" />
                                Настроить права
                              </DropdownMenuItem>
                            )}
                            <div className="h-px bg-white/5 my-2" />
                            <DropdownMenuItem
                              className="rounded-xl focus:bg-red-500/10 focus:text-red-500 text-red-500/80 gap-3 p-4 text-[10px] font-black uppercase tracking-widest transition-all"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8">
        <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-10 rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none -mr-24 -mt-24 group-hover:bg-blue-600/20 transition-all duration-700" />
          <div className="flex items-start gap-8 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Администратор</h3>
                <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 shadow-inner">Full Access</Badge>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight opacity-60">
                Неограниченный уровень доступа ко всем проектам системы. Возможность управления сотрудниками, финансовой аналитикой и системными настройками безопасности.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-10 rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none -mr-24 -mt-24 group-hover:bg-indigo-600/20 transition-all duration-700" />
          <div className="flex items-start gap-8 relative z-10 transition-transform duration-500 group-hover:translate-x-1">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Менеджер</h3>
                <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1">Scoped Access</Badge>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight opacity-60">
                Доступ только к назначенным проектам. Права на чтение, запись или экспорт настраиваются индивидуально для каждой маркетинговой единицы.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions List Legend */}
      <div className="bg-[#020617]/40 backdrop-blur-3xl border border-white/10 shadow-interstellar p-10 rounded-[40px] mx-8">
        <div className="flex items-center gap-6 mb-8">
          <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Детальные возможности менеджера</h4>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8">
          {[
            { label: 'Планы', desc: 'indicators' },
            { label: 'Данные', desc: 'daily records' },
            { label: 'Продажи', desc: 'analytics' },
            { label: 'Выручка', desc: 'financials' },
            { label: 'Лиды', desc: 'crm flow' },
            { label: 'Экспорт', desc: 'reporting' }
          ].map(p => (
            <div key={p.label} className="group cursor-default space-y-2">
              <div className="flex items-center gap-3 text-muted-foreground hover:text-white transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-blue-400/40 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-tighter ml-7 text-muted-foreground/20 group-hover:text-blue-400/40 transition-colors">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#020617]/90 backdrop-blur-3xl border-white/10 shadow-interstellar rounded-[32px] p-0 overflow-hidden">
          <div className="p-10 border-b border-white/5 bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            <DialogTitle className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-[20px] bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-105 transition-all">
                <Settings2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-2xl font-black text-white uppercase tracking-tight">Права доступа</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">{selectedMemberForPermissions?.name}</p>
              </div>
            </DialogTitle>
          </div>

          <div className="p-0">
            {loadingPermissions ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="w-16 h-16 rounded-full border-2 border-blue-500/10 border-t-blue-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Синхронизация манифеста...</p>
              </div>
            ) : selectedMemberForPermissions?.projectAccess.length === 0 ? (
              <div className="text-center py-24 space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                  <Shield className="w-10 h-10 text-white/10" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">Сначала назначьте проекты сотруднику</p>
              </div>
            ) : (
              <Tabs defaultValue={selectedMemberForPermissions?.projectAccess[0]} className="w-full">
                <TabsList className="w-full justify-start h-16 bg-[#020617]/40 border-b border-white/5 rounded-none p-1.5 gap-2 overflow-x-auto no-scrollbar backdrop-blur-3xl">
                  {selectedMemberForPermissions?.projectAccess.map(projectId => {
                    const project = projects.find(p => p.id === projectId);
                    return (
                      <TabsTrigger
                        key={projectId}
                        value={projectId}
                        className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white text-muted-foreground whitespace-nowrap border border-transparent data-[state=active]:border-white/5 data-[state=active]:shadow-interstellar transition-all"
                      >
                        {project?.name || 'Проект'}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <ScrollArea className="h-[480px]">
                  {selectedMemberForPermissions?.projectAccess.map(projectId => {
                    const perms = memberPermissions[projectId] || defaultPermissions;
                    return (
                      <TabsContent key={projectId} value={projectId} className="p-10 mt-0 space-y-4">
                        <div className="grid gap-4">
                          {[
                            { id: 'can_edit_plan', label: 'Редактирование плана', desc: 'Управление целевыми показателями KPI и планами продаж' },
                            { id: 'can_edit_daily_data', label: 'Редактирование данных', desc: 'Внесение ежедневных операционных данных и расходов' },
                            { id: 'can_view_sales', label: 'Просмотр продаж', desc: 'Доступ к детальной аналитике по закрытым сделкам' },
                            { id: 'can_view_revenue', label: 'Просмотр выручки', desc: 'Визуализация финансовых потоков и прибыльности' },
                            { id: 'can_manage_leads', label: 'Управление лидами', desc: 'Возможность изменять статусы и данные лидов в CRM' },
                            { id: 'can_export_data', label: 'Экспорт данных', desc: 'Выгрузка отчетов в Excel/PDF и внешний API экспорт' }
                          ].map(item => (
                            <div key={item.id} className="flex items-center justify-between p-6 rounded-[24px] bg-white/5 border border-white/5 hover:border-blue-500/20 hover:bg-white/[0.08] transition-all group/perm">
                              <div className="flex-1">
                                <Label htmlFor={`${projectId}-${item.id}`} className="text-sm font-black text-white group-hover/perm:text-blue-400 transition-colors cursor-pointer block uppercase tracking-tight">{item.label}</Label>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 opacity-60 leading-relaxed">{item.desc}</p>
                              </div>
                              <Switch
                                id={`${projectId}-${item.id}`}
                                checked={perms[item.id as keyof UserPermissions] as boolean}
                                onCheckedChange={() => handlePermissionToggle(projectId, item.id as keyof UserPermissions)}
                                className="data-[state=checked]:bg-blue-600"
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

          <div className="p-10 border-t border-white/5 bg-[#020617]/40 backdrop-blur-3xl flex justify-end gap-6 shadow-interstellar">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)} className="h-14 bg-white/5 border-white/10 text-foreground rounded-2xl hover:bg-white/10 px-8 font-black uppercase tracking-widest text-[10px] transition-all">
              Отмена
            </Button>
            <Button onClick={handleSavePermissions} disabled={loadingPermissions} className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 px-12 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] gap-3 min-w-[200px]">
              {loadingPermissions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
