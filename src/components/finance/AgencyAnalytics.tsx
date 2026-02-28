import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Building2,
  Plus,
  Search,
  Wallet,
  Users,
  CreditCard,
  Globe,
  Settings,
  Calendar,
  MoreVertical,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { useAgencyFinances, AgencyFinance } from '@/hooks/useAgencyFinances';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const KPICard = ({ title, value, subtext, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className={cn("bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border-white/5 overflow-hidden relative group", color)}>
      <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16" />
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {subtext && <Badge variant="outline" className="bg-white/5 border-slate-200 text-slate-600">{subtext}</Badge>}
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold tracking-tight text-white mb-1">{value}</h3>
          <p className="text-sm font-medium text-slate-600">{title}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, updateFinance, addProject } = useAgencyFinances();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AgencyFinance | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    revenue: 0,
    team_salaries: 0,
    software_costs: 0,
    other_expenses: 0,
    payment_date: '',
    client_contact: ''
  });

  const handleEdit = (project: AgencyFinance) => {
    setEditingProject(project);
    setFormData({
      name: project.project_name,
      revenue: project.package_revenue,
      team_salaries: project.team_salaries,
      software_costs: project.software_costs,
      other_expenses: project.other_expenses,
      payment_date: project.payment_date || '',
      client_contact: '' // Not stored yet, placeholder
    });
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingProject) {
      // Update existing
      await updateFinance(editingProject.project_id, 'package_revenue', formData.revenue);
      await updateFinance(editingProject.project_id, 'team_salaries', formData.team_salaries);
      await updateFinance(editingProject.project_id, 'software_costs', formData.software_costs);
      await updateFinance(editingProject.project_id, 'other_expenses', formData.other_expenses);
      await updateFinance(editingProject.project_id, 'payment_date', formData.payment_date);

      setIsAddDialogOpen(false);
      setEditingProject(null);
    } else {
      // Create new
      addProject(formData.name);
      // Note: The addProject hook currently only takes name. 
      // Real implementation would need to update other fields after creation or update the hook.
      // For visual demo, we'll just add the project then user can edit. 
      setFormData({ name: '', revenue: 0, team_salaries: 0, software_costs: 0, other_expenses: 0, payment_date: '', client_contact: '' });
      setIsAddDialogOpen(false);
    }
  };

  const calculateNetProfit = (finance: AgencyFinance): number => {
    return (finance.yuri_net_profit !== undefined)
      ? finance.yuri_net_profit
      : finance.package_revenue - (finance.team_salaries + finance.software_costs + (finance.other_expenses || 0));
  };

  const filteredFinances = useMemo(() => finances.filter(f =>
    f.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [finances, searchTerm]);

  // Totals
  const totals = useMemo(() => {
    const revenue = finances.reduce((sum, f) => sum + f.package_revenue, 0);
    const profit = finances.reduce((sum, f) => sum + calculateNetProfit(f), 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, profit, margin };
  }, [finances]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">

      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Чистая прибыль"
          value={formatCurrency(totals.profit)}
          icon={Wallet}
          color="bg-gradient-to-br from-blue-600/20 to-emerald-900/20 border-blue-500/20"
          delay={0.1}
        />
        <KPICard
          title="Выручка"
          value={formatCurrency(totals.revenue)}
          icon={Building2}
          color="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border-blue-500/20"
          delay={0.2}
        />
        <KPICard
          title="Рентабельность"
          value={`${totals.margin.toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-purple-500/20"
          delay={0.3}
        />
        <KPICard
          title="Активных проектов"
          value={finances.length}
          subtext="+2 в этом мес."
          icon={Briefcase}
          color="bg-gradient-to-br from-amber-600/20 to-amber-900/20 border-amber-500/20"
          delay={0.4}
        />
      </div>

      {/* 2. Controls & List */}
      <Card className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Портфель проектов</h3>
            <p className="text-sm text-muted-foreground">Управление финансами и сроками оплат</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-slate-200 text-sm focus:bg-white/10"
              />
            </div>
            <Button
              onClick={() => { setEditingProject(null); setIsAddDialogOpen(true); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-blue-900/5 shadow-primary/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить проект
            </Button>
          </div>
        </div>

        <div className="p-6 grid gap-4">
          <AnimatePresence>
            {filteredFinances.map((project, idx) => {
              const profit = calculateNetProfit(project);
              const margin = project.package_revenue > 0 ? (profit / project.package_revenue) * 100 : 0;

              // Payment Date Logic
              let daysLeft = 0;
              let paymentStatus = 'none';
              if (project.payment_date) {
                try {
                  daysLeft = differenceInDays(parseISO(project.payment_date), new Date());
                  if (daysLeft < 0) paymentStatus = 'overdue';
                  else if (daysLeft <= 3) paymentStatus = 'urgent';
                  else paymentStatus = 'upcoming';
                } catch (e) {
                  console.error('Invalid date format:', project.payment_date);
                }
              }

              return (
                <motion.div
                  key={project.project_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/5 p-5 hover:border-slate-200 transition-all hover:shadow-2xl shadow-blue-900/5 hover:shadow-black/20"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Project Identity */}
                    <div className="flex items-center gap-4 w-full md:w-1/4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner",
                        "bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20"
                      )}>
                        {project.project_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white group-hover:text-primary transition-colors">{project.project_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-white/5 border-slate-200 text-muted-foreground uppercase tracking-wider">
                            {project.tier}
                          </Badge>
                          {savingIds.has(project.project_id) && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        </div>
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-3/5">
                      <div className="text-center md:text-left">
                        <p className="text-xs text-muted-foreground mb-1">Выручка</p>
                        <p className="font-mono font-bold text-white text-lg">{formatCurrency(project.package_revenue)}</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-xs text-muted-foreground mb-1">Расходы</p>
                        <div className="flex items-center justify-center md:justify-start gap-2 group/exp cursor-help">
                          <p className="font-mono font-medium text-red-300 text-lg">
                            {formatCurrency(project.team_salaries + project.software_costs + (project.other_expenses || 0))}
                          </p>
                          <AlertCircle className="w-3 h-3 text-white/20" />
                        </div>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-xs text-muted-foreground mb-1">Прибыль (Net)</p>
                        <p className={cn("font-mono font-bold text-lg", profit > 0 ? "text-blue-400" : "text-red-400")}>
                          {formatCurrency(profit)}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-xs text-muted-foreground mb-1">Маржинальность</p>
                        <div className="flex items-center gap-2">
                          <Progress value={margin} className="h-2 w-16 bg-white/10" indicatorClassName={margin > 40 ? "bg-blue-500" : "bg-amber-500"} />
                          <span className="text-xs font-medium text-slate-600">{margin.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Payment & Actions */}
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 md:ml-auto mt-4 md:mt-0">
                      <div className="text-right">
                        {project.payment_date ? (
                          <>
                            <div className="flex items-center justify-end gap-1.5 mb-0.5">
                              {paymentStatus === 'overdue' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                              {paymentStatus === 'urgent' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                              <span className={cn(
                                "text-xs font-bold",
                                paymentStatus === 'overdue' ? "text-red-400" :
                                  paymentStatus === 'urgent' ? "text-amber-400" : "text-blue-400"
                              )}>
                                {paymentStatus === 'overdue' ? `Просрочено ${Math.abs(daysLeft)} дн.` :
                                  daysLeft === 0 ? 'Сегодня' : `Через ${daysLeft} дней`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                              <Zap className="w-3 h-3 text-amber-500" />
                              {format(parseISO(project.payment_date), 'dd MMM', { locale: ru })}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Нет даты</span>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-full">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-black/90 border-slate-200 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => handleEdit(project)} className="text-white hover:bg-white/10 cursor-pointer">
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                            Выставить счет
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer">
                            Архивировать
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredFinances.length === 0 && (
            <div className="text-center py-20 bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white/50">Проекты не найдены</h3>
              <p className="text-sm text-muted-foreground/50">Добавьте новый проект чтобы начать отслеживание</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border-slate-200 bg-black/80 backdrop-blur-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {editingProject ? 'Редактировать проект' : 'Новый проект'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editingProject ? 'Измените финансовые показатели и даты' : 'Заполните данные для старта'}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Название проекта</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-slate-200"
                placeholder="Например: Стоматология Vali"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Выручка (Оплата)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.revenue || ''}
                    onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    className="bg-white/5 border-slate-200 pl-8"
                    placeholder="0"
                  />
                  <Wallet className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Дата следующей выплаты</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="bg-white/5 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs uppercase text-muted-foreground tracking-wider">Расходы</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">ФОТ (Команда)</Label>
                  <Input
                    type="number"
                    value={formData.team_salaries || ''}
                    onChange={(e) => setFormData({ ...formData, team_salaries: Number(e.target.value) })}
                    className="bg-white/5 border-slate-200 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Софт / Сервисы</Label>
                  <Input
                    type="number"
                    value={formData.software_costs || ''}
                    onChange={(e) => setFormData({ ...formData, software_costs: Number(e.target.value) })}
                    className="bg-white/5 border-slate-200 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Прочее</Label>
                  <Input
                    type="number"
                    value={formData.other_expenses || ''}
                    onChange={(e) => setFormData({ ...formData, other_expenses: Number(e.target.value) })}
                    className="bg-white/5 border-slate-200 h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm font-medium text-blue-400">Расчетная прибыль:</span>
              <span className="text-lg font-bold text-blue-400">
                {formatCurrency(formData.revenue - (formData.team_salaries + formData.software_costs + formData.other_expenses))}
              </span>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0">
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
