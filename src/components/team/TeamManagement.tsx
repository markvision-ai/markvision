import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Check, 
  X, 
  Copy,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager';
  status: 'active' | 'pending' | 'inactive';
  projectAccess: string[];
  createdAt: string;
}

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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Алексей Иванов',
      email: 'alexey@company.kz',
      role: 'admin',
      status: 'active',
      projectAccess: ['project1', 'project2', 'project3'],
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      name: 'Мария Петрова',
      email: 'maria@company.kz',
      role: 'manager',
      status: 'active',
      projectAccess: ['project1'],
      createdAt: '2025-02-20',
    },
    {
      id: '3',
      name: 'Сергей Козлов',
      email: 'sergey@company.kz',
      role: 'manager',
      status: 'pending',
      projectAccess: ['project2'],
      createdAt: '2025-03-10',
    },
  ]);

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

  const handleInvite = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Заполните имя и email');
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      status: 'pending',
      projectAccess: newMember.role === 'admin' ? projects.map(p => p.id) : newMember.projectAccess,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTeamMembers(prev => [...prev, member]);
    toast.success('Приглашение отправлено', {
      description: `Логин: ${generatedCredentials.login}, Пароль: ${generatedCredentials.password}`,
    });
    setIsInviteOpen(false);
    setNewMember({ name: '', email: '', role: 'manager', projectAccess: [] });
    setGeneratedCredentials({ login: '', password: '' });
  };

  const handleDeleteMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    toast.success('Сотрудник удалён');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Управление командой</h2>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} сотрудников
          </p>
        </div>
        
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
                  <p className="text-sm font-medium text-muted-foreground">Автоматически сгенерированные данные:</p>
                  
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
                Отправить приглашение
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {teamMembers.map(member => (
              <tr key={member.id} className="hover:bg-secondary/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">{getRoleBadge(member.role)}</td>
                <td className="p-4">{getStatusBadge(member.status)}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {member.role === 'admin' ? (
                      <Badge variant="outline" className="text-xs">Все проекты</Badge>
                    ) : (
                      member.projectAccess.slice(0, 2).map(projectId => {
                        const project = projects.find(p => p.id === projectId);
                        return project ? (
                          <Badge key={projectId} variant="outline" className="text-xs">
                            {project.name.slice(0, 15)}...
                          </Badge>
                        ) : null;
                      })
                    )}
                    {member.projectAccess.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.projectAccess.length - 2}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{member.createdAt}</td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        Изменить права
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
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
