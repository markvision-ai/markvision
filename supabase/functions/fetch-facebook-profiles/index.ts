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
      `https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${accessToken}`
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

    // 2. Получаем Instagram аккаунты через Pages.
    // Детали IG (username, аватар) тянем прямо в списке через field expansion,
    // чтобы не делать по отдельному запросу на каждый аккаунт (N+1 при 100 аккаунтах).
    // limit=100 + проход по paging.next — иначе Graph API отдаёт лишь первые 25 страниц.
    const instagramAccounts: any[] = []
    let pagesUrl: string | null =
      `https://graph.facebook.com/v21.0/me/accounts` +
      `?fields=id,name,instagram_business_account{id,username,profile_picture_url}` +
      `&limit=100&access_token=${accessToken}`
    let pageNo = 0

    while (pagesUrl) {
      const pagesResponse = await fetch(pagesUrl)

      if (!pagesResponse.ok) {
        const error = await pagesResponse.text()
        console.error('❌ Pages error:', error)
        break
      }

      const pagesData = await pagesResponse.json()
      pageNo += 1
      console.log(`✅ Pages batch ${pageNo}:`, pagesData.data?.length || 0)

      for (const page of pagesData.data || []) {
        const ig = page.instagram_business_account
        if (ig && ig.id) {
          instagramAccounts.push({
            id: ig.id,
            username: ig.username,
            profile_picture_url: ig.profile_picture_url,
          })
        }
      }

      // Следующая страница списка Pages (не самих IG-аккаунтов)
      pagesUrl = pagesData.paging?.next || null
    }

    console.log('✅ Total Instagram accounts:', instagramAccounts.length)

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
