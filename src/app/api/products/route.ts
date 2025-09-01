import { NextResponse } from "next/server";
import { google } from "googleapis";
import { rateLimiter, sheetsApiLimiter } from "@/lib/rateLimiter";

// Rate limiter rejection response interface
interface RateLimiterRejectResponse {
  msBeforeNext?: number;
  remainingPoints?: number;
  totalHits?: number;
}

// Google Sheets configuration
// Use environment variable for spreadsheet ID
const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID || "1wdRRBL9XTCxI7RGj7NdRG8nukdSnpjx5wk3IiTXBAas";
const SHEET_GID = "1231362096"; // Specific sheet tab ID for Content Worksheet

interface Product {
  id: string;
  sn: number;
  articleTitleName: string;
  postedBy: string;
  status: string;
  contentDoc: string;
  datePosted: string;
  url: string;
  websiteAffiliateLink: string;
  referenceLink: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple in-memory cache to reduce API calls
const cache = {
  data: null as Product[] | null,
  lastFetch: 0,
  // Longer cache in production to reduce API calls
  ttl: process.env.NODE_ENV === "production" ? 60000 : 30000, // 1 minute in production, 30 seconds in development
};

// Initialize Google Sheets client
async function getSheetsClient() {
  try {
    // Enhanced environment variable validation
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail) {
      throw new Error("GOOGLE_CLIENT_EMAIL environment variable is missing");
    }

    if (!privateKey) {
      throw new Error("GOOGLE_PRIVATE_KEY environment variable is missing");
    }

    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEET_ID environment variable is missing");
    }

    // Handle the private key formatting - support both escaped and unescaped newlines
    let formattedPrivateKey = privateKey;

    // Log the first and last 50 characters for debugging (without exposing the full key)
    console.log("Private key debug info:", {
      length: privateKey.length,
      start: privateKey.substring(0, 50),
      end: privateKey.substring(privateKey.length - 50),
      hasEscapedNewlines: privateKey.includes("\\n"),
      hasActualNewlines: privateKey.includes("\n"),
    });

    try {
      // If the key contains literal \n strings, replace them with actual newlines
      if (privateKey.includes("\\n")) {
        formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
      }

      // Remove any extra whitespace and normalize line endings
      formattedPrivateKey = formattedPrivateKey.trim().replace(/\r\n/g, "\n");

      // Ensure the key starts and ends with the proper PEM format
      if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error(
          "Invalid private key format: missing BEGIN PRIVATE KEY header"
        );
      }

      if (!formattedPrivateKey.includes("-----END PRIVATE KEY-----")) {
        throw new Error(
          "Invalid private key format: missing END PRIVATE KEY footer"
        );
      }

