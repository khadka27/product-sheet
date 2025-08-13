"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { type Product, type Brand, type Category, ProductStatus } from "@db/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { ProductsSearch, type SearchFilters } from "./products-search"

interface ProductWithRelations extends Product {
  brand: Brand
  category: Category
  createdBy: { id: string; name: string | null; email: string }
}

export function ProductsTable() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchBrandsAndCategories()
  }, [])

  const fetchBrandsAndCategories = async () => {
    try {
      const [brandsRes, categoriesRes] = await Promise.all([fetch("/api/brands"), fetch("/api/categories")])

      if (brandsRes.ok && categoriesRes.ok) {
        const [brandsData, categoriesData] = await Promise.all([brandsRes.json(), categoriesRes.json()])
        setBrands(brandsData)
        setCategories(categoriesData)
      }
    } catch (error) {
      toast.error("Failed to load brands and categories")
    }
  }

  const fetchProducts = async (filters: SearchFilters = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filters.q) params.set("q", filters.q)
      filters.brandIds?.forEach((id) => params.append("brandId", id))
      filters.categoryIds?.forEach((id) => params.append("categoryId", id))
      filters.status?.forEach((status) => params.append("status", status))
      if (filters.priceMin) params.set("priceMin", filters.priceMin.toString())
      if (filters.priceMax) params.set("priceMax", filters.priceMax.toString())
      filters.tags?.forEach((tag) => params.append("tag", tag))
      if (filters.sortBy) params.set("sortBy", filters.sortBy)
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder)

      const response = await fetch(`/api/products/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        setTotalCount(data.total)
      }
    } catch (error) {
      toast.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Product deleted successfully")
        fetchProducts()
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      toast.error("Failed to delete product")
    }
  }

  const canEdit = (product: ProductWithRelations) => {
    if (!session?.user) return false
    const userRole = session.user.role
    if (["ADMIN", "MANAGER"].includes(userRole)) return true
    if (userRole === "CONTRIBUTOR" && product.createdById === session.user.id) return true
    return false
  }

  const canDelete = (product: ProductWithRelations) => {
    if (!session?.user) return false
    return ["ADMIN", "MANAGER"].includes(session.user.role)
  }

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return "default"
      case ProductStatus.ARCHIVED:
        return "secondary"
      case ProductStatus.DRAFT:
        return "outline"
    }
  }

  const highlightSearchTerm = (text: string, searchTerm?: string) => {
    if (!searchTerm) return text

    const regex = new RegExp(`(${searchTerm})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="space-y-4">
      <ProductsSearch brands={brands} categories={categories} onFiltersChange={fetchProducts} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} product{totalCount !== 1 ? "s" : ""} found
        </p>
      </div>

      {loading ? (
        <div>Loading products...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{highlightSearchTerm(product.name)}</TableCell>
                  <TableCell className="font-mono text-sm">{highlightSearchTerm(product.sku)}</TableCell>
                  <TableCell>{product.brand.name}</TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>
                    {product.currency} {product.price.toString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)}>{product.status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(product.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEdit(product) && (
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDelete(product) && (
                          <DropdownMenuItem onClick={() => deleteProduct(product.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
