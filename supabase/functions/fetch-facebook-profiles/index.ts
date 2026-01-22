import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // 1. Получаем Facebook профиль
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
      // НЕ бросаем ошибку, а возвращаем null
    }

    console.log('📄 Fetching Pages...')

    // 2. Получаем Instagram аккаунты через Pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    )

    const instagramAccounts: any[] = []

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()
      console.log('✅ Found pages:', pagesData.data?.length || 0)

      // Собираем Instagram аккаунты
      for (const page of pagesData.data || []) {
        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id

          console.log('📸 Fetching Instagram account:', igId)

          // Получаем детали Instagram аккаунта
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
        status: 200, // Возвращаем 200, чтобы не было non-2xx ошибки
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
