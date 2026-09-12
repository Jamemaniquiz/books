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

  const NAV_ITEMS = [
    ['🏠', 'Dashboard', 'admin.html'],
    ['📚', 'Inventory & Sales', 'inventory.html'],
    ['➕', 'Add Books', 'add-books.html'],
    ['🛍️', 'Add to Shop', 'shop-manager.html'],
    ['🧾', 'Receipts', 'receipt-history.html'],
    ['🛒', 'Shop Orders', 'orders.html'],
    ['👤', 'Buyers', 'buyers.html']
  ];

  function init() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Reuse the existing DOM nodes (don't recreate) so any listeners
    // already bound to these ids elsewhere keep working.
    const sellerAccount = document.getElementById('sellerAccountBtn');
    const sellerLogout = document.getElementById('sellerLogoutBtn');
    const logoImg = header.querySelector('.logo-image');
    const logoSrc = (logoImg && logoImg.getAttribute('src')) || 'logo.png';

    const spine = document.createElement('div');
    spine.className = 'spine';

    const brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'admin.html';
    brand.innerHTML =
      '<img class="brand-logo-image" src="' + logoSrc + '" alt="BookNest logo">' +
      '<div><div class="brand-mark">BookNest</div><div class="brand-sub">SELLER CENTER</div></div>';
    spine.appendChild(brand);

    const navList = document.createElement('nav');
    navList.className = 'spine-nav';
    NAV_ITEMS.forEach(([icon, label, href]) => {
      const a = document.createElement('a');
      a.href = href;
      a.className = 'nav-item' + (href === active ? ' active' : '');
      a.innerHTML = '<span class="nav-icon">' + icon + '</span><span class="nav-label">' + label + '</span>';
      navList.appendChild(a);
    });
    spine.appendChild(navList);

    const viewShop = document.createElement('a');
    viewShop.href = 'shop.html';
    viewShop.className = 'nav-item spine-view-shop';
    viewShop.innerHTML = '<span class="nav-icon">🔎</span><span class="nav-label">View Shop</span>';
    spine.appendChild(viewShop);

    const footerActions = document.createElement('div');
    footerActions.className = 'spine-footer-actions';
    if (sellerAccount) footerActions.appendChild(sellerAccount);
    if (sellerLogout) footerActions.appendChild(sellerLogout);
    if (footerActions.children.length) spine.appendChild(footerActions);

    const copyright = document.createElement('div');
    copyright.className = 'spine-copyright';
    copyright.textContent = '© ' + new Date().getFullYear() + ' BookNest';
    spine.appendChild(copyright);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sidebar-toggle seller-sidebar-toggle';
    toggle.setAttribute('aria-label', 'Toggle menu');
    toggle.innerHTML = '☰';
    toggle.addEventListener('click', () => document.body.classList.toggle('seller-sidebar-open'));

    const app = document.createElement('div');
    app.className = 'seller-app';

    const mainWrap = document.createElement('div');
    mainWrap.className = 'seller-main';

    const topbar = document.createElement('div');
    topbar.className = 'seller-topbar';
    const topbarBrand = document.createElement('div');
    topbarBrand.className = 'seller-topbar-brand';
    topbarBrand.innerHTML = '<img src="' + logoSrc + '" alt="BookNest logo"><span>BookNest</span>';
    topbar.appendChild(toggle);
    topbar.appendChild(topbarBrand);

    mainEl.parentNode.insertBefore(app, mainEl);
    mainWrap.appendChild(topbar);
    mainWrap.appendChild(mainEl);
    app.appendChild(spine);
    app.appendChild(mainWrap);

    const overlay = document.createElement('div');
    overlay.className = 'seller-sidebar-overlay';
    overlay.addEventListener('click', () => document.body.classList.remove('seller-sidebar-open'));
    app.appendChild(overlay);

    header.remove();
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
