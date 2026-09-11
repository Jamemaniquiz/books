/* BookNest performance helpers: faster first paint without changing app behavior. */
(function(){
  'use strict';
  const idle = window.requestIdleCallback || ((cb)=>setTimeout(cb,1));

  // Keep the browser from spending layout/paint time on content far below the fold.
  function optimizeImages(root=document){
    const imgs = root.querySelectorAll ? root.querySelectorAll('img') : [];
    imgs.forEach(img=>{
      if(!img.hasAttribute('decoding')) img.decoding='async';
      if(!img.loading && !img.closest('header,.site-header,.brand,.logo,.add-brand')) img.loading='lazy';
      if(img.closest('#previews,#editPhotoGrid,.photo-previews,.edit-photo-grid')) img.loading='eager';
    });
  }

  function optimizeLongSections(){
    document.querySelectorAll('.book-list,.inventory-grid,.shop-grid,.products-grid,.order-list,.receipt-list,.table-wrap,.cards-grid').forEach(el=>{
      el.style.contain='layout paint style';
      el.style.contentVisibility='auto';
      if(!el.style.containIntrinsicSize) el.style.containIntrinsicSize='500px';
    });
  }

  function addPrefetch(){
    const links=[...document.querySelectorAll('a[href]')];
    const seen=new Set();
    links.forEach(a=>{
      const href=a.href;
      if(!href || seen.has(href) || new URL(href).origin!==location.origin) return;
      seen.add(href);
      a.addEventListener('mouseenter',()=>{
        if(document.querySelector(`link[rel="prefetch"][href="${CSS.escape(href)}"]`)) return;
        const l=document.createElement('link'); l.rel='prefetch'; l.href=href; document.head.appendChild(l);
      },{once:true,passive:true});
    });
  }

  function boot(){
    optimizeImages();
    optimizeLongSections();
    addPrefetch();
    const mo=new MutationObserver(muts=>{
      for(const m of muts){
        for(const node of m.addedNodes){
          if(node.nodeType===1) optimizeImages(node);
        }
      }
    });
    mo.observe(document.body,{childList:true,subtree:true});
    // Retry after dynamic content is present, but keep this off the critical path.
    idle(()=>{ optimizeImages(); optimizeLongSections(); });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
