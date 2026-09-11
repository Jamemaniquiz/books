/* BookNest seller navigation — one toolbar shared by every seller page. */
(function(){
  const items = [
    ['admin.html','⌂','Home'],
    ['add-books.html','＋','Add Books'],
    ['inventory.html','▣','Inventory'],
    ['orders.html','🛒','Shop Orders'],
    ['receipt-history.html','▤','Receipts'],
    ['buyers.html','♙','Buyers'],
    ['debug.html','⚙','Debug'],
    ['shop.html','↗','View Shop']
  ];
  function current(){
    const p = location.pathname.split('/').pop().toLowerCase() || 'admin.html';
    return p;
  }
  function build(){
    const nav=document.querySelector('.nav');
    if(!nav) return;
    const page=current();
    nav.innerHTML='';
    items.forEach(([href,icon,label])=>{
      const a=document.createElement('a');
      a.href=href;
      a.className='seller-nav-link'+(page===href?' active':'');
      a.innerHTML='<span class="seller-nav-icon">'+icon+'</span><span>'+label+'</span>';
      a.setAttribute('aria-current',page===href?'page':'false');
      a.addEventListener('click',function(){
        nav.querySelectorAll('a').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
      });
      nav.appendChild(a);
    });
    const out=document.createElement('button');
    out.type='button';
    out.className='seller-nav-logout';
    out.innerHTML='<span>↪</span><span>Log out</span>';
    out.addEventListener('click',function(){
      if(confirm('Log out of the BookNest seller workspace?')){
        if(window.BN_Security) window.BN_Security.logout();
      }
    });
    nav.appendChild(out);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',build); else build();
})();
