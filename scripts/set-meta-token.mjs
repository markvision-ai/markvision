/**
 * Вставляет Meta Access Token в Supabase (ad_accounts + integrations).
 * Токен берётся из переменной окружения META_ACCESS_TOKEN.
 *
 * Для обхода RLS нужен Service Role Key:
 *   VITE_SUPABASE_SERVICE_ROLE_KEY=... в .env.local (не коммитить!)
 *
 * Запуск:
 *   META_ACCESS_TOKEN="EAA..." node scripts/set-meta-token.mjs
 * или добавьте META_ACCESS_TOKEN в .env.local и запустите:
 *   node scripts/set-meta-token.mjs
 *
 * Опционально: PROJECT_ID=uuid — иначе первый проект из БД или fallback.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim?.();
const supabaseKey = (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)?.trim?.();
const metaToken = process.env.META_ACCESS_TOKEN?.trim?.();
const projectIdEnv = process.env.PROJECT_ID?.trim?.();

const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Нужны VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.local или .env');
  process.exit(1);
}


if (!metaToken) {
  console.error('❌ Задайте META_ACCESS_TOKEN в .env.local или при запуске: META_ACCESS_TOKEN="EAA..." node scripts/set-meta-token.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let projectId = projectIdEnv;

  if (!projectId) {
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);
    if (projErr || !projects?.length) {
      projectId = FALLBACK_PROJECT_ID;
      console.log('⚠️ Проект из БД не найден, используем fallback project_id:', projectId);
    } else {
      projectId = projects[0].id;
      console.log('✅ Выбран проект:', projectId);
    }
  } else {
    console.log('✅ Используем PROJECT_ID из env:', projectId);
  }

  const { error: errAd } = await supabase
    .from('ad_accounts')
    .upsert({
      project_id: projectId,
      platform: 'facebook',
      access_token: metaToken,
      status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,platform' });

  if (errAd) {
    console.error('❌ ad_accounts:', errAd.message);
  } else {
    console.log('✅ ad_accounts: токен сохранён');
  }

  const { error: errInt } = await supabase
    .from('integrations')
    .upsert({
      project_id: projectId,
      type: 'facebook',
      platform: 'facebook',
      name: 'Meta / Facebook',
      access_token: metaToken,
      settings: { access_token: metaToken },
      status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id,type' });

  if (errInt) {
    const { error: errInt2 } = await supabase
      .from('integrations')
      .upsert({
        project_id: projectId,
        platform: 'facebook',
        name: 'Meta / Facebook',
        access_token: metaToken,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'project_id,platform' });
    if (errInt2) {
      console.error('❌ integrations:', errInt.message || errInt2.message);
    } else {
      console.log('✅ integrations: токен сохранён (по platform)');
    }
  } else {
    console.log('✅ integrations: токен сохранён');
  }

  if (!errAd && !errInt) {
    console.log('\n🎉 Готово. Синхронизация Meta и раздел «Рекламные площадки» будут использовать этот токен.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
