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

    // Check permissions - only contributors and above can import
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

    if (jsonData.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 })
    }

    // Validate and process data
    const errors: Array<{ row: number; field: string; message: string }> = []
    const validRows: any[] = []
    const skus = new Set<string>()
    let duplicates = 0

    // Get existing SKUs to check for duplicates
    const existingProducts = await db.product.findMany({
      select: { sku: true },
    })
    const existingSKUs = new Set(existingProducts.map((p) => p.sku))

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any
      const rowNumber = i + 2 // Excel row number (1-indexed + header)
      let isValid = true

      // Validate required fields
      if (!row.name || typeof row.name !== "string") {
        errors.push({ row: rowNumber, field: "name", message: "Name is required" })
        isValid = false
      }

      if (!row.sku || typeof row.sku !== "string") {
        errors.push({ row: rowNumber, field: "sku", message: "SKU is required" })
        isValid = false
      } else {
        // Check for duplicates within the file
        if (skus.has(row.sku)) {
          errors.push({ row: rowNumber, field: "sku", message: "Duplicate SKU in file" })
          isValid = false
        } else {
          skus.add(row.sku)
          // Check against existing products
          if (existingSKUs.has(row.sku)) {
            duplicates++
          }
        }
      }

      if (row.price && (isNaN(Number.parseFloat(row.price)) || Number.parseFloat(row.price) < 0)) {
        errors.push({ row: rowNumber, field: "price", message: "Price must be a valid positive number" })
        isValid = false
      }

      if (row.status && !["ACTIVE", "INACTIVE", "DISCONTINUED"].includes(row.status)) {
        errors.push({ row: rowNumber, field: "status", message: "Status must be ACTIVE, INACTIVE, or DISCONTINUED" })
        isValid = false
      }

      if (isValid) {
        validRows.push({
          name: row.name,
          sku: row.sku,
          price: row.price ? Number.parseFloat(row.price) : null,
          status: row.status || "ACTIVE",
          description: row.description || null,
          brand: row.brand || null,
          category: row.category || null,
        })
      }
    }

    return NextResponse.json({
      totalRows: jsonData.length,
      validRows: validRows.length,
      errors: errors.slice(0, 50), // Limit errors shown
      duplicates,
      preview: validRows.slice(0, 10), // Show first 10 valid rows
    })
  } catch (error) {
    console.error("Import preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
