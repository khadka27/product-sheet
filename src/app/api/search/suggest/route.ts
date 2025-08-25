import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/actions/search-simple";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    const suggestions = await getSuggestions(query);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error in suggestions API:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
