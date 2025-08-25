import { NextResponse } from "next/server";

export async function GET() {
  // Return empty tags since our simplified schema doesn't have tags
  return NextResponse.json([]);
}
