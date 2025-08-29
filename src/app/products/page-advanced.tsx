"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";

// Define the Product interface based on your new Google Sheets columns
interface Product {
  id: string;
  sn: number;
  productName: string;
  productResearchBy: string;
  status: string;
  articleAssignedTo: string;
  trends: string;
  duplicate: string;
  approvalStatus: string;
  offerInWhichAffiliate: string;
  pettyLinkStatus: string;
  affiliateLink: string;
  affiliatePersonName: string;
  websiteTrackingLink: string;
  pettyLinks: string;
  referenceLink: string;
  articleBy: string;
  category: string;
  dateAddedOn: string;
  country: string;
  commission: string;
  vsl: string;
  createdAt: Date;
  updatedAt: Date;
}

// Search filters interface
interface SearchFilters {
  productName: string;
  status: string;
  category: string;
  country: string;
  affiliatePersonName: string;
  approvalStatus: string;
  trends: string;
  duplicate: string;
}

// Advanced similarity calculation function
const calculateSimilarity = (text1: string, text2: string): number => {
  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const str1 = normalize(text1);
  const str2 = normalize(text2);

  if (str1 === str2) return 100;
  if (str1.includes(str2) || str2.includes(str1)) return 90;

  // Levenshtein distance calculation
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  const similarity =
    ((maxLength - matrix[str2.length][str1.length]) / maxLength) * 100;
  return Math.round(similarity);
};

// Check for duplicates and return similarity scores
const checkDuplicates = (
  products: Product[],
  productName: string,
  excludeId?: string
) => {
  const duplicates = products
    .filter((p) => p.id !== excludeId && p.productName.trim())
    .map((p) => ({
      product: p,
      similarity: calculateSimilarity(productName, p.productName),
    }))
    .filter((item) => item.similarity >= 70)
    .sort((a, b) => b.similarity - a.similarity);

  return duplicates;
};

