import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Zap } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CampaignTableProps {
  campaigns: Campaign[];
  leadsPerCampaign: Record<string, number>;
  onCampaignClick: (campaign: Campaign) => void;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, { icon: string; color: string }> = {
    facebook: { icon: 'f', color: 'bg-blue-600' },
    tiktok: { icon: 'T', color: 'bg-black' },
    google: { icon: 'G', color: 'bg-red-500' },
  };

  const { icon, color } = icons[platform] || { icon: '?', color: 'bg-gray-500' };

  return (
    <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
      {icon}
    </div>
  );
};

// Neon pulse animation styles
const neonPulseStyles = `
  @keyframes neon-pulse {
    0%, 100% {
      box-shadow: 0 0 5px rgba(16, 185, 129, 0.5), 0 0 10px rgba(16, 185, 129, 0.3), 0 0 15px rgba(16, 185, 129, 0.2);
    }
    50% {
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.3);
    }
  }
`;

export const CampaignTable = ({
  campaigns,
  leadsPerCampaign,
  onCampaignClick,
  onUpdateCampaign,
}: CampaignTableProps) => {
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingAutopilot, setUpdatingAutopilot] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' ₸';
  };

  const handleStatusToggle = async (campaign: Campaign) => {
    setUpdatingStatus(campaign.id);
    await onUpdateCampaign(campaign.id, { status: !campaign.status });
    setUpdatingStatus(null);
  };

  const handleAutopilotToggle = async (campaign: Campaign) => {
    setUpdatingAutopilot(campaign.id);
    await onUpdateCampaign(campaign.id, { autopilot_enabled: !campaign.autopilot_enabled });
    setUpdatingAutopilot(null);
  };

  const handleBudgetSubmit = async (campaign: Campaign) => {
    const newBudget = parseFloat(budgetValue);
    if (!isNaN(newBudget) && newBudget >= 0) {
      await onUpdateCampaign(campaign.id, { budget: newBudget });
    }
    setEditingBudget(null);
  };

  const getLeadsCount = (campaign: Campaign) => {
    return leadsPerCampaign[campaign.name] || 0;
  };

  const calculateCPL = (campaign: Campaign) => {
    const leads = getLeadsCount(campaign);
    if (leads === 0) return 0;
    return campaign.spent_today / leads;
  };

  if (campaigns.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">Нет активных кампаний</p>
        <p className="text-sm text-muted-foreground mt-1">
          Кампании появятся после синхронизации с рекламными кабинетами
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Platform</TableHead>
            <TableHead className="text-muted-foreground">Campaign Name</TableHead>
            <TableHead className="text-muted-foreground text-center">Status</TableHead>
            <TableHead className="text-muted-foreground text-right">Daily Budget</TableHead>
            <TableHead className="text-muted-foreground text-right">Spent</TableHead>
            <TableHead className="text-muted-foreground text-right">Leads</TableHead>
            <TableHead className="text-muted-foreground text-right">CPL</TableHead>
            <TableHead className="text-muted-foreground text-center">AI Autopilot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const leads = getLeadsCount(campaign);
            const cpl = calculateCPL(campaign);
            
            return (
              <TableRow
                key={campaign.id}
                className={`border-border cursor-pointer transition-all ${
                  campaign.autopilot_enabled 
                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onCampaignClick(campaign)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={campaign.platform} />
                    <span className="capitalize text-xs text-muted-foreground">
                      {campaign.platform}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <span className="font-medium">{campaign.name}</span>
                </TableCell>
                
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {updatingStatus === campaign.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <Switch
                      checked={campaign.status}
                      onCheckedChange={() => handleStatusToggle(campaign)}
                    />
                  )}
                </TableCell>
                
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {editingBudget === campaign.id ? (
                    <Input
                      type="number"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      onBlur={() => handleBudgetSubmit(campaign)}
                      onKeyDown={(e) => e.key === 'Enter' && handleBudgetSubmit(campaign)}
                      className="w-28 h-8 text-right ml-auto"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setEditingBudget(campaign.id);
                        setBudgetValue(campaign.budget.toString());
                      }}
                    >
                      {formatCurrency(campaign.budget)}
                    </span>
                  )}
                </TableCell>
                
                <TableCell className="text-right">
                  <span className="text-rose-400">{formatCurrency(campaign.spent_today)}</span>
                </TableCell>
                
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono">
                    {leads}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <span className={cpl > 0 ? 'text-amber-400' : 'text-muted-foreground'}>
                    {cpl > 0 ? formatCurrency(cpl) : '—'}
                  </span>
                </TableCell>
                
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  {updatingAutopilot === campaign.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div 
                        className={`relative p-1 rounded-full transition-all ${
                          campaign.autopilot_enabled 
                            ? 'bg-emerald-500/20' 
                            : ''
                        }`}
                        style={campaign.autopilot_enabled ? {
                          animation: 'neon-pulse 2s ease-in-out infinite',
                        } : undefined}
                      >
                        <Zap 
                          className={`w-4 h-4 transition-colors ${
                            campaign.autopilot_enabled ? 'text-emerald-400 fill-emerald-400' : 'text-muted-foreground'
                          }`} 
                        />
                      </div>
                      <Switch
                        checked={campaign.autopilot_enabled}
                        onCheckedChange={() => handleAutopilotToggle(campaign)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
