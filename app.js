// ── Storage keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  books:    ".books",
  sales:    ".sales",
  receipts: ".receipts",
  purchases: ".purchases",
  sellerPayment: ".sellerPayment",
};

const LEGACY_KEYS = {
  books:    "bookmart.books",
  sales:    "bookmart.sales",
  receipts: "bookmart.receipts",
  seeded:   "bookmart.seeded",
  eod:      "bookmart.eod_check",
};

const migrateStorage = () => {
  const hasNewBooks = localStorage.getItem(STORAGE_KEYS.books);
  const hasNewSales = localStorage.getItem(STORAGE_KEYS.sales);
  const hasNewReceipts = localStorage.getItem(STORAGE_KEYS.receipts);
  const hasLegacyBooks = localStorage.getItem(LEGACY_KEYS.books);
  const hasLegacySales = localStorage.getItem(LEGACY_KEYS.sales);
  const hasLegacyReceipts = localStorage.getItem(LEGACY_KEYS.receipts);

  if (!hasNewBooks && hasLegacyBooks) {
    localStorage.setItem(STORAGE_KEYS.books, hasLegacyBooks);
  }
  if (!hasNewSales && hasLegacySales) {
    localStorage.setItem(STORAGE_KEYS.sales, hasLegacySales);
  }
  if (!hasNewReceipts && hasLegacyReceipts) {
    localStorage.setItem(STORAGE_KEYS.receipts, hasLegacyReceipts);
  }

  const legacySeeded = localStorage.getItem(LEGACY_KEYS.seeded);
  if (legacySeeded && !localStorage.getItem(".seeded")) {
    localStorage.setItem(".seeded", legacySeeded);
  }

  const legacyEod = localStorage.getItem(LEGACY_KEYS.eod);
  if (legacyEod && !localStorage.getItem(".eod_check")) {
    localStorage.setItem(".eod_check", legacyEod);
  }
};

// ── Sample seed data ──────────────────────────────────────────────────────────
const sampleBooks = [
  { id: "b1", title: "The Midnight Library",  author: "Matt Haig",         genre: "Fiction",     price: 18.99, stock: 12, condition: "New"  },
  { id: "b2", title: "Atomic Habits",         author: "James Clear",       genre: "Self-Help",   price: 21.50, stock: 8,  condition: "New"  },
  { id: "b3", title: "Clean Code",            author: "Robert C. Martin",  genre: "Technology",  price: 32.00, stock: 4,  condition: "New"  },
  { id: "b4", title: "Harry Potter",          author: "J.K. Rowling",      genre: "Fantasy",     price: 25.00, stock: 15, condition: "New"  },
  { id: "b5", title: "The Kite Runner",       author: "Khaled Hosseini",   genre: "General",     price: 28.50, stock: 6,  condition: "New"  },
  { id: "b6", title: "To Kill A Mockingbird", author: "Harper Lee",        genre: "Classic",     price: 22.00, stock: 10, condition: "New"  },
  { id: "b7", title: "Casual Vacancy",        author: "J.K. Rowling",      genre: "General",     price: 20.00, stock: 5,  condition: "New"  },
  { id: "b8", title: "The Great Gatsby",      author: "F. Scott Fitzgerald", genre: "Classic",    price: 19.99, stock: 8,  condition: "Good" },
  { id: "b9", title: "Pride and Prejudice",   author: "Jane Austen",       genre: "Romance",     price: 16.50, stock: 12, condition: "New"  },
  { id: "b10", title: "1984",                 author: "George Orwell",     genre: "Dystopian",   price: 24.00, stock: 9,  condition: "New"  },
];

const sampleSales = [
  {
    id: "s1", bookId: "b1", bookTitle: "The Midnight Library",
    unitPrice: 18.99, quantity: 2, discount: 10,
    paymentMethod: "Cash", customer: "Jamie",
    date: new Date().toISOString(), voided: false,
  },
];

// ── Persistence helpers ───────────────────────────────────────────────────────
const getData    = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
};
const setData    = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Keep the existing synchronous API for the app, but mirror every save
    // to Supabase in the background. The local cache is updated immediately.
    if (window.BookNestCloud?.enabled) {
      window.BookNestCloud.save(key, value).catch(err =>
        console.error('[BookNest] Cloud save failed for', key, err)
      );
    }
    return true;
  } catch (err) {
    console.error("[BookNest] setData failed for", key, err);
    if (typeof showNotice === "function") {
      showNotice(
        "Could not save — your browser's storage is full (this often happens after adding several photos). " +
        "Try removing a photo, deleting old receipts, or downloading a backup and clearing some data.",
        "Save Failed"
      );
    }
    return false;
  }
};

const getBooks    = ()         => getData(STORAGE_KEYS.books,    []).map(b => ({
  ...b,
  title:  (b.title  === undefined || b.title  === null) ? "" : String(b.title),
  author: (b.author === undefined || b.author === null) ? "" : String(b.author),
  genre:  (b.genre  === undefined || b.genre  === null) ? "General" : String(b.genre),
  box:    (b.box    === undefined || b.box    === null) ? "" : String(b.box),
  variant:(b.variant === undefined || b.variant === null) ? "" : String(b.variant),
  price:  Number(b.price) || 0,
  stock:  Number.isFinite(Number(b.stock)) ? Number(b.stock) : 0,
  shopVisible: b.shopVisible === true, // Only show in shop if explicitly set to true
  // A short seller-written note on condition/edition/etc — shown to buyers
  // on the shop's book detail view.
  description: (b.description === undefined || b.description === null) ? "" : String(b.description),
  // Multiple cover photos. Older records only ever had a single `image` —
  // keep reading that as a one-photo gallery so nothing old breaks.
  images: Array.isArray(b.images) && b.images.filter(Boolean).length
    ? b.images.filter(Boolean)
    : (b.image ? [b.image] : []),
  // Each layaway hold reserves exactly one copy, so a title with several
  // copies in stock can have several *independent* layaways running at once.
  // Older data only ever stored a single reserved/reservedFor/layawayReceiptId
  // set on the book itself — migrate that into the first hold so nothing is lost.
  layawayHolds: Array.isArray(b.layawayHolds)
    ? b.layawayHolds
    : (b.reserved ? [{ receiptId: b.layawayReceiptId || null, name: (b.reservedFor || "").trim() }] : []),
}));
const getSales    = ()         => getData(STORAGE_KEYS.sales,    []);
const getReceipts = ()         => getData(STORAGE_KEYS.receipts, []);
const getPurchases= ()         => getData(STORAGE_KEYS.purchases, []);
const savePurchases = (purchases) => setData(STORAGE_KEYS.purchases, purchases);
const saveBooks   = (books)    => {
  setData(STORAGE_KEYS.books, books);
  console.log("[BookNest] saveBooks: saved", books.length, "books to", STORAGE_KEYS.books);
};
const saveSales   = (sales)    => setData(STORAGE_KEYS.sales,    sales);
const saveReceipts= (receipts) => setData(STORAGE_KEYS.receipts, receipts);
const getSellerPayment = () => getData(STORAGE_KEYS.sellerPayment, { gcashNumber: "", gcashQR: "" });
const saveSellerPayment = (data) => setData(STORAGE_KEYS.sellerPayment, data);

const ensureSeedData = () => {
  // Seed data disabled — BookNest only saves YOUR books, not sample data.
  // Mark seeded so legacy migration never re-inserts samples.
  if (!localStorage.getItem(".seeded")) {
    localStorage.setItem(".seeded", "true");
  }
};

// ── Utilities ─────────────────────────────────────────────────────────────────
const createId  = (prefix) =>
  `${prefix}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(16)}`;

const createReceiptId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand    = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).slice(0, 4).toUpperCase();
  return `BN-${dateStr}-${rand}`;
};

const currency  = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const formatDateLong = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const sum = (items, selector) => items.reduce((total, item) => total + selector(item), 0);

// ── Shipping carriers ────────────────────────────────────────────────────────
const TIKTOK_RENT_FEE = 20; // flat "Rent Fee" added on top of the COD/SF fee for TikTok orders

const SHIPPING_CARRIERS = {
  jnt:    { label: "J&T",         icon: "🚚" },
  tiktok: { label: "TikTok Shop", icon: "🛍️" },
  piling: { label: "Piling",      icon: "📥" }, // items being consolidated/held — not yet handed to a courier
};

const normalizeCarrier = (carrier) => {
  const c = String(carrier || "jnt").toLowerCase();
  if (c === "tiktok") return "tiktok";
  if (c === "piling") return "piling";
  return "jnt";
};

// Returns { sf, rent, total, carrier, label, icon } for a given SF/COD fee + carrier.
const getShippingBreakdown = (sfFee, carrier) => {
  const sf = Number(sfFee) || 0;
  const norm = normalizeCarrier(carrier);
  const rent = norm === "tiktok" ? TIKTOK_RENT_FEE : 0;
  const meta = SHIPPING_CARRIERS[norm];
  return { sf, rent, total: sf + rent, carrier: norm, label: meta.label, icon: meta.icon };
};

// ── Layaway plans ────────────────────────────────────────────────────────────
// Flat service fee charged for the layaway option, based on the chosen term.
// The 1-month term has been retired — 2 months is now the shortest plan.
const LAYAWAY_FEES = { 2: 200, 3: 300, 4: 400 };

const getLayawayFee = (months) => {
  const n = Math.min(4, Math.max(2, parseInt(months, 10) || 0));
  return LAYAWAY_FEES[n] || 0;
};

// How many copies of this book are NOT currently held on a layaway plan.
// A title with 2 in stock and 1 active hold still has 1 copy free to layaway.
const getAvailableLayawayStock = (book) => {
  const holds = Array.isArray(book?.layawayHolds) ? book.layawayHolds : [];
  return Math.max(0, (Number(book?.stock) || 0) - holds.length);
};

// Builds a layaway plan: the full `total` is split evenly across `installments + 1`
// payments (the first payment made at booking, plus `installments` more). There's
// no flat first-payment amount anymore — every payment (including the first) is
// recalculated fresh as total / (installments + 1) for each plan.
// The first payment is always due (and paid) on `startDate` — the exact date the
// order was placed. Every payment after that is due on the 15th of the following
// calendar months when `intervalDays` is 15 (a fixed "quincena" billing date, not
// a rolling 15-day countdown); otherwise payments are spaced `intervalDays` apart
// from `startDate`. The last installment absorbs any rounding remainder so
// everything always sums to `total` exactly.
const buildLayawayPlan = (total, installments, intervalDays = 30, startDate = new Date()) => {
  const n = Math.min(4, Math.max(2, parseInt(installments, 10) || 2));
  const amount = Number(total) || 0;
  const start = startDate instanceof Date ? startDate : new Date(startDate);

  const totalPayments = n + 1; // first payment (paid now) + n more payments
  const base = Math.floor((amount / totalPayments) * 100) / 100;

  const payments = [];
  let running = 0;
  for (let i = 0; i < totalPayments; i++) {
    const due = i === totalPayments - 1 ? Math.round((amount - running) * 100) / 100 : base;
    running += due;

    if (i === 0) {
      // First payment: recalculated share of the total, due & paid on the exact order date.
      payments.push({
        month: 0,
        amount: due,
        paid: true,
        paidDate: start.toISOString(),
        dueDate: start.toISOString(),
        reservation: true,
      });
    } else {
      const dueDate = intervalDays === 15
        ? new Date(start.getFullYear(), start.getMonth() + i, 15) // the 15th of each following month
        : new Date(start.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
      payments.push({ month: i, amount: due, paid: false, paidDate: null, dueDate: dueDate.toISOString() });
    }
  }
  return payments;
};

// Returns a summary of a receipt's layaway plan, or null if it doesn't have one.
const getLayawaySummary = (receipt) => {
  const lw = receipt?.layaway;
  if (!lw || !lw.enabled || !Array.isArray(lw.payments) || !lw.payments.length) return null;
  const totalAmount = sum(lw.payments, p => Number(p.amount) || 0);
  const paidAmount  = sum(lw.payments.filter(p => p.paid), p => Number(p.amount) || 0);
  const paidCount   = lw.payments.filter(p => p.paid).length;
  return {
    months: lw.months,
    fee: Number(lw.fee) || 0,
    payments: lw.payments,
    totalAmount,
    paidAmount,
    balance: Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100),
    paidCount,
    totalCount: lw.payments.length,
    complete: paidCount === lw.payments.length,
  };
};

// Toggles a single installment's paid status and keeps the receipt's overall
// `paid` flag in sync once every installment has been collected.
const toggleLayawayPayment = (receiptId, monthNumber) => {
  const receipts = getReceipts();
  const receipt = receipts.find(r => r.id === receiptId);
  if (!receipt || !receipt.layaway || !Array.isArray(receipt.layaway.payments)) return null;
  const installment = receipt.layaway.payments.find(p => p.month === monthNumber);
  if (!installment) return null;
  installment.paid = !installment.paid;
  installment.paidDate = installment.paid ? new Date().toISOString() : null;
  const allPaid = receipt.layaway.payments.every(p => p.paid);
  receipt.paid = allPaid;
  saveReceipts(receipts);
  return receipt;
};

// ── Layaway booking dialog (Inventory page "Layaway" button) ───────────────
let layawayBookingDialog = null;

const ensureLayawayBookingDialog = () => {
  if (layawayBookingDialog) return layawayBookingDialog;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal";
  dialog.style.width = "min(480px, 94vw)";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">🗓️</div>
      <h3 class="action-modal__title">Layaway Booking</h3>
    </div>
    <div class="action-modal__body">
      <div id="layaway-modal-book-label" style="margin-bottom:12px;font-weight:700;color:#0f172a;font-size:14px;"></div>
      <label style="display:grid;gap:4px;margin-bottom:10px;">
        <span style="font-weight:700;color:#475569;font-size:13px;">Customer Name</span>
        <input id="layaway-modal-name" type="text" placeholder="Optional" style="padding:10px 12px;border-radius:10px;border:2px solid #cbd5e1;font-size:14px;font-family:inherit;">
      </label>
      <label style="display:grid;gap:4px;margin-bottom:14px;">
        <span style="font-weight:700;color:#475569;font-size:13px;">Phone Number</span>
        <input id="layaway-modal-phone" type="text" placeholder="Optional" style="padding:10px 12px;border-radius:10px;border:2px solid #cbd5e1;font-size:14px;font-family:inherit;">
      </label>
      <div style="font-weight:700;color:#475569;font-size:13px;margin-bottom:6px;">Payment Term — due every 15th of the month</div>
      <div style="display:grid;gap:8px;margin-bottom:12px;">
        <label style="display:flex;align-items:center;gap:8px;border:2px solid #ddd6fe;border-radius:10px;padding:10px 12px;font-weight:600;color:#4c1d95;cursor:pointer;">
          <input type="radio" name="layaway-modal-term" value="2" checked style="accent-color:#7c3aed;">
          2 payments — 15th of the next 2 months
          <span style="margin-left:auto;font-weight:800;color:#7c3aed;">+₱200</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;border:2px solid #ddd6fe;border-radius:10px;padding:10px 12px;font-weight:600;color:#4c1d95;cursor:pointer;">
          <input type="radio" name="layaway-modal-term" value="3" style="accent-color:#7c3aed;">
          3 payments — 15th of the next 3 months
          <span style="margin-left:auto;font-weight:800;color:#7c3aed;">+₱300</span>
        </label>
        <label style="display:flex;align-items:center;gap:8px;border:2px solid #ddd6fe;border-radius:10px;padding:10px 12px;font-weight:600;color:#4c1d95;cursor:pointer;">
          <input type="radio" name="layaway-modal-term" value="4" style="accent-color:#7c3aed;">
          4 payments — 15th of the next 4 months
          <span style="margin-left:auto;font-weight:800;color:#7c3aed;">+₱400</span>
        </label>
      </div>
      <div id="layaway-modal-preview" style="background:#f5f3ff;border:2px dashed #c4b5fd;border-radius:10px;padding:10px 12px;font-size:13px;color:#4c1d95;line-height:1.6;"></div>
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-ghost" data-action="cancel" type="button">Cancel</button>
      <button class="btn modal-primary" data-action="confirm" type="button">Create Layaway Invoice</button>
    </div>
  `;
  document.body.appendChild(dialog);
  layawayBookingDialog = dialog;
  return dialog;
};

const openLayawayBookingDialog = (book) => new Promise(resolve => {
  const dialog = ensureLayawayBookingDialog();
  const nameInput  = dialog.querySelector("#layaway-modal-name");
  const phoneInput = dialog.querySelector("#layaway-modal-phone");
  const preview    = dialog.querySelector("#layaway-modal-preview");
  const cancelBtn  = dialog.querySelector("[data-action='cancel']");
  const confirmBtn = dialog.querySelector("[data-action='confirm']");

  dialog.querySelector("#layaway-modal-book-label").textContent = `${book.title} — ${currency(book.price)}`;
  nameInput.value = "";
  phoneInput.value = "";
  const firstTerm = dialog.querySelector('input[name="layaway-modal-term"][value="2"]');
  if (firstTerm) firstTerm.checked = true;

  const updatePreview = () => {
    const term = parseInt(dialog.querySelector('input[name="layaway-modal-term"]:checked')?.value, 10) || 2;
    const fee = getLayawayFee(term);
    const total = (Number(book.price) || 0) + fee;
    const plan = buildLayawayPlan(total, term, 15);
    const lines = plan.map(p => p.reservation
      ? `1st payment (pay now, ${formatDateLong(p.dueDate)}): <strong>${currency(p.amount)}</strong>`
      : `Due ${formatDateLong(p.dueDate)}: <strong>${currency(p.amount)}</strong>`
    ).join("<br>");
    const firstPayment = plan[0];
    preview.innerHTML = `Book price ${currency(book.price)} + layaway fee <strong>${currency(fee)}</strong> = <strong>${currency(total)}</strong> total, split evenly across ${plan.length} payments. <strong>${currency(firstPayment.amount)}</strong> of that is collected right now.<br>${lines}`;
  };
  dialog.querySelectorAll('input[name="layaway-modal-term"]').forEach(r => { r.onchange = updatePreview; });
  updatePreview();

  const cleanup = (result) => {
    dialog.close();
    cancelBtn.onclick = null;
    confirmBtn.onclick = null;
    resolve(result);
  };

  cancelBtn.onclick = () => cleanup({ confirmed: false });
  confirmBtn.onclick = () => {
    const term = parseInt(dialog.querySelector('input[name="layaway-modal-term"]:checked')?.value, 10) || 2;
    cleanup({ confirmed: true, name: nameInput.value.trim(), phone: phoneInput.value.trim(), term });
  };

  dialog.showModal();
  setTimeout(() => nameInput.focus(), 50);
});

// ── Themed action dialog ────────────────────────────────────────────────────
let actionDialog = null;

const ensureActionDialog = () => {
  if (actionDialog) return actionDialog;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">BN</div>
      <h3 class="action-modal__title">Action</h3>
    </div>
    <div class="action-modal__body">
      <div class="action-modal__message"></div>
      <label class="action-modal__input" style="display:none">
        <span class="action-modal__label"></span>
        <input class="action-modal__field" />
      </label>
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-ghost" data-action="cancel" type="button">Cancel</button>
      <button class="btn modal-primary" data-action="confirm" type="button">Confirm</button>
    </div>
  `;
  document.body.appendChild(dialog);
  actionDialog = dialog;
  return dialog;
};

const openActionDialog = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  input = null,
  iconText = "BN",
}) => new Promise(resolve => {
  const dialog = ensureActionDialog();
  const titleEl = dialog.querySelector(".action-modal__title");
  const msgEl = dialog.querySelector(".action-modal__message");
  const iconEl = dialog.querySelector(".action-modal__icon");
  const inputWrap = dialog.querySelector(".action-modal__input");
  const inputLabel = dialog.querySelector(".action-modal__label");
  const inputField = dialog.querySelector(".action-modal__field");
  const cancelBtn = dialog.querySelector("[data-action='cancel']");
  const confirmBtn = dialog.querySelector("[data-action='confirm']");

  titleEl.textContent = title || "Action";
  msgEl.textContent = message || "";
  iconEl.textContent = iconText;
  cancelBtn.textContent = cancelText;
  cancelBtn.style.display = cancelText ? "inline-flex" : "none";
  confirmBtn.textContent = confirmText;

  if (input) {
    inputWrap.style.display = "grid";
    inputLabel.textContent = input.label || "";
    inputField.type = input.type || "text";
    inputField.value = input.value ?? "";
    inputField.placeholder = input.placeholder || "";
    if (input.min !== undefined) inputField.min = input.min;
    if (input.list) inputField.setAttribute("list", input.list);
    else inputField.removeAttribute("list");
  } else {
    inputWrap.style.display = "none";
    inputField.value = "";
  }

  const cleanup = (result) => {
    dialog.close();
    cancelBtn.onclick = null;
    confirmBtn.onclick = null;
    resolve(result);
  };

  cancelBtn.onclick = () => cleanup({ confirmed: false, value: inputField.value });
  confirmBtn.onclick = () => cleanup({ confirmed: true, value: inputField.value });

  dialog.showModal();
  if (input) setTimeout(() => inputField.focus(), 50);
});

const showNotice = (message, title = "Notice") =>
  openActionDialog({ title, message, confirmText: "OK", cancelText: "", iconText: "!" })
    .then(() => {});

// ── Undo Toast ───────────────────────────────────────────────────────────────
// A small bottom-of-screen toast with an "Undo" button, used for quick
// low-risk deletes so people don't need a confirm dialog to feel safe.
// If they don't click Undo before it expires, the action just stands.
let undoToastEl = null;
let undoToastTimer = null;

const ensureUndoToastEl = () => {
  if (undoToastEl) return undoToastEl;
  const el = document.createElement("div");
  el.className = "undo-toast";
  el.innerHTML = `
    <span class="undo-toast__msg"></span>
    <button type="button" class="undo-toast__btn">Undo</button>
    <button type="button" class="undo-toast__close" aria-label="Dismiss">✕</button>
  `;
  document.body.appendChild(el);
  undoToastEl = el;
  return el;
};

