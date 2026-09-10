# 🆘 BookNest Help - Can't Put Books in Shop & Pictures Not Working

**STOP!** Before panicking, read this guide. 90% of issues are easy to fix.

---

## 🚨 QUICK FIX (Try This First!)

### Step 1: Use the Debug Tool
1. **Click** the **🔧 Debug** link in your navigation bar
2. You'll see diagnostic information about your books
3. Look for red/yellow warnings

### Step 2: Run Quick Fix
1. Scroll to **"Fix Tools"** section
2. Click **"✅ Make ALL Books Visible in Shop"**
3. If it says "✅ FIXED!" then:
   - Go to **Inventory & Sales**
   - Refresh the page
   - Go to **View Shop**
   - Your books should appear!

---

## 📋 What Should Happen (Step by Step)

### Adding a Book with Picture to Your Shop

**Step 1: Add a Book to Inventory**
```
✓ Go to "Inventory & Sales"
✓ Fill in Title, Author, Price, Stock
✓ Click "+ Add Book"
✓ See book appear in table below
```

**Step 2: Upload a Picture**
```
✓ Find book in inventory table
✓ Click "📷 Photo" button
✓ Select image file from computer
✓ See thumbnail appear in table
✓ Picture saved automatically
```

**Step 3: Put Book in Shop**
```
✓ Scroll right in inventory table
✓ Find book row and look at "Actions" column
✓ Click "➕ Add Shop" button
✓ Button changes to "🛒 In Shop" ✅
✓ See green success message
```

**Step 4: View Book in Shop**
```
✓ Click "View Shop" link at top
✓ Should see your book with picture!
✓ Book title, price, and picture all visible
```

---

## 🔍 Debug Troubleshooting

### Problem: "I see 0 books in shop status check"

**Cause**: `shopVisible` property not set correctly

**Fix**:
1. Go to **🔧 Debug** page
2. Scroll to **"Shop Visibility Status"** section
3. Click **"🔍 Check Visibility"** button
4. If it says "NO BOOKS IN SHOP!":
   - Scroll down to **"Fix Tools"**
   - Click **"✅ Make ALL Books Visible in Shop"**
   - Wait for success message
5. Go back to **View Shop** and refresh

### Problem: "Pictures not showing"

**Cause**: Pictures not uploaded OR pictures not saving

**Fix**:
1. Go to **🔧 Debug** page
2. Scroll to **"📚 Your Books in Storage"** section
3. Click **"🔄 Refresh"** button
4. Look at each book - does it say "✅ HAS PIC" or "❌ NO PIC"?
5. For books without pictures:
   - Go to **Inventory & Sales**
   - Click **"📷 Photo"** for that book
   - Select image
   - Verify thumbnail appears
6. Try uploading again with a smaller image (under 5 MB)

### Problem: "Toggle shop button not working"

**Cause**: Missing or broken `shopVisible` property

**Fix**:
1. Go to **🔧 Debug** page
2. Click **"🔧 Fix Books Missing shopVisible Property"**
3. Wait for success
4. Go to **Inventory & Sales** and refresh
5. Try clicking "Add Shop" again

### Problem: "GCash QR not showing on checkout"

**Cause**: GCash setup not complete

**Fix**:
1. Go to **🔧 Debug** page
2. Scroll to **"💳 GCash Setup Status"**
3. Click **"🔍 Check GCash"** button
4. If it says "NOT SET UP":
   - Go to **Admin Home**
   - Find **"💳 GCash Payment Setup"** section
   - Enter your GCash phone number
   - Upload QR code image
   - Click **"Save GCash Details"**
5. Go back to **Debug** and check again

---

## 📱 Browser Storage Info

### Why Books Disappear Sometimes
- **Reason 1**: You cleared browser cache/cookies
  - **Fix**: Use backup! (Admin Home → "Download Full Transfer Backup")
- **Reason 2**: Browser storage limit (5 MB)
  - **Fix**: Delete old photos or orders
- **Reason 3**: Data corrupted
  - **Fix**: Use Restore Backup button

### How to Backup Your Data
1. Go to **Admin Home**
2. Scroll to bottom
3. Click **"📥 Download Full Transfer Backup"**
4. Save the JSON file somewhere safe (Desktop/Google Drive)
5. You can restore anytime!

