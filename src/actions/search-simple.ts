"use server";

import { db } from "@/lib/db";

export interface SearchResult {
  items: Array<{
    id: string;
    sn: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function searchProducts(
  query?: string,
  page: number = 1,
  limit: number = 20
): Promise<SearchResult> {
  try {
    // Build where clause for simple text search
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { sn: { equals: parseInt(query) || undefined } },
          ],
        }
      : {};

    // Get total count
    const totalItems = await db.product.count({ where });

    // Get items
    const skip = (page - 1) * limit;
    const items = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  } catch (error) {
    console.error("Error searching products:", error);
    return {
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export async function getSuggestions(query: string): Promise<
  Array<{
    id: string;
    name: string;
    sn: number;
  }>
> {
  try {
    if (!query.trim()) return [];

    const suggestions = await db.product.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        sn: true,
      },
      take: 5,
    });

    return suggestions;
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
}
