"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Merge, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DuplicateGroup {
  products: any[]
  averageScore: number
  reasons: string[]
}

interface DuplicateReviewDialogProps {
  group: DuplicateGroup
  isOpen: boolean
  onClose: () => void
  onMergeComplete: () => void
}

export function DuplicateReviewDialog({ group, isOpen, onClose, onMergeComplete }: DuplicateReviewDialogProps) {
  const [primaryProductId, setPrimaryProductId] = useState<string>("")
  const [mergeOptions, setMergeOptions] = useState({
    keepName: true,
    keepDescription: true,
    keepPrice: true,
    keepBrand: true,
    keepCategory: true,
  })
  const [isMerging, setIsMerging] = useState(false)
  const { toast } = useToast()

  const handleMerge = async () => {
    if (!primaryProductId) {
      toast({
        title: "No primary product selected",
        description: "Please select which product to keep as the primary.",
        variant: "destructive",
      })
      return
    }

    const duplicateIds = group.products.filter((p) => p.id !== primaryProductId).map((p) => p.id)

    if (duplicateIds.length === 0) {
      toast({
        title: "No duplicates to merge",
        description: "At least two products are required for merging.",
        variant: "destructive",
      })
      return
    }

    setIsMerging(true)

    try {
      const response = await fetch("/api/duplicates/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryProductId,
          duplicateProductIds: duplicateIds,
          mergeOptions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Products merged successfully",
          description: `${duplicateIds.length} duplicate products have been merged.`,
        })
        onMergeComplete()
      } else {
        throw new Error("Merge failed")
      }
    } catch (error) {
      toast({
        title: "Merge failed",
        description: "There was an error merging the products.",
        variant: "destructive",
      })
    } finally {
      setIsMerging(false)
    }
  }

  const primaryProduct = group.products.find((p) => p.id === primaryProductId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Merge className="h-5 w-5 mr-2" />
            Review & Merge Duplicates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Similarity: {Math.round(group.averageScore * 100)}%</strong>
              <br />
              Detected reasons: {group.reasons.join(", ")}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Label className="text-base font-medium">Select Primary Product (to keep)</Label>
            <RadioGroup value={primaryProductId} onValueChange={setPrimaryProductId}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.products.map((product) => (
                  <div key={product.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={product.id} id={product.id} />
                      <Label htmlFor={product.id} className="cursor-pointer font-medium">
                        Primary Product
                      </Label>
                    </div>
                    <Card className={primaryProductId === product.id ? "ring-2 ring-blue-500" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <strong>SKU:</strong> {product.sku}
                        </div>
                        <div>
                          <strong>Price:</strong> {product.price ? `$${product.price}` : "N/A"}
                        </div>
                        <div>
                          <strong>Status:</strong> <Badge variant="outline">{product.status}</Badge>
                        </div>
                        {product.brand && (
                          <div>
                            <strong>Brand:</strong> {product.brand.name}
                          </div>
                        )}
                        {product.category && (
                          <div>
                            <strong>Category:</strong> {product.category.name}
                          </div>
                        )}
                        {product.description && (
                          <div>
                            <strong>Description:</strong> {product.description.substring(0, 100)}...
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Created: {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {primaryProduct && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Merge Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keepName"
                    checked={mergeOptions.keepName}
                    onCheckedChange={(checked) => setMergeOptions((prev) => ({ ...prev, keepName: !!checked }))}
                  />
                  <Label htmlFor="keepName" className="cursor-pointer">
                    Keep primary product name
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keepDescription"
                    checked={mergeOptions.keepDescription}
                    onCheckedChange={(checked) => setMergeOptions((prev) => ({ ...prev, keepDescription: !!checked }))}
                  />
                  <Label htmlFor="keepDescription" className="cursor-pointer">
                    Keep primary product description
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keepPrice"
                    checked={mergeOptions.keepPrice}
                    onCheckedChange={(checked) => setMergeOptions((prev) => ({ ...prev, keepPrice: !!checked }))}
                  />
                  <Label htmlFor="keepPrice" className="cursor-pointer">
                    Keep primary product price
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keepBrand"
                    checked={mergeOptions.keepBrand}
                    onCheckedChange={(checked) => setMergeOptions((prev) => ({ ...prev, keepBrand: !!checked }))}
                  />
                  <Label htmlFor="keepBrand" className="cursor-pointer">
                    Keep primary product brand
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="keepCategory"
                    checked={mergeOptions.keepCategory}
                    onCheckedChange={(checked) => setMergeOptions((prev) => ({ ...prev, keepCategory: !!checked }))}
                  />
                  <Label htmlFor="keepCategory" className="cursor-pointer">
                    Keep primary product category
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!primaryProductId || isMerging}
              className="bg-red-600 hover:bg-red-700"
            >
              {isMerging ? "Merging..." : `Merge ${group.products.length - 1} Duplicates`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
