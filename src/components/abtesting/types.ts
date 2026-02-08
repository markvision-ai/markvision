export interface ABTest {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'running' | 'paused' | 'completed';
    test_category: 'page' | 'creative' | 'copy' | 'audience';
    variant_a_name: string;
    variant_b_name: string;
    variant_a_visitors: number;
    variant_b_visitors: number;
    variant_a_conversions: number;
    variant_b_conversions: number;
    winner: string | null;
    ai_recommendation: string | null;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
    page_path: string | null;
    variant_a_title: string | null;
    variant_a_text: string | null;
    variant_b_title: string | null;
    variant_b_text: string | null;
    // Facebook Ads
    facebook_account_id: string | null;
    facebook_campaign_id: string | null;
    facebook_ad_ids: string[] | null;
    facebook_adset_ids: string[] | null;
    // Facebook Metrics
    variant_a_spend: number;
    variant_b_spend: number;
    variant_a_leads: number;
    variant_b_leads: number;
    variant_a_impressions: number;
    variant_b_impressions: number;
    variant_a_cpl: number | null;
    variant_b_cpl: number | null;
    variant_a_ctr: number | null;
    variant_b_ctr: number | null;
    // Advanced Settings
    confidence_level: number;
    min_sample_size: number;
    auto_winner_threshold: number;
    hypothesis?: string; // New
    traffic_allocation?: number; // New: 50 means 50/50
}

export interface TestStats {
    totalLeads: number;
    conversionRate: number;
    revenue: number;
    variantA: {
        leads: number;
        conversions: number;
        revenue: number;
        conversionRate: number;
    };
    variantB: {
        leads: number;
        conversions: number;
        revenue: number;
        conversionRate: number;
    };
}
