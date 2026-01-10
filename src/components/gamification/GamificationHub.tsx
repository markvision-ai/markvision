import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star,
  Medal,
  Zap,
  Target,
  TrendingUp,
  Award,
  Crown,
  Flame,
  Gift,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Staff {
  id: string;
  name: string;
  position: string;
  xp_points: number;
  level: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

interface GamificationHubProps {
  projectId: string;
}

const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6500];

const defaultAchievements = [
  { name: 'Первая сделка', icon: '🎯', description: 'Закройте первую сделку', condition: 1 },
  { name: 'Продажник', icon: '💰', description: '10 успешных сделок', condition: 10 },
  { name: 'Мастер продаж', icon: '🏆', description: '50 успешных сделок', condition: 50 },
  { name: 'Легенда', icon: '👑', description: '100 успешных сделок', condition: 100 },
  { name: 'Быстрый старт', icon: '🚀', description: '5 сделок за неделю', condition: 5 },
  { name: 'Миллионер', icon: '💎', description: 'Выручка 1 000 000 ₽', condition: 1000000 },
];

export const GamificationHub = ({ projectId }: GamificationHubProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [staffRes, achievementsRes] = await Promise.all([
        supabase
          .from('staff')
          .select('id, name, position, xp_points, level')
          .eq('project_id', projectId)
          .order('xp_points', { ascending: false }),
        supabase
          .from('achievements')
          .select('*')
          .eq('project_id', projectId),
      ]);

      setStaff(staffRes.data || []);
      setAchievements(achievementsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextLevel = (xp: number) => {
    const nextLevelIndex = levelThresholds.findIndex(t => t > xp);
    return nextLevelIndex > 0 ? nextLevelIndex : levelThresholds.length;
  };

  const getProgressToNextLevel = (xp: number) => {
    const currentLevelIndex = levelThresholds.findIndex(t => t > xp) - 1;
    if (currentLevelIndex < 0) return 100;
    const currentThreshold = levelThresholds[currentLevelIndex] || 0;
    const nextThreshold = levelThresholds[currentLevelIndex + 1] || xp;
    return ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: Crown, color: 'text-yellow-500 bg-yellow-500/10', label: '1st' };
    if (index === 1) return { icon: Medal, color: 'text-gray-400 bg-gray-400/10', label: '2nd' };
    if (index === 2) return { icon: Award, color: 'text-orange-500 bg-orange-500/10', label: '3rd' };
    return { icon: Star, color: 'text-muted-foreground bg-muted', label: `${index + 1}th` };
  };

  const topPerformer = staff[0];
  const totalXP = staff.reduce((sum, s) => sum + (s.xp_points || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Геймификация
          </h2>
          <p className="text-muted-foreground">Мотивация и достижения команды</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Лидер</p>
                <p className="text-lg font-bold truncate">{topPerformer?.name || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего XP</p>
                <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Участников</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ачивок</p>
                <p className="text-2xl font-bold">{achievements.length || defaultAchievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Лидерборд</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="rewards">Награды</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Рейтинг команды
              </CardTitle>
              <CardDescription>Топ сотрудников по очкам опыта</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Добавьте сотрудников в разделе "Персонал"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {staff.slice(0, 10).map((member, index) => {
                    const rank = getRankBadge(index);
                    const progress = getProgressToNextLevel(member.xp_points || 0);
                    const RankIcon = rank.icon;
                    
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent border border-primary/10' : 'bg-muted/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rank.color}`}>
                          <RankIcon className="w-5 h-5" />
                        </div>
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {member.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{member.name}</p>
                            <Badge variant="outline" className="text-xs">
                              Ур. {member.level || 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{member.position}</p>
                          <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {(member.xp_points || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Достижения
              </CardTitle>
              <CardDescription>Разблокируйте ачивки за выполнение целей</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(achievements.length > 0 ? achievements : defaultAchievements.map((a, i) => ({
                  id: String(i),
                  ...a,
                  xp_reward: a.condition * 10,
                  condition_type: 'sales',
                  condition_value: a.condition,
                }))).map((achievement: any) => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-primary/10 text-primary">
                            <Zap className="w-3 h-3 mr-1" />
                            +{achievement.xp_reward} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Магазин наград
              </CardTitle>
              <CardDescription>Обменивайте XP на реальные призы</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Дополнительный выходной', xp: 5000, icon: '🏖️' },
                  { name: 'Сертификат на 5000 ₽', xp: 10000, icon: '🎁' },
                  { name: 'Повышение зарплаты', xp: 25000, icon: '💰' },
                  { name: 'Премиальная подписка', xp: 3000, icon: '⭐' },
                  { name: 'Обед с руководством', xp: 2000, icon: '🍽️' },
                  { name: 'Кастомный титул', xp: 1000, icon: '🏅' },
                ].map((reward, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{reward.icon}</span>
                      <div>
                        <p className="font-semibold">{reward.name}</p>
                        <p className="text-sm text-primary font-medium">{reward.xp.toLocaleString()} XP</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      Обменять
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
