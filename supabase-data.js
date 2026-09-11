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
  const readLocal = key => { try { const raw=localStorage.getItem(key); return raw==null?null:JSON.parse(raw); } catch(e){ return null; } };
  const writeLocal = (key,value) => { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch(e){ console.warn("[BookNest] cache write failed",key,e); return false; } };
  const queues = new Map();
  async function rawSave(key,value){
    const {error}=await client.from(CLOUD_TABLE).upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error) throw error;
    return true;
  }
  function save(key,value){
    if(!KEYS.includes(key)) return Promise.resolve(false);
    const previous=queues.get(key)||Promise.resolve();
    const next=previous.catch(()=>{}).then(()=>rawSave(key,value));
    queues.set(key,next.finally(()=>{if(queues.get(key)===next) queues.delete(key);}));
    return next;
  }
  async function getCloudRows(){
    const {data,error}=await client.from(CLOUD_TABLE).select("key,value,updated_at").in("key",KEYS);
    if(error) throw error;
    return data||[];
  }
  async function pull(){
    try{
      const rows=await getCloudRows();
      const byKey=Object.fromEntries(rows.map(r=>[r.key,r]));
      // Cloud is authoritative whenever a row exists. A missing cloud key is
      // intentionally left empty; we do NOT resurrect stale browser data.
      // This is what makes a brand-new browser safe and predictable.
      for(const key of KEYS){
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
  async function pullWithRetry(){
    for(let attempt=0;attempt<3;attempt++){
      if(await pull()) return true;
      if(attempt<2) await new Promise(r=>setTimeout(r,800*(attempt+1)));
    }
    return false;
  }
  async function pushLocalData(){
    const rows=[]; for(const key of KEYS){const local=readLocal(key);if(local!==null) rows.push(save(key,local));} await Promise.all(rows); return true;
  }
  let realtimeTimer=null;
  function scheduleRealtimePull(){
    clearTimeout(realtimeTimer);
    realtimeTimer=setTimeout(()=>pullWithRetry(),180);
  }
  try{
    client.channel('booknest-data-live')
      .on('postgres_changes',{event:'*',schema:'public',table:CLOUD_TABLE},scheduleRealtimePull)
      .subscribe();
  }catch(e){
    console.warn('[BookNest] Realtime subscription unavailable; polling fallback remains active.',e);
  }
  window.BookNestCloud={enabled:true,client,ready:pullWithRetry(),save,pull:pullWithRetry,refresh:pullWithRetry,pushLocalData,lastSync:null};
})();