---

## 🎯 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Books not appearing in shop | Use Debug → "Make ALL Books Visible" |
| Pictures not uploading | Try smaller image, refresh browser |
| Can't click "Add Shop" button | Refresh inventory page (Ctrl+R) |
| GCash QR not showing | Complete GCash setup (see instructions above) |
| All data disappeared | Restore from backup JSON file |
| Storage full warning | Delete old receipts/photos |
| Strange button text | Hard refresh browser (Ctrl+Shift+R) |
| Entire site broken | Close browser → reopen, go to shop.html |

---

## 💡 Pro Tips

### Tip 1: Multiple Picture Formats Work
- ✅ PNG, JPG, JPEG, WebP, GIF
- ✅ Pictures auto-compressed to save space
- ✅ Can store 100+ pictures if compressed well
- ❌ Don't upload pictures bigger than 10 MB

### Tip 2: Book Pictures Stay Forever
- Pictures stored in browser localStorage
- Won't delete unless you clear cache
- Always use backups!
- Test: Go to Inventory, refresh page - picture still there

### Tip 3: Multiple Sellers Can't Share
- This BookNest is single-seller per browser
- Different browsers = different stores
- For multiple sellers: use different laptops or user accounts

### Tip 4: Check Console for Errors
- Press **F12** on keyboard
- Click **"Console"** tab
- Look for red error messages
- Share screenshot with support if stuck

---

## 🆘 Still Not Working?

### Step 1: Collect Debug Info
1. Go to **🔧 Debug** page
2. Scroll to **"💾 Storage Management"**
3. Click **"💾 Download Debug Data"**
4. A file will download

### Step 2: Check Browser Console
1. Press **F12**
2. Click **"Console"** tab
3. Take screenshot of any red errors
4. Look for messages starting with `[BookNest]`

### Step 3: Get Help
Share with support:
- Screenshot of Debug page status check
- Screenshot of Console (F12) errors
- Description of what you're trying to do
- Steps you already tried

---

## ⚡ Quick Reference Checklist

### Before Contacting Support, Verify:

- [ ] Browser is Chrome, Firefox, Safari, or Edge
- [ ] Cookies/cache not blocked
- [ ] Book appears in Inventory & Sales table
- [ ] Clicked "Add Shop" button (changes to "In Shop")
- [ ] Picture uploaded (📷 Photo button shows thumbnail)
- [ ] Refreshed browser (Ctrl+R) after changes
- [ ] Hard refreshed (Ctrl+Shift+R) if still broken
- [ ] No errors in Debug page
- [ ] GCash setup complete (if using GCash payment)
- [ ] Downloaded backup (just in case!)

---

## 🎓 Learning Path

### New to BookNest? Follow This Order:

1. **Read**: [GETTING_STARTED.md](GETTING_STARTED.md) - 5 min setup
2. **Do**: Add one test book in Inventory
3. **Read**: [HOW_TO_ADD_BOOKS.md](HOW_TO_ADD_BOOKS.md) - full walkthrough
4. **Do**: Upload a picture to your test book
5. **Do**: Click "Add Shop" to make it visible
6. **Do**: Go to View Shop and verify
7. **Read**: [GCASH_SETUP.md](GCASH_SETUP.md) - payment configuration
8. **Do**: Set up your GCash details
9. **Do**: Test a full checkout flow
10. **Read**: [SYSTEM_GUIDE.md](SYSTEM_GUIDE.md) - reference guide

### Troubleshooting:
- **Use**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Use**: 🔧 Debug page (this guide!)

---

## 🚀 Next Steps

1. **Open 🔧 Debug page** - check status
2. **Run fix if needed** - most fixes are one-click
3. **Refresh all pages** - Ctrl+R on each
4. **Test full flow** - add book → picture → shop → view
5. **Set up GCash** - for payment acceptance

**Everything should work now!** 

If not, use the Debug page to collect info and contact support.

Good luck with your book shop! 📚✨

---

**Questions about any specific issue? Read the detailed guides linked above or use the 🔧 Debug page for automated diagnostics.**
