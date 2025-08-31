import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = {
      GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      NODE_ENV: process.env.NODE_ENV,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => key !== "NODE_ENV" && !value)
      .map(([key]) => key);

    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: {
        ...requiredEnvVars,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
          ? "✓ Present"
          : "✗ Missing",
      },
      issues:
        missingVars.length > 0
          ? [`Missing environment variables: ${missingVars.join(", ")}`]
          : [],
    };

    return NextResponse.json(status, {
      status: missingVars.length > 0 ? 500 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