const showUndoToast = (message, onUndo, duration = 6000) => {
  const el = ensureUndoToastEl();
  el.querySelector(".undo-toast__msg").textContent = message;
  const undoBtn  = el.querySelector(".undo-toast__btn");
  const closeBtn = el.querySelector(".undo-toast__close");

  clearTimeout(undoToastTimer);
  el.classList.remove("show");
  void el.offsetWidth; // restart animation if a toast is already visible
  el.classList.add("show");

  const dismiss = () => {
    el.classList.remove("show");
    clearTimeout(undoToastTimer);
    undoBtn.onclick = null;
    closeBtn.onclick = null;
  };

  undoBtn.onclick = () => { dismiss(); onUndo?.(); };
  closeBtn.onclick = dismiss;
  undoToastTimer = setTimeout(dismiss, duration);
};

// ── Box Picker Dialog ───────────────────────────────────────────────────────
// A dropdown-based picker (not free typing) so people just select an
// existing box from the system, or add a new one, rather than retyping names.
let boxPickerDialog = null;
const ensureBoxPickerDialog = () => {
  if (boxPickerDialog) return boxPickerDialog;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">📦</div>
      <h3 class="action-modal__title">Assign Box</h3>
    </div>
    <div class="action-modal__body">
      <div class="action-modal__message"></div>
      <label class="action-modal__input">
        <span class="action-modal__label">Box</span>
        <select class="action-modal__select"></select>
      </label>
      <label class="action-modal__input" style="display:none">
        <span class="action-modal__label">New Box Name</span>
        <input class="action-modal__new-box" placeholder="e.g. Box 3" />
      </label>
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-ghost" data-action="cancel" type="button">Cancel</button>
      <button class="btn modal-primary" data-action="confirm" type="button">Assign</button>
    </div>
  `;
  document.body.appendChild(dialog);
  boxPickerDialog = dialog;
  return dialog;
};

const openBoxPickerDialog = ({ title, message, boxes = [], currentBox = "", confirmText = "Assign" }) => new Promise(resolve => {
  const dialog       = ensureBoxPickerDialog();
  const titleEl      = dialog.querySelector(".action-modal__title");
  const msgEl        = dialog.querySelector(".action-modal__message");
  const selectEl     = dialog.querySelector(".action-modal__select");
  const newBoxWrap   = dialog.querySelectorAll(".action-modal__input")[1];
  const newBoxInput  = dialog.querySelector(".action-modal__new-box");
  const cancelBtn    = dialog.querySelector("[data-action='cancel']");
  const confirmBtn   = dialog.querySelector("[data-action='confirm']");

  titleEl.textContent = title || "Assign Box";
  msgEl.textContent = message || "";
  confirmBtn.textContent = confirmText;

  selectEl.innerHTML = [
    `<option value="">— No box (clear) —</option>`,
    ...boxes.map(b => `<option value="${b.replace(/"/g, "&quot;")}">📦 ${b}</option>`),
    `<option value="__new__">➕ Add a new box…</option>`,
  ].join("");
  const isKnownBox = currentBox && boxes.includes(currentBox);
  selectEl.value = isKnownBox ? currentBox : (currentBox ? "__new__" : "");
  newBoxInput.value = isKnownBox ? "" : (currentBox || "");
  newBoxWrap.style.display = selectEl.value === "__new__" ? "grid" : "none";

  selectEl.onchange = () => {
    newBoxWrap.style.display = selectEl.value === "__new__" ? "grid" : "none";
    if (selectEl.value === "__new__") setTimeout(() => newBoxInput.focus(), 30);
  };

  const cleanup = (result) => {
    dialog.close();
    selectEl.onchange = null;
    cancelBtn.onclick = null;
    confirmBtn.onclick = null;
    resolve(result);
  };

  cancelBtn.onclick  = () => cleanup({ confirmed: false, box: currentBox });
  confirmBtn.onclick = () => {
    const box = selectEl.value === "__new__" ? newBoxInput.value.trim() : selectEl.value;
    cleanup({ confirmed: true, box });
  };

  dialog.showModal();
});

const getSaleTotal = (sale, books) => {
  const unitPrice = typeof sale.unitPrice === "number"
    ? sale.unitPrice
    : (books.find(b => b.id === sale.bookId)?.price ?? 0);
  return unitPrice * sale.quantity;
};

// ──  Receipt Modal (inventory page) ────────────────────────────────────
let pendingSale = null;

const openReceiptModal = (saleRows, customerInfo = null) => {
  const modal = document.getElementById("receiptModal");
  if (!modal) return;

  const receiptId = createReceiptId();
  const now       = new Date().toISOString();

  // Fill header
  document.getElementById("bn-receipt-id").textContent   = receiptId;
  document.getElementById("bn-receipt-date").textContent = formatDateLong(now);

  // Fill or clear customer fields
  if (customerInfo) {
    // Pre-populate with provided info (from new-sale.html)
    const nameEl = document.getElementById("bn-customer-name");
    const addressEl = document.getElementById("bn-customer-address");
    const phoneEl = document.getElementById("bn-customer-phone");
    const paymentSel = document.getElementById("bn-payment-method");

    if (nameEl) nameEl.value = customerInfo.customer || "";
    if (addressEl) addressEl.value = customerInfo.address || "";
    if (phoneEl) phoneEl.value = customerInfo.phone || "";
    if (paymentSel) paymentSel.value = customerInfo.paymentMethod || "GCash";
  } else {
    // Clear customer fields for single-book sales
    ["bn-customer-name","bn-customer-address","bn-customer-phone"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const paymentSel = document.getElementById("bn-payment-method");
    if (paymentSel) paymentSel.value = "GCash";
  }

  // Fill items table
  const tbody = document.getElementById("bn-order-items");
  if (tbody) {
    tbody.innerHTML = saleRows.map(row => {
      const lineTotal = row.unitPrice * row.qty;
      return `<tr>
        <td>${row.title || row.bookTitle}</td>
        <td>${row.author || row.bookAuthor || "—"}</td>
        <td>${row.genre || row.bookGenre || "—"}</td>
        <td>${row.type || row.bookType || "—"}</td>
        <td style="text-align:right">${currency(row.unitPrice)}</td>
        <td>${row.condition || row.bookCondition || "—"}</td>
        <td style="text-align:center">${row.qty}</td>
        <td style="text-align:right">${currency(lineTotal)}</td>
      </tr>`;
    }).join("");
  }

  // Grand total
  const grandTotal = sum(saleRows, r => r.unitPrice * r.qty);
  document.getElementById("bn-books-total").textContent = grandTotal.toFixed(2);
  document.getElementById("bn-grand-total-display").textContent = `₱ ${grandTotal.toFixed(2)}`;

  pendingSale = { receiptId, date: now, saleRows, grandTotal, saved: false };

  modal.showModal();
};

const initReceiptModal = () => {
  const modal = document.getElementById("receiptModal");
  if (!modal) return;

  document.getElementById("bn-close-modal")?.addEventListener("click", () => {
    if (pendingSale && !pendingSale.saved) {
      // Undo: restore stock and remove sale records
      const books = getBooks();
      const sales = getSales();
      pendingSale.saleRows.forEach(r => {
        const sale = sales.find(s => s.id === r.saleId);
        const book = sale ? books.find(b => b.id === sale.bookId) : null;
        if (book) book.stock += r.qty;
        const idx = sales.findIndex(s => s.id === r.saleId);
        if (idx !== -1) sales.splice(idx, 1);
      });
      saveBooks(books);
      saveSales(sales);
    }
    pendingSale = null;
    modal.close();
    initInventory();
    initSales();
  });

  document.getElementById("bn-save-receipt")?.addEventListener("click", () => {
    saveReceiptFromModal();
    modal.close();
    pendingSale = null;
    initSales();
    initInventory();
  });

  document.getElementById("bn-print-receipt")?.addEventListener("click", () => {
    printReceiptArea("receiptPrintArea");
  });

  document.getElementById("bn-download-receipt")?.addEventListener("click", () => {
    downloadReceipt("receiptPrintArea");
  });
};

const saveReceiptFromModal = () => {
  if (!pendingSale) return;
  const customer      = document.getElementById("bn-customer-name")?.value.trim()    || "";
  const address       = document.getElementById("bn-customer-address")?.value.trim() || "";
  const phone         = document.getElementById("bn-customer-phone")?.value.trim()   || "";
  const paymentMethod = document.getElementById("bn-payment-method")?.value          || "GCash";

  const receiptPayload = {
    id:            pendingSale.receiptId,
    date:          pendingSale.date,
    customer,
    address,
    phone,
    paymentMethod,
    saleIds:       pendingSale.saleRows.map(r => r.saleId),
    items: pendingSale.saleRows.map(r => ({
      title:     r.bookTitle,
      author:    r.bookAuthor    || "",
      genre:     r.bookGenre     || "",
      type:      r.bookType      || r.type || "",
      condition: r.bookCondition || "New",
      qty:       r.qty,
      unitPrice: r.unitPrice,
      discount:  0,
      stockAfter: typeof r.stockAfter === "number" ? r.stockAfter : null,
    })),
    total: pendingSale.grandTotal,
  };

  const receipts = getReceipts();
  const existingIndex = receipts.findIndex(r => r.id === pendingSale.receiptId);
  if (existingIndex >= 0) {
    receipts[existingIndex] = receiptPayload;
  } else {
    receipts.push(receiptPayload);
  }
  saveReceipts(receipts);

  // Patch sale records with customer + payment
  const sales = getSales();
  pendingSale.saleRows.forEach(r => {
    const sale = sales.find(s => s.id === r.saleId);
    if (sale) {
      sale.customer      = customer;
      sale.paymentMethod = paymentMethod;
    }
  });
  saveSales(sales);

  pendingSale.saved = true;
};

// ── -style image download ──────────────────────────────────────────────
const downloadReceipt = async (printAreaId, filenamePrefix = "Receipt") => {
  const printArea = document.getElementById(printAreaId);
  if (!printArea) return;

  if (typeof html2canvas === "undefined") {
    showNotice("html2canvas library not loaded. Please refresh the page.", "Error");
    return;
  }

  // Hide toolbar
  const toolbar = document.querySelector(".bn-modal-bar");
  if (toolbar) toolbar.style.display = "none";

  // Convert remote/local images to base64 first to avoid tainted canvas error.
  // Skip images that are ALREADY data: URIs (e.g. uploaded photos) — they don't
  // need conversion, and appending a cache-busting query string to a data: URI
  // corrupts it and can cause the load to hang indefinitely in some browsers.
  const imgs = Array.from(printArea.querySelectorAll("img"));
  const origSrcs = imgs.map(img => img.src);
  await Promise.all(imgs.map((img, i) => {
    if (origSrcs[i].startsWith("data:")) return Promise.resolve();
    return new Promise(resolve => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const image = new Image();
      image.crossOrigin = "anonymous";
      const timeout = setTimeout(resolve, 4000); // safety net: never hang the download
      image.onload = () => {
        clearTimeout(timeout);
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
        try { img.src = canvas.toDataURL("image/png"); } catch(e) {}
        resolve();
      };
      image.onerror = () => { clearTimeout(timeout); resolve(); }; // skip if fails
      image.src = origSrcs[i] + "?t=" + Date.now();
    });
  }));

  try {
    await new Promise(r => setTimeout(r, 150));
    const canvas = await html2canvas(printArea, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    canvas.toBlob(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `BookNest_${filenamePrefix}_${dateStr}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  } catch (err) {
    console.error("Download error:", err);
    // Last resort: hide only the image(s) that likely caused the taint (e.g. the
    // BookNest logo), never the user's uploaded photos — those are safe data: URIs
    // and never cause canvas tainting, so they should stay visible in the retry.
    imgs.forEach((img, i) => {
      if (!origSrcs[i].startsWith("data:")) img.style.display = "none";
    });
    try {
      const canvas2 = await html2canvas(printArea, {
        scale: 2, backgroundColor: "#ffffff", logging: false,
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      canvas2.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `BookNest_${filenamePrefix}_${dateStr}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }, "image/png");
    } catch(e2) {
      showNotice("Download failed. Please use the Print button instead.", "Error");
    } finally {
      imgs.forEach(img => img.style.display = "");
    }
  } finally {
    if (toolbar) toolbar.style.display = "";
    imgs.forEach((img, i) => { if (origSrcs[i]) img.src = origSrcs[i]; });
  }
};

// Print only the receipt content using a hidden iframe — never touches the modal view
const printReceiptArea = (printAreaId) => {
  const printArea = document.getElementById(printAreaId);
  if (!printArea) return;

  // Grab all style/link tags from current page
  const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map(el => el.outerHTML).join("");

  const content = printArea.innerHTML;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  ${styles}
  <style>
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: white; }
  </style>
</head>
<body>${content}</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:800px;height:1px;border:none;";
  document.body.appendChild(iframe);

  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };
};



// ── Dashboard ─────────────────────────────────────────────────────────────────
const initDashboard = () => {
  const books = getBooks();
  const sales = getSales().filter(s => !s.voided);
  const receipts = getReceipts();
  const useReceipts = receipts.length > 0;

  const totalRevenue = useReceipts
    ? sum(receipts.filter(r => getReceiptFlags(r).paid && !getReceiptFlags(r).refunded), r => sum(r.items || [], i => Number(i.qty * i.unitPrice) || 0))
    : sum(sales, s => getSaleTotal(s, books));
  const inventoryValue = sum(books, b => b.price * b.stock);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("statTitles",         books.length);
  set("statInStock",        sum(books, b => b.stock));
  set("statTotal",          currency(totalRevenue));
  set("statInventoryValue", currency(inventoryValue));
  // Purchases / Net revenue
  const purchases = getPurchases();
  const totalPurchases = sum(purchases, p => Number(p.amount) || 0);
  const netRevenue = totalRevenue - totalPurchases;
  set("statNetTotal", currency(netRevenue));

  // Recent activity
  const recentBody = document.getElementById("recentSales");
  if (recentBody) {
    recentBody.innerHTML = getSales().slice().reverse().slice(0, 5).map(sale => {
      const book  = books.find(b => b.id === sale.bookId);
      const title = sale.bookTitle || (book ? book.title : "Unknown");
      const voidedBadge = sale.voided ? ' <span class="tag out">Voided</span>' : "";
      return `<tr>
        <td>${formatDate(sale.date)}</td>
        <td>${title}${voidedBadge}</td>
        <td>${sale.quantity}</td>
        <td>${sale.voided ? "—" : currency(getSaleTotal(sale, books))}</td>
      </tr>`;
    }).join("");
  }

  // Summary grid
  const summaryGrid = document.getElementById("summaryGrid");
  if (summaryGrid) {
    const totalOrders    = useReceipts ? receipts.length : sales.length;
    const totalBooksSold = useReceipts
      ? sum(receipts, r => sum(r.items || [], i => Number(i.qty) || 0))
      : sum(sales, s => s.quantity);
    summaryGrid.innerHTML = [
      { label: "Total Revenue",   value: currency(totalRevenue) },
      { label: "Orders",          value: totalOrders },
      { label: "Books Sold",      value: totalBooksSold },
      { label: "Average Order",   value: currency(totalRevenue / Math.max(totalOrders, 1)) },
      { label: "Inventory Value", value: currency(inventoryValue) },
    ].map(item => `
      <div class="summary-card">
        <h4>${item.label}</h4>
        <div class="value">${item.value}</div>
      </div>`).join("");
  }

  // Backup / Restore / EOD
  document.getElementById("backupBtn")?.addEventListener("click", backupData);
  const restoreInput = document.getElementById("restoreInput");
  document.getElementById("restoreBtn")?.addEventListener("click", () => restoreInput?.click());
  document.getElementById("transferHelpBtn")?.addEventListener("click", async () => {
    await showNotice(
      "TRANSFER STEPS:\n\n" +
      "1) On your old computer, click 'Download Full Transfer Backup'.\n" +
      "2) Copy the downloaded JSON file together with your BookNest folder (zip is fine).\n" +
      "3) On your new computer, open BookNest, click 'Restore from Backup', and select that JSON file.\n\n" +
      "This restores books, sales, receipts, purchases, shipment statuses, and shipment issue reviews/photos.",
      "Move BookNest to New Computer"
    );
  });
  restoreInput?.addEventListener("change", e => { if (e.target.files[0]) restoreData(e.target.files[0]); });
  document.getElementById("eodBtn")?.addEventListener("click", () => {
    localStorage.removeItem(".eod_check");
    checkEndOfDay();
  });

  // Purchases UI: record button + recent purchases list
  document.getElementById("recordPurchaseBtn")?.addEventListener("click", () => recordPurchaseFlow());
  const purchaseRows = document.getElementById("purchaseRows");
  if (purchaseRows) {
    purchaseRows.innerHTML = purchases.slice().reverse().slice(0, 10).map(p => `
      <tr>
        <td>${formatDate(p.date)}</td>
        <td>${p.box ? `📦 <strong>${p.box}</strong>` : "—"}</td>
        <td>
          ${p.image
            ? `<img src="${p.image}" class="purchase-photo-thumb" data-action="view-purchase-photo" data-id="${p.id}" title="Click to view photo" />`
            : `<span class="muted" style="font-size:11px">No photo</span>`}
          <button class="btn ghost action-btn" data-action="upload-purchase-photo" data-id="${p.id}" style="display:block;margin-top:4px;font-size:11px;padding:3px 8px;min-width:0;">${p.image ? "🔄 Change" : "📷 Add"}</button>
        </td>
        <td>${p.description || "—"}</td>
        <td style="text-align:right">${currency(Number(p.amount) || 0)}</td>
        <td>
          <button class="btn ghost action-btn" data-action="edit-purchase" data-id="${p.id}">✎ Edit</button>
          <button class="btn danger action-btn" data-action="delete-purchase" data-id="${p.id}">Del</button>
        </td>
      </tr>`
    ).join("") || `<tr><td colspan=6 class="muted">No purchases recorded</td></tr>`;
  }
  bindPurchaseActionsOnce();

  renderBoxProfitReport();

  // How much box-purchase money hasn't been earned back yet (boxes still at a loss).
  const boxReportForStats = computeBoxProfitReport();
  const pendingBoxCost = sum(
    boxReportForStats.rows.filter(r => r.cost > 0 && r.profit < 0),
    r => Math.abs(r.profit)
  );
  set("statPendingBoxCost", currency(pendingBoxCost));
};

// ── Box Profit & Loss ──────────────────────────────────────────────────────
// Every book/sale/purchase can be tagged with a "Box" (a batch you bought,
// e.g. "Box 1"). This ties those three things together so you can see,
// per box: what it cost you, how much you've actually earned back from
// books tagged with that box, what's still sitting unsold, and the
// resulting profit or loss.
const computeBoxProfitReport = () => {
  const books      = getBooks();
  const purchases  = getPurchases();
  const receipts   = getReceipts();

  const paidReceipts = receipts.filter(r => {
    const flags = getReceiptFlags(r);
    return flags.paid && !flags.refunded;
  });

  const norm = (v) => (v || "").toString().trim();

  const boxNames = new Set();
  books.forEach(b => { if (norm(b.box)) boxNames.add(norm(b.box)); });
  purchases.forEach(p => { if (norm(p.box)) boxNames.add(norm(p.box)); });
  paidReceipts.forEach(r => (r.items || []).forEach(i => { if (norm(i.box)) boxNames.add(norm(i.box)); }));

  const revenueForBox = (box) => sum(
    paidReceipts,
    r => sum((r.items || []).filter(i => norm(i.box) === box), i => (Number(i.qty) || 0) * (Number(i.unitPrice) || 0))
  );
  const costForBox = (box) => sum(purchases.filter(p => norm(p.box) === box), p => Number(p.amount) || 0);
  const unsoldValueForBox = (box) => sum(books.filter(b => norm(b.box) === box), b => (Number(b.price) || 0) * (Number(b.stock) || 0));
  const imageForBox = (box) => (purchases.find(p => norm(p.box) === box && p.image) || {}).image || null;

  const rows = [...boxNames].sort().map(box => {
    const cost        = costForBox(box);
    const revenue     = revenueForBox(box);
    const unsoldValue = unsoldValueForBox(box);
    const image       = imageForBox(box);
    return { box, cost, revenue, unsoldValue, image, profit: revenue - cost };
  });

  // Books/sales/purchases that were never tagged with a box, grouped together
  // so nothing silently disappears from the report.
  const untaggedCost        = sum(purchases.filter(p => !norm(p.box)), p => Number(p.amount) || 0);
  const untaggedRevenue     = sum(paidReceipts, r => sum((r.items || []).filter(i => !norm(i.box)), i => (Number(i.qty) || 0) * (Number(i.unitPrice) || 0)));
  const untaggedUnsoldValue = sum(books.filter(b => !norm(b.box)), b => (Number(b.price) || 0) * (Number(b.stock) || 0));
  const hasUntagged = untaggedCost > 0 || untaggedRevenue > 0 || untaggedUnsoldValue > 0;

  return {
    rows,
    untagged: hasUntagged
      ? { cost: untaggedCost, revenue: untaggedRevenue, unsoldValue: untaggedUnsoldValue, profit: untaggedRevenue - untaggedCost }
      : null,
  };
};

// Horizontal cost-vs-revenue bars for the Box P&L panel. Pure DOM/CSS (no
// chart library) so it stays lightweight and matches the site's own tokens.
const renderBoxProfitChart = (rows, untagged) => {
  const el = document.getElementById("boxProfitChart");
  if (!el) return;

  const entries = [
    ...rows.map(r => ({ label: r.box, untagged: false, ...r })),
    ...(untagged ? [{ label: "Not tagged to a box", untagged: true, ...untagged }] : []),
  ].filter(r => r.cost > 0 || r.revenue > 0);

  if (!entries.length) {
    el.innerHTML = `<div class="box-chart-empty">Once you record a box purchase and tag some sales to it, its cost-vs-revenue bars will show up here.</div>`;
    return;
  }

  const maxVal = Math.max(1, ...entries.map(r => Math.max(r.cost, r.revenue)));
  const pct = (v) => Math.max(v > 0 ? 3 : 0, Math.round((v / maxVal) * 100));

  const barRow = (r) => `
    <div class="box-chart-row${r.untagged ? " is-untagged" : ""}">
      <div class="box-chart-name">
        <span>${r.untagged ? "❔ " : "📦 "}${r.label}</span>
        ${r.cost > 0
          ? (r.profit > 0
              ? `<span class="tag profit">▲ ${currency(r.profit)}</span>`
              : r.profit < 0
                ? `<span class="tag loss">▼ ${currency(Math.abs(r.profit))}</span>`
                : `<span class="tag even">Break-even</span>`)
          : `<span class="tag even">No cost recorded</span>`}
      </div>
      <div class="box-chart-bars">
        <div class="box-chart-track">
          <div class="box-chart-bar cost" style="width:${pct(r.cost)}%">
            <span class="box-chart-bar-label">${r.cost > 0 ? currency(r.cost) : ""}</span>
          </div>
        </div>
        <div class="box-chart-track">
          <div class="box-chart-bar revenue" style="width:${pct(r.revenue)}%">
            <span class="box-chart-bar-label">${r.revenue > 0 ? currency(r.revenue) : ""}</span>
          </div>
        </div>
      </div>
    </div>`;

  el.innerHTML = `
    <div class="box-chart-legend">
      <span><span class="swatch cost"></span>Cost</span>
      <span><span class="swatch revenue"></span>Revenue</span>
    </div>
    <div class="box-chart-rows">${entries.map(barRow).join("")}</div>`;
};

