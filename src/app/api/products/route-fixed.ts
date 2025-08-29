import { NextResponse } from "next/server";
import { google } from "googleapis";

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

// Simple in-memory cache to reduce API calls
const cache = {
  data: null as any[] | null,
  lastFetch: 0,
  ttl: 30000, // 30 seconds cache
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Column mapping based on your database structure
const COLUMN_HEADERS = [
  "SN",
  "Product Name",
  "Product Research By",
  "Status",
  "Article Assigned to",
  "Trends",
  "Duplicate",
  "Approval Status",
  "Offer In Which Affiliate",
  "Petty Link Status",
  "Affiliate Link",
  "Affiliate Person Name",
  "Website Tracking Link",
  "Petty Links",
  "Reference Link",
  "Article By",
  "Category",
  "Date Added on",
  "Country",
  "Commission",
  "VSL",
];

// Initialize Google Sheets client
async function getSheetsClient() {
  try {
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error("Missing Google service account credentials");
    }

    // Handle the private key formatting
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    return sheets;
  } catch (error) {
    console.error("Error initializing Google Sheets client:", error);
    throw error;
  }
}

// Convert row data to Product object
function rowToProduct(row: string[], index: number) {
  return {
    id: `product_${index}`,
    sn: parseInt(row[0]) || index + 1,
    productName: row[1] || "",
    productResearchBy: row[2] || "",
    status: row[3] || "",
    articleAssignedTo: row[4] || "",
    trends: row[5] || "",
    duplicate: row[6] || "",
    approvalStatus: row[7] || "",
    offerInWhichAffiliate: row[8] || "",
    pettyLinkStatus: row[9] || "",
    affiliateLink: row[10] || "",
    affiliatePersonName: row[11] || "",
    websiteTrackingLink: row[12] || "",
    pettyLinks: row[13] || "",
    referenceLink: row[14] || "",
    articleBy: row[15] || "",
    category: row[16] || "",
    dateAddedOn: row[17] || "",
    country: row[18] || "",
    commission: row[19] || "",
    vsl: row[20] || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Convert Product object to row data
function productToRow(product: any): string[] {
  return [
    product.sn?.toString() || "",
    product.productName || "",
    product.productResearchBy || "",
    product.status || "",
    product.articleAssignedTo || "",
    product.trends || "",
    product.duplicate || "",
    product.approvalStatus || "",
    product.offerInWhichAffiliate || "",
    product.pettyLinkStatus || "",
    product.affiliateLink || "",
    product.affiliatePersonName || "",
    product.websiteTrackingLink || "",
    product.pettyLinks || "",
    product.referenceLink || "",
    product.articleBy || "",
    product.category || "",
    product.dateAddedOn || new Date().toLocaleDateString(),
    product.country || "",
    product.commission || "",
    product.vsl || "",
  ];
}

// Rate limiting middleware
function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return false;
  }
  lastRequestTime = now;
  return true;
}

// Check cache validity
function isCacheValid(): boolean {
  return cache.data !== null && Date.now() - cache.lastFetch < cache.ttl;
}

// GET - Fetch all products with caching and rate limiting
export async function GET() {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
        },
        { status: 429 }
      );
    }

    // Check cache first
    if (isCacheValid()) {
      console.log("Returning cached data");
      return NextResponse.json(cache.data);
    }

    console.log("Fetching fresh data from Google Sheets");
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `A:U`, // All columns A through U (21 columns)
    });

    const rows = response.data.values || [];

    // Skip header row and convert to products
    const products = rows
      .slice(1)
      .map((row, index) => rowToProduct(row, index));

    // Update cache
    cache.data = products;
    cache.lastFetch = Date.now();

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", error);

    // Handle quota exceeded error specifically
    if (error.code === 429 || error.message?.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          error:
            "Google Sheets API quota exceeded. Please wait a few minutes and try again.",
          retryAfter: 60, // Suggest waiting 60 seconds
        },
        { status: 429 }
      );
    }

    // If we have cached data and there's an error, return cached data
    if (cache.data !== null) {
      console.log("API error, returning cached data");
      return NextResponse.json(cache.data);
    }

    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message || error },
      { status: 500 }
    );
  }
}

// POST - Add new product
export async function POST(request: Request) {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
        },
        { status: 429 }
      );
    }

    const product = await request.json();
    const sheets = await getSheetsClient();

    // Get current data to determine next row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `A:U`,
    });

    const rows = response.data.values || [];
    const nextRow = rows.length + 1;

    // Convert product to row format
    const rowData = productToRow(product);

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    // Invalidate cache
    cache.data = null;

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Error adding product:", error);

    if (error.code === 429 || error.message?.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          error:
            "Google Sheets API quota exceeded. Please wait a few minutes and try again.",
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add product", details: error.message || error },
      { status: 500 }
    );
  }
}

// PUT - Update existing product
export async function PUT(request: Request) {
  try {
    // Check rate limit
    if (!checkRateLimit()) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
        },
        { status: 429 }
      );
    }

    const product = await request.json();
    const sheets = await getSheetsClient();

    // Get current data to find the row to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `A:U`,
    });

    const rows = response.data.values || [];

    // Find the row index (skip header)
    const rowIndex = rows.findIndex(
      (row, index) => index > 0 && parseInt(row[0]) === product.sn
    );

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Convert product to row format
    const rowData = productToRow(product);
    const sheetRowNumber = rowIndex + 1; // +1 because sheets are 1-indexed

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${sheetRowNumber}:U${sheetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    // Invalidate cache
    cache.data = null;

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === 429 || error.message?.includes("Quota exceeded")) {
      return NextResponse.json(
        {
          error:
            "Google Sheets API quota exceeded. Please wait a few minutes and try again.",
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product", details: error.message || error },
      { status: 500 }
    );
  }
}
