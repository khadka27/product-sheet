"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@ui/components"
import { Search, Filter, X, Save, BookOpen } from "lucide-react"
import { type Brand, type Category, ProductStatus } from "@db/client"
import { toast } from "sonner"
import { debounce } from "lodash"

interface ProductsSearchProps {
  brands: Brand[]
  categories: Category[]
  onFiltersChange: (filters: SearchFilters) => void
}

export interface SearchFilters {
  q?: string
  brandIds?: string[]
  categoryIds?: string[]
  status?: ProductStatus[]
  priceMin?: number
  priceMax?: number
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  createdBy?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export function ProductsSearch({ brands, categories, onFiltersChange }: ProductsSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get("q") || "",
    brandIds: searchParams.getAll("brandId"),
    categoryIds: searchParams.getAll("categoryId"),
    status: searchParams.getAll("status") as ProductStatus[],
    priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : undefined,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : undefined,
    tags: searchParams.getAll("tag"),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  })
  const [savedViews, setSavedViews] = useState<any[]>([])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const newFilters = { ...filters, q: query }
      setFilters(newFilters)
      onFiltersChange(newFilters)
      updateURL(newFilters)
    }, 300),
    [filters],
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  useEffect(() => {
    fetchSavedViews()
  }, [])

  const fetchSavedViews = async () => {
    try {
      const response = await fetch("/api/saved-views")
      if (response.ok) {
        const data = await response.json()
        setSavedViews(data)
      }
    } catch (error) {
      console.error("Failed to fetch saved views:", error)
    }
  }

  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()

    if (newFilters.q) params.set("q", newFilters.q)
    newFilters.brandIds?.forEach((id) => params.append("brandId", id))
    newFilters.categoryIds?.forEach((id) => params.append("categoryId", id))
    newFilters.status?.forEach((status) => params.append("status", status))
    if (newFilters.priceMin) params.set("priceMin", newFilters.priceMin.toString())
    if (newFilters.priceMax) params.set("priceMax", newFilters.priceMax.toString())
    newFilters.tags?.forEach((tag) => params.append("tag", tag))
    if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy)
    if (newFilters.sortOrder) params.set("sortOrder", newFilters.sortOrder)

    router.push(`/products?${params.toString()}`, { scroll: false })
  }

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
    updateURL(updated)
  }

  const clearFilters = () => {
    const cleared: SearchFilters = {
      q: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    }
    setSearchQuery("")
    setFilters(cleared)
    onFiltersChange(cleared)
    router.push("/products")
  }

  const saveCurrentView = async () => {
    const name = prompt("Enter a name for this saved view:")
    if (!name) return

    try {
      const response = await fetch("/api/saved-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters }),
      })

      if (response.ok) {
        toast.success("View saved successfully")
        fetchSavedViews()
      } else {
        toast.error("Failed to save view")
      }
    } catch (error) {
      toast.error("Failed to save view")
    }
  }

  const loadSavedView = (view: any) => {
    setSearchQuery(view.filters.q || "")
    setFilters(view.filters)
    onFiltersChange(view.filters)
    updateURL(view.filters)
  }

  const removeFilter = (type: string, value?: string) => {
    const updated = { ...filters }

    switch (type) {
      case "brand":
        updated.brandIds = updated.brandIds?.filter((id) => id !== value)
        break
      case "category":
        updated.categoryIds = updated.categoryIds?.filter((id) => id !== value)
        break
      case "status":
        updated.status = updated.status?.filter((s) => s !== value)
        break
      case "tag":
        updated.tags = updated.tags?.filter((t) => t !== value)
        break
      case "price":
        delete updated.priceMin
        delete updated.priceMax
        break
    }

    setFilters(updated)
    onFiltersChange(updated)
    updateURL(updated)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.brandIds?.length) count++
    if (filters.categoryIds?.length) count++
    if (filters.status?.length) count++
    if (filters.tags?.length) count++
    if (filters.priceMin || filters.priceMax) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name, SKU, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const brandIds = filters.brandIds || []
                    if (!brandIds.includes(value)) {
                      updateFilters({ brandIds: [...brandIds, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brands..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const categoryIds = filters.categoryIds || []
                    if (!categoryIds.includes(value)) {
                      updateFilters({ categoryIds: [...categoryIds, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select categories..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value=""
                  onValueChange={(value: ProductStatus) => {
                    const status = filters.status || []
                    if (!status.includes(value)) {
                      updateFilters({ status: [...status, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={ProductStatus.ARCHIVED}>Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin || ""}
                    onChange={(e) => updateFilters({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax || ""}
                    onChange={(e) => updateFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-")
            updateFilters({ sortBy, sortOrder: sortOrder as "asc" | "desc" })
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="price-asc">Price Low-High</SelectItem>
            <SelectItem value="price-desc">Price High-Low</SelectItem>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
          </SelectContent>
        </Select>

        {/* Saved Views */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Views
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Saved Views</h4>
                <Button variant="ghost" size="sm" onClick={saveCurrentView}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              {savedViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved views</p>
              ) : (
                savedViews.map((view) => (
                  <Button
                    key={view.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loadSavedView(view)}
                  >
                    {view.name}
                  </Button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {(filters.brandIds?.length ||
        filters.categoryIds?.length ||
        filters.status?.length ||
        filters.tags?.length ||
        filters.priceMin ||
        filters.priceMax) && (
        <div className="flex flex-wrap gap-2">
          {filters.brandIds?.map((brandId) => {
            const brand = brands.find((b) => b.id === brandId)
            return (
              <Badge key={brandId} variant="secondary" className="flex items-center gap-1">
                Brand: {brand?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("brand", brandId)} />
              </Badge>
            )
          })}
          {filters.categoryIds?.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId)
            return (
              <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                Category: {category?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("category", categoryId)} />
              </Badge>
            )
          })}
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1">
              Status: {status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("status", status)} />
            </Badge>
          ))}
          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              Tag: {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("tag", tag)} />
            </Badge>
          ))}
          {(filters.priceMin || filters.priceMax) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: {filters.priceMin || 0} - {filters.priceMax || "∞"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter("price")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
