import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseKey || !anthropicApiKey) {
  console.error('Missing required environment variables (SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicApiKey });

// --- Tools Definitions ---
const tools: Anthropic.Tool[] = [
  {
    name: "get_meta_ads_data",
    description: "Get Meta Ads performance data (spend, leads, clicks, etc.) for a specific date range. Data is fetched from the local database which is synced via n8n.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date in YYYY-MM-DD format" },
        end_date: { type: "string", description: "End date in YYYY-MM-DD format" },
        project_id: { type: "string", description: "Project ID to filter by (optional, uses context if missing)" }
      },
      required: ["start_date", "end_date"]
    }
  },
  {
    name: "trigger_n8n_workflow",
    description: "Trigger an n8n workflow for automation tasks (e.g., sync ads, check followers, send notifications).",
    input_schema: {
      type: "object",
      properties: {
        workflow_name: { type: "string", description: "Name or identifier of the workflow to trigger" },
        payload: { type: "object", description: "JSON payload to send to the workflow" }
      },
      required: ["workflow_name"]
    }
  }
];

// --- Helper Functions ---
async function getKZTRate(): Promise<number> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(__dirname, 'fetch_kzt_rate.sh');
    exec(`"${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing fetch_kzt_rate.sh: ${error.message}`);
        resolve(503.44);
        return;
      }
      const rate = parseFloat(stdout.trim());
      resolve(isNaN(rate) || rate <= 0 ? 503.44 : rate);
    });
  });
}

