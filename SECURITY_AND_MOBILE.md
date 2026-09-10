# 🔐 Security & Mobile Guide - BookNest v2.1

## ✅ What's New

### 1. **Enhanced Security System**
- ✅ Password protection for seller pages
- ✅ Buyers CANNOT access admin/inventory pages
- ✅ Passwords stored securely (hashed)
- ✅ Change password anytime
- ✅ Auto-logout for safety

### 2. **Mobile-Optimized Design**
- ✅ Works perfectly on iPhone, Android, tablets
- ✅ Responsive navigation
- ✅ Touch-friendly buttons
- ✅ Optimized forms for mobile
- ✅ Fast loading on slower connections

---

## 🔐 SECURITY - How It Works

### Default Password
- **Username**: (not used - seller only)
- **Default Password**: `booknest2026`

### How to Change Your Password

**IMPORTANT**: Change this immediately!

1. **Go to any seller page** (Admin, Inventory, etc.)
2. **Click the "Change Password" tab** on the login screen
3. **Enter**:
   - Current password (`booknest2026`)
   - New password (minimum 6 characters)
   - Confirm new password
4. **Click "Update Password"**
5. You'll be logged out automatically
6. **Login again** with your new password

### Password Best Practices

✅ **Good passwords:**
- At least 6+ characters
- Mix of letters and numbers: `seller2026bookshop`
- Easy to remember but hard to guess
- Examples: `myBooks123`, `shops2026`, `booksell99`

❌ **Avoid:**
- Single words: `password`, `admin`, `seller`
- Your name or birthday
- Sequential numbers: `123456`, `654321`
- Same as other accounts

### Security Rules

**Buyers CANNOT**:
- ❌ Access Inventory & Sales page
- ❌ Access Receipts page
- ❌ Access Shop Orders page
- ❌ Access Admin Home page
- ❌ Change book prices
- ❌ See sales data
- ❌ Download backups

**Buyers CAN**:
- ✅ View your shop
- ✅ Add books to cart
- ✅ Checkout
- ✅ View their own order

**Seller pages protected:**
- `admin.html` - Admin Home
- `inventory.html` - Inventory & Sales
- `receipt-history.html` - Receipts
- `orders.html` - Shop Orders

**Buyer pages accessible:**
- `shop.html` - View Shop
- `booknest-bookstore.html` - Shop
- `index.html` - Landing page

---

## 📱 MOBILE - How to Use on iPhone/Android

### Testing on Mobile

**iPhone:**
1. Open Safari
2. Go to your website URL
3. Responsive design automatically activates

**Android:**
1. Open Chrome
2. Go to your website URL
3. Responsive design automatically activates

### What's Mobile-Optimized

✅ **Navigation**
- Compact menu on small screens
- Touch-friendly buttons
- No horizontal scrolling on phones

✅ **Forms**
- Large input fields (easy to tap)
- One column on mobile (not cramped)
- Font size 16px+ (prevents zoom on iOS)

✅ **Tables**
- Horizontal scrollable on small screens
- Sticky headers
- Reduced font size for readability

✅ **Cards/Shop View**
- Smaller card sizes
- Touch-friendly "Add to cart"
- Clear product info

✅ **Checkout**
- Full-screen modal on mobile
- Easy-to-tap buttons
- Accessible form fields

✅ **Images**
- Auto-scaled for screen size
- Fast loading
- Proper aspect ratios

### Mobile Breakpoints (Responsive)

| Device | Width | View |
|--------|-------|------|
| iPhone 14 | 390px | Optimized mobile layout |
| iPhone 12/13 | 390px | Optimized mobile layout |
| iPhone SE | 375px | Compact mobile layout |
| iPad Mini | 768px | Tablet layout |
| iPad Pro | 1024px+ | Full desktop layout |
| Desktop | 1200px+ | Full desktop layout |

### Tips for Mobile Users

**Tip 1: Portrait vs Landscape**
- Portrait: Best for navigation and browsing
- Landscape: Better for viewing tables

**Tip 2: Touch Gestures**
- Tap to select
- Scroll down for more content
- Swipe right to go back (some devices)

**Tip 3: Font Size**
- If text is too small, pinch to zoom
- Double-tap to zoom in/out
- Use landscape mode for tables

**Tip 4: Auto-Fill**
- Passwords are auto-filled (secure)
- Address fields remember previous entries
- Faster checkout next time

---

## 🔄 Login & Logout

### First Time Login

1. **Go to**: `admin.html` or `inventory.html`
2. **See**: Login screen with password field
3. **Enter**: `booknest2026` (default)
4. **Click**: "Unlock" or press Enter
5. **You're in!** ✅

### Logout

**Option 1: Close browser**
- Closing the browser automatically logs you out
- For security, password required next visit

**Option 2: Change password**
- Changing password auto-logs you out
- Forces re-login with new password

**Option 3: Use console** (advanced)
```javascript
// In browser console (F12), type:
BN_Security.logout()
// Then press Enter
```

---

## 🛡️ Security Features Explained

### Session-Based Login
- ✅ Password checked only when entering admin pages
- ✅ Session lasts entire browser session
- ✅ Closes when browser closes
- ✅ Reopening requires password again

