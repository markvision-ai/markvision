#!/usr/bin/env node
/**
 * Run migration: add ad_account_id to ad_accounts.
 * Requires DATABASE_URL or SUPABASE_DB_URL (Supabase → Settings → Database → Connection string).
 *
 * Usage:
 *   DATABASE_URL='postgresql://...' node scripts/run-migration-ad-account-id.mjs
 *   npm run db:migrate:ad-account-id
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = join(process.cwd(), name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].replace(/^["']|["']$/g, '').trim();
      if (typeof process.env[key] === 'undefined') process.env[key] = val;
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('Missing DATABASE_URL or SUPABASE_DB_URL.');
  console.error('');
  console.error('Option A — run via script:');
  console.error('  1. Supabase Dashboard → Settings → Database → Connection string (URI)');
  console.error('  2. Add to .env: DATABASE_URL="postgresql://..."');
  console.error('  3. npm run db:migrate:ad-account-id');
  console.error('');
  console.error('Option B — run SQL manually:');
  console.error('  Supabase Dashboard → SQL Editor → New query');
  console.error('  Paste and run: supabase/migrations/20260126000000_add_ad_account_id_to_ad_accounts.sql');
  process.exit(1);
}

const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260126000000_add_ad_account_id_to_ad_accounts.sql');
const sql = readFileSync(sqlPath, 'utf8');

async function run() {
  const pg = await import('pg');
  const client = new pg.default.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Migration 20260126000000_add_ad_account_id_to_ad_accounts applied.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
