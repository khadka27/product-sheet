# 🚀 Google Sheets Setup Guide

## ✅ Sheet ID Updated!

Your Google Sheet ID has been configured: `1Sm73kUywGIXsR545gXiueRHb8DTOo9uPeqaMVmo2d9M`

## 📋 Required Steps to Complete Setup:

### 1. **Rename Your Sheet Tab**

- Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Sm73kUywGIXsR545gXiueRHb8DTOo9uPeqaMVmo2d9M/edit
- Right-click on the tab at the bottom (probably says "Sheet1")
- Click "Rename"
- Change it to: **Products**

### 2. **Set Up Column Headers**

Add these headers in row 1:

```
A1: SN
B1: Name
C1: CreatedAt
D1: UpdatedAt
E1: ID
```

### 3. **Create Google Service Account**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing: `product-sheet-470306`
3. Enable Google Sheets API
4. Create Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `sheets-api-service`
   - Click "Create and Continue"
   - Skip roles for now → "Done"
5. Create Key:
   - Click on your service account
   - Go to "Keys" tab
   - "Add Key" → "Create New Key" → "JSON"
   - Download the JSON file

### 4. **Update .env.local with Service Account**

From your downloaded JSON file, copy these values:

```bash
GOOGLE_CLIENT_EMAIL=your-service-account@product-sheet-470306.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### 5. **Share Sheet with Service Account**

1. Open your Google Sheet
2. Click "Share" (top right)
3. Add the service account email (from step 4)
4. Give it "Editor" permissions
5. Click "Send"

## 🧪 Test the Integration

### Option 1: Test Page

Visit: http://localhost:3000/test-sheets

### Option 2: API Endpoints

```bash
# Get all products
curl http://localhost:3000/api/products

# Add a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"names": ["Test Product"]}'
```

## 📊 Expected Sheet Format

| SN  | Name          | CreatedAt                | UpdatedAt                | ID     |
| --- | ------------- | ------------------------ | ------------------------ | ------ |
| 1   | Product Alpha | 2025-01-01T00:00:00.000Z | 2025-01-01T00:00:00.000Z | uuid-1 |
| 2   | Product Beta  | 2025-01-02T00:00:00.000Z | 2025-01-02T00:00:00.000Z | uuid-2 |

## ⚠️ Important Notes

1. **Sheet Name**: Must be "Products" (case-sensitive)
2. **Headers**: Must be in row 1 exactly as shown
3. **Data**: Starts from row 2 (A2:E)
4. **Permissions**: Service account needs Editor access
5. **API Scope**: Sheets API must be enabled in Google Cloud

## 🔧 Troubleshooting

- **403 Error**: Service account doesn't have access → Check sharing settings
- **404 Error**: Sheet ID or tab name incorrect
- **401 Error**: Invalid credentials in .env.local
- **Empty Response**: No data in sheet or wrong range
