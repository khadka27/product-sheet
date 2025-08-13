"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Merge, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DuplicateReviewDialog } from "@/components/duplicates/duplicate-review-dialog"

interface DuplicateGroup {
  products: any[]
  averageScore: number
  reasons: string[]
}

export default function DuplicatesPage() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)
  const [threshold, setThreshold] = useState(0.7)
  const { toast } = useToast()

  const loadDuplicates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/duplicates?threshold=${threshold}`)
      if (response.ok) {
        const data = await response.json()
        setDuplicateGroups(data)
      }
    } catch (error) {
      toast({
        title: "Error loading duplicates",
        description: "Failed to load duplicate detection results.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scanForDuplicates = async () => {
    try {
      setIsScanning(true)
      const response = await fetch(`/api/duplicates/scan?threshold=${threshold}`, {
        method: "POST",
      })
      if (response.ok) {
        await loadDuplicates()
        toast({
          title: "Scan completed",
          description: "Duplicate detection scan has been completed.",
        })
      }
    } catch (error) {
      toast({
        title: "Scan failed",
        description: "Failed to scan for duplicates.",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    loadDuplicates()
  }, [threshold])

  const getSeverityColor = (score: number) => {
    if (score >= 0.9) return "destructive"
    if (score >= 0.8) return "default"
    return "secondary"
  }

  const getSeverityLabel = (score: number) => {
    if (score >= 0.9) return "High"
    if (score >= 0.8) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Duplicate Detection</h1>
          <p className="text-gray-600">Identify and manage potential duplicate products</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={scanForDuplicates} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Scan for Duplicates"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicateGroups.length}</div>
            <p className="text-xs text-gray-500">Potential duplicate groups found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {duplicateGroups.filter((g) => g.averageScore >= 0.9).length}
            </div>
            <p className="text-xs text-gray-500">Groups requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Products Affected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {duplicateGroups.reduce((sum, group) => sum + group.products.length, 0)}
            </div>
            <p className="text-xs text-gray-500">Total products in duplicate groups</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Duplicates ({duplicateGroups.length})</TabsTrigger>
          <TabsTrigger value="high">
            High Priority ({duplicateGroups.filter((g) => g.averageScore >= 0.9).length})
          </TabsTrigger>
          <TabsTrigger value="medium">
            Medium Priority ({duplicateGroups.filter((g) => g.averageScore >= 0.8 && g.averageScore < 0.9).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading duplicates...</p>
            </div>
          ) : duplicateGroups.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No duplicate groups found. Try adjusting the similarity threshold or scan for new duplicates.
              </AlertDescription>
            </Alert>
          ) : (
            duplicateGroups.map((group, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(group.averageScore)}>
                        {getSeverityLabel(group.averageScore)}
                      </Badge>
                      <span className="text-sm text-gray-500">{Math.round(group.averageScore * 100)}% similarity</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)}>
                      <Merge className="h-4 w-4 mr-2" />
                      Review & Merge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {group.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-3 space-y-2">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          <div className="text-xs text-gray-500">
                            {product.brand?.name && `Brand: ${product.brand.name}`}
                          </div>
                          <div className="text-xs text-gray-500">{product.price && `Price: $${product.price}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {duplicateGroups
            .filter((g) => g.averageScore >= 0.9)
            .map((group, index) => (
              <Card key={index} className="border-red-200 hover:shadow-md transition-shadow">
                {/* Same card content as above */}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">High</Badge>
                      <span className="text-sm text-gray-500">{Math.round(group.averageScore * 100)}% similarity</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)}>
                      <Merge className="h-4 w-4 mr-2" />
                      Review & Merge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {group.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-3 space-y-2">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          <div className="text-xs text-gray-500">
                            {product.brand?.name && `Brand: ${product.brand.name}`}
                          </div>
                          <div className="text-xs text-gray-500">{product.price && `Price: $${product.price}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {duplicateGroups
            .filter((g) => g.averageScore >= 0.8 && g.averageScore < 0.9)
            .map((group, index) => (
              <Card key={index} className="border-yellow-200 hover:shadow-md transition-shadow">
                {/* Same card content structure */}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Medium</Badge>
                      <span className="text-sm text-gray-500">{Math.round(group.averageScore * 100)}% similarity</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedGroup(group)}>
                      <Merge className="h-4 w-4 mr-2" />
                      Review & Merge
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {group.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-3 space-y-2">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          <div className="text-xs text-gray-500">
                            {product.brand?.name && `Brand: ${product.brand.name}`}
                          </div>
                          <div className="text-xs text-gray-500">{product.price && `Price: $${product.price}`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {selectedGroup && (
        <DuplicateReviewDialog
          group={selectedGroup}
          isOpen={!!selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onMergeComplete={() => {
            setSelectedGroup(null)
            loadDuplicates()
          }}
        />
      )}
    </div>
  )
}
