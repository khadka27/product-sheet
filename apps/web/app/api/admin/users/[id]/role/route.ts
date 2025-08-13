import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth-utils"
import { prisma } from "@db/client"
import { UserRole } from "@db/client"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireRole([UserRole.ADMIN])
    const { role } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        actorId: currentUser.id,
        action: "UPDATE_USER_ROLE",
        entity: "User",
        entityId: params.id,
        diffJson: {
          oldRole: user.role,
          newRole: role,
        },
      },
    })

    return NextResponse.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
