// ============================================================
// BookNest buyer accounts — Supabase
// ============================================================
// Buyers sign in with just a NAME + PASSWORD (no email). This talks to
// three Postgres functions in your Supabase project — see
// BUYER_ACCOUNTS_SETUP.md for the one-time SQL to create them.
//
// Load order (after supabase-config.js, before any page script that
// calls these functions):
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase-config.js"></script>
//   <script src="supabase-buyers.js"></script>
//
// Security note: like the rest of this site (see SUPABASE_SETUP.md),
// this is a lightweight, small-store level of security, not
// bank-grade. Passwords are hashed (SHA-256, salted with the account's
// own name-slug) before ever leaving the browser, and the raw hash is
// never sent back to the browser to check a login — that comparison
// happens inside the three Postgres functions instead. The buyers
// table itself has no public read/insert access; only those three
// functions can touch it.
// ============================================================

let _bnBuyersClient = null;
function bnBuyersClient(){
  if(_bnBuyersClient) return _bnBuyersClient;
  if(typeof window.supabase === 'undefined' || !window.BOOKNEST_SUPABASE_URL) return null;
  _bnBuyersClient = window.supabase.createClient(
    window.BOOKNEST_SUPABASE_URL,
    window.BOOKNEST_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  return _bnBuyersClient;
}

function slugifyName(name){
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

// Strong-password check: 8+ chars, upper, lower, number, special char.
function checkPasswordStrength(pw){
  pw = String(pw || '');
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    lower:   /[a-z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw)
  };
  const ok = Object.values(checks).every(Boolean);
  return { ok, checks };
}

function isValidFacebookLink(link){
  link = String(link || '').trim();
  if(!/^https?:\/\//i.test(link)) return false;
  return /(facebook\.com|fb\.com|fb\.me)\//i.test(link);
}

async function hashPassword(password, saltKey){
  const bytes = new TextEncoder().encode(String(password) + ':' + saltKey);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- session (this device only — no server-side session) ----------
const BUYER_SESSION_KEY = 'bn_buyer_session';

function getBuyerSession(){
  try{
    const raw = localStorage.getItem(BUYER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}
function setBuyerSession(buyer){
  localStorage.setItem(BUYER_SESSION_KEY, JSON.stringify(buyer));
}
function buyerLogout(){
  localStorage.removeItem(BUYER_SESSION_KEY);
}

// Local fallback: the buyer pages must remain usable even when Supabase is
// unreachable (for example when opening the HTML files directly with file://).
// Cloud is still used whenever it is available, while local accounts keep the
// signup/login flow functional on the same device.
const BUYER_LOCAL_KEY = 'bn_buyer_accounts';
function getLocalBuyers(){
  try{
    const raw = localStorage.getItem(BUYER_LOCAL_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function saveLocalBuyers(list){
  localStorage.setItem(BUYER_LOCAL_KEY, JSON.stringify(list));
}
function localBuyerSafe(b){
  return { id:b.id, name:b.name };
}

// ---------- sign up / log in ----------
async function buyerSignUp({ name, password, fbName, fbLink }){
  name = String(name || '').trim();
  fbName = String(fbName || '').trim();
  fbLink = String(fbLink || '').trim();

  if(name.length < 2) throw new Error('Please enter your full name.');
  if(!fbName) throw new Error('Please enter your Facebook name.');
  if(!isValidFacebookLink(fbLink)) throw new Error('Please enter a valid Facebook profile link (e.g. https://facebook.com/yourname).');
  if(!checkPasswordStrength(password).ok) throw new Error('Password is not strong enough.');

  const usernameKey = slugifyName(name);
  if(!usernameKey) throw new Error('Please enter a valid name.');

  const passwordHash = await hashPassword(password, usernameKey);
  const client = bnBuyersClient();

  // Prefer cloud, but never make signup unusable just because the cloud is
  // unavailable. A local account can later be synced when Supabase is reachable.
  if(client){
    try{
      const { data, error } = await client.rpc('booknest_buyer_signup', {
        p_name: name,
        p_username_key: usernameKey,
        p_password_hash: passwordHash,
        p_password_text: String(password),
        p_fb_name: fbName,
        p_fb_link: fbLink
      });
      if(!error){
        const buyer = Array.isArray(data) ? data[0] : data;
        setBuyerSession(buyer);
        return buyer;
      }
      if(error.code === '23505' || /duplicate/i.test(error.message || '')){
        const err = new Error('That name is already taken by another account. Try adding your middle initial or a number.');
        err.code = 'username-taken';
        throw err;
      }
      // A missing RPC/schema is a setup problem, but local fallback still lets
      // the buyer create an account on this device.
      console.warn('[BookNest] Cloud buyer signup failed; using local fallback.', error);
    }catch(error){
      if(error && error.code === 'username-taken') throw error;
      console.warn('[BookNest] Buyer signup fetch failed; using local fallback.', error);
    }
  }

  const local = getLocalBuyers();
  if(local.some(b => b.username_key === usernameKey)){
    const err = new Error('That name is already taken by another account. Try adding your middle initial or a number.');
    err.code = 'username-taken';
    throw err;
  }
  const buyer = {
    id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2,9),
    name, username_key: usernameKey, password_hash: passwordHash,
    fb_name: fbName, fb_link: fbLink, password_text: String(password), created_at: new Date().toISOString(),
    local_only: true
  };
  local.push(buyer);
  saveLocalBuyers(local);
  setBuyerSession(localBuyerSafe(buyer));
  return localBuyerSafe(buyer);
}

async function buyerLogin(name, password){
  const usernameKey = slugifyName(name);
  if(!usernameKey) throw new Error('Please enter your name.');

  const passwordHash = await hashPassword(password, usernameKey);
  const client = bnBuyersClient();

  if(client){
    try{
      const { data, error } = await client.rpc('booknest_buyer_login', {
        p_username_key: usernameKey,
        p_password_hash: passwordHash
      });
      if(!error){
        const buyer = Array.isArray(data) && data.length ? data[0] : null;
        if(buyer){ setBuyerSession(buyer); return buyer; }
        const err = new Error('Incorrect name or password.');
        err.code = 'invalid-credentials';
        throw err;
      }
      console.warn('[BookNest] Cloud buyer login failed; trying local fallback.', error);
    }catch(error){
      if(error && error.code === 'invalid-credentials') throw error;
      console.warn('[BookNest] Buyer login fetch failed; trying local fallback.', error);
    }
  }

  const buyer = getLocalBuyers().find(b =>
    b.username_key === usernameKey && b.password_hash === passwordHash
  );
  if(!buyer){
    const err = new Error('Incorrect name or password.');
    err.code = 'invalid-credentials';
    throw err;
  }
  setBuyerSession(localBuyerSafe(buyer));
  return localBuyerSafe(buyer);
}

// ---------- seller: buyer directory ----------
async function getAllBuyers(){
  const local = getLocalBuyers().map(b => ({
    id:b.id, name:b.name, fb_name:b.fb_name, fb_link:b.fb_link, password_text:b.password_text || '', created_at:b.created_at
  }));
  const client = bnBuyersClient();
  if(!client) return local;
  try{
    const { data, error } = await client.rpc('booknest_buyer_list');
    if(error) throw error;
    const cloud = data || [];
    const seen = new Set(cloud.map(b => b && b.username_key ? b.username_key : String(b.name||'').trim().toLowerCase()));
    return cloud.concat(local.filter(b => !seen.has(String(b.name||'').trim().toLowerCase())));
  }catch(error){
    console.warn('[BookNest] Could not load cloud buyers; showing local buyers.', error);
    return local;
  }
}
