import fs from 'fs';

const path = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(path, 'utf8');

// Inject clients_config
if (!content.includes('clients_config: {')) {
  const tableInsert = `
      clients_config: {
        Row: {
          ad_account_id: string
          client_name: string | null
          created_at: string | null
          fb_token: string | null
          id: string
          meta_leads: number | null
          project_id: string | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          ad_account_id: string
          client_name?: string | null
          created_at?: string | null
          fb_token?: string | null
          id?: string
          meta_leads?: number | null
          project_id?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          ad_account_id?: string
          client_name?: string | null
          created_at?: string | null
          fb_token?: string | null
          id?: string
          meta_leads?: number | null
          project_id?: string | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }`;
  content = content.replace('Tables: {', 'Tables: {' + tableInsert);
}

// Inject agency_metrics_view
if (!content.includes('agency_metrics_view: {')) {
  const viewInsert = `
      agency_metrics_view: {
        Row: {
          account_id: string | null
          account_name: string | null
          cac: number | null
          cpl: number | null
          cpql: number | null
          cpv: number | null
          crm_leads: number | null
          id: string | null
          meta_leads: number | null
          project_id: string | null
          qualified_leads: number | null
          revenue: number | null
          romi: number | null
          sales: number | null
          spend: number | null
          visits: number | null
        }
        Relationships: []
      }`;
  content = content.replace('Views: {', 'Views: {' + viewInsert);
}

fs.writeFileSync(path, content);
console.log("Types patched successfully");
