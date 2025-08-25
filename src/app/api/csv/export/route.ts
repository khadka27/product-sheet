import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/actions/search-simple";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;

    // Get products
    const { items } = await searchProducts(query, 1, 10000); // Get all results for export

    // Convert to CSV format
    const csvHeaders = ["sn", "name", "createdAt"];

    const csvRows = items.map((product) => [
      product.sn.toString(),
      `"${product.name.replace(/"/g, '""')}"`, // Escape quotes
      product.createdAt.toISOString(),
    ]);

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const bom = "\uFEFF";
    const csvContent =
      bom +
      [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

    // Create response with appropriate headers
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in CSV export:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
