import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 30, windowSeconds: 3600 }, // 30 ad generations per hour
  admin: { requests: 150, windowSeconds: 3600 },
};

// Check rate limit and log usage
async function checkRateLimitAndLog(
  userId: string, 
  service: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return { allowed: true, remaining: -1 };
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
    _user_id: userId, 
    _role: 'admin' 
  });

  const limit = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.default;
  const windowStart = new Date(Date.now() - limit.windowSeconds * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service', service)
    .gte('created_at', windowStart);

  const currentCount = count || 0;
  const allowed = currentCount < limit.requests;
  const remaining = Math.max(0, limit.requests - currentCount - 1);

  // Log usage
  await supabaseAdmin.from('api_key_usage').insert({
    service,
    user_id: userId,
    endpoint,
    request_count: 1
  });

  console.log(`Rate limit: user=${userId}, service=${service}, count=${currentCount}/${limit.requests}`);

  return { allowed, remaining };
}

interface GenerateRequest {
  platform: 'facebook' | 'google' | 'tiktok';
  productDescription: string;
  tone?: string;
  language?: string;
}

const getPromptForPlatform = (platform: string, productDescription: string, language: string = 'ru') => {
  const baseContext = `Ты — эксперт по рекламным текстам. Язык ответа: ${language === 'ru' ? 'русский' : 'english'}.
Продукт/услуга: "${productDescription}"`;

  switch (platform) {
    case 'google':
      return `${baseContext}

Сгенерируй рекламные тексты для Google Ads в формате JSON:
{
  "headlines": ["15 коротких заголовков до 30 символов каждый"],
  "descriptions": ["4 описания до 90 символов каждое"],
  "primaryText": "",
  "hashtags": []
}

Требования:
- Заголовки: максимум 30 символов, цепляющие, с призывом к действию
- Описания: максимум 90 символов, с УТП и выгодами
- Используй ключевые слова естественно
- Добавь цифры и конкретику где возможно

Ответ ТОЛЬКО в JSON формате, без markdown.`;

    case 'facebook':
      return `${baseContext}

Сгенерируй рекламные тексты для Facebook/Instagram в формате JSON:
{
  "headlines": ["3 заголовка до 40 символов"],
  "descriptions": ["2 описания до 125 символов"],
  "primaryText": "Основной текст поста до 500 символов с эмодзи и форматированием",
  "hashtags": []
}

Требования:
- Основной текст: эмоциональный, с болями ЦА, эмодзи, структурированный
- Заголовки: до 40 символов, интригующие
- Описания: до 125 символов, с выгодой
- Добавь призыв к действию в конце

Ответ ТОЛЬКО в JSON формате, без markdown.`;

    case 'tiktok':
      return `${baseContext}

Сгенерируй рекламные тексты для TikTok в формате JSON:
{
  "headlines": [],
  "descriptions": [],
  "primaryText": "Короткий текст до 80 символов, молодежный стиль",
  "hashtags": ["6-8 трендовых хэштегов"]
}

Требования:
- Текст: до 80 символов, живой молодежный стиль
- Хэштеги: трендовые, релевантные, на русском и английском
- Используй сленг и эмодзи
- Добавь интригу или вопрос

Ответ ТОЛЬКО в JSON формате, без markdown.`;

    default:
      return `${baseContext}
Сгенерируй универсальные рекламные тексты в JSON формате.`;
  }
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const { platform, productDescription, tone, language }: GenerateRequest = await req.json();

    if (!productDescription || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: platform and productDescription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { allowed, remaining } = await checkRateLimitAndLog(
      user.id,
      'lovable_ai_adcopy',
      'generate-ad-copy'
    );

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating ad copy for platform: ${platform}, remaining requests: ${remaining}`);

    const prompt = getPromptForPlatform(platform, productDescription, language);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'API credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response received, parsing JSON...');

    // Parse the JSON response
    let parsedContent;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      // Return a structured response even if parsing fails
      parsedContent = {
        headlines: [],
        descriptions: [],
        primaryText: content,
        hashtags: [],
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        content: parsedContent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in generate-ad-copy:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
