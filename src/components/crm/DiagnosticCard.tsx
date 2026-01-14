import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { 
  ClipboardCheck, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface DiagnosticCardProps {
  lead: {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    deal_amount?: number | null;
    status?: string | null;
    extra_data?: Record<string, any> | null;
  };
  projectId: string;
  onUpdate?: () => void;
  onClose?: () => void;
}

interface QualificationData {
  currentRevenue: number;
  desiredRevenue: number;
  mainProblem: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  budget: string;
  decisionMaker: boolean;
  timeframe: string;
}

interface ExpertSessionData {
  diagnosticType: string;
  currentSituation: string;
  obstacles: string;
  dreamOutcome: string;
  proposedSolution: string;
  investmentRequired: number;
  notes: string;
}

const DIAGNOSTIC_PRICE = 9900;

export const DiagnosticCard = ({ lead, projectId, onUpdate, onClose }: DiagnosticCardProps) => {
  const [activeStage, setActiveStage] = useState<'qualification' | 'expert'>('qualification');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Stage 1: Qualification Data
  const [qualification, setQualification] = useState<QualificationData>({
    currentRevenue: lead.extra_data?.currentRevenue || 0,
    desiredRevenue: lead.extra_data?.desiredRevenue || 0,
    mainProblem: lead.extra_data?.mainProblem || '',
    urgency: lead.extra_data?.urgency || 'medium',
    budget: lead.extra_data?.budget || '',
    decisionMaker: lead.extra_data?.decisionMaker ?? true,
    timeframe: lead.extra_data?.timeframe || '',
  });

  // Stage 2: Expert Session Data
  const [expertSession, setExpertSession] = useState<ExpertSessionData>({
    diagnosticType: 'marketing-audit',
    currentSituation: '',
    obstacles: '',
    dreamOutcome: '',
    proposedSolution: '',
    investmentRequired: DIAGNOSTIC_PRICE,
    notes: '',
  });

  // Calculate Gap Value (Alex Hormozi style)
  const gapValue = qualification.desiredRevenue - qualification.currentRevenue;
  const monthlyLoss = gapValue > 0 ? gapValue : 0;
  const yearlyLoss = monthlyLoss * 12;

  // Save Qualification (Stage 1)
  const saveQualification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          extra_data: {
            ...lead.extra_data,
            ...qualification,
            qualificationCompletedAt: new Date().toISOString(),
          },
          status: 'qualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Квалификация сохранена!');
      setActiveStage('expert');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving qualification:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  // Save Expert Session (Stage 2) and complete diagnostic
  const saveExpertSession = async () => {
    setLoading(true);
    try {
      // Save to diagnostic_results table
      const { error: diagError } = await supabase
        .from('diagnostic_results')
        .insert({
          lead_id: lead.id,
          project_id: projectId,
          diagnostic_type: expertSession.diagnosticType,
          result: 'completed',
          notes: JSON.stringify({
            currentSituation: expertSession.currentSituation,
            obstacles: expertSession.obstacles,
            dreamOutcome: expertSession.dreamOutcome,
            proposedSolution: expertSession.proposedSolution,
            investmentRequired: expertSession.investmentRequired,
            gapValue: gapValue,
            monthlyLoss: monthlyLoss,
            notes: expertSession.notes,
          }),
          completed_at: new Date().toISOString(),
        });

      if (diagError) {
        console.error('Diagnostic results error:', diagError);
        // Continue anyway - save to lead
      }

      // Update lead with expert session data
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          extra_data: {
            ...lead.extra_data,
            ...qualification,
            expertSession: expertSession,
            gapValue: gapValue,
            monthlyLoss: monthlyLoss,
            diagnosticCompletedAt: new Date().toISOString(),
          },
          status: 'diagnostics_completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      toast.success('Диагностика завершена! Можно предлагать решение.');
      onUpdate?.();
    } catch (error) {
      console.error('Error saving expert session:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  // Complete booking with payment (Записать)
  const completeBooking = async () => {
    setLoading(true);
    try {
      // Update lead status and add revenue
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'Записан',
          deal_amount: (lead.deal_amount || 0) + DIAGNOSTIC_PRICE,
          appointment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // Create transaction in MarkFinance
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          project_id: projectId,
          type: 'income',
          category: 'diagnostics',
          amount: DIAGNOSTIC_PRICE,
          currency: 'KZT',
          description: `Диагностика: ${lead.name || 'клиент'}`,
          lead_id: lead.id,
          transaction_date: new Date().toISOString(),
        });

      if (transactionError) {
        console.warn('Transaction sync warning:', transactionError);
      }

      toast.success(`Клиент записан! Доход: ${DIAGNOSTIC_PRICE.toLocaleString()} ₸`);
      setShowConfirmDialog(false);
      onUpdate?.();
      onClose?.();
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Ошибка записи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Lead Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{lead.name || 'Клиент'}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {lead.phone || 'Телефон не указан'}
            </p>
          </div>
        </div>
        <Badge variant={activeStage === 'qualification' ? 'outline' : 'default'}>
          {activeStage === 'qualification' ? 'Этап 1: Квалификация' : 'Этап 2: Диагностика'}
        </Badge>
      </div>

      <Tabs value={activeStage} onValueChange={(v) => setActiveStage(v as 'qualification' | 'expert')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qualification" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Квалификация
          </TabsTrigger>
          <TabsTrigger value="expert" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Экспертная сессия
          </TabsTrigger>
        </TabsList>

        {/* STAGE 1: Qualification */}
        <TabsContent value="qualification" className="space-y-4 mt-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Финансовый Gap-анализ
              </CardTitle>
              <CardDescription>
                Определяем разрыв между текущим и желаемым результатом
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Текущая выручка (₸/мес)</Label>
                  <Input
                    type="number"
                    value={qualification.currentRevenue}
                    onChange={(e) => setQualification(prev => ({ ...prev, currentRevenue: Number(e.target.value) }))}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <Label>Желаемая выручка (₸/мес)</Label>
                  <Input
                    type="number"
                    value={qualification.desiredRevenue}
                    onChange={(e) => setQualification(prev => ({ ...prev, desiredRevenue: Number(e.target.value) }))}
                    placeholder="2000000"
                  />
                </div>
              </div>

              {/* GAP VALUE VISUALIZATION - Alex Hormozi Style */}
              {gapValue > 0 && (
                <Card className="bg-destructive/10 border-destructive/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Ваши потери прямо сейчас:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-sm text-muted-foreground">В месяц</p>
                        <p className="text-2xl font-bold text-destructive">
                          -{monthlyLoss.toLocaleString()} ₸
                        </p>
                      </div>
                      <div className="text-center p-3 bg-background rounded-lg">
                        <p className="text-sm text-muted-foreground">В год</p>
                        <p className="text-2xl font-bold text-destructive">
                          -{yearlyLoss.toLocaleString()} ₸
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Каждый день без решения = потеря {Math.round(monthlyLoss / 30).toLocaleString()} ₸
                    </p>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Главная проблема / боль</Label>
                <Textarea
                  value={qualification.mainProblem}
                  onChange={(e) => setQualification(prev => ({ ...prev, mainProblem: e.target.value }))}
                  placeholder="Что мешает достичь желаемого результата?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Срочность решения</Label>
                  <Select
                    value={qualification.urgency}
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => 
                      setQualification(prev => ({ ...prev, urgency: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкая (когда-нибудь)</SelectItem>
                      <SelectItem value="medium">Средняя (в этом квартале)</SelectItem>
                      <SelectItem value="high">Высокая (в этом месяце)</SelectItem>
                      <SelectItem value="critical">Критическая (срочно!)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Бюджет на решение</Label>
                  <Input
                    value={qualification.budget}
                    onChange={(e) => setQualification(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="100 000 - 500 000 ₸"
                  />
                </div>
              </div>

              <Button 
                onClick={saveQualification} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Сохранить и перейти к диагностике
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STAGE 2: Expert Session */}
        <TabsContent value="expert" className="space-y-4 mt-4">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Dream Outcome
              </CardTitle>
              <CardDescription>
                Определяем идеальный результат и путь к нему
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Тип диагностики</Label>
                <Select
                  value={expertSession.diagnosticType}
                  onValueChange={(v) => setExpertSession(prev => ({ ...prev, diagnosticType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing-audit">Маркетинг-аудит</SelectItem>
                    <SelectItem value="sales-audit">Аудит продаж</SelectItem>
                    <SelectItem value="business-health">Здоровье бизнеса</SelectItem>
                    <SelectItem value="express-check">Экспресс-проверка</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Текущая ситуация (Point A)</Label>
                <Textarea
                  value={expertSession.currentSituation}
                  onChange={(e) => setExpertSession(prev => ({ ...prev, currentSituation: e.target.value }))}
                  placeholder="Опишите текущее положение дел..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Препятствия на пути</Label>
                <Textarea
                  value={expertSession.obstacles}
                  onChange={(e) => setExpertSession(prev => ({ ...prev, obstacles: e.target.value }))}
                  placeholder="Что мешает достичь цели?"
                  rows={2}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Dream Outcome (Point B)
                </Label>
                <Textarea
                  value={expertSession.dreamOutcome}
                  onChange={(e) => setExpertSession(prev => ({ ...prev, dreamOutcome: e.target.value }))}
                  placeholder="Идеальный результат через 90 дней..."
                  rows={2}
                />
              </div>

              {/* Dream Outcome Visualization */}
              {expertSession.dreamOutcome && qualification.desiredRevenue > 0 && (
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Ваш Dream Outcome:</span>
                    </div>
                    <p className="text-lg font-medium">
                      {expertSession.dreamOutcome}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Потенциальный доход: <span className="font-bold text-green-600">
                        +{qualification.desiredRevenue.toLocaleString()} ₸/мес
                      </span>
                    </p>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label>Предлагаемое решение</Label>
                <Textarea
                  value={expertSession.proposedSolution}
                  onChange={(e) => setExpertSession(prev => ({ ...prev, proposedSolution: e.target.value }))}
                  placeholder="Как мы можем помочь достичь Dream Outcome..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Заметки эксперта</Label>
                <Textarea
                  value={expertSession.notes}
                  onChange={(e) => setExpertSession(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Дополнительные наблюдения..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={saveExpertSession} 
                  className="flex-1" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Сохранить диагностику
                </Button>
                <Button 
                  onClick={() => setShowConfirmDialog(true)} 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  disabled={loading}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Записать ({DIAGNOSTIC_PRICE.toLocaleString()} ₸)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Подтверждение записи
            </DialogTitle>
            <DialogDescription>
              Клиент будет записан на диагностику, и выручка будет добавлена в MarkFinance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span>Клиент:</span>
                <span className="font-medium">{lead.name || 'Без имени'}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span>Телефон:</span>
                <span className="font-medium">{lead.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-lg">
                <span>Сумма:</span>
                <span className="font-bold text-green-600">{DIAGNOSTIC_PRICE.toLocaleString()} ₸</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="flex-1">
                Отмена
              </Button>
              <Button onClick={completeBooking} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Подтвердить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
