# Google Sheets Integration Setup Guide

## Overview

This Next.js application now integrates with Google Sheets as the primary database, replacing PostgreSQL. Products are stored and managed directly in Google Sheets with real-time synchronization.

## Features

- ✅ Real-time data fetching from Google Sheets
- ✅ Auto-save functionality (saves changes without reload)
- ✅ Duplicate detection
- ✅ Flexible search with space/special character handling
- ✅ Excel-like inline editing with 10 empty rows
- ✅ Add, update, and delete operations
- ✅ Auto-generated serial numbers

## Prerequisites

1. Google Cloud Console account
2. Google Sheets API enabled
3. Service Account credentials OR OAuth2 credentials

## Current Configuration ✅

Your project is already configured with OAuth2 credentials:

- **Project ID**: `product-sheet-470306`
- **Client ID**: `1016425169759-4lbeiua3lqdu4tq0l2o93oea08t88479.apps.googleusercontent.com`
- **Client Secret**: `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`

## Setup Steps

### 1. Create Google Sheet

1. Create a new Google Sheet
2. Name the sheet "Products"
3. Set up columns in Row 1:
   ```
   A1: SN (Serial Number)
   B1: Name (Product Name)
   C1: CreatedAt (Creation Date)
   D1: UpdatedAt (Last Modified Date)
   E1: ID (Unique Identifier)
   ```
4. Data starts from Row 2 (A2:E)
5. **IMPORTANT**: Copy your Sheet ID from the URL and update `.env.local`

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 3. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 4. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the JSON file

### 5. Share Google Sheet

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (from the JSON file)
4. Give "Editor" permissions
5. Click "Send"

### 6. Environment Variables

Create `.env.local` in your project root:

```env
# Get this from your Google Sheet URL
GOOGLE_SHEET_ID=1abc123def456ghi789jkl

# From the downloaded JSON file
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# From the downloaded JSON file (keep \\n escaped)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_CONTENT\\n-----END PRIVATE KEY-----\\n"

# For internal API calls
NEXTAUTH_URL=http://localhost:3000
```

**Important Notes:**

- `GOOGLE_SHEET_ID` is found in the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
- Keep the `\\n` escaped in the private key
- Make sure the service account email has editor access to the sheet

## API Endpoints

### GET /api/products

Fetches all products from Google Sheets

```typescript
Response: Product[]
```

### POST /api/products

Adds new products to Google Sheets

```typescript
Request: { names: string[] }
Response: { message: string, count: number, skipped: number }
```

### PUT /api/products/[id]

Updates existing product in Google Sheets

```typescript
Request: { name: string }
Response: { message: string, product: Product }
```

### DELETE /api/products/[id]

Deletes product from Google Sheets

```typescript
Response: {
  message: string;
}
```

## Data Flow

1. **Frontend**: User types in empty row
2. **Auto-save**: Debounced save after 1 second of inactivity
3. **API**: POST to `/api/products` with product name
4. **Google Sheets**: Row added with auto-generated SN and timestamps
5. **Frontend**: List refreshes automatically
6. **Real-time**: Changes appear immediately without page reload

## Testing

Visit `/test-sheets` in your application to test the integration:

- Load products from Google Sheets
- Add new products
- View real-time updates

## Troubleshooting

### Common Issues

1. **"Service account not found"**
   - Verify service account email in `.env.local`
   - Check if service account exists in Google Cloud Console

2. **"Permission denied"**
   - Make sure the Google Sheet is shared with the service account email
   - Verify the service account has "Editor" permissions

3. **"Invalid private key"**
   - Ensure the private key has proper `\\n` escaping
   - Copy the entire key including BEGIN/END lines

4. **"Sheet not found"**
   - Verify the sheet name is exactly "Products"
   - Check if the `GOOGLE_SHEET_ID` is correct

### Verification Steps

1. Check that the service account can access the sheet
2. Verify API endpoints return data
3. Test add/edit/delete operations
4. Confirm auto-save functionality works

## Production Deployment

1. Add environment variables to your hosting platform
2. Ensure Google Sheets API quotas are sufficient
3. Monitor API usage in Google Cloud Console
4. Consider caching for high-traffic applications

## Benefits of Google Sheets Integration

- ✅ No database setup required
- ✅ Real-time collaboration
- ✅ Easy data viewing/editing in Google Sheets
- ✅ Automatic backups via Google Drive
- ✅ Easy data export/import
- ✅ Cost-effective for small to medium datasets
- ✅ Familiar interface for non-technical users
