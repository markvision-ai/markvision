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
      ab_tests: {
        Row: {
          ai_recommendation: string | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          name: string
          project_id: string
          started_at: string | null
          status: string | null
          variant_a_conversions: number | null
          variant_a_name: string | null
          variant_a_visitors: number | null
          variant_b_conversions: number | null
          variant_b_name: string | null
          variant_b_visitors: number | null
          winner: string | null
        }
        Insert: {
          ai_recommendation?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name: string
          project_id: string
          started_at?: string | null
          status?: string | null
          variant_a_conversions?: number | null
          variant_a_name?: string | null
          variant_a_visitors?: number | null
          variant_b_conversions?: number | null
          variant_b_name?: string | null
          variant_b_visitors?: number | null
          winner?: string | null
        }
        Update: {
          ai_recommendation?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          project_id?: string
          started_at?: string | null
          status?: string | null
          variant_a_conversions?: number | null
          variant_a_name?: string | null
          variant_a_visitors?: number | null
          variant_b_conversions?: number | null
          variant_b_name?: string | null
          variant_b_visitors?: number | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          project_id: string
          xp_reward: number | null
        }
        Insert: {
          condition_type: string
          condition_value: number
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          project_id: string
          xp_reward?: number | null
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          project_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_assets: {
        Row: {
          ai_descriptions: Json | null
          ai_hashtags: string[] | null
          ai_headlines: Json | null
          ai_primary_text: string | null
          ai_score: number | null
          aspect_ratio: string | null
          asset_type: string
          campaign_id: string | null
          created_at: string
          file_name: string | null
          file_url: string
          id: string
          platform: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_descriptions?: Json | null
          ai_hashtags?: string[] | null
          ai_headlines?: Json | null
          ai_primary_text?: string | null
          ai_score?: number | null
          aspect_ratio?: string | null
          asset_type: string
          campaign_id?: string | null
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
          platform?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_descriptions?: Json | null
          ai_hashtags?: string[] | null
          ai_headlines?: Json | null
          ai_primary_text?: string | null
          ai_score?: number | null
          aspect_ratio?: string | null
          asset_type?: string
          campaign_id?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
          platform?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          project_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          project_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_data: Json | null
          action_result: string | null
          action_type: string
          automation_rule_id: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          lead_id: string | null
          project_id: string
        }
        Insert: {
          action_data?: Json | null
          action_result?: string | null
          action_type: string
          automation_rule_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          project_id: string
        }
        Update: {
          action_data?: Json | null
          action_result?: string | null
          action_type?: string
          automation_rule_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "crm_automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_project_id_fkey"
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
          autopilot_rules: Json | null
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
          autopilot_rules?: Json | null
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
          autopilot_rules?: Json | null
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
      competitor_monitoring: {
        Row: {
          account_handle: string
          created_at: string
          id: string
          is_active: boolean | null
          last_scanned_at: string | null
          platform: string
          project_id: string
        }
        Insert: {
          account_handle: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scanned_at?: string | null
          platform?: string
          project_id: string
        }
        Update: {
          account_handle?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scanned_at?: string | null
          platform?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_monitoring_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_factory: {
        Row: {
          audio_url: string | null
          caption: string | null
          carousel_media: Json | null
          competitor_id: string | null
          content_type: string
          created_at: string
          feedback: string | null
          final_video_url: string | null
          followers_gained: number | null
          id: string
          original_script: string | null
          project_id: string
          raw_video_url: string | null
          revenue_attributed: number | null
          rewritten_script: string | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          audio_url?: string | null
          caption?: string | null
          carousel_media?: Json | null
          competitor_id?: string | null
          content_type?: string
          created_at?: string
          feedback?: string | null
          final_video_url?: string | null
          followers_gained?: number | null
          id?: string
          original_script?: string | null
          project_id: string
          raw_video_url?: string | null
          revenue_attributed?: number | null
          rewritten_script?: string | null
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          audio_url?: string | null
          caption?: string | null
          carousel_media?: Json | null
          competitor_id?: string | null
          content_type?: string
          created_at?: string
          feedback?: string | null
          final_video_url?: string | null
          followers_gained?: number | null
          id?: string
          original_script?: string | null
          project_id?: string
          raw_video_url?: string | null
          revenue_attributed?: number | null
          rewritten_script?: string | null
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_factory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json | null
          created_at: string | null
          description: string | null
          execution_order: number | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string
          trigger_status: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id: string
          trigger_status?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string
          trigger_status?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_rules_project_id_fkey"
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
          spend_fb: number | null
          spend_google: number | null
          spend_tiktok: number | null
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
          spend_fb?: number | null
          spend_google?: number | null
          spend_tiktok?: number | null
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
          spend_fb?: number | null
          spend_google?: number | null
          spend_tiktok?: number | null
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
      diagnostic_results: {
        Row: {
          completed_at: string | null
          created_at: string | null
          diagnostic_type: string | null
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string
          result: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          diagnostic_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id: string
          result?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          diagnostic_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_messages: {
        Row: {
          channel: string
          content: string
          direction: string
          id: string
          lead_id: string | null
          media_url: string | null
          project_id: string
          read_at: string | null
          sent_at: string | null
          staff_id: string | null
          status: string | null
        }
        Insert: {
          channel: string
          content: string
          direction: string
          id?: string
          lead_id?: string | null
          media_url?: string | null
          project_id: string
          read_at?: string | null
          sent_at?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Update: {
          channel?: string
          content?: string
          direction?: string
          id?: string
          lead_id?: string | null
          media_url?: string | null
          project_id?: string
          read_at?: string | null
          sent_at?: string | null
          staff_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          name: string
          project_id: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name: string
          project_id: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          name?: string
          project_id?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_ai_trained: boolean | null
          project_id: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_ai_trained?: boolean | null
          project_id: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_ai_trained?: boolean | null
          project_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          id: string
          lead_id: string
          project_id: string
          staff_id: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          lead_id: string
          project_id: string
          staff_id?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          lead_id?: string
          project_id?: string
          staff_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          lead_id: string
          message: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          lead_id: string
          message: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          lead_id?: string
          message?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_rules: {
        Row: {
          created_at: string | null
          field: string
          id: string
          is_active: boolean | null
          name: string
          operator: string
          project_id: string
          score_delta: number
          value: string
        }
        Insert: {
          created_at?: string | null
          field: string
          id?: string
          is_active?: boolean | null
          name: string
          operator: string
          project_id: string
          score_delta: number
          value: string
        }
        Update: {
          created_at?: string | null
          field?: string
          id?: string
          is_active?: boolean | null
          name?: string
          operator?: string
          project_id?: string
          score_delta?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scoring_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_by: string
          changed_by_name: string | null
          created_at: string
          deal_amount_change: number | null
          id: string
          lead_id: string
          new_status: string
          old_status: string | null
        }
        Insert: {
          changed_by: string
          changed_by_name?: string | null
          created_at?: string
          deal_amount_change?: number | null
          id?: string
          lead_id: string
          new_status: string
          old_status?: string | null
        }
        Update: {
          changed_by?: string
          changed_by_name?: string | null
          created_at?: string
          deal_amount_change?: number | null
          id?: string
          lead_id?: string
          new_status?: string
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          appointment_date: string | null
          assigned_at: string | null
          assigned_to: string | null
          client_id: string | null
          created_at: string
          deal_amount: number | null
          email: string | null
          external_lead_id: string | null
          extra_data: Json | null
          id: string
          last_action_at: string | null
          last_automation_at: string | null
          lead_score: number | null
          ltv: number | null
          name: string | null
          phone: string | null
          project_id: string
          rejection_reason: string | null
          score_label: string | null
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
          appointment_date?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          id?: string
          last_action_at?: string | null
          last_automation_at?: string | null
          lead_score?: number | null
          ltv?: number | null
          name?: string | null
          phone?: string | null
          project_id: string
          rejection_reason?: string | null
          score_label?: string | null
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
          appointment_date?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          client_id?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          id?: string
          last_action_at?: string | null
          last_automation_at?: string | null
          lead_score?: number | null
          ltv?: number | null
          name?: string | null
          phone?: string | null
          project_id?: string
          rejection_reason?: string | null
          score_label?: string | null
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
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_basic"
            referencedColumns: ["id"]
          },
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
      scheduled_reminders: {
        Row: {
          automation_rule_id: string | null
          channel: string
          created_at: string | null
          id: string
          lead_id: string
          message_template: string | null
          project_id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          automation_rule_id?: string | null
          channel: string
          created_at?: string | null
          id?: string
          lead_id: string
          message_template?: string | null
          project_id: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          automation_rule_id?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          message_template?: string | null
          project_id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "crm_automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          avatar_url: string | null
          commission_rate: number | null
          created_at: string | null
          department: string | null
          email: string | null
          hire_date: string | null
          id: string
          level: number | null
          name: string
          phone: string | null
          position: string
          project_id: string
          salary: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          level?: number | null
          name: string
          phone?: string | null
          position?: string
          project_id: string
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          commission_rate?: number | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          level?: number | null
          name?: string
          phone?: string | null
          position?: string
          project_id?: string
          salary?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          staff_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          staff_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_achievements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_achievements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_resolved: boolean
          project_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          service_id: string | null
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_resolved?: boolean
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_resolved?: boolean
          project_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          service_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_alerts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "system_health"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check_at: string | null
          metadata: Json | null
          project_id: string | null
          service_name: string
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          service_name: string
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          service_name?: string
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_health_project_id_fkey"
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
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          lead_id: string | null
          project_id: string
          staff_id: string | null
          transaction_date: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          project_id: string
          staff_id?: string | null
          transaction_date?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string
          staff_id?: string | null
          transaction_date?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_edit_daily_data: boolean
          can_edit_plan: boolean
          can_export_data: boolean
          can_manage_leads: boolean
          can_view_revenue: boolean
          can_view_sales: boolean
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_edit_daily_data?: boolean
          can_edit_plan?: boolean
          can_export_data?: boolean
          can_manage_leads?: boolean
          can_view_revenue?: boolean
          can_view_sales?: boolean
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_edit_daily_data?: boolean
          can_edit_plan?: boolean
          can_export_data?: boolean
          can_manage_leads?: boolean
          can_view_revenue?: boolean
          can_view_sales?: boolean
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      staff_basic: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          hire_date: string | null
          id: string | null
          level: number | null
          name: string | null
          phone: string | null
          position: string | null
          project_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          xp_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string | null
          level?: number | null
          name?: string | null
          phone?: string | null
          position?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string | null
          level?: number | null
          name?: string | null
          phone?: string | null
          position?: string | null
          project_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      extract_json_path: { Args: { data: Json; path: string }; Returns: string }
      has_permission: {
        Args: { _permission: string; _project_id: string; _user_id: string }
        Returns: boolean
      }
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
