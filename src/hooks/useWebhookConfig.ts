import { useState, useEffect } from 'react';
import { supabase } from '@/lib/externalSupabase';
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
  webhook_token_masked: string | null; // Token is now masked for display
  webhook_secret?: string | null; // Secret for HMAC signing (fetched separately)
  field_mapping: FieldMapping;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Path validation constants - must match server-side validation
const MAX_PATH_DEPTH = 5;
const VALID_PATH_PATTERN = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

// Validate field mapping path for security
function isValidPath(path: string): boolean {
  if (!path || typeof path !== 'string') return true; // Empty paths are allowed
  if (path.length > 100) return false;
  if (!VALID_PATH_PATTERN.test(path)) return false;
  
  const parts = path.split('.');
  if (parts.length > MAX_PATH_DEPTH) return false;
  
  if (parts.some(part => DANGEROUS_KEYS.includes(part.toLowerCase()))) {
    return false;
  }
  
  return true;
}

// Validate entire field mapping object
function validateFieldMapping(fieldMapping: FieldMapping): { valid: boolean; error?: string } {
  for (const [key, path] of Object.entries(fieldMapping)) {
    if (path && !isValidPath(path)) {
      return { 
        valid: false, 
        error: `Недопустимый путь для поля "${key}": используйте только буквы, цифры, точки и подчёркивания (макс. 5 уровней)` 
      };
    }
  }
  return { valid: true };
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
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

  const fetchConfig = async () => {
    if (!projectId) {
      setConfig(null);
      setWebhookUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use the safe view that masks the token
      const { data, error } = await supabase
        .from('webhook_configs_safe')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        // Fallback to direct table access if view doesn't exist yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('webhook_configs')
          .select('id, project_id, name, is_active, field_mapping, created_at, updated_at')
          .eq('project_id', projectId)
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        
        if (fallbackData) {
          setConfig({
            ...fallbackData,
            webhook_token_masked: '********************************',
            field_mapping: fallbackData.field_mapping as unknown as FieldMapping
          });
          // Fetch the URL securely
          await fetchWebhookUrl(fallbackData.id);
        } else {
          setConfig(null);
          setWebhookUrl(null);
        }
        return;
      }
      
      if (data) {
        setConfig({
          ...data,
          field_mapping: data.field_mapping as unknown as FieldMapping
        });
        // Fetch the URL securely via RPC function
        await fetchWebhookUrl(data.id);
      } else {
        setConfig(null);
        setWebhookUrl(null);
      }
    } catch (error) {
      console.error('Error fetching webhook config:', error);
      setConfig(null);
      setWebhookUrl(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch webhook URL using secure RPC function
  const fetchWebhookUrl = async (configId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://grzqykegqgglekcxdtsu.supabase.co';
      const { data, error } = await supabase.rpc('get_webhook_url', { 
        config_id: configId,
        base_url: supabaseUrl
      });
      
      if (error) {
        console.error('Error fetching webhook URL:', error);
        setWebhookUrl(null);
        return;
      }
      
      setWebhookUrl(data);
    } catch (error) {
      console.error('Error fetching webhook URL:', error);
      setWebhookUrl(null);
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
        .select('id, project_id, name, is_active, field_mapping, created_at, updated_at')
        .single();

      if (error) throw error;
      
      const newConfig: WebhookConfig = {
        ...data,
        webhook_token_masked: '********************************',
        field_mapping: data.field_mapping as unknown as FieldMapping
      };
      setConfig(newConfig);
      
      // Fetch the URL for the new config
      await fetchWebhookUrl(data.id);
      
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

    // Validate field mapping before sending to server
    const validation = validateFieldMapping(fieldMapping);
    if (!validation.valid) {
      toast.error(validation.error || 'Недопустимый формат маппинга полей');
      return false;
    }

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

  // Return the securely fetched webhook URL
  const getWebhookUrl = () => webhookUrl;
  
  // Fetch webhook secret (only when needed, for setup instructions)
  const fetchWebhookSecret = async () => {
    if (!config?.id) return null;
    
    try {
      const { data, error } = await supabase.rpc('get_webhook_secret', { 
        p_config_id: config.id
      });
      
      if (error) {
        console.error('Error fetching webhook secret:', error);
        return null;
      }
      
      setWebhookSecret(data);
      return data;
    } catch (error) {
      console.error('Error fetching webhook secret:', error);
      return null;
    }
  };
  
  // Rotate webhook credentials
  const rotateCredentials = async () => {
    if (!config?.id) return false;
    
    try {
      const { data, error } = await supabase.rpc('rotate_webhook_credentials', {
        p_config_id: config.id
      });
      
      if (error) throw error;
      
      const result = data as { success?: boolean; error?: string } | null;
      
      if (result?.success) {
        toast.success('Учётные данные обновлены. Обновите настройки в ваших системах.');
        // Refetch config and URL
        await fetchConfig();
        return true;
      } else {
        throw new Error(result?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error rotating credentials:', error);
      toast.error('Ошибка обновления учётных данных');
      return false;
    }
  };
  
  const getWebhookSecret = () => webhookSecret;

  return {
    config,
    loading,
    createConfig,
    updateFieldMapping,
    toggleActive,
    getWebhookUrl,
    getWebhookSecret,
    fetchWebhookSecret,
    rotateCredentials,
    refetch: fetchConfig
  };
}
