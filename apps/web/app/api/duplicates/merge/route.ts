import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { mergeDuplicates } from "@/lib/duplicate-detection"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and managers can merge duplicates
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { primaryProductId, duplicateProductIds, mergeOptions } = await request.json()

    if (!primaryProductId || !duplicateProductIds || duplicateProductIds.length === 0) {
      return NextResponse.json({ error: "Invalid merge parameters" }, { status: 400 })
    }

    await mergeDuplicates(primaryProductId, duplicateProductIds, mergeOptions)

    return NextResponse.json({
      success: true,
      merged: duplicateProductIds.length,
    })
  } catch (error) {
    console.error("Merge duplicates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
