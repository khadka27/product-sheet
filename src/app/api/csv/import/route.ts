import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    const csvData = await file.text();

    // Parse CSV
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Invalid CSV format", details: parseResult.errors },
        { status: 400 }
      );
    }

    const rows = parseResult.data as Record<string, string>[];
    let successCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        if (row.name?.trim()) {
          await db.product.create({
            data: {
              name: row.name.trim(),
            },
          });
          successCount++;
        }
      } catch (error) {
        console.error("Error creating product:", error);
        errors.push(`Failed to create product: ${row.name || "Unknown"}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in CSV import:", error);
    return NextResponse.json(
      { error: "Failed to import CSV" },
      { status: 500 }
    );
  }
}
