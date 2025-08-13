import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@db/client"
import type { ProductStatus } from "@db/client"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const brandIds = searchParams.getAll("brandId")
    const categoryIds = searchParams.getAll("categoryId")
    const status = searchParams.getAll("status") as ProductStatus[]
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const tags = searchParams.getAll("tag")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Build where clause
    const where: any = {}

    // Full-text search
    if (q) {
      where.OR = [
        {
          searchVector: {
            search: q.split(" ").join(" & "),
          },
        },
        {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          tags: {
            hasSome: q.split(" "),
          },
        },
      ]
    }

    // Brand filter
    if (brandIds.length > 0) {
      where.brandId = { in: brandIds }
    }

    // Category filter
    if (categoryIds.length > 0) {
      where.categoryId = { in: categoryIds }
    }

    // Status filter
    if (status.length > 0) {
      where.status = { in: status }
    }

    // Price range filter
    if (priceMin || priceMax) {
      where.price = {}
      if (priceMin) where.price.gte = Number.parseFloat(priceMin)
      if (priceMax) where.price.lte = Number.parseFloat(priceMax)
    }

    // Tags filter
    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === "name") {
      orderBy.name = sortOrder
    } else if (sortBy === "price") {
      orderBy.price = sortOrder
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder
    } else if (sortBy === "updatedAt") {
      orderBy.updatedAt = sortOrder
    }

    // Execute search with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ message: "Search failed" }, { status: 500 })
  }
}
