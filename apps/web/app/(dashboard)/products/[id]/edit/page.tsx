import { notFound, redirect } from "next/navigation"
import { prisma } from "@db/client"
import { getCurrentUser, canEditProduct } from "@/lib/auth-utils"
import { EditProductForm } from "@/components/products/edit-product-form"

interface EditProductPageProps {
  params: { id: string }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const user = await getCurrentUser()

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      brand: true,
      category: true,
    },
  })

  if (!product) {
    notFound()
  }

  if (!user || !canEditProduct(user.role, product.createdById, user.id)) {
    redirect("/products")
  }

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
        <p className="text-muted-foreground">Update product information</p>
      </div>
      <EditProductForm product={product} brands={brands} categories={categories} />
    </div>
  )
}
