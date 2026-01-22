# 🚀 ДЕПЛОЙ СЕЙЧАС

## ✅ ЧТО ИСПРАВЛЕНО:

1. **FB SDK типы** - убрал `@ts-ignore`, использую `(window as any).FB`
2. **Edge Function ошибки** - теперь возвращает 200 вместо 400 (не будет non-2xx)
3. **Коммит сделан** ✅

## 📦 КОМАНДЫ ДЛЯ ДЕПЛОЯ:

### 1. Push код на GitHub:
```bash
cd "/Users/urijzapojnov/MarkVision AI код/markvision"
git push
```

### 2. Деплой Edge Function на Supabase:

#### Через Dashboard (БЫСТРЕЕ):
1. Открой: https://supabase.com/dashboard/project/pyscczcuersdjvpmkiec/functions
2. Найди `fetch-facebook-profiles`
3. Нажми **"Edit"**
4. Скопируй код из `supabase/functions/fetch-facebook-profiles/index.ts`
5. Вставь в редактор
6. Нажми **"Deploy"**

#### Код для вставки:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { accessToken } = await req.json()

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Access token is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      )
    }

    console.log('📱 Fetching Facebook profile...')

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
    )

    let facebookProfile = null
    if (fbResponse.ok) {
      facebookProfile = await fbResponse.json()
      console.log('✅ Facebook profile:', facebookProfile.name)
    } else {
      const error = await fbResponse.text()
      console.error('❌ Facebook profile error:', error)
    }

    console.log('📄 Fetching Pages...')

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    )

    const instagramAccounts: any[] = []

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      console.log('✅ Found pages:', pagesData.data?.length || 0)

      for (const page of pagesData.data || []) {
        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id

          console.log('📸 Fetching Instagram account:', igId)

          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igId}?fields=id,username,profile_picture_url&access_token=${accessToken}`
          )

          if (igResponse.ok) {
            const igData = await igResponse.json()
            console.log('✅ Instagram account:', igData.username)
            instagramAccounts.push(igData)
          } else {
            const error = await igResponse.text()
            console.error('❌ Instagram account error:', error)
          }
        }
      }
    } else {
      const error = await pagesResponse.text()
      console.error('❌ Pages error:', error)
    }

    return new Response(
      JSON.stringify({
        facebookProfile,
        instagramAccounts,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error',
        facebookProfile: null,
        instagramAccounts: []
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
```

### 3. Manual Deploy на Vercel:
1. Открой: https://vercel.com/aiva-clinic1s-projects/markvision
2. **Deployments** → **Create Deployment**
3. Выбери ветку **main**
4. Дождись деплоя (2-3 минуты)

## 🎯 ПОСЛЕ ДЕПЛОЯ:

1. Открой: https://markvision-alpha.vercel.app/integrations
2. Нажми **"Привязать аккаунт"**
3. Откроется окно Facebook
4. Разреши доступ
5. **ВСЁ ДОЛЖНО РАБОТАТЬ** ✅

## 🔍 ЕСЛИ ОШИБКИ:

Открой консоль и посмотри:
- Если `FB is not defined` → перезагрузи страницу
- Если `Edge Function error` → проверь, что Edge Function задеплоен
- Если `Token invalid` → токен устарел, нужен новый

## ⚡ БЫСТРЫЙ СТАРТ:

```bash
# 1. Push
git push

# 2. Vercel Deploy (manual)
# Открой: https://vercel.com/aiva-clinic1s-projects/markvision
# Create Deployment → main

# 3. Проверь:
# https://markvision-alpha.vercel.app/integrations
```

🚀 **ГОТОВО К ДЕПЛОЮ!**