// Check if a product matches search criteria with similarity scoring
const isProductMatch = (
  product: Product,
  filters: SearchFilters
): { isMatch: boolean; similarity: number } => {
  let similarity = 0;

  // Check product name with similarity scoring
  if (filters.productName) {
    similarity = calculateSimilarity(filters.productName, product.productName);
    if (similarity < 70) {
      return { isMatch: false, similarity: 0 };
    }
  }

  // Check other filters
  if (
    filters.status &&
    !product.status.toLowerCase().includes(filters.status.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.category &&
    !product.category.toLowerCase().includes(filters.category.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.country &&
    !product.country.toLowerCase().includes(filters.country.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.affiliatePersonName &&
    !product.affiliatePersonName
      .toLowerCase()
      .includes(filters.affiliatePersonName.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.approvalStatus &&
    !product.approvalStatus
      .toLowerCase()
      .includes(filters.approvalStatus.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.trends &&
    !product.trends.toLowerCase().includes(filters.trends.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  if (
    filters.duplicate &&
    !product.duplicate.toLowerCase().includes(filters.duplicate.toLowerCase())
  ) {
    return { isMatch: false, similarity: 0 };
  }

  return { isMatch: true, similarity: similarity || 100 };
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { addToast } = useToast();

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    productName: "",
    status: "",
    category: "",
    country: "",
    affiliatePersonName: "",
    approvalStatus: "",
    trends: "",
    duplicate: "",
  });

  // State for new product entry
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [nextSN, setNextSN] = useState<number>(1);

  // Unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const values = {
      statuses: new Set<string>(),
      categories: new Set<string>(),
      countries: new Set<string>(),
      affiliatePersonNames: new Set<string>(),
      approvalStatuses: new Set<string>(),
      trends: new Set<string>(),
      duplicates: new Set<string>(),
    };

    products.forEach((product) => {
      if (product.status) values.statuses.add(product.status);
      if (product.category) values.categories.add(product.category);
      if (product.country) values.countries.add(product.country);
      if (product.affiliatePersonName)
        values.affiliatePersonNames.add(product.affiliatePersonName);
      if (product.approvalStatus)
        values.approvalStatuses.add(product.approvalStatus);
      if (product.trends) values.trends.add(product.trends);
      if (product.duplicate) values.duplicates.add(product.duplicate);
    });

    return {
      statuses: Array.from(values.statuses).sort(),
      categories: Array.from(values.categories).sort(),
      countries: Array.from(values.countries).sort(),
      affiliatePersonNames: Array.from(values.affiliatePersonNames).sort(),
      approvalStatuses: Array.from(values.approvalStatuses).sort(),
      trends: Array.from(values.trends).sort(),
      duplicates: Array.from(values.duplicates).sort(),
    };
  }, [products]);

  // Filter products based on search criteria
  const filteredProducts = useMemo(() => {
    // First filter out products with blank names
    const nonBlankProducts = products.filter((product) =>
      product.productName.trim()
    );

    if (Object.values(searchFilters).every((filter) => !filter.trim())) {
      return nonBlankProducts.map((product) => ({ product, similarity: 100 }));
    }

    return nonBlankProducts
      .map((product) => {
        const matchResult = isProductMatch(product, searchFilters);
        return {
          product,
          similarity: matchResult.similarity,
          isMatch: matchResult.isMatch,
        };
      })
      .filter((item) => item.isMatch)
      .sort((a, b) => b.similarity - a.similarity);
  }, [products, searchFilters]);

  // Duplicate analysis for bulk checking
  const duplicateAnalysis = useMemo(() => {
    const duplicateMap = new Map<string, Product[]>();
    const nonBlankProducts = products.filter((p) => p.productName.trim());

    nonBlankProducts.forEach((product) => {
      const duplicates = checkDuplicates(
        nonBlankProducts,
        product.productName,
        product.id
      );
      if (duplicates.length > 0) {
        const key = product.productName.toLowerCase();
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key)!.push(product);
      }
    });

    return duplicateMap;
  }, [products]);

  // Fetch all products from Google Sheets
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);

        // Calculate next serial number
        const maxSN =
          data.length > 0 ? Math.max(...data.map((p: Product) => p.sn)) : 0;
        setNextSN(maxSN + 1);
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

  // Add new product
  const addProduct = useCallback(async () => {
    if (!newProduct.productName?.trim()) {
      addToast({ description: "Product name is required", type: "error" });
      return;
    }

    // Check for duplicates
    const duplicates = checkDuplicates(products, newProduct.productName);
    if (duplicates.length > 0) {
      addToast({
        description: `Similar product found: ${duplicates[0].product.productName} (${duplicates[0].similarity}% match)`,
        type: "warning",
      });
    }

    try {
      setAdding(true);
      const productToSave = {
        ...newProduct,
        id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sn: nextSN,
        createdAt: new Date(),
        updatedAt: new Date(),
        dateAddedOn: new Date().toLocaleDateString(),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productToSave),
      });

      if (response.ok) {
        addToast({
          description: "Product added successfully",
          type: "success",
        });
        setNewProduct({});
        setNextSN((prev) => prev + 1);
        fetchProducts(); // Refresh the list
      } else {
        addToast({ description: "Failed to add product", type: "error" });
      }
    } catch (error) {
      console.error("Error adding product:", error);
      addToast({ description: "Error adding product", type: "error" });
    } finally {
      setAdding(false);
    }
  }, [newProduct, products, nextSN, fetchProducts, addToast]);

  // Update search filter
  const updateFilter = useCallback(
    (field: keyof SearchFilters, value: string) => {
      setSearchFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchFilters({
      productName: "",
      status: "",
      category: "",
      country: "",
      affiliatePersonName: "",
      approvalStatus: "",
      trends: "",
      duplicate: "",
    });
  }, []);

  // Get row styling based on duplicate status
  const getRowStyling = (product: Product) => {
    const duplicates = checkDuplicates(
      products,
      product.productName,
      product.id
    );
    if (duplicates.length > 0) {
      return "bg-red-50 border-l-4 border-red-400"; // Light red for duplicates
    }
    return "bg-green-50 border-l-4 border-green-400"; // Light green for non-duplicates
  };

  // Get similarity badge
  const getSimilarityBadge = (similarity: number) => {
    if (similarity === 100)
      return (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          100%
        </span>
      );
    if (similarity >= 90)
      return (
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          90%+
        </span>
      );
    if (similarity >= 80)
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
          80%+
        </span>
      );
    if (similarity >= 70)
      return (
        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
          70%+
        </span>
      );
    return null;
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const hasActiveFilters = Object.values(searchFilters).some((filter) =>
    filter.trim()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Product Management System
          </h1>
          <div className="flex gap-2">
            <button
              onClick={fetchProducts}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Bulk Duplicate Analysis */}
        {duplicateAnalysis.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Duplicate Analysis
            </h3>
            <p className="text-yellow-700">
              Found {duplicateAnalysis.size} groups of potential duplicates
            </p>
          </div>
        )}

        {/* Add New Product Form */}
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ➕ Add New Product
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={newProduct.productName || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    productName: e.target.value,
                  }))
                }
                placeholder="Enter product name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <input
                type="text"
                value={newProduct.status || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, status: e.target.value }))
                }
                placeholder="Status..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={newProduct.category || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="Category..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={newProduct.country || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                placeholder="Country..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Person
              </label>
              <input
                type="text"
                value={newProduct.affiliatePersonName || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    affiliatePersonName: e.target.value,
                  }))
                }
                placeholder="Affiliate person..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission
              </label>
              <input
                type="text"
                value={newProduct.commission || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    commission: e.target.value,
                  }))
                }
                placeholder="Commission..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={addProduct}
              disabled={adding || !newProduct.productName?.trim()}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md font-medium"
            >
              {adding ? "⏳ Adding..." : "✅ Add Product"}
            </button>
          </div>
        </div>

        {/* Advanced Search & Filters */}
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              🔍 Advanced Search & Filters
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🗑️ Clear All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Name Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Product Name (Smart Search)
              </label>
              <input
                type="text"
                value={searchFilters.productName}
                onChange={(e) => updateFilter("productName", e.target.value)}
                placeholder="Search with 70-100% matching..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Status
              </label>
              <select
                value={searchFilters.status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {uniqueValues.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📂 Category
              </label>
              <select
                value={searchFilters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {uniqueValues.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌍 Country
              </label>
              <select
                value={searchFilters.country}
                onChange={(e) => updateFilter("country", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {uniqueValues.countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Results Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-medium text-blue-900">
              {hasActiveFilters ? (
                <>
                  🎯 Showing {filteredProducts.length} of{" "}
                  {products.filter((p) => p.productName.trim()).length} products
                </>
              ) : (
                <>
                  📊 Total:{" "}
                  {products.filter((p) => p.productName.trim()).length} products
                  (blank names filtered out)
                </>
              )}
            </div>
            {searchFilters.productName && (
              <div className="text-sm text-blue-700 mt-2">
                💡 Smart search shows results with 70-100% similarity
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    SN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Match %
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Affiliate Person
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Duplicate Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map(({ product, similarity }) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-100 transition-colors ${getRowStyling(product)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                      {product.sn}
                    </td>
                    <td className="px-6 py-4 text-lg font-semibold text-gray-900 max-w-xs">
                      <div className="break-words">{product.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSimilarityBadge(similarity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.affiliatePersonName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.commission}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.dateAddedOn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {checkDuplicates(
                        products,
                        product.productName,
                        product.id
                      ).length > 0 ? (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                          🚨 Duplicate Found
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                          ✅ Unique
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or add new products
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
