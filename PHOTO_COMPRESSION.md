# BookNest image compression

Book photos, shop photos, GCash/payment proof photos, receipt/purchase photos, and the seller GCash QR are compressed in the browser before being stored.

The shared cloud snapshot layer also gzip-compresses sufficiently large datasets before writing them to Supabase JSONB. This reduces database storage and request size without changing how the rest of the app reads the data.

JPEG quality is balanced so payment screenshots remain readable while large camera images are reduced substantially.
