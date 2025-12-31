import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRule {
  id: string;
  project_id: string;
  name: string;
  trigger_type: string;
  trigger_status: string | null;
  action_type: string;
  action_config: Record<string, any>;
  conditions: Record<string, any>;
  is_active: boolean;
  execution_order: number;
}

interface Lead {
  id: string;
  project_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  assigned_to: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  deal_amount: number | null;
  created_at: string;
  appointment_date: string | null;
}

interface Staff {
  id: string;
  name: string;
  status: string | null;
  user_id: string | null;
}

// Message templates for different scenarios
const messageTemplates: Record<string, (lead: Lead, config: Record<string, any>) => string> = {
  greeting: (lead, config) => 
    `Добрый день${lead.name ? `, ${lead.name}` : ''}! Увидели ваш интерес${lead.utm_campaign ? ` к ${lead.utm_campaign}` : ''}. Чтобы не тратить ваше время на долгие звонки, подскажите: вам удобнее обсудить детали здесь в переписке или мне перезвонить вам через 5 минут?`,
  
  recovery_1: (lead) => 
    `${lead.name || 'Здравствуйте'}, не смог до вас дозвониться. Напишите, когда будет удобно связаться?`,
  
  recovery_2: (lead) => 
    `Актуально ли еще наше предложение? Если да, просто поставьте +`,
  
  appointment_confirm: (lead, config) => {
    const appointmentInfo = lead.appointment_date 
      ? `Записали вас на ${new Date(lead.appointment_date).toLocaleDateString('ru-RU')}` 
      : 'Ваша запись подтверждена';
    const address = config.include_address ? '\nНаш адрес: [будет указан]' : '';
    return `${appointmentInfo}.${address}`;
  },
  
  appointment_reminder_24h: (lead) => 
    `Напоминаем о записи завтра! Всё в силе? Ждем вас!`,
  
  appointment_reminder_2h: (lead) => 
    `Ждем вас через 2 часа! Всё в силе?`,
  
  review_request: (lead) => 
    `${lead.name || 'Здравствуйте'}, как вам результат? Будем благодарны за отзыв!`,
  
  referral: (lead) => 
    `${lead.name || ''}, приведи друга и получи бонус! Подробности у менеджера.`
};

// Round-robin assignment logic
async function assignLeadRoundRobin(
  supabase: any, 
  projectId: string, 
  leadId: string
): Promise<{ staffId: string; staffName: string } | null> {
  // Get active staff for the project
  const { data: activeStaff, error: staffError } = await supabase
    .from('staff')
    .select('id, name, status, user_id')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .order('name');

  if (staffError || !activeStaff || activeStaff.length === 0) {
    console.log('No active staff found for project:', projectId);
    return null;
  }

  // Get the last assignment for round-robin
  const { data: lastAssignment } = await supabase
    .from('lead_assignments')
    .select('staff_id')
    .eq('project_id', projectId)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Find next staff in rotation
  let nextStaffIndex = 0;
  if (lastAssignment?.staff_id) {
    const lastIndex = activeStaff.findIndex((s: Staff) => s.id === lastAssignment.staff_id);
    nextStaffIndex = (lastIndex + 1) % activeStaff.length;
  }

  const selectedStaff = activeStaff[nextStaffIndex];

  // Create assignment record
  const { error: assignError } = await supabase
    .from('lead_assignments')
    .insert({
      project_id: projectId,
      lead_id: leadId,
      staff_id: selectedStaff.id,
      assigned_by: 'auto_round_robin',
      status: 'pending'
    });

  if (assignError) {
    console.error('Failed to create assignment:', assignError);
    return null;
  }

  // Update lead with assigned_to
  await supabase
    .from('leads')
    .update({ 
      assigned_to: selectedStaff.id,
      assigned_at: new Date().toISOString()
    })
    .eq('id', leadId);

  return { staffId: selectedStaff.id, staffName: selectedStaff.name };
}

// Send Telegram notification
async function sendTelegramNotification(
  projectId: string,
  message: string,
  supabase: any
): Promise<boolean> {
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!telegramToken) {
    console.log('Telegram bot token not configured');
    return false;
  }

  // Get project's telegram chat ID
  const { data: project } = await supabase
    .from('projects')
    .select('telegram_chat_id')
    .eq('id', projectId)
    .maybeSingle();

  if (!project?.telegram_chat_id) {
    console.log('No Telegram chat ID configured for project');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: project.telegram_chat_id,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Telegram notification error:', error);
    return false;
  }
}

