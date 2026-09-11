// ============================================================
// BookNest cloud data layer — Supabase shared database
// ============================================================
(function () {
  "use strict";
  const SUPABASE_URL = window.BOOKNEST_SUPABASE_URL || "https://ryyhsbkuukbtflcetcn.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = window.BOOKNEST_SUPABASE_ANON_KEY || "sb_publishable_Y5uk8FMgr15vEiqy5bBq3g_X1cXbKmQ";
  const CLOUD_TABLE = "booknest_data";
  const KEYS = [".books",".sales",".receipts",".purchases",".sellerPayment",".shop_orders",".shop_listings"];
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
      // A successful cloud read is authoritative. Never let an empty local
      // browser overwrite an existing cloud key. Only seed genuinely missing
      // keys, and only when local data exists.
      for(const key of KEYS){
        if(Object.prototype.hasOwnProperty.call(byKey,key)) writeLocal(key,byKey[key].value);
        else { const local=readLocal(key); if(local!==null) await save(key,local); }
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
  window.BookNestCloud={enabled:true,client,ready:pullWithRetry(),save,pull:pullWithRetry,refresh:pullWithRetry,pushLocalData,lastSync:null};
})();
