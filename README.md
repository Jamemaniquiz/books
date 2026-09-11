# 📚 BookNest Pre-Loved Books Shop System

A complete inventory, shop, and payment management system for selling second-hand books online.

---

## 🎯 What This Does

BookNest is an all-in-one system that lets you:

✅ **Add & Manage Books**
- Create inventory of books with details (title, author, price, condition)
- Upload pictures of book covers
- Track stock levels
- Tag books by batch/box

✅ **Control Your Shop**
- Choose which books are visible to buyers
- Display books with pictures and descriptions
- Show real-time stock availability
- Simple, clean shopping interface

✅ **Accept Payments via GCash**
- Sellers set up GCash QR code
- Buyers scan QR or send money directly
- Instant payment to your GCash account
- Order ID used as payment reference

✅ **Track Orders & Sales**
- See buyer orders and payment status
- Record sales and generate receipts
- Automatic receipt generation
- Sales history and statistics

✅ **Back Up Your Data**
- Download complete backup of all data
- Restore anytime on same or different device
- Nothing is lost if something goes wrong
- All book pictures included in backup

---

## 🚀 Quick Start (5 Minutes)

### For Sellers:

1. **Set up GCash** (Admin Home)
   - Enter GCash phone number
   - Upload GCash QR code
   - Save details

2. **Add Books** (Inventory & Sales)
   - Fill in book details
   - Click "Add Book"
   - Upload book cover picture

3. **Publish to Shop** (Inventory table)
   - Click "➕ Add Shop" button
   - Now buyers can see & buy it

4. **Get Paid** (Instantly via GCash)
   - Buyers send payment to your GCash
   - Money arrives instantly
   - Mark order as paid in admin

### For Buyers:

1. **Browse Shop** (View Shop)
   - See books with pictures and prices
   - Search by title or author

2. **Add to Cart**
   - Click "Add to cart" on books

3. **Checkout**
   - Enter name, contact, address
   - Choose payment method
   - See seller's GCash QR code

4. **Pay**
   - Scan GCash QR code
   - Send payment with Order ID as reference
   - Done!

---

## 📁 Files & What They Do

### HTML Pages:
- `admin.html` - Seller admin dashboard (home/overview)
- `inventory.html` - Manage books and record sales
- `receipt-history.html` - View past sales receipts
- `orders.html` - Track buyer orders
- `shop.html` - Public shop for buyers
- `booknest-bookstore.html` - Alternative shop view
- `new-sale.html` - Record point-of-sale sales
- `scan-receipt.html` - Scan receipts

### JavaScript:
- `app.js` - Main application logic and functions
- `admin-gate.js` - Admin authentication/access control

### Styles:
- `styles.css` - All styling for admin and shop

### Documentation:
- `GETTING_STARTED.md` - Quick start guide
- `HOW_TO_ADD_BOOKS.md` - Step-by-step book adding
- `GCASH_SETUP.md` - GCash payment setup
- `SYSTEM_GUIDE.md` - Complete feature guide
- `QUICK_START.md` - Quick reference checklist
- `TROUBLESHOOTING.md` - Problem solving guide

---

## 💾 Data Storage

**Where is my data stored?**
- Browser localStorage (secure local storage on your computer)
- NOT cloud-based (stays on your device)
- NOT temporary (persists across browser restarts)
- Survives page refreshes and browser closing

**What's stored:**
- All books with details and pictures
- All sales and receipts
- All buyer orders
- All box/batch information
- GCash payment settings

**How much can I store:**
- 5-10 MB per browser
- Typically 50-100+ book pictures
- Years worth of sales data

**Important:**
- ⚠️ Data is per-browser (Chrome ≠ Firefox)
- ⚠️ Data is per-device (desktop ≠ mobile)
- ✅ Download backups weekly to be safe
- ✅ Backups include everything

---

## 🔐 Security & Privacy

**What's secure:**
- Data stored locally on your device
- Not sent to any server
- Not accessible to anyone else
- Private and confidential

**Backups:**
- Downloaded as JSON file
- Can be stored securely
- Can be transferred to new device
- Only you have access

**GCash Info:**
- QR code needed by buyers anyway
- Phone number needed for receiving payment
- No sensitive data stored

---

## 📊 Key Features

### Book Management:
- Add unlimited books
- Edit book details anytime
- Upload cover pictures (automatically compressed)
- Set price, stock, condition, type, genre
- Tag with box/batch for tracking
- Delete books anytime

### Shop Visibility:
- Books in inventory don't automatically show
- Use "➕ Add Shop" button to make visible
- Use "🛒 In Shop" button to hide
- Keep inventory private, show only what you want to sell

### Picture Storage:
- Upload JPG or PNG
- Auto-compressed to save space
- Saved to browser storage
- Survives page refreshes
- Included in backups

### Stock Management:
- Track quantity available
- Stock decreases on sales
- Books with 0 stock don't display
- Set to negative if needed

### Payment Processing:
- GCash QR code display
- GCash phone number
- Automatic order ID generation
- Payment method selection by buyer
- Pending/Paid/Shipped status tracking

### Sales Recording:
- Manual sale entry
- Automatic receipt generation
- Print or save receipts
- Sales history and totals
- Profit/loss calculations

