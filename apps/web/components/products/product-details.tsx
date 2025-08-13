import type { Product, Brand, Category } from "@db/client"
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@ui/components"
import { Edit, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { canEditProduct } from "@/lib/auth-utils"

interface ProductWithRelations extends Product {
  brand: Brand
  category: Category
  createdBy: { id: string; name: string | null; email: string }
}

interface ProductDetailsProps {
  product: ProductWithRelations
  currentUser: any
}

export function ProductDetails({ product, currentUser }: ProductDetailsProps) {
  const canEdit = currentUser && canEditProduct(currentUser.role, product.createdById, currentUser.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/products/${product.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Brand</p>
                <p className="text-sm">{product.brand.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <p className="text-sm">{product.category.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="text-sm">
                  {product.currency} {product.price.toString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-sm">{product.quantity}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="default">{product.status}</Badge>
              </div>
              {product.barcode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                  <p className="text-sm font-mono">{product.barcode}</p>
                </div>
              )}
            </div>
            {product.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {product.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p className="text-sm">{product.createdBy.name || product.createdBy.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{format(new Date(product.createdAt), "PPP")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{format(new Date(product.updatedAt), "PPP")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
