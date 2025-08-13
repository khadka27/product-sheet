import { Suspense } from "react"
import { DataTable } from "@/components/products/data-table"
import { CreateProductDialog } from "@/components/products/create-product-dialog"
import { Button } from "@ui/components"
import { Plus } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { prisma } from "@db/client"

export default async function ProductsPage() {
  const user = await getCurrentUser()

  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000, // Limit for initial load, implement pagination for larger datasets
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage your product catalog with advanced spreadsheet features</p>
        </div>
        {user && ["ADMIN", "MANAGER", "CONTRIBUTOR"].includes(user.role) && (
          <CreateProductDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </CreateProductDialog>
        )}
      </div>

      <Suspense fallback={<div>Loading products...</div>}>
        <DataTable data={products} brands={brands} categories={categories} />
      </Suspense>
    </div>
  )
}
