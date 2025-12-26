export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attribution_results: {
        Row: {
          assisted_conversions: number | null
          attributed_leads: number | null
          attributed_profit: number | null
          attributed_revenue: number | null
          attributed_sales: number | null
          cac: number | null
          calculated_at: string
          campaign_name: string | null
          channel_name: string
          cpl: number | null
          created_at: string
          id: string
          keyword: string | null
          leads: number | null
          model: Database["public"]["Enums"]["attribution_model"]
          period_end: string
          period_start: string
          profit: number | null
          project_id: string
          revenue: number | null
          roi: number | null
          sales: number | null
          source_type: Database["public"]["Enums"]["traffic_source"] | null
          spend: number | null
          visits: number | null
        }
        Insert: {
          assisted_conversions?: number | null
          attributed_leads?: number | null
          attributed_profit?: number | null
          attributed_revenue?: number | null
          attributed_sales?: number | null
          cac?: number | null
          calculated_at?: string
          campaign_name?: string | null
          channel_name: string
          cpl?: number | null
          created_at?: string
          id?: string
          keyword?: string | null
          leads?: number | null
          model: Database["public"]["Enums"]["attribution_model"]
          period_end: string
          period_start: string
          profit?: number | null
          project_id: string
          revenue?: number | null
          roi?: number | null
          sales?: number | null
          source_type?: Database["public"]["Enums"]["traffic_source"] | null
          spend?: number | null
          visits?: number | null
        }
        Update: {
          assisted_conversions?: number | null
          attributed_leads?: number | null
          attributed_profit?: number | null
          attributed_revenue?: number | null
          attributed_sales?: number | null
          cac?: number | null
          calculated_at?: string
          campaign_name?: string | null
          channel_name?: string
          cpl?: number | null
          created_at?: string
          id?: string
          keyword?: string | null
          leads?: number | null
          model?: Database["public"]["Enums"]["attribution_model"]
          period_end?: string
          period_start?: string
          profit?: number | null
          project_id?: string
          revenue?: number | null
          roi?: number | null
          sales?: number | null
          source_type?: Database["public"]["Enums"]["traffic_source"] | null
          spend?: number | null
          visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attribution_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_log: Json | null
          autopilot_enabled: boolean
          budget: number
          created_at: string
          external_id: string | null
          id: string
          name: string
          platform: string
          project_id: string
          rules: Json | null
          spent_today: number
          status: boolean
          updated_at: string
        }
        Insert: {
          ai_log?: Json | null
          autopilot_enabled?: boolean
          budget?: number
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          platform: string
          project_id: string
          rules?: Json | null
          spent_today?: number
          status?: boolean
          updated_at?: string
        }
        Update: {
          ai_log?: Json | null
          autopilot_enabled?: boolean
          budget?: number
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          platform?: string
          project_id?: string
          rules?: Json | null
          spent_today?: number
          status?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_attribution_settings: {
        Row: {
          created_at: string
          first_touch_weight: number
          id: string
          is_default: boolean | null
          last_touch_weight: number
          middle_touches_weight: number
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_touch_weight?: number
          id?: string
          is_default?: boolean | null
          last_touch_weight?: number
          middle_touches_weight?: number
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_touch_weight?: number
          id?: string
          is_default?: boolean | null
          last_touch_weight?: number
          middle_touches_weight?: number
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_attribution_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_data: {
        Row: {
          clicks: number
          created_at: string
          date: string
          diagnostics: number
          id: string
          impressions: number
          leads: number
          project_id: string
          revenue: number
          sales: number
          spend: number
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          date: string
          diagnostics?: number
          id?: string
          impressions?: number
          leads?: number
          project_id: string
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          date?: string
          diagnostics?: number
          id?: string
          impressions?: number
          leads?: number
          project_id?: string
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string | null
          created_at: string
          deal_amount: number | null
          email: string | null
          external_lead_id: string | null
          extra_data: Json | null
          id: string
          name: string | null
          phone: string | null
          project_id: string
          status: string | null
          touchpoint_chain_id: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visit_id: string | null
          webhook_log_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
          project_id: string
          status?: string | null
          touchpoint_chain_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string | null
          webhook_log_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
          project_id?: string
          status?: string | null
          touchpoint_chain_id?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string | null
          webhook_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_webhook_log_id_fkey"
            columns: ["webhook_log_id"]
            isOneToOne: false
            referencedRelation: "webhook_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_data: {
        Row: {
          clicks: number
          created_at: string
          diagnostics: number
          id: string
          impressions: number
          leads: number
          month: string
          project_id: string
          revenue: number
          sales: number
          spend: number
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          diagnostics?: number
          id?: string
          impressions?: number
          leads?: number
          month: string
          project_id: string
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          diagnostics?: number
          id?: string
          impressions?: number
          leads?: number
          month?: string
          project_id?: string
          revenue?: number
          sales?: number
          spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_access: {
        Row: {
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          telegram_chat_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          comparison_preset: string | null
          created_at: string
          custom_days: number | null
          id: string
          include_comparison: boolean | null
          name: string
          period_preset: string | null
          project_id: string
          selected_metrics: Json | null
          updated_at: string
        }
        Insert: {
          comparison_preset?: string | null
          created_at?: string
          custom_days?: number | null
          id?: string
          include_comparison?: boolean | null
          name: string
          period_preset?: string | null
          project_id: string
          selected_metrics?: Json | null
          updated_at?: string
        }
        Update: {
          comparison_preset?: string | null
          created_at?: string
          custom_days?: number | null
          id?: string
          include_comparison?: boolean | null
          name?: string
          period_preset?: string | null
          project_id?: string
          selected_metrics?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      touchpoints: {
        Row: {
          campaign_name: string | null
          channel_name: string
          created_at: string
          deal_id: string
          deal_profit: number | null
          deal_revenue: number | null
          deal_status: string | null
          id: string
          is_first: boolean | null
          is_last: boolean | null
          keyword: string | null
          position: number
          project_id: string
          source_type: Database["public"]["Enums"]["traffic_source"]
          total_in_chain: number
          touched_at: string
          visit_id: string | null
        }
        Insert: {
          campaign_name?: string | null
          channel_name: string
          created_at?: string
          deal_id: string
          deal_profit?: number | null
          deal_revenue?: number | null
          deal_status?: string | null
          id?: string
          is_first?: boolean | null
          is_last?: boolean | null
          keyword?: string | null
          position: number
          project_id: string
          source_type: Database["public"]["Enums"]["traffic_source"]
          total_in_chain: number
          touched_at: string
          visit_id?: string | null
        }
        Update: {
          campaign_name?: string | null
          channel_name?: string
          created_at?: string
          deal_id?: string
          deal_profit?: number | null
          deal_revenue?: number | null
          deal_status?: string | null
          id?: string
          is_first?: boolean | null
          is_last?: boolean | null
          keyword?: string | null
          position?: number
          project_id?: string
          source_type?: Database["public"]["Enums"]["traffic_source"]
          total_in_chain?: number
          touched_at?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "touchpoints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touchpoints_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          browser: string | null
          city: string | null
          client_id: string
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          is_bounce: boolean | null
          is_conversion: boolean | null
          landing_page: string | null
          os: string | null
          pages_viewed: number | null
          project_id: string
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string
          source_type: Database["public"]["Enums"]["traffic_source"]
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visited_at: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          client_id: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          is_bounce?: boolean | null
          is_conversion?: boolean | null
          landing_page?: string | null
          os?: string | null
          pages_viewed?: number | null
          project_id: string
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id: string
          source_type?: Database["public"]["Enums"]["traffic_source"]
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visited_at?: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          client_id?: string
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          is_bounce?: boolean | null
          is_conversion?: boolean | null
          landing_page?: string | null
          os?: string | null
          pages_viewed?: number | null
          project_id?: string
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string
          source_type?: Database["public"]["Enums"]["traffic_source"]
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configs: {
        Row: {
          created_at: string
          field_mapping: Json
          id: string
          is_active: boolean | null
          name: string
          project_id: string
          updated_at: string
          webhook_token: string
        }
        Insert: {
          created_at?: string
          field_mapping?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          project_id: string
          updated_at?: string
          webhook_token?: string
        }
        Update: {
          created_at?: string
          field_mapping?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string
          updated_at?: string
          webhook_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          headers: Json | null
          id: string
          ip_address: string | null
          project_id: string
          raw_payload: Json
          received_at: string
          status: string
          webhook_config_id: string | null
        }
        Insert: {
          error_message?: string | null
          headers?: Json | null
          id?: string
          ip_address?: string | null
          project_id: string
          raw_payload: Json
          received_at?: string
          status?: string
          webhook_config_id?: string | null
        }
        Update: {
          error_message?: string | null
          headers?: Json | null
          id?: string
          ip_address?: string | null
          project_id?: string
          raw_payload?: Json
          received_at?: string
          status?: string
          webhook_config_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_config_id_fkey"
            columns: ["webhook_config_id"]
            isOneToOne: false
            referencedRelation: "webhook_configs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_json_path: { Args: { data: Json; path: string }; Returns: string }
      has_project_access: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager"
      attribution_model:
        | "first_click"
        | "last_click"
        | "last_paid_click"
        | "linear"
        | "u_shape"
        | "time_decay"
        | "time_growth"
        | "custom"
      member_status: "active" | "pending" | "inactive"
      traffic_source:
        | "direct"
        | "organic"
        | "paid_search"
        | "paid_social"
        | "email"
        | "referral"
        | "retargeting"
        | "display"
        | "video"
        | "affiliate"
        | "sms"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager"],
      attribution_model: [
        "first_click",
        "last_click",
        "last_paid_click",
        "linear",
        "u_shape",
        "time_decay",
        "time_growth",
        "custom",
      ],
      member_status: ["active", "pending", "inactive"],
      traffic_source: [
        "direct",
        "organic",
        "paid_search",
        "paid_social",
        "email",
        "referral",
        "retargeting",
        "display",
        "video",
        "affiliate",
        "sms",
        "other",
      ],
    },
  },
} as const
