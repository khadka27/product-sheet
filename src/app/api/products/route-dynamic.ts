import { NextResponse } from "next/server";
import { google } from "googleapis";

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

interface Product {
  id: string;
  sn: number;
  productName: string;
  productResearchBy: string;
  status: string;
  articleAssignedTo: string;
  trends: string;
  duplicate: string;
  approvalStatus: string;
  offerInWhichAffiliate: string;
  pettyLinkStatus: string;
  affiliateLink: string;
  affiliatePersonName: string;
  websiteTrackingLink: string;
  pettyLinks: string;
  referenceLink: string;
  articleBy: string;
  category: string;
  dateAddedOn: string;
  country: string;
  commission: string;
  vsl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple in-memory cache to reduce API calls
const cache = {
  data: null as Product[] | null,
  lastFetch: 0,
  ttl: 30000, // 30 seconds cache
};

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

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

// Dynamically determine the range based on sheet data
async function getDynamicRange(
  sheets: ReturnType<typeof google.sheets>
): Promise<string> {
  try {
    // First, get the sheet metadata to find the actual used range
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const worksheet = sheetInfo.data.sheets?.[0]; // Assume first sheet
    const properties = worksheet?.properties;

    // Get the grid properties to determine max columns and rows
    const maxRows = properties?.gridProperties?.rowCount || 1000;
    const maxCols = properties?.gridProperties?.columnCount || 26;

    // Convert column count to letter (A, B, C... Z, AA, AB...)
    function numberToColumnLetter(num: number): string {
      let result = "";
      while (num > 0) {
        num--;
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26);
      }
      return result;
    }

    // Limit to our expected 21 columns (A to U) or actual max, whichever is smaller
    const endColumn = numberToColumnLetter(Math.min(21, maxCols));

    // Try to detect actual data range by checking for non-empty cells
    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `A1:${endColumn}${Math.min(1000, maxRows)}`, // Sample first 1000 rows
    });

    const sampleRows = sampleResponse.data.values || [];

    // Find the last row with data
    let lastRowWithData = 1; // At least header row
    for (let i = sampleRows.length - 1; i >= 0; i--) {
      const row = sampleRows[i];
      if (
        row &&
        row.some((cell: any) => cell && cell.toString().trim() !== "")
      ) {
        lastRowWithData = i + 1; // +1 because array is 0-indexed but sheets are 1-indexed
        break;
      }
    }

    // Return dynamic range with some extra rows for new entries
    const dynamicRange = `A1:${endColumn}${Math.max(lastRowWithData + 50, 100)}`; // Add 50 extra rows or minimum 100 rows
    console.log(`Dynamic range determined: ${dynamicRange}`);
    return dynamicRange;
  } catch (error) {
    console.warn(
      "Failed to determine dynamic range, falling back to default:",
      error
    );
    // Fallback to static range if dynamic detection fails
    return "A1:U1000";
  }
}

// Convert row data to Product object
function rowToProduct(row: string[], index: number): Product {
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
function productToRow(product: Product): string[] {
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

    // Get dynamic range
    const dynamicRange = await getDynamicRange(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: dynamicRange,
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
  } catch (error) {
    console.error("Error fetching products:", error);
    const err = error as Error;

    // Handle quota exceeded error specifically
    if ((err as any).code === 429 || err.message?.includes("Quota exceeded")) {
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
      { error: "Failed to fetch products", details: err.message || err },
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

    // Get dynamic range to determine next row
    const dynamicRange = await getDynamicRange(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: dynamicRange,
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
  } catch (error) {
    console.error("Error adding product:", error);
    const err = error as Error;

    if ((err as any).code === 429 || err.message?.includes("Quota exceeded")) {
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
      { error: "Failed to add product", details: err.message || err },
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

    // Get dynamic range to find the row to update
    const dynamicRange = await getDynamicRange(sheets);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: dynamicRange,
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

    // Determine the end column dynamically
    const endColumn = String.fromCharCode(65 + rowData.length - 1); // A=65, so A+20=U for 21 columns

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${sheetRowNumber}:${endColumn}${sheetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    // Invalidate cache
    cache.data = null;

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error updating product:", error);
    const err = error as Error;

    if ((err as any).code === 429 || err.message?.includes("Quota exceeded")) {
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
      { error: "Failed to update product", details: err.message || err },
      { status: 500 }
    );
  }
}
