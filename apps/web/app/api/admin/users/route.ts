import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@db/client"
import { UserRole } from "@db/client"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    await requireRole([UserRole.ADMIN])

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([UserRole.ADMIN])

    const { name, email, role } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: (await requireRole([UserRole.ADMIN])).id,
        action: "CREATE_USER",
        entity: "User",
        entityId: user.id,
        diffJson: { name, email, role },
      },
    })

    return NextResponse.json({
      message: "User created successfully",
      password: tempPassword,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
