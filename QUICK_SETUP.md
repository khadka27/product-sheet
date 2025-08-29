# 🚀 Quick Setup Instructions

## Step 1: Update Your Google Sheet ID

1. Open your Google Sheet
2. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
3. Replace `your-google-sheet-id` in `.env.local` with your actual Sheet ID

## Step 2: Set Up Your Google Sheet Structure

Create columns in Row 1:

```
A1: SN
B1: Name
C1: CreatedAt
D1: UpdatedAt
E1: ID
```

## Step 3: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `product-sheet-470306`
3. Go to "APIs & Services" > "Library"
4. Search "Google Sheets API" and enable it

## Step 4: Test the Integration

Run the development server:

```bash
npm run dev
```

Visit: http://localhost:3000/test-sheets

## Your Current Configuration

✅ **OAuth2 Credentials**: Already configured  
✅ **Google API Package**: Installed  
✅ **API Routes**: Created  
✅ **Frontend Integration**: Ready

## What You Need to Do

1. **Get your Google Sheet ID** and update `.env.local`
2. **Enable Google Sheets API** in your Google Cloud project
3. **Set up your sheet structure** as shown above
4. **Test the integration**

That's it! Your app will then read/write data directly to/from Google Sheets.
