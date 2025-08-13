import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/packages/db"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    if (!["ADMIN", "MANAGER", "CONTRIBUTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let workbook: XLSX.WorkBook

    try {
      if (file.name.endsWith(".csv")) {
        const csvData = buffer.toString("utf-8")
        workbook = XLSX.read(csvData, { type: "string" })
      } else {
        workbook = XLSX.read(buffer, { type: "buffer" })
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // Get or create brands and categories
    const brandMap = new Map<string, string>()
    const categoryMap = new Map<string, string>()

    for (const row of jsonData as any[]) {
      try {
        // Validate required fields
        if (!row.name || !row.sku) {
          skipped++
          continue
        }

        // Check for existing product with same SKU
        const existing = await db.product.findUnique({
          where: { sku: row.sku },
        })

        if (existing) {
          skipped++
          continue
        }

        // Handle brand
        let brandId = null
        if (row.brand) {
          if (!brandMap.has(row.brand)) {
            const brand = await db.brand.upsert({
              where: { name: row.brand },
              update: {},
              create: { name: row.brand },
            })
            brandMap.set(row.brand, brand.id)
          }
          brandId = brandMap.get(row.brand)!
        }

        // Handle category
        let categoryId = null
        if (row.category) {
          if (!categoryMap.has(row.category)) {
            const category = await db.category.upsert({
              where: { name: row.category },
              update: {},
              create: { name: row.category },
            })
            categoryMap.set(row.category, category.id)
          }
          categoryId = categoryMap.get(row.category)!
        }

        // Create product
        await db.product.create({
          data: {
            name: row.name,
            sku: row.sku,
            description: row.description || null,
            price: row.price ? Number.parseFloat(row.price) : null,
            status: row.status || "ACTIVE",
            brandId,
            categoryId,
            createdById: session.user.id,
          },
        })

        // Create audit log
        await db.auditLog.create({
          data: {
            action: "CREATE",
            entityType: "PRODUCT",
            entityId: row.sku, // Use SKU as identifier
            userId: session.user.id,
            details: `Product imported: ${row.name}`,
          },
        })

        imported++
      } catch (error) {
        console.error("Error importing row:", error)
        errors.push(`Failed to import ${row.name || "unknown product"}`)
        skipped++
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 10), // Limit errors returned
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
