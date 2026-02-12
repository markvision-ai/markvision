// n8n Webhook Bridge for CRM automation
const N8N_WEBHOOK_URL = 'https://n8n.zapoinov.com/webhook/crm-trigger';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

export interface WebhookPayload {
  lead_id: string;
  old_status: string | null;
  new_status: string;
  manager_id: string;
  timestamp: string;
  project_id?: string;
  lead_name?: string;
  lead_phone?: string;
  appointment_date?: string;
  rejection_reason?: string;
}

export const sendStatusChangeWebhook = async (payload: WebhookPayload): Promise<boolean> => {
  try {
    console.log('[Webhook] Sending status change notification');

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'Authorization': `Bearer ${N8N_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('[Webhook] Error sending webhook:', error);
    return false;
  }
};

// Check if lead has active automation
export const isLeadAutomated = (extraData: any): boolean => {
  return extraData?.automation_active === true || 
         extraData?.automationActive === true ||
         extraData?.has_automation === true;
};
