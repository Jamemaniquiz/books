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
  async function save(key, value) {
    if (!KEYS.includes(key)) {
      return false;
    }

    try {
      const { error } = await client
        .from(CLOUD_TABLE)
        .upsert({
          key: key,
          value: value,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(
        "[BookNest] Supabase save failed for",
        key,
        error
      );

      return false;
    }
  }

  // ============================================================
  // DOWNLOAD DATA FROM SUPABASE
  // ============================================================
  async function pull() {
    try {
      const rows = await getCloudRows();

      const byKey = Object.fromEntries(
        rows.map((row) => [row.key, row])
      );

      // If Supabase is empty but this browser already has
      // BookNest data, upload the existing data first.
      const cloudHasData = rows.length > 0;

      if (!cloudHasData) {
        console.log(
          "[BookNest] Supabase is empty. Uploading existing local data..."
        );

        for (const key of KEYS) {
          const local = readLocal(key);

          if (local !== null) {
            await save(key, local);
          }
        }
      } else {
        // Supabase already contains data.
        // Load it into this browser.
        for (const key of KEYS) {
          if (
            Object.prototype.hasOwnProperty.call(byKey, key)
          ) {
            writeLocal(key, byKey[key].value);
          }
        }
      }

      console.log("[BookNest] Supabase sync complete.");

      window.dispatchEvent(
        new CustomEvent("booknest-cloud-ready")
      );

      return true;
    } catch (error) {
      console.error(
        "[BookNest] Supabase initial sync failed",
        error
      );

      // Keep BookNest working with local storage if
      // Supabase is temporarily unavailable.
      window.dispatchEvent(
        new CustomEvent("booknest-cloud-ready", {
          detail: {
            offline: true,
          },
        })
      );

      return false;
    }
  }

  // ============================================================
  // UPLOAD ALL LOCAL DATA
  // ============================================================
  async function pushLocalData() {
    for (const key of KEYS) {
      const local = readLocal(key);

      if (local !== null) {
        await save(key, local);
      }
    }

    return true;
  }

  // ============================================================
  // MAKE BOOKNEST CLOUD AVAILABLE
  // ============================================================
  window.BookNestCloud = {
    enabled: true,
    client: client,
    ready: pull(),
    save: save,
    pull: pull,
    pushLocalData: pushLocalData,
  };
})();