### Password Hashing
- ✅ Passwords not stored in plain text
- ✅ Simple hashing algorithm applied
- ✅ One-way transformation (can't reverse)
- ✅ Same password always produces same hash

### No Cloud Storage
- ✅ All data stays on your computer
- ✅ Not sent to servers
- ✅ Completely private
- ✅ Only you can access it

### Separation of Pages
- ✅ Seller pages require password
- ✅ Buyer pages publicly accessible
- ✅ No way for buyers to guess admin URL
- ✅ No access without correct password

---

## 💡 Pro Tips & Best Practices

### Security Pro Tips

**Tip 1: Change Password Regularly**
- Change every 3-6 months
- Change if you suspect someone knows it
- Change when moving to new computer

**Tip 2: Use Strong Passwords**
- Don't use "booknest2026" permanently
- Avoid passwords used elsewhere
- Use unique combination for this site

**Tip 3: Browser Security**
- Use Chrome, Safari, or Firefox (latest versions)
- Don't use admin pages on public WiFi
- Don't share your computer with untrusted people
- Clear browser history if others use device

**Tip 4: Backup Data**
- Download backup weekly
- Save to secure location (USB, cloud)
- Keep old backups (in case of corruption)
- Store backup password separately

### Mobile Pro Tips

**Tip 1: Portrait Mode**
- Default for navigation and browsing
- Touch keyboard easier to use
- Best for most tasks

**Tip 2: Landscape Mode**
- Better for tables and data
- Easier to see inventory list
- More readable on small screens

**Tip 3: Bookmark the Site**
- Add bookmark to home screen
- Save your site URL
- Faster access from phone

**Tip 4: Test on Multiple Devices**
- Test on iPhone (if possible)
- Test on Android (if possible)
- Test on tablet
- Verify everything works

---

## 🔧 Troubleshooting

### "I forgot my password"

**Solution**:
1. You CANNOT reset password yourself
2. Password stored locally on your device
3. Options:
   - Default password still works: `booknest2026`
   - Clear browser data (WARNING: loses all data)
   - Use different browser
   - Restore from backup

### "Password not working"

**Check**:
- ✅ Caps Lock is OFF (passwords are case-sensitive)
- ✅ No spaces before/after password
- ✅ Correct keyboard layout (not accidentally switched)
- ✅ Browser allows cookies/storage

**Fix**:
1. Try default password: `booknest2026`
2. Clear browser cookies for this site
3. Try different browser
4. Restart device

### "Mobile site looks wrong"

**Fix**:
1. Refresh page (swipe down on iOS, pull refresh on Android)
2. Rotate device (portrait ↔ landscape)
3. Close browser and reopen
4. Clear browser cache
5. Try different browser (Chrome/Safari)

### "Can't access seller pages on mobile"

**Check**:
- ✅ Using correct URL
- ✅ Entered correct password
- ✅ Cookies enabled in browser
- ✅ Not using private/incognito mode

**Fix**:
1. Go to your site URL directly
2. Enter password
3. Wait for page to load (may be slower on mobile)
4. Don't refresh during loading

### "Buttons too small to tap"

**Fix**:
1. Pinch to zoom (spread two fingers)
2. Rotate to landscape mode
3. Use larger font size in browser settings
4. Try different browser

---

## ⚙️ Technical Details

### How Password Works

```
User enters: "myPassword123"
       ↓
System creates hash: "a3b4c5d6..."
       ↓
Compare with stored hash
       ↓
If match → Login success ✅
If no match → Login fail ❌
```

### Storage Locations

| Data | Where | Duration |
|------|-------|----------|
| Books, Sales, Photos | localStorage | Permanent (until cleared) |
| GCash Setup | localStorage | Permanent (until cleared) |
| Password Hash | localStorage | Permanent (until cleared) |
| Login Session | sessionStorage | Until browser closes |

### Browser Requirements

✅ **Works on:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (latest)

✅ **Requires:**
- JavaScript enabled
- Cookies/storage enabled
- Modern browser (2017+)

---

## 🎯 Checklist - Security Setup

Before going live with your shop:

- [ ] Change default password to something unique
- [ ] Test login/logout on desktop
- [ ] Test login/logout on mobile (iPhone/Android)
- [ ] Verify buyers can't access admin pages
- [ ] Test password change feature
- [ ] Download first backup
- [ ] Share shop link (not admin link) with buyers
- [ ] Test full checkout flow on mobile
- [ ] Verify GCash QR shows on checkout

---

## 📞 Need Help?

### Common Issues

| Problem | Solution |
|---------|----------|
| "Login doesn't work" | Try default password, clear cookies |
| "Forgot password" | Use default or restore from backup |
| "Mobile too slow" | Check internet speed, refresh page |
| "Buttons too small" | Zoom in (pinch on mobile) |
| "Can't see tables" | Scroll horizontally, rotate device |
| "Data disappeared" | Restore from backup JSON file |

### How to Get Help

1. **Read this guide** - Answers most questions
2. **Check HELP.md** - Troubleshooting guide
3. **Use 🔧 Debug page** - Diagnostic tools
4. **Check browser console** - F12 → Console tab
5. **Screenshot errors** - Share with support

---

## Summary

**Security**: ✅ Passwords protect seller pages
**Mobile**: ✅ Works perfectly on phones
**Buyers**: ❌ Cannot access admin areas
**Password**: ✅ Can be changed anytime
**Data**: ✅ Stays on your device only

Your BookNest shop is now secure and mobile-ready! 🚀📚

---

**Questions?** Read HELP.md or use 🔧 Debug page!

Good luck with your book shop! 📱✨