const renderBoxProfitReport = () => {
  const tbody = document.getElementById("boxProfitRows");
  if (!tbody) return;

  const { rows, untagged } = computeBoxProfitReport();
  renderBoxProfitChart(rows, untagged);

  const profitTag = (profit, hasCost) => {
    if (!hasCost) return `<span class="tag even">No cost recorded</span>`;
    if (profit > 0)  return `<span class="tag profit">▲ ${currency(profit)} profit</span>`;
    if (profit < 0)  return `<span class="tag loss">▼ ${currency(Math.abs(profit))} loss</span>`;
    return `<span class="tag even">Break-even</span>`;
  };

  const rowHtml = (label, r, isUntagged = false) => `
    <tr${isUntagged ? ' style="opacity:0.85"' : ""}>
      <td>${isUntagged ? "❔ " : "📦 "}<strong>${label}</strong></td>
      <td>${r.image ? `<img src="${r.image}" class="purchase-photo-thumb" data-action="view-purchase-photo-src" data-src="${r.image}" title="Click to view photo" />` : `<span class="muted" style="font-size:11px">—</span>`}</td>
      <td>${r.cost > 0 ? currency(r.cost) : "—"}</td>
      <td>${currency(r.revenue)}</td>
      <td>${currency(r.unsoldValue)}</td>
      <td>${profitTag(r.profit, r.cost > 0)}</td>
    </tr>`;

  const bodyRows = rows.map(r => rowHtml(r.box, r)).join("");
  const untaggedRow = untagged ? rowHtml("Not tagged to a box", untagged, true) : "";

  tbody.innerHTML = (bodyRows + untaggedRow) ||
    `<tr><td colspan="6" class="muted">No boxes yet — record a box purchase above, then tag books with that box name in Inventory, Bulk Paste, Scan Receipt, or New Sale.</td></tr>`;

  tbody.querySelectorAll('[data-action="view-purchase-photo-src"]').forEach(img => {
    img.addEventListener("click", () => openPhotoLightbox(img.dataset.src, "Box Photo"));
  });
};

const recordPurchaseFlow = async () => {
  const existingBoxes = [...new Set([
    ...getBooks().map(b => (b.box || "").trim()),
    ...getPurchases().map(p => (p.box || "").trim()),
  ].filter(Boolean))].sort();
  const boxListEl = document.getElementById("purchaseBoxSuggestions");
  if (boxListEl) boxListEl.innerHTML = existingBoxes.map(b => `<option value="${b}"></option>`).join("");

  const boxRes = await openActionDialog({
    title: "Record a Box You Bought",
    message: "Name this box (e.g. \"Box 1\") so its cost is tracked and subtracted from your revenue. Leave blank for a general purchase not tied to a box.",
    confirmText: "Next",
    cancelText: "Cancel",
    input: { label: "Box Name", type: "text", value: "", placeholder: "e.g. Box 1", list: "purchaseBoxSuggestions" }
  });
  if (!boxRes.confirmed) return;
  const box = (boxRes.value || "").trim();

  const amountRes = await openActionDialog({
    title: "Record Purchase",
    message: box
      ? `How much did "${box}" cost you (₱)? This gets subtracted from your total revenue.`
      : "Enter purchase amount (₱):",
    confirmText: "Next",
    cancelText: "Cancel",
    input: { label: "Amount", type: "number", value: "", placeholder: "0.00", min: 0 }
  });
  if (!amountRes.confirmed) return;
  const amount = parseFloat(amountRes.value);
  if (isNaN(amount) || amount <= 0) {
    showNotice("Please enter a valid amount greater than 0.", "Invalid Amount");
    return;
  }

  const descRes = await openActionDialog({
    title: "Description",
    message: "Optional note (e.g. supplier, what's inside):",
    confirmText: "Save",
    cancelText: "Skip",
    input: { label: "Description", type: "text", value: "", placeholder: box ? `e.g. Bought from Supplier X` : "e.g. Bought stock from Supplier X" }
  });

  const description = descRes.confirmed ? (descRes.value || "") : "";
  const purchases = getPurchases();
  purchases.push({ id: createId("p"), date: new Date().toISOString(), amount, description, box });
  savePurchases(purchases);
  showNotice(box ? `"${box}" recorded — ${currency(amount)} will be subtracted from your total revenue.` : "Purchase recorded.", "Saved");
  initDashboard();
};

// ── Edit Box Purchase (price/description) ──────────────────────────────────
let purchaseEditDialog = null;
const ensurePurchaseEditDialog = () => {
  if (purchaseEditDialog) return purchaseEditDialog;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">📦</div>
      <h3 class="action-modal__title">Edit Box Purchase</h3>
    </div>
    <div class="action-modal__body">
      <div class="action-modal__message"></div>
      <label class="action-modal__input">
        <span class="action-modal__label">Cost (₱)</span>
        <input class="action-modal__pe-amount" type="number" min="0" step="0.01" />
      </label>
      <label class="action-modal__input">
        <span class="action-modal__label">Description</span>
        <input class="action-modal__pe-desc" type="text" />
      </label>
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-ghost" data-action="cancel" type="button">Cancel</button>
      <button class="btn modal-primary" data-action="confirm" type="button">Save</button>
    </div>
  `;
  document.body.appendChild(dialog);
  purchaseEditDialog = dialog;
  return dialog;
};

const openPurchaseEditDialog = ({ box, amount, description }) => new Promise(resolve => {
  const dialog     = ensurePurchaseEditDialog();
  const msgEl      = dialog.querySelector(".action-modal__message");
  const amountEl   = dialog.querySelector(".action-modal__pe-amount");
  const descEl     = dialog.querySelector(".action-modal__pe-desc");
  const cancelBtn  = dialog.querySelector("[data-action='cancel']");
  const confirmBtn = dialog.querySelector("[data-action='confirm']");

  msgEl.textContent = `Update the cost and description for "${box || "this purchase"}". The new cost is what gets matched against this box's revenue in Box Profit & Loss.`;
  amountEl.value = amount ?? "";
  descEl.value   = description ?? "";

  const cleanup = (result) => {
    dialog.close();
    cancelBtn.onclick = null;
    confirmBtn.onclick = null;
    resolve(result);
  };

  cancelBtn.onclick = () => cleanup({ confirmed: false });
  confirmBtn.onclick = () => {
    const newAmount = parseFloat(amountEl.value);
    if (isNaN(newAmount) || newAmount < 0) {
      amountEl.focus();
      return;
    }
    cleanup({ confirmed: true, amount: newAmount, description: descEl.value.trim() });
  };

  dialog.showModal();
  setTimeout(() => amountEl.focus(), 50);
});

// ── Box Photo Lightbox ───────────────────────────────────────────────────────
let photoLightbox = null;
const ensurePhotoLightbox = () => {
  if (photoLightbox) return photoLightbox;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal";
  dialog.style.width = "min(420px, 92vw)";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">📦</div>
      <h3 class="action-modal__title">Box Photo</h3>
    </div>
    <div class="action-modal__body">
      <img class="photo-lightbox__img" style="width:100%;border-radius:12px;display:block;" />
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-primary" data-action="close" type="button">Close</button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.querySelector("[data-action='close']").addEventListener("click", () => dialog.close());
  photoLightbox = dialog;
  return dialog;
};
const openPhotoLightbox = (src, title) => {
  const dialog = ensurePhotoLightbox();
  dialog.querySelector(".action-modal__title").textContent = title || "Box Photo";
  dialog.querySelector(".photo-lightbox__img").src = src;
  dialog.showModal();
};

