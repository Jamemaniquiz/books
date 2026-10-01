// BookNest data layer — talks to /api/bn on Vercel (replaces Firebase).
const BN_TOKEN = 'bn_token';
function bnErr(msg, code){ const e = new Error(msg); e.code = code; return e; }
async function api(action, body){
  const t = localStorage.getItem(BN_TOKEN);
  let r, j = {};
  try{
    r = await fetch('/api/bn', { method:'POST', headers:Object.assign({'Content-Type':'application/json'}, t ? {Authorization:'Bearer '+t} : {}), body:JSON.stringify(Object.assign({action}, body||{})) });
  }catch(_){ throw bnErr('Network problem. Check your internet connection.', 'network'); }
  try{ j = await r.json(); }catch(_){}
  if(!r.ok || !j.ok) throw bnErr(j.error || ('Server error ('+r.status+'). Make sure the api folder is deployed on Vercel.'), j.code || 'error');
  return j.data;
}
function saveSession(d){ localStorage.setItem(BN_TOKEN, d.token); return d.user; }
async function readCloud(key, fallback){ try{ const v = await api('readCloud',{key}); return v == null ? fallback : v; }catch(e){ console.error(e); return fallback; } }
async function writeCloud(key, value){ try{ await api('writeCloud',{key,value}); return true; }catch(e){ console.error(e); return false; } }
async function sellerLogin(password){
  const u = saveSession(await api('sellerLogin',{password}));
  sessionStorage.setItem('bn_admin_ok','1'); // also unlocks the admin pages
  return u;
}
async function buyerSignUp(p){ return saveSession(await api('buyerSignUp', p)); }
async function buyerLogin(email, password){ return saveSession(await api('buyerLogin',{email,password})); }
async function logout(){ localStorage.removeItem(BN_TOKEN); sessionStorage.removeItem('bn_admin_ok'); }
async function whenAuthReady(cb){
  if(!localStorage.getItem(BN_TOKEN)){ cb(null,null); return; }
  try{ const u = await api('me'); if(u){ cb(u, u.role); return; } }catch(_){}
  localStorage.removeItem(BN_TOKEN); cb(null,null);
}
const unlockBuyersPage = (password) => api('buyersLock',{password});
const getAllBuyers = () => api('getAllBuyers');
const resetBuyerPassword = (email) => api('resetBuyerPassword',{email});
async function getOrdersForBuyer(uid){ return (await readCloud('.shop_orders', [])).filter(o => o.buyerUid === uid); }
