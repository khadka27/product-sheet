import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/packages/db"
import * as XLSX from "xlsx"
import PDFDocument from "pdfkit"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "excel"
    const scope = searchParams.get("scope") || "all"
    const includeImages = searchParams.get("includeImages") === "true"
    const ids = searchParams.get("ids")?.split(",")

    // Build query based on scope and permissions
    const whereClause: any = {}

    if (scope === "selected" && ids) {
      whereClause.id = { in: ids }
    }

    // Apply role-based filtering
    if (session.user.role === "CONTRIBUTOR") {
      whereClause.createdById = session.user.id
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        brand: true,
        category: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (type === "pdf") {
      return generatePDFExport(products, includeImages)
    } else {
      return generateExcelCSVExport(products, type)
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateExcelCSVExport(products: any[], type: string) {
  const data = products.map((product) => ({
    "Product Name": product.name,
    SKU: product.sku,
    Description: product.description || "",
    Price: product.price || "",
    Status: product.status,
    Brand: product.brand?.name || "",
    Category: product.category?.name || "",
    "Created By": product.createdBy?.name || "",
    "Created Date": product.createdAt.toISOString().split("T")[0],
    "Updated Date": product.updatedAt.toISOString().split("T")[0],
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products")

  if (type === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="products.csv"',
      },
    })
  } else {
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="products.xlsx"',
      },
    })
  }
}

function generatePDFExport(products: any[], includeImages: boolean) {
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []

  doc.on("data", (chunk) => chunks.push(chunk))

  return new Promise<NextResponse>((resolve) => {
    doc.on("end", () => {
      const buffer = Buffer.concat(chunks)
      resolve(
        new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="products.pdf"',
          },
        }),
      )
    })

    // PDF Header
    doc.fontSize(20).text("Product Catalog Export", { align: "center" })
    doc.moveDown()
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: "right" })
    doc.moveDown(2)

    // Products
    products.forEach((product, index) => {
      if (index > 0) {
        doc.addPage()
      }

      doc.fontSize(16).text(product.name, { underline: true })
      doc.moveDown(0.5)

      doc.fontSize(12)
      doc.text(`SKU: ${product.sku}`)
      doc.text(`Price: ${product.price ? `$${product.price}` : "N/A"}`)
      doc.text(`Status: ${product.status}`)
      doc.text(`Brand: ${product.brand?.name || "N/A"}`)
      doc.text(`Category: ${product.category?.name || "N/A"}`)
      doc.text(`Created: ${product.createdAt.toLocaleDateString()}`)

      if (product.description) {
        doc.moveDown(0.5)
        doc.text("Description:", { underline: true })
        doc.text(product.description, { width: 500 })
      }
    })

    doc.end()
  })
}