// ── Purchases panel actions (photo upload, edit, delete) ────────────────────
// Bound once (via a module-level flag) since initDashboard can re-run many
// times as data changes, and we don't want duplicate click handlers stacking.
let purchaseActionsBound = false;
const bindPurchaseActionsOnce = () => {
  if (purchaseActionsBound) return;
  purchaseActionsBound = true;

  let photoFileInput = document.getElementById("purchasePhotoFileInput");
  if (!photoFileInput) {
    photoFileInput = document.createElement("input");
    photoFileInput.type = "file";
    photoFileInput.accept = "image/*";
    photoFileInput.id = "purchasePhotoFileInput";
    photoFileInput.style.display = "none";
    document.body.appendChild(photoFileInput);
  }
  let pendingPhotoPurchaseId = null;

  photoFileInput.addEventListener("change", () => {
    const file = photoFileInput.files && photoFileInput.files[0];
    if (!file || !pendingPhotoPurchaseId) return;
    const purchaseId = pendingPhotoPurchaseId;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let width = img.width, height = img.height;
        if (width > height && width > maxDim) { height = height * (maxDim / width); width = maxDim; }
        else if (height > maxDim) { width = width * (maxDim / height); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const purchases = getPurchases();
        const target = purchases.find(p => p.id === purchaseId);
        if (target) {
          target.image = dataUrl;
          savePurchases(purchases);
          initDashboard();
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    pendingPhotoPurchaseId = null;
    photoFileInput.value = "";
  });

  const purchasesTable = document.getElementById("purchaseRows")?.closest("table");
  purchasesTable?.addEventListener("click", async (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!id) return;

    if (action === "upload-purchase-photo") {
      pendingPhotoPurchaseId = id;
      photoFileInput.click();
    }

    if (action === "view-purchase-photo") {
      const purchase = getPurchases().find(p => p.id === id);
      if (purchase?.image) openPhotoLightbox(purchase.image, purchase.box ? `📦 ${purchase.box}` : "Box Photo");
    }

    if (action === "edit-purchase") {
      const purchases = getPurchases();
      const purchase = purchases.find(p => p.id === id);
      if (!purchase) return;
      const res = await openPurchaseEditDialog({ box: purchase.box, amount: purchase.amount, description: purchase.description });
      if (!res.confirmed) return;
      purchase.amount = res.amount;
      purchase.description = res.description;
      savePurchases(purchases);
      showNotice(`Updated "${purchase.box || "purchase"}" — cost is now ${currency(res.amount)}.`, "Saved");
      initDashboard();
    }

    if (action === "delete-purchase") {
      const { confirmed } = await openActionDialog({
        title: "Delete this box purchase?",
        message: "This removes the recorded cost from Box Profit & Loss. Books already tagged with this box stay as they are.",
        confirmText: "Delete",
        cancelText: "Cancel",
        iconText: "!",
      });
      if (!confirmed) return;
      savePurchases(getPurchases().filter(p => p.id !== id));
      initDashboard();
    }
  });
};

// ── TikTok Shop Price Calculator ────────────────────────────────────────────
// Works backward from cost of goods (optionally split from a box purchase),
// TikTok Shop's cut (referral commission, payment processing, affiliate/
// creator commission), and any packaging/shipping you cover, to a selling
// price that still leaves the profit you're aiming for.
let priceCalcDialog = null;

const ensurePriceCalcDialog = () => {
  if (priceCalcDialog) return priceCalcDialog;
  const dialog = document.createElement("dialog");
  dialog.className = "action-modal pc-modal";
  dialog.innerHTML = `
    <div class="action-modal__header">
      <div class="action-modal__icon">₱</div>
      <h3 class="action-modal__title">TikTok Shop Price Calculator</h3>
    </div>
    <div class="action-modal__body pc-body">
      <p class="muted" style="margin:-0.4rem 0 0">Figure out what to charge so TikTok's cut and this book's cost still leave you the profit you want.</p>

      <div class="pc-section">
        <div class="pc-section-title">1. Cost of goods</div>
        <div class="pc-grid">
          <label>Cost per book (₱)
            <input type="number" id="pcCogs" min="0" step="0.01" placeholder="0.00" />
          </label>
          <label>Box this book is from (optional)
            <select id="pcBox"><option value="">— pick a box —</option></select>
          </label>
          <label>Books from that box
            <input type="number" id="pcBoxCount" min="1" step="1" placeholder="e.g. 20" />
          </label>
          <label>Packaging / materials (₱)
            <input type="number" id="pcPackaging" min="0" step="0.01" value="0" />
          </label>
        </div>
        <div class="muted pc-hint" id="pcBoxHint">Pick a box to auto-split its purchase cost across the books that came from it.</div>
      </div>

      <div class="pc-section">
        <div class="pc-section-title">2. TikTok Shop fees</div>
        <div class="pc-grid">
          <label>Referral / commission (%)
            <input type="number" id="pcCommission" min="0" step="0.01" value="5" />
          </label>
          <label>Payment processing (%)
            <input type="number" id="pcTxnPct" min="0" step="0.01" value="2.24" />
          </label>
          <label>Affiliate / creator commission (%)
            <input type="number" id="pcAffiliate" min="0" step="0.01" value="0" />
          </label>
          <label>Shipping you subsidize (₱)
            <input type="number" id="pcShipping" min="0" step="0.01" value="0" />
          </label>
        </div>
        <div class="muted pc-hint">Starting points only — Philippines rates commonly run ~5–9% commission plus ~2.24% payment processing, but they vary by category and change over time. Check your TikTok Shop Seller Center for your exact rate and edit these fields.</div>
      </div>

      <div class="pc-section">
        <div class="pc-section-title">3. Target profit</div>
        <div class="pc-grid">
          <label>Aim for
            <select id="pcTargetMode">
              <option value="amount">A fixed ₱ profit per book</option>
              <option value="margin">A % margin of the selling price</option>
            </select>
          </label>
          <label id="pcTargetAmountWrap">Target profit (₱)
            <input type="number" id="pcTargetAmount" min="0" step="0.01" value="50" />
          </label>
          <label id="pcTargetMarginWrap" style="display:none">Target margin (%)
            <input type="number" id="pcTargetMargin" min="0" max="95" step="0.5" value="30" />
          </label>
        </div>
      </div>

      <div class="pc-result" id="pcResult"></div>
    </div>
    <div class="action-modal__actions">
      <button class="btn modal-ghost" data-action="cancel" type="button">Close</button>
      <button class="btn modal-primary" data-action="use" type="button">Use This Price</button>
    </div>
  `;
  document.body.appendChild(dialog);
  priceCalcDialog = dialog;
  return dialog;
};

// Pure calculation given the current field values inside a dialog element.
const computePriceCalc = (dialog) => {
  const val = (id) => Number(dialog.querySelector(`#${id}`).value) || 0;
  const cogs        = val("pcCogs");
  const packaging    = val("pcPackaging");
  const shipping     = val("pcShipping");
  const commissionPct = val("pcCommission");
  const txnPct       = val("pcTxnPct");
  const affiliatePct = val("pcAffiliate");
  const targetMode   = dialog.querySelector("#pcTargetMode").value;
  const fixedCosts   = cogs + packaging + shipping;
  const feeRatio     = (commissionPct + txnPct + affiliatePct) / 100;

  let price, targetProfit;

  if (targetMode === "margin") {
    const marginRatio = val("pcTargetMargin") / 100;
    if (feeRatio + marginRatio >= 1) return { invalid: true };
    price = fixedCosts / (1 - feeRatio - marginRatio);
  } else {
    targetProfit = val("pcTargetAmount");
    if (feeRatio >= 1) return { invalid: true };
    price = (fixedCosts + targetProfit) / (1 - feeRatio);
  }

  const commissionAmt = price * commissionPct / 100;
  const txnAmt         = price * txnPct / 100;
  const affiliateAmt   = price * affiliatePct / 100;
  const netReceipts     = price - commissionAmt - txnAmt - affiliateAmt;
  const finalProfit     = netReceipts - fixedCosts;
  const marginPct       = price > 0 ? (finalProfit / price) * 100 : 0;

  return { invalid: false, price, commissionAmt, txnAmt, affiliateAmt, netReceipts, fixedCosts, finalProfit, marginPct };
};

const renderPriceCalcResult = (dialog) => {
  const resultEl = dialog.querySelector("#pcResult");
  const r = computePriceCalc(dialog);
  if (r.invalid) {
    resultEl.innerHTML = `<div class="pc-warning">Your fee % and target margin add up to 100% or more of the price — no price can cover that. Lower the commission / affiliate % or the target margin.</div>`;
    return;
  }
  const psychological = Math.max(0, Math.ceil(r.price) - 0.01);
  resultEl.innerHTML = `
    <div class="pc-price-headline">Suggested price: <strong>${currency(r.price)}</strong> <span class="muted" style="font-size:0.85rem">(rounded: ${currency(psychological)})</span></div>
    <table class="pc-table">
      <tr><td>Selling price</td><td>${currency(r.price)}</td></tr>
      <tr><td>− TikTok commission</td><td>-${currency(r.commissionAmt)}</td></tr>
      <tr><td>− Payment processing</td><td>-${currency(r.txnAmt)}</td></tr>
      ${r.affiliateAmt > 0 ? `<tr><td>− Affiliate/creator commission</td><td>-${currency(r.affiliateAmt)}</td></tr>` : ""}
      <tr class="pc-subtotal"><td>= Net receipts from TikTok</td><td>${currency(r.netReceipts)}</td></tr>
      <tr><td>− Cost of goods, packaging &amp; shipping</td><td>-${currency(r.fixedCosts)}</td></tr>
      <tr class="pc-profit"><td>= Your profit</td><td>${currency(r.finalProfit)} (${r.marginPct.toFixed(1)}% margin)</td></tr>
    </table>
  `;
};

const openPriceCalcDialog = ({ initialCogs = null, initialBox = "" } = {}) => new Promise(resolve => {
  const dialog = ensurePriceCalcDialog();
  const purchases = getPurchases();
  const books = getBooks();
  const norm = (s) => (s || "").trim();
  const boxNames = [...new Set(purchases.map(p => norm(p.box)).filter(Boolean))].sort();

  const boxSelect = dialog.querySelector("#pcBox");
  boxSelect.innerHTML = `<option value="">— pick a box —</option>` +
    boxNames.map(b => `<option value="${b}">${b}</option>`).join("");
  boxSelect.value = boxNames.includes(norm(initialBox)) ? norm(initialBox) : "";

  const cogsInput = dialog.querySelector("#pcCogs");
  const boxCountInput = dialog.querySelector("#pcBoxCount");
  const boxHint = dialog.querySelector("#pcBoxHint");
  boxCountInput.value = "";

  const applyBoxEstimate = () => {
    const box = boxSelect.value;
    if (!box) {
      boxHint.textContent = "Pick a box to auto-split its purchase cost across the books that came from it.";
      render();
      return;
    }
    const boxCost = sum(purchases.filter(p => norm(p.box) === box), p => Number(p.amount) || 0);
    const taggedCount = books.filter(b => norm(b.box) === box).length;
    if (!boxCountInput.value && taggedCount) boxCountInput.value = taggedCount;
    const count = Number(boxCountInput.value) || 0;
    if (boxCost > 0 && count > 0) {
      const per = boxCost / count;
      cogsInput.value = per.toFixed(2);
      boxHint.textContent = `"${box}" cost ${currency(boxCost)} for ${count} book${count === 1 ? "" : "s"} → ${currency(per)} per book.`;
    } else if (boxCost > 0) {
      boxHint.textContent = `"${box}" cost ${currency(boxCost)} so far. Enter how many books came from it to split the cost.`;
    } else {
      boxHint.textContent = `No purchase cost recorded yet for "${box}" — enter cost per book manually.`;
    }
    render();
  };

  const targetModeSel = dialog.querySelector("#pcTargetMode");
  const amountWrap = dialog.querySelector("#pcTargetAmountWrap");
  const marginWrap = dialog.querySelector("#pcTargetMarginWrap");
  const applyTargetMode = () => {
    const isAmount = targetModeSel.value === "amount";
    amountWrap.style.display = isAmount ? "" : "none";
    marginWrap.style.display = isAmount ? "none" : "";
    render();
  };

  const render = () => renderPriceCalcResult(dialog);

  boxSelect.onchange = applyBoxEstimate;
  boxCountInput.oninput = applyBoxEstimate;
  targetModeSel.onchange = applyTargetMode;

  dialog.querySelectorAll(".pc-body input, .pc-body select").forEach(el => {
    if ([boxSelect, boxCountInput, targetModeSel].includes(el)) return;
    el.oninput = render;
    el.onchange = render;
  });

  if (initialCogs != null && initialCogs !== "") cogsInput.value = initialCogs;
  if (boxSelect.value) applyBoxEstimate(); else render();

  const cancelBtn = dialog.querySelector("[data-action='cancel']");
  const useBtn = dialog.querySelector("[data-action='use']");
  const cleanup = (result) => {
    dialog.close();
    cancelBtn.onclick = null;
    useBtn.onclick = null;
    resolve(result);
  };
  cancelBtn.onclick = () => cleanup({ used: false });
  useBtn.onclick = () => {
    const r = computePriceCalc(dialog);
    cleanup({ used: true, price: r.invalid ? null : r.price, box: boxSelect.value });
  };

  dialog.showModal();
});

// ── Inventory ─────────────────────────────────────────────────────────────────
const initInventory = () => {
  const rows            = document.getElementById("inventoryRows");
  
  // CRITICAL: If rows element doesn't exist, we're not on the inventory page
  if (!rows) {
    console.warn("Inventory: inventoryRows element not found");
    return;
  }

  const searchInput     = document.getElementById("searchInput");
  const genreFilter     = document.getElementById("genreFilter");
  const boxFilter       = document.getElementById("boxFilter");
  const stockFilter     = document.getElementById("stockFilter");
  const addTitle        = document.getElementById("addTitle");
  const addAuthor       = document.getElementById("addAuthor");
  const addGenre        = document.getElementById("addGenre");
  const genreAiHint     = document.getElementById("genreAiHint");
  const addPrice        = document.getElementById("addPrice");
  const addStock        = document.getElementById("addStock");
  const addType         = document.getElementById("addType");
  const addBox          = document.getElementById("addBox");
  const addBookBtn      = document.getElementById("addBookBtn");
  const priceCalcBtn    = document.getElementById("priceCalcBtn");
  const bulkInput       = document.getElementById("bulkInput");
  const bulkAddBtn      = document.getElementById("bulkAddBtn");
  const deleteAllBtn    = document.getElementById("deleteAllBooksBtn");

  console.log("Inventory init - rows:", !!rows, "addBookBtn:", !!addBookBtn, "bulkAddBtn:", !!bulkAddBtn);

  let genreManuallyEdited = false;
  let lastSuggestedGenre = "";

  const updateGenreSuggestion = () => {
    if (!addGenre) return;
    const title = addTitle?.value || "";
    const author = addAuthor?.value || "";
    const suggestion = suggestGenreFromBook(title, author);
    lastSuggestedGenre = suggestion;
    if (genreAiHint) {
      genreAiHint.textContent = `Auto genre: ${suggestion}${genreManuallyEdited ? " (editable)" : ""}`;
    }
    if (!genreManuallyEdited || !addGenre.value || addGenre.value === "General") {
      addGenre.value = suggestion;
    }
  };

  [addTitle, addAuthor].forEach(el => {
    el?.addEventListener("input", updateGenreSuggestion);
    el?.addEventListener("blur", updateGenreSuggestion);
  });
  addGenre?.addEventListener("change", () => {
    genreManuallyEdited = true;
    if (genreAiHint) {
      genreAiHint.textContent = `Auto genre: ${lastSuggestedGenre} (manual override)`;
    }
  });

  const refresh = () => {
   try {
    const books     = getBooks();
    let normalized  = false;
    books.forEach(b => {
      if (!b.type) {
        b.type = "Paperback";
        normalized = true;
      }
    });
    if (normalized) saveBooks(books);
    console.log("[BookNest] Inventory refresh — books in storage:", books.length);
    const search    = searchInput?.value?.toLowerCase() ?? "";
    const genre     = genreFilter?.value ?? "";
    const box       = boxFilter?.value ?? "";
    const stock     = stockFilter?.value ?? "";

    const filtered = books.filter(book => {
      const matchesSearch    = book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
      const matchesGenre     = !genre || book.genre === genre;
      const matchesBox       = !box || (book.box || "") === box;
      const matchesStock     =
        !stock ||
        (stock === "low"      && book.stock > 0 && book.stock < 5) ||
        (stock === "out"      && book.stock === 0) ||
        (stock === "reserved" && Array.isArray(book.layawayHolds) && book.layawayHolds.length > 0);
      return matchesSearch && matchesGenre && matchesBox && matchesStock;
    });

    if (books.length > 0 && filtered.length === 0) {
      rows.innerHTML = `<tr><td colspan="10" class="muted">No books match your current search/filters. You have ${books.length} book(s) in storage — try clearing the search box and filters above.</td></tr>`;
      return;
    }
    if (books.length === 0) {
      rows.innerHTML = `<tr><td colspan="10" class="muted">No books in inventory yet. Add one above, or use Bulk Paste.</td></tr>`;
      return;
    }

    rows.innerHTML = filtered.map(book => {
      const holds = Array.isArray(book.layawayHolds) ? book.layawayHolds : [];
      const availableForLayaway = getAvailableLayawayStock(book);
      const reservedBadge = holds.length
        ? holds.map(h => `
            <span class="tag reserved" style="display:inline-flex;align-items:center;gap:5px;margin:0 4px 4px 0;">
              🗓️ Layaway${h.name ? ` — ${h.name}` : ""}
              <button type="button" data-action="cancel-layaway-hold" data-id="${book.id}" data-receipt="${h.receiptId || ""}" title="Cancel this layaway hold" style="border:none;background:transparent;color:inherit;font-weight:800;cursor:pointer;line-height:1;padding:0;font-size:0.9em;">✕</button>
            </span>`).join("")
        : "";
      const stockBadge = book.stock === 0
        ? `<span class="tag out">${book.stock}</span>`
        : book.stock < 5 ? `<span class="tag low">${book.stock}</span>`
        : book.stock;
      const genreOpts     = ["Fiction","Non-Fiction","Fantasy","Mystery","Romance","Thriller","Horror","Self-Help","Biography","History","Science","Technology","Poetry","Drama","Adventure","Dystopian","Science Fiction","Children's","Young Adult","Other"];
      const typeOpts      = ["Paperback","Hardbound","MMPB","Sprayed","Leatherbound","Slipcase","Special Edition","Box Set","Signed","Other"];
      const currentType   = book.type || "Paperback";
      const genreClass    = `genre-${(book.genre || "other").toLowerCase().replace(/\s+/g, "").replace(/['-]/g, "")}`;
      return `<tr class="${genreClass}">
        <td contenteditable="true" data-field="title"  data-id="${book.id}">${book.title}</td>
        <td contenteditable="true" data-field="variant" data-id="${book.id}" title="Use this to distinguish copies of the same title">${book.variant || ""}</td>
        <td contenteditable="true" data-field="author" data-id="${book.id}">${book.author}</td>
        <td>
          <select class="inv-select" data-field="genre" data-id="${book.id}">
            ${genreOpts.map(g => `<option value="${g}"${book.genre === g ? " selected" : ""}>${g}</option>`).join("")}
          </select>
        </td>
        <td contenteditable="true" data-field="price"  data-id="${book.id}">${book.price}</td>
        <td contenteditable="true" data-field="stock"  data-id="${book.id}">${book.stock}</td>
        <td contenteditable="true" data-field="box" data-id="${book.id}" title="Which box/batch this book came from">${book.box || ""}</td>
        <td>
          <select class="inv-select" data-field="type" data-id="${book.id}">
            ${typeOpts.map(t => `<option value="${t}"${currentType === t ? " selected" : ""}>${t}</option>`).join("")}
          </select>
        </td>
        </td>
        <td>
          ${reservedBadge}
          <div class="action-group">
            ${book.images && book.images.length
              ? `<img src="${book.images[0]}" class="book-photo-thumb" data-action="view-book-photo" data-id="${book.id}" title="Click to view cover photo" />`
              : ""}
            <button class="btn ghost action-btn inv-action-btn" data-action="manage-book-photos" data-id="${book.id}" style="font-size:11px;padding:3px 8px;min-width:0;" title="Add, remove, or reorder this book's photos">🖼 Photos${book.images && book.images.length ? ` (${book.images.length})` : ""}</button>
            <button class="btn ghost action-btn inv-action-btn" data-action="edit-book-description" data-id="${book.id}" style="font-size:11px;padding:3px 8px;min-width:0;" title="${book.description ? "Edit the description buyers see" : "Add a description — condition, edition, notes, etc."}">${book.description ? "📝 Desc ✓" : "📝 Add Desc"}</button>
            <button class="btn primary action-btn inv-action-btn sold" data-action="sold"    data-id="${book.id}">Sold</button>
            <button class="btn ghost action-btn inv-action-btn reserve${holds.length ? " is-reserved" : ""}" data-action="layaway" data-id="${book.id}"${availableForLayaway <= 0 ? " disabled title=\"Every copy of this book is already on layaway — cancel a hold above to free one up\"" : ""}>${availableForLayaway > 0 ? "🗓️ Layaway" : "Fully Reserved"}</button>
            <button class="btn ghost action-btn inv-action-btn delete" data-action="delete"  data-id="${book.id}">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join("");

    const fixedGenres = ["Fiction","Non-Fiction","Fantasy","Mystery","Romance","Thriller","Horror","Self-Help","Biography","History","Science","Technology","Poetry","Drama","Adventure","Dystopian","Science Fiction","Children's","Young Adult","Other"];
    if (genreFilter) {
      genreFilter.innerHTML = `<option value="">All genres</option>${fixedGenres.map(g => `<option value="${g}"${g === genre ? " selected" : ""}>${g}</option>`).join("")}`;
    }
    const uniqueBoxes = [...new Set(books.map(b => (b.box || "").trim()).filter(Boolean))].sort();
    const boxSuggestions = document.getElementById("boxSuggestions");
    if (boxSuggestions) {
      boxSuggestions.innerHTML = uniqueBoxes.map(b => `<option value="${b}"></option>`).join("");
    }
    if (boxFilter) {
      boxFilter.innerHTML = `<option value="">All boxes</option>${uniqueBoxes.map(b => `<option value="${b}"${b === box ? " selected" : ""}>${b}</option>`).join("")}`;
    }
   } catch (err) {
    console.error("[BookNest] Inventory refresh failed:", err);
    rows.innerHTML = `<tr><td colspan="9" style="color:#b91c1c">⚠ Error loading inventory: ${String(err.message || err)}. Press F12 to open the console for details, or share a screenshot of the console with support.</td></tr>`;
   }
  };

  const normalizeCondition = (c) => {
    if (!c) return "Pre Loved";
    const s = String(c).toLowerCase().replace(/[-_\s]+/g,"");
    if (s === "new") return "New";
    if (s === "preloved" || s === "used" || s === "good") return "Pre Loved";
    if (s === "remaindered" || s === "remainder") return "Remaindered";
    return "Pre Loved";
  };

  const normalizeType = (t) => {
    if (!t) return "Paperback";
    const valid = ["Paperback","Hardbound","MMPB","Sprayed","Leatherbound","Slipcase","Special Edition","Box Set","Signed","Other"];
    const match = valid.find(v => v.toLowerCase() === String(t).toLowerCase().trim());
    return match || "Paperback";
  };

    const GENRE_RULES = [
      { genre: "Fantasy", keywords: ["wizard", "magic", "dragon", "kingdom", "spell", "sorcer", "elf", "hobbit", "harry potter", "epic fantasy"] },
      { genre: "Science Fiction", keywords: ["space", "alien", "robot", "planet", "galaxy", "future", "sci-fi", "scifi", "dystopia", "time travel"] },
      { genre: "Dystopian", keywords: ["1984", "brave new world", "dystopian", "totalitarian", "surveillance", "orwell"] },
      { genre: "Mystery", keywords: ["murder", "detective", "mystery", "investigation", "crime", "suspect", "whodunit", "thriller"] },
      { genre: "Romance", keywords: ["love", "romance", "heart", "wedding", "kiss", "relationship", "valentine"] },
      { genre: "Self-Help", keywords: ["habit", "habits", "mindset", "productivity", "success", "self-help", "motivation", "discipline", "atomic habits"] },
      { genre: "Technology", keywords: ["code", "coding", "programming", "software", "developer", "computer", "javascript", "python", "api", "clean code"] },
      { genre: "Science", keywords: ["science", "physics", "chemistry", "biology", "astronomy", "research", "scientific"] },
      { genre: "Biography", keywords: ["biography", "memoir", "life of", "autobiography", "story of"] },
      { genre: "History", keywords: ["history", "historical", "war", "empire", "ancient", "civilization"] },
      { genre: "Children's", keywords: ["kids", "children", "picture book", "bedtime", "storybook"] },
      { genre: "Non-Fiction", keywords: ["guide", "manual", "learn", "essentials", "nonfiction", "non-fiction", "how to"] },
      { genre: "Horror", keywords: ["ghost", "haunted", "horror", "fear", "scary", "monster", "scream", "nightmare"] },
      { genre: "Adventure", keywords: ["adventure", "quest", "journey", "explore", "escape", "treasure"] },
      { genre: "Classic", keywords: ["classic", "pride and prejudice", "great gatsby", "moby dick", "to kill a mockingbird", "les miserables"] },
    ];

    const suggestGenreFromBook = (title = "", author = "") => {
      const text = `${title} ${author}`.toLowerCase();
      let best = { genre: "General", score: 0 };

      const authorHints = [
        { author: "j.k. rowling", genre: "Fantasy" },
        { author: "george orwell", genre: "Dystopian" },
        { author: "james clear", genre: "Self-Help" },
        { author: "robert c. martin", genre: "Technology" },
        { author: "harper lee", genre: "Classic" },
        { author: "jane austen", genre: "Romance" },
        { author: "f. scott fitzgerald", genre: "Classic" },
        { author: "khaled hosseini", genre: "Drama" },
      ];

      for (const rule of GENRE_RULES) {
        const score = rule.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
        if (score > best.score) best = { genre: rule.genre, score };
      }

      for (const hint of authorHints) {
        if (text.includes(hint.author)) return hint.genre;
      }

      return best.score > 0 ? best.genre : "General";
    };

  updateGenreSuggestion();

  const addBooks = (newBooks) => {
    try {
      console.log("addBooks called with:", newBooks.length, "books");
      const books = getBooks();
      console.log("Current books in storage:", books.length);
      
      newBooks.forEach(book => {
        books.push({
          id:         createId("b"),
          title:      String(book.title || "").trim().toUpperCase(),
          author:     String(book.author || "Unknown").trim().toUpperCase(),
          genre:      String(book.genre || "General").trim(),
          price:      Number(book.price) || 0,
          stock:      Number(book.stock) || 1,
          type:       normalizeType(book.type),
          condition:  normalizeCondition(book.condition),
          box:        String(book.box || "").trim(),
          shopVisible: false,
          layawayHolds: [],
          description: "",
          images: [],
        });
      });
      
      console.log("Total books after add:", books.length);
      saveBooks(books);
      console.log("Books saved to localStorage");
      refresh();
      console.log("Refresh called");
    } catch(error) {
      console.error("ERROR in addBooks:", error);
      alert("Error adding books: " + error.message);
    }
  };

  const parseNumber = (value) => {
    if (typeof value !== "string") return Number(value) || 0;
    return Number(value.replace(/[^0-9.-]+/g, "")) || 0;
  };

  const parseCsvLine = (line) => {
    const result = []; let current = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { if (inQuotes && line[i+1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } continue; }
      if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  priceCalcBtn?.addEventListener("click", async () => {
    const result = await openPriceCalcDialog({
      initialCogs: "",
      initialBox: addBox?.value || "",
    });
    if (result.used && result.price != null && addPrice) {
      addPrice.value = result.price.toFixed(2);
      if (result.box && addBox && !addBox.value) addBox.value = result.box;
      addPrice.focus();
    }
  });

  addBookBtn?.addEventListener("click", () => {
    console.log("Add Book button clicked");
    try {
      if (!addTitle?.value.trim()) {
        console.warn("Title is empty");
        addTitle.style.border = "2px solid red";
        addTitle.placeholder = "Title is required!";
        setTimeout(() => { addTitle.style.border = ""; addTitle.placeholder = "Title"; }, 3000);
        return;
      }
      const genreValue = (addGenre?.value?.trim() || lastSuggestedGenre || suggestGenreFromBook(addTitle.value, addAuthor?.value || "") || "General");
      const bookData = {
        title:     addTitle.value.trim(),
        author:    addAuthor?.value.trim() || "Unknown",
        genre:     genreValue === "" ? "General" : genreValue,
        price:     addPrice?.value || 0,
        stock:     addStock?.value || 1,
        type:      addType?.value || "Paperback",
        condition: "Pre Loved",
        box:       addBox?.value.trim() || "",
      };
      console.log("Adding book:", bookData);
      addBooks([bookData]);
      
      const btn = addBookBtn;
      const orig = btn.textContent;
      btn.textContent = "✓ Added!";
      btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
      setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 2000);
      [addTitle, addAuthor, addPrice, addStock, addBox].forEach(el => { if (el) el.value = ""; });
      if (addGenre) addGenre.value = "";
      genreManuallyEdited = false;
      updateGenreSuggestion();
      if (addType) addType.value = "Paperback";
      alert("✓ Book added successfully!");
    } catch(error) {
      console.error("Error in addBookBtn click:", error);
      alert("Error: " + error.message);
    }
  });

  const TYPE_VALUES = ["Paperback","Hardbound","MMPB","Sprayed","Leatherbound","Slipcase","Special Edition","Box Set","Signed","Other"];
  const TYPE_ALIASES = { pb: "Paperback", hb: "Hardbound", hc: "Hardbound", hardcover: "Hardbound", mmpb: "MMPB" };
  const matchType = (raw) => {
    const s = String(raw || "").toLowerCase().replace(/[-_\s]+/g, "");
    if (!s) return null;
    if (TYPE_ALIASES[s]) return TYPE_ALIASES[s];
    const found = TYPE_VALUES.find(v => v.toLowerCase().replace(/[-_\s]+/g, "") === s);
    return found || null;
  };
  const matchCondition = (raw) => {
    const s = String(raw || "").toLowerCase().replace(/[-_\s]+/g, "");
    if (!s) return null;
    if (s === "new") return "New";
    if (s === "preloved" || s === "used" || s === "good" || s === "secondhand") return "Pre Loved";
    if (s === "remaindered" || s === "remainder") return "Remaindered";
    return null;
  };

  bulkAddBtn?.addEventListener("click", () => {
    console.log("Bulk Add clicked - bulkInput:", bulkInput);
    if (!bulkInput) {
      console.error("bulkInput not found!");
      return;
    }
    const raw = bulkInput.value;
    console.log("Raw input length:", raw.length, "Content:", raw.substring(0, 100));
    if (!raw.trim()) {
      console.warn("No data to parse");
      return;
    }
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    console.log("Lines parsed:", lines.length);
    if (!lines.length) {
      console.warn("No lines after filtering");
      return;
    }

    const isTab  = lines.some(l => l.includes("\t"));
    const isPipe = !isTab && lines.some(l => l.includes("|"));
    console.log("Delimiter:", isTab ? "tab" : isPipe ? "pipe" : "comma");

    const parsed = lines.map((line, i) => {
      const parts = isTab  ? line.split("\t").map(p => p.trim())
                  : isPipe ? line.split("|").map(p => p.trim())
                  : parseCsvLine(line);
      // Skip header row
      if (i === 0 && /^(title|book|name)/i.test(parts[0] || "")) return null;

      let title = (parts[0] || "").trim();
      if (!title) return null;

      let author = (parts[1] || "Unknown").trim();

      // Classify remaining fields by content, not position — this way it
      // doesn't matter whether Type/Condition/Price/Stock come in a
      // different order than expected, or whether Type is present at all.
      let genre = null, type = null, condition = null, box = null;
      const numericCandidates = [];
      for (const field of parts.slice(2)) {
        if (!field) continue;
        // Prefix a field with "Box:" (e.g. "Box: Box 1") to tag which box/batch
        // this book came from — keeps it unambiguous versus Genre free-text.
        const boxMatch = /^box\s*[:\-]\s*(.+)$/i.exec(field);
        if (boxMatch) { box = boxMatch[1].trim(); continue; }
        const tMatch = matchType(field);
        const cMatch = matchCondition(field);
        if (tMatch !== null && type === null) { type = tMatch; continue; }
        if (cMatch !== null && condition === null) { condition = cMatch; continue; }
        const num = parseNumber(field);
        if (num > 0 && !/[a-zA-Z]/.test(field)) {
          numericCandidates.push({ num, hasDecimal: field.includes(".") });
          continue;
        }
        if (genre === null) genre = field;
      }

      // Prices usually carry a decimal (18.99); quantities usually don't.
      let price = null, stock = null;
      if (numericCandidates.length === 1) {
        price = numericCandidates[0].num;
      } else if (numericCandidates.length >= 2) {
        const decimals = numericCandidates.filter(c => c.hasDecimal);
        if (decimals.length === 1) {
          price = decimals[0].num;
          stock = numericCandidates.find(c => c !== decimals[0]).num;
        } else {
          const sorted = [...numericCandidates].sort((a, b) => b.num - a.num);
          price = sorted[0].num;
          stock = sorted[1].num;
        }
      }

      return {
        title, author,
        genre:  genre || "General",
        price:  price || 0,
        stock:  stock || 1,
        type:      normalizeType(type),
        condition: condition || "Pre Loved",
        box:       box || "",
      };
    }).filter(Boolean);

    console.log("Parsed books:", parsed.length);

    if (parsed.length) {
      addBooks(parsed);
      const btn = bulkAddBtn;
      const orig = btn.textContent;
      btn.textContent = "✓ Added " + parsed.length + " book(s)!";
      btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
      btn.style.color = "#fff";
      setTimeout(() => { btn.textContent = orig; btn.style.background = ""; btn.style.color = ""; }, 2500);
      alert(`✓ Added ${parsed.length} book(s) successfully!`);
    } else {
      const btn = bulkAddBtn;
      btn.textContent = "⚠ Nothing recognized — need at least a Title";
      btn.style.background = "rgba(239,68,68,0.15)";
      btn.style.color = "#b91c1c";
      setTimeout(() => { btn.textContent = "Add Rows"; btn.style.background = ""; btn.style.color = ""; }, 3000);
      alert("⚠ No valid books found. Make sure each line has at least a Title.");
    }
    bulkInput.value = "";
  });
  bulkInput?.addEventListener("paste", () => setTimeout(() => {
    console.log("Paste detected, clicking bulkAddBtn");
    bulkAddBtn?.click();
  }, 200));

  // RETRY MECHANISM - ensure buttons are bound even if there's a timing issue
  if (!addBookBtn || !bulkAddBtn) {
    console.warn("Inventory buttons not found - will retry in 500ms");
    setTimeout(() => {
      const retryAddBtn = document.getElementById("addBookBtn");
      const retryBulkBtn = document.getElementById("bulkAddBtn");
      const retryBulkInput = document.getElementById("bulkInput");
      if (retryAddBtn && !retryAddBtn._inventoryInitialized) {
        retryAddBtn.addEventListener("click", () => {
          const title = document.getElementById("addTitle");
          if (!title?.value.trim()) {
            title.style.border = "2px solid red";
            title.placeholder = "Title is required!";
            setTimeout(() => { title.style.border = ""; title.placeholder = "Title"; }, 3000);
            return;
          }
          const titleText = document.getElementById("addTitle")?.value || "";
          const authorText = document.getElementById("addAuthor")?.value || "";
          const genreVal = document.getElementById("addGenre")?.value?.trim() || suggestGenreFromBook(titleText, authorText) || "General";
          addBooks([{
            title:     title.value.trim(),
            author:    document.getElementById("addAuthor")?.value.trim() || "Unknown",
            genre:     genreVal === "" ? "General" : genreVal,
            price:     document.getElementById("addPrice")?.value || 0,
            stock:     document.getElementById("addStock")?.value || 1,
            type:      document.getElementById("addType")?.value || "Paperback",
            condition: "Pre Loved",
            box:       document.getElementById("addBox")?.value.trim() || "",
          }]);
          const btn = retryAddBtn;
          const orig = btn.textContent;
          btn.textContent = "✓ Added!";
          btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
          setTimeout(() => { btn.textContent = orig; btn.style.background = ""; }, 2000);
          document.getElementById("addTitle").value = "";
          document.getElementById("addAuthor").value = "";
          document.getElementById("addGenre").value = "";
          genreManuallyEdited = false;
          updateGenreSuggestion();
          document.getElementById("addPrice").value = "";
          document.getElementById("addStock").value = "";
          document.getElementById("addType").value = "Paperback";
          if (document.getElementById("addBox")) document.getElementById("addBox").value = "";
        });
        retryAddBtn._inventoryInitialized = true;
      }
      if (retryBulkBtn && !retryBulkBtn._inventoryInitialized) {
        retryBulkBtn.addEventListener("click", () => {
          console.log("Bulk button retry click");
          const bulkText = document.getElementById("bulkInput")?.value;
          if (!bulkText?.trim()) {
            alert("Please paste data first!");
            return;
          }
          const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
          if (!lines.length) {
            alert("No data found.");
            return;
          }

          const isTab = lines.some(l => l.includes("\t"));

          const parsed = lines.map((line, i) => {
            const parts = isTab ? line.split("\t").map(p => p.trim()) : parseCsvLine(line);
            if (i === 0 && /^(title|book|name)/i.test(parts[0] || "")) return null;
            let title = (parts[0] || "").trim();
            if (!title) return null;
            let author    = (parts[1] || "Unknown").trim();
            let genre     = "General";
            let price     = 0;
            let stock     = 1;
            let type      = "Paperback";
            let condition = "Pre Loved";
            const n = parts.length;
            if (n === 2) {
            } else if (n === 3) {
              const thirdNum = parseNumber(parts[2]);
              if (thirdNum > 0) { price = thirdNum; }
              else { genre = parts[2] || "General"; }
            } else if (n === 4) {
              const thirdNum = parseNumber(parts[2]);
              if (thirdNum > 0) { price = thirdNum; stock = parseNumber(parts[3]) || 1; }
              else { genre = parts[2] || "General"; price = parseNumber(parts[3]); }
            } else if (n >= 5) {
              genre     = parts[2] || "General";
              price     = parseNumber(parts[3]);
              stock     = parseNumber(parts[4]) || 1;
              if (parts[5]) type      = parts[5];
              if (parts[6]) condition = parts[6];
            }
            return { title, author, genre, price, stock,
              type: normalizeType(type), condition: normalizeCondition(condition) };
          }).filter(Boolean);

          if (parsed.length) {
            addBooks(parsed);
            const btn = retryBulkBtn;
            const orig = btn.textContent;
            btn.textContent = "✓ Added " + parsed.length + " book(s)!";
            btn.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
            btn.style.color = "#fff";
            setTimeout(() => { btn.textContent = orig; btn.style.background = ""; btn.style.color = ""; }, 2500);
            alert(`✓ Added ${parsed.length} book(s) successfully!`);
          } else {
            alert("⚠ No valid books found. Each line needs at least a Title.");
            const btn = retryBulkBtn;
            btn.textContent = "⚠ Nothing recognized";
            btn.style.background = "rgba(239,68,68,0.15)";
            btn.style.color = "#b91c1c";
            setTimeout(() => { btn.textContent = "Add Rows"; btn.style.background = ""; btn.style.color = ""; }, 3000);
          }
          document.getElementById("bulkInput").value = "";
        });
        retryBulkBtn._inventoryInitialized = true;
      }
    }, 500);
  }

  deleteAllBtn?.addEventListener("click", async () => {
    const { confirmed } = await openActionDialog({
      title: "Delete all books?",
      message: "Delete ALL books and sales? Receipts will be preserved. This cannot be undone.",
      confirmText: "Delete All",
      cancelText: "Cancel",
      iconText: "!",
    });
    if (!confirmed) return;
    saveBooks([]);
    saveSales([]);
    refresh();
    initSales();
    initDashboard();
  });

  // Book photos: a small dialog per book supporting several photos (the
  // first is used as the cover shown in the shop). Built the same way as
  // the box-photo lightbox — a single reusable <dialog>, filled in fresh
  // each time it's opened.
  // Raised from the old cap of 6 — each photo is compressed before storage,
  // but everything still lives in the browser's localStorage (shared with
  // every other book, sale, and receipt), which most browsers cap around
  // 5–10MB total. 20 photos/book is "practically unlimited" for a resale
  // shop while leaving headroom for the rest of the data. If storage ever
  // fills up, setData() below already warns the seller instead of failing
  // silently.
  const MAX_BOOK_PHOTOS = 20;
  let bookPhotosDialog = null;
  const ensureBookPhotosDialog = () => {
    if (bookPhotosDialog) return bookPhotosDialog;
    const dialog = document.createElement("dialog");
    dialog.className = "action-modal";
    dialog.style.width = "min(460px, 92vw)";
    dialog.innerHTML = `
      <div class="action-modal__header">
        <div class="action-modal__icon">🖼</div>
        <h3 class="action-modal__title">Book Photos</h3>
      </div>
      <div class="action-modal__body">
        <div class="bn-book-photos-header" style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;"></div>
        <div class="bn-book-photos-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>
      </div>
      <div class="action-modal__actions">
        <button class="btn modal-primary" data-action="close" type="button">Done</button>
      </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector("[data-action='close']").addEventListener("click", () => dialog.close());
    bookPhotosDialog = dialog;
    return dialog;
  };

  const saveBookPhotos = (bookId, photos) => {
    const books = getBooks();
    const target = books.find(b => b.id === bookId);
    if (!target) return;
    target.images = photos.slice(0, MAX_BOOK_PHOTOS);
    target.image  = target.images[0] || ""; // keep the legacy single-photo field in sync
    saveBooks(books);
  };

  const renderBookPhotosGrid = (bookId, photos) => {
    const dialog = ensureBookPhotosDialog();
    const header = dialog.querySelector(".bn-book-photos-header");
    const grid   = dialog.querySelector(".bn-book-photos-grid");
    header.textContent = `${photos.length}/${MAX_BOOK_PHOTOS} photos — the first one is the cover shown in the shop`;

    // Render exactly the filled photos, plus one "Add" tile if there's room —
    // no blank filler cells. This lets MAX_BOOK_PHOTOS be a high number
    // (many books' worth of photos) without drawing dozens of empty boxes.
    const cells = photos.map((src, i) => `
          <div style="position:relative;aspect-ratio:3/4;border-radius:8px;overflow:hidden;border:1.5px solid #d9cdb2;background:#efe7d8;">
            <img src="${src}" alt="Book photo ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in;" data-lightbox-idx="${i}" />
            ${i === 0 ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(38,33,26,0.7);color:#fff;font-size:10px;text-align:center;padding:2px 0;">Cover</div>` : ""}
            <button type="button" class="bn-book-photo-remove" data-idx="${i}"
              style="position:absolute;top:4px;right:4px;width:22px;height:22px;border:none;border-radius:50%;
              background:rgba(179,38,30,0.92);color:#fff;font-weight:700;font-size:12px;line-height:1;
              cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
          </div>`);
    if (photos.length < MAX_BOOK_PHOTOS) {
      cells.push(`
          <label class="bn-book-photo-add" style="aspect-ratio:3/4;border-radius:8px;
            border:2px dashed #9C7A34;background:#F8F3E7;display:flex;flex-direction:column;
            align-items:center;justify-content:center;cursor:pointer;color:#8A5A1F;font-size:12px;
            font-weight:700;text-align:center;gap:4px;">
            <span style="font-size:22px;">＋</span>
            <span>Add</span>
            <input type="file" accept="image/*" class="bn-book-photo-input" style="display:none;" />
          </label>`);
    }
    grid.innerHTML = cells.join("");

    grid.querySelectorAll("[data-lightbox-idx]").forEach(img => {
      img.addEventListener("click", () => openPhotoLightbox(photos[parseInt(img.dataset.lightboxIdx, 10)], "Book Photo"));
    });

    grid.querySelectorAll(".bn-book-photo-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        photos.splice(idx, 1);
        saveBookPhotos(bookId, photos);
        renderBookPhotosGrid(bookId, photos);
      });
    });

    const fileInput = grid.querySelector(".bn-book-photo-input");
    if (fileInput) {
      fileInput.addEventListener("change", async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (photos.length >= MAX_BOOK_PHOTOS) return;
        try {
          const dataUrl = await compressImageFile(file, 700, 0.75);
          photos.push(dataUrl);
          saveBookPhotos(bookId, photos);
        } catch (err) {
          console.error("[BookNest] book photo upload failed:", err);
          showNotice("Could not process that photo. Try a smaller image.", "Photo Upload Failed");
        }
        renderBookPhotosGrid(bookId, photos);
      });
    }
  };

  const openBookPhotosManager = (bookId) => {
    const book = getBooks().find(b => b.id === bookId);
    if (!book) return;
    const dialog = ensureBookPhotosDialog();
    dialog.querySelector(".action-modal__title").textContent = book.title ? `Photos — ${book.title}` : "Book Photos";
    const photos = [...(book.images || [])];
    renderBookPhotosGrid(bookId, photos);
    dialog.addEventListener("close", () => refresh(), { once: true });
    dialog.showModal();
  };

  // Book description — a short free-text note (condition, edition, notes)
  // shown to buyers on the shop's book detail view.
  let bookDescriptionDialog = null;
  const ensureBookDescriptionDialog = () => {
    if (bookDescriptionDialog) return bookDescriptionDialog;
    const dialog = document.createElement("dialog");
    dialog.className = "action-modal";
    dialog.style.width = "min(440px, 92vw)";
    dialog.innerHTML = `
      <div class="action-modal__header">
        <div class="action-modal__icon">📝</div>
        <h3 class="action-modal__title">Description</h3>
      </div>
      <div class="action-modal__body">
        <p style="font-size:12.5px;color:#64748b;margin:0 0 10px;">Tell buyers about this copy's condition, edition, or anything else worth mentioning.</p>
        <textarea class="bn-book-desc-field" rows="5" style="width:100%;box-sizing:border-box;padding:10px;font:inherit;border:1.5px solid #d9cdb2;border-radius:8px;resize:vertical;" placeholder="e.g. Pre-loved, light shelf wear on the cover, no markings inside."></textarea>
      </div>
      <div class="action-modal__actions">
        <button class="btn modal-ghost" data-action="cancel" type="button">Cancel</button>
        <button class="btn modal-primary" data-action="save" type="button">Save</button>
      </div>
    `;
    document.body.appendChild(dialog);
    bookDescriptionDialog = dialog;
    return dialog;
  };

  const openBookDescriptionEditor = (bookId) => {
    const book = getBooks().find(b => b.id === bookId);
    if (!book) return;
    const dialog = ensureBookDescriptionDialog();
    dialog.querySelector(".action-modal__title").textContent = book.title ? `Description — ${book.title}` : "Description";
    const field = dialog.querySelector(".bn-book-desc-field");
    field.value = book.description || "";
    const cancelBtn = dialog.querySelector("[data-action='cancel']");
    const saveBtn   = dialog.querySelector("[data-action='save']");
    cancelBtn.onclick = () => dialog.close();
    saveBtn.onclick = () => {
      const books = getBooks();
      const target = books.find(b => b.id === bookId);
      if (target) {
        target.description = field.value.trim();
        saveBooks(books);
        refresh();
      }
      dialog.close();
    };
    dialog.showModal();
    setTimeout(() => field.focus(), 50);
  };

  rows.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id     = target.dataset.id;
    const action = target.dataset.action;
    if (!id || !action) return;
    const books = getBooks();

    if (action === "manage-book-photos") {
      openBookPhotosManager(id);
      return;
    }

    if (action === "edit-book-description") {
      openBookDescriptionEditor(id);
      return;
    }

    if (action === "view-book-photo") {
      const book = books.find(b => b.id === id);
      const cover = book?.images?.[0] || book?.image;
      if (cover) openPhotoLightbox(cover, book.title || "Book Photo");
      return;
    }

    if (action === "delete") {
      const bookToDelete = books.find(b => b.id === id);
      if (!bookToDelete) return;
      const remaining = books.filter(b => b.id !== id);
      saveBooks(remaining);
      refresh();
      showUndoToast(`Deleted "${bookToDelete.title || "book"}".`, () => {
        saveBooks([...getBooks(), bookToDelete]);
        refresh();
      });
    }

    if (action === "toggle-shop") {
      const book = books.find(b => b.id === id);
      if (!book) return;
      book.shopVisible = book.shopVisible !== true; // Toggle: if undefined or false, set to true; if true, set to false
      saveBooks(books);
      refresh();
      showNotice(
        book.shopVisible
          ? `"${book.title}" is now visible in the shop.`
          : `"${book.title}" has been removed from the shop.`,
        book.shopVisible ? "Added to Shop" : "Removed from Shop"
      );
    }

    if (action === "sold") {
      const book = books.find(b => b.id === id);
      if (!book || book.stock <= 0) { await showNotice("No stock available.", "Out of Stock"); return; }
      const { confirmed, value } = await openActionDialog({
        title: "Record sale",
        message: `How many copies of "${book.title}" were sold?`,
        confirmText: "Save",
        cancelText: "Cancel",
        iconText: "✓",
        input: { label: "Quantity", type: "number", value: "1", min: 1 },
      });
      if (!confirmed) return;
      const qty = parseInt(value) || 1;
      if (qty < 1 || qty > book.stock) {
        await showNotice(`Invalid quantity. Stock available: ${book.stock}`, "Invalid Quantity");
        return;
      }
      book.stock -= qty;
      saveBooks(books);

      const saleId = createId("s");
      const sales  = getSales();
      sales.push({
        id:            saleId,
        bookId:        id,
        bookTitle:     book.title,
        bookAuthor:    book.author,
        bookGenre:     book.genre,
        bookCondition: book.condition || "New",
        unitPrice:     book.price,
        quantity:      qty,
        discount:      0,
        paymentMethod: "Cash",
        customer:      "",
        date:          new Date().toISOString(),
        voided:        false,
      });
      saveSales(sales);
      refresh();
      initSales();

      openReceiptModal([{
        saleId,
        bookTitle:     book.title,
        bookAuthor:    book.author,
        bookGenre:     book.genre,
        bookType:      book.type || "Paperback",
        bookCondition: book.condition || "New",
        qty,
        unitPrice:     book.price,
        discount:      0,
        stockAfter:    book.stock,
      }]);
    }

    if (action === "layaway") {
      const book = books.find(b => b.id === id);
      if (!book) return;

      const holds = Array.isArray(book.layawayHolds) ? book.layawayHolds : [];
      const availableForLayaway = getAvailableLayawayStock(book);
      if (availableForLayaway <= 0) {
        await showNotice(`All ${book.stock} cop${book.stock === 1 ? "y" : "ies"} of "${book.title}" ${book.stock === 1 ? "is" : "are"} already on layaway. Cancel an existing hold (✕ on its tag) to free one up, or delete its receipt in Receipt History.`, "Fully Reserved");
        return;
      }

      const { confirmed, name, phone, term } = await openLayawayBookingDialog(book);
      if (!confirmed) return;

      const fee     = getLayawayFee(term);
      const total   = (Number(book.price) || 0) + fee;
      const payments = buildLayawayPlan(total, term, 15);
      const receiptId = createReceiptId();

      const receiptPayload = {
        id: receiptId,
        date: new Date().toISOString(),
        customer: (name || "").toUpperCase(),
        address: "",
        phone: phone || "",
        paymentMethod: "Layaway",
        items: [{
          title:     book.title,
          author:    book.author || "",
          genre:     book.genre || "",
          type:      book.type || "Paperback",
          condition: book.condition || "New",
          qty:       1,
          unitPrice: book.price,
          discount:  0,
        }],
        shippingCarrier: "jnt",
        shippingCost: 0,
        total,
        layaway: {
          enabled: true,
          months: term,
          fee,
          intervalDays: 15,
          payments,
          bookId: book.id,
        },
      };

      const receipts = getReceipts();
      receipts.push(receiptPayload);
      saveReceipts(receipts);

      book.layawayHolds = [...holds, { receiptId, name: (name || "").trim() }];
      saveBooks(books);
      refresh();

      const remaining = getAvailableLayawayStock(book);
      const firstPayment = payments[0];
      showNotice(`Layaway invoice ${receiptId} created — ${currency(firstPayment.amount)} collected now, then ${term} more payment${term > 1 ? "s" : ""} due on the 15th of the month. ${remaining > 0 ? `${remaining} more cop${remaining === 1 ? "y is" : "ies are"} still free to sell or layaway.` : "That was the last copy — fully reserved now."} Open Receipt History to view or collect the schedule.`, "✓ Layaway Booked");
    }

    if (action === "cancel-layaway-hold") {
      const book = books.find(b => b.id === id);
      if (!book) return;
      const holds = Array.isArray(book.layawayHolds) ? book.layawayHolds : [];
      const receiptId = target.dataset.receipt || "";
      const hold = holds.find(h => (h.receiptId || "") === receiptId) || holds[0];
      if (!hold) return;

      const { confirmed } = await openActionDialog({
        title: "Cancel this layaway hold?",
        message: `This frees up one copy of "${book.title}"${hold.name ? ` (held for ${hold.name})` : ""} for sale or a new layaway. The invoice already created for it stays in Receipt History for your records.`,
        confirmText: "Cancel Layaway",
        cancelText: "Keep It",
        iconText: "🗓️",
      });
      if (!confirmed) return;

      book.layawayHolds = holds.filter(h => h !== hold);
      saveBooks(books);
      refresh();
    }
  });

  rows.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName === "SELECT") return; // handled by change event
    const id    = target.dataset.id;
    const field = target.dataset.field;
    if (!id || !field) return;
    const books = getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return;
    const value = target.textContent?.trim() ?? "";
    books[index][field] = (field === "price" || field === "stock") ? Number(value) || 0
                         : (field === "title" || field === "author") ? value.toUpperCase()
                         : value;
    saveBooks(books);
    refresh();
  });

  rows.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.tagName !== "SELECT") return;
    const id    = target.dataset.id;
    const field = target.dataset.field;
    if (!id || !field) return;
    const books = getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return;
    books[index][field] = target.value;
    saveBooks(books);
    refresh();
  });

  rows.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.getAttribute("contenteditable") !== "true") return;
    if (event.key === "Enter") { event.preventDefault(); target.blur(); }
  });

  [searchInput, genreFilter, boxFilter, stockFilter].forEach(el => {
    if (el) el.addEventListener("input", refresh);
  });

  refresh();
};

// ── Sales Log ─────────────────────────────────────────────────────────────────
const initSales = () => {
  const rows = document.getElementById("salesRows");
  if (!rows) return;

  const refreshRows = () => {
    const sales = getSales();
    const books = getBooks();
    rows.innerHTML = sales.slice().reverse().map(sale => {
      const book   = books.find(b => b.id === sale.bookId);
      const title  = sale.bookTitle || (book ? book.title : "Unknown");
      const voided = sale.voided;
      return `<tr style="${voided ? "opacity:0.5;text-decoration:line-through" : ""}">
        <td>${formatDate(sale.date)}</td>
        <td>${title}</td>
        <td>${sale.quantity}</td>
        <td>${sale.paymentMethod || "Cash"}</td>
        <td>${voided ? "Voided" : currency(getSaleTotal(sale, books))}</td>
        <td>
          ${!voided ? `<button class="btn ghost action-btn" data-action="void-sale"   data-id="${sale.id}">Void</button>` : ""}
          <button class="btn ghost action-btn" data-action="delete-sale" data-id="${sale.id}" style="color:var(--danger)">Delete</button>
        </td>
      </tr>`;
    }).join("");
  };

  rows.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const id     = target.dataset.id;
    if (!id) return;

    if (action === "delete-sale") {
      const { confirmed } = await openActionDialog({
        title: "Delete sale?",
        message: "Permanently delete this sale record?",
        confirmText: "Delete",
        cancelText: "Cancel",
        iconText: "!",
      });
      if (!confirmed) return;
      saveSales(getSales().filter(s => s.id !== id));
      refreshRows();
    }

    if (action === "void-sale") {
      const { confirmed } = await openActionDialog({
        title: "Void sale?",
        message: "Void this sale? Stock will be restored.",
        confirmText: "Void",
        cancelText: "Cancel",
        iconText: "!",
      });
      if (!confirmed) return;
      const sales = getSales();
      const sale  = sales.find(s => s.id === id);
      if (!sale || sale.voided) return;
      sale.voided = true;
      const books = getBooks();
      const book  = books.find(b => b.id === sale.bookId);
      if (book) { book.stock += sale.quantity; saveBooks(books); }
      saveSales(sales);
      refreshRows();
      initInventory();
    }
  });

  refreshRows();
};

// ── Receipt History ───────────────────────────────────────────────────────────
const initReceiptHistory = () => {
  const wrap        = document.getElementById("receiptListWrap");
  const searchInput = document.getElementById("receiptSearch");
  if (!wrap) return;

  const render = () => {
    const knownBoxes = [...new Set([
      ...getBooks().map(b => (b.box || "").trim()),
      ...getPurchases().map(p => (p.box || "").trim()),
      ...getReceipts().flatMap(rr => (rr.items || []).map(i => (i.box || "").trim())),
    ].filter(Boolean))].sort();

    const receipts = getReceipts()
      .slice()
      .sort((a, b) => {
        const timeA = Number.isFinite(Date.parse(a?.date)) ? Date.parse(a.date) : 0;
        const timeB = Number.isFinite(Date.parse(b?.date)) ? Date.parse(b.date) : 0;
        if (timeB !== timeA) return timeB - timeA;
        return String(b?.id || "").localeCompare(String(a?.id || ""));
      });
    const query        = (searchInput?.value || "").trim().toLowerCase();
    const shipFilter   = document.getElementById("receiptShipStatus")?.value || "all";
    const payFilter    = document.getElementById("receiptPayStatus")?.value || "all";

    // Keep the box filter's option list in sync with whatever boxes actually
    // exist, without losing the user's current selection on re-render.
    const boxFilterEl = document.getElementById("receiptBoxStatus");
    if (boxFilterEl) {
      const prevValue = boxFilterEl.value || "all";
      boxFilterEl.innerHTML = [
        `<option value="all">📦 All boxes</option>`,
        `<option value="unboxed">❌ No box assigned</option>`,
        ...knownBoxes.map(b => `<option value="${b.replace(/"/g, "&quot;")}">📦 ${b}</option>`),
      ].join("");
      boxFilterEl.value = [...boxFilterEl.options].some(o => o.value === prevValue) ? prevValue : "all";
    }
    const boxFilter = boxFilterEl?.value || "all";

    const filtered = receipts.filter(r => {
      const { shipped, paid, refunded } = getReceiptFlags(r);
      const matchesShip = shipFilter === "all" || (shipFilter === "shipped" ? shipped : !shipped);
      const matchesPay  = payFilter  === "all" || (payFilter  === "paid"    ? paid    : !paid);
      const itemBoxes   = (r.items || []).map(i => (i.box || "").trim());
      const matchesBox  = boxFilter === "all"
        ? true
        : boxFilter === "unboxed"
          ? itemBoxes.some(b => !b)
          : itemBoxes.includes(boxFilter);
      if (!query) return matchesShip && matchesPay && matchesBox;
      const haystack = [
        r.id,
        r.customer,
        r.phone,
        r.address,
        ...(Array.isArray(r.items) ? r.items.map(i => i.title || i.bookTitle || "") : []),
        shipped ? "shipped" : "pending",
        paid ? "paid" : "unpaid pending",
        refunded ? "refunded" : "",
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = haystack.includes(query);
      return matchesShip && matchesPay && matchesBox && matchesQuery;
    });

    if (!filtered.length) {
      wrap.innerHTML = `<p class="muted" style="text-align:center;padding:2rem">No receipts found.</p>`;
      return;
    }

    wrap.innerHTML = filtered.map(r => {
      const booksTotal = r.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
      const shipBreakdown = getShippingBreakdown(r.shippingCost, r.shippingCarrier);
      const grandTotal = booksTotal + shipBreakdown.total + (r.layaway?.enabled ? (Number(r.layaway.fee) || 0) : 0);
      const { shipped, paid, refunded } = getReceiptFlags(r);
      const totalQty   = r.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
      const itemLines  = r.isBundle
        ? r.items.map((i) => {
            const title = i.title || i.bookTitle || "Untitled";
            const author = i.author || "—";
            const genre = i.genre || "—";
            const type = i.type || "—";
            const condition = i.condition || "—";
            const qty = Number(i.qty) || 0;
            return `
              <div class="rh-item-line">
                <div class="rh-item-main">
                  <strong>${title}</strong>
                  <span>${author}</span>
                  <span>${genre}</span>
                  <span>${type}</span>
                  <span>${condition}</span>
                </div>
                <div class="rh-item-price">${qty} × — (bundle)</div>
              </div>`;
          }).join("") + `<div class="rh-item-line"><div class="rh-item-price" style="font-weight:800;color:var(--primary-dark,#0f766e);">🎁 Bundle price: ${currency(r.bundlePrice ?? booksTotal)}</div></div>`
        : r.items.map((i) => {
        const title = i.title || i.bookTitle || "Untitled";
        const author = i.author || "—";
        const genre = i.genre || "—";
        const type = i.type || "—";
        const condition = i.condition || "—";
        const qty = Number(i.qty) || 0;
        const unitPrice = Number(i.unitPrice) || 0;
        const lineTotal = qty * unitPrice;
        return `
          <div class="rh-item-line">
            <div class="rh-item-main">
              <strong>${title}</strong>
              <span>${author}</span>
              <span>${genre}</span>
              <span>${type}</span>
              <span>${condition}</span>
            </div>
            <div class="rh-item-price">${qty} × ${currency(unitPrice)} = ${currency(lineTotal)}</div>
          </div>`;
      }).join("");
      const boxLines = r.items.map((i, idx) => {
        const currentBox = (i.box || "").trim();
        const optionList = currentBox && !knownBoxes.includes(currentBox)
          ? [...knownBoxes, currentBox].sort()
          : knownBoxes;
        const options = [
          `<option value=""${currentBox ? "" : " selected"}>— No box —</option>`,
          ...optionList.map(b => `<option value="${b.replace(/"/g, "&quot;")}"${b === currentBox ? " selected" : ""}>📦 ${b}</option>`),
        ].join("");
        return `
          <div class="rh-box-line">
            <span class="rh-box-wrap" title="Which box this book came from — pick one, no typing">📦
              <select class="rh-box-select" data-receipt-id="${r.id}" data-item-index="${idx}">${options}</select>
            </span>
          </div>`;
      }).join("");
      const receiptDate = formatDate(r.date);
      const shippingCell = `
        <div style="font-weight:700;">${shipBreakdown.icon} ${shipBreakdown.label}</div>
        <div>${shipBreakdown.total > 0 ? currency(shipBreakdown.total) : "—"}</div>
        ${shipBreakdown.rent > 0 ? `<div style="font-size:11px;color:var(--muted);font-weight:600;">(COD ${currency(shipBreakdown.sf)} + Rent ₱${shipBreakdown.rent})</div>` : ""}
        <div style="margin-top:3px;">${paid ? `<span class="rh-paid-chip paid">✅ Paid</span>` : `<span class="rh-paid-chip unpaid">❌ Unpaid</span>`}</div>
      `;
      const isPiling    = shipBreakdown.carrier === "piling" && !shipped;
      const shipBtnLabel = shipped ? `✅ Shipped` : isPiling ? `📥 Piling` : `${shipBreakdown.icon} Ship`;
      const paidBtnLabel = paid ? `✅ Paid` : `💰 Mark Paid`;
      const refundBtnLabel = refunded ? `↩️ Refunded` : `↩️ Refund`;
      const layaway = getLayawaySummary(r);
      const layawayChip = layaway
        ? `<div style="margin-top:4px;"><span class="rh-status ${layaway.complete ? "shipped" : "pending"}" title="Layaway: ${currency(layaway.paidAmount)} of ${currency(layaway.totalAmount)} collected">🗓️ Layaway ${layaway.paidCount}/${layaway.totalCount}mo</span></div>`
        : "";
      return `
      <tr${refunded ? ` style="text-decoration:line-through;"` : ""}>
        <td class="rh-date">${receiptDate}</td>
        <td class="rh-receipt">${r.id}</td>
        <td class="rh-customer">${r.customer || "—"}${r.isBundle ? `<div style="margin-top:3px;"><span class="rh-status pending" style="background:rgba(15,118,110,0.12);color:var(--primary-dark,#0f766e);">🎁 Bundle</span></div>` : ""}</td>
        <td class="rh-items"><strong>${totalQty} item(s)</strong>${itemLines}</td>
        <td class="rh-box-col">${boxLines}</td>
        <td class="rh-money">${currency(booksTotal)}</td>
        <td class="rh-money">${shippingCell}</td>
        <td class="rh-money">${currency(grandTotal)}</td>
        <td><span class="rh-status ${shipped ? "shipped" : "pending"}">${shipped ? "✅ Shipped" : "📦 Pending"}</span></td>
        <td>
          <span class="rh-status ${paid ? "paid" : "pending"}">${paid ? "💰 Paid" : "🕓 Unpaid"}</span>
          ${refunded ? `<div style="margin-top:4px;"><span class="rh-status refunded">↩️ Refunded</span></div>` : ""}
          ${layawayChip}
        </td>
        <td class="rh-actions-cell">
          <div class="rh-actions-grid">
            <button class="rc-btn ${shipped ? "shipped" : isPiling ? "piling" : "ship-now"}" data-action="toggle-shipped" data-id="${r.id}"${isPiling ? ` disabled title="Items are in Piling mode — change the shipping carrier before marking as shipped"` : ""}>${shipBtnLabel}</button>
            <button class="rc-btn ${paid ? "shipped" : "ship-now"}" data-action="toggle-paid" data-id="${r.id}">${paidBtnLabel}</button>
            <button class="rc-btn ${refunded ? "refunded" : "refund-now"}" data-action="toggle-refunded" data-id="${r.id}" title="${refunded ? "Undo refund" : "Refund this order — removes its amount from Total Revenue"}">${refundBtnLabel}</button>
            <button class="rc-btn waybill" data-action="waybill-receipt" data-id="${r.id}" title="Attach the waybill photo and download a thank-you card to send the buyer">${r.waybillPhoto ? "📮 Waybill ✓" : "📮 Waybill"}</button>
            <button class="rc-btn" data-action="review-receipt" data-id="${r.id}">📝 Review</button>
            <button class="rc-btn view" data-action="view-receipt" data-id="${r.id}">View</button>
            <button class="rc-btn edit" data-action="edit-receipt" data-id="${r.id}">Edit</button>
            <button class="rc-btn del" data-action="delete-receipt" data-id="${r.id}">Del</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  };

  render();
  searchInput?.addEventListener("input", render);
  document.getElementById("receiptShipStatus")?.addEventListener("change", render);
  document.getElementById("receiptPayStatus")?.addEventListener("change", render);
  document.getElementById("receiptBoxStatus")?.addEventListener("change", render);

  wrap.addEventListener("change", (e) => {
    const input = e.target.closest(".rh-box-select");
    if (!input) return;
    const receiptId = input.dataset.receiptId;
    const itemIndex = Number(input.dataset.itemIndex);
    if (!receiptId || Number.isNaN(itemIndex)) return;
    const receipts = getReceipts();
    const receipt = receipts.find(r => r.id === receiptId);
    if (!receipt || !Array.isArray(receipt.items) || !receipt.items[itemIndex]) return;
    receipt.items[itemIndex].box = input.value.trim();
    saveReceipts(receipts);
  });

  wrap.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const btn    = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    if (!id) return;
    const receipt = getReceipts().find(r => r.id === id);
    if (!receipt) return;

    if (action === "view-receipt")     { openViewModal(receipt, false); }
    if (action === "edit-receipt")     { openEditModal(receipt); }
    if (action === "download-receipt") { openViewModal(receipt, true); }
    if (action === "review-receipt")   { openShipmentReviewModal(receipt); }
    if (action === "toggle-shipped") {
      const { shipped } = getReceiptFlags(receipt);
      if (!shipped && normalizeCarrier(receipt.shippingCarrier) === "piling") {
        return; // items are still in Piling mode — not ready to ship
      }
      const wasNotShipped = !shipped;
      const updated = setReceiptFlags(id, { shipped: !shipped });
      if (updated) {
        render();
        // Just marked as shipped — prompt right away to attach the waybill
        // photo so a thank-you card can be sent to the buyer.
        if (wasNotShipped) openWaybillModal(updated);
      }
    }
    if (action === "waybill-receipt") { openWaybillModal(receipt); }
    if (action === "toggle-paid") {
      const { paid } = getReceiptFlags(receipt);
      const updated = setReceiptFlags(id, { paid: !paid });
      if (updated) render();
    }
    if (action === "toggle-refunded") {
      const { refunded } = getReceiptFlags(receipt);
      if (!refunded) {
        const amount = sum(receipt.items || [], i => Number(i.qty * i.unitPrice) || 0);
        const { confirmed } = await openActionDialog({
          title: "Refund this order?",
          message: `This will subtract ${currency(amount)} from Total Revenue and mark receipt ${receipt.id} as refunded. This does not restock inventory automatically.`,
          confirmText: "Refund",
          cancelText: "Cancel",
          iconText: "↩️",
        });
        if (!confirmed) return;
      }
      const updated = setReceiptFlags(id, { refunded: !refunded });
      if (updated) { render(); initDashboard(); }
    }
    if (action === "delete-receipt") {
      const { confirmed } = await openActionDialog({
        title: "Delete receipt?",
        message: "Delete this receipt? This cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        iconText: "!",
      });
      if (!confirmed) return;
      if (Array.isArray(receipt.saleIds) && receipt.saleIds.length) {
        const sales = getSales();
        const books = getBooks();
        receipt.saleIds.forEach(saleId => {
          const sale = sales.find(s => s.id === saleId);
          if (!sale) return;
          const book = books.find(b => b.id === sale.bookId);
          if (book) book.stock += sale.quantity;
        });
        const remaining = sales.filter(s => !receipt.saleIds.includes(s.id));
        saveSales(remaining);
        saveBooks(books);
        initInventory();
        initSales();
        initDashboard();
      }
      // Deleting a layaway receipt also releases its hold on the book, so the
      // copy becomes available to sell or re-layaway again.
      if (receipt.layaway?.enabled) {
        const books = getBooks();
        let touched = false;
        books.forEach(book => {
          const holds = Array.isArray(book.layawayHolds) ? book.layawayHolds : [];
          const next = holds.filter(h => h.receiptId !== id);
          if (next.length !== holds.length) {
            book.layawayHolds = next;
            touched = true;
          }
        });
        if (touched) {
          saveBooks(books);
          initInventory();
        }
      }
      saveReceipts(getReceipts().filter(r => r.id !== id));
      render();
    }
  });

  const modal = document.getElementById("viewReceiptModal");
  if (!modal) return;

  document.getElementById("closeViewModal")?.addEventListener("click", () => modal.close());
  document.getElementById("printViewReceiptBtn")?.addEventListener("click", () => printReceiptArea("viewReceiptPrintArea"));
  document.getElementById("downloadReceiptBtn")?.addEventListener("click", () => {
    downloadReceipt("viewReceiptPrintArea");
  });

  modal.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='toggle-layaway-payment']");
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.id;
    const month = parseInt(btn.dataset.month, 10);
    const updated = toggleLayawayPayment(id, month);
    if (updated) {
      renderLayawaySchedule(updated);
      renderShipmentControls(updated);
      render();
    }
  });
};

// ── Receipt photos (read-only view) ─────────────────────────────────────
const isValidPhotoSrc = (src) => typeof src === "string" && src.trim().length > 50 && src.trim().startsWith("data:image");

const MAX_SHIPMENT_REVIEW_PHOTOS = 4;

// Shipment and Payment are independent statuses — a receipt can be paid
// before it ships, shipped before it's paid, both, or neither.
const getReceiptFlags = (receipt) => {
  if (!receipt) return { shipped: false, paid: false, refunded: false };

  // New explicit boolean fields take priority once present.
  if (typeof receipt.paid === "boolean" || typeof receipt.shipped === "boolean") {
    return { shipped: !!receipt.shipped, paid: !!receipt.paid, refunded: !!receipt.refunded };
  }

  // Legacy migration from the old combined tri-state status field.
  const rawStatus = String(receipt.status || receipt.shipmentStatus || "").toLowerCase();
  if (rawStatus === "paid" || rawStatus === "complete") return { shipped: true, paid: true, refunded: !!receipt.refunded };
  if (rawStatus === "shipped") return { shipped: true, paid: false, refunded: !!receipt.refunded };
  return { shipped: false, paid: false, refunded: !!receipt.refunded };
};

// Shop checkouts (from shop.html) are written into BOTH ".receipts" (so they
// show in Admin > Receipts) AND ".shop_orders" (so they show in Admin > Shop
// Orders) as two separate copies of the same sale, linked by a shared id.
// Marking an order Paid/Shipped from the Receipts screen only ever touched
// the ".receipts" copy, so the Shop Orders screen kept showing "Pending"
// forever even after payment was confirmed. Push the same flags into the
// ".shop_orders" copy any time they change here so both screens agree.
const SHOP_ORDERS_KEY = ".shop_orders";
const getShopOrders = () => getData(SHOP_ORDERS_KEY, []);
const saveShopOrders = (orders) => setData(SHOP_ORDERS_KEY, orders);

const syncShopOrderStatus = (orderId, { shipped, paid }) => {
  const orders = getShopOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx < 0) return;
  orders[idx].paid    = paid;
  orders[idx].shipped = shipped;
  // Keep the legacy single "status" field (what the Shop Orders screen
  // most likely renders) in sync too, covering every combination.
  orders[idx].status = paid && shipped ? "Completed"
                      : paid            ? "Paid"
                      : shipped         ? "Shipped"
                      : "Pending";
  saveShopOrders(orders);
};

const setReceiptFlags = (receiptId, patch) => {
  const receipts = getReceipts();
  const idx = receipts.findIndex(r => r.id === receiptId);
  if (idx < 0) return null;
  const current = getReceiptFlags(receipts[idx]);
  const next = { ...current, ...patch };
  receipts[idx].shipped  = next.shipped;
  receipts[idx].paid     = next.paid;
  receipts[idx].refunded = next.refunded;
  // Keep legacy fields roughly in sync in case any other code still reads them.
  receipts[idx].shipmentStatus = next.shipped ? "shipped" : "pending";
  receipts[idx].status = next.shipped ? "shipped" : "pending";
  saveReceipts(receipts);
  // If this receipt came from a shop.html checkout, mirror the new
  // paid/shipped flags onto its matching ".shop_orders" record too.
  if (receipts[idx].shopOrder) {
    syncShopOrderStatus(receiptId, { shipped: next.shipped, paid: next.paid });
  }
  return receipts[idx];
};

const renderShipmentReviews = (receipt) => {
  const list = document.getElementById("shipmentReviewList");
  if (!list) return;
  const reviews = Array.isArray(receipt.shipmentReviews) ? receipt.shipmentReviews : [];
  if (!reviews.length) {
    list.innerHTML = `<div class="muted" style="padding:10px 2px;">No issue reviews saved yet.</div>`;
    return;
  }
  list.innerHTML = reviews.slice().reverse().map(review => {
    const photos = Array.isArray(review.photos) ? review.photos.filter(isValidPhotoSrc) : [];
    return `
      <div class="bn-review-entry">
        <div class="bn-review-entry-header">
          <span>🕒 ${formatDate(review.date || receipt.date)}</span>
          <span>#${review.id || "review"}</span>
        </div>
        <div class="bn-review-entry-text">${review.text || "No details provided."}</div>
        ${photos.length ? `<div class="bn-review-entry-grid">${photos.map(src => `<div class="bn-photo-cell"><img src="${src}" alt="Review photo" /></div>`).join("")}</div>` : ""}
      </div>`;
  }).join("");
};

const renderShipmentControls = (receipt) => {
  const statusBadge = document.getElementById("shipmentStatusBadge");
  const shipBtn      = document.getElementById("markShipmentShippedBtn");
  const paidBtn      = document.getElementById("markShipmentCompleteBtn");

  const { shipped, paid } = getReceiptFlags(receipt);

  if (statusBadge) {
    statusBadge.innerHTML = `
      <span style="margin-right:14px;">📦 Shipment: <strong>${shipped ? "✅ Shipped" : "📦 Pending"}</strong></span>
      <span>💰 Payment: <strong>${paid ? "✅ Paid" : "🕓 Unpaid"}</strong></span>
    `;
  }

  if (shipBtn) {
    shipBtn.textContent = shipped ? "✅ Shipped" : "📦 Mark Shipped";
    shipBtn.onclick = async () => {
      const updated = setReceiptFlags(receipt.id, { shipped: !shipped });
      if (!updated) return;
      renderShipmentControls(updated);
      openViewModal(updated);
    };
  }

  const hasLayaway = !!receipt.layaway?.enabled;

  if (paidBtn) {
    paidBtn.textContent = paid ? "✅ Paid" : "💰 Mark Paid";
    paidBtn.disabled = false;
    paidBtn.style.opacity = "1";
    paidBtn.title = hasLayaway ? "This will mark every layaway installment as paid too." : "";
    paidBtn.onclick = async () => {
      const nextPaid = !paid;
      const updated = setReceiptFlags(receipt.id, { paid: nextPaid });
      if (!updated) return;
      // Keep the layaway installment table in sync with the overall flag.
      if (hasLayaway && Array.isArray(updated.layaway.payments)) {
        const receipts = getReceipts();
        const idx = receipts.findIndex(r => r.id === receipt.id);
        if (idx >= 0) {
          receipts[idx].layaway.payments.forEach(p => {
            p.paid = nextPaid;
            p.paidDate = nextPaid ? (p.paidDate || new Date().toISOString()) : null;
          });
          saveReceipts(receipts);
        }
      }
      const fresh = getReceipts().find(r => r.id === receipt.id) || updated;
      renderShipmentControls(fresh);
      openViewModal(fresh);
    };
  }

  const waybillBtn = document.getElementById("openWaybillBtn");
  if (waybillBtn) {
    waybillBtn.textContent = receipt.waybillPhoto ? "📮 Waybill ✓" : "📮 Waybill";
    waybillBtn.onclick = () => openWaybillModal(receipt);
  }
};

// ── Waybill thank-you card (sent to buyer after shipping) ──────────────
const renderWaybillPreview = (photoSrc) => {
  const wrap = document.getElementById("waybillPhotoWrap");
  if (!wrap) return;
  if (isValidPhotoSrc(photoSrc)) {
    wrap.classList.add("has-photo");
    wrap.innerHTML = `<img src="${photoSrc}" alt="Waybill photo" />`;
  } else {
    wrap.classList.remove("has-photo");
    wrap.innerHTML = `
      <div class="bn-waybill-photo-empty">
        <div class="bn-waybill-photo-icon">📮</div>
        <div>No waybill photo attached yet</div>
      </div>`;
  }
};

const openWaybillModal = (receiptOrId) => {
  const modal = document.getElementById("waybillModal");
  if (!modal) return;
  const receipt = typeof receiptOrId === "string"
    ? getReceipts().find(r => r.id === receiptOrId)
    : (getReceipts().find(r => r.id === receiptOrId.id) || receiptOrId);
  if (!receipt) return;

  const idLabel = document.getElementById("waybill-bn-id");
  if (idLabel) idLabel.textContent = receipt.id;

  const photoInput = document.getElementById("waybillPhotoInput");
  if (photoInput) photoInput.value = "";

  renderWaybillPreview(receipt.waybillPhoto);

  if (photoInput) {
    photoInput.onchange = async () => {
      const file = photoInput.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file);
        renderWaybillPreview(dataUrl);
      } catch {
        showNotice("Couldn't read that image. Please try a different photo.", "Error");
      }
    };
  }

  const saveBtn = document.getElementById("saveWaybillBtn");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const file = photoInput?.files?.[0];
      if (!file) {
        showNotice("Choose a waybill photo first, then save.", "Nothing to save");
        return;
      }
      let dataUrl;
      try {
        dataUrl = await compressImageFile(file);
      } catch {
        showNotice("Couldn't read that image. Please try a different photo.", "Error");
        return;
      }
      const receipts = getReceipts();
      const idx = receipts.findIndex(r => r.id === receipt.id);
      if (idx < 0) return;
      receipts[idx].waybillPhoto = dataUrl;
      saveReceipts(receipts);
      renderWaybillPreview(dataUrl);
      showNotice("Waybill photo saved. You can now download the card to send to the buyer.", "Saved");
      render();
    };
  }

  const removeBtn = document.getElementById("removeWaybillBtn");
  if (removeBtn) {
    removeBtn.onclick = () => {
      const receipts = getReceipts();
      const idx = receipts.findIndex(r => r.id === receipt.id);
      if (idx < 0) return;
      delete receipts[idx].waybillPhoto;
      saveReceipts(receipts);
      if (photoInput) photoInput.value = "";
      renderWaybillPreview(null);
      render();
    };
  }

  const downloadBtn = document.getElementById("downloadWaybillBtn");
  if (downloadBtn) {
    downloadBtn.onclick = async () => {
      const wrapHasPhoto = document.getElementById("waybillPhotoWrap")?.classList.contains("has-photo");
      if (!wrapHasPhoto) {
        showNotice("Attach and save a waybill photo before downloading the card.", "Nothing to download");
        return;
      }
      await downloadReceipt("waybillPrintArea", `Waybill_${receipt.id}`);
    };
  }

  modal.showModal();

  const closeBtn = document.getElementById("closeWaybillModal");
  if (closeBtn) closeBtn.onclick = () => modal.close();
};

const openShipmentReviewModal = (receiptOrId) => {
  const modal = document.getElementById("shipmentReviewModal");
  if (!modal) return;
  const receipt = typeof receiptOrId === "string"
    ? getReceipts().find(r => r.id === receiptOrId)
    : (getReceipts().find(r => r.id === receiptOrId.id) || receiptOrId);
  if (!receipt) return;

  const idLabel = document.getElementById("review-bn-id");
  if (idLabel) idLabel.textContent = receipt.id;

  const reviewText = document.getElementById("shipmentReviewText");
  const photoInput = document.getElementById("shipmentReviewPhotos");
  if (reviewText) reviewText.value = "";
  if (photoInput) photoInput.value = "";

  renderShipmentReviews(receipt);

  const saveReviewBtn = document.getElementById("saveShipmentReviewBtn");
  if (saveReviewBtn) {
    saveReviewBtn.onclick = async () => {
      await openShipmentReviewComposer(receipt);
      const updated = getReceipts().find(r => r.id === receipt.id) || receipt;
      renderShipmentReviews(updated);
    };
  }

  modal.showModal();

  const closeBtn = document.getElementById("closeShipmentReviewModal");
  if (closeBtn) closeBtn.onclick = () => modal.close();
};

const openShipmentReviewComposer = async (receipt) => {
  const text = document.getElementById("shipmentReviewText");
  const photoInput = document.getElementById("shipmentReviewPhotos");
  if (text) text.focus();
  const files = Array.from(photoInput?.files || []).slice(0, MAX_SHIPMENT_REVIEW_PHOTOS);
  const reviewText = text?.value.trim() || "";
  if (!reviewText && files.length === 0) {
    showNotice("Please add a note or at least one photo before saving the review.", "Nothing to save");
    return;
  }
  const photos = [];
  for (const file of files) {
    try {
      photos.push(await compressImageFile(file));
    } catch {
      // skip bad file
    }
  }
  const receipts = getReceipts();
  const idx = receipts.findIndex(r => r.id === receipt.id);
  if (idx < 0) return;
  receipts[idx].shipmentReviews = Array.isArray(receipts[idx].shipmentReviews) ? receipts[idx].shipmentReviews : [];
  receipts[idx].shipmentReviews.push({
    id: createId("rev"),
    date: new Date().toISOString(),
    text: reviewText,
    photos,
  });
  saveReceipts(receipts);
  showNotice("Shipment review saved.", "Saved");
  const updated = receipts[idx];
  renderShipmentReviews(updated);
  text.value = "";
  if (photoInput) photoInput.value = "";
};

const renderReceiptPhotosReadOnly = (receipt) => {
  const photosSection = document.getElementById("view-bn-photos-section");
  const photosGrid    = document.getElementById("view-bn-photos-grid");
  if (!photosSection || !photosGrid) return;
  const rawPhotos = Array.isArray(receipt.photos) ? receipt.photos : [];
  const photos = rawPhotos.filter(isValidPhotoSrc);
  console.log("[BookNest] rendering photos for receipt", receipt.id,
    "— stored:", rawPhotos.length, "valid:", photos.length,
    photos.length ? photos.map(p => p.slice(0, 30) + "...") : "(none)");

  // Auto-repair: if some stored entries were corrupted/empty (e.g. from an earlier
  // bug), quietly clean them out of storage so they don't keep showing as blank boxes.
  if (rawPhotos.length !== photos.length) {
    const receipts = getReceipts();
    const idx = receipts.findIndex(r => r.id === receipt.id);
    if (idx >= 0) {
      receipts[idx].photos = photos;
      saveReceipts(receipts);
      console.log("[BookNest] auto-removed", rawPhotos.length - photos.length, "corrupted photo entr(y/ies) from receipt", receipt.id);
    }
  }

  const headerEl = photosSection.querySelector(".bn-photos-header");
  if (headerEl) headerEl.textContent = "📷 ITEM / SHIPPING PHOTOS";
  if (photos.length > 0) {
    photosGrid.innerHTML = photos.map((src, i) => `
      <div class="bn-photo-cell" style="aspect-ratio:1/1;border-radius:10px;overflow:hidden;border:1.5px solid #bfdbfe;background:#e8f0fe;box-shadow:0 4px 12px rgba(15,23,42,0.08);">
        <img src="${src}" alt="Receipt photo ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block;"
          onerror="this.parentElement.innerHTML='&lt;div style=&quot;display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:11px;color:#94a3b8;text-align:center;padding:4px;&quot;&gt;⚠ Photo unavailable&lt;/div&gt;'" />
      </div>`
    ).join("");
    photosSection.style.display = "";
  } else {
    photosGrid.innerHTML = "";
    photosSection.style.display = "none";
  }
};

const MAX_RECEIPT_PHOTOS = 4;

const compressImageFile = (file, maxDim = 900, quality = 0.75) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

// ── Receipt photos (editable, max 4) ────────────────────────────────────
const renderReceiptPhotosEditable = (currentPhotos, onChange) => {
  const photosSection = document.getElementById("view-bn-photos-section");
  const photosGrid    = document.getElementById("view-bn-photos-grid");
  if (!photosSection || !photosGrid) return;

  const headerEl = photosSection.querySelector(".bn-photos-header");
  if (headerEl) headerEl.textContent = `📷 ITEM / SHIPPING PHOTOS (${currentPhotos.length}/${MAX_RECEIPT_PHOTOS})`;

  const cells = [];
  for (let i = 0; i < MAX_RECEIPT_PHOTOS; i++) {
    if (i < currentPhotos.length) {
      cells.push(`
        <div class="bn-photo-cell" style="position:relative;aspect-ratio:1/1;border-radius:10px;overflow:hidden;border:1.5px solid #bfdbfe;background:#e8f0fe;box-shadow:0 4px 12px rgba(15,23,42,0.08);">
          <img src="${currentPhotos[i]}" alt="Receipt photo ${i + 1}" style="width:100%;height:100%;object-fit:cover;display:block;"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
          <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:11px;color:#94a3b8;text-align:center;padding:4px;">⚠ Photo unavailable</div>
          <button type="button" class="bn-photo-remove modal-no-print" data-idx="${i}"
            style="position:absolute;top:4px;right:4px;width:24px;height:24px;border:none;border-radius:50%;
            background:rgba(239,68,68,0.92);color:#fff;font-weight:700;font-size:13px;line-height:1;
            cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>`);
    } else {
      cells.push(`
        <label class="bn-photo-add modal-no-print" style="aspect-ratio:1/1;border-radius:10px;
          border:2px dashed #93c5fd;background:#eff6ff;display:flex;flex-direction:column;
          align-items:center;justify-content:center;cursor:pointer;color:#1d4ed8;font-size:13px;
          font-weight:700;text-align:center;gap:6px;">
          <span style="font-size:26px;">＋</span>
          <span>Add Photo</span>
          <input type="file" accept="image/*" class="bn-photo-input" style="display:none;" />
        </label>`);
    }
  }
  photosGrid.innerHTML = cells.join("");
  photosSection.style.display = "";

  photosGrid.querySelectorAll(".bn-photo-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      currentPhotos.splice(idx, 1);
      renderReceiptPhotosEditable(currentPhotos, onChange);
      onChange(currentPhotos);
    });
  });

  const fileInput = photosGrid.querySelector(".bn-photo-input");
  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (currentPhotos.length >= MAX_RECEIPT_PHOTOS) return;
      try {
        const dataUrl = await compressImageFile(file);
        currentPhotos.push(dataUrl);
      } catch (err) {
        showNotice("Could not load that image. Please try another photo.", "Error");
      }
      renderReceiptPhotosEditable(currentPhotos, onChange);
      onChange(currentPhotos);
    });
  }
};

// Pre-convert the receipt logo to a data: URI so it never taints the canvas
// when html2canvas renders the download/print image on file:// origins.
const preConvertReceiptLogo = () => {
  const logoImg = document.querySelector("#viewReceiptPrintArea .bn-logo-img");
  if (!logoImg) return;
  if (logoImg.dataset.converted === "true" || logoImg.src.startsWith("data:")) return;

  const convert = () => {
    try {
      const c = document.createElement("canvas");
      c.width = logoImg.naturalWidth || 72;
      c.height = logoImg.naturalHeight || 72;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(logoImg, 0, 0);
      logoImg.src = c.toDataURL("image/png");
      logoImg.dataset.converted = "true";
    } catch (e) {
      // If conversion fails, keep the visible image instead of hiding it.
      console.warn("[BookNest] Logo conversion skipped:", e);
    }
  };

  if (logoImg.complete && logoImg.naturalWidth > 0) {
    convert();
    return;
  }

  logoImg.addEventListener("load", convert, { once: true });
};

// ── Layaway schedule (receipt view modal) ───────────────────────────────────
const renderLayawaySchedule = (receipt) => {
  const section = document.getElementById("view-bn-layaway-section");
  if (!section) return;

  const summary = getLayawaySummary(receipt);
  if (!summary) {
    section.style.display = "none";
    section.innerHTML = "";
    return;
  }

  const intervalDays = Number(receipt.layaway?.intervalDays) || 30;
  const cadenceLabel = intervalDays === 15 ? "on the 15th of each month" : intervalDays === 30 ? "monthly" : `every ${intervalDays} days`;

  const rows = summary.payments.map(p => {
    const label = p.reservation
      ? "1st Payment (Paid at Order)"
      : (intervalDays === 15 ? `Payment ${p.month} (15th of the month)` : `Month ${p.month}`);
    const dueDate = p.dueDate ? formatDateLong(p.dueDate) : "—";
    const paidDate = p.paidDate ? formatDate(p.paidDate) : "—";
    return `
      <tr${p.reservation ? ` style="background:#f5f3ff;"` : ""}>
        <td>${label}</td>
        <td>${dueDate}</td>
        <td style="text-align:right">${currency(p.amount)}</td>
        <td>${p.paid ? `<span class="rh-status paid">✅ Paid</span>` : `<span class="rh-status pending">🕓 Unpaid</span>`}</td>
        <td>${paidDate}</td>
        <td class="modal-no-print">
          <button class="rc-btn ${p.paid ? "shipped" : "ship-now"}" data-action="toggle-layaway-payment" data-id="${receipt.id}" data-month="${p.month}">${p.paid ? "Undo" : "Mark Paid"}</button>
        </td>
      </tr>`;
  }).join("");

  section.style.display = "";
  section.innerHTML = `
    <div class="bn-note-card" style="border-left-color:#7c3aed;">
      <div class="bn-note-title">🗓️ LAYAWAY PAYMENT SCHEDULE</div>
      <p class="bn-note-subtitle">Total split evenly across ${summary.totalCount} payments — the 1st collected on the order date, then ${summary.totalCount - 1} more ${cadenceLabel} · Total service fee ${currency(summary.fee)} (already included below).</p>
      <div style="overflow-x:auto;border-radius:12px;border:2px solid #ddd6fe;">
        <table class="bn-table" style="border:none;">
          <thead>
            <tr>
              <th>TERM</th>
              <th>DUE DATE</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>PAID ON</th>
              <th class="modal-no-print">ACTION</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;margin-top:14px;font-weight:700;color:#1e3a8a;">
        <span>Paid so far: ${currency(summary.paidAmount)}</span>
        <span>Balance: ${currency(summary.balance)}</span>
        <span>Total (incl. fee): ${currency(summary.totalAmount)}</span>
      </div>
    </div>
  `;
};

// Bundle receipts don't carry a meaningful per-book "Total" (the whole
// point is one fixed price for the set) — hide that column on the shared
// items table when viewing/editing a bundle receipt, show it otherwise.
const setBundleColumnVisibility = (isBundle) => {
  const table = document.getElementById("view-bn-items")?.closest("table");
  if (!table) return;
  const totalHeader = table.querySelector("thead th:last-child");
  if (totalHeader) totalHeader.style.display = isBundle ? "none" : "";
};

const openViewModal = (receiptOrId, autoDownload = false) => {
  const modal = document.getElementById("viewReceiptModal");
  if (!modal) return;
  // Always re-fetch from storage so edits are reflected immediately
  const receipt = typeof receiptOrId === "string"
    ? getReceipts().find(r => r.id === receiptOrId)
    : (getReceipts().find(r => r.id === receiptOrId.id) || receiptOrId);
  if (!receipt) return;

  // Restore normal modal buttons
  const modalBar = document.querySelector(".bn-modal-bar");
  modalBar.innerHTML = `
    <span style="font-weight:700;font-size:1rem;">📄 Receipt</span>
    <div style="display:flex;gap:0.6rem;flex-wrap:wrap">
      <button id="downloadReceiptBtn"    class="bn-btn-blue  modal-no-print" type="button">📸 Download Image</button>
      <button id="printViewReceiptBtn"   class="bn-btn-slate modal-no-print" type="button">🖨 Print</button>
      <button id="closeViewModal"        class="bn-btn-slate modal-no-print" type="button">✕ Close</button>
    </div>
  `;

  // Fill header
  document.getElementById("view-bn-id").textContent      = receipt.id;
  document.getElementById("view-bn-date").textContent    = formatDateLong(receipt.date);
  document.getElementById("view-bn-payment").textContent = receipt.paymentMethod || "GCash";

  // Clear the top customer block (info is shown in the Shipment Details card below)
  const custBlock = document.getElementById("view-bn-customer-info");
  if (custBlock) custBlock.innerHTML = "";

  // Items
  const tbody = document.getElementById("view-bn-items");
  if (tbody) {
    setBundleColumnVisibility(receipt.isBundle);
    tbody.innerHTML = receipt.items.map(item => {
      if (receipt.isBundle) {
        return `<tr>
          <td>${item.title}</td>
          <td>${item.author || "—"}</td>
          <td>${item.genre || "—"}</td>
          <td>${item.type || "—"}</td>
          <td style="text-align:right">—</td>
          <td>${item.condition || "—"}</td>
          <td style="text-align:center">${item.qty}</td>
        </tr>`;
      }
      const lineTotal = item.unitPrice * item.qty;
      return `<tr>
        <td>${item.title}</td>
        <td>${item.author || "—"}</td>
        <td>${item.genre || "—"}</td>
        <td>${item.type || "—"}</td>
        <td style="text-align:right">${currency(item.unitPrice)}</td>
        <td>${item.condition || "—"}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${currency(lineTotal)}</td>
      </tr>`;
    }).join("") + (receipt.isBundle
      ? `<tr><td colspan="7" style="text-align:right;font-weight:800;">🎁 Bundle price: ${currency(receipt.bundlePrice ?? receipt.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0))}</td></tr>`
      : "");
  }

  // Calculate totals
  const booksTotal    = receipt.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const shipBreakdown = getShippingBreakdown(receipt.shippingCost, receipt.shippingCarrier);
  const shippingCost  = shipBreakdown.total;
  const layawayFee    = receipt.layaway?.enabled ? (Number(receipt.layaway.fee) || 0) : 0;
  const grandTotal    = booksTotal + shippingCost + layawayFee;

  // Books total line
  document.getElementById("view-bn-books-total").textContent = booksTotal.toFixed(2)
    + (layawayFee > 0 ? ` (+ ${currency(layawayFee)} layaway fee)` : "");

  // Shipping note — dynamic based on carrier + whether fee > 0
  const shippingNoteEl = document.querySelector("#viewReceiptPrintArea .bn-shipping-note");
  if (shippingNoteEl) {
    const carrierTag = `${shipBreakdown.icon} ${shipBreakdown.label}`;
    if (shipBreakdown.carrier === "piling") {
      shippingNoteEl.innerHTML = `📥 Order is <strong>Piling</strong> — being held/consolidated. Not yet shipped.`;
      shippingNoteEl.style.color = "#475569";
    } else if (shippingCost > 0) {
      const rentNote = shipBreakdown.rent > 0 ? ` (COD ₱${shipBreakdown.sf.toFixed(2)} + Rent Fee ₱${shipBreakdown.rent.toFixed(2)})` : "";
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong> — Fee <strong style="color:#16a34a;">INCLUDED</strong> in this invoice. (+₱${shippingCost.toFixed(2)})${rentNote}`;
      shippingNoteEl.style.color = "#16a34a";
    } else {
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong>. Shipping Fee is <u>NOT INCLUDED</u> in this invoice.`;
      shippingNoteEl.style.color = "";
    }
  }

  // Grand total — always the clean styled div, not overwritten with extra HTML
  const grandTotalEl = document.getElementById("view-bn-grand-total");
  if (grandTotalEl) {
    grandTotalEl.textContent = `₱ ${grandTotal.toFixed(2)}`;
  }

  // Shipment details card — styled
  const custCard = document.getElementById("view-bn-customer-info-card");
  if (custCard) {
    custCard.innerHTML = `
      <div style="display:grid;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #bfdbfe;border-radius:10px;">
          <span style="font-size:18px;">👤</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;">Customer Name</div>
            <div style="font-weight:700;color:#0f172a;font-size:14px;">${receipt.customer || "—"}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #bfdbfe;border-radius:10px;">
          <span style="font-size:18px;">📍</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;">Shipping Address</div>
            <div style="font-weight:600;color:#0f172a;font-size:13px;">${receipt.address || "—"}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #bfdbfe;border-radius:10px;">
          <span style="font-size:18px;">📞</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;">Phone Number</div>
            <div style="font-weight:700;color:#0f172a;font-size:14px;">${receipt.phone || "—"}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #bfdbfe;border-radius:10px;">
          <span style="font-size:18px;">${shipBreakdown.icon}</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;">Courier</div>
            <div style="font-weight:700;color:#0f172a;font-size:14px;">${shipBreakdown.label}${shipBreakdown.rent > 0 ? ` <span style="font-weight:600;color:#64748b;font-size:11px;">(+₱${shipBreakdown.rent} rent fee)</span>` : ""}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Payment card — dynamic badge based on payment method
  const paymentCard = document.querySelector(".bn-payment-card");
  if (paymentCard) {
    const pm = (receipt.paymentMethod || "GCash").toLowerCase();
    const isLayaway = pm.includes("layaway");
    const isGotyme  = pm.includes("gotyme") || pm.includes("got");

    if (isLayaway) {
      const layawaySummary = getLayawaySummary(receipt);
      const term = layawaySummary ? `${layawaySummary.months}-Month Plan` : "Layaway Plan";
      paymentCard.innerHTML = `
        <div class="bn-card-title" style="color:#1d4ed8;justify-content:center;">💳 PAYMENT METHOD</div>
        <div style="margin:10px 0 6px;">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,#7c3aed,#5b21b6);border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:26px;color:white;margin:0 auto;">🗓️</div>
        </div>
        <div style="font-size:15px;font-weight:800;color:#5b21b6;text-align:center;margin-bottom:10px;">Layaway (${term})</div>
        <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:10px;padding:10px 8px;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:#5b21b6;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Reservation / Reference</div>
          <div style="font-weight:800;font-size:1.05rem;color:#5b21b6;">${receipt.paymentDetails || "09764097987"}</div>
        </div>
      `;
    } else {
      const badge = isGotyme
        ? `<div style="width:64px;height:64px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:white;margin:0 auto;letter-spacing:-1px;">GT</div>`
        : `<div style="width:64px;height:64px;background:linear-gradient(135deg,#007bff,#0056d6);border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:32px;color:white;margin:0 auto;">G</div>`;
      const methodLabel = isGotyme ? "GoTyme Bank" : "GCash";
      paymentCard.innerHTML = `
        <div class="bn-card-title" style="color:#1d4ed8;justify-content:center;">💳 PAYMENT METHOD</div>
        <div style="margin:10px 0 6px;">${badge}</div>
        <div style="font-size:15px;font-weight:800;color:#1e3a8a;text-align:center;margin-bottom:10px;">${methodLabel}</div>
        <div style="background:#f8fbff;border:2px solid #2563eb;border-radius:10px;padding:10px 8px;text-align:center;">
          <div style="font-size:10px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Account / Reference</div>
          <div style="font-weight:800;font-size:1.05rem;color:#1e3a8a;">${receipt.paymentDetails || (isGotyme ? "GoTyme Account" : "09764097987")}</div>
        </div>
      `;
    }
  }

  renderReceiptPhotosReadOnly(receipt);
  renderShipmentControls(receipt);
  renderLayawaySchedule(receipt);
  preConvertReceiptLogo();

  modal.showModal();

  // Re-attach button listeners
  setTimeout(() => {
    document.getElementById("downloadReceiptBtn")?.addEventListener("click", () => downloadReceipt("viewReceiptPrintArea"));
    document.getElementById("printViewReceiptBtn")?.addEventListener("click", () => printReceiptArea("viewReceiptPrintArea"));
    document.getElementById("closeViewModal")?.addEventListener("click", () => modal.close());
  }, 50);

  if (autoDownload) setTimeout(() => downloadReceipt("viewReceiptPrintArea"), 400);
};

let editingLayawayFee = 0;
let editingReceiptIsBundle = false;
let editingReceiptBundlePrice = 0;

const updateShippingText = () => {
  const shippingCostInput = document.getElementById("edit-shipping-cost");
  const carrierSelect = document.getElementById("edit-shipping-carrier");
  const sfFee = parseFloat(shippingCostInput?.value) || 0;
  const breakdown = getShippingBreakdown(sfFee, carrierSelect?.value);
  const shippingCost = breakdown.total;

  const rentNote = document.getElementById("edit-rentfee-note");
  if (rentNote) rentNote.style.display = breakdown.rent > 0 ? "block" : "none";

  // Relabel the fee input for TikTok's COD shipping fee vs a plain SF fee
  const sfFeeLabel = document.getElementById("edit-sf-fee-label");
  if (sfFeeLabel) sfFeeLabel.textContent = breakdown.carrier === "tiktok" ? "COD TIKTOK SHIPPING FEE (₱):" : breakdown.carrier === "piling" ? "FEE (ONCE SHIPPED) (₱):" : "SF FEE (₱):";
  if (shippingCostInput) shippingCostInput.placeholder = breakdown.carrier === "tiktok" ? "Enter COD TikTok shipping fee" : breakdown.carrier === "piling" ? "Fee once carrier is chosen" : "Enter SF fee";

  // Update shipping note
  const shippingNoteEl = document.querySelector("#viewReceiptPrintArea .bn-shipping-note");
  if (shippingNoteEl) {
    const carrierTag = `${breakdown.icon} ${breakdown.label}`;
    if (breakdown.carrier === "piling") {
      shippingNoteEl.innerHTML = `📥 Order is <strong>Piling</strong> — being held/consolidated. Not yet shipped.`;
      shippingNoteEl.style.color = "#475569";
    } else if (shippingCost > 0) {
      const rentText = breakdown.rent > 0 ? ` (COD ₱${breakdown.sf.toFixed(2)} + Rent Fee ₱${breakdown.rent.toFixed(2)})` : "";
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong> — Fee <strong style="color:#16a34a;">INCLUDED</strong> in this invoice. (+₱${shippingCost.toFixed(2)})${rentText}`;
      shippingNoteEl.style.color = "#16a34a";
    } else {
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong>. Shipping Fee is <u>NOT INCLUDED</u> in this invoice.`;
      shippingNoteEl.style.color = "";
    }
  }

  // Update books total and grand total display
  // Bundle receipts have a fixed price that doesn't come from the item
  // rows (the Total column is hidden for them), so use it directly instead
  // of trying to parse it back out of the table.
  const booksTotal = editingReceiptIsBundle
    ? editingReceiptBundlePrice
    : Array.from(document.querySelectorAll("#view-bn-items tr")).reduce((sum, tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length < 7) return sum;
      const lineTotalText = cells[7]?.textContent?.replace(/[^0-9.]/g, "") || "";
      if (lineTotalText) return sum + (parseFloat(lineTotalText) || 0);
      const qty = parseInt(cells[6]?.textContent, 10) || 0;
      const priceText = cells[4]?.textContent?.replace(/[^0-9.]/g, "") || "0";
      return sum + (parseFloat(priceText) * qty);
    }, 0);

  document.getElementById("view-bn-books-total").textContent = booksTotal.toFixed(2)
    + (editingLayawayFee > 0 ? ` (+ ${currency(editingLayawayFee)} layaway fee)` : "");
  const grandTotalEl = document.getElementById("view-bn-grand-total");
  if (grandTotalEl) grandTotalEl.textContent = `₱ ${(booksTotal + shippingCost + editingLayawayFee).toFixed(2)}`;
};

const openEditModal = (receipt) => {
  const modal = document.getElementById("viewReceiptModal");
  if (!modal) return;

  editingReceiptIsBundle = !!receipt.isBundle;
  editingReceiptBundlePrice = Number(receipt.bundlePrice) || 0;

  // Fill header
  document.getElementById("view-bn-id").textContent      = receipt.id;
  document.getElementById("view-bn-date").textContent    = formatDateLong(receipt.date);
  document.getElementById("view-bn-payment").textContent = receipt.paymentMethod || "GCash";
  
  // Clear top customer info
  const custBlock = document.getElementById("view-bn-customer-info");
  if (custBlock) custBlock.innerHTML = "";

  // Items (read-only)
  const tbody = document.getElementById("view-bn-items");
  if (tbody) {
    setBundleColumnVisibility(receipt.isBundle);
    tbody.innerHTML = receipt.items.map(item => {
      if (receipt.isBundle) {
        return `<tr>
          <td>${item.title}</td>
          <td>${item.author || "—"}</td>
          <td>${item.genre || "—"}</td>
          <td>${item.type || "—"}</td>
          <td style="text-align:right">—</td>
          <td>${item.condition || "—"}</td>
          <td style="text-align:center">${item.qty}</td>
        </tr>`;
      }
      const lineTotal = item.unitPrice * item.qty;
      return `<tr>
        <td>${item.title}</td>
        <td>${item.author || "—"}</td>
        <td>${item.genre || "—"}</td>
        <td>${item.type || "—"}</td>
        <td style="text-align:right">${currency(item.unitPrice)}</td>
        <td>${item.condition || "—"}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${currency(lineTotal)}</td>
      </tr>`;
    }).join("") + (receipt.isBundle
      ? `<tr><td colspan="7" style="text-align:right;font-weight:800;">🎁 Bundle price: ${currency(receipt.bundlePrice ?? receipt.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0))}</td></tr>`
      : "");
  }

  // Calculate total with shipping
  const booksTotal    = receipt.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const shipBreakdown = getShippingBreakdown(receipt.shippingCost, receipt.shippingCarrier);
  const shippingCost  = shipBreakdown.total;
  editingLayawayFee    = receipt.layaway?.enabled ? (Number(receipt.layaway.fee) || 0) : 0;
  const grandTotal    = booksTotal + shippingCost + editingLayawayFee;

  // Grand total — clean styled display
  const grandTotalEl = document.getElementById("view-bn-grand-total");
  if (grandTotalEl) {
    grandTotalEl.textContent = `₱ ${grandTotal.toFixed(2)}`;
  }

  // Shipping note — dynamic
  const shippingNoteEl = document.querySelector("#viewReceiptPrintArea .bn-shipping-note");
  if (shippingNoteEl) {
    const carrierTag = `${shipBreakdown.icon} ${shipBreakdown.label}`;
    if (shipBreakdown.carrier === "piling") {
      shippingNoteEl.innerHTML = `📥 Order is <strong>Piling</strong> — being held/consolidated. Not yet shipped.`;
      shippingNoteEl.style.color = "#475569";
    } else if (shippingCost > 0) {
      const rentNote = shipBreakdown.rent > 0 ? ` (COD ₱${shipBreakdown.sf.toFixed(2)} + Rent Fee ₱${shipBreakdown.rent.toFixed(2)})` : "";
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong> — Fee <strong style="color:#16a34a;">INCLUDED</strong> in this invoice. (+₱${shippingCost.toFixed(2)})${rentNote}`;
      shippingNoteEl.style.color = "#16a34a";
    } else {
      shippingNoteEl.innerHTML = `Shipping via <strong>${carrierTag}</strong>. Shipping Fee is <u>NOT INCLUDED</u> in this invoice.`;
      shippingNoteEl.style.color = "";
    }
  }

  // All editable fields in the shipment details card
  const custHtml = `
    <div style="display: grid; gap: 12px;">
      <div>
        <label style="display: block; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; font-size: 12px;">NAME:</label>
        <input type="text" value="${receipt.customer || ''}" id="edit-customer-name" placeholder="Enter customer name" style="width: 100%; padding: 8px; border: 1px solid #2563eb; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; font-size: 12px;">ADDRESS:</label>
        <input type="text" value="${receipt.address || ''}" id="edit-customer-address" placeholder="Enter shipping address" style="width: 100%; padding: 8px; border: 1px solid #2563eb; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; font-size: 12px;">PHONE:</label>
        <input type="text" value="${receipt.phone || ''}" id="edit-customer-phone" placeholder="Enter phone number" style="width: 100%; padding: 8px; border: 1px solid #2563eb; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; font-size: 12px;">SHIPPING CARRIER:</label>
        <select id="edit-shipping-carrier" onchange="updateShippingText()" style="width: 100%; padding: 8px; border: 1px solid #2563eb; border-radius: 6px; font-size: 14px;">
          <option value="jnt"${normalizeCarrier(receipt.shippingCarrier) === "jnt" ? " selected" : ""}>${SHIPPING_CARRIERS.jnt.icon} ${SHIPPING_CARRIERS.jnt.label}</option>
          <option value="tiktok"${normalizeCarrier(receipt.shippingCarrier) === "tiktok" ? " selected" : ""}>${SHIPPING_CARRIERS.tiktok.icon} ${SHIPPING_CARRIERS.tiktok.label}</option>
          <option value="piling"${normalizeCarrier(receipt.shippingCarrier) === "piling" ? " selected" : ""}>${SHIPPING_CARRIERS.piling.icon} ${SHIPPING_CARRIERS.piling.label}</option>
        </select>
      </div>
      <div>
        <label id="edit-sf-fee-label" style="display: block; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; font-size: 12px;">${normalizeCarrier(receipt.shippingCarrier) === "tiktok" ? "COD TIKTOK SHIPPING FEE (₱):" : "SF FEE (₱):"}</label>
        <input type="number" id="edit-shipping-cost" value="${receipt.shippingCost || 0}" min="0" step="0.01" placeholder="${normalizeCarrier(receipt.shippingCarrier) === "tiktok" ? "Enter COD TikTok shipping fee" : "Enter SF fee"}" oninput="updateShippingText()" style="width: 100%; padding: 8px; border: 1px solid #2563eb; border-radius: 6px; font-size: 14px;">
        <div id="edit-rentfee-note" style="display:${normalizeCarrier(receipt.shippingCarrier) === "tiktok" ? "block" : "none"};font-size:12px;font-weight:700;color:#7c3aed;margin-top:6px;">+ ₱${TIKTOK_RENT_FEE.toFixed(2)} Rent Fee (TikTok Shop)</div>
      </div>
    </div>
  `;

  const custCard = document.getElementById("view-bn-customer-info-card");
  if (custCard) custCard.innerHTML = custHtml;

  // Payment method and details in the payment card
  const paymentCard = document.querySelector(".bn-payment-card");
  if (paymentCard) {
    paymentCard.innerHTML = `
      <div class="bn-card-title" style="color:#1d4ed8;justify-content:center;">💳 PAYMENT METHOD</div>
      <div style="margin-top:8px;">
        <label style="display:block;font-weight:700;color:#1d4ed8;margin-bottom:6px;font-size:12px;">PAYMENT METHOD:</label>
        <select id="edit-payment-method" style="width:100%;padding:10px;border:2px solid #2563eb;border-radius:8px;font-size:14px;font-weight:700;text-align:center;background:#f8fbff;color:#1e3a8a;cursor:pointer;">
          <option value="GCash"${!(receipt.paymentMethod||'').toLowerCase().includes('got') && !(receipt.paymentMethod||'').toLowerCase().includes('layaway') ? ' selected' : ''}>📱 GCash</option>
          <option value="GoTyme Bank"${(receipt.paymentMethod||'').toLowerCase().includes('got') ? ' selected' : ''}>🏦 GoTyme Bank</option>
          <option value="Layaway"${(receipt.paymentMethod||'').toLowerCase().includes('layaway') ? ' selected' : ''}>🗓️ Layaway</option>
        </select>
      </div>
      <div style="margin-top:12px;">
        <label style="display:block;font-weight:700;color:#1d4ed8;margin-bottom:6px;font-size:12px;">ACCOUNT / REFERENCE:</label>
        <input type="text" value="${receipt.paymentDetails || ''}" id="edit-payment-details" placeholder="e.g., 09764097987" style="width:100%;padding:8px;border:2px solid #2563eb;border-radius:8px;font-size:14px;font-weight:600;text-align:center;background:#f8fbff;color:#1e3a8a;">
      </div>
    `;
  }

  // Editable photos (max 4)
  let editPhotos = (Array.isArray(receipt.photos) ? receipt.photos : []).filter(isValidPhotoSrc).slice(0, MAX_RECEIPT_PHOTOS);
  renderReceiptPhotosEditable(editPhotos, (updated) => { editPhotos = updated; });
  renderShipmentControls(receipt);

  // Replace buttons with Save and Cancel at the top
  const modalBar = document.querySelector(".bn-modal-bar");
  modalBar.innerHTML = `
    <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center;">
      <div style="display: flex; gap: 8px;">
        <button id="save-receipt-edit" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">✓ Save Changes</button>
        <button id="cancel-receipt-edit" style="background: #ef4444; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;">✕ Cancel</button>
      </div>
      <span style="font-size: 12px; color: #666;">Editing Receipt</span>
    </div>
  `;

  // Use onclick instead of addEventListener to avoid duplicate listeners
  const saveBtn = document.getElementById("save-receipt-edit");
  const cancelBtn = document.getElementById("cancel-receipt-edit");
  
  if (saveBtn) {
    saveBtn.onclick = () => {
      const receipts = getReceipts();
      const idx = receipts.findIndex(r => r.id === receipt.id);
      if (idx >= 0) {
        const shippingCostInput = document.getElementById("edit-shipping-cost");
        const shippingCarrierInput = document.getElementById("edit-shipping-carrier");
        const paymentMethodInput = document.getElementById("edit-payment-method");
        const paymentDetailsInput = document.getElementById("edit-payment-details");
        
        receipts[idx].shippingCost = parseFloat(shippingCostInput?.value) || 0;
        receipts[idx].shippingCarrier = normalizeCarrier(shippingCarrierInput?.value);
        receipts[idx].customer = document.getElementById("edit-customer-name")?.value || receipt.customer || "";
        receipts[idx].address = document.getElementById("edit-customer-address")?.value || receipt.address || "";
        receipts[idx].phone = document.getElementById("edit-customer-phone")?.value || receipt.phone || "";
        receipts[idx].paymentMethod = paymentMethodInput?.value || receipt.paymentMethod || "GCash";
        receipts[idx].paymentDetails = paymentDetailsInput?.value || receipt.paymentDetails || "";
        receipts[idx].photos = editPhotos.slice(0, MAX_RECEIPT_PHOTOS);
        {
          const savedBreakdown = getShippingBreakdown(receipts[idx].shippingCost, receipts[idx].shippingCarrier);
          const savedLayawayFee = receipts[idx].layaway?.enabled ? (Number(receipts[idx].layaway.fee) || 0) : 0;
          receipts[idx].total = receipt.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0) + savedBreakdown.total + savedLayawayFee;
        }
        const ok = saveReceipts(receipts);
        if (!ok) return; // setData already showed the user a clear error; keep the edit modal open
        modal.close();
        initReceiptHistory();
        // Re-open view modal with freshly saved data
        const updated = getReceipts().find(r => r.id === receipt.id);
        if (updated) openViewModal(updated);
        showNotice("✓ Receipt updated successfully!");
      }
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      modal.close();
    };
  }

  modal.showModal();
};

// ── Backup & Restore ──────────────────────────────────────────────────────────
// Counts every photo currently sitting in localStorage (receipt photos,
// shipment-review photos, and purchase/box photos) so we can tell the user
// what's about to be cleared.
const countStoredPhotos = () => {
  let n = 0;
  getReceipts().forEach(r => {
    n += (Array.isArray(r.photos) ? r.photos.filter(isValidPhotoSrc).length : 0);
    (Array.isArray(r.shipmentReviews) ? r.shipmentReviews : []).forEach(rev => {
      n += (Array.isArray(rev.photos) ? rev.photos.filter(isValidPhotoSrc).length : 0);
    });
  });
  getPurchases().forEach(p => { if (p.image) n += 1; });
  return n;
};

// Strips all photos (receipt photos, shipment-review photos, purchase/box
// photos) out of localStorage. Only ever called right after a successful
// backup download, once the same photos are safely sitting in that file.
const clearStoredPhotos = () => {
  const receipts = getReceipts().map(r => ({
    ...r,
    photos: [],
    shipmentReviews: (Array.isArray(r.shipmentReviews) ? r.shipmentReviews : []).map(rev => ({ ...rev, photos: [] })),
  }));
  saveReceipts(receipts);

  const purchases = getPurchases().map(p => ({ ...p, image: null }));
  savePurchases(purchases);
};

const backupData = async () => {
  const data = {
    schemaVersion: 2,
    app: "BookNest",
    books:      getBooks(),
    sales:      getSales(),
    receipts:   getReceipts(),
    purchases:  getPurchases(),
    eodCheck:   localStorage.getItem(".eod_check") || localStorage.getItem("booknest.eod_check") || null,
    exportedAt: new Date().toISOString(),
  };
  const blob    = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href     = url;
  a.download = `booknest-transfer-backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Photos are the biggest thing filling up localStorage. Now that they're
  // safely inside the backup file that was just downloaded, offer to clear
  // them out of the browser's storage to free up room.
  const photoCount = countStoredPhotos();
  if (photoCount > 0) {
    const { confirmed } = await openActionDialog({
      title: "Free up storage?",
      message:
        `Your backup file was downloaded — it includes all ${photoCount} photo(s) currently saved ` +
        `(receipt, shipment-review, and box photos). Remove those photos from this browser's storage now ` +
        `to free up room? They'll stay safe inside the backup file, and you can restore from it anytime ` +
        `if you need the photos back here.`,
      confirmText: "Remove Photos",
      cancelText: "Keep Photos",
      iconText: "⬇",
    });
    if (confirmed) {
      clearStoredPhotos();
      await showNotice("Photos cleared from this browser's storage. They're still in your downloaded backup.", "Storage Freed");
      location.reload();
    }
  }
};

const restoreData = (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.books) || !Array.isArray(data.sales)) {
        showNotice("Invalid backup file.", "Restore Failed");
        return;
      }
      const { confirmed } = await openActionDialog({
        title: "Restore backup?",
        message: "This will replace all current data on this computer. Continue?",
        confirmText: "Restore",
        cancelText: "Cancel",
        iconText: "!",
      });
      if (!confirmed) return;
      saveBooks(data.books);
      saveSales(data.sales);
      saveReceipts(Array.isArray(data.receipts) ? data.receipts : []);
      savePurchases(Array.isArray(data.purchases) ? data.purchases : []);
      if (typeof data.eodCheck === "string" && data.eodCheck) {
        localStorage.setItem(".eod_check", data.eodCheck);
      }
      await showNotice("Data restored successfully.", "Restore Complete");
      location.reload();
    } catch { showNotice("Could not read backup file.", "Restore Failed"); }
  };
  reader.readAsText(file);
};

