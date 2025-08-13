import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@db/client"

export async function GET() {
  try {
    await requireAuth()

    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!["ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
    }

    const { name, parentId } = await request.json()

    const category = await prisma.category.create({
      data: { name, parentId: parentId || null },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
