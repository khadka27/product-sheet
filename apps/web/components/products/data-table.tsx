"use client"

import React from "react"
import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Checkbox,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@ui/components"
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Settings,
  Download,
  Archive,
  Tag,
  Copy,
  ArrowUpDown,
  Pin,
  PinOff,
} from "lucide-react"
import { type Product, type Brand, type Category, ProductStatus } from "@db/client"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import { canEditProduct, canDeleteProduct } from "@/lib/auth-utils"

interface ProductWithRelations extends Product {
  brand: Brand
  category: Category
  createdBy: { id: string; name: string | null; email: string }
}

interface DataTableProps {
  data: ProductWithRelations[]
  brands: Brand[]
  categories: Category[]
  onDataChange?: () => void
}

export function DataTable({ data, brands, categories, onDataChange }: DataTableProps) {
  const { data: session } = useSession()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnPinning, setColumnPinning] = useState({ left: ["select", "name"], right: ["actions"] })
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)

  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const columns = useMemo<ColumnDef<ProductWithRelations>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedRows((prev) => ({ ...prev, [row.id]: !prev[row.id] }))}
          >
            {expandedRows[row.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row, getValue, column }) => {
          const value = getValue() as string
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id

          if (isEditing) {
            return (
              <Input
                defaultValue={value}
                onBlur={(e) => {
                  handleCellEdit(row.original.id, "name", e.target.value)
                  setEditingCell(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCellEdit(row.original.id, "name", e.currentTarget.value)
                    setEditingCell(null)
                  }
                  if (e.key === "Escape") {
                    setEditingCell(null)
                  }
                }}
                autoFocus
                className="h-8"
              />
            )
          }

          return (
            <div
              className="cursor-pointer hover:bg-muted/50 p-1 rounded"
              onClick={() => {
                if (canEdit(row.original)) {
                  setEditingCell({ rowId: row.id, columnId: column.id })
                }
              }}
            >
              {value}
            </div>
          )
        },
        size: 200,
      },
      {
        accessorKey: "sku",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            SKU
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row, getValue }) => <span className="font-mono text-sm">{getValue() as string}</span>,
        size: 150,
      },
      {
        accessorKey: "brand.name",
        header: "Brand",
        cell: ({ row }) => row.original.brand.name,
        size: 120,
      },
      {
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => row.original.category.name,
        size: 120,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row, getValue, column }) => {
          const value = getValue() as number
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id

          if (isEditing) {
            return (
              <Input
                type="number"
                step="0.01"
                defaultValue={value.toString()}
                onBlur={(e) => {
                  handleCellEdit(row.original.id, "price", Number.parseFloat(e.target.value))
                  setEditingCell(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCellEdit(row.original.id, "price", Number.parseFloat(e.currentTarget.value))
                    setEditingCell(null)
                  }
                  if (e.key === "Escape") {
                    setEditingCell(null)
                  }
                }}
                autoFocus
                className="h-8"
              />
            )
          }

          return (
            <div
              className="cursor-pointer hover:bg-muted/50 p-1 rounded"
              onClick={() => {
                if (canEdit(row.original)) {
                  setEditingCell({ rowId: row.id, columnId: column.id })
                }
              }}
            >
              {row.original.currency} {value.toString()}
            </div>
          )
        },
        size: 100,
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row, getValue, column }) => {
          const value = getValue() as number
          const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id

          if (isEditing) {
            return (
              <Input
                type="number"
                defaultValue={value.toString()}
                onBlur={(e) => {
                  handleCellEdit(row.original.id, "quantity", Number.parseInt(e.target.value))
                  setEditingCell(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCellEdit(row.original.id, "quantity", Number.parseInt(e.currentTarget.value))
                    setEditingCell(null)
                  }
                  if (e.key === "Escape") {
                    setEditingCell(null)
                  }
                }}
                autoFocus
                className="h-8"
              />
            )
          }

          return (
            <div
              className="cursor-pointer hover:bg-muted/50 p-1 rounded text-center"
              onClick={() => {
                if (canEdit(row.original)) {
                  setEditingCell({ rowId: row.id, columnId: column.id })
                }
              }}
            >
              {value}
            </div>
          )
        },
        size: 80,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
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
          return <Badge variant={getStatusColor(status)}>{status}</Badge>
        },
        size: 100,
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
          const tags = row.original.tags
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>}
            </div>
          )
        },
        size: 150,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
        size: 120,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/products/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit(row.original) && (
                <DropdownMenuItem asChild>
                  <Link href={`/products/${row.original.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => copyToClipboard(row.original)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Row
              </DropdownMenuItem>
              {canDelete(row.original) && (
                <DropdownMenuItem onClick={() => deleteProduct(row.original.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 60,
      },
    ],
    [editingCell, expandedRows, session],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnPinning,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 60,
    overscan: 10,
  })

  const canEdit = (product: ProductWithRelations) => {
    if (!session?.user) return false
    return canEditProduct(session.user.role, product.createdById, session.user.id)
  }

  const canDelete = (product: ProductWithRelations) => {
    if (!session?.user) return false
    return canDeleteProduct(session.user.role)
  }

  const handleCellEdit = async (productId: string, field: string, value: any) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        toast.success("Product updated successfully")
        onDataChange?.()
      } else {
        toast.error("Failed to update product")
      }
    } catch (error) {
      toast.error("Failed to update product")
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
        onDataChange?.()
      } else {
        toast.error("Failed to delete product")
      }
    } catch (error) {
      toast.error("Failed to delete product")
    }
  }

  const copyToClipboard = (product: ProductWithRelations) => {
    const text = `${product.name}\t${product.sku}\t${product.brand.name}\t${product.category.name}\t${product.price}`
    navigator.clipboard.writeText(text)
    toast.success("Product data copied to clipboard")
  }

  const bulkArchive = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const productIds = selectedRows.map((row) => row.original.id)

    try {
      const response = await fetch("/api/products/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, updates: { status: ProductStatus.ARCHIVED } }),
      })

      if (response.ok) {
        toast.success(`${productIds.length} products archived`)
        setRowSelection({})
        onDataChange?.()
      } else {
        toast.error("Failed to archive products")
      }
    } catch (error) {
      toast.error("Failed to archive products")
    }
  }

  const bulkAssignCategory = async (categoryId: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const productIds = selectedRows.map((row) => row.original.id)

    try {
      const response = await fetch("/api/products/bulk-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, updates: { categoryId } }),
      })

      if (response.ok) {
        toast.success(`${productIds.length} products updated`)
        setRowSelection({})
        onDataChange?.()
      } else {
        toast.error("Failed to update products")
      }
    } catch (error) {
      toast.error("Failed to update products")
    }
  }

  const selectedRowsCount = Object.keys(rowSelection).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {selectedRowsCount > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedRowsCount} selected</span>
              <Button variant="outline" size="sm" onClick={bulkArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="mr-2 h-4 w-4" />
                    Assign Category
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} onClick={() => bulkAssignCategory(category.id)}>
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selectedData = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
                  const csvContent = selectedData
                    .map((product) => `${product.name},${product.sku},${product.brand.name},${product.price}`)
                    .join("\n")
                  navigator.clipboard.writeText(csvContent)
                  toast.success("Selected products copied to clipboard")
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Selected
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="rounded-md border overflow-auto"
        style={{ height: "600px" }}
        onKeyDown={(e) => {
          // Keyboard navigation
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault()
            // Handle row navigation
          }
        }}
      >
        <Table style={{ width: table.getCenterTotalSize() }}>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }} className="relative border-r">
                    <div className="flex items-center justify-between">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanPin() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const isPinned = header.column.getIsPinned()
                            header.column.pin(isPinned ? false : "left")
                          }}
                        >
                          {header.column.getIsPinned() ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 bg-border cursor-col-resize hover:bg-primary"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="absolute w-full"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} style={{ width: cell.column.getSize() }} className="border-r">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows[row.id] && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={columns.length} className="p-4">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Description:</span>
                              <p className="mt-1">{row.original.description || "No description"}</p>
                            </div>
                            <div>
                              <span className="font-medium">All Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {row.original.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created by {row.original.createdBy.name || row.original.createdBy.email} on{" "}
                            {format(new Date(row.original.createdAt), "PPP")}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected
        </div>
        <div>Showing {rows.length} products</div>
      </div>
    </div>
  )
}
