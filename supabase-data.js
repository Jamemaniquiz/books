// ============================================================
// BookNest cloud data layer — Supabase shared database
// ============================================================
(function () {
  "use strict";
  const SUPABASE_URL = window.BOOKNEST_SUPABASE_URL || "https://ryyhsbkuukbctflcetcn.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = window.BOOKNEST_SUPABASE_ANON_KEY || "sb_publishable_Y5uk8FMgr15vEiqy5bBq3g_X1cXbKmQ";
  const CLOUD_TABLE = "booknest_data";
  const KEYS = [".books",".sales",".receipts",".purchases",".sellerPayment",".shop_orders",".shop_listings",".site_status"];
  // One-time clean-slate migration for this rebuilt BookNest release.
  // It only clears browser caches; the matching SQL reset file clears the
  // shared cloud snapshot. After this flag is recorded, future deploys do not
  // wipe newly entered books again.
  const RESET_VERSION = "2026-09-11-clean-v5";
  try {
    if (localStorage.getItem("booknest_cloud_reset_version") !== RESET_VERSION) {
      KEYS.forEach(key => localStorage.removeItem(key));
      localStorage.setItem("booknest_cloud_reset_version", RESET_VERSION);
      localStorage.removeItem("booknest_cloud_reset_warning_seen");
    }
  } catch (e) {
    console.warn("[BookNest] clean-slate cache reset could not complete", e);
  }
  const hasConfig = () => typeof window.supabase !== "undefined" && SUPABASE_URL.startsWith("https://") && !!SUPABASE_PUBLISHABLE_KEY;
  if (!hasConfig()) {
    window.BookNestCloud = {enabled:false, ready:Promise.resolve(false), save:async()=>false, pull:async()=>false, refresh:async()=>false, pushLocalData:async()=>false};
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false}});
  // Shared image compressor for phones: prevents huge camera files from making
  // the single JSONB snapshot too large for Supabase REST requests.
  window.BookNestCompressImage = (file, maxDim = 800, quality = 0.62) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(1, maxDim / Math.max(width, height));
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  const readLocal = key => { try { const raw=localStorage.getItem(key); return raw==null?null:JSON.parse(raw); } catch(e){ return null; } };
  const writeLocal = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch(e){ console.warn("[BookNest] cache write failed",key,e); return false; } };
  const queues = new Map();
  async function rawSave(key,value){
    const body={key,value,updated_at:new Date().toISOString()};
    const approxBytes=new Blob([JSON.stringify(value)]).size;
    console.log(`[BookNest] Supabase save ${key}: ${(approxBytes/1024).toFixed(0)} KB`);
    const {error}=await client.from(CLOUD_TABLE).upsert(body,{onConflict:'key'});
    if(error){ console.error(`[BookNest] Supabase save failed for ${key}:`,error); throw error; }
    return true;
  }
  function save(key,value){
    if(!KEYS.includes(key)) return Promise.resolve(false);
    const previous=queues.get(key)||Promise.resolve();
    const next=previous.catch(()=>{}).then(()=>rawSave(key,value));
    queues.set(key,next.finally(()=>{if(queues.get(key)===next) queues.delete(key);}));
    return next;
  }
  const PAGE_KEYS = (()=>{
    const p=(location.pathname.split('/').pop()||'').toLowerCase();
    const map={
      "":".books,.shop_listings,.site_status",
      "index.html":[".books",".shop_listings",".site_status"],
      "shop.html":[".books",".shop_listings",".shop_orders",".site_status"],
      "buyer-login.html":[".site_status"],
      "add-books.html":[".books",".shop_listings"],
      "inventory.html":[".books",".sales",".purchases"],
      "admin.html":[".books",".sales",".receipts",".purchases",".sellerPayment",".shop_orders",".shop_listings",".site_status"],
      "shop-manager.html":[".books",".shop_listings",".site_status"],
      "orders.html":[".shop_orders",".books"],
      "receipt-history.html":[".receipts",".sales"],
      "new-sale.html":[".books",".sales",".receipts"],
      "bundle-sale.html":[".books",".sales"],
      "buyers.html":[".shop_orders"],
      "seller-login.html":[],
      "rules.html":[]
    };
    const value=map[p];
    if(Array.isArray(value)) return value;
    return value ? String(value).split(',') : KEYS.slice();
  })();
  async function getCloudRows(keys=PAGE_KEYS){
    const wanted=(keys&&keys.length?keys:PAGE_KEYS).filter(k=>KEYS.includes(k));
    if(!wanted.length) return [];
    const {data,error}=await client.from(CLOUD_TABLE).select("key,value,updated_at").in("key",wanted);
    if(error) throw error;
    return data||[];
  }
  async function pull(keys=PAGE_KEYS){
    try{
      const wanted=(keys&&keys.length?keys:PAGE_KEYS).filter(k=>KEYS.includes(k));
      if(!wanted.length){
        window.BookNestCloud.lastSync={ok:true,at:new Date().toISOString(),keys:[]};
        return true;
      }
      const rows=await getCloudRows(wanted);
      const byKey=Object.fromEntries(rows.map(r=>[r.key,r]));
      // Only replace the datasets requested for this page. This avoids a buyer page
      // downloading seller receipts/purchases and prevents unrelated data from being
      // rendered during startup. Missing requested cloud keys are intentionally empty.
      for(const key of wanted){
        if(Object.prototype.hasOwnProperty.call(byKey,key)) writeLocal(key,byKey[key].value);
        else localStorage.removeItem(key);
      }
      window.BookNestCloud.lastSync={ok:true,at:new Date().toISOString(),keys:rows.map(r=>r.key)};
      window.dispatchEvent(new CustomEvent('booknest-cloud-ready',{detail:{ok:true,keys:rows.map(r=>r.key)}}));
      return true;
    }catch(error){
      console.error('[BookNest] Supabase sync failed',error);
      window.BookNestCloud.lastSync={ok:false,at:new Date().toISOString(),error:String(error?.message||error)};
      window.dispatchEvent(new CustomEvent('booknest-cloud-ready',{detail:{ok:false,error:String(error?.message||error)}}));
      return false;
    }
  }
  async function pullWithRetry(keys=PAGE_KEYS){
    for(let attempt=0;attempt<3;attempt++){
      if(await pull(keys)) return true;
      if(attempt<2) await new Promise(r=>setTimeout(r,800*(attempt+1)));
    }
    return false;
  }
  async function pushLocalData(){
    const rows=[]; for(const key of KEYS){const local=readLocal(key);if(local!==null) rows.push(save(key,local));} await Promise.all(rows); return true;
  }
  let realtimeTimer=null;
  function scheduleRealtimePull(payload){
    clearTimeout(realtimeTimer);
    const changedKey=payload?.new?.key || payload?.old?.key;
    const wanted=changedKey && PAGE_KEYS.includes(changedKey) ? [changedKey] : PAGE_KEYS;
    realtimeTimer=setTimeout(()=>pullWithRetry(wanted),250);
  }
  try{
    client.channel('booknest-data-live')
      .on('postgres_changes',{event:'*',schema:'public',table:CLOUD_TABLE},payload=>scheduleRealtimePull(payload))
      .subscribe();
  }catch(e){
    console.warn('[BookNest] Realtime subscription unavailable; polling fallback remains active.',e);
  }
  window.BookNestCloud={enabled:true,client,ready:PAGE_KEYS.length?pullWithRetry(PAGE_KEYS):Promise.resolve(true),save,pull:pullWithRetry,refresh:pullWithRetry,pushLocalData,lastSync:null};
})();
