import { NextResponse } from "next/server";

export async function GET() {
  // Return empty categories since our simplified schema doesn't have categories
  return NextResponse.json([]);
}
