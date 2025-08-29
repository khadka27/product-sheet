import { NextResponse } from "next/server";
import { google } from "googleapis";

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Sheet1";

// Column mapping based on your database structure
const COLUMNS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
];

const COLUMN_HEADERS = [
  "SN",
  "Product Name",
  "Status",
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
    status: row[2] || "",
    trends: row[3] || "",
    duplicate: row[4] || "",
    approvalStatus: row[5] || "",
    offerInWhichAffiliate: row[6] || "",
    pettyLinkStatus: row[7] || "",
    affiliateLink: row[8] || "",
    affiliatePersonName: row[9] || "",
    websiteTrackingLink: row[10] || "",
    pettyLinks: row[11] || "",
    referenceLink: row[12] || "",
    articleBy: row[13] || "",
    category: row[14] || "",
    dateAddedOn: row[15] || "",
    country: row[16] || "",
    commission: row[17] || "",
    vsl: row[18] || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Convert Product object to row data
function productToRow(product: any): string[] {
  return [
    product.sn?.toString() || "",
    product.productName || "",
    product.status || "",
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

// GET - Fetch all products
export async function GET() {
  try {
    const sheets = await getSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:S`, // All columns A through S
    });

    const rows = response.data.values || [];

    // Skip header row and convert to products
    const products = rows
      .slice(1)
      .map((row, index) => rowToProduct(row, index));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error },
      { status: 500 }
    );
  }
}

// POST - Add new product
export async function POST(request: Request) {
  try {
    const product = await request.json();
    const sheets = await getSheetsClient();

    // Get current data to determine next row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:S`,
    });

    const rows = response.data.values || [];
    const nextRow = rows.length + 1;

    // Convert product to row format
    const rowData = productToRow(product);

    // Append the new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { error: "Failed to add product", details: error },
      { status: 500 }
    );
  }
}

// PUT - Update existing product
export async function PUT(request: Request) {
  try {
    const product = await request.json();
    const sheets = await getSheetsClient();

    // Get current data to find the row to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:S`,
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
      range: `${SHEET_NAME}!A${sheetRowNumber}:S${sheetRowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error },
      { status: 500 }
    );
  }
}
