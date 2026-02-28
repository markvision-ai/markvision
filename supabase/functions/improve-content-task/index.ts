import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { text, format } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'Text is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
            throw new Error('LOVABLE_API_KEY is not configured');
        }

        const prompt = `Ты — ведущий контент-стратег и эксперт по автоматизации маркетинга. 
Твоя задача: превратить краткое описание или идею пользователя в детализированное Техническое Задание (ТЗ) для нейросетей-исполнителей (видео, фото, текст).

Входящий текст: "${text}"
Выбранный формат: "${format}"

Требования к ТЗ:
1. Заголовок: Цепляющий и релевантный.
2. Сценарий/Структура: Пошаговый план реализации.
3. Визуальные инструкции: Описание стиля, освещения, композиции.
4. Текст/Копирайт: Финальный текст или ключевые тезисы.
5. Призыв к действию (CTA): Соответствующий формату.

Пиши на русском языке, используй профессиональный, но современный тон. Используй эмодзи для разделения блоков. Не используй markdown разметку (только текст и эмодзи).

Сделай текст максимально качественным и готовым к работе на "Контент-Заводе".`;

        console.log(`Improving text for format: ${format}`)
        console.log(`Input text: ${text.substring(0, 50)}...`)

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash', // Updated to a standard model name
                messages: [
                    { role: 'user', content: prompt }
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('AI Gateway error:', errorData);
            throw new Error('AI generation failed');
        }

        const data = await response.json();
        const improvedText = data.choices?.[0]?.message?.content;

        return new Response(JSON.stringify({ success: true, text: improvedText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Error in improve-content-task:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
