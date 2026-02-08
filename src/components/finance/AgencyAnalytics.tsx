
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Calendar
} from 'lucide-react';
import { useAgencyFinances } from '@/hooks/useAgencyFinances';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, updateFinance, addProject } = useAgencyFinances();
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const calculateNetProfit = (finance: typeof finances[0]): number => {
    if (finance.yuri_net_profit !== undefined) {
      return finance.yuri_net_profit;
    }
    return finance.package_revenue - (finance.team_salaries + finance.software_costs + (finance.other_expenses || 0));
  };

  const filteredFinances = finances.filter(f =>
    f.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = finances.reduce((sum, f) => sum + f.package_revenue, 0);
  const totalProfit = finances.reduce((sum, f) => sum + calculateNetProfit(f), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="interstellar-glass border-white/5 bg-emerald-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Общая прибыль</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalProfit)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="interstellar-glass border-white/5 bg-blue-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Оборот агентства</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="interstellar-glass border-white/5 bg-purple-500/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активных проектов</p>
              <p className="text-2xl font-bold text-purple-400">{finances.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="interstellar-glass border-white/5 shadow-xl">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Детализация по проектам
              </CardTitle>
              <CardDescription className="mt-1">Управление доходами и расходами агентства</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Поиск проекта..."
                  className="pl-9 h-9 bg-white/5 border-white/10 text-sm focus:bg-white/10 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Новый проект"
                  className="h-9 w-40 bg-white/5 border-white/10 text-sm focus:bg-white/10"
                />
                <Button
                  size="sm"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    if (newProjectName.trim()) {
                      addProject(newProjectName.trim());
                      setNewProjectName('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="w-[200px] text-white/60 font-medium">Проект</TableHead>
                  <TableHead className="w-[150px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Выручка</div></TableHead>
                  <TableHead className="min-w-[150px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Команда</div></TableHead>
                  <TableHead className="w-[140px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> ФОТ</div></TableHead>
                  <TableHead className="w-[140px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Софт</div></TableHead>
                  <TableHead className="w-[140px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><Settings className="w-3.5 h-3.5" /> Прочее</div></TableHead>
                  <TableHead className="w-[160px] text-white/60 font-medium"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Дата выплат</div></TableHead>
                  <TableHead className="w-[150px] text-right text-white/60 font-medium">Прибыль</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFinances.map((finance) => {
                  const netProfit = calculateNetProfit(finance);
                  const isSaving = savingIds.has(finance.project_id);

                  return (
                    <TableRow
                      key={finance.project_id}
                      className="border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <div className="w-3.5 h-3.5 rounded-full bg-primary/20" />}
                          <span className="text-sm text-foreground/90">{finance.project_name}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="relative">
                          <Input
                            type="number"
                            value={finance.package_revenue || ''}
                            onChange={(e) => updateFinance(finance.project_id, 'package_revenue', parseFloat(e.target.value) || 0)}
                            className="h-8 w-32 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm font-mono transition-all pl-2 pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Input
                          value={finance.team_members}
                          onChange={(e) => updateFinance(finance.project_id, 'team_members', e.target.value)}
                          className="h-8 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm transition-all text-muted-foreground focus:text-foreground"
                          placeholder="Участники..."
                        />
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="relative">
                          <Input
                            type="number"
                            value={finance.team_salaries || ''}
                            onChange={(e) => updateFinance(finance.project_id, 'team_salaries', parseFloat(e.target.value) || 0)}
                            className="h-8 w-32 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm font-mono transition-all pl-2 pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="relative">
                          <Input
                            type="number"
                            value={finance.software_costs || ''}
                            onChange={(e) => updateFinance(finance.project_id, 'software_costs', parseFloat(e.target.value) || 0)}
                            className="h-8 w-32 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm font-mono transition-all pl-2 pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="relative">
                          <Input
                            type="number"
                            value={finance.other_expenses || ''}
                            onChange={(e) => updateFinance(finance.project_id, 'other_expenses', parseFloat(e.target.value) || 0)}
                            className="h-8 w-32 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm font-mono transition-all pl-2 pr-6"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Input
                          type="date"
                          value={finance.payment_date || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'payment_date', e.target.value)}
                          className="h-8 w-36 bg-transparent border-transparent hover:border-white/20 focus:border-primary focus:bg-white/5 text-sm transition-all text-center"
                        />
                      </TableCell>

                      <TableCell className="text-right py-3 pr-6">
                        <span className={cn(
                          "font-mono font-bold text-sm px-2.5 py-1 rounded-md transition-colors",
                          netProfit >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}>
                          {formatCurrency(netProfit)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredFinances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Проекты не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
