# 🆘 TROUBLESHOOTING GUIDE

## If Something Isn't Working

Use this guide to figure out what's wrong and how to fix it.

---

## 🔍 DEBUGGING: Open Browser Console

**Before trying anything, check for error messages:**

### Windows:
- Press **F12** to open Developer Tools
- Click "Console" tab
- Look for RED text (errors)
- Screenshot any red errors

### Mac:
- Press **Cmd + Option + I** 
- Click "Console" tab
- Look for RED text (errors)

---

## BOOKS & SHOP PROBLEMS

### ❌ Can't add books

**Symptom:** "Add Book" button doesn't work or shows error

**Check List:**
- [ ] Filled in at least Title field
- [ ] Price field has a number (0 or higher)
- [ ] Stock field has a number (0 or higher)
- [ ] Click "+ Add Book" button

**If still doesn't work:**

1. **Refresh page:** Press F5 or Cmd+R
2. **Hard refresh:** Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check console:** F12 → Console → Look for errors
4. **Try different browser:** Chrome, Firefox, Safari, Edge

---

### ❌ Books not showing in inventory list

**Symptom:** I added books but don't see them in the table

**Solution:**
1. Scroll down on Inventory page
2. The table is below the "Add Book" form
3. If still not there: Hard refresh (Ctrl+Shift+R)
4. Check if book has Stock > 0 (otherwise hidden)

---

### ❌ Added book but can't find "Add Shop" button

**Symptom:** Can see book in table but no action buttons

**Solution:**
1. Scroll RIGHT in the table (use arrow keys or swipe)
2. "Actions" column is at far right
3. Look for buttons like "📷 Photo", "🛒 In Shop", "Sold"
4. If you see "➕ Add Shop" - that's the one!

---

### ❌ Clicked "Add Shop" but book still doesn't appear in shop

**Symptom:** Button changed but book not visible to buyers

**Check List:**
- [ ] Stock is > 0
- [ ] Button shows "🛒 In Shop" (not "➕ Add Shop")
- [ ] Picture uploaded (helps but not required)
- [ ] Refresh "View Shop" page

**Debug:**
1. Go to "View Shop" tab
2. Search for book by name
3. If not there: Book might not be marked "In Shop"
4. Go back to Inventory
5. Find book and check if button says "🛒 In Shop"
6. If not, click it first

---

## PICTURE UPLOAD PROBLEMS

### ❌ Picture upload button doesn't work

**Symptom:** Click "📷 Photo" but nothing happens

**Solution:**
1. Make sure book is in inventory first
2. Try again with "📷 Photo" button
3. If file picker doesn't open, try:
   - Hard refresh page (Ctrl+Shift+R)
   - Different browser
   - Different image file

---

### ❌ Picture uploaded but doesn't show

**Symptom:** I uploaded a photo but it doesn't display

**Likely reasons:**
- Image file too large (try image under 5MB)
- Image format not supported (use JPG or PNG)
- Processing failed (try again with smaller file)

**Fix:**
1. Click "📷 Photo" again
2. Choose a smaller image file
3. Wait for thumbnail to appear
4. Refresh page if needed

---

## GCash PAYMENT SETUP PROBLEMS

### ❌ "Upload QR Code" button doesn't work

**Symptom:** Click button but file picker doesn't open

**Solution:**
1. Hard refresh page (Ctrl+Shift+R)
2. Wait for page to fully load
3. Try again
4. Try different browser

**If still broken:**
- Close browser completely
- Open browser again
- Go to Home → GCash Payment Setup
- Try uploading QR again

---

### ❌ QR code uploaded but preview doesn't show

**Symptom:** Selected image but no preview below button

**Likely causes:**
- Image file corrupt or not an image
- Image too large
- Browser cache issue

**Fix:**
1. Click "Remove" if it appears
2. Try with a different QR code image
3. Use JPG or PNG format only
4. Make sure file size < 5MB
5. Hard refresh page
6. Try again

---

### ❌ "Save GCash Details" button doesn't work

**Symptom:** Click Save but nothing happens

**Check:**
- [ ] Entered GCash phone number (at least 10 digits)
- [ ] Uploaded QR code image (or just use number alone)
- [ ] At least ONE of these is filled

**If still doesn't work:**
1. Try entering phone number again (clear and retype)
2. Try uploading QR code again  
3. Hard refresh page
4. Try again

---

### ❌ GCash details don't appear to buyers

**Symptom:** I saved GCash setup but buyers don't see it

**Check:**
1. Go to "View Shop" tab
2. Click "Payment info"
3. Should see your GCash number and QR code

**If not there:**
- Go back to Home → GCash Setup
- Enter phone number again
- Upload QR again
- Click Save
- Wait for confirmation popup

---

## CHECKOUT & PAYMENT PROBLEMS

### ❌ Buyer can't complete checkout

**Symptom:** Checkout process doesn't work or shows error

