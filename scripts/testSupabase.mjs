import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path = '.env.local') {
  try {
    const txt = fs.readFileSync(path, 'utf8');
    const lines = txt.split(/\r?\n/);
    const env = {};
    for (const l of lines) {
      const m = l.match(/^([^=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch (e) {
    return process.env;
  }
}

const env = loadEnv('./.env.local');
const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase URL or ANON key. Check .env.local');
  process.exit(2);
}

const supabase = createClient(url, key);

async function test() {
  console.log('Supabase URL:', url);
  try {
    console.log('\nTesting select from work_entries...');
    const { data: wdata, error: werr } = await supabase.from('work_entries').select('id').limit(1);
    if (werr) {
      console.error('work_entries error:', werr.message || werr);
    } else {
      console.log('work_entries OK, sample:', wdata);
    }
  } catch (e) {
    console.error('work_entries exception:', e.message || e);
  }

  try {
    console.log('\nTesting select from materials...');
    const { data: mdata, error: merr } = await supabase.from('materials').select('id').limit(1);
    if (merr) {
      console.error('materials error:', merr.message || merr);
    } else {
      console.log('materials OK, sample:', mdata);
    }
  } catch (e) {
    console.error('materials exception:', e.message || e);
  }

  // quick storage buckets list (will error if storage not enabled)
  try {
    console.log('\nListing storage buckets (may require appropriate permissions)...');
    const { data: buckets, error: serr } = await supabase.storage.listBuckets();
    if (serr) console.error('storage list error:', serr.message || serr);
    else console.log('buckets:', buckets);
  } catch (e) {
    console.error('storage exception:', e.message || e);
  }
}

test().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
