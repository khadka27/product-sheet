import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Load Google Sheet configs
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const RANGE = "Products!A2:E";

// Auth client
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/spreadsheets"
    ],
  });

  return google.sheets({ version: "v4", auth });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    // Get all rows to find the one to delete
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];
    
    // Find the row index by ID (column E, index 4)
    const rowIndex = rows.findIndex(row => row[4] === id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Calculate the actual sheet row number (adding 2 because data starts at A2)
    const sheetRowNumber = rowIndex + 2;

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming first sheet
                dimension: "ROWS",
                startIndex: sheetRowNumber - 1, // 0-based index
                endIndex: sheetRowNumber, // exclusive end
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// ✅ Update product in Google Sheets (for auto-save feature)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: "Product ID and name are required" },
        { status: 400 }
      );
    }

    const sheets = await getSheetsClient();

    // Get all rows to find the one to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];
    
    // Find the row index by ID (column E, index 4)
    const rowIndex = rows.findIndex(row => row[4] === id);
    
    if (rowIndex === -1) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Calculate the actual sheet row number
    const sheetRowNumber = rowIndex + 2;

    // Update the product name and updated date
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Products!B${sheetRowNumber}:D${sheetRowNumber}`, // Name, CreatedAt, UpdatedAt
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          name, // Name (column B)
          rows[rowIndex][2] || new Date().toISOString(), // Keep original CreatedAt (column C)
          new Date().toISOString(), // Update UpdatedAt (column D)
        ]],
      },
    });

    return NextResponse.json({ 
      message: "Product updated successfully",
      product: {
        id,
        name,
        sn: parseInt(rows[rowIndex][0]) || 0,
        updatedAt: new Date().toISOString(),
      }
    });
  } catch (error: unknown) {
    console.error("Error updating product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
