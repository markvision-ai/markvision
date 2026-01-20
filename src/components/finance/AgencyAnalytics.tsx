import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Users,
  TrendingUp,
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
}

interface AgencyFinance {
  id?: string;
  project_id: string;
  project_name?: string;
  month: string;
  tariff: 'Lite' | 'Pro' | 'Legacy' | 'Custom';
  package_cost: number;
  team_members: string[];
  team_costs: number;
  additional_costs: number;
}

const TARIFFS = ['Lite', 'Pro', 'Legacy', 'Custom'] as const;

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

export const AgencyAnalytics = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [finances, setFinances] = useState<AgencyFinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  // Fetch all projects and their finances
  const fetchData = useCallback(async () => {
    try {
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (projectsError) throw projectsError;

      // Fetch finances for current month
      const { data: financesData, error: financesError } = await supabase
        .from('agency_finances')
        .select('*')
        .eq('month', currentMonth);

      if (financesError) throw financesError;

      setProjects(projectsData || []);

      // Merge projects with finances
      const mergedFinances: AgencyFinance[] = (projectsData || []).map(project => {
        const existingFinance = financesData?.find(f => f.project_id === project.id);
        const tariff = (existingFinance?.tariff || 'Pro') as 'Lite' | 'Pro' | 'Legacy' | 'Custom';
        return {
          id: existingFinance?.id,
          project_id: project.id,
          project_name: project.name,
          month: currentMonth,
          tariff,
          package_cost: existingFinance?.package_cost || 0,
          team_members: existingFinance?.team_members || [],
          team_costs: existingFinance?.team_costs || 0,
          additional_costs: existingFinance?.additional_costs || 0,
        };
      });

      setFinances(mergedFinances);
    } catch (error) {
      console.error('Error fetching agency data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('agency-finances-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agency_finances'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Update finance with optimistic UI
  const updateFinance = useCallback(async (
    projectId: string, 
    field: keyof AgencyFinance, 
    value: any
  ) => {
    const oldFinances = [...finances];
    
    // Optimistic update
    setFinances(prev => prev.map(f => 
      f.project_id === projectId ? { ...f, [field]: value } : f
    ));

    setSavingIds(prev => new Set(prev).add(projectId));

    try {
      const financeData = finances.find(f => f.project_id === projectId);
      if (!financeData) return;

      const upsertData = {
        project_id: projectId,
        month: currentMonth,
        tariff: field === 'tariff' ? value : financeData.tariff,
        package_cost: field === 'package_cost' ? value : financeData.package_cost,
        team_members: field === 'team_members' ? value : financeData.team_members,
        team_costs: field === 'team_costs' ? value : financeData.team_costs,
        additional_costs: field === 'additional_costs' ? value : financeData.additional_costs,
      };

      const { error } = await supabase
        .from('agency_finances')
        .upsert(upsertData, { onConflict: 'project_id,month' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating finance:', error);
      toast.error('Ошибка сохранения');
      // Rollback
      setFinances(oldFinances);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  }, [finances, currentMonth]);

  // Calculate net profit for a project
  const calculateNetProfit = (finance: AgencyFinance): number => {
    return finance.package_cost - finance.team_costs - finance.additional_costs;
  };

  // Calculate totals
  const totals = useMemo(() => {
    return finances.reduce((acc, f) => ({
      package_cost: acc.package_cost + f.package_cost,
      team_costs: acc.team_costs + f.team_costs,
      additional_costs: acc.additional_costs + f.additional_costs,
      net_profit: acc.net_profit + calculateNetProfit(f),
    }), { package_cost: 0, team_costs: 0, additional_costs: 0, net_profit: 0 });
  }, [finances]);

  // Handle team members input
  const handleTeamChange = (projectId: string, value: string) => {
    const members = value.split(',').map(m => m.trim()).filter(Boolean);
    updateFinance(projectId, 'team_members', members);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/20">
              <Building2 className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Аналитика Агентства
                <Sparkles className="w-4 h-4 text-violet-400" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'LLLL yyyy', { locale: ru })} · {finances.length} проектов
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Доход с пакетов</p>
                <p className="text-xl font-bold">{formatCurrency(totals.package_cost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Users className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Расходы на команду</p>
                <p className="text-xl font-bold">{formatCurrency(totals.team_costs)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingUp className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Доп. расходы</p>
                <p className="text-xl font-bold">{formatCurrency(totals.additional_costs)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-400/80">Чистая прибыль</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.net_profit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Проект
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-28">
                    Тариф
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36">
                    Стоимость ₸
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium min-w-48">
                    Команда
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36">
                    Расходы ₸
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36">
                    Доп. ₸
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36 text-right">
                    Прибыль
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finances.map((finance) => {
                  const netProfit = calculateNetProfit(finance);
                  const isSaving = savingIds.has(finance.project_id);
                  
                  return (
                    <TableRow 
                      key={finance.project_id} 
                      className="border-border/30 hover:bg-muted/5 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isSaving && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                          <span className="truncate max-w-[200px]">{finance.project_name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={finance.tariff}
                          onValueChange={(value) => updateFinance(finance.project_id, 'tariff', value)}
                        >
                          <SelectTrigger className="h-8 bg-background/50 border-border/50 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TARIFFS.map(tariff => (
                              <SelectItem key={tariff} value={tariff}>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    tariff === 'Pro' ? 'border-violet-500/50 text-violet-400' :
                                    tariff === 'Legacy' ? 'border-amber-500/50 text-amber-400' :
                                    tariff === 'Custom' ? 'border-emerald-500/50 text-emerald-400' :
                                    'border-border/50'
                                  }`}
                                >
                                  {tariff}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          value={finance.package_cost || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFinances(prev => prev.map(f => 
                              f.project_id === finance.project_id ? { ...f, package_cost: value } : f
                            ));
                          }}
                          onBlur={(e) => updateFinance(finance.project_id, 'package_cost', parseFloat(e.target.value) || 0)}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          value={finance.team_members.join(', ')}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFinances(prev => prev.map(f => 
                              f.project_id === finance.project_id 
                                ? { ...f, team_members: value.split(',').map(m => m.trim()) } 
                                : f
                            ));
                          }}
                          onBlur={(e) => handleTeamChange(finance.project_id, e.target.value)}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="Алия SMM, Иван n8n"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          value={finance.team_costs || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFinances(prev => prev.map(f => 
                              f.project_id === finance.project_id ? { ...f, team_costs: value } : f
                            ));
                          }}
                          onBlur={(e) => updateFinance(finance.project_id, 'team_costs', parseFloat(e.target.value) || 0)}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          value={finance.additional_costs || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setFinances(prev => prev.map(f => 
                              f.project_id === finance.project_id ? { ...f, additional_costs: value } : f
                            ));
                          }}
                          onBlur={(e) => updateFinance(finance.project_id, 'additional_costs', parseFloat(e.target.value) || 0)}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <span className={`font-semibold text-sm ${
                          netProfit >= 0 
                            ? 'text-emerald-400' 
                            : 'text-red-400'
                        }`}>
                          {formatCurrency(netProfit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/10 border-t-2 border-border/50">
                  <TableCell className="font-bold text-foreground">
                    ИТОГО
                  </TableCell>
                  <TableCell />
                  <TableCell className="font-semibold">
                    {formatCurrency(totals.package_cost)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="font-semibold text-orange-400">
                    {formatCurrency(totals.team_costs)}
                  </TableCell>
                  <TableCell className="font-semibold text-red-400">
                    {formatCurrency(totals.additional_costs)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-lg ${
                      totals.net_profit >= 0 
                        ? 'text-emerald-400' 
                        : 'text-red-400'
                    }`}>
                      {formatCurrency(totals.net_profit)}
                    </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