// Log automation execution
async function logAutomation(
  supabase: any,
  projectId: string,
  ruleId: string | null,
  leadId: string | null,
  actionType: string,
  result: 'success' | 'failed' | 'skipped',
  data?: Record<string, any>,
  errorMessage?: string
) {
  await supabase
    .from('automation_logs')
    .insert({
      project_id: projectId,
      automation_rule_id: ruleId,
      lead_id: leadId,
      action_type: actionType,
      action_result: result,
      action_data: data || null,
      error_message: errorMessage || null
    });
}

// Execute a single automation rule
async function executeRule(
  supabase: any,
  rule: AutomationRule,
  lead: Lead,
  triggerEvent: string
): Promise<void> {
  console.log(`Executing rule: ${rule.name} for lead: ${lead.id}`);

  try {
    switch (rule.action_type) {
      case 'assign': {
        if (rule.action_config.method === 'round_robin') {
          const assignment = await assignLeadRoundRobin(supabase, lead.project_id, lead.id);
          
          if (assignment && rule.action_config.notify_telegram) {
            const message = `🆕 <b>Новый лид!</b>\n\n` +
              `👤 ${lead.name || 'Без имени'}\n` +
              `📱 ${lead.phone || 'Нет телефона'}\n` +
              `📊 Источник: ${lead.utm_source || 'Прямой'}\n` +
              `🎯 Кампания: ${lead.utm_campaign || '-'}\n\n` +
              `👨‍💼 Назначен: <b>${assignment.staffName}</b>\n\n` +
              `⚡ Срочно свяжитесь!`;
            
            await sendTelegramNotification(lead.project_id, message, supabase);
          }
          
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'assign', 
            assignment ? 'success' : 'failed', 
            { assigned_to: assignment?.staffId });
        }
        break;
      }

      case 'whatsapp_ai': {
        const template = rule.action_config.template || 'greeting';
        const templateFn = messageTemplates[template];
        
        if (!templateFn) {
          console.log('Unknown message template:', template);
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'whatsapp_ai', 'failed', 
            { template }, 'Unknown template');
          return;
        }

        const message = templateFn(lead, rule.action_config);
        
        // Log the intended message (actual WhatsApp integration would go here)
        console.log('WhatsApp AI message prepared:', message);
        
        await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'whatsapp_ai', 'success', 
          { template, message, phone: lead.phone });
        break;
      }

      case 'telegram': {
        const messageTemplate = rule.action_config.message_template || '';
        const message = messageTemplate
          .replace('{lead_name}', lead.name || 'Лид')
          .replace('{phone}', lead.phone || '-')
          .replace('{source}', lead.utm_source || 'Прямой');
        
        const sent = await sendTelegramNotification(lead.project_id, message, supabase);
        
        await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'telegram', 
          sent ? 'success' : 'failed', { message });
        break;
      }

      case 'reminder': {
        const hoursBefore = rule.action_config.hours_before || 24;
        const channel = rule.action_config.channel || 'whatsapp';
        
        if (lead.appointment_date) {
          const appointmentTime = new Date(lead.appointment_date).getTime();
          const reminderTime = new Date(appointmentTime - (hoursBefore * 60 * 60 * 1000));
          
          // Schedule reminder
          await supabase
            .from('scheduled_reminders')
            .insert({
              project_id: lead.project_id,
              lead_id: lead.id,
              automation_rule_id: rule.id,
              reminder_type: 'appointment',
              scheduled_for: reminderTime.toISOString(),
              channel: channel,
              message_template: hoursBefore === 24 ? 'appointment_reminder_24h' : 'appointment_reminder_2h',
              status: 'pending'
            });
          
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'reminder', 'success', 
            { scheduled_for: reminderTime.toISOString(), channel });
        }
        break;
      }

      case 'webhook': {
        // External webhook for things like Facebook CAPI
        const webhookUrl = Deno.env.get(rule.action_config.url_env || '');
        
        if (!webhookUrl) {
          console.log('Webhook URL not configured:', rule.action_config.url_env);
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'webhook', 'skipped', 
            rule.action_config, 'Webhook URL not configured');
          return;
        }

        // Prepare CAPI-style payload
        const payload = {
          event_name: rule.action_config.event_name || 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            phone: lead.phone ? [lead.phone.replace(/\D/g, '')] : undefined,
            email: lead.email ? [lead.email.toLowerCase()] : undefined,
          },
          custom_data: {
            lead_id: lead.id,
            value: lead.deal_amount || 0,
            currency: 'KZT',
            source: lead.utm_source,
            campaign: lead.utm_campaign
          }
        };

        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'webhook', 
            response.ok ? 'success' : 'failed', payload, 
            response.ok ? undefined : `HTTP ${response.status}`);
        } catch (error) {
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'webhook', 'failed', 
            payload, String(error));
        }
        break;
      }

      case 'status_change': {
        const newStatus = rule.action_config.new_status;
        if (newStatus && newStatus !== lead.status) {
          await supabase
            .from('leads')
            .update({ 
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', lead.id);
          
          await logAutomation(supabase, lead.project_id, rule.id, lead.id, 'status_change', 'success', 
            { old_status: lead.status, new_status: newStatus });
        }
        break;
      }

      default:
        console.log('Unknown action type:', rule.action_type);
        await logAutomation(supabase, lead.project_id, rule.id, lead.id, rule.action_type, 'skipped', 
          {}, 'Unknown action type');
    }

    // Update lead's last automation timestamp
    await supabase
      .from('leads')
      .update({ last_automation_at: new Date().toISOString() })
      .eq('id', lead.id);

  } catch (error) {
    console.error('Rule execution error:', error);
    await logAutomation(supabase, lead.project_id, rule.id, lead.id, rule.action_type, 'failed', 
      {}, String(error));
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, project_id, lead_id, trigger_event, new_status, old_status } = body;

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify project access
    const { data: hasAccess } = await supabase.rpc('has_project_access', {
      _user_id: user.id,
      _project_id: project_id
    });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'trigger_status_change': {
        if (!lead_id || !new_status) {
          return new Response(
            JSON.stringify({ error: 'lead_id and new_status required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get the lead
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .maybeSingle();

        if (leadError || !lead) {
          return new Response(
            JSON.stringify({ error: 'Lead not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get matching automation rules
        const { data: rules } = await supabase
          .from('crm_automation_rules')
          .select('*')
          .eq('project_id', project_id)
          .eq('is_active', true)
          .eq('trigger_type', 'status_change')
          .eq('trigger_status', new_status)
          .order('execution_order');

        if (rules && rules.length > 0) {
          for (const rule of rules) {
            await executeRule(supabase, rule, lead, 'status_change');
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            rules_executed: rules?.length || 0 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'trigger_new_lead': {
        if (!lead_id) {
          return new Response(
            JSON.stringify({ error: 'lead_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get the lead
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .maybeSingle();

        if (leadError || !lead) {
          return new Response(
            JSON.stringify({ error: 'Lead not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get matching automation rules for new leads
        const { data: rules } = await supabase
          .from('crm_automation_rules')
          .select('*')
          .eq('project_id', project_id)
          .eq('is_active', true)
          .eq('trigger_type', 'new_lead')
          .order('execution_order');

        if (rules && rules.length > 0) {
          for (const rule of rules) {
            await executeRule(supabase, rule, lead, 'new_lead');
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            rules_executed: rules?.length || 0 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_rules': {
        const { data: rules, error: rulesError } = await supabase
          .from('crm_automation_rules')
          .select('*')
          .eq('project_id', project_id)
          .order('execution_order');

        if (rulesError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch rules' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ rules }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'toggle_rule': {
        const { rule_id, is_active } = body;
        
        if (!rule_id) {
          return new Response(
            JSON.stringify({ error: 'rule_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabase
          .from('crm_automation_rules')
          .update({ is_active, updated_at: new Date().toISOString() })
          .eq('id', rule_id)
          .eq('project_id', project_id);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update rule' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_logs': {
        const { limit = 50 } = body;
        
        const { data: logs, error: logsError } = await supabase
          .from('automation_logs')
          .select(`
            *,
            lead:leads(id, name, phone),
            rule:crm_automation_rules(id, name)
          `)
          .eq('project_id', project_id)
          .order('executed_at', { ascending: false })
          .limit(limit);

        if (logsError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch logs' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ logs }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Automation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
