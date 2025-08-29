import { NextRequest, NextResponse } from "next/server";

// Redirect to main products route for bulk operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to main products route
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error("Error in bulk route:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
