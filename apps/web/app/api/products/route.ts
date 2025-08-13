import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@db/client"
import { ProductStatus } from "@db/client"

export async function GET() {
  try {
    await requireAuth()

    const products = await prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!["ADMIN", "MANAGER", "CONTRIBUTOR"].includes(user.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const data = await request.json()
    const { name, sku, brandId, categoryId, barcode, price, currency, quantity, status, description, tags } = data

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    })

    if (existingProduct) {
      return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        brandId,
        categoryId,
        barcode: barcode || null,
        price,
        currency,
        quantity,
        status: status || ProductStatus.DRAFT,
        description: description || null,
        tags: tags || [],
        createdById: user.id,
      },
      include: {
        brand: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        diffJson: { name, sku, brandId, categoryId },
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
