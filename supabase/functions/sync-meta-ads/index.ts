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

    // Resolve Meta access token: integrations → ad_accounts → projects.meta_access_token → pixel_configs.fb_access_token → META_ACCESS_TOKEN
    let accessToken: string | null = null;

    const { data: integration } = await supabase
      .from("integrations")
      .select("config, access_token, status")
      .eq("project_id", projectId)
      .eq("type", "facebook")
      .maybeSingle();
    const tokenFromIntegration = integration?.config?.access_token ?? integration?.access_token;
    if (integration?.status === "active" && tokenFromIntegration) accessToken = tokenFromIntegration;

    if (!accessToken) {
      const { data: adAccount } = await supabase
        .from("ad_accounts")
        .select("access_token")
        .eq("project_id", projectId)
        .eq("platform", "facebook")
        .limit(1)
        .maybeSingle();
      if (adAccount?.access_token) accessToken = adAccount.access_token;
    }

    if (!accessToken) {
      const { data: project } = await supabase
        .from("projects")
        .select("meta_access_token")
        .eq("id", projectId)
        .maybeSingle();
      if (project?.meta_access_token) accessToken = project.meta_access_token;
    }

    if (!accessToken) {
      const { data: pixel } = await supabase
        .from("pixel_configs")
        .select("fb_access_token")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (pixel?.fb_access_token) accessToken = pixel.fb_access_token;
    }

    if (!accessToken) accessToken = Deno.env.get("META_ACCESS_TOKEN");

    if (!accessToken) {
      return new Response(JSON.stringify({
        error: "Meta token not found",
        details: "Проверьте: integrations, ad_accounts, projects.meta_access_token, pixel_configs.fb_access_token или META_ACCESS_TOKEN в секретах Edge Function"
      }), {
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

  // 1. Fetch linked ad accounts for this project from Supabase
  const { data: linkedAccounts } = await supabase
    .from("ad_accounts")
    .select("ad_account_id, name")
    .eq("project_id", projectId)
    .eq("platform", "facebook");

  const linkedIds = linkedAccounts?.map(a => a.ad_account_id) || [];

  // 2. Filter Meta API results to matches our database OR fallback if none linked
  let accountsToSync = adAccounts.filter((acc: any) => linkedIds.includes(acc.id));

  // 3. Fallback: if no accounts linked in DB yet, use the first active account (no hardcoded keywords)
  if (accountsToSync.length === 0) {
    console.log("No specifically linked accounts found in DB, falling back to first active account...");
    const targetAccount = adAccounts.find((acc: any) => acc.account_status === 1) || adAccounts[0];
    if (targetAccount) accountsToSync = [targetAccount];
  }

  if (accountsToSync.length === 0) {
    console.log("No ad accounts found to sync.");
    return { campaigns: 0, totalSpend: 0 };
  }

  console.log(`Syncing ${accountsToSync.length} ad accounts: ${accountsToSync.map(a => a.name).join(', ')}`);

  for (const account of accountsToSync) {
    if (account.account_status !== 1 && accountsToSync.length > 1) {
      console.log(`Skipping inactive account: ${account.name}`);
      continue;
    }

    // Sync Campaigns Structure
    try {
      const campaignsRes = await fetch(
        `https://graph.facebook.com/v21.0/${account.id}/campaigns?` +
        `access_token=${accessToken}&` +
        `fields=id,name,status,daily_budget,lifetime_budget,updated_time,currency&` +
        `effective_status=['ACTIVE','PAUSED']&` +
        `limit=100`
      );
      const campaignsData = await campaignsRes.json();

      if (!campaignsData.error && campaignsData.data) {
        for (const campaign of campaignsData.data) {
          // Meta budget handling: 
          // For most currencies (USD, EUR, KZT), budget is returned in sub-units (cents).
          // For others like JPY, it might be different. 
          // Standard rule is /100 for cents-based currencies.
          const rawBudget = parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0');
          const budget = rawBudget / 100;

          await supabase.from("campaigns").upsert({
            project_id: projectId,
            external_id: campaign.id,
            name: campaign.name,
            status: campaign.status === 'ACTIVE',
            budget: budget,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "project_id,external_id"
          });
        }
      }
    } catch (e) {
      console.error("Error syncing campaigns structure:", e);
    }

    // Fetch campaign insights
    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/${account.id}/insights?` +
      `access_token=${accessToken}&` +
      `fields=campaign_id,campaign_name,spend,clicks,impressions,reach,cpm,cpc,ctr,actions,action_values&` +
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

      // Extract conversions
      const actions = insight.actions || [];
      const actionValues = insight.action_values || [];

      // Use priority-based counting to match Facebook Ads Manager deduplication.
      // 'lead' (Lead Ads) and 'offsite_conversion.fb_pixel_lead' (Pixel) can represent the same lead — don't sum them.
      const leads = getActionCountPriority(actions, ['lead', 'offsite_conversion.fb_pixel_lead', 'contact']);
      // For purchases: prefer purchase, fallback to pixel purchase
      const purchases = getActionCountPriority(actions, ['purchase', 'offsite_conversion.fb_pixel_purchase']);
      const revenue = getActionValuePriority(actionValues, ['purchase', 'offsite_conversion.fb_pixel_purchase']);
      const roas = parseFloat(insight.purchase_ros?.[0]?.value || '0');

      // Calculate ROI manually if ROAS is missing but we have revenue/spend
      const roi = spend > 0 ? (revenue - spend) / spend : 0;

      // Upsert to marketing_stats
      const { error: upsertError } = await supabase.from("marketing_stats").upsert({
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
        leads: leads,
        purchases: purchases,
        revenue: revenue,
        roi: roi,
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name,
        ad_account_id: account.id,
        raw_data: insight,
        synced_at: new Date().toISOString(),
      }, {
        // Include ad_account_id to prevent merging stats from different accounts with the same campaign_id
        onConflict: "project_id,source,date,campaign_id,ad_account_id",
      });

      if (upsertError) {
        console.error(`Error upserting stats for campaign ${insight.campaign_name}:`, upsertError);
      }
    }
  }

  return { campaigns: totalCampaigns, totalSpend };
}

// Priority-based counting: returns count from the FIRST matching type that has a value > 0.
// This matches Facebook Ads Manager deduplication logic.
// e.g. if 'lead'=30, 'offsite_conversion.fb_pixel_lead'=30 — they're the same 30 leads, not 60.
function getActionCountPriority(actions: any[], types: string[]): number {
  for (const type of types) {
    const action = actions.find((a: any) => a.action_type === type);
    const val = action ? (parseInt(action.value) || 0) : 0;
    if (val > 0) return val;
  }
  return 0;
}

function getActionValuePriority(actionValues: any[], types: string[]): number {
  for (const type of types) {
    const action = actionValues.find((a: any) => a.action_type === type);
    const val = action ? (parseFloat(action.value) || 0) : 0;
    if (val > 0) return val;
  }
  return 0;
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
