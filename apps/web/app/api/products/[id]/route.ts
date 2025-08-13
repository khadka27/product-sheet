import { type NextRequest, NextResponse } from "next/server"
import { requireAuth, canDeleteProduct, canEditProduct } from "@/lib/auth-utils"
import { prisma } from "@db/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        brand: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    if (!canEditProduct(user.role, product.createdById, user.id)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const data = await request.json()
    const { name, sku, brandId, categoryId, barcode, price, currency, quantity, status, description, tags } = data

    // Check if SKU already exists (excluding current product)
    const existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        id: { not: params.id },
      },
    })

    if (existingProduct) {
      return NextResponse.json({ message: "SKU already exists" }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        sku,
        brandId,
        categoryId,
        barcode: barcode || null,
        price,
        currency,
        quantity,
        status,
        description: description || null,
        tags: tags || [],
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
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: params.id,
        diffJson: {
          oldName: product.name,
          newName: name,
          oldSku: product.sku,
          newSku: sku,
        },
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()

    if (!canDeleteProduct(user.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: params.id,
        diffJson: { name: product.name, sku: product.sku },
      },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
