// BookNest backend — one Vercel serverless function (no Firebase).
// Env vars (Vercel → Settings → Environment Variables):
//   SELLER_PASSWORD  seller's password (default: booknest2026 — change it!)
//   BUYERS_PASSWORD  optional 2nd password for Buyers page (default = seller password)
//   SESSION_SECRET   optional random string used to sign logins
// Storage: Vercel → Storage → Upstash Redis (adds KV_REST_API_URL / _TOKEN automatically)
const crypto = require('crypto');
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SELLER_PW = process.env.SELLER_PASSWORD || 'booknest2026';
const LOCK_PW = process.env.BUYERS_PASSWORD || SELLER_PW;
const SECRET = process.env.SESSION_SECRET || ('bn|' + SELLER_PW);

const fail = (message, code, status = 400) => Object.assign(new Error(message), { code, status });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function kv(...cmd) {
  if (!KV_URL || !KV_TOK) throw fail('Database not connected. In Vercel: Storage → Create → Upstash Redis → connect to this project, then redeploy.', 'no-storage', 503);
  const r = await fetch(KV_URL, { method: 'POST', headers: { Authorization: 'Bearer ' + KV_TOK }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw fail('Database error: ' + j.error, 'storage-error', 500);
  return j.result;
}
const safeEq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const sign = (p) => crypto.createHmac('sha256', SECRET).update(p).digest('base64url');
const makeToken = (u) => { const p = Buffer.from(JSON.stringify({ ...u, exp: Date.now() + 30 * 864e5 })).toString('base64url'); return p + '.' + sign(p); };
function readToken(t) {
  const [p, s] = String(t || '').split('.');
  if (!p || !s || !safeEq(sign(p), s)) return null;
  try { const u = JSON.parse(Buffer.from(p, 'base64url')); return u.exp > Date.now() ? u : null; } catch { return null; }
}
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
const bKey = (e) => 'bn:buyer:' + String(e).trim().toLowerCase();
const session = (r) => ({ token: makeToken({ role: 'buyer', uid: r.uid, email: r.email }), user: { uid: r.uid, email: r.email, name: r.name, role: 'buyer' } });

async function run(a, b, me) {
  const need = (role) => { if (!me || (role && me.role !== role)) throw fail('Please log in first.', 'unauthorized', 401); };
  switch (a) {
    case 'sellerLogin':
      if (!safeEq(b.password || '', SELLER_PW)) { await sleep(600); throw fail('Incorrect password.', 'invalid-credential', 401); }
      return { token: makeToken({ role: 'seller', uid: 'seller' }), user: { uid: 'seller', role: 'seller' } };
    case 'buyerSignUp': {
      const email = String(b.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw fail('That email address doesn\'t look right.', 'invalid-email');
      if (String(b.password || '').length < 6) throw fail('Password must be at least 6 characters.', 'weak-password');
      const salt = crypto.randomBytes(16).toString('hex');
      const rec = { uid: crypto.randomUUID(), name: String(b.name || '').slice(0, 80), contact: String(b.contact || '').slice(0, 80), email, salt, hash: hashPw(b.password, salt), createdAt: Date.now() };
      if (!(await kv('SETNX', bKey(email), JSON.stringify(rec)))) throw fail('That email already has an account — try logging in instead.', 'email-already-in-use');
      await kv('SADD', 'bn:buyers', email);
      return session(rec);
    }
    case 'buyerLogin': {
      const raw = await kv('GET', bKey(b.email || ''));
      const rec = raw && JSON.parse(raw);
      if (!rec || !safeEq(hashPw(b.password || '', rec.salt), rec.hash)) { await sleep(600); throw fail('Incorrect email or password.', 'invalid-credential', 401); }
      return session(rec);
    }
    case 'me': return me ? { uid: me.uid, role: me.role, email: me.email || null } : null;
    case 'readCloud': { need(); const v = await kv('GET', 'bn:data:' + b.key); return v == null ? null : JSON.parse(v); }
    case 'writeCloud': need(); await kv('SET', 'bn:data:' + b.key, JSON.stringify(b.value)); return true;
    case 'buyersLock': need('seller'); if (!safeEq(b.password || '', LOCK_PW)) throw fail('Wrong password.', 'invalid-credential', 401); return true;
    case 'getAllBuyers': {
      need('seller');
      const emails = await kv('SMEMBERS', 'bn:buyers');
      if (!emails.length) return [];
      const rows = (await kv('MGET', ...emails.map(bKey))).filter(Boolean).map(s => { const { salt, hash, ...pub } = JSON.parse(s); return pub; });
      return rows.sort((x, y) => y.createdAt - x.createdAt);
    }
    case 'resetBuyerPassword': {
      need('seller');
      const raw = await kv('GET', bKey(b.email || ''));
      if (!raw) throw fail('No buyer with that email.', 'user-not-found', 404);
      const rec = JSON.parse(raw), tempPassword = crypto.randomBytes(4).toString('hex');
      rec.salt = crypto.randomBytes(16).toString('hex'); rec.hash = hashPw(tempPassword, rec.salt);
      await kv('SET', bKey(rec.email), JSON.stringify(rec));
      return { tempPassword };
    }
    default: throw fail('Unknown action.', 'bad-request');
  }
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only', code: 'bad-request' });
  let b = req.body || {}; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  try {
    const me = readToken((req.headers.authorization || '').replace(/^Bearer /, ''));
    res.status(200).json({ ok: true, data: await run(b.action, b, me) });
  } catch (e) { res.status(e.status || 500).json({ ok: false, error: e.message, code: e.code || 'error' }); }
};
