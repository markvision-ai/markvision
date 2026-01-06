import { useState } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

interface SyncResult {
  synced: number;
  totalAmount: number;
}

export const useAdSpendSync = (projectId: string | null) => {
  const [syncing, setSyncing] = useState(false);

  const syncAdSpend = async (daysBack: number = 1): Promise<SyncResult | null> => {
    if (!projectId) {
      toast.error('Проект не выбран');
      return null;
    }

    setSyncing(true);
    try {
      // Get campaigns for this project
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, platform, spent_today, updated_at')
        .eq('project_id', projectId);

      if (campaignError) throw campaignError;
      if (!campaigns || campaigns.length === 0) {
        toast.info('Нет рекламных кампаний для синхронизации');
        setSyncing(false);
        return { synced: 0, totalAmount: 0 };
      }

      // Calculate total spend from all campaigns
      const totalSpend = campaigns.reduce((sum, c) => sum + (c.spent_today || 0), 0);

      if (totalSpend <= 0) {
        toast.info('Нет расходов на рекламу для синхронизации');
        setSyncing(false);
        return { synced: 0, totalAmount: 0 };
      }

      // Check if we already have a marketing transaction for today
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data: existingTx, error: existingError } = await supabase
        .from('transactions')
        .select('id, amount')
        .eq('project_id', projectId)
        .eq('category', 'marketing')
        .eq('type', 'expense')
        .gte('transaction_date', startOfToday)
        .lte('transaction_date', endOfToday);

      if (existingError) throw existingError;

      // Build description with campaign details
      const campaignNames = campaigns
        .filter(c => c.spent_today > 0)
        .map(c => `${c.name} (${c.platform}): ${c.spent_today.toLocaleString()} ₸`)
        .join(', ');

      const description = `QuantumAds: ${campaignNames}`;

      if (existingTx && existingTx.length > 0) {
        // Update existing transaction
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            amount: totalSpend,
            description,
          })
          .eq('id', existingTx[0].id);

        if (updateError) throw updateError;
        
        toast.success(`Обновлено: ${totalSpend.toLocaleString()} ₸ расходов на рекламу`);
      } else {
        // Create new transaction
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            project_id: projectId,
            type: 'expense',
            category: 'marketing',
            amount: totalSpend,
            description,
            currency: 'KZT',
            transaction_date: today.toISOString(),
          });

        if (insertError) throw insertError;
        
        toast.success(`Синхронизировано: ${totalSpend.toLocaleString()} ₸ расходов на рекламу`);
      }

      return { synced: campaigns.filter(c => c.spent_today > 0).length, totalAmount: totalSpend };
    } catch (error) {
      console.error('Error syncing ad spend:', error);
      toast.error('Ошибка при синхронизации расходов');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  // Sync historical data for multiple days
  const syncHistoricalAdSpend = async (days: number = 7): Promise<SyncResult | null> => {
    if (!projectId) {
      toast.error('Проект не выбран');
      return null;
    }

    setSyncing(true);
    let totalSynced = 0;
    let totalAmount = 0;

    try {
      // For historical sync, we'll aggregate by platform and create one transaction per day
      // Since we only have spent_today, we'll create a single aggregated transaction
      const result = await syncAdSpend(days);
      if (result) {
        totalSynced = result.synced;
        totalAmount = result.totalAmount;
      }

      return { synced: totalSynced, totalAmount };
    } catch (error) {
      console.error('Error syncing historical ad spend:', error);
      toast.error('Ошибка при синхронизации исторических данных');
      return null;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    syncAdSpend,
    syncHistoricalAdSpend,
  };
};
