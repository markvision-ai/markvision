import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FieldMapping {
  name: string;
  email: string;
  phone: string;
  lead_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  visit_id: string;
  client_id: string;
  deal_amount?: string;
}

export interface WebhookConfig {
  id: string;
  project_id: string;
  name: string;
  webhook_token: string;
  field_mapping: FieldMapping;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const defaultFieldMapping: FieldMapping = {
  name: 'lead_info.name',
  email: 'lead_info.email',
  phone: 'lead_info.phone',
  lead_id: 'lead_info.id',
  utm_source: 'utm_data.utm_source',
  utm_medium: 'utm_data.utm_medium',
  utm_campaign: 'utm_data.utm_campaign',
  utm_content: 'utm_data.utm_content',
  utm_term: 'utm_data.utm_term',
  visit_id: 'analytics.visit_id',
  client_id: 'analytics.client_id',
  deal_amount: 'deal.amount',
};

export function useWebhookConfig(projectId: string | null) {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    if (!projectId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig({
          ...data,
          field_mapping: data.field_mapping as unknown as FieldMapping
        });
      } else {
        setConfig(null);
      }
    } catch (error) {
      console.error('Error fetching webhook config:', error);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [projectId]);

  const createConfig = async (name: string = 'Основной вебхук') => {
    if (!projectId) return null;

    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .insert([{
          project_id: projectId,
          name,
          field_mapping: defaultFieldMapping as any,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      const newConfig = {
        ...data,
        field_mapping: data.field_mapping as unknown as FieldMapping
      };
      setConfig(newConfig);
      toast.success('Вебхук создан');
      return newConfig;
    } catch (error) {
      console.error('Error creating webhook config:', error);
      toast.error('Ошибка создания вебхука');
      return null;
    }
  };

  const updateFieldMapping = async (fieldMapping: FieldMapping) => {
    if (!config) return false;

    try {
      const { error } = await supabase
        .from('webhook_configs')
        .update({ field_mapping: fieldMapping as any })
        .eq('id', config.id);

      if (error) throw error;
      
      setConfig({ ...config, field_mapping: fieldMapping });
      toast.success('Маппинг полей обновлен');
      return true;
    } catch (error) {
      console.error('Error updating field mapping:', error);
      toast.error('Ошибка обновления маппинга');
      return false;
    }
  };

  const toggleActive = async () => {
    if (!config) return false;

    try {
      const newStatus = !config.is_active;
      const { error } = await supabase
        .from('webhook_configs')
        .update({ is_active: newStatus })
        .eq('id', config.id);

      if (error) throw error;
      
      setConfig({ ...config, is_active: newStatus });
      toast.success(newStatus ? 'Вебхук активирован' : 'Вебхук деактивирован');
      return true;
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Ошибка изменения статуса');
      return false;
    }
  };

  const getWebhookUrl = () => {
    if (!config) return null;
    return `https://grzqykegqgglekcxdtsu.supabase.co/functions/v1/webhook-receiver?token=${config.webhook_token}`;
  };

  return {
    config,
    loading,
    createConfig,
    updateFieldMapping,
    toggleActive,
    getWebhookUrl,
    refetch: fetchConfig
  };
}
