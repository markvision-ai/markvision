import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { platform, productDescription, tone, language }: GenerateRequest = await req.json();

    if (!productDescription || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: platform and productDescription' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating ad copy for platform: ${platform}`);

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
