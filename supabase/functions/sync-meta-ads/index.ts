// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FacebookCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  clicks: string;
  impressions: string;
  reach: string;
  cpm: string;
  cpc: string;
  ctr: string;
  date_start: string;
  date_stop: string;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramInsight {
  name: string;
  values: { value: number }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { projectId, syncType = "ads" } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Facebook integration config
    const { data: integration, error: integrationError } = await supabase
      .from("integrations")
      .select("config, status")
      .eq("project_id", projectId)
      .eq("type", "facebook")
      .single();

    if (integrationError || !integration || integration.status !== "active") {
      return new Response(JSON.stringify({ 
        error: "Facebook integration not connected",
        details: "Please connect Facebook in Settings -> Integrations"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = integration.config?.access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "No access token found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: any = {};

    if (syncType === "ads" || syncType === "all") {
      // Fetch Facebook Ads data
      result.ads = await syncFacebookAds(supabase, projectId, accessToken);
    }

    if (syncType === "instagram" || syncType === "all") {
      // Fetch Instagram content stats
      result.instagram = await syncInstagramContent(supabase, projectId, accessToken);
    }

    // Update integration last sync time
    await supabase
      .from("integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .eq("type", "facebook");

    console.log(`Sync completed for project ${projectId}:`, result);

    return new Response(JSON.stringify({ 
      success: true, 
      ...result,
      synced_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ 
      error: "Sync failed", 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function syncFacebookAds(
  supabase: any, 
  projectId: string, 
  accessToken: string
): Promise<{ campaigns: number; totalSpend: number }> {
  // Get ad accounts
  const accountsRes = await fetch(
    `https://graph.facebook.com/v21.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`
  );
  const accountsData = await accountsRes.json();

  if (accountsData.error) {
    console.error("Facebook API error:", accountsData.error);
    throw new Error(accountsData.error.message);
  }

  const adAccounts = accountsData.data || [];
  let totalCampaigns = 0;
  let totalSpend = 0;

  // Calculate date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const dateRange = {
    since: startDate.toISOString().split("T")[0],
    until: endDate.toISOString().split("T")[0],
  };

  for (const account of adAccounts) {
    if (account.account_status !== 1) continue; // Skip inactive accounts

    // Fetch campaign insights
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/${account.id}/insights?` +
      `access_token=${accessToken}&` +
      `fields=campaign_id,campaign_name,spend,clicks,impressions,reach,cpm,cpc,ctr&` +
      `level=campaign&` +
      `time_range=${JSON.stringify(dateRange)}&` +
      `time_increment=1`
    );
    
    const insightsData = await insightsRes.json();
    
    if (insightsData.error) {
      console.error(`Error fetching insights for ${account.id}:`, insightsData.error);
      continue;
    }

    const insights: FacebookCampaignInsight[] = insightsData.data || [];
    
    for (const insight of insights) {
      const spend = parseFloat(insight.spend) || 0;
      totalSpend += spend;
      totalCampaigns++;

      // Upsert to marketing_stats
      await supabase.from("marketing_stats").upsert({
        project_id: projectId,
        source: "facebook",
        date: insight.date_start,
        spend: spend,
        clicks: parseInt(insight.clicks) || 0,
        impressions: parseInt(insight.impressions) || 0,
        reach: parseInt(insight.reach) || 0,
        cpm: parseFloat(insight.cpm) || 0,
        cpc: parseFloat(insight.cpc) || 0,
        ctr: parseFloat(insight.ctr) || 0,
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name,
        ad_account_id: account.id,
        raw_data: insight,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: "project_id,source,date,campaign_id",
      });
    }
  }

  return { campaigns: totalCampaigns, totalSpend };
}

async function syncInstagramContent(
  supabase: any, 
  projectId: string, 
  accessToken: string
): Promise<{ posts: number; reels: number }> {
  // Get Instagram business account
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}&fields=instagram_business_account`
  );
  const pagesData = await pagesRes.json();

  if (pagesData.error) {
    console.error("Facebook Pages API error:", pagesData.error);
    throw new Error(pagesData.error.message);
  }

  let postsCount = 0;
  let reelsCount = 0;

  for (const page of pagesData.data || []) {
    const igAccountId = page.instagram_business_account?.id;
    if (!igAccountId) continue;

    // Fetch media
    const mediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media?` +
      `access_token=${accessToken}&` +
      `fields=id,caption,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count&` +
      `limit=50`
    );
    
    const mediaData = await mediaRes.json();
    
    if (mediaData.error) {
      console.error(`Error fetching Instagram media:`, mediaData.error);
      continue;
    }

    for (const media of mediaData.data || []) {
      // Fetch insights for each media
      let views = 0;
      let reach = 0;
      let engagement = 0;

      try {
        const insightsRes = await fetch(
          `https://graph.facebook.com/v19.0/${media.id}/insights?` +
          `access_token=${accessToken}&` +
          `metric=impressions,reach,engagement${media.media_type === "REELS" ? ",plays" : ""}`
        );
        
        const insightsData = await insightsRes.json();
        
        if (!insightsData.error && insightsData.data) {
          for (const insight of insightsData.data as InstagramInsight[]) {
            if (insight.name === "plays" || insight.name === "impressions") {
              views = insight.values[0]?.value || 0;
            }
            if (insight.name === "reach") {
              reach = insight.values[0]?.value || 0;
            }
            if (insight.name === "engagement") {
              engagement = insight.values[0]?.value || 0;
            }
          }
        }
      } catch (e) {
        console.log(`Could not fetch insights for media ${media.id}`);
      }

      if (media.media_type === "REELS") {
        reelsCount++;
      } else {
        postsCount++;
      }

      // Upsert to instagram_content_stats
      await supabase.from("instagram_content_stats").upsert({
        project_id: projectId,
        media_id: media.id,
        media_type: media.media_type,
        caption: media.caption?.substring(0, 500),
        permalink: media.permalink,
        thumbnail_url: media.thumbnail_url,
        views_count: views,
        likes_count: media.like_count || 0,
        comments_count: media.comments_count || 0,
        reach: reach,
        engagement: engagement,
        posted_at: media.timestamp,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: "project_id,media_id",
      });
    }
  }

  return { posts: postsCount, reels: reelsCount };
}
