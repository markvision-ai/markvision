// Stub hook - Competitor monitoring disabled
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Competitor {
  id: string;
  name: string;
  instagram_handle: string | null;
  website_url: string | null;
}

export const useCompetitors = (projectId: string | null) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);

  const addCompetitor = useCallback(async (data: Partial<Competitor>) => {
    toast.info('Мониторинг конкурентов временно недоступен');
    return null;
  }, []);

  const removeCompetitor = useCallback(async (id: string) => {
    toast.info('Мониторинг конкурентов временно недоступен');
  }, []);

  const refreshCompetitorData = useCallback(async () => {
    toast.info('Мониторинг конкурентов временно недоступен');
  }, []);

  return {
    competitors,
    loading,
    addCompetitor,
    removeCompetitor,
    refreshCompetitorData
  };
};
