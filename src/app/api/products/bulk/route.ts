import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { names } = await request.json();

    if (!Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: "Names array is required" },
        { status: 400 }
      );
    }

    // Filter out empty names
    const validNames = names
      .map((name) => (typeof name === "string" ? name.trim() : ""))
      .filter((name) => name.length > 0);

    if (validNames.length === 0) {
      return NextResponse.json(
        { error: "No valid product names provided" },
        { status: 400 }
      );
    }

    // Create products
    const createPromises = validNames.map((name) =>
      db.product.create({
        data: { name },
      })
    );

    const createdProducts = await Promise.all(createPromises);

    return NextResponse.json({
      message: "Products created successfully",
      count: createdProducts.length,
      products: createdProducts,
    });
  } catch (error) {
    console.error("Error creating products:", error);
    return NextResponse.json(
      { error: "Failed to create products" },
      { status: 500 }
    );
  }
}
