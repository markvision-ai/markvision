import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sync Organic Leads - Edge Function для дашборда "Контент-Завод"
 *
 * Эта функция:
 * 1. Считает количество органических лидов по постам
 * 2. Обновляет instagram_posts_stats.organic_leads_count
 * 3. Записывает агрегированные данные в content_stats
 *
 * Рекомендуется запускать раз в час через pg_cron или внешний scheduler
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrganicLeadStats {
  post_id: string;
  project_id: string;
  leads_count: number;
  total_revenue: number;
}

interface ContentStatsRow {
  project_id: string;
  total_posts: number;
  total_reels: number;
  total_reach: number;
  total_impressions: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  organic_leads_count: number;
  organic_leads_revenue: number;
  paid_leads_count: number;
  paid_leads_revenue: number;
  top_posts_by_leads: Array<{
    post_id: string;
    permalink: string;
    leads_count: number;
    media_type: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional project_id filter
    let projectFilter: string | null = null;
    try {
      const body = await req.json();
      projectFilter = body.project_id || null;
    } catch {
      // No body provided, sync all projects
    }

    console.log(
      "Starting organic leads sync",
      projectFilter ? `for project ${projectFilter}` : "for all projects"
    );

    const today = new Date().toISOString().split("T")[0];

    // Step 1: Get all organic leads grouped by post_id
    let leadsQuery = supabase
      .from("leads")
      .select("post_id, project_id, deal_amount")
      .eq("source", "organic")
      .not("post_id", "is", null);

    if (projectFilter) {
      leadsQuery = leadsQuery.eq("project_id", projectFilter);
    }

    const { data: organicLeads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error("Error fetching organic leads:", leadsError);
      throw new Error("Failed to fetch organic leads");
    }

    console.log(`Found ${organicLeads?.length || 0} organic leads`);

    // Step 2: Group leads by post_id and count
    const postLeadsMap = new Map<string, OrganicLeadStats>();

    for (const lead of organicLeads || []) {
      const key = `${lead.project_id}:${lead.post_id}`;
      const existing = postLeadsMap.get(key);

      if (existing) {
        existing.leads_count += 1;
        existing.total_revenue += lead.deal_amount || 0;
      } else {
        postLeadsMap.set(key, {
          post_id: lead.post_id,
          project_id: lead.project_id,
          leads_count: 1,
          total_revenue: lead.deal_amount || 0,
        });
      }
    }

    // Step 3: Update instagram_posts_stats with organic_leads_count
    let updatedPosts = 0;
    for (const stats of postLeadsMap.values()) {
      const { error: updateError } = await supabase
        .from("instagram_posts_stats")
        .update({
          organic_leads_count: stats.leads_count,
          revenue: stats.total_revenue,
          updated_at: new Date().toISOString(),
        })
        .eq("post_id", stats.post_id)
        .eq("project_id", stats.project_id);

      if (!updateError) {
        updatedPosts++;
      }
    }

    console.log(`Updated ${updatedPosts} posts with organic leads count`);

    // Step 4: Aggregate content stats per project
    let projectsQuery = supabase.from("projects").select("id");

    if (projectFilter) {
      projectsQuery = projectsQuery.eq("id", projectFilter);
    }

    const { data: projects } = await projectsQuery;

    const contentStatsUpdated: string[] = [];

    for (const project of projects || []) {
      // Get instagram posts stats for this project
      const { data: postsStats } = await supabase
        .from("instagram_posts_stats")
        .select("*")
        .eq("project_id", project.id);

      // Get organic leads count for this project
      const { count: organicCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("source", "organic");

      // Get organic leads revenue
      const { data: organicRevenueData } = await supabase
        .from("leads")
        .select("deal_amount")
        .eq("project_id", project.id)
        .eq("source", "organic");

      const organicRevenue =
        organicRevenueData?.reduce((sum, l) => sum + (l.deal_amount || 0), 0) ||
        0;

      // Get paid leads count and revenue
      const { count: paidCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("source", "paid");

      const { data: paidRevenueData } = await supabase
        .from("leads")
        .select("deal_amount")
        .eq("project_id", project.id)
        .eq("source", "paid");

      const paidRevenue =
        paidRevenueData?.reduce((sum, l) => sum + (l.deal_amount || 0), 0) || 0;

      // Calculate totals from posts
      const stats = postsStats || [];
      const totalPosts = stats.filter(
        (p) => p.media_type !== "REELS" && p.media_type !== "VIDEO"
      ).length;
      const totalReels = stats.filter(
        (p) => p.media_type === "REELS" || p.media_type === "VIDEO"
      ).length;
      const totalReach = stats.reduce((sum, p) => sum + (p.reach || 0), 0);
      const totalImpressions = stats.reduce(
        (sum, p) => sum + (p.impressions || 0),
        0
      );
      const totalLikes = stats.reduce((sum, p) => sum + (p.likes || 0), 0);
      const totalComments = stats.reduce(
        (sum, p) => sum + (p.comments || 0),
        0
      );
      const totalShares = stats.reduce((sum, p) => sum + (p.shares || 0), 0);
      const totalSaves = stats.reduce((sum, p) => sum + (p.saves || 0), 0);

      // Get top 5 posts by organic leads
      const topPosts = stats
        .filter((p) => (p.organic_leads_count || 0) > 0)
        .sort(
          (a, b) => (b.organic_leads_count || 0) - (a.organic_leads_count || 0)
        )
        .slice(0, 5)
        .map((p) => ({
          post_id: p.post_id,
          permalink: p.permalink,
          leads_count: p.organic_leads_count || 0,
          media_type: p.media_type,
        }));

      // Upsert to content_stats
      const { error: statsError } = await supabase
        .from("content_stats")
        .upsert(
          {
            project_id: project.id,
            date: today,
            period_type: "daily",
            total_posts: totalPosts,
            total_reels: totalReels,
            total_reach: totalReach,
            total_impressions: totalImpressions,
            total_likes: totalLikes,
            total_comments: totalComments,
            total_shares: totalShares,
            total_saves: totalSaves,
            organic_leads_count: organicCount || 0,
            organic_leads_revenue: organicRevenue,
            paid_leads_count: paidCount || 0,
            paid_leads_revenue: paidRevenue,
            top_posts_by_leads: topPosts,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "project_id,date,period_type",
          }
        );

      if (!statsError) {
        contentStatsUpdated.push(project.id);
      } else {
        console.error(
          `Error updating content_stats for project ${project.id}:`,
          statsError
        );
      }
    }

    console.log(
      `Content stats updated for ${contentStatsUpdated.length} projects`
    );

    return new Response(
      JSON.stringify({
        success: true,
        organic_leads_found: organicLeads?.length || 0,
        posts_updated: updatedPosts,
        projects_synced: contentStatsUpdated.length,
        synced_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Sync organic leads error:", error);
    return new Response(
      JSON.stringify({
        error: "Sync failed",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
