"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

interface CreateProductResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

export async function createProduct(
  name: string
): Promise<CreateProductResult> {
  try {
    const product = await db.product.create({
      data: {
        name,
      },
    });

    revalidatePath("/products");
    return { success: true, data: { id: product.id } };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.product.delete({
      where: { id },
    });

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: "Failed to delete product",
    };
  }
}

// Simple bulk create function for name arrays
export async function bulkCreateProducts(
  names: string[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let count = 0;

    for (const name of names) {
      if (name.trim()) {
        await db.product.create({
          data: {
            name: name.trim(),
          },
        });
        count++;
      }
    }

    revalidatePath("/products");
    return { success: true, count };
  } catch (error) {
    console.error("Error bulk creating products:", error);
    return {
      success: false,
      count: 0,
      error:
        error instanceof Error ? error.message : "Failed to create products",
    };
  }
}
