import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@db/client"

export async function GET() {
  try {
    await requireAuth()

    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(brands)
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

    const { name, description } = await request.json()

    const brand = await prisma.brand.create({
      data: { name, description },
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
