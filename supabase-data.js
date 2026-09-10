// ============================================================
// BookNest cloud data layer — Supabase
// Keeps the existing BookNest localStorage-based code working,
// while syncing the important data to Supabase so the same data
// can be seen from different devices/browsers.
// ============================================================
(function () {
  "use strict";

  const CLOUD_TABLE = "booknest_data";
  const KEYS = [
    ".books",
    ".sales",
    ".receipts",
    ".purchases",
    ".sellerPayment",
    ".shop_orders",
  ];

  const hasConfig = () =>
    typeof window.supabase !== "undefined" &&
    typeof window.BOOKNEST_SUPABASE_URL === "string" &&
    typeof window.BOOKNEST_SUPABASE_ANON_KEY === "string" &&
    window.BOOKNEST_SUPABASE_URL.startsWith("https://") &&
    !window.BOOKNEST_SUPABASE_URL.includes("PASTE_YOUR") &&
    !window.BOOKNEST_SUPABASE_ANON_KEY.includes("PASTE_YOUR");

  if (!hasConfig()) {
    console.warn("[BookNest] Supabase is not configured yet. The site will continue using local browser storage.");
    window.BookNestCloud = {
      enabled: false,
      ready: Promise.resolve(false),
      save: async () => false,
      pull: async () => false,
      pushLocalData: async () => false,
    };
    return;
  }

  const client = window.supabase.createClient(
    window.BOOKNEST_SUPABASE_URL,
    window.BOOKNEST_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const readLocal = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch (_) {
      return null;
    }
  };

  const writeLocal = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("[BookNest] Could not cache", key, e);
    }
  };

  async function getCloudRows() {
    const { data, error } = await client
      .from(CLOUD_TABLE)
      .select("key,value,updated_at")
      .in("key", KEYS);
    if (error) throw error;
    return data || [];
  }

  async function save(key, value) {
    if (!KEYS.includes(key)) return false;
    try {
      const { error } = await client.from(CLOUD_TABLE).upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("[BookNest] Supabase save failed for", key, e);
      return false;
    }
  }

  async function pull() {
    if (!hasConfig()) return false;
    try {
      const rows = await getCloudRows();
      const byKey = Object.fromEntries(rows.map(r => [r.key, r]));

      // First successful setup: if the cloud is empty but this browser has
      // existing BookNest data, upload it instead of destroying it.
      const cloudHasData = rows.length > 0;
      if (!cloudHasData) {
        for (const key of KEYS) {
          const local = readLocal(key);
          if (local !== null) await save(key, local);
        }
      } else {
        for (const key of KEYS) {
          if (Object.prototype.hasOwnProperty.call(byKey, key)) {
            writeLocal(key, byKey[key].value);
          }
        }
      }

      window.dispatchEvent(new CustomEvent("booknest-cloud-ready"));
      return true;
    } catch (e) {
      console.error("[BookNest] Supabase initial sync failed", e);
      // Keep local data usable if the network/database is temporarily down.
      window.dispatchEvent(new CustomEvent("booknest-cloud-ready", { detail: { offline: true } }));
      return false;
    }
  }

  async function pushLocalData() {
    for (const key of KEYS) {
      const local = readLocal(key);
      if (local !== null) await save(key, local);
    }
    return true;
  }

  window.BookNestCloud = {
    enabled: true,
    client,
    ready: pull(),
    save,
    pull,
    pushLocalData,
  };
})();
