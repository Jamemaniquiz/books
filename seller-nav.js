(function () {
  const file = (location.pathname.split('/').pop() || 'admin.html').toLowerCase();
  const activeMap = {
    'admin.html': 'admin.html',
    'inventory.html': 'inventory.html',
    'new-sale.html': 'inventory.html',
    'bundle-sale.html': 'inventory.html',
    'add-books.html': 'add-books.html',
    'shop-manager.html': 'shop-manager.html',
    'receipt-history.html': 'receipt-history.html',
    'orders.html': 'orders.html',
    'buyers.html': 'buyers.html'
  };
  const active = activeMap[file] || '';
  function init() {
    document.querySelectorAll('.site-header .nav').forEach(nav => {
      const sellerAccount = document.getElementById('sellerAccountBtn');
      const sellerLogout = document.getElementById('sellerLogoutBtn');
      [...nav.children].forEach(child => {
        if (child !== sellerAccount && child !== sellerLogout) child.remove();
      });
      const items = [
        ['Home', 'admin.html'],
        ['Inventory & Sales', 'inventory.html'],
        ['Add Books', 'add-books.html'],
        ['Add to Shop', 'shop-manager.html'],
        ['Receipts', 'receipt-history.html'],
        ['🛒 Shop Orders', 'orders.html'],
        ['👤 Buyers', 'buyers.html']
      ];
      const fragment = document.createDocumentFragment();
      items.forEach(([label, href]) => {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        a.dataset.sellerNav = '1';
        if (href === active) a.classList.add('active');
        fragment.appendChild(a);
      });
      const view = document.createElement('a');
      view.href = 'shop.html';
      view.textContent = '🛒 View Shop';
      view.dataset.sellerNav = '1';
      view.classList.add('nav-view-shop');
      fragment.appendChild(view);
      if (sellerAccount) fragment.appendChild(sellerAccount);
      if (sellerLogout) fragment.appendChild(sellerLogout);
      nav.appendChild(fragment);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Tiny seller-side interaction layer: fast reveal + button ripple without
// changing any BookNest data behavior.
(function(){
  function polish(){
    document.body.classList.add('bn-seller-ready');
    const nodes=[...document.querySelectorAll('.panel,.seller-hero,.shop-hero,.listing-row,.variant-card,.table-wrap')];
    nodes.forEach((el,i)=>{el.classList.add('bn-seller-reveal');el.style.transitionDelay=Math.min(i*28,280)+'ms';requestAnimationFrame(()=>el.classList.add('bn-visible'));});
    document.querySelectorAll('.btn').forEach(btn=>{
      if(btn.dataset.bnRipple) return;
      btn.dataset.bnRipple='1';
      btn.addEventListener('click',function(){this.classList.remove('bn-click-pop');void this.offsetWidth;this.classList.add('bn-click-pop');});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(polish,30));
  else setTimeout(polish,30);
})();
