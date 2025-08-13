import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@db/client"
import { UserRole } from "@db/client"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireRole([UserRole.ADMIN])

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Generate new temporary password
    const newPassword = Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "RESET_PASSWORD",
        entity: "User",
        entityId: params.id,
        diffJson: { email: user.email },
      },
    })

    return NextResponse.json({
      message: "Password reset successfully",
      newPassword,
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
