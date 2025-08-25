"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  sn: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

type Tab = "add" | "list";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProductNames, setNewProductNames] = useState("");
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  // Real-time duplicate checking
  const duplicateAnalysis = useMemo(() => {
    if (!newProductNames.trim())
      return { lines: [], duplicates: new Set(), uniqueNames: new Set() };

    const lines = newProductNames
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const existingNames = new Set(products.map((p) => p.name.toLowerCase()));
    const currentNames = new Map<string, number>();
    const duplicates = new Set<string>();
    const uniqueNames = new Set<string>();

    // Check for duplicates within the input
    lines.forEach((name) => {
      const lowerName = name.toLowerCase();
      const count = currentNames.get(lowerName) || 0;
      currentNames.set(lowerName, count + 1);
    });

    lines.forEach((name) => {
      const lowerName = name.toLowerCase();
      const isDuplicateInInput = currentNames.get(lowerName)! > 1;
      const existsInDatabase = existingNames.has(lowerName);

      if (isDuplicateInInput || existsInDatabase) {
        duplicates.add(name);
      } else {
        uniqueNames.add(name);
      }
    });

    return { lines, duplicates, uniqueNames };
  }, [newProductNames, products]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sn.toString().includes(query)
    );
  }, [products, searchQuery]);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        addToast({ description: "Failed to fetch products", type: "error" });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      addToast({ description: "Error fetching products", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Add multiple products
  const addProducts = async () => {
    if (!newProductNames.trim()) {
      addToast({ description: "Please enter product names", type: "error" });
      return;
    }

    try {
      setAdding(true);

      // Split by newlines and filter out empty lines
      const names = newProductNames
        .split("\n")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      if (names.length === 0) {
        addToast({
          description: "Please enter valid product names",
          type: "error",
        });
        return;
      }

      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ names }),
      });

      if (response.ok) {
        const result = await response.json();
        addToast({
          description: `Added ${result.count} products successfully`,
          type: "success",
        });
        setNewProductNames("");
        fetchProducts(); // Refresh the list
      } else {
        const error = await response.json();
        addToast({
          description: error.message || "Failed to add products",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error adding products:", error);
      addToast({ description: "Error adding products", type: "error" });
    } finally {
      setAdding(false);
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        addToast({
          description: "Product deleted successfully",
          type: "success",
        });
        fetchProducts(); // Refresh the list
      } else {
        addToast({ description: "Failed to delete product", type: "error" });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      addToast({ description: "Error deleting product", type: "error" });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Render individual lines with color coding
  const renderProductLine = (line: string, index: number) => {
    const isDuplicate = duplicateAnalysis.duplicates.has(line);
    const isUnique = duplicateAnalysis.uniqueNames.has(line);

    return (
      <div
        key={index}
        className={`px-2 py-1 rounded text-sm ${
          isDuplicate
            ? "bg-red-100 text-red-800 border border-red-200"
            : isUnique
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-gray-100 text-gray-800"
        }`}
      >
        {line}
        {isDuplicate && (
          <span className="ml-2 text-xs font-medium">(Duplicate)</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Product Management
        </h1>
        <p className="text-gray-600">
          Manage your product inventory with auto-generated serial numbers
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("add")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "add"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Add Products
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Product List ({products.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Add Products Tab */}
      {activeTab === "add" && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Products</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="product-names"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product Names (one per line, or paste from Excel)
                </label>
                <textarea
                  id="product-names"
                  value={newProductNames}
                  onChange={(e) => setNewProductNames(e.target.value)}
                  placeholder="Enter product names, one per line:&#10;Product 1&#10;Product 2&#10;Product 3"
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Statistics */}
              {newProductNames.trim() && (
                <div className="text-sm space-y-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-600">
                      Total: {duplicateAnalysis.lines.length}
                    </span>
                    <span className="text-green-600">
                      Unique: {duplicateAnalysis.uniqueNames.size}
                    </span>
                    <span className="text-red-600">
                      Duplicates: {duplicateAnalysis.duplicates.size}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={addProducts}
                disabled={
                  adding ||
                  !newProductNames.trim() ||
                  duplicateAnalysis.uniqueNames.size === 0
                }
                className="w-full"
              >
                {adding
                  ? "Adding..."
                  : `Add ${duplicateAnalysis.uniqueNames.size} Products`}
              </Button>
            </div>

            {/* Preview Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Real-time Preview
              </h3>
              <div className="border border-gray-300 rounded-md p-3 h-40 overflow-y-auto bg-gray-50">
                {duplicateAnalysis.lines.length > 0 ? (
                  <div className="space-y-1">
                    {duplicateAnalysis.lines.map((line, index) =>
                      renderProductLine(line, index)
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Enter product names to see real-time duplicate checking...
                  </p>
                )}
              </div>

              {/* Legend */}
              <div className="mt-3 text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                  <span className="text-gray-600">Unique (will be added)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span className="text-gray-600">
                    Duplicate (will be skipped)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product List Tab */}
      {activeTab === "list" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold">
                Product List ({filteredProducts.length} of {products.length}{" "}
                items)
              </h2>

              {/* Search Input */}
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery
                ? "No products found matching your search."
                : "No products found. Add some products using the Add Products tab."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.sn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={
                            searchQuery &&
                            product.name
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                              ? "bg-yellow-200"
                              : ""
                          }
                        >
                          {product.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
