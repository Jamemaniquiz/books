# BookNest System Guide

## 📚 Adding Books & Pictures

### How to Add Books to Your Shop

1. **Go to Inventory**
   - Click "Inventory & Sales" in the admin area
   - Click the "Add Book" button to manually enter a book

2. **Enter Book Details**
   - Title: Book name
   - Author: Author name
   - Genre: Category (Fiction, Self-Help, etc.)
   - Price: Selling price in PHP
   - Stock: How many copies you have
   - Type: Paperback, Hardbound, etc.
   - Condition: New, Pre Loved, etc.
   - Box: Which batch/box this came from (optional)

3. **Upload a Picture**
   - Click the "📷 Photo" button next to each book
   - Select an image from your computer
   - The photo will be compressed and saved automatically

4. **Add to Shop**
   - Click the "➕ Add Shop" button to make the book visible to buyers
   - It will change to "🛒 In Shop" when active
   - Only books marked as "In Shop" will be visible to customers

### Picture Storage System

**Where are pictures saved?**
- All book pictures are stored in your browser's **localStorage** (a secure storage space in your web browser)
- Pictures are **NOT deleted** when you refresh the page or close the browser
- They stay saved until you manually delete them or clear your browser's cache

**How much can you store?**
- Most browsers allow 5-10 MB per website
- The system automatically compresses pictures to about 50-100 KB each
- You can typically store 50-100+ book pictures

**Backup your pictures:**
- Use the "Download Full Transfer Backup" button in the admin home page
- This saves everything (books, pictures, sales, receipts) as a JSON file
- You can restore it anytime on this computer or transfer to a new device

**Important:**
- ⚠️ Do NOT clear your browser's cache/storage or you'll lose pictures
- ⚠️ Pictures are device-specific (they won't transfer between browsers)
- ✓ Always keep a backup by downloading your data regularly

---

## 💳 GCash Payment Setup

### Setting Up GCash for Buyers

1. **Go to Admin Home**
   - Click "Home" in the navigation

2. **Find "GCash Payment Setup" Section**
   - Enter your GCash phone number (e.g., 09171234567)
   - Upload your GCash QR code image (if you have one)
   - Click "Save GCash Details"

3. **When Buyers Checkout**
   - After placing an order via GCash payment method
   - They'll see your QR code and phone number
   - They can scan the QR or send money directly to your number
   - Their Order ID will be shown as the reference

4. **Where QR Appears**
   - Checkout confirmation screen (after order is placed)
   - "Payment info" tab in the shop

### Getting Your GCash QR Code

1. Open GCash app on your phone
2. Go to "Receive Money" or "Collect" 
3. Tap on "QR Code"
4. Take a screenshot of your QR code
5. Upload it in the GCash Payment Setup section

---

## 🛍️ How Buyers Purchase Books

### From the Buyer's Perspective

1. **Browse Shop**
   - Buyers visit the shop and see all your "In Shop" books
   - They can search by title or author
   - Each book shows: title, author, genre, price, and picture

2. **Add to Cart**
   - Click "Add to cart" on any book
   - View cart anytime from the sidebar

3. **Checkout**
   - Click "Proceed to checkout"
   - Enter name, contact, delivery address
   - Choose payment method (GCash or Bank Transfer)
   - Click "Place order"

4. **Payment**
   - See Order ID and payment details
   - View your GCash QR code (if set up)
   - Send payment with Order ID as reference
   - Takes 2 weeks to ship

---

## 📊 Managing Your Inventory

### Inventory Columns

| Column | What It Does |
|--------|-------------|
| Title | Book name (editable) |
| Author | Author name (editable) |
| Genre | Category dropdown |
| Price | Sale price (editable) |
| Stock | How many copies (editable) |
| Box | Which batch (editable) |
| Type | Format dropdown |
| Condition | New/Pre-loved/Remaindered |
| Actions | Photo, Add to Shop, Sold, Layaway, Delete |

### Recording a Sale

1. Click "Sold" button next to a book
2. Enter how many copies were sold
3. A receipt will be generated automatically
4. Stock count decreases automatically

### Layaway System

- Click "🗓️ Layaway" to put a book on hold for a customer
- Enter customer name and payment terms
- Book is reserved until they complete payment or you cancel

### Deleting a Book

- Click "Delete" button
- Can be undone immediately with the undo toast

---

## 📱 Shop Display

### What Buyers See

The shop shows:
- ✓ Books marked as "In Shop"
- ✓ Book cover image (or placeholder)
- ✓ Title and author
- ✓ Genre
- ✓ Price
- ✓ Stock status (In stock / Limited / Out)
- ✓ Type and condition

The shop does NOT show:
- ✗ Books without "In Shop" status
- ✗ Admin details or notes
- ✗ Sales information

---

## 💾 Backup & Data Safety

### Regular Backups (IMPORTANT!)

1. Go to Admin Home
2. Click "Download Full Transfer Backup"
3. A JSON file downloads with all your data
4. Store it safely on your computer

### Transferring to a New Computer

1. Download backup on old computer
2. On new computer, go to Admin Home
3. Click "Restore from Backup"
4. Select the JSON file you downloaded
5. All data, books, pictures, and sales history transfer over

### What Gets Backed Up
- ✓ All books and their pictures
- ✓ All sales records
- ✓ All receipts
- ✓ All purchases (box costs)
- ✓ GCash settings
- ✓ Everything except orders (orders stay with the shop)

---

## ⚙️ System Features

### Book Visibility Control
- Only "In Shop" books appear to buyers
- Manage which books are visible without deleting them
- Move books between visible/invisible anytime

### Automatic Receipt Generation
- Every sale creates a receipt automatically
- Includes Order ID, date, items, total
- Can be printed or saved as image

### Real-Time Stock Updates
- Stock decreases automatically when you record sales
- Layaway books are reserved from stock
- Buyers can't buy books with no stock

### Price Calculator
- Quick tool to calculate markups (20%, 25%)
- Helps with pricing strategy

### Sales Summary & Stats
- View total titles and in-stock count
- Track total sales and inventory value
- See net revenue and box profitability

---

## 🆘 Troubleshooting

### Pictures Not Showing
- Check browser's storage isn't full
- Try uploading a smaller image
- Clear browser cache and re-login

### Books Not Appearing in Shop
- Check if marked "In Shop" (should show "🛒 In Shop" button)
- Make sure stock is greater than 0
- Refresh the shop page

### Checkout Not Working
- Make sure you have at least one book in shop
- Check browser cookies are enabled
- Try a different browser

### Lost Pictures
- Check if you cleared browser cache
- Restore from backup if available
- Picture storage is device-specific, not cloud-based

---

## 📞 Tips

✓ Keep book information updated
✓ Use consistent box names for tracking
✓ Download backup weekly
✓ Check GCash number is correct before buyers pay
✓ Monitor stock levels regularly
✓ Use photos for better sales

---

**Last Updated:** September 2026  
**BookNest Version:** 2.0
