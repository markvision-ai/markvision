# MarkVision AI Context

## Financial Data
- **USD/KZT Exchange Rate**: 503.44 (Fixed for calculations unless fetched live).
- **Currency**: All financial records in DB are in KZT or USD. Always convert using the rate.

## Project Structure
- **Supabase**: Main database.
- **n8n**: Automation and integration (Webhooks).
- **Meta Ads**: Synced via n8n to `marketing_stats` and `campaigns`.

## MCP Tools
- **Meta Ads**: Use `get_meta_ads_data` to fetch stats.
- **n8n**: Use `trigger_n8n_workflow` to start automations.
