// BookNest — NO server, NO Firebase, NO Vercel functions.
// Everything is stored in this browser (localStorage). The seller password uses the
// same storage as admin-gate.js, so changing it in Settings changes it everywhere.
const BN_PW_KEY = 'bn_admin_password_hash', BN_SESSION = 'bn_admin_ok', BN_DEFAULT_PW = 'booknest2026';
const BN_BUYERS = 'bn_buyers', BN_BUYER_SESSION = 'bn_buyer_uid';

function bnHash(str){ // identical to admin-gate.js
  let hash = 0;
  for(let i = 0; i < str.length; i++){ hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
  return Math.abs(hash).toString(16);
}
function bnErr(msg, code){ const e = new Error(msg); e.code = code; return e; }
async function bnSha(s){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('booknest|' + s));
  return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
}
function bnLoad(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(_){ return d; } }
function bnSave(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

// ---------- seller (password only) ----------
function bnSellerPasswordOk(password){
  let stored = localStorage.getItem(BN_PW_KEY);
  if(!stored){ stored = bnHash(BN_DEFAULT_PW); localStorage.setItem(BN_PW_KEY, stored); }
  return bnHash(String(password || '')) === stored;
}
async function sellerLogin(password){
  if(!bnSellerPasswordOk(password)) throw bnErr('Incorrect password.', 'invalid-credential');
  sessionStorage.setItem(BN_SESSION, '1');
  return { uid: 'seller', role: 'seller' };
}
const unlockBuyersPage = async (password) => { if(!bnSellerPasswordOk(password)) throw bnErr('Wrong password.', 'invalid-credential'); return true; };

// ---------- buyers (kept in this browser only) ----------
const bnPublic = (b) => ({ uid: b.uid, name: b.name, contact: b.contact, email: b.email, createdAt: b.createdAt });
async function buyerSignUp({ name, contact, email, password }){
  email = String(email || '').trim().toLowerCase();
  if(!/^\S+@\S+\.\S+$/.test(email)) throw bnErr("That email address doesn't look right.", 'invalid-email');
  if(String(password || '').length < 6) throw bnErr('Password must be at least 6 characters.', 'weak-password');
  const all = bnLoad(BN_BUYERS, []);
  if(all.some(b => b.email === email)) throw bnErr('That email already has an account — try logging in instead.', 'email-already-in-use');
  const b = { uid: 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, contact, email, pass: await bnSha(email + password), createdAt: Date.now() };
  all.push(b); bnSave(BN_BUYERS, all); localStorage.setItem(BN_BUYER_SESSION, b.uid);
  return bnPublic(b);
}
async function buyerLogin(email, password){
  email = String(email || '').trim().toLowerCase();
  const b = bnLoad(BN_BUYERS, []).find(x => x.email === email);
  if(!b || b.pass !== await bnSha(email + password)) throw bnErr('Incorrect email or password.', 'invalid-credential');
  localStorage.setItem(BN_BUYER_SESSION, b.uid);
  return bnPublic(b);
}
async function getAllBuyers(){ return bnLoad(BN_BUYERS, []).map(bnPublic).sort((a, b) => b.createdAt - a.createdAt); }
async function resetBuyerPassword(email){
  const all = bnLoad(BN_BUYERS, []), b = all.find(x => x.email === String(email).trim().toLowerCase());
  if(!b) throw bnErr('No buyer with that email.', 'user-not-found');
  const tempPassword = Math.random().toString(36).slice(2, 10);
  b.pass = await bnSha(b.email + tempPassword); bnSave(BN_BUYERS, all);
  return { tempPassword };
}

// ---------- session + data ----------
async function logout(){ sessionStorage.removeItem(BN_SESSION); localStorage.removeItem(BN_BUYER_SESSION); }
async function whenAuthReady(cb){
  if(sessionStorage.getItem(BN_SESSION) === '1'){ cb({ uid: 'seller' }, 'seller'); return; }
  const b = bnLoad(BN_BUYERS, []).find(x => x.uid === localStorage.getItem(BN_BUYER_SESSION));
  if(b) cb(bnPublic(b), 'buyer'); else cb(null, null);
}
async function readCloud(key, fallback){ return bnLoad('bn_data:' + key, fallback); }
async function writeCloud(key, value){ bnSave('bn_data:' + key, value); return true; }
async function getOrdersForBuyer(uid){ return (await readCloud('.shop_orders', [])).filter(o => o.buyerUid === uid); }