function getFileContent(filename: string): string {
  try {
    const filePath = path.resolve(__dirname, `../${filename}`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
  return '';
}

// --- Tool Handlers ---
async function handleGetMetaAdsData(args: any) {
  console.log('📊 Executing Tool: get_meta_ads_data', args);
  try {
    const { start_date, end_date, project_id } = args;
    let query = supabase.from('marketing_stats').select('*').gte('date', start_date).lte('date', end_date).eq('source', 'facebook');
    if (project_id) query = query.eq('project_id', project_id);
    const { data, error } = await query;
    if (error) throw error;
    return { status: 'success', count: data?.length || 0, data: data || [] };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}

async function handleTriggerN8NWorkflow(args: any) {
  console.log('⚡ Executing Tool: trigger_n8n_workflow', args);
  try {
    const { workflow_name, payload } = args;
    const webhookUrl = "https://n8n.zapoinov.com/webhook/markvision-dispatch";
    const body = { workflow: workflow_name, ...payload, timestamp: new Date().toISOString() };
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`N8N responded with ${response.status} ${response.statusText}`);
    const result = await response.text();
    return { status: 'success', message: 'Workflow triggered', n8n_response: result };
  } catch (err: any) {
    return { status: 'error', message: err.message };
  }
}

// --- Main Processor ---
async function processTask(task: any) {
  console.log(`🚀 Processing task: ${task.id}`);
  
  await supabase.from('ai_bridge_tasks').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', task.id);

  try {
    const kztRate = await getKZTRate();
    const claudeContext = getFileContent('CLAUDE.md');
    const projectContext = getFileContent('project-context.md');

    const systemPrompt = `You are Mark, an expert AI business analyst for MarkVision.
You have access to the following project context and tools.

--- CLAUDE.md ---
${claudeContext}

--- project-context.md ---
${projectContext}

---
Current USD/KZT Rate: ${kztRate}.
Always use this rate for conversions.

You have access to tools: 'get_meta_ads_data' and 'trigger_n8n_workflow'.
Use them when the user asks for data or actions.
If you use a tool, analyze the result and give a final answer.
Format your response in Markdown.`;

    let messages: Anthropic.MessageParam[] = [{ role: 'user', content: task.prompt }];
    let fullResponseText = "";
    let lastUpdate = Date.now();
    let isFinished = false;

    const updateDb = async (text: string, status: 'running' | 'completed' = 'running') => {
      if (Date.now() - lastUpdate > 300 || status === 'completed') { // Throttle updates (300ms)
        await supabase.from('ai_bridge_tasks').update({ 
          result: text, 
          status: status,
          updated_at: new Date().toISOString() 
        }).eq('id', task.id);
        lastUpdate = Date.now();
      }
    };

    while (!isFinished) {
      console.log('🤖 Sending request to Anthropic (Streaming)...');
      
      const stream = anthropic.messages.stream({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: tools,
      });

      let currentToolUse: Anthropic.ToolUseBlockParam | null = null;
      let currentToolInput = "";

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullResponseText += event.delta.text;
          await updateDb(fullResponseText);
        } else if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
           console.log('🛠️ Tool use detected:', event.content_block.name);
           currentToolUse = event.content_block as Anthropic.ToolUseBlockParam;
        } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
           currentToolInput += event.delta.partial_json;
        }
      }

      const finalMessage = await stream.finalMessage();
      messages.push({ role: 'assistant', content: finalMessage.content });

      // Check if tool was used
      const toolUseBlocks = finalMessage.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlockParam[];
      
      if (toolUseBlocks.length > 0) {
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        
        for (const toolUse of toolUseBlocks) {
          let result;
          console.log(`🔧 Executing tool: ${toolUse.name}`);
          
          if (toolUse.name === 'get_meta_ads_data') {
            result = await handleGetMetaAdsData(toolUse.input);
          } else if (toolUse.name === 'trigger_n8n_workflow') {
            result = await handleTriggerN8NWorkflow(toolUse.input);
          } else {
            result = { error: 'Unknown tool' };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          });
        }
        
        messages.push({ role: 'user', content: toolResults });
        // Loop continues to get next response
      } else {
        isFinished = true;
      }
    }
    
    await updateDb(fullResponseText, 'completed');
    console.log('✅ Task completed successfully');

  } catch (error: any) {
    console.error('❌ Error processing task:', error);
    
    let userMessage = `Произошла техническая ошибка: ${error.message}`;
    
    // User-friendly error mapping
    if (error.message?.includes('not found') || error.status === 404) {
      userMessage = "⚠️ **Ошибка конфигурации AI**\n\nМодель `claude-3-5-sonnet-latest` не найдена или недоступна для вашего ключа.\nПожалуйста, проверьте API ключ в `.env` и доступ к моделям в консоли Anthropic.";
    } else if (error.message?.includes('credit') || error.message?.includes('balance') || error.status === 402) {
      userMessage = "💳 **Ошибка оплаты API**\n\nНедостаточно средств на балансе Anthropic. Работа AI приостановлена.\nПожалуйста, пополните счет в консоли разработчика.";
    } else if (error.status === 401) {
       userMessage = "🔑 **Ошибка доступа**\n\nНеверный API ключ Anthropic. Проверьте файл `.env.local`.";
    } else if (error.status === 429) {
       userMessage = "⏳ **Слишком много запросов**\n\nПревышен лимит использования API. Пожалуйста, подождите немного.";
    } else if (error.status >= 500) {
       userMessage = "🔥 **Ошибка сервера Anthropic**\n\nСервис временно недоступен. Попробуйте повторить запрос через минуту.";
    }

    // Update task with user-friendly message as result, so it appears in chat
    await supabase.from('ai_bridge_tasks').update({ 
      status: 'completed', // Completed so UI renders the message
      result: userMessage,
      error: error.message, // Keep raw error for debug
      updated_at: new Date().toISOString()
    }).eq('id', task.id);
  }
}

// --- Polling Loop ---
async function startWorker() {
  console.log('👷 AI Bridge Worker v4.0 started (Anthropic SDK + MCP + Streaming)');
  
  while (true) {
    try {
      const { data: tasks, error } = await supabase
        .from('ai_bridge_tasks')
        .select('*')
        .eq('status', 'pending')
        .limit(1);

      if (error) {
        console.error('Error fetching tasks:', error);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }

      if (tasks && tasks.length > 0) {
        await processTask(tasks[0]);
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error('Worker loop error:', err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

startWorker();
