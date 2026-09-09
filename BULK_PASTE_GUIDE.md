# 📋 BULK PASTE - Quick Guide

## How to Bulk Paste Books in BookNest

### Step 1: Go to Scan Receipt Page
Navigate to the "📸 Scan" section

### Step 2: Click the "📋 Bulk Paste" Button
You'll see it next to the "+ Add Row" button in the "📚 Books Ordered" section

### Step 3: Format Your Data Correctly
Each line should have:
```
Title | Author | Genre | Condition | Qty | Price
```

Add a **Box** to a line by appending a field that starts with `Box:` — this tags which box/batch the book came from, so you can track cost vs. revenue per box:
```
Title | Author | Genre | Condition | Qty | Price | Box: Box 1
```

**Example:**
```
The Midnight Library | Matt Haig | HB | Pre Loved | 2 | 18.99 | Box: Box 1
Atomic Habits | James Clear | PB | New | 1 | 21.50 | Box: Box 2
Clean Code | Robert C. Martin | Technology | Pre Loved | 1 | 32.00
```
(Box is optional — leave it off if you don't want to tag that book yet.)

### Step 4: Paste and Click "✓ Add All"
All books will be added instantly with totals calculated!

---

## Data Format Explanation

| Field | Options | Required | Example |
|-------|---------|----------|---------|
| **Title** | Any book name | YES* | The Midnight Library |
| **Author** | Author's name | NO | Matt Haig |
| **Genre** | HB, PB, Fiction, etc. | NO | HB |
| **Condition** | New, Pre Loved, Remaindered | NO | Pre Loved |
| **Qty** | Number (1+) | NO | 2 |
| **Price** | Number with decimals | NO | 18.99 |

*Either Title or Price is required

---

## Image Scanning - What AI Extracts

When you upload a receipt image, the AI automatically reads:
- ✅ Book titles
- ✅ Author names
- ✅ Format (HB/PB/etc.)
- ✅ Book condition
- ✅ Quantity per book
- ✅ Unit price (₱)
- ✅ Customer name
- ✅ Phone number
- ✅ Shipping address

All you need to do is review and click Save!

---

## Troubleshooting

**Q: Data keeps disappearing when I refresh**
A: Fixed! Data now persists automatically. Try clearing browser cache if still having issues.

**Q: Bulk paste not adding books**
A: Make sure each line follows the format: `Title | Author | Genre | Condition | Qty | Price`

**Q: Image scanning not working**
A: 
1. Make sure you have internet connection
2. Try uploading a clearer image
3. Check that API key is valid
4. Can always fill in manually using Bulk Paste

**Q: AI missed some details**
A: Review the extracted data and edit directly in the table - all fields are editable!

---

## Data Loss Prevention

✅ Data is NOW automatically saved to browser storage
✅ Survives page refreshes
✅ Survives browser restarts
✅ Download backups in "Data & Backup" section for extra safety
