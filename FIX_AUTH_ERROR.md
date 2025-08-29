# 🔧 Fix Authentication Error - Step by Step

## 🚨 Current Error:

```
Error: Could not load the default credentials
```

## ✅ SOLUTION: Set up Service Account (5 minutes)

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Select or create project: **product-sheet-470306**

### Step 2: Enable Google Sheets API

1. Go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Fill details:
   - **Name**: `sheets-service`
   - **Service account ID**: `sheets-service`
   - **Description**: `Service account for product sheet management`
4. Click "Create and Continue"
5. Skip roles (click "Continue")
6. Click "Done"

### Step 4: Generate Key File

1. Click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. **Download the JSON file** (keep it safe!)

### Step 5: Extract Credentials from JSON

Open your downloaded JSON file. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "product-sheet-470306",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "sheets-service@product-sheet-470306.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### Step 6: Update .env.local

Copy these values from your JSON file to `.env.local`:

```bash
# Uncomment and replace these lines:
GOOGLE_CLIENT_EMAIL=sheets-service@product-sheet-470306.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_FROM_JSON_FILE\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: Keep the quotes and `\n` characters exactly as shown!

### Step 7: Share Google Sheet

1. Open your sheet: https://docs.google.com/spreadsheets/d/1Sm73kUywGIXsR545gXiueRHb8DTOo9uPeqaMVmo2d9M/edit
2. Click "Share" (top right)
3. Add email: `sheets-service@product-sheet-470306.iam.gserviceaccount.com`
4. Set permission: **Editor**
5. Click "Send"

### Step 8: Test

1. Save `.env.local`
2. Refresh your browser: http://localhost:3000/test-sheets
3. You should see "✅ Loaded X products from Google Sheets"

## 🎯 Quick Checklist:

- [ ] Google Sheets API enabled
- [ ] Service Account created
- [ ] JSON key downloaded
- [ ] .env.local updated with GOOGLE_CLIENT_EMAIL
- [ ] .env.local updated with GOOGLE_PRIVATE_KEY
- [ ] Google Sheet shared with service account
- [ ] Sheet tab renamed to "Products"
- [ ] Headers added: SN | Name | CreatedAt | UpdatedAt | ID

## 🆘 Still having issues?

The error message in your browser will now show specific guidance on what's missing!

## 🎉 After this works:

Your app will sync live with Google Sheets - any changes in the sheet appear instantly in your app!
