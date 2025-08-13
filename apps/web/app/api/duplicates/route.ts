import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { findDuplicates } from "@/lib/duplicate-detection"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins and managers can view duplicates
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const threshold = Number.parseFloat(searchParams.get("threshold") || "0.7")

    const duplicateGroups = await findDuplicates(threshold)
    return NextResponse.json(duplicateGroups)
  } catch (error) {
    console.error("Duplicates API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
