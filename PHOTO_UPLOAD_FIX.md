# BookNest Photo Upload Fix

Fixed Add Books and Edit Book photo uploads for phones.

- Camera/gallery images are compressed in the browser before being stored in the shared Supabase JSON snapshot.
- Maximum image dimension is 800px and JPEG quality is 0.62 to keep payloads manageable.
- Up to 8 photos per physical book are still supported.
- Photo processing completes before Save is enabled.
- Supabase logs the approximate payload size and reports the exact cloud-save error in the browser console.

The old raw FileReader/base64 upload path was the likely reason large phone photos resulted in “Supabase did not confirm” while smaller desktop images could work.
