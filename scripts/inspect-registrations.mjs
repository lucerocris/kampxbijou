import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const logErr = (label, err) => {
  if (!err) return;
  console.error(label, {
    message: err.message,
    details: err.details,
    hint: err.hint,
    code: err.code,
  });
};
async function main() {
  const resAll = await supabase.from('registrations').select('*').limit(1);
  logErr('select(*) failed', resAll.error);
  if (resAll.error) process.exit(1);
  const row = resAll.data?.[0] ?? null;
  console.log('Visible columns from PostgREST:', row ? Object.keys(row).sort() : '(no rows returned; cannot infer keys)');
  const resName = await supabase.from('registrations').select('name').limit(1);
  if (resName.error) logErr('select(name) failed', resName.error);
  else console.log('select(name) OK');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