**Things to check:**
- [ ] At least ONE book has "🛒 In Shop" status
- [ ] Book stock is > 0
- [ ] Cart has items in it
- [ ] All checkout fields filled (name, contact, address)

**If buyer gets error:**
- Tell them to hard refresh: Ctrl+Shift+R
- Try different browser
- Clear browser cookies
- Try again

---

### ❌ Buyer sees checkout but GCash QR doesn't appear

**Symptom:** Buyer completes order but no QR shown

**Likely cause:** GCash setup wasn't saved

**Fix:**
1. Go to Admin Home → GCash Setup
2. Make sure phone number is entered
3. Make sure QR is uploaded
4. Click "Save GCash Details"
5. Get confirmation popup
6. Have buyer try checkout again

---

## DATA & STORAGE PROBLEMS

### ❌ Books disappeared!

**Symptom:** Had books in inventory but they're gone now

**Possible causes:**
- Cleared browser cache
- Browser storage full
- Different browser/device used

**Recovery:**
1. Check if you have backup file
2. If yes: Restore from backup
   - Go to Admin Home
   - Click "Restore from Backup"
   - Select backup file
   - All data returns

3. If no: 
   - Re-add books manually
   - Start downloading backups NOW!

---

### ❌ Pictures lost

**Symptom:** Books exist but pictures gone

**Why this happens:**
- Cleared browser cache
- Browser storage corrupted
- Different browser/computer

**Recovery:**
1. Restore backup if available
2. Re-upload pictures

**Prevent:** Download backup weekly!

---

### ❌ "Browser storage full" error

**Symptom:** Can't save or add books

**Cause:** Too much data stored

**Fix:**
1. Download backup (saves everything)
2. Go to browser settings → Clear cache
3. Choose "Cookies and site data"
4. Clear it
5. Come back and restore backup

---

## GENERAL PROBLEMS

### ❌ Page won't load / Blank screen

**Solution:**
1. Refresh page (F5 or Cmd+R)
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cookies
   - Settings → Privacy → Clear browsing data
4. Close browser completely
5. Reopen and try again

---

### ❌ Buttons don't respond

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Wait 5 seconds for page to fully load
3. Try clicking again
4. Try different browser
5. Try on different device/computer

---

### ❌ Slow page loading

**Solution:**
1. Check internet connection
2. Close other browser tabs
3. Clear browser cache
4. Try different browser
5. Try on different device

---

### ❌ Error message in console

**What to do:**
1. Open Console (F12)
2. Screenshot the red error text
3. Note what you were doing
4. Try one of the solutions below

**Common fixes:**
- Hard refresh (Ctrl+Shift+R)
- Clear cache
- Try different browser
- Close and reopen browser

---

## BEFORE ASKING FOR HELP

Please provide:
1. **What were you trying to do?**
   - Example: "Trying to upload GCash QR code"

2. **What happened?**
   - Example: "Button doesn't work"

3. **What did you see?**
   - Take screenshot
   - Check console (F12) for errors
   - Screenshot any error messages

4. **What device/browser?**
   - Chrome, Firefox, Safari, Edge
   - Windows, Mac, Linux
   - Desktop, Mobile

5. **Have you tried?**
   - Refreshing page
   - Hard refresh (Ctrl+Shift+R)
   - Different browser
   - Clearing cache

---

## QUICK FIX CHECKLIST

Try these in order (fixes 80% of issues):

- [ ] Refresh page (F5)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Close and reopen browser
- [ ] Restart computer
- [ ] Check console (F12) for errors
- [ ] Download and restore backup

---

## WHEN ALL ELSE FAILS

1. **Download backup:**
   - Go to Admin Home
   - Click "Download Full Transfer Backup"
   - Save file somewhere safe

2. **Note what happened:**
   - What were you doing
   - What error appeared
   - Screenshot or video

3. **Get help from developer:**
   - Show them the backup file
   - Show them the error screenshot
   - Explain what you were doing

---

## PREVENTION

Do these to avoid problems:

✅ **Weekly backup:**
- Download backup every week
- Store in multiple places
- Label with date

✅ **Regular saves:**
- After adding books
- After uploading pictures
- After setting up GCash

✅ **Test before live:**
- Add test book
- Upload test picture
- Test checkout with GCash
- Make sure everything works

✅ **Use same browser:**
- Data is stored per-browser
- Use same browser/computer
- Don't switch browsers

✅ **Don't clear cache:**
- Even if asked to "clean up"
- Cache clearing = picture loss
- Only clear if having major issues

---

## 📞 SUMMARY

**Most issues fixed by:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cookies
3. Try different browser
4. Restore from backup

**Keep working even if:**
- Something breaks (backup exists)
- Data lost (backup exists)
- Don't know what to do (follow guides)

**Contact developer if:**
- Nothing works
- Consistent errors
- Need special help