### Receipts & History:
- Printable receipts for sales
- Saved receipts for reference
- Sales summary and statistics
- Revenue tracking

---

## 🛠️ Troubleshooting

**Most issues fixed by:**
1. Refresh page (F5)
2. Hard refresh (Ctrl+Shift+R)
3. Clear browser cookies
4. Try different browser
5. Restore from backup

**For detailed help:**
- See `TROUBLESHOOTING.md` file
- Check browser console (F12)
- Look for error messages

---

## 📱 Browser Compatibility

Works best on:
- ✅ Chrome (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (with limitations)

**Note:** Data is browser-specific. Use same browser for best experience.

---

## 🔄 Syncing Between Devices

**To transfer to new computer:**
1. Download backup on old computer
2. Install BookNest on new computer
3. Go to Admin → Restore from Backup
4. Select backup file
5. Everything transfers over!

**Books, pictures, sales, settings all transfer.**

---

## 💡 Tips & Best Practices

### For Better Sales:
- ✅ Upload clear, well-lit book pictures
- ✅ Write accurate descriptions
- ✅ Keep prices competitive
- ✅ Update stock levels regularly
- ✅ Use consistent box names for tracking

### For Data Safety:
- ✅ Download backup every week
- ✅ Store backup files in multiple places
- ✅ Label backups with dates
- ✅ Never clear browser cache lightly
- ✅ Keep same browser/computer

### For Shop Success:
- ✅ Test shop before going live
- ✅ Make sure GCash QR works
- ✅ Verify buyer checkout process
- ✅ Monitor orders regularly
- ✅ Respond to buyers quickly

---

## 📞 Support

**If something isn't working:**

1. **Check guides first:**
   - TROUBLESHOOTING.md
   - HOW_TO_ADD_BOOKS.md
   - GCASH_SETUP.md

2. **Try basic fixes:**
   - Refresh page
   - Hard refresh
   - Clear cache
   - Different browser

3. **Check console:**
   - Press F12
   - Click "Console"
   - Look for red errors
   - Screenshot error message

4. **Get help:**
   - Contact developer with:
     - What you were trying to do
     - What error appeared
     - Screenshots/video
     - Browser and device info

---

## 🎉 Getting Started

1. **Read:** `GETTING_STARTED.md`
2. **Set up GCash:** `GCASH_SETUP.md`
3. **Add books:** `HOW_TO_ADD_BOOKS.md`
4. **Test shop:** `View Shop` button
5. **Download backup:** Admin Home button
6. **Start selling!**

---

## 📈 Growth Tips

As your business grows:

- Use backups to migrate to new devices
- Bulk paste for adding many books at once
- Use box names to track profitability
- Monitor sales statistics
- Keep prices competitive
- Take quality photos
- Respond to customer inquiries
- Request feedback from buyers

---

## ✨ Features at a Glance

| Feature | Details |
|---------|---------|
| Books | Unlimited, with pictures |
| Shop | Visible only to buyers when you choose |
| Pictures | Auto-compressed, stored locally |
| Payment | GCash QR code + phone number |
| Orders | Tracked with status (pending/paid/shipped) |
| Receipts | Auto-generated, printable |
| Stock | Real-time tracking |
| Backups | Download JSON with everything |
| Restore | One-click restore from backup |
| Mobile | Mostly supported |
| Offline | Works without internet (some features) |

---

## 🚀 Ready to Start?

1. **Open admin.html** → See admin dashboard
2. **Set up GCash** → Enable payments
3. **Add your first book** → Go to Inventory
4. **Upload picture** → Make it look good
5. **Add to shop** → Make it visible
6. **View as buyer** → See how it looks
7. **Download backup** → Stay safe
8. **Start selling!** → Success! 🎉

---

## 📝 License & Usage

BookNest is provided as-is for personal and commercial use.
Feel free to modify, extend, and customize for your needs.

---

## 🎓 Documentation Files

- **GETTING_STARTED.md** - Start here!
- **QUICK_START.md** - Quick checklist
- **HOW_TO_ADD_BOOKS.md** - Detailed book adding guide
- **GCASH_SETUP.md** - Payment setup guide
- **SYSTEM_GUIDE.md** - Complete feature reference
- **TROUBLESHOOTING.md** - Problem solving

---

## 📝 Version Info

**BookNest v2.0** - September 2026

- Full inventory management
- Online shop with pictures
- GCash payment integration
- Order tracking
- Receipt generation
- Backup & restore
- Mobile responsive

---

**Happy selling!** 📚💰

For questions, issues, or feature requests, check the documentation guides first!


## Shared-device sync fix
The current build syncs each BookNest data key independently. A second device with empty localStorage will download existing Supabase records instead of overwriting them, and missing optional cloud keys are seeded only when that specific key is absent. The storefront also refreshes the shared snapshot periodically.


## Auto-refresh behavior (2026-09-11)
BookNest no longer polls seller/store pages on a timer. Pages render once on load and update only when Supabase Realtime reports an actual shared-data change. Manual Refresh buttons remain available where provided. The cart countdown remains a local 1-second timer because it updates the hold timer, not the page.
