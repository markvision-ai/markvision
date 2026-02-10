#!/usr/bin/env node
/**
 * Run migration: create ai_agents table.
 * Requires DATABASE_URL or SUPABASE_DB_URL.
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
    console.error('Please add it to .env or run with: DATABASE_URL=... node scripts/run-migration-ai-agents.mjs');
    process.exit(1);
}

const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260210134600_create_ai_agents.sql');
const sql = readFileSync(sqlPath, 'utf8');

async function run() {
    const pg = await import('pg');
    const client = new pg.default.Client({ connectionString: url });
    try {
        await client.connect();
        await client.query(sql);
        console.log('✅ Migration 20260210134600_create_ai_agents.sql applied successfully.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('ℹ️  Table ai_agents already exists, skipping.');
        } else {
            console.error('❌ Migration failed:', e.message);
            process.exit(1);
        }
    } finally {
        await client.end();
    }
}

run();
