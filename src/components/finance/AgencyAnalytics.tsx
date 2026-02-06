
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
  Building2
} from 'lucide-react';
import { useAgencyFinances } from '@/hooks/useAgencyFinances';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, updateFinance, addProject } = useAgencyFinances();
  const [newProjectName, setNewProjectName] = useState('');

  const calculateNetProfit = (finance: typeof finances[0]): number => {
    if (finance.yuri_net_profit !== undefined) {
      return finance.yuri_net_profit;
    }
    // Fallback calculation if backend doesn't provide it (though hook should)
    return finance.package_revenue - (finance.team_salaries + finance.software_costs + (finance.other_expenses || 0));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Main Table - Clean & Minimal */}
      <Card className="shadow-none border-border/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Детализация по проектам</CardTitle>
              <CardDescription className="text-xs mt-1">Управление доходами и расходами</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Новый проект"
                  className="h-8 w-40 bg-transparent border-border focus:border-primary text-sm"
                />
              </div>
              <Button 
                variant="secondary" 
                className="h-8"
                onClick={() => {
                  if (newProjectName.trim()) {
                    addProject(newProjectName.trim());
                    setNewProjectName('');
                  }
                }}
              >
                Добавить
              </Button>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[200px] font-medium text-xs uppercase text-muted-foreground">Проект</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Сумма</TableHead>
                <TableHead className="min-w-[150px] font-medium text-xs uppercase text-muted-foreground">Команда</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Зарплаты</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Подписки</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Прочие расходы</TableHead>
                <TableHead className="w-[160px] font-medium text-xs uppercase text-muted-foreground">Дата платежа</TableHead>
                <TableHead className="w-[150px] text-right font-medium text-xs uppercase text-muted-foreground">Прибыль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((finance) => {
                const netProfit = calculateNetProfit(finance);
                const isSaving = savingIds.has(finance.project_id);
                
                return (
                  <TableRow 
                    key={finance.project_id}
                    className="border-border/40 hover:bg-muted/30"
                  >
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-2">
                        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        <span className="text-sm">{finance.project_name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.package_revenue || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'package_revenue', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <Input
                        value={finance.team_members}
                        onChange={(e) => updateFinance(finance.project_id, 'team_members', e.target.value)}
                        className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary text-sm transition-colors"
                        placeholder="Участники..."
                      />
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.team_salaries || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'team_salaries', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.software_costs || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'software_costs', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.other_expenses || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'other_expenses', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <Input
                        type="date"
                        value={finance.payment_date || ''}
                        onChange={(e) => updateFinance(finance.project_id, 'payment_date', e.target.value)}
                        className="h-8 w-40 bg-transparent border-transparent hover:border-border focus:border-primary text-sm"
                      />
                    </TableCell>
                    
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-mono font-medium text-sm ${
                          netProfit >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {formatCurrency(netProfit)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
