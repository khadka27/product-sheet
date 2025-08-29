# 🎯 What You Need to Do Right Now

## ✅ 1. Update Your Google Sheet (2 minutes)

### Open your sheet:

https://docs.google.com/spreadsheets/d/1Sm73kUywGIXsR545gXiueRHb8DTOo9uPeqaMVmo2d9M/edit

### Set up like this:

**Row 1 (Headers):**

```
A1: SN    B1: Name    C1: CreatedAt    D1: UpdatedAt    E1: ID
```

**Row 2+ (Sample data):**

```
A2: 1    B2: Product Alpha    C2: 2025-08-27T10:00:00.000Z    D2: 2025-08-27T10:00:00.000Z    E2: uuid-1
A3: 2    B3: Product Beta     C3: 2025-08-27T11:00:00.000Z    D3: 2025-08-27T11:00:00.000Z    E3: uuid-2
```

### Rename tab to "Products"

- Right-click the tab at bottom
- Click "Rename"
- Type: **Products**

## ✅ 2. Set Up Service Account (5 minutes)

### Go to Google Cloud Console:

https://console.cloud.google.com/

1. **Create/Select Project**: `product-sheet-470306`
2. **Enable Sheets API**: APIs & Services → Library → Search "Google Sheets API" → Enable
3. **Create Service Account**:
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Name: `sheets-service`
   - Create & Download JSON key file

## ✅ 3. Update .env.local

From your JSON file, copy these values to `.env.local`:

```bash
GOOGLE_CLIENT_EMAIL=sheets-service@product-sheet-470306.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_FROM_JSON\n-----END PRIVATE KEY-----\n"
```

## ✅ 4. Share Sheet with Service Account

1. In your Google Sheet, click **Share**
2. Add the email from step 3: `sheets-service@product-sheet-470306.iam.gserviceaccount.com`
3. Give **Editor** access
4. Click **Send**

## 🧪 5. Test (1 minute)

Visit: http://localhost:3000/test-sheets

You should see your sheet data loaded!

---

## 🚨 Current Status:

- ✅ Sheet ID configured: `1Sm73kUywGIXsR545gXiueRHb8DTOo9uPeqaMVmo2d9M`
- ✅ Next.js app built successfully
- ✅ Development server running on http://localhost:3000
- ⏳ **Need to complete steps 1-4 above**

## 📱 After Setup Complete:

Your main product page will be available at:
http://localhost:3000/products

With features:

- ✅ Auto-save (no save button needed)
- ✅ Real-time duplicate detection
- ✅ Excel-like editing with 10 empty rows
- ✅ Enhanced search with flexible matching
- ✅ All data synced with Google Sheets
