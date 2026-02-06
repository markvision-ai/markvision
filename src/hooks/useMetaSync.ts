// Stub hook - Meta sync is now handled by ads-manager Edge Function
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useMetaSync = (projectId: string | null) => {
  const [syncing, setSyncing] = useState(false);

  const syncMetaData = useCallback(async () => {
    toast.info('Синхронизация выполняется через QuantumAds');
    return { success: true };
  }, []);

  const getInstagramContent = useCallback(async (limit?: number) => {
    return [];
  }, []);

  const getIntegrationStatus = useCallback(async () => {
    return { connected: false, lastSync: null };
  }, []);

  const getTotalSpend = useCallback(async () => {
    return 0;
  }, []);

  return {
    syncing,
    syncMetaData,
    getInstagramContent,
    getIntegrationStatus,
    getTotalSpend
  };
};
