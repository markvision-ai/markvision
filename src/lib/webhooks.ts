// n8n Webhook Bridge for CRM automation
// Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.app.n8n.cloud/webhook/crm-trigger';

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
    // Log webhook attempt (for debugging)
    console.log('[Webhook] Sending status change notification:', payload);

    // In production, uncomment this to send actual webhook
    // const response = await fetch(N8N_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Webhook failed: ${response.status}`);
    // }

    // For now, just log and return success
    console.log('[Webhook] Status change logged successfully');
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
