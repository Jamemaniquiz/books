// ============================================================
// BookNest cloud data layer — Supabase
// ============================================================
(function () {
  "use strict";

  // ============================================================
  // SUPABASE CONNECTION
  // ============================================================
  const SUPABASE_URL =
    "https://ryyhsbkuukbtflcetcn.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Y5uk8FMgr15vEiqy5bBq3g_X1cXbKmQ";

  const CLOUD_TABLE = "booknest_data";

  const KEYS = [
    ".books",
    ".sales",
    ".receipts",
    ".purchases",
    ".sellerPayment",
    ".shop_orders",
  ];

  // ============================================================
  // CHECK SUPABASE
  // ============================================================
  const hasConfig = () =>
    typeof window.supabase !== "undefined" &&
    typeof SUPABASE_URL === "string" &&
    typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_");

  if (!hasConfig()) {
    console.warn(
      "[BookNest] Supabase is not configured. Using local browser storage."
    );

    window.BookNestCloud = {
      enabled: false,
      ready: Promise.resolve(false),
      save: async () => false,
      pull: async () => false,
      pushLocalData: async () => false,
      flush: async () => true,
    };

    return;
  }

  // ============================================================
  // CREATE SUPABASE CLIENT
  // ============================================================
  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );

  // ============================================================
  // LOCAL STORAGE
  // ============================================================
  const readLocal = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch (error) {
      console.warn("[BookNest] Could not read", key, error);
      return null;
    }
  };

  const writeLocal = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("[BookNest] Could not cache", key, error);
    }
  };

  // ============================================================
  // GET DATA FROM SUPABASE
  // ============================================================
  async function getCloudRows() {
    const { data, error } = await client
      .from(CLOUD_TABLE)
      .select("key,value,updated_at")
      .in("key", KEYS);

    if (error) {
      throw error;
    }

    return data || [];
  }

  // ============================================================
  // SAVE DATA TO SUPABASE
  // ============================================================
  // Writes are queued so rapid actions (create/edit/delete/restore) cannot
  // race each other. This also gives Restore a reliable way to wait until
  // every restored key has reached Supabase before reloading the page.
  let saveQueue = Promise.resolve(true);
  let lastSaveOk = true;

  async function upsertRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return true;
    const payload = rows
      .filter(row => row && KEYS.includes(row.key))
      .map(row => ({
        key: row.key,
        value: row.value,
        updated_at: new Date().toISOString(),
      }));
    if (!payload.length) return true;

    try {
      const { error } = await client.from(CLOUD_TABLE).upsert(payload);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[BookNest] Supabase batch save failed:', error);
      return false;
    }
  }

  function save(key, value) {
    if (!KEYS.includes(key)) return Promise.resolve(false);

    const write = () => upsertRows([{ key, value }]);
    const result = saveQueue.then(write, write);
    saveQueue = result.then(
      ok => { lastSaveOk = ok !== false; return ok; },
      () => { lastSaveOk = false; return false; }
    );
    return result;
  }

  // Save several datasets in ONE Supabase request. Restore uses this so six
  // datasets do not become six slow network round-trips.
  function saveMany(entries) {
    const write = () => upsertRows(entries);
    const result = saveQueue.then(write, write);
    saveQueue = result.then(
      ok => { lastSaveOk = ok !== false; return ok; },
      () => { lastSaveOk = false; return false; }
    );
    return result;
  }

  async function flush() {
    const ok = await saveQueue;
    return ok !== false && lastSaveOk;
  }

  // Never let a broken/offline Supabase connection hold the whole app hostage.
  // LocalStorage remains the immediate source for page rendering.
  async function withTimeout(promise, ms = 5000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase sync timed out')), ms))
    ]);
  }

  // ============================================================
  // DOWNLOAD DATA FROM SUPABASE
  // ============================================================
  async function getCloudRowsWithTimeout(ms = 5000) {
    return withTimeout(getCloudRows(), ms);
  }

  function mergeRecords(local, cloud) {
    if (!Array.isArray(local) || !Array.isArray(cloud)) return cloud;
    const result = [];
    const seen = new Set();
    for (const item of [...local, ...cloud]) {
      const id = item && item.id != null ? String(item.id) : null;
      const key = id ? `id:${id}` : `raw:${JSON.stringify(item)}`;
      if (seen.has(key)) {
        // Cloud is authoritative for an existing record. Replace the local
        // copy in-place rather than creating duplicates.
        const index = result.findIndex(x => x && x.id != null && String(x.id) === id);
        if (id && index >= 0) result[index] = item;
        continue;
      }
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  async function pull() {
    try {
      const rows = await getCloudRowsWithTimeout();
      const byKey = Object.fromEntries(rows.map((row) => [row.key, row]));

      // Hydrate locally first and collect any cloud writes into ONE request.
      // Never replace useful local data with an empty cloud value.
      const cloudWrites = [];
      for (const key of KEYS) {
        const cloudRow = byKey[key];
        const local = readLocal(key);

        if (!cloudRow) {
          if (local !== null) cloudWrites.push({ key, value: local });
          continue;
        }

        const cloudValue = cloudRow.value;
        const localIsUseful = Array.isArray(local)
          ? local.length > 0
          : !!(local && typeof local === 'object' && Object.keys(local).length > 0);
        const cloudIsEmpty = Array.isArray(cloudValue)
          ? cloudValue.length === 0
          : cloudValue == null || (typeof cloudValue === 'object' && Object.keys(cloudValue).length === 0);

        if (localIsUseful && cloudIsEmpty) {
          cloudWrites.push({ key, value: local });
        } else if (Array.isArray(local) && Array.isArray(cloudValue)) {
          const merged = mergeRecords(local, cloudValue);
          writeLocal(key, merged);
          cloudWrites.push({ key, value: merged });
        } else {
          writeLocal(key, cloudValue);
        }
      }

      if (cloudWrites.length) await withTimeout(saveMany(cloudWrites), 7000);
      console.log("[BookNest] Supabase sync complete.");
      window.dispatchEvent(new CustomEvent("booknest-cloud-ready"));
      return true;
    } catch (error) {
      console.error("[BookNest] Supabase initial sync failed", error);
      window.dispatchEvent(new CustomEvent("booknest-cloud-ready", { detail: { offline: true, error } }));
      return false;
    }
  }

  // ============================================================
  // UPLOAD ALL LOCAL DATA
  // ============================================================
  async function pushLocalData() {
    const entries = KEYS
      .map(key => ({ key, value: readLocal(key) }))
      .filter(row => row.value !== null);
    return withTimeout(saveMany(entries), 10000);
  }

  // ============================================================
  // MAKE BOOKNEST CLOUD AVAILABLE
  // ============================================================
  window.BookNestCloud = {
    enabled: true,
    client: client,
    ready: pull(),
    save: save,
    saveMany: saveMany,
    pull: pull,
    pushLocalData: pushLocalData,
    flush: flush,
  };
})();