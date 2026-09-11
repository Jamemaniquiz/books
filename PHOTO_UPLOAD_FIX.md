# BookNest Photo Upload Fix

Fixed Add Books and Edit Book photo saving for phones and large existing inventories.

- Camera/gallery images are compressed in the browser before being stored locally.
- Book photos are normalized to a smaller 480px JPEG for mobile-friendly storage.
- Up to 8 photos per physical book are still supported.
- The shared `.books` Supabase snapshot is now gzip-compressed before upload, greatly reducing the request size when many books contain photos.
- Cloud compression is transparent: other BookNest pages still receive the normal `.books` array.
- Existing uncompressed cloud snapshots remain readable.
- Conditions now use **Brand New** as the single new-book condition, plus **Pre Loved**, **Damaged**, and **Remaindered**.
- `logo.png` is registered as the site favicon and Apple touch icon.
