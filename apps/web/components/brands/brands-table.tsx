"use client"

import { useState, useEffect } from "react"
import type { Brand } from "@db/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ui/components"
import { format } from "date-fns"
import { toast } from "sonner"

export function BrandsTable() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands")
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      toast.error("Failed to fetch brands")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading brands...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell className="font-medium">{brand.name}</TableCell>
              <TableCell>{brand.description || "—"}</TableCell>
              <TableCell>{format(new Date(brand.createdAt), "MMM d, yyyy")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
