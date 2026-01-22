import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
        JSON.stringify({ 
          error: 'Token required',
          facebookProfile: null,
          instagramAccounts: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
    )

    let facebookProfile = null
    if (fbResponse.ok) {
      facebookProfile = await fbResponse.json()
    }

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    )

    const instagramAccounts = []

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json()

      for (const page of pagesData.data || []) {
        if (page.instagram_business_account) {
          const igId = page.instagram_business_account.id
          const igResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igId}?fields=id,username,profile_picture_url&access_token=${accessToken}`
          )

          if (igResponse.ok) {
            const igData = await igResponse.json()
            instagramAccounts.push(igData)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ facebookProfile, instagramAccounts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Error',
        facebookProfile: null,
        instagramAccounts: []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
