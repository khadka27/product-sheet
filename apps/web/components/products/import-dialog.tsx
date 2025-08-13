"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImportError {
  row: number
  field: string
  message: string
}

interface ImportPreview {
  totalRows: number
  validRows: number
  errors: ImportError[]
  duplicates: number
  preview: any[]
}

export function ImportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    // Preview the file
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const response = await fetch("/api/products/import/preview", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const previewData = await response.json()
        setPreview(previewData)
      }
    } catch (error) {
      toast({
        title: "Preview failed",
        description: "Could not preview the file. Please check the format.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!file || !preview) return

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Import completed",
          description: `Successfully imported ${result.imported} products.`,
        })
        setIsOpen(false)
        setFile(null)
        setPreview(null)
        // Refresh the products table
        window.location.reload()
      } else {
        throw new Error("Import failed")
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing your file.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!file && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-lg font-medium cursor-pointer">
                  Choose a file to import
                </Label>
                <p className="text-sm text-gray-500">Supports Excel (.xlsx, .xls) and CSV files</p>
              </div>
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                Select File
              </Button>
            </div>
          )}

          {file && !preview && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Analyzing file...</p>
            </div>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Import Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                >
                  Choose Different File
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                  <div className="text-sm text-gray-600">Valid Rows</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{preview.duplicates}</div>
                  <div className="text-sm text-gray-600">Potential Duplicates</div>
                </div>
              </div>

              {preview.errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {preview.errors.length} validation errors. These rows will be skipped during import.
                  </AlertDescription>
                </Alert>
              )}

              {preview.duplicates > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Found {preview.duplicates} potential duplicates. These will be flagged for review.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Sample Data Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">SKU</th>
                        <th className="px-3 py-2 text-left">Price</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2">{row.sku}</td>
                          <td className="px-3 py-2">${row.price}</td>
                          <td className="px-3 py-2">
                            <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>{row.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing products...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={isUploading || preview.validRows === 0}>
                  {isUploading ? "Importing..." : `Import ${preview.validRows} Products`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
