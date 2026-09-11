/* BookNest buyer-site availability + lightweight shared-store helpers. */
(function(){
  'use strict';
  const KEY = '.site_status';
  const DEFAULT = {
    locked: false,
    title: 'BookNest is temporarily closed',
    message: 'Sorry! The BookNest buyer site is down for now. Please check back later — we will be back as soon as possible. Thank you for your patience. 📚',
    updatedAt: null
  };
  const BUYER_PAGES = new Set(['index.html','buyer-login.html','shop.html','']);

  function currentPage(){
    const p=(location.pathname.split('/').pop()||'').toLowerCase();
    return p || '';
  }
  function isBuyerPage(){ return BUYER_PAGES.has(currentPage()); }
  function readLocal(){
    try { return {...DEFAULT,...(JSON.parse(localStorage.getItem(KEY)||'{}')||{})}; }
    catch(e){ return {...DEFAULT}; }
  }
  function writeLocal(status){ try{ localStorage.setItem(KEY,JSON.stringify(status)); }catch(e){} }

  function installCss(){
    if(document.getElementById('bn-site-status-style')) return;
    const s=document.createElement('style');
    s.id='bn-site-status-style';
    s.textContent=`
      #bn-site-locked{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:22px;background:linear-gradient(150deg,#273b30,#18251f);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#263329;overflow:auto}
      #bn-site-locked .bn-lock-card{width:min(560px,100%);background:#f8f3e7;border:1px solid rgba(255,255,255,.25);border-radius:26px;padding:34px 30px;text-align:center;box-shadow:0 28px 80px rgba(0,0,0,.35)}
      #bn-site-locked img.bn-lock-gif{display:block;max-width:220px;max-height:190px;width:auto;height:auto;margin:0 auto 10px;object-fit:contain}
      #bn-site-locked h1{font:600 31px/1.1 Georgia,serif;margin:7px 0 12px;color:#263329}
      #bn-site-locked p{margin:0 auto 16px;max-width:460px;color:#665f52;line-height:1.65;font-size:14px}
      #bn-site-locked .bn-lock-note{display:inline-block;padding:8px 12px;border-radius:999px;background:#ede3c9;color:#6d592f;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      #bn-site-locked .bn-lock-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-top:18px}
      #bn-site-locked a{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:800;font-size:12px;border:1px solid #d9cdb2;color:#35493c;background:transparent}
      #bn-site-locked a.primary{background:#35493c;color:#fff;border-color:#35493c}
      body.bn-site-locking>*{visibility:hidden!important}
    `;
    document.head.appendChild(s);
  }

  function showLocked(status){
    if(!isBuyerPage()) return;
    installCss();
    let o=document.getElementById('bn-site-locked');
    if(!o){
      o=document.createElement('div');
      o.id='bn-site-locked';
      o.setAttribute('role','dialog');
      o.setAttribute('aria-live','polite');
      document.body.appendChild(o);
    }
    const title=String(status.title||DEFAULT.title);
    const msg=String(status.message||DEFAULT.message);
    o.innerHTML=`<div class="bn-lock-card"><span class="bn-lock-note">BUYER SITE CURRENTLY OFFLINE</span><img class="bn-lock-gif" src="site-closed.gif" alt="Sorry — BookNest is temporarily closed"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(msg)}</p><div class="bn-lock-actions"><a class="primary" href="index.html">Back to BookNest</a><a href="seller-login.html">Seller access</a></div></div>`;
    document.documentElement.style.overflow='hidden';
  }
  function hideLocked(){
    const o=document.getElementById('bn-site-locked');
    if(o) o.remove();
    document.documentElement.style.overflow='';
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function fetchStatus(){
    try{
      if(window.BookNestCloud?.ready) await window.BookNestCloud.ready;
      const s=readLocal();
      if(s && typeof s==='object') writeLocal({...DEFAULT,...s});
      return {...DEFAULT,...s};
    }catch(e){ return readLocal(); }
  }

  async function refresh(){
    const status=await fetchStatus();
    if(isBuyerPage() && status.locked) showLocked(status); else hideLocked();
    window.dispatchEvent(new CustomEvent('booknest-site-status',{detail:status}));
    return status;
  }

  async function setStatus(next){
    const status={...DEFAULT,...readLocal(),...(next||{}),updatedAt:new Date().toISOString()};
    writeLocal(status);
    if(window.BookNestCloud?.enabled){
      try{ await window.BookNestCloud.save(KEY,status); }catch(e){ console.error('[BookNest] site status save failed',e); throw e; }
    }
    window.dispatchEvent(new CustomEvent('booknest-site-status',{detail:status}));
    return status;
  }

  function boot(){
    if(isBuyerPage()){
      document.documentElement.classList.add('bn-site-status-ready');
      if(document.body) document.body.classList.add('bn-site-locking');
    }
    setTimeout(async()=>{
      if(isBuyerPage() && window.BookNestCloud?.pull) {
        try{ await window.BookNestCloud.pull(); }catch(e){}
      }
      await refresh();
      if(document.body) document.body.classList.remove('bn-site-locking');
    },0);
    setInterval(()=>{ if(isBuyerPage()) refresh().catch(()=>{}); },1200);
  }

  window.BookNestSiteStatus={key:KEY,defaults:{...DEFAULT},read:readLocal,refresh,setStatus,showLocked,hideLocked};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