// ── End of Day Summary ────────────────────────────────────────────────────────
const checkEndOfDay = () => {
  const lastCheck = localStorage.getItem("booknest.eod_check");
  const today     = new Date().toDateString();
  if (lastCheck === today) return;

  const books      = getBooks();
  const sales      = getSales();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === today && !s.voided);
  if (todaySales.length === 0) return;

  const revenue = sum(todaySales, s => getSaleTotal(s, books));
  const units   = sum(todaySales, s => s.quantity);

  const confirmed = confirm(
    `📚 End of Day Summary — ${today}\n\n` +
    `Orders: ${todaySales.length}\n` +
    `Books sold: ${units}\n` +
    `Revenue: ${currency(revenue)}\n\n` +
    `Click OK to dismiss.`
  );
  if (confirmed) localStorage.setItem("booknest.eod_check", today);
};

// ── Reports ───────────────────────────────────────────────────────────────────
const initReports = () => {
  const summaryGrid  = document.getElementById("summaryGrid");
  const lowStockRows = document.getElementById("lowStockRows");
  if (!summaryGrid && !lowStockRows) return;

  const books = getBooks();
  const sales = getSales().filter(s => !s.voided);
  const receipts = getReceipts();
  const useReceipts = receipts.length > 0;

  const totalRevenue   = useReceipts
    ? sum(receipts.filter(r => getReceiptFlags(r).paid && !getReceiptFlags(r).refunded), r => sum(r.items || [], i => Number(i.qty * i.unitPrice) || 0))
    : sum(sales, s => getSaleTotal(s, books));
  const totalOrders    = useReceipts ? receipts.length : sales.length;
  const totalBooksSold = useReceipts
    ? sum(receipts, r => sum(r.items || [], i => Number(i.qty) || 0))
    : sum(sales, s => s.quantity);
  const inventoryValue = sum(books, b => b.price * b.stock);

  if (summaryGrid) {
    summaryGrid.innerHTML = [
      { label: "Total Revenue",   value: currency(totalRevenue) },
      { label: "Orders",          value: totalOrders },
      { label: "Books Sold",      value: totalBooksSold },
      { label: "Average Order",   value: currency(totalRevenue / Math.max(totalOrders, 1)) },
      { label: "Inventory Value", value: currency(inventoryValue) },
    ].map(item => `
      <div class="summary-card">
        <h4>${item.label}</h4>
        <div class="value">${item.value}</div>
      </div>`).join("");
  }

  if (lowStockRows) {
    lowStockRows.innerHTML = books.filter(b => b.stock < 5).map(book => `
      <tr>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td><span class="tag ${book.stock === 0 ? "out" : "low"}">${book.stock}</span></td>
      </tr>`).join("") || `<tr><td colspan="3" class="muted">No low stock items 🎉</td></tr>`;
  }
};

