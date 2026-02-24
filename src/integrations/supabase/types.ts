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
          created_at: string | null
          id: string
          name: string
          project_id: string | null
          status: string | null
          test_type: string | null
          variant_a_url: string | null
          variant_b_url: string | null
          winner_variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          project_id?: string | null
          status?: string | null
          test_type?: string | null
          variant_a_url?: string | null
          variant_b_url?: string | null
          winner_variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          project_id?: string | null
          status?: string | null
          test_type?: string | null
          variant_a_url?: string | null
          variant_b_url?: string | null
          winner_variant_id?: string | null
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
          code: string | null
          description: string | null
          icon_name: string | null
          id: string
          name: string
          rarity: string | null
          xp_reward: number | null
        }
        Insert: {
          code?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          rarity?: string | null
          xp_reward?: number | null
        }
        Update: {
          code?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          rarity?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string | null
          title: string
          type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title: string
          type: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_accounts: {
        Row: {
          access_token: string | null
          ad_account_id: string | null
          ad_account_name: string | null
          created_at: string
          external_id: string | null
          id: string
          platform: string
          project_id: string
          selected_ad_account_name: string | null
          selected_ig_avatar: string | null
          selected_ig_username: string | null
          selected_instagram_handle: string | null
          selected_instagram_id: string | null
          selected_page_id: string | null
          selected_page_name: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          ad_account_id?: string | null
          ad_account_name?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          platform?: string
          project_id: string
          selected_ad_account_name?: string | null
          selected_ig_avatar?: string | null
          selected_ig_username?: string | null
          selected_instagram_handle?: string | null
          selected_instagram_id?: string | null
          selected_page_id?: string | null
          selected_page_name?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          ad_account_id?: string | null
          ad_account_name?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          platform?: string
          project_id?: string
          selected_ad_account_name?: string | null
          selected_ig_avatar?: string | null
          selected_ig_username?: string | null
          selected_instagram_handle?: string | null
          selected_instagram_id?: string | null
          selected_page_id?: string | null
          selected_page_name?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_assets: {
        Row: {
          ai_suggestions: Json | null
          asset_type: string | null
          created_at: string | null
          duration: number | null
          file_size: number | null
          id: string
          media_url: string | null
          name: string | null
          project_id: string | null
          thumbnail_url: string | null
          transcription: string | null
        }
        Insert: {
          ai_suggestions?: Json | null
          asset_type?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          media_url?: string | null
          name?: string | null
          project_id?: string | null
          thumbnail_url?: string | null
          transcription?: string | null
        }
        Update: {
          ai_suggestions?: Json | null
          asset_type?: string | null
          created_at?: string | null
          duration?: number | null
          file_size?: number | null
          id?: string
          media_url?: string | null
          name?: string | null
          project_id?: string | null
          thumbnail_url?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_insights: {
        Row: {
          clicks: number | null
          date_start: string | null
          date_stop: string | null
          external_id: string | null
          id: string
          impressions: number | null
          leads: number | null
          project_id: string | null
          spend: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          date_start?: string | null
          date_stop?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          leads?: number | null
          project_id?: string | null
          spend?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          date_start?: string | null
          date_stop?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          leads?: number | null
          project_id?: string | null
          spend?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_performance: {
        Row: {
          clicks: number | null
          content_id: string | null
          external_ad_id: string | null
          id: string
          leads_count: number | null
          platform: string | null
          project_id: string | null
          revenue: number | null
          spend: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          content_id?: string | null
          external_ad_id?: string | null
          id?: string
          leads_count?: number | null
          platform?: string | null
          project_id?: string | null
          revenue?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          content_id?: string | null
          external_ad_id?: string | null
          id?: string
          leads_count?: number | null
          platform?: string | null
          project_id?: string | null
          revenue?: number | null
          spend?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_performance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_performance_logs: {
        Row: {
          actions: Json | null
          clicks: number | null
          created_at: string
          date_start: string
          date_stop: string
          entity_id: string
          entity_name: string | null
          entity_type: string | null
          id: string
          impressions: number | null
          inline_link_clicks: number | null
          leads: number | null
          project_id: string | null
          spend: number | null
        }
        Insert: {
          actions?: Json | null
          clicks?: number | null
          created_at?: string
          date_start: string
          date_stop: string
          entity_id: string
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          impressions?: number | null
          inline_link_clicks?: number | null
          leads?: number | null
          project_id?: string | null
          spend?: number | null
        }
        Update: {
          actions?: Json | null
          clicks?: number | null
          created_at?: string
          date_start?: string
          date_stop?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          impressions?: number | null
          inline_link_clicks?: number | null
          leads?: number | null
          project_id?: string | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_performance_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_manager: {
        Row: {
          ad_text: string | null
          budget: number | null
          campaign_name: string | null
          created_at: string | null
          external_campaign_id: string | null
          geo_targeting: Json | null
          id: string
          platform: string
          project_id: string | null
          status: string | null
        }
        Insert: {
          ad_text?: string | null
          budget?: number | null
          campaign_name?: string | null
          created_at?: string | null
          external_campaign_id?: string | null
          geo_targeting?: Json | null
          id?: string
          platform: string
          project_id?: string | null
          status?: string | null
        }
        Update: {
          ad_text?: string | null
          budget?: number | null
          campaign_name?: string | null
          created_at?: string | null
          external_campaign_id?: string | null
          geo_targeting?: Json | null
          id?: string
          platform?: string
          project_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_manager_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_finances: {
        Row: {
          additional_costs: number | null
          created_at: string | null
          id: string
          package_price: number | null
          project_id: string | null
          staff_assigned: Json | null
          tariff_name: string | null
          team_costs: number | null
        }
        Insert: {
          additional_costs?: number | null
          created_at?: string | null
          id?: string
          package_price?: number | null
          project_id?: string | null
          staff_assigned?: Json | null
          tariff_name?: string | null
          team_costs?: number | null
        }
        Update: {
          additional_costs?: number | null
          created_at?: string | null
          id?: string
          package_price?: number | null
          project_id?: string | null
          staff_assigned?: Json | null
          tariff_name?: string | null
          team_costs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_project_finances: {
        Row: {
          id: string
          net_profit: number | null
          package_revenue: number | null
          project_id: string | null
          software_costs: number | null
          tariff_type: string | null
          team_members: Json | null
          team_salaries: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          net_profit?: number | null
          package_revenue?: number | null
          project_id?: string | null
          software_costs?: number | null
          tariff_type?: string | null
          team_members?: Json | null
          team_salaries?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          net_profit?: number | null
          package_revenue?: number | null
          project_id?: string | null
          software_costs?: number | null
          tariff_type?: string | null
          team_members?: Json | null
          team_salaries?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_project_finances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bridge_tasks: {
        Row: {
          created_at: string | null
          execution_logs: Json | null
          id: string
          project_id: string | null
          prompt: string
          response: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          execution_logs?: Json | null
          id?: string
          project_id?: string | null
          prompt: string
          response?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          execution_logs?: Json | null
          id?: string
          project_id?: string | null
          prompt?: string
          response?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          project_id: string | null
          role: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_commands: {
        Row: {
          command_type: string | null
          created_at: string | null
          id: string
          payload: Json | null
          project_id: string | null
          result: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          command_type?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          result?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          command_type?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          result?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          created_at: string | null
          id: string
          insight_text: string | null
          priority: string | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          priority?: string | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          priority?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          account_id: string | null
          campaign_name: string | null
          created_at: string | null
          id: string
          impact_prediction: string | null
          project_id: string | null
          reason: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          account_id?: string | null
          campaign_name?: string | null
          created_at?: string | null
          id?: string
          impact_prediction?: string | null
          project_id?: string | null
          reason?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          account_id?: string | null
          campaign_name?: string | null
          created_at?: string | null
          id?: string
          impact_prediction?: string | null
          project_id?: string | null
          reason?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rop_audits: {
        Row: {
          audit_date: string | null
          created_at: string | null
          critical_errors: string | null
          id: string
          overall_score: number | null
          project_id: string | null
          recommendations: string | null
        }
        Insert: {
          audit_date?: string | null
          created_at?: string | null
          critical_errors?: string | null
          id?: string
          overall_score?: number | null
          project_id?: string | null
          recommendations?: string | null
        }
        Update: {
          audit_date?: string | null
          created_at?: string | null
          critical_errors?: string | null
          id?: string
          overall_score?: number | null
          project_id?: string | null
          recommendations?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rop_audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rop_reports: {
        Row: {
          content_ideas: Json | null
          created_at: string | null
          id: string
          project_id: string | null
          report_date: string | null
          report_type: string | null
          strong_points: string | null
          summary: string | null
          top_questions: string[] | null
          weak_points: string | null
        }
        Insert: {
          content_ideas?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          report_date?: string | null
          report_type?: string | null
          strong_points?: string | null
          summary?: string | null
          top_questions?: string[] | null
          weak_points?: string | null
        }
        Update: {
          content_ideas?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          report_date?: string | null
          report_type?: string | null
          strong_points?: string | null
          summary?: string | null
          top_questions?: string[] | null
          weak_points?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_rop_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_rop_tasks: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          result_report: string | null
          status: string | null
          task_text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          result_report?: string | null
          status?: string | null
          task_text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          result_report?: string | null
          status?: string | null
          task_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_rop_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          budget: string | null
          created_at: string | null
          id: number
          name: string | null
          phone: string | null
        }
        Insert: {
          budget?: string | null
          created_at?: string | null
          id?: number
          name?: string | null
          phone?: string | null
        }
        Update: {
          budget?: string | null
          created_at?: string | null
          id?: number
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          lead_id: string | null
          project_id: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          lead_id?: string | null
          project_id?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          lead_id?: string | null
          project_id?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_auto_moves: {
        Row: {
          amount: number | null
          by_trigger: boolean | null
          details: Json | null
          diag_id: string | null
          found_by: string | null
          id: string
          lead_id: string
          notes: string | null
          performed_at: string | null
          project_id: string | null
        }
        Insert: {
          amount?: number | null
          by_trigger?: boolean | null
          details?: Json | null
          diag_id?: string | null
          found_by?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          performed_at?: string | null
          project_id?: string | null
        }
        Update: {
          amount?: number | null
          by_trigger?: boolean | null
          details?: Json | null
          diag_id?: string | null
          found_by?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          performed_at?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_at: string | null
          id: string
          operation: string
          row_data: Json | null
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          operation: string
          row_data?: Json | null
          table_name: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          operation?: string
          row_data?: Json | null
          table_name?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_flows: {
        Row: {
          created_at: string | null
          description: string | null
          execution_time: string | null
          flow_name: string
          id: string
          is_active: boolean | null
          last_run: string | null
          last_seen: string | null
          logs: string | null
          n8n_id: string
          name: string | null
          project_id: string | null
          status: string | null
          trigger_type: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          execution_time?: string | null
          flow_name: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_seen?: string | null
          logs?: string | null
          n8n_id: string
          name?: string | null
          project_id?: string | null
          status?: string | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          execution_time?: string | null
          flow_name?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          last_seen?: string | null
          logs?: string | null
          n8n_id?: string
          name?: string | null
          project_id?: string | null
          status?: string | null
          trigger_type?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          lead_id: string | null
          project_id: string | null
          rule_name: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          rule_name?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          rule_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
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
      backup_daily_data__v1: {
        Row: {
          created_at: string | null
          date: string | null
          id: string | null
          leads_count: number | null
          project_id: string | null
          revenue_sum: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string | null
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string | null
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
        }
        Relationships: []
      }
      backup_leads__v1: {
        Row: {
          ai_labels: string[] | null
          archived_at: string | null
          assigned_to: string | null
          business_turnover: number | null
          clinic_name: string | null
          created_at: string | null
          id: string | null
          is_archived: boolean | null
          last_seen_at: string | null
          lead_score: number | null
          marketing_budget: number | null
          name: string | null
          phone: string | null
          phone_normalized: string | null
          project_id: string | null
          revenue: number | null
          site_url: string | null
          source_id: string | null
          status: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ai_labels?: string[] | null
          archived_at?: string | null
          assigned_to?: string | null
          business_turnover?: number | null
          clinic_name?: string | null
          created_at?: string | null
          id?: string | null
          is_archived?: boolean | null
          last_seen_at?: string | null
          lead_score?: number | null
          marketing_budget?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          revenue?: number | null
          site_url?: string | null
          source_id?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ai_labels?: string[] | null
          archived_at?: string | null
          assigned_to?: string | null
          business_turnover?: number | null
          clinic_name?: string | null
          created_at?: string | null
          id?: string | null
          is_archived?: boolean | null
          last_seen_at?: string | null
          lead_score?: number | null
          marketing_budget?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          revenue?: number | null
          site_url?: string | null
          source_id?: string | null
          status?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      backup_profiles__v1: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_projects__v1: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          onboarding_status: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          onboarding_status?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          onboarding_status?: string | null
          organization_id?: string | null
        }
        Relationships: []
      }
      booking_changes: {
        Row: {
          created_at: string
          diagnostic_result_id: string | null
          id: number
          lead_id: string | null
          new_status: string | null
          note: string | null
          old_status: string | null
          revenue_added: number | null
          revenue_after: number | null
          revenue_before: number | null
        }
        Insert: {
          created_at?: string
          diagnostic_result_id?: string | null
          id?: number
          lead_id?: string | null
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          revenue_added?: number | null
          revenue_after?: number | null
          revenue_before?: number | null
        }
        Update: {
          created_at?: string
          diagnostic_result_id?: string | null
          id?: number
          lead_id?: string | null
          new_status?: string | null
          note?: string | null
          old_status?: string | null
          revenue_added?: number | null
          revenue_after?: number | null
          revenue_before?: number | null
        }
        Relationships: []
      }
      booking_queue: {
        Row: {
          attempts: number
          created_at: string
          diagnostic_result_id: string
          fee: number | null
          id: string
          lead_id: string | null
          locked_at: string | null
          payload: Json | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          diagnostic_result_id: string
          fee?: number | null
          id?: string
          lead_id?: string | null
          locked_at?: string | null
          payload?: Json | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          diagnostic_result_id?: string
          fee?: number | null
          id?: string
          lead_id?: string | null
          locked_at?: string | null
          payload?: Json | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          platform: string | null
          project_id: string
          source: string | null
          status: boolean | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          platform?: string | null
          project_id: string
          source?: string | null
          status?: boolean | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          platform?: string | null
          project_id?: string
          source?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      capi_events: {
        Row: {
          created_at: string | null
          custom_data: Json | null
          error_message: string | null
          event_id: string | null
          event_name: string
          event_time: string
          fb_ad_id: string | null
          fb_campaign_id: string | null
          fbclid: string | null
          id: string
          lead_id: string | null
          platform: string
          project_id: string
          response: Json | null
          sent_at: string | null
          status: string | null
          user_data: Json | null
        }
        Insert: {
          created_at?: string | null
          custom_data?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_name: string
          event_time?: string
          fb_ad_id?: string | null
          fb_campaign_id?: string | null
          fbclid?: string | null
          id?: string
          lead_id?: string | null
          platform: string
          project_id: string
          response?: Json | null
          sent_at?: string | null
          status?: string | null
          user_data?: Json | null
        }
        Update: {
          created_at?: string | null
          custom_data?: Json | null
          error_message?: string | null
          event_id?: string | null
          event_name?: string
          event_time?: string
          fb_ad_id?: string | null
          fb_campaign_id?: string | null
          fbclid?: string | null
          id?: string
          lead_id?: string | null
          platform?: string
          project_id?: string
          response?: Json | null
          sent_at?: string | null
          status?: string | null
          user_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "capi_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "capi_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capi_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_from_me: boolean | null
          sender_name: string | null
          thread_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_from_me?: boolean | null
          sender_name?: string | null
          thread_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_from_me?: boolean | null
          sender_name?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          external_chat_id: string
          id: string
          last_message: string | null
          lead_id: string | null
          platform: string
          project_id: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          external_chat_id: string
          id?: string
          last_message?: string | null
          lead_id?: string | null
          platform: string
          project_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          external_chat_id?: string
          id?: string
          last_message?: string | null
          lead_id?: string | null
          platform?: string
          project_id?: string | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "chat_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_health_scores: {
        Row: {
          checked_at: string | null
          id: string
          metrics: Json | null
          project_id: string | null
          score: number | null
        }
        Insert: {
          checked_at?: string | null
          id?: string
          metrics?: Json | null
          project_id?: string | null
          score?: number | null
        }
        Update: {
          checked_at?: string | null
          id?: string
          metrics?: Json | null
          project_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_health_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_accounts: {
        Row: {
          created_at: string | null
          id: string
          last_synced_at: string | null
          platform: string | null
          project_id: string | null
          status: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: string | null
          project_id?: string | null
          status?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          platform?: string | null
          project_id?: string | null
          status?: string | null
          username?: string
        }
        Relationships: []
      }
      competitor_monitoring: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          followers_count: number | null
          handle: string
          id: string
          last_post_url: string | null
          last_scanned_at: string | null
          platform: string | null
          project_id: string | null
          top_content_links: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle: string
          id?: string
          last_post_url?: string | null
          last_scanned_at?: string | null
          platform?: string | null
          project_id?: string | null
          top_content_links?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle?: string
          id?: string
          last_post_url?: string | null
          last_scanned_at?: string | null
          platform?: string | null
          project_id?: string | null
          top_content_links?: Json | null
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
          author_id: string | null
          body: Json | null
          body_text: string | null
          competitor_data: Json | null
          created_at: string | null
          cta_text: string | null
          current_workshop: number | null
          hook_text: string | null
          id: string
          platform_type: string | null
          project_id: string | null
          source_url: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          video_url: string | null
          voice_url: string | null
        }
        Insert: {
          author_id?: string | null
          body?: Json | null
          body_text?: string | null
          competitor_data?: Json | null
          created_at?: string | null
          cta_text?: string | null
          current_workshop?: number | null
          hook_text?: string | null
          id?: string
          platform_type?: string | null
          project_id?: string | null
          source_url?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          voice_url?: string | null
        }
        Update: {
          author_id?: string | null
          body?: Json | null
          body_text?: string | null
          competitor_data?: Json | null
          created_at?: string | null
          cta_text?: string | null
          current_workshop?: number | null
          hook_text?: string | null
          id?: string
          platform_type?: string | null
          project_id?: string | null
          source_url?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          video_url?: string | null
          voice_url?: string | null
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
      content_production_stats: {
        Row: {
          comments: number | null
          created_at: string | null
          diagnostics: number | null
          followers: number | null
          id: string
          period_end: string
          period_start: string
          project_id: string
          publications: number | null
          reach: number | null
          revenue: number | null
          sales: number | null
          stories: number | null
          updated_at: string | null
        }
        Insert: {
          comments?: number | null
          created_at?: string | null
          diagnostics?: number | null
          followers?: number | null
          id?: string
          period_end: string
          period_start: string
          project_id: string
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          sales?: number | null
          stories?: number | null
          updated_at?: string | null
        }
        Update: {
          comments?: number | null
          created_at?: string | null
          diagnostics?: number | null
          followers?: number | null
          id?: string
          period_end?: string
          period_start?: string
          project_id?: string
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          sales?: number | null
          stories?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_stats: {
        Row: {
          created_at: string | null
          date: string
          fact_comments: number | null
          fact_followers: number | null
          fact_reach: number | null
          fact_sales: number | null
          id: string
          organic_leads_count: number | null
          organic_leads_revenue: number | null
          paid_leads_count: number | null
          paid_leads_revenue: number | null
          period_type: string | null
          plan_comments: number | null
          plan_followers: number | null
          plan_leads: number | null
          plan_reach: number | null
          plan_revenue: number | null
          plan_sales: number | null
          project_id: string
          synced_at: string | null
          top_posts_by_leads: Json | null
          total_comments: number | null
          total_impressions: number | null
          total_likes: number | null
          total_posts: number | null
          total_reach: number | null
          total_reels: number | null
          total_saves: number | null
          total_shares: number | null
          total_stories: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          fact_comments?: number | null
          fact_followers?: number | null
          fact_reach?: number | null
          fact_sales?: number | null
          id?: string
          organic_leads_count?: number | null
          organic_leads_revenue?: number | null
          paid_leads_count?: number | null
          paid_leads_revenue?: number | null
          period_type?: string | null
          plan_comments?: number | null
          plan_followers?: number | null
          plan_leads?: number | null
          plan_reach?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          project_id: string
          synced_at?: string | null
          top_posts_by_leads?: Json | null
          total_comments?: number | null
          total_impressions?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_reach?: number | null
          total_reels?: number | null
          total_saves?: number | null
          total_shares?: number | null
          total_stories?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          fact_comments?: number | null
          fact_followers?: number | null
          fact_reach?: number | null
          fact_sales?: number | null
          id?: string
          organic_leads_count?: number | null
          organic_leads_revenue?: number | null
          paid_leads_count?: number | null
          paid_leads_revenue?: number | null
          period_type?: string | null
          plan_comments?: number | null
          plan_followers?: number | null
          plan_leads?: number | null
          plan_reach?: number | null
          plan_revenue?: number | null
          plan_sales?: number | null
          project_id?: string
          synced_at?: string | null
          top_posts_by_leads?: Json | null
          total_comments?: number | null
          total_impressions?: number | null
          total_likes?: number | null
          total_posts?: number | null
          total_reach?: number | null
          total_reels?: number | null
          total_saves?: number | null
          total_shares?: number | null
          total_stories?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tasks: {
        Row: {
          additional_instructions: string | null
          aspect_ratio: string | null
          created_at: string | null
          description: string | null
          id: string
          language: string | null
          main_color: string | null
          project_id: string | null
          source_type: string | null
          source_url: string | null
          status: string | null
          style_preset: string | null
          variants_count: number | null
        }
        Insert: {
          additional_instructions?: string | null
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string | null
          main_color?: string | null
          project_id?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          style_preset?: string | null
          variants_count?: number | null
        }
        Update: {
          additional_instructions?: string | null
          aspect_ratio?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string | null
          main_color?: string | null
          project_id?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          style_preset?: string | null
          variants_count?: number | null
        }
        Relationships: []
      }
      crm_automation_rules: {
        Row: {
          action_type: string | null
          condition_value: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          trigger_type: string | null
        }
        Insert: {
          action_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id?: string | null
          trigger_type?: string | null
        }
        Update: {
          action_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          trigger_type?: string | null
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
      daily_ads_insights: {
        Row: {
          account_id: string
          action_values: Json | null
          actions: Json | null
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversions: number | null
          cost_per_action_type: Json | null
          cost_per_conversion: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          frequency: number | null
          id: number
          impressions: number | null
          reach: number | null
          spend: number | null
          unique_clicks: number | null
          updated_at: string | null
        }
        Insert: {
          account_id: string
          action_values?: Json | null
          actions?: Json | null
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          frequency?: number | null
          id?: number
          impressions?: number | null
          reach?: number | null
          spend?: number | null
          unique_clicks?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          action_values?: Json | null
          actions?: Json | null
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          frequency?: number | null
          id?: number
          impressions?: number | null
          reach?: number | null
          spend?: number | null
          unique_clicks?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_data: {
        Row: {
          clicks: number | null
          comments: number | null
          date: string
          diagnostics: number | null
          engagement: number | null
          engagement_rate: number | null
          followers: number | null
          followers_today: number | null
          followers_total: number | null
          followers_yesterday: number | null
          id: string
          ig_followers: number | null
          ig_followers_new: number | null
          ig_followers_total: number | null
          impressions: number | null
          leads: number | null
          new_followers: number | null
          posts_count: number | null
          project_id: string | null
          publications: number | null
          reach: number | null
          revenue: number | null
          sales: number | null
          spend: number | null
          stories: number | null
          stories_count: number | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          comments?: number | null
          date: string
          diagnostics?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          followers?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: string
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          leads?: number | null
          new_followers?: number | null
          posts_count?: number | null
          project_id?: string | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          sales?: number | null
          spend?: number | null
          stories?: number | null
          stories_count?: number | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          comments?: number | null
          date?: string
          diagnostics?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          followers?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: string
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          leads?: number | null
          new_followers?: number | null
          posts_count?: number | null
          project_id?: string | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          sales?: number | null
          spend?: number | null
          stories?: number | null
          stories_count?: number | null
          updated_at?: string | null
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
      daily_instagram_followers: {
        Row: {
          account_id: string
          comments: number | null
          created_at: string | null
          date: string
          engagement: number | null
          engagement_rate: number | null
          followers_today: number | null
          followers_total: number | null
          followers_yesterday: number | null
          id: number
          ig_followers: number | null
          ig_followers_new: number | null
          ig_followers_total: number | null
          impressions: number | null
          instagram_username: string
          likes: number | null
          new_followers: number
          posts_count: number | null
          profile_views: number | null
          publications: number | null
          reach: number | null
          revenue: number | null
          saves: number | null
          shares: number | null
          total_followers: number | null
          website_clicks: number | null
        }
        Insert: {
          account_id: string
          comments?: number | null
          created_at?: string | null
          date: string
          engagement?: number | null
          engagement_rate?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: number
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          instagram_username: string
          likes?: number | null
          new_followers: number
          posts_count?: number | null
          profile_views?: number | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          total_followers?: number | null
          website_clicks?: number | null
        }
        Update: {
          account_id?: string
          comments?: number | null
          created_at?: string | null
          date?: string
          engagement?: number | null
          engagement_rate?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: number
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          instagram_username?: string
          likes?: number | null
          new_followers?: number
          posts_count?: number | null
          profile_views?: number | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          total_followers?: number | null
          website_clicks?: number | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          date: string | null
          day: string | null
          day_canonical: string | null
          fact_leads: number | null
          fact_revenue: number | null
          id: string
          leads_count: number | null
          project_id: string | null
          revenue_sum: number | null
          total_leads: number
          total_revenue: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          date?: string | null
          day?: string | null
          day_canonical?: string | null
          fact_leads?: number | null
          fact_revenue?: number | null
          id?: string
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
          total_leads?: number
          total_revenue?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          date?: string | null
          day?: string | null
          day_canonical?: string | null
          fact_leads?: number | null
          fact_revenue?: number | null
          id?: string
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
          total_leads?: number
          total_revenue?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_metrics_archive: {
        Row: {
          date: string | null
          day: string | null
          day_canonical: string | null
          fact_leads: number | null
          fact_revenue: number | null
          id: string | null
          leads_count: number | null
          project_id: string | null
          revenue_sum: number | null
          total_leads: number | null
          total_revenue: number | null
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          date?: string | null
          day?: string | null
          day_canonical?: string | null
          fact_leads?: number | null
          fact_revenue?: number | null
          id?: string | null
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          date?: string | null
          day?: string | null
          day_canonical?: string | null
          fact_leads?: number | null
          fact_revenue?: number | null
          id?: string | null
          leads_count?: number | null
          project_id?: string | null
          revenue_sum?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_totals: {
        Row: {
          project_id: string
          total_diagnostics: number | null
          total_leads: number | null
          total_revenue: number | null
          total_sales: number | null
          total_spend: number | null
          updated_at: string | null
        }
        Insert: {
          project_id: string
          total_diagnostics?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Update: {
          project_id?: string
          total_diagnostics?: number | null
          total_leads?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      diagnostics_data: {
        Row: {
          client_score: number | null
          clinic_name: string | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          diagnostic_type: string | null
          fee_paid: number | null
          form_data: Json | null
          id: string
          lead_id: string | null
          manager_adequacy_rating: number | null
          manager_id: string | null
          phone: string | null
          phone_normalized: string | null
          project_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          client_score?: number | null
          clinic_name?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          diagnostic_type?: string | null
          fee_paid?: number | null
          form_data?: Json | null
          id?: string
          lead_id?: string | null
          manager_adequacy_rating?: number | null
          manager_id?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          client_score?: number | null
          clinic_name?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          diagnostic_type?: string | null
          fee_paid?: number | null
          form_data?: Json | null
          id?: string
          lead_id?: string | null
          manager_adequacy_rating?: number | null
          manager_id?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          lead_id: string | null
          project_id: string | null
          type: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          project_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "finance_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      followers_history: {
        Row: {
          created_at: string | null
          date: string
          followers_count: number
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          followers_count?: number
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          followers_count?: number
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_log: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          staff_id: string | null
          xp_gained: number | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          staff_id?: string | null
          xp_gained?: number | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          staff_id?: string | null
          xp_gained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_stats: {
        Row: {
          achievements: string[] | null
          id: string
          level: number | null
          staff_id: string | null
          xp_points: number | null
        }
        Insert: {
          achievements?: string[] | null
          id?: string
          level?: number | null
          staff_id?: string | null
          xp_points?: number | null
        }
        Update: {
          achievements?: string[] | null
          id?: string
          level?: number | null
          staff_id?: string | null
          xp_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_stats_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      hibp_cache_metrics: {
        Row: {
          function_name: string
          hits: number
          id: number
          max_entries: number
          misses: number
          recorded_at: string
          requests: number
          size: number
          ttl_seconds: number
          uuid: string
        }
        Insert: {
          function_name?: string
          hits: number
          id?: number
          max_entries: number
          misses: number
          recorded_at?: string
          requests: number
          size: number
          ttl_seconds: number
          uuid: string
        }
        Update: {
          function_name?: string
          hits?: number
          id?: number
          max_entries?: number
          misses?: number
          recorded_at?: string
          requests?: number
          size?: number
          ttl_seconds?: number
          uuid?: string
        }
        Relationships: []
      }
      instagram_content_stats: {
        Row: {
          caption: string | null
          comments_count: number | null
          id: string
          impressions: number | null
          likes_count: number | null
          media_type: string | null
          permalink: string | null
          post_id: string | null
          project_id: string | null
          published_at: string | null
          reach: number | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          media_type?: string | null
          permalink?: string | null
          post_id?: string | null
          project_id?: string | null
          published_at?: string | null
          reach?: number | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          id?: string
          impressions?: number | null
          likes_count?: number | null
          media_type?: string | null
          permalink?: string | null
          post_id?: string | null
          project_id?: string | null
          published_at?: string | null
          reach?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_content_stats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_daily_insights: {
        Row: {
          account_id: string
          comments: number | null
          created_at: string | null
          date: string
          email_contacts: number | null
          engagement: number | null
          engagement_rate: number | null
          follower_count: number | null
          followers_today: number | null
          followers_total: number | null
          followers_yesterday: number | null
          id: number
          ig_followers: number | null
          ig_followers_new: number | null
          ig_followers_total: number | null
          impressions: number | null
          instagram_id: string
          instagram_username: string
          likes: number | null
          new_followers: number | null
          posts_count: number | null
          profile_views: number | null
          publications: number | null
          reach: number | null
          revenue: number | null
          saves: number | null
          shares: number | null
          total_comments: number | null
          total_likes: number | null
          total_saves: number | null
          total_shares: number | null
          updated_at: string | null
          website_clicks: number | null
        }
        Insert: {
          account_id: string
          comments?: number | null
          created_at?: string | null
          date: string
          email_contacts?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          follower_count?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: number
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          instagram_id: string
          instagram_username: string
          likes?: number | null
          new_followers?: number | null
          posts_count?: number | null
          profile_views?: number | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_saves?: number | null
          total_shares?: number | null
          updated_at?: string | null
          website_clicks?: number | null
        }
        Update: {
          account_id?: string
          comments?: number | null
          created_at?: string | null
          date?: string
          email_contacts?: number | null
          engagement?: number | null
          engagement_rate?: number | null
          follower_count?: number | null
          followers_today?: number | null
          followers_total?: number | null
          followers_yesterday?: number | null
          id?: number
          ig_followers?: number | null
          ig_followers_new?: number | null
          ig_followers_total?: number | null
          impressions?: number | null
          instagram_id?: string
          instagram_username?: string
          likes?: number | null
          new_followers?: number | null
          posts_count?: number | null
          profile_views?: number | null
          publications?: number | null
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          shares?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_saves?: number | null
          total_shares?: number | null
          updated_at?: string | null
          website_clicks?: number | null
        }
        Relationships: []
      }
      instagram_posts_stats: {
        Row: {
          ai_analysis_result: Json | null
          ai_score: number | null
          caption: string | null
          comments: number | null
          content_plan_id: string | null
          created_at: string | null
          id: string
          idea_text: string | null
          impressions: number | null
          leads_count: number | null
          likes: number | null
          media_type: string | null
          media_url: string | null
          organic_leads_count: number | null
          paid_leads: number | null
          permalink: string | null
          post_id: string
          posted_at: string | null
          project_id: string
          reach: number | null
          revenue: number | null
          saves: number | null
          scheduled_at: string | null
          shares: number | null
          status: string | null
          updated_at: string | null
          workshop: string | null
        }
        Insert: {
          ai_analysis_result?: Json | null
          ai_score?: number | null
          caption?: string | null
          comments?: number | null
          content_plan_id?: string | null
          created_at?: string | null
          id?: string
          idea_text?: string | null
          impressions?: number | null
          leads_count?: number | null
          likes?: number | null
          media_type?: string | null
          media_url?: string | null
          organic_leads_count?: number | null
          paid_leads?: number | null
          permalink?: string | null
          post_id: string
          posted_at?: string | null
          project_id: string
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          workshop?: string | null
        }
        Update: {
          ai_analysis_result?: Json | null
          ai_score?: number | null
          caption?: string | null
          comments?: number | null
          content_plan_id?: string | null
          created_at?: string | null
          id?: string
          idea_text?: string | null
          impressions?: number | null
          leads_count?: number | null
          likes?: number | null
          media_type?: string | null
          media_url?: string | null
          organic_leads_count?: number | null
          paid_leads?: number | null
          permalink?: string | null
          post_id?: string
          posted_at?: string | null
          project_id?: string
          reach?: number | null
          revenue?: number | null
          saves?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          workshop?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          api_token: string | null
          expires_at: string | null
          id: string
          instance_id: string | null
          platform: string | null
          project_id: string | null
          refresh_token: string | null
          settings: Json | null
          status: string | null
          tg_bot_token: string | null
          tg_chat_id: string | null
        }
        Insert: {
          access_token?: string | null
          api_token?: string | null
          expires_at?: string | null
          id?: string
          instance_id?: string | null
          platform?: string | null
          project_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          status?: string | null
          tg_bot_token?: string | null
          tg_chat_id?: string | null
        }
        Update: {
          access_token?: string | null
          api_token?: string | null
          expires_at?: string | null
          id?: string
          instance_id?: string | null
          platform?: string | null
          project_id?: string | null
          refresh_token?: string | null
          settings?: Json | null
          status?: string | null
          tg_bot_token?: string | null
          tg_chat_id?: string | null
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
      job_errors: {
        Row: {
          attempts_count: number
          context: Json | null
          error_message: string | null
          error_text: string | null
          function_name: string | null
          id: number
          job_name: string | null
          last_attempt_at: string | null
          last_error: string | null
          notified_at: string | null
          occurred_at: string | null
          stack_trace: string | null
        }
        Insert: {
          attempts_count?: number
          context?: Json | null
          error_message?: string | null
          error_text?: string | null
          function_name?: string | null
          id?: number
          job_name?: string | null
          last_attempt_at?: string | null
          last_error?: string | null
          notified_at?: string | null
          occurred_at?: string | null
          stack_trace?: string | null
        }
        Update: {
          attempts_count?: number
          context?: Json | null
          error_message?: string | null
          error_text?: string | null
          function_name?: string | null
          id?: number
          job_name?: string | null
          last_attempt_at?: string | null
          last_error?: string | null
          notified_at?: string | null
          occurred_at?: string | null
          stack_trace?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          project_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string
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
      kv_store: {
        Row: {
          created_at: string | null
          key: string
          owner_id: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          owner_id?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          owner_id?: string | null
          value?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string | null
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_logs: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          lead_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          lead_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          message_text: string | null
          payload: Json | null
          sender: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message_text?: string | null
          payload?: Json | null
          sender?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          message_text?: string | null
          payload?: Json | null
          sender?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          lead_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          lead_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_touchpoints: {
        Row: {
          campaign: string | null
          content: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          source: string | null
          timestamp: string | null
        }
        Insert: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          source?: string | null
          timestamp?: string | null
        }
        Update: {
          campaign?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          source?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_touchpoints_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_touchpoints_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ab_variant: string | null
          ai_labels: string[] | null
          appointment_date: string | null
          appointment_time: string | null
          archived_at: string | null
          assigned_at: string | null
          assigned_to: string | null
          automation_active: boolean | null
          budget: string | null
          budget_tier: string | null
          business_turnover: number | null
          chat_history: Json | null
          client_id: string | null
          client_type: string | null
          clinic_name: string | null
          clinic_name_c: string | null
          clinic_name_old: string | null
          contact_name: string | null
          created_at: string | null
          deal_amount: number | null
          dream_outcome: string | null
          email: string | null
          external_lead_id: string | null
          extra_data: Json | null
          fb_ad_id: string | null
          fb_ad_account_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gap_value: number | null
          guarantee_confirmed: boolean | null
          id: string
          is_archived: boolean | null
          is_system_migration: boolean | null
          is_video_completed: boolean | null
          last_action_at: string | null
          last_migrated_at: string | null
          last_migrated_by: string | null
          last_seen_at: string | null
          last_status_change: string | null
          lead_category: string | null
          lead_score: string | null
          lead_source: string | null
          lead_type: string | null
          ltv: number | null
          manager_comment: string | null
          marketing_budget: number | null
          marketing_budget_total: number | null
          name: string | null
          organic_post_id: string | null
          pain_score: number | null
          payment_receipt_url: string | null
          payment_status: string | null
          phone: string | null
          phone_normalized: string | null
          post_id: string | null
          project_id: string | null
          publication_id: string | null
          rejection_reason: string | null
          revenue: number | null
          score: string | null
          score_label: string | null
          screenshot_url: string | null
          selected_date: string | null
          site_url: string | null
          source: string | null
          source_id: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visit_id: string | null
          vsl_watch_time: number | null
        }
        Insert: {
          ab_variant?: string | null
          ai_labels?: string[] | null
          appointment_date?: string | null
          appointment_time?: string | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          automation_active?: boolean | null
          budget?: string | null
          budget_tier?: string | null
          business_turnover?: number | null
          chat_history?: Json | null
          client_id?: string | null
          client_type?: string | null
          clinic_name?: string | null
          clinic_name_c?: string | null
          clinic_name_old?: string | null
          contact_name?: string | null
          created_at?: string | null
          deal_amount?: number | null
          dream_outcome?: string | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_id?: string | null
          fb_ad_account_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gap_value?: number | null
          guarantee_confirmed?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_system_migration?: boolean | null
          is_video_completed?: boolean | null
          last_action_at?: string | null
          last_migrated_at?: string | null
          last_migrated_by?: string | null
          last_seen_at?: string | null
          last_status_change?: string | null
          lead_category?: string | null
          lead_score?: string | null
          lead_source?: string | null
          lead_type?: string | null
          ltv?: number | null
          manager_comment?: string | null
          marketing_budget?: number | null
          marketing_budget_total?: number | null
          name?: string | null
          organic_post_id?: string | null
          pain_score?: number | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone?: string | null
          phone_normalized?: string | null
          post_id?: string | null
          project_id?: string | null
          publication_id?: string | null
          rejection_reason?: string | null
          revenue?: number | null
          score?: string | null
          score_label?: string | null
          screenshot_url?: string | null
          selected_date?: string | null
          site_url?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string | null
          vsl_watch_time?: number | null
        }
        Update: {
          ab_variant?: string | null
          ai_labels?: string[] | null
          appointment_date?: string | null
          appointment_time?: string | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          automation_active?: boolean | null
          budget?: string | null
          budget_tier?: string | null
          business_turnover?: number | null
          chat_history?: Json | null
          client_id?: string | null
          client_type?: string | null
          clinic_name?: string | null
          clinic_name_c?: string | null
          clinic_name_old?: string | null
          contact_name?: string | null
          created_at?: string | null
          deal_amount?: number | null
          dream_outcome?: string | null
          email?: string | null
          external_lead_id?: string | null
          extra_data?: Json | null
          fb_ad_id?: string | null
          fb_ad_account_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gap_value?: number | null
          guarantee_confirmed?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_system_migration?: boolean | null
          is_video_completed?: boolean | null
          last_action_at?: string | null
          last_migrated_at?: string | null
          last_migrated_by?: string | null
          last_seen_at?: string | null
          last_status_change?: string | null
          lead_category?: string | null
          lead_score?: string | null
          lead_source?: string | null
          lead_type?: string | null
          ltv?: number | null
          manager_comment?: string | null
          marketing_budget?: number | null
          marketing_budget_total?: number | null
          name?: string | null
          organic_post_id?: string | null
          pain_score?: number | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          phone?: string | null
          phone_normalized?: string | null
          post_id?: string | null
          project_id?: string | null
          publication_id?: string | null
          rejection_reason?: string | null
          revenue?: number | null
          score?: string | null
          score_label?: string | null
          screenshot_url?: string | null
          selected_date?: string | null
          site_url?: string | null
          source?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string | null
          vsl_watch_time?: number | null
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
            foreignKeyName: "leads_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_backup_audit: {
        Row: {
          backup_table: string
          created_at: string | null
          id: string
          notes: string | null
          total_rows: number | null
        }
        Insert: {
          backup_table: string
          created_at?: string | null
          id?: string
          notes?: string | null
          total_rows?: number | null
        }
        Update: {
          backup_table?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          total_rows?: number | null
        }
        Relationships: []
      }
      lookup_statuses: {
        Row: {
          entity: string
          id: number
          status: string
          user_id: string | null
        }
        Insert: {
          entity: string
          id?: number
          status: string
          user_id?: string | null
        }
        Update: {
          entity?: string
          id?: number
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_stats: {
        Row: {
          ad_account_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversations: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          purchases: number | null
          project_id: string
          raw_data: Json | null
          reach: number | null
          revenue: number | null
          roi: number | null
          source: string
          spend: number | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          ad_account_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversations?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          leads?: number | null
          purchases?: number | null
          project_id: string
          raw_data?: Json | null
          reach?: number | null
          revenue?: number | null
          roi?: number | null
          source?: string
          spend?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ad_account_id?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversations?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          purchases?: number | null
          project_id?: string
          raw_data?: Json | null
          reach?: number | null
          revenue?: number | null
          roi?: number | null
          source?: string
          spend?: number | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          sender_type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          sender_type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_history: {
        Row: {
          details: Json | null
          id: number
          name: string
          ran_at: string | null
        }
        Insert: {
          details?: Json | null
          id?: number
          name: string
          ran_at?: string | null
        }
        Update: {
          details?: Json | null
          id?: number
          name?: string
          ran_at?: string | null
        }
        Relationships: []
      }
      monitor_alerts: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          severity: string
          source: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          severity: string
          source: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          severity?: string
          source?: string
        }
        Relationships: []
      }
      monthly_financial_plans: {
        Row: {
          avg_check: number
          cpl_avg: number
          cpl_best: number
          cpl_worst: number
          cr_lead_visit: number
          cr_visit_sale: number
          created_at: string
          id: string
          month_date: string
          project_id: string
          revenue_goal: number
          updated_at: string
        }
        Insert: {
          avg_check?: number
          cpl_avg?: number
          cpl_best?: number
          cpl_worst?: number
          cr_lead_visit?: number
          cr_visit_sale?: number
          created_at?: string
          id?: string
          month_date: string
          project_id: string
          revenue_goal?: number
          updated_at?: string
        }
        Update: {
          avg_check?: number
          cpl_avg?: number
          cpl_best?: number
          cpl_worst?: number
          cr_lead_visit?: number
          cr_visit_sale?: number
          created_at?: string
          id?: string
          month_date?: string
          project_id?: string
          revenue_goal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_financial_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          project_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          project_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
        }
        Relationships: []
      }
      onboarding_status: {
        Row: {
          current_step: number | null
          id: string
          is_completed: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_step?: number | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          id: string
          lead_id: string | null
          payment_date: string | null
          project_id: string | null
          service_name: string | null
        }
        Insert: {
          amount: number
          id?: string
          lead_id?: string | null
          payment_date?: string | null
          project_id?: string | null
          service_name?: string | null
        }
        Update: {
          amount?: number
          id?: string
          lead_id?: string | null
          payment_date?: string | null
          project_id?: string | null
          service_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_configs: {
        Row: {
          created_at: string | null
          events_config: Json | null
          fb_access_token: string | null
          fb_pixel_id: string | null
          fb_test_event_code: string | null
          ga_api_secret: string | null
          ga_measurement_id: string | null
          id: string
          is_active: boolean | null
          project_id: string
          tiktok_access_token: string | null
          tiktok_pixel_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          events_config?: Json | null
          fb_access_token?: string | null
          fb_pixel_id?: string | null
          fb_test_event_code?: string | null
          ga_api_secret?: string | null
          ga_measurement_id?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          events_config?: Json | null
          fb_access_token?: string | null
          fb_pixel_id?: string | null
          fb_test_event_code?: string | null
          ga_api_secret?: string | null
          ga_measurement_id?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pixel_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_data: {
        Row: {
          clicks: number | null
          diagnostics: number | null
          followers: number
          id: string
          impressions: number | null
          leads: number | null
          month: string
          project_id: string | null
          revenue: number | null
          sales: number | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          diagnostics?: number | null
          followers?: number
          id?: string
          impressions?: number | null
          leads?: number | null
          month: string
          project_id?: string | null
          revenue?: number | null
          sales?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          diagnostics?: number | null
          followers?: number
          id?: string
          impressions?: number | null
          leads?: number | null
          month?: string
          project_id?: string | null
          revenue?: number | null
          sales?: number | null
          spend?: number | null
          updated_at?: string | null
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
      processed_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          name: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      project_access: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_context: {
        Row: {
          context_key: string | null
          context_value: Json | null
          created_at: string | null
          id: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          context_key?: string | null
          context_value?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          context_key?: string | null
          context_value?: Json | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_kpi: {
        Row: {
          avg_check: number | null
          created_at: string | null
          id: string
          planned_budget: number | null
          planned_cpl: number | null
          project_id: string | null
          target_revenue: number | null
        }
        Insert: {
          avg_check?: number | null
          created_at?: string | null
          id?: string
          planned_budget?: number | null
          planned_cpl?: number | null
          project_id?: string | null
          target_revenue?: number | null
        }
        Update: {
          avg_check?: number | null
          created_at?: string | null
          id?: string
          planned_budget?: number | null
          planned_cpl?: number | null
          project_id?: string | null
          target_revenue?: number | null
        }
        Relationships: []
      }
      project_kpi_plans: {
        Row: {
          avg_check: number | null
          created_at: string | null
          id: string
          lead_to_visit_cr: number | null
          planned_cpl: number | null
          project_id: string | null
          required_budget: number | null
          target_revenue: number | null
          visit_to_sale_cr: number | null
        }
        Insert: {
          avg_check?: number | null
          created_at?: string | null
          id?: string
          lead_to_visit_cr?: number | null
          planned_cpl?: number | null
          project_id?: string | null
          required_budget?: number | null
          target_revenue?: number | null
          visit_to_sale_cr?: number | null
        }
        Update: {
          avg_check?: number | null
          created_at?: string | null
          id?: string
          lead_to_visit_cr?: number | null
          planned_cpl?: number | null
          project_id?: string | null
          required_budget?: number | null
          target_revenue?: number | null
          visit_to_sale_cr?: number | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          organization_id: string | null
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          meta_access_token: string | null
          meta_ad_account_id: string | null
          n8n_webhook_url: string | null
          name: string
          onboarding_status: string | null
          organization_id: string | null
          owner_id: string | null
          project_type: string | null
          settings: Json | null
          status: string | null
          telegram_chat_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          n8n_webhook_url?: string | null
          name: string
          onboarding_status?: string | null
          organization_id?: string | null
          owner_id?: string | null
          project_type?: string | null
          settings?: Json | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          n8n_webhook_url?: string | null
          name?: string
          onboarding_status?: string | null
          organization_id?: string | null
          owner_id?: string | null
          project_type?: string | null
          settings?: Json | null
          status?: string | null
          telegram_chat_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "public.leads_backup_20260109_081111": {
        Row: {
          ai_labels: string[] | null
          archived_at: string | null
          assigned_to: string | null
          business_turnover: number | null
          clinic_name: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_system_migration: boolean | null
          last_migrated_at: string | null
          last_migrated_by: string | null
          last_seen_at: string | null
          lead_score: number | null
          marketing_budget: number | null
          name: string | null
          phone: string | null
          phone_normalized: string | null
          project_id: string | null
          revenue: number | null
          site_url: string | null
          source_id: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ai_labels?: string[] | null
          archived_at?: string | null
          assigned_to?: string | null
          business_turnover?: number | null
          clinic_name?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_system_migration?: boolean | null
          last_migrated_at?: string | null
          last_migrated_by?: string | null
          last_seen_at?: string | null
          lead_score?: number | null
          marketing_budget?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          revenue?: number | null
          site_url?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ai_labels?: string[] | null
          archived_at?: string | null
          assigned_to?: string | null
          business_turnover?: number | null
          clinic_name?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_system_migration?: boolean | null
          last_migrated_at?: string | null
          last_migrated_by?: string | null
          last_seen_at?: string | null
          lead_score?: number | null
          marketing_budget?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          project_id?: string | null
          revenue?: number | null
          site_url?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      publications: {
        Row: {
          channel: string | null
          clicks: number | null
          comments: number | null
          created_at: string | null
          external_id: string | null
          id: string
          media_url: string | null
          preview_url: string | null
          project_id: string | null
          reach: number | null
          title: string | null
        }
        Insert: {
          channel?: string | null
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          media_url?: string | null
          preview_url?: string | null
          project_id?: string | null
          reach?: number | null
          title?: string | null
        }
        Update: {
          channel?: string | null
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          external_id?: string | null
          id?: string
          media_url?: string | null
          preview_url?: string | null
          project_id?: string | null
          reach?: number | null
          title?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          certificate_amount: number | null
          created_at: string | null
          friend_name: string | null
          friend_phone: string | null
          id: string
          referrer_id: string | null
          status: string | null
        }
        Insert: {
          certificate_amount?: number | null
          created_at?: string | null
          friend_name?: string | null
          friend_phone?: string | null
          id?: string
          referrer_id?: string | null
          status?: string | null
        }
        Update: {
          certificate_amount?: number | null
          created_at?: string | null
          friend_name?: string | null
          friend_phone?: string | null
          id?: string
          referrer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_store: {
        Row: {
          id: string
          image_url: string | null
          price_coins: number
          project_id: string | null
          stock: number | null
          title: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          price_coins: number
          project_id?: string | null
          stock?: number | null
          title: string
        }
        Update: {
          id?: string
          image_url?: string | null
          price_coins?: number
          project_id?: string | null
          stock?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_store_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_audit: {
        Row: {
          command_tag: string | null
          ddl: string | null
          event_tstamp: string | null
          id: string
          object_identity: string | null
          object_type: string | null
          username: string | null
        }
        Insert: {
          command_tag?: string | null
          ddl?: string | null
          event_tstamp?: string | null
          id?: string
          object_identity?: string | null
          object_type?: string | null
          username?: string | null
        }
        Update: {
          command_tag?: string | null
          ddl?: string | null
          event_tstamp?: string | null
          id?: string
          object_identity?: string | null
          object_type?: string | null
          username?: string | null
        }
        Relationships: []
      }
      room_members: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      schedule_settings: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          project_id: string | null
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migration_rollbacks: {
        Row: {
          created_at: string
          rollback_sql: string
          version: string
        }
        Insert: {
          created_at?: string
          rollback_sql: string
          version: string
        }
        Update: {
          created_at?: string
          rollback_sql?: string
          version?: string
        }
        Relationships: []
      }
      schema_migrations_audit: {
        Row: {
          applied_at: string
          applied_by: string | null
          description: string
          pr_url: string | null
          version: string
        }
        Insert: {
          applied_at?: string
          applied_by?: string | null
          description: string
          pr_url?: string | null
          version: string
        }
        Update: {
          applied_at?: string
          applied_by?: string | null
          description?: string
          pr_url?: string | null
          version?: string
        }
        Relationships: []
      }
      scoring_insights: {
        Row: {
          created_at: string | null
          id: string
          impact_percent: number | null
          insight_text: string
          project_id: string | null
          recommended_points: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          impact_percent?: number | null
          insight_text: string
          project_id?: string | null
          recommended_points?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          impact_percent?: number | null
          insight_text?: string
          project_id?: string | null
          recommended_points?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_rules: {
        Row: {
          created_at: string | null
          criteria_name: string
          id: string
          points: number | null
          project_id: string | null
        }
        Insert: {
          created_at?: string | null
          criteria_name: string
          id?: string
          points?: number | null
          project_id?: string | null
        }
        Update: {
          created_at?: string | null
          criteria_name?: string
          id?: string
          points?: number | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          level: number | null
          name: string | null
          project_id: string | null
          role: string | null
          status: string | null
          total_earned: number | null
          updated_at: string | null
          user_id: string | null
          xp_points: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          level?: number | null
          name?: string | null
          project_id?: string | null
          role?: string | null
          status?: string | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          level?: number | null
          name?: string | null
          project_id?: string | null
          role?: string | null
          status?: string | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
      staff_earnings: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          lead_id: string | null
          staff_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          staff_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_earnings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "staff_earnings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_sessions: {
        Row: {
          competitor_advantage: string | null
          conversion_to_plan: number | null
          created_at: string | null
          current_cpl: number | null
          current_cpv: number | null
          id: string
          lead_id: string | null
          marketing_team_details: string | null
          selected_tariff: string | null
          target_revenue_3months: number | null
        }
        Insert: {
          competitor_advantage?: string | null
          conversion_to_plan?: number | null
          created_at?: string | null
          current_cpl?: number | null
          current_cpv?: number | null
          id?: string
          lead_id?: string | null
          marketing_team_details?: string | null
          selected_tariff?: string | null
          target_revenue_3months?: number | null
        }
        Update: {
          competitor_advantage?: string | null
          conversion_to_plan?: number | null
          created_at?: string | null
          current_cpl?: number | null
          current_cpv?: number | null
          id?: string
          lead_id?: string | null
          marketing_team_details?: string | null
          selected_tariff?: string | null
          target_revenue_3months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "strategy_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_errors: {
        Row: {
          actual_leads: number | null
          actual_revenue: number | null
          checked_at: string | null
          date: string | null
          details: Json | null
          expected_leads: number | null
          expected_revenue: number | null
          id: number
          project_id: string | null
        }
        Insert: {
          actual_leads?: number | null
          actual_revenue?: number | null
          checked_at?: string | null
          date?: string | null
          details?: Json | null
          expected_leads?: number | null
          expected_revenue?: number | null
          id?: number
          project_id?: string | null
        }
        Update: {
          actual_leads?: number | null
          actual_revenue?: number | null
          checked_at?: string | null
          date?: string | null
          details?: Json | null
          expected_leads?: number | null
          expected_revenue?: number | null
          id?: number
          project_id?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          project_id: string | null
          severity: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          project_id?: string | null
          severity?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          project_id?: string | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          error_message: string | null
          id: string
          last_check_at: string | null
          project_id: string | null
          service_name: string
          status: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          project_id?: string | null
          service_name: string
          status?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          last_check_at?: string | null
          project_id?: string | null
          service_name?: string
          status?: string | null
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
      system_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          project_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          project_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          project_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_owners: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      system_status: {
        Row: {
          id: string
          last_seen: string | null
        }
        Insert: {
          id?: string
          last_seen?: string | null
        }
        Update: {
          id?: string
          last_seen?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          id: string
          permission: string | null
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          permission?: string | null
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          permission?: string | null
          project_id?: string | null
          user_id?: string | null
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
      user_preferences: {
        Row: {
          dashboard_layout: Json | null
          theme_preference: string | null
          user_id: string
        }
        Insert: {
          dashboard_layout?: Json | null
          theme_preference?: string | null
          user_id: string
        }
        Update: {
          dashboard_layout?: Json | null
          theme_preference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_user_id: string
          created_at: string | null
          id: string
          organization_id: string | null
          role: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_results: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          calculated_savings: number | null
          client_name: string | null
          client_score: number | null
          clinic_name: string | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          current_marketing_spend: number | null
          diagnostics_data_id: string | null
          external_event_id: string | null
          fee_paid: number | null
          form_data: Json | null
          has_marketing_team: boolean | null
          id: string
          lead_id: string | null
          manager_adequacy_rating: number | null
          manager_comment: string | null
          manager_id: string | null
          manager_name: string | null
          manager_solvency: string | null
          manager_urgency: string | null
          persona_type: string | null
          phone: string | null
          referral_source: string | null
          status: string | null
          training_participants_count: number | null
          user_id: string | null
          visit_type: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          calculated_savings?: number | null
          client_name?: string | null
          client_score?: number | null
          clinic_name?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_marketing_spend?: number | null
          diagnostics_data_id?: string | null
          external_event_id?: string | null
          fee_paid?: number | null
          form_data?: Json | null
          has_marketing_team?: boolean | null
          id?: string
          lead_id?: string | null
          manager_adequacy_rating?: number | null
          manager_comment?: string | null
          manager_id?: string | null
          manager_name?: string | null
          manager_solvency?: string | null
          manager_urgency?: string | null
          persona_type?: string | null
          phone?: string | null
          referral_source?: string | null
          status?: string | null
          training_participants_count?: number | null
          user_id?: string | null
          visit_type?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          calculated_savings?: number | null
          client_name?: string | null
          client_score?: number | null
          clinic_name?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_marketing_spend?: number | null
          diagnostics_data_id?: string | null
          external_event_id?: string | null
          fee_paid?: number | null
          form_data?: Json | null
          has_marketing_team?: boolean | null
          id?: string
          lead_id?: string | null
          manager_adequacy_rating?: number | null
          manager_comment?: string | null
          manager_id?: string | null
          manager_name?: string | null
          manager_solvency?: string | null
          manager_urgency?: string | null
          persona_type?: string | null
          phone?: string | null
          referral_source?: string | null
          status?: string | null
          training_participants_count?: number | null
          user_id?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "dashboard_upcoming_diagnostics"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "diagnostic_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_diagnostic_results_diagnostics_data"
            columns: ["diagnostics_data_id"]
            isOneToOne: false
            referencedRelation: "diagnostics_data"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          received_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          received_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          received_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string | null
          id: number
          name: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      content_items: {
        Row: {
          ai_analysis_result: Json | null
          ai_score: number | null
          caption: string | null
          comments_count: number | null
          content_type: string | null
          created_at: string | null
          engagement_rate: number | null
          id: string | null
          idea_text: string | null
          impressions: number | null
          lead_conversion_rate: number | null
          leads_count: number | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          organic_leads_count: number | null
          paid_leads_count: number | null
          permalink: string | null
          post_id: string | null
          project_id: string | null
          published_at: string | null
          reach: number | null
          revenue: number | null
          saves_count: number | null
          scheduled_at: string | null
          shares_count: number | null
          status: string | null
          updated_at: string | null
          workshop: string | null
        }
        Insert: {
          ai_analysis_result?: Json | null
          ai_score?: number | null
          caption?: string | null
          comments_count?: number | null
          content_type?: never
          created_at?: string | null
          engagement_rate?: never
          id?: string | null
          idea_text?: string | null
          impressions?: number | null
          lead_conversion_rate?: never
          leads_count?: number | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          organic_leads_count?: number | null
          paid_leads_count?: number | null
          permalink?: string | null
          post_id?: string | null
          project_id?: string | null
          published_at?: string | null
          reach?: number | null
          revenue?: number | null
          saves_count?: number | null
          scheduled_at?: string | null
          shares_count?: number | null
          status?: string | null
          updated_at?: string | null
          workshop?: string | null
        }
        Update: {
          ai_analysis_result?: Json | null
          ai_score?: number | null
          caption?: string | null
          comments_count?: number | null
          content_type?: never
          created_at?: string | null
          engagement_rate?: never
          id?: string | null
          idea_text?: string | null
          impressions?: number | null
          lead_conversion_rate?: never
          leads_count?: number | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          organic_leads_count?: number | null
          paid_leads_count?: number | null
          permalink?: string | null
          post_id?: string | null
          project_id?: string | null
          published_at?: string | null
          reach?: number | null
          revenue?: number | null
          saves_count?: number | null
          scheduled_at?: string | null
          shares_count?: number | null
          status?: string | null
          updated_at?: string | null
          workshop?: string | null
        }
        Relationships: []
      }
      connected_ad_accounts: {
        Row: {
          account_name: string | null
          access_token: string | null
          fb_ad_account_id: string | null
          id: string | null
          project_id: string | null
          status: boolean | null
        }
        Insert: {
          account_name?: string | null
          access_token?: string | null
          fb_ad_account_id?: string | null
          id?: string | null
          project_id?: string | null
          status?: boolean | null
        }
        Update: {
          account_name?: string | null
          access_token?: string | null
          fb_ad_account_id?: string | null
          id?: string | null
          project_id?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      content_leads_detail: {
        Row: {
          caption: string | null
          conversion_rate: number | null
          impressions: number | null
          leads_from_post: number | null
          media_type: string | null
          permalink: string | null
          post_id: string | null
          project_id: string | null
          reach: number | null
          revenue_from_post: number | null
          sales_from_post: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_upcoming_diagnostics: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          diagnostic_id: string | null
          diagnostic_status: string | null
          lead_id: string | null
          lead_name: string | null
          phone: string | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_safe: {
        Row: {
          access_token_masked: string | null
          api_token_masked: string | null
          expires_at: string | null
          id: string | null
          instance_id: string | null
          platform: string | null
          project_id: string | null
          settings: Json | null
          status: string | null
          tg_bot_token_masked: string | null
        }
        Insert: {
          access_token_masked?: never
          api_token_masked?: never
          expires_at?: string | null
          id?: string | null
          instance_id?: string | null
          platform?: string | null
          project_id?: string | null
          settings?: Json | null
          status?: string | null
          tg_bot_token_masked?: never
        }
        Update: {
          access_token_masked?: never
          api_token_masked?: never
          expires_at?: string | null
          id?: string | null
          instance_id?: string | null
          platform?: string | null
          project_id?: string | null
          settings?: Json | null
          status?: string | null
          tg_bot_token_masked?: never
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
      organic_leads_summary: {
        Row: {
          organic_leads_count: number | null
          organic_leads_revenue: number | null
          organic_sales_count: number | null
          organic_sales_revenue: number | null
          paid_leads_count: number | null
          paid_leads_revenue: number | null
          paid_sales_count: number | null
          project_id: string | null
          total_leads_count: number | null
          total_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      v_kpi_daily: {
        Row: {
          cost_per_client: number | null
          cost_per_diagnostic: number | null
          cost_per_lead: number | null
          cr_diagnostic_to_sale: number | null
          cr_impression_to_lead: number | null
          cr_lead_to_diagnostic: number | null
          date: string | null
          diagnostics: number | null
          impressions: number | null
          leads: number | null
          project_id: string | null
          sales: number | null
          spend: number | null
        }
        Insert: {
          cost_per_client?: never
          cost_per_diagnostic?: never
          cost_per_lead?: never
          cr_diagnostic_to_sale?: never
          cr_impression_to_lead?: never
          cr_lead_to_diagnostic?: never
          date?: string | null
          diagnostics?: never
          impressions?: never
          leads?: never
          project_id?: string | null
          sales?: never
          spend?: never
        }
        Update: {
          cost_per_client?: never
          cost_per_diagnostic?: never
          cost_per_lead?: never
          cr_diagnostic_to_sale?: never
          cr_impression_to_lead?: never
          cr_lead_to_diagnostic?: never
          date?: string | null
          diagnostics?: never
          impressions?: never
          leads?: never
          project_id?: string | null
          sales?: never
          spend?: never
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
      v_kpi_last_30d: {
        Row: {
          cost_per_client: number | null
          cost_per_diagnostic: number | null
          cost_per_lead: number | null
          cr_diagnostic_to_sale: number | null
          cr_impression_to_lead: number | null
          cr_lead_to_diagnostic: number | null
          diagnostics: number | null
          impressions: number | null
          leads: number | null
          project_id: string | null
          sales: number | null
          spend: number | null
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
      v_plan_fact_totals: {
        Row: {
          clicks_total: number | null
          followers_total: number | null
          impressions_total: number | null
          leads_total: number | null
          period_month: string | null
          project_id: string | null
          spend_total: number | null
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
    }
    Functions: {
      _is_project_member: { Args: { p_project_id: string }; Returns: boolean }
      _is_project_member_v2: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      aggregate_leads_daily: { Args: never; Returns: undefined }
      clean_old_flows: { Args: never; Returns: undefined }
      complete_diagnostic: {
        Args: { p_answers: Json; p_gap_value?: number; p_lead_id: string }
        Returns: undefined
      }
      complete_diagnostic_v2: {
        Args: { p_answers: Json; p_gap_value?: number; p_lead_id: string }
        Returns: undefined
      }
      count_estimate: { Args: { target_table: unknown }; Returns: number }
      create_lead: {
        Args: {
          p_clinic_name?: string
          p_name: string
          p_phone: string
          p_project_id: string
          p_source?: string
        }
        Returns: string
      }
      create_lead_safe: {
        Args: {
          p_clinic_name: string
          p_name: string
          p_phone: string
          p_project_id: string
          p_source: string
        }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      exec_sql: { Args: { sql_text: string }; Returns: Json }
      fn_dashboard_stats: {
        Args: never
        Returns: {
          total_diagnostics: number
          total_leads: number
          total_revenue: number
          total_sales: number
        }[]
      }
      fn_dashboard_stats_secure: {
        Args: never
        Returns: {
          total_diagnostics: number
          total_leads: number
          total_revenue: number
          total_sales: number
        }[]
      }
      fn_process_diagnostic_link: {
        Args: { diag_id: string }
        Returns: undefined
      }
      force_move_lead_logic: {
        Args: { p_amount_source?: string; p_lead_id: string }
        Returns: undefined
      }
      generate_slug: { Args: { input: string }; Returns: string }
      get_auth_uid: { Args: never; Returns: string }
      get_content_factory_stats: {
        Args: { p_project_id: string }
        Returns: {
          fact_comments: number
          fact_followers: number
          fact_leads: number
          fact_reach: number
          ideas_count: number
          in_production_count: number
          organic_leads: number
          organic_revenue: number
          organic_sales: number
          plan_comments: number
          plan_followers: number
          plan_leads: number
          plan_reach: number
          published_count: number
          ready_count: number
        }[]
      }
      get_content_workshop_stats: {
        Args: { p_date_from?: string; p_date_to?: string; p_project_id: string }
        Returns: {
          avg_engagement_rate: number
          avg_lead_conversion_rate: number
          content_type: string
          total_comments: number
          total_impressions: number
          total_items: number
          total_likes: number
          total_organic_leads: number
          total_reach: number
        }[]
      }
      get_current_tenant: { Args: never; Returns: string }
      get_project_metrics: {
        Args: { days: number; project_id: string }
        Returns: {
          date: string
          diagnostics: number
          leads: number
          revenue: number
          sales: number
        }[]
      }
      get_top_content_by_leads: {
        Args: {
          p_content_type?: string
          p_limit?: number
          p_project_id: string
        }
        Returns: {
          caption: string
          content_type: string
          engagement_rate: number
          id: string
          lead_conversion_rate: number
          organic_leads_count: number
          permalink: string
          post_id: string
          published_at: string
          reach: number
        }[]
      }
      get_user_exists: { Args: { uid: string }; Returns: boolean }
      get_user_organization: { Args: never; Returns: string }
      get_user_project_id: { Args: never; Returns: string }
      healthcheck_select_one: {
        Args: never
        Returns: {
          ok: number
        }[]
      }
      http_post: { Args: { body: string; url: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_org_admin: { Args: { org: string }; Returns: boolean }
      is_project_member: { Args: { p_project: string }; Returns: boolean }
      is_project_member_secure: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      log_lead_changes_wrapper: { Args: never; Returns: undefined }
      mvi_sync_stats_now: {
        Args: { p_project_id?: string }
        Returns: undefined
      }
      my_fn: { Args: { arg1: number; arg2: string }; Returns: string }
      normalize_phone: { Args: { input: string }; Returns: string }
      notify_if_possible: { Args: { p_payload: string }; Returns: undefined }
      process_booking_queue_batch: {
        Args: { in_batch_size?: number }
        Returns: {
          failed: number
          processed: number
        }[]
      }
      refresh_ai_analytics_mv: { Args: never; Returns: undefined }
      refresh_ai_analytics_mv_with_notify: { Args: never; Returns: undefined }
      refresh_daily_fact: {
        Args: { p_date: string; p_project_id: string }
        Returns: undefined
      }
      refresh_daily_fact_v2:
        | { Args: { p_date: string; p_project_id: string }; Returns: undefined }
        | { Args: { p_day: string; p_project_id: string }; Returns: undefined }
      refresh_daily_fact_wrapper:
        | { Args: { p_date: string; p_project_id: string }; Returns: undefined }
        | { Args: { p_day: string; p_project_id: string }; Returns: undefined }
      refresh_dashboard_totals_now: { Args: never; Returns: undefined }
      run_monitor_checks: { Args: never; Returns: Json }
      save_diagnostic_and_update_lead: {
        Args: {
          fee?: number
          input_answers: Json
          input_dream_outcome: string
          input_gap_value: number
          input_pain_score: number
          new_status?: string
          target_lead_id: string
        }
        Returns: undefined
      }
      save_diagnostic_data: {
        Args: { p_answers: Json; p_gap_value?: number; p_lead_id: string }
        Returns: undefined
      }
      sync_leads_daily_inner:
        | { Args: { p_date: string; p_project_id: string }; Returns: undefined }
        | { Args: { p_day: string; p_project_id: string }; Returns: undefined }
      sync_organic_leads_sql: {
        Args: never
        Returns: {
          content_stats_updated: number
          posts_updated: number
        }[]
      }
      trigger_run_aggregate_leads_http: { Args: never; Returns: undefined }
      trigger_sync_organic_leads: { Args: never; Returns: undefined }
      upsert_daily_data: {
        Args: {
          p_date: string
          p_diagnostics?: number
          p_leads?: number
          p_project_id: string
          p_revenue?: number
          p_sales?: number
          p_spend?: number
        }
        Returns: undefined
      }
      upsert_daily_data_for_project: {
        Args: { p_project_id: string }
        Returns: undefined
      }
    }
    Enums: {
      diagnostic_result_status:
        | "ok"
        | "failed"
        | "pending"
        | "running"
        | "cancelled"
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
      diagnostic_result_status: [
        "ok",
        "failed",
        "pending",
        "running",
        "cancelled",
      ],
    },
  },
} as const
