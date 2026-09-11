/* BookNest mobile polish: keeps every seller/buyer table readable on phones. */
(function () {
  'use strict';
  function enhanceTables() {
    document.querySelectorAll('table').forEach(function (table) {
      if (table.dataset.bnMobileEnhanced === '1') return;
      table.dataset.bnMobileEnhanced = '1';
      var headers = Array.from(table.querySelectorAll('thead th')).map(function (th) {
        return (th.textContent || '').replace(/\s+/g, ' ').trim();
      });
      table.querySelectorAll('tbody tr').forEach(function (row) {
        Array.from(row.children).forEach(function (cell, index) {
          if (cell.tagName !== 'TD') return;
          if (headers[index]) cell.setAttribute('data-label', headers[index]);
        });
      });
      var parent = table.parentElement;
      if (parent && !parent.classList.contains('bn-mobile-table-wrap')) {
        var wrap = document.createElement('div');
        wrap.className = 'bn-mobile-table-wrap';
        parent.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    });
  }
  function init() {
    enhanceTables();
    var observer = new MutationObserver(function () { enhanceTables(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
