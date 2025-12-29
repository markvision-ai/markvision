import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Search, 
  Trophy,
  Star,
  TrendingUp,
  DollarSign,
  Award,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  commission_rate: number;
  status: string;
  hire_date: string;
  xp_points: number;
  level: number;
}

interface StaffManagementProps {
  projectId: string;
}

export const StaffManagement = ({ projectId }: StaffManagementProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'manager',
    department: '',
    salary: 0,
    commission_rate: 0,
  });

  useEffect(() => {
    fetchStaff();
  }, [projectId]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      const { error } = await supabase.from('staff').insert([{
        project_id: projectId,
        ...newStaff,
      }]);

      if (error) throw error;
      
      toast.success('Сотрудник добавлен');
      setIsAddDialogOpen(false);
      setNewStaff({
        name: '',
        email: '',
        phone: '',
        position: 'manager',
        department: '',
        salary: 0,
        commission_rate: 0,
      });
      fetchStaff();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Ошибка при добавлении сотрудника');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelBadge = (level: number) => {
    if (level >= 10) return { color: 'bg-yellow-500/10 text-yellow-500', label: 'Легенда' };
    if (level >= 7) return { color: 'bg-purple-500/10 text-purple-500', label: 'Эксперт' };
    if (level >= 4) return { color: 'bg-blue-500/10 text-blue-500', label: 'Профи' };
    return { color: 'bg-green-500/10 text-green-500', label: 'Новичок' };
  };

  const totalSalary = staff.reduce((sum, s) => sum + (s.salary || 0), 0);
  const activeStaff = staff.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Персонал
          </h2>
          <p className="text-muted-foreground">Управление командой и мотивацией</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить сотрудника
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold">{activeStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <DollarSign className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ФОТ/мес</p>
                <p className="text-2xl font-bold">{totalSalary.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Топ уровень</p>
                <p className="text-2xl font-bold">{Math.max(...staff.map(s => s.level || 1), 1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Список</TabsTrigger>
          <TabsTrigger value="leaderboard">Лидерборд</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск сотрудников..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Должность</TableHead>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Уровень</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Зарплата</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Сотрудники не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((member) => {
                      const levelBadge = getLevelBadge(member.level || 1);
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {member.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{member.position}</TableCell>
                          <TableCell>{member.department || '—'}</TableCell>
                          <TableCell>
                            <Badge className={levelBadge.color}>
                              <Star className="w-3 h-3 mr-1" />
                              Ур. {member.level || 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{(member.xp_points || 0).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>{(member.salary || 0).toLocaleString()} ₽</TableCell>
                          <TableCell>
                            <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                              {member.status === 'active' ? 'Активен' : 'Неактивен'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Рейтинг сотрудников
              </CardTitle>
              <CardDescription>Топ сотрудников по XP и достижениям</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...filteredStaff]
                  .sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0))
                  .slice(0, 10)
                  .map((member, index) => {
                    const levelBadge = getLevelBadge(member.level || 1);
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent border-yellow-500/20' : 'bg-card'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-400 text-gray-950' :
                          index === 2 ? 'bg-orange-500 text-orange-950' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                        </div>
                        <Badge className={levelBadge.color}>
                          {levelBadge.label}
                        </Badge>
                        <div className="text-right">
                          <p className="font-bold text-primary">{(member.xp_points || 0).toLocaleString()} XP</p>
                          <p className="text-sm text-muted-foreground">Уровень {member.level || 1}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="Иван Иванов"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+7 999 123-45-67"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Должность</Label>
                <Input
                  value={newStaff.position}
                  onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                  placeholder="Менеджер"
                />
              </div>
              <div className="space-y-2">
                <Label>Отдел</Label>
                <Input
                  value={newStaff.department}
                  onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                  placeholder="Продажи"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Зарплата (₽)</Label>
                <Input
                  type="number"
                  value={newStaff.salary}
                  onChange={(e) => setNewStaff({ ...newStaff, salary: Number(e.target.value) })}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Комиссия (%)</Label>
                <Input
                  type="number"
                  value={newStaff.commission_rate}
                  onChange={(e) => setNewStaff({ ...newStaff, commission_rate: Number(e.target.value) })}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddStaff} disabled={!newStaff.name}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