      // Ensure proper line breaks around headers and footers
      formattedPrivateKey = formattedPrivateKey
        .replace(
          /-----BEGIN PRIVATE KEY-----\s*/,
          "-----BEGIN PRIVATE KEY-----\n"
        )
        .replace(/\s*-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");

      // Validate that the key content between headers is base64
      const keyContent = formattedPrivateKey
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s/g, "");

      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(keyContent)) {
        throw new Error(
          "Invalid private key format: key content is not valid base64"
        );
      }
    } catch (keyError) {
      console.error("Private key formatting error:", keyError);
      throw new Error(
        `Private key processing failed: ${keyError instanceof Error ? keyError.message : "Unknown error"}`
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Test the auth to catch any issues early
    try {
      await auth.getAccessToken();
    } catch (authError) {
      console.error("Google Auth initialization failed:", authError);
      throw new Error(
        `Google authentication failed: ${authError instanceof Error ? authError.message : "Unknown error"}`
      );
    }

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
    // Get the specific sheet by GID
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    // Find the sheet with the specific GID
    const targetSheet = sheetInfo.data.sheets?.find(
      (sheet) => sheet.properties?.sheetId?.toString() === SHEET_GID
    );

    if (!targetSheet) {
      throw new Error(`Sheet with GID ${SHEET_GID} not found`);
    }

    const properties = targetSheet.properties;
    const sheetName = properties?.title || "Content Worksheet";

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

    // For Content Worksheet, we expect 10 columns (A to J): S.N., Article Title Name, Posted By, Status, Content Doc, Date Posted, URL, Website Affiliate Link, Reference Link
    const endColumn = numberToColumnLetter(Math.min(10, maxCols));

    // Try to detect actual data range by checking for non-empty cells
    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:${endColumn}${Math.min(1000, maxRows)}`, // Use sheet name with GID
    });

    const sampleRows = sampleResponse.data.values || [];

    // Find the last row with data
    let lastRowWithData = 1; // At least header row
    for (let i = sampleRows.length - 1; i >= 0; i--) {
      const row = sampleRows[i];
      if (
        row?.some(
          (cell: string | number) => cell && cell.toString().trim() !== ""
        )
      ) {
        lastRowWithData = i + 1; // +1 because array is 0-indexed but sheets are 1-indexed
        break;
      }
    }

    // Return dynamic range with some extra rows for new entries
    const dynamicRange = `'${sheetName}'!A1:${endColumn}${Math.max(lastRowWithData + 50, 100)}`; // Add 50 extra rows or minimum 100 rows
    console.log(`Dynamic range determined: ${dynamicRange}`);
    return dynamicRange;
  } catch (error) {
    console.warn(
      "Failed to determine dynamic range, falling back to default:",
      error
    );
    // Fallback to static range if dynamic detection fails
    return "'Content Worksheet'!A1:J1000";
  }
}

// Convert row data to Product object
function rowToProduct(row: string[], index: number): Product {
  return {
    id: `content_${index}`,
    sn: parseInt(row[0]) || index + 1,
    articleTitleName: row[1] || "",
    postedBy: row[2] || "",
    status: row[3] || "",
    contentDoc: row[4] || "",
    datePosted: row[5] || "",
    url: row[6] || "",
    websiteAffiliateLink: row[7] || "",
    referenceLink: row[8] || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Convert Product object to row data
function productToRow(product: Product): string[] {
  return [
    product.sn?.toString() || "",
    product.articleTitleName || "",
    product.postedBy || "",
    product.status || "",
    product.contentDoc || "",
    product.datePosted || new Date().toLocaleDateString(),
    product.url || "",
    product.websiteAffiliateLink || "",
    product.referenceLink || "",
  ];
}

// Check cache validity
function isCacheValid(): boolean {
  return cache.data !== null && Date.now() - cache.lastFetch < cache.ttl;
}

// GET - Fetch all products with caching and rate limiting
export async function GET(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown-ip";

    // Apply rate limiting
    try {
      await rateLimiter.consume(clientIp);
    } catch (rejRes: unknown) {
      const rejection = rejRes as RateLimiterRejectResponse;
      const retryAfter = rejection?.msBeforeNext
        ? Math.round(rejection.msBeforeNext / 1000)
        : 60;
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Check cache first
    if (isCacheValid()) {
      console.log("Returning cached data");
      return NextResponse.json(cache.data);
    }

    console.log("Fetching fresh data from Google Sheets");

    // Apply stricter rate limiting for actual Google Sheets API calls
    try {
      await sheetsApiLimiter.consume(clientIp);
    } catch (rejRes: unknown) {
      const rejection = rejRes as RateLimiterRejectResponse;
      const retryAfter = rejection?.msBeforeNext
        ? Math.round(rejection.msBeforeNext / 1000)
        : 120;
      return NextResponse.json(
        {
          error:
            "Google Sheets API rate limit exceeded. Please wait longer before making another request.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

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
    const err = error as Error & { code?: number };

    // Enhanced error handling for deployment
    if (
      err.message?.includes("GOOGLE_CLIENT_EMAIL") ||
      err.message?.includes("GOOGLE_PRIVATE_KEY")
    ) {
      console.error("Missing environment variables for Google Sheets API");
      return NextResponse.json(
        {
          error:
            "Server configuration error. Please check environment variables.",
          details:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Configuration missing",
        },
        { status: 500 }
      );
    }

    // Handle quota exceeded error specifically
    if (
      err.code === 429 ||
      err.message?.includes("Quota exceeded") ||
      err.message?.includes("quotaExceeded")
    ) {
      console.warn("Google Sheets API quota exceeded");
      return NextResponse.json(
        {
          error:
            "Google Sheets API quota exceeded. Please wait a few minutes and try again.",
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    // Handle authentication errors
    if (
      err.message?.includes("authentication") ||
      err.message?.includes("unauthorized") ||
      err.code === 401
    ) {
      console.error("Authentication failed with Google Sheets API");
      return NextResponse.json(
        {
          error: "Authentication failed. Please check API credentials.",
          details:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Authentication error",
        },
        { status: 401 }
      );
    }

    // If we have cached data and there's an error, return cached data
    if (cache.data !== null) {
      console.log("API error, returning cached data. Error:", err.message);
      return NextResponse.json(cache.data);
    }

    // Generic error response
    console.error("Unhandled error in products API:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch products",
        details:
          process.env.NODE_ENV === "development"
            ? err.message || err
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Add new product
export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown-ip";

    // Apply rate limiting
    try {
      await rateLimiter.consume(clientIp);
      await sheetsApiLimiter.consume(clientIp);
    } catch (rejRes: unknown) {
      const rejection = rejRes as RateLimiterRejectResponse;
      const retryAfter = rejection?.msBeforeNext
        ? Math.round(rejection.msBeforeNext / 1000)
        : 60;
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
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
    const err = error as Error & { code?: number };

    if (err.code === 429 || err.message?.includes("Quota exceeded")) {
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
    // Get client IP for rate limiting
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown-ip";

    // Apply rate limiting
    try {
      await rateLimiter.consume(clientIp);
      await sheetsApiLimiter.consume(clientIp);
    } catch (rejRes: unknown) {
      const rejection = rejRes as RateLimiterRejectResponse;
      const retryAfter = rejection?.msBeforeNext
        ? Math.round(rejection.msBeforeNext / 1000)
        : 60;
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait before making another request.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        }
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

    // Determine the end column for Content Worksheet (9 columns A-I)
    const endColumn = String.fromCharCode(65 + rowData.length - 1); // A=65, so A+8=I for 9 columns

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
    const err = error as Error & { code?: number };

    if (err.code === 429 || err.message?.includes("Quota exceeded")) {
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