// ── Init ──────────────────────────────────────────────────────────────────────
const safeRun = (fn, name) => {
  try { fn(); } catch (err) { console.error(`[BookNest] ${name} failed:`, err); }
};

const renderSellerWorkspace = () => {
  migrateStorage();
  ensureSeedData();
  safeRun(initDashboard,     "initDashboard");
  safeRun(initInventory,     "initInventory");
  safeRun(initSales,         "initSales");
  safeRun(initReceiptModal,  "initReceiptModal");
  safeRun(initReports,       "initReports");
  safeRun(initReceiptHistory,"initReceiptHistory");
};

// Render from the local cache immediately. Supabase refreshes in the background
// and the same workspace is refreshed when the cloud snapshot arrives. This
// removes the old 5–10 second blank/loading wait on seller pages.
const init = () => {
  renderSellerWorkspace();
  window.addEventListener("booknest-cloud-ready", () => {
    requestAnimationFrame(() => renderSellerWorkspace());
  }, { once: true });
  // Keep seller pages aligned with the shared Supabase snapshot.
  setInterval(async () => {
    if (window.BookNestCloud?.refresh) {
      try {
        await window.BookNestCloud.refresh();
        requestAnimationFrame(() => renderSellerWorkspace());
      } catch (e) {
        console.warn('[BookNest] Seller cloud refresh failed', e);
      }
    }
  }, 10000);
};

document.addEventListener("DOMContentLoaded", init);