import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, canEditProduct } from "@/lib/auth-utils"
import { prisma } from "@db/client"

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { productIds, updates } = await request.json()

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ message: "Invalid product IDs" }, { status: 400 })
    }

    // Check permissions for each product
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, createdById: true, name: true },
    })

    const unauthorizedProducts = products.filter((product) => !canEditProduct(user.role, product.createdById, user.id))

    if (unauthorizedProducts.length > 0) {
      return NextResponse.json(
        { message: `Insufficient permissions for ${unauthorizedProducts.length} products` },
        { status: 403 },
      )
    }

    // Perform bulk update
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: updates,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "BULK_UPDATE_PRODUCTS",
        entity: "Product",
        entityId: "bulk",
        diffJson: {
          productIds,
          updates,
          count: result.count,
        },
      },
    })

    return NextResponse.json({
      message: `${result.count} products updated successfully`,
      count: result.count,
    })
  } catch (error) {
    console.error("Bulk update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
