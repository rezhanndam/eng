import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const bucket = env.VITE_SUPABASE_BUCKET || 'documents';
const email = `diag2-${Date.now()}@example.com`;
const password = 'Diagn0stic!Pass';

const sb = createClient(url, anonKey);

async function tryUpload(sessionUserId, label, path) {
  const { data, error } = await sb.storage
    .from(bucket)
    .upload(path, new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }), { upsert: true });
  console.log(`${label}: ${error ? `FAIL ${error.statusCode}: ${error.message}` : `OK ${data?.path}`}`);
  return !error;
}

async function main() {
  const { data: su, error: suErr } = await sb.auth.signUp({ email, password });
  if (suErr) {
    console.log('signup error:', suErr.message);
    return;
  }
  const uid = su.user.id;
  const ts = Date.now();
  console.log('uid =', uid, 'confirmed =', su.user.email_confirmed_at);

  await tryUpload(uid, 'A  uid/proj/x.pdf ', `${uid}/proj-1/${ts}-a.pdf`);
  await tryUpload(uid, 'B  uid/x.pdf      ', `${uid}/${ts}-b.pdf`);
  await tryUpload(uid, 'C  proj/x.pdf     ', `proj-1/${ts}-c.pdf`);

  // Anonymous read sanity + anon upload to see if any permissive policy exists.
  const { data: pub } = await sb.storage.from(bucket).getPublicUrl(`${uid}/${ts}-a.pdf`);
  const anonResp = await sb.storage.from(bucket).upload(`anon-${ts}.pdf`, new Blob(['x']), { upsert: true });
  console.log('puburl query ok (status 200 = file exists):', await getStatus(pub.publicUrl));
  console.log(`anon upload: ${anonResp.error ? `FAIL ${anonResp.error.statusCode}` : 'OK (permissive!)'}`);
}

async function getStatus(u) {
  try {
    const r = await fetch(u, { method: 'HEAD' });
    return r.status;
  } catch {
    return 'ERR';
  }
}

main();