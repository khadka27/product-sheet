import { notFound } from "next/navigation"
import { prisma } from "@db/client"
import { ProductDetails } from "@/components/products/product-details"
import { getCurrentUser } from "@/lib/auth-utils"

interface ProductPageProps {
  params: { id: string }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const user = await getCurrentUser()

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      brand: true,
      category: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductDetails product={product} currentUser={user} />
    </div>
  )
}
