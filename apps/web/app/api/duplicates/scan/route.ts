import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findDuplicates } from "@/lib/duplicate-detection"
import { db } from "@/packages/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and managers can scan for duplicates
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const threshold = Number.parseFloat(searchParams.get("threshold") || "0.7")

    // Run duplicate detection
    const duplicateGroups = await findDuplicates(threshold)

    // Log the scan
    await db.auditLog.create({
      data: {
        action: "SCAN",
        entityType: "PRODUCT",
        entityId: "duplicate-scan",
        userId: session.user.id,
        details: `Duplicate scan completed. Found ${duplicateGroups.length} potential duplicate groups with threshold ${threshold}`,
      },
    })

    return NextResponse.json({
      success: true,
      groupsFound: duplicateGroups.length,
      threshold,
    })
  } catch (error) {
    console.error("Duplicate scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
