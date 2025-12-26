import { useState, useEffect } from 'react';
import { Campaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Loader2, 
  ShieldAlert, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

interface AutopilotRulesPanelProps {
  campaign: Campaign;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>;
}

interface AutopilotRules {
  stop_loss: {
    enabled: boolean;
    max_spend: number | null;
    min_leads: number;
    hours: number;
  };
  scale_up: {
    enabled: boolean;
    min_roi: number;
    budget_increase_percent: number;
  };
  creative_refresh: {
    enabled: boolean;
    min_ctr: number;
    days: number;
  };
}

const defaultRules: AutopilotRules = {
  stop_loss: { enabled: false, max_spend: null, min_leads: 0, hours: 24 },
  scale_up: { enabled: false, min_roi: 300, budget_increase_percent: 20 },
  creative_refresh: { enabled: false, min_ctr: 0.5, days: 3 },
};

export const AutopilotRulesPanel = ({ campaign, onUpdateCampaign }: AutopilotRulesPanelProps) => {
  const [rules, setRules] = useState<AutopilotRules>(defaultRules);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Parse autopilot_rules from campaign if exists
    const campaignRules = (campaign as any).autopilot_rules;
    if (campaignRules && typeof campaignRules === 'object') {
      setRules({
        stop_loss: { ...defaultRules.stop_loss, ...campaignRules.stop_loss },
        scale_up: { ...defaultRules.scale_up, ...campaignRules.scale_up },
        creative_refresh: { ...defaultRules.creative_refresh, ...campaignRules.creative_refresh },
      });
    }
  }, [campaign]);

  const handleSave = async () => {
    setSaving(true);
    const success = await onUpdateCampaign(campaign.id, {
      // @ts-ignore - autopilot_rules добавлено в миграции
      autopilot_rules: rules,
    });
    setSaving(false);
    if (success) {
      toast.success('Правила автопилота сохранены');
    }
  };

  const updateStopLoss = (updates: Partial<AutopilotRules['stop_loss']>) => {
    setRules(prev => ({
      ...prev,
      stop_loss: { ...prev.stop_loss, ...updates },
    }));
  };

  const updateScaleUp = (updates: Partial<AutopilotRules['scale_up']>) => {
    setRules(prev => ({
      ...prev,
      scale_up: { ...prev.scale_up, ...updates },
    }));
  };

  const updateCreativeRefresh = (updates: Partial<AutopilotRules['creative_refresh']>) => {
    setRules(prev => ({
      ...prev,
      creative_refresh: { ...prev.creative_refresh, ...updates },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Stop-Loss Rule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h4 className="font-medium">Стоп-лосс</h4>
          </div>
          <Switch
            checked={rules.stop_loss.enabled}
            onCheckedChange={(enabled) => updateStopLoss({ enabled })}
          />
        </div>
        
        {rules.stop_loss.enabled && (
          <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-muted-foreground">
              Остановить кампанию, если расход превысит лимит при 0 лидах
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Макс. расход (₸)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={rules.stop_loss.max_spend || ''}
                  onChange={(e) => updateStopLoss({ max_spend: e.target.value ? Number(e.target.value) : null })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">За период (часов)</Label>
                <Input
                  type="number"
                  value={rules.stop_loss.hours}
                  onChange={(e) => updateStopLoss({ hours: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Scale-Up Rule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="font-medium">Масштабирование</h4>
          </div>
          <Switch
            checked={rules.scale_up.enabled}
            onCheckedChange={(enabled) => updateScaleUp({ enabled })}
          />
        </div>
        
        {rules.scale_up.enabled && (
          <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-muted-foreground">
              Увеличить бюджет при высоком ROI
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Мин. ROI (%)</Label>
                <Input
                  type="number"
                  value={rules.scale_up.min_roi}
                  onChange={(e) => updateScaleUp({ min_roi: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Увеличение бюджета (%)</Label>
                <Input
                  type="number"
                  value={rules.scale_up.budget_increase_percent}
                  onChange={(e) => updateScaleUp({ budget_increase_percent: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Creative Refresh Rule */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <h4 className="font-medium">Обновление креативов</h4>
          </div>
          <Switch
            checked={rules.creative_refresh.enabled}
            onCheckedChange={(enabled) => updateCreativeRefresh({ enabled })}
          />
        </div>
        
        {rules.creative_refresh.enabled && (
          <div className="pl-6 space-y-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-muted-foreground">
              Уведомить о выгорании креатива при низком CTR
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Мин. CTR (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={rules.creative_refresh.min_ctr}
                  onChange={(e) => updateCreativeRefresh({ min_ctr: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Период (дней)</Label>
                <Input
                  type="number"
                  value={rules.creative_refresh.days}
                  onChange={(e) => updateCreativeRefresh({ days: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>
            
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200">
                При срабатывании вы получите уведомление с предложением сгенерировать новый креатив
              </p>
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saving ? 'Сохранение...' : 'Сохранить правила'}
      </Button>
    </div>
  );
};
