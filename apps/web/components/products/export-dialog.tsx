"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExportDialogProps {
  selectedRows?: any[]
  totalRows?: number
}

export function ExportDialog({ selectedRows = [], totalRows = 0 }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportType, setExportType] = useState<"excel" | "csv" | "pdf">("excel")
  const [exportScope, setExportScope] = useState<"all" | "filtered" | "selected">("all")
  const [includeImages, setIncludeImages] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const params = new URLSearchParams({
        type: exportType,
        scope: exportScope,
        includeImages: includeImages.toString(),
      })

      if (exportScope === "selected" && selectedRows.length > 0) {
        params.append("ids", selectedRows.map((row) => row.id).join(","))
      }

      const response = await fetch(`/api/products/export?${params}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url

        const filename = `products_${new Date().toISOString().split("T")[0]}.${exportType === "excel" ? "xlsx" : exportType}`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Export completed",
          description: `Products exported successfully as ${exportType.toUpperCase()}.`,
        })
        setIsOpen(false)
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getExportCount = () => {
    switch (exportScope) {
      case "selected":
        return selectedRows.length
      case "filtered":
        return totalRows
      case "all":
      default:
        return totalRows
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  CSV (.csv)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                  <FileText className="h-4 w-4 mr-2 text-red-600" />
                  PDF (.pdf)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Export Scope</Label>
            <RadioGroup value={exportScope} onValueChange={(value: any) => setExportScope(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  All products ({totalRows})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered" className="cursor-pointer">
                  Current filtered results ({totalRows})
                </Label>
              </div>
              {selectedRows.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="cursor-pointer">
                    Selected products ({selectedRows.length})
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="include-images" checked={includeImages} onCheckedChange={setIncludeImages} />
            <Label htmlFor="include-images" className="cursor-pointer">
              Include product images (PDF only)
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || getExportCount() === 0}>
              {isExporting ? "Exporting..." : `Export ${getExportCount()} Products`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
