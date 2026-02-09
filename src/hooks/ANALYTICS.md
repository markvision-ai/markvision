# MarkVision Factory Analytics Documentation

## Overview
The `useFactoryAnalytics` hook is the central engine for the Content Factory dashboard metrics. It aggregates data from multiple sources to provide "Plan vs Fact" analysis.

## Data Sources

### 1. `daily_data` Table
Used for social media metrics.
- **New Followers**: Sum of `followers_today` OR `new_followers` OR `ig_followers_new` (priority order).
- **Reach**: Sum of `reach` OR `impressions`.
- **Comments**: Sum of `comments`.
- **Publications**: Sum of `publications`.

### 2. `leads` Table
Used for CRM metrics (Organic traffic only).
- **Leads**: Count of rows where `lead_source = 'organic'` within the date range.
- **Sales**: Count of rows where `lead_source = 'organic'` AND `status` is one of:
  - `won`
  - `paid`
  - `completed`
  - `success`
  - `closed_won`

## Date Filtering
The hook supports three period modes:
1. **This Month**: From 1st of current month to today.
2. **Last Month**: Full previous month (1st to last day).
3. **Custom**: User-selected range.

## Project ID
If `projectId` is not provided, the hook does not make any requests.

## Logic Details
- **Aggregation**: Metrics are summed up for the selected period.
- **Fallbacks**: If specific columns (like `followers_today`) are missing/zero, the logic falls back to alternatives (`new_followers`, etc.) to ensure data continuity across different data collection versions.
