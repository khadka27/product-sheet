"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";

// Define the Product interface based on Content Worksheet columns
interface Product {
  id: string;
  sn: number;
  articleTitleName: string;
  postedBy: string;
  status: string;
  contentDoc: string;
  datePosted: string;
  url: string;
  websiteAffiliateLink: string;
  referenceLink: string;
  createdAt: Date;
  updatedAt: Date;
}

// Search filters interface
interface SearchFilters {
  articleTitleName: string;
  postedBy: string;
  status: string;
  contentDoc: string;
  url: string;
  websiteAffiliateLink: string;
  referenceLink: string;
}

// Enhanced search utilities
const normalizeSearchText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove all non-alphanumeric characters
    .trim();
};

const createSearchVariations = (searchTerm: string): string[] => {
  const normalized = normalizeSearchText(searchTerm);
  const original = searchTerm.toLowerCase().trim();
  const withoutSpaces = original.replace(/\s+/g, "");
  const withDashes = original.replace(/\s+/g, "-");
  const withUnderscores = original.replace(/\s+/g, "_");

  const variations = [
    original,
    normalized,
    withoutSpaces,
    withDashes,
    withUnderscores,
  ];
  return [...new Set(variations)]; // Remove duplicates
};

// Check if a product matches search criteria
const isProductMatch = (product: Product, filters: SearchFilters): boolean => {
  // Check each filter
  if (filters.articleTitleName) {
    const searchVariations = createSearchVariations(filters.articleTitleName);
    const titleVariations = [
      product.articleTitleName.toLowerCase(),
      product.articleTitleName.toLowerCase().replace(/\s+/g, ""),
      product.articleTitleName.toLowerCase().replace(/[-_\s]+/g, ""),
      product.articleTitleName.toLowerCase().replace(/[-_]/g, " "),
      product.articleTitleName.toLowerCase().replace(/\s+/g, "-"),
      normalizeSearchText(product.articleTitleName),
    ];

    const titleMatch = searchVariations.some((searchVar) =>
      titleVariations.some(
        (titleVar) =>
          titleVar.includes(searchVar) || searchVar.includes(titleVar)
      )
    );

    if (!titleMatch) return false;
  }

  if (
    filters.postedBy &&
    !product.postedBy.toLowerCase().includes(filters.postedBy.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.status &&
    !product.status.toLowerCase().includes(filters.status.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.contentDoc &&
    !product.contentDoc.toLowerCase().includes(filters.contentDoc.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.url &&
    !product.url.toLowerCase().includes(filters.url.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.websiteAffiliateLink &&
    !product.websiteAffiliateLink
      .toLowerCase()
      .includes(filters.websiteAffiliateLink.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.referenceLink &&
    !product.referenceLink
      .toLowerCase()
      .includes(filters.referenceLink.toLowerCase())
  ) {
    return false;
  }

  return true;
};

export default function ContentWorksheetPage() {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    field: keyof Product;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToast } = useToast();

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    articleTitleName: "",
    postedBy: "",
    status: "",
    contentDoc: "",
    url: "",
    websiteAffiliateLink: "",
    referenceLink: "",
  });

  // State for new product entry
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [nextSN, setNextSN] = useState<number>(1);

  // Unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const values = {
      postedBys: new Set<string>(),
      statuses: new Set<string>(),
      contentDocs: new Set<string>(),
    };

    products.forEach((product) => {
      if (product.postedBy) values.postedBys.add(product.postedBy);
      if (product.status) values.statuses.add(product.status);
      if (product.contentDoc) values.contentDocs.add(product.contentDoc);
    });

    return {
      postedBys: Array.from(values.postedBys).sort(),
      statuses: Array.from(values.statuses).sort(),
      contentDocs: Array.from(values.contentDocs).sort(),
    };
  }, [products]);

  // Check for duplicates
  const duplicateCheck = useCallback(
    (articleTitle: string) => {
      if (!articleTitle?.trim()) return false;
      return products.some(
        (product) =>
          product.articleTitleName.toLowerCase() === articleTitle.toLowerCase()
      );
    },
    [products]
  );

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/products");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setProducts(data);

      // Calculate next S.N.
      const maxSN = data.reduce(
        (max: number, product: Product) => Math.max(max, product.sn || 0),
        0
      );
      setNextSN(maxSN + 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch content";
      setError(errorMessage);
      addToast(`Error: ${errorMessage}`, "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Add new product
  const addProduct = useCallback(async () => {
    if (!newProduct.articleTitleName?.trim()) {
      addToast("Article Title Name is required", "error");
      return;
    }

    if (duplicateCheck(newProduct.articleTitleName)) {
      addToast("Article with this title already exists", "error");
      return;
    }

    try {
      setAdding(true);
      const productToAdd: Product = {
        id: `temp_${Date.now()}`,
        sn: nextSN,
        articleTitleName: newProduct.articleTitleName || "",
        postedBy: newProduct.postedBy || "",
        status: newProduct.status || "",
        contentDoc: newProduct.contentDoc || "",
        datePosted: newProduct.datePosted || new Date().toLocaleDateString(),
        url: newProduct.url || "",
        websiteAffiliateLink: newProduct.websiteAffiliateLink || "",
        referenceLink: newProduct.referenceLink || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productToAdd),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add content");
      }

      addToast("Content added successfully!", "success");
      setNewProduct({});
      setNextSN(nextSN + 1);
      fetchProducts();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add content";
      addToast(`Error: ${errorMessage}`, "error");
    } finally {
      setAdding(false);
    }
  }, [newProduct, nextSN, duplicateCheck, addToast, fetchProducts]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchFilters({
      articleTitleName: "",
      postedBy: "",
      status: "",
      contentDoc: "",
      url: "",
      websiteAffiliateLink: "",
      referenceLink: "",
    });
    setGlobalSearch("");
  }, []);

  // Update filter value
  const updateFilter = useCallback(
    (field: keyof SearchFilters, value: string) => {
      setSearchFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Check if filters are active
  const hasActiveFilters = Object.values(searchFilters).some((filter) =>
    filter.trim()
  );

  // Global search across all fields
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return products;

    const searchTerm = globalSearch.toLowerCase();
    return products.filter((product) =>
      Object.values(product).some(
        (value) => value && value.toString().toLowerCase().includes(searchTerm)
      )
    );
  }, [products, globalSearch]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    const baseProducts = globalSearch.trim() ? globalSearchResults : products;

    if (!hasActiveFilters) return baseProducts;

    return baseProducts.filter((product) =>
      isProductMatch(product, searchFilters)
    );
  }, [
    globalSearchResults,
    products,
    searchFilters,
    hasActiveFilters,
    globalSearch,
  ]);

  // Handle cell editing
  const handleCellClick = (rowIndex: number, field: keyof Product) => {
    if (
      field === "sn" ||
      field === "id" ||
      field === "createdAt" ||
      field === "updatedAt"
    ) {
      return; // Don't edit these fields
    }

    const product = filteredProducts[rowIndex];
    setEditingCell({ rowIndex, field });
    setEditValue(String(product[field] || ""));
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    const product = filteredProducts[editingCell.rowIndex];
    const updatedProduct = { ...product, [editingCell.field]: editValue };

    try {
      setSaving(true);
      const response = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update content");
      }

      addToast("Content updated successfully!", "success");
      fetchProducts();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update content";
      addToast(`Error: ${errorMessage}`, "error");
    } finally {
      setSaving(false);
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Keyboard handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Render cell content with URL links
  const renderCellContent = (
    product: Product,
    field: keyof Product,
    rowIndex: number
  ) => {
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const value = product[field];

    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCellSave}
          className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      );
    }

    // Handle URL and link fields - make them clickable
    if (
      (field === "url" ||
        field === "websiteAffiliateLink" ||
        field === "referenceLink") &&
      value &&
      value.toString().trim()
    ) {
      const urlValue = value.toString();
      const isValidUrl =
        urlValue.startsWith("http://") || urlValue.startsWith("https://");
      const linkUrl = isValidUrl ? urlValue : `https://${urlValue}`;

      return (
        <div className="flex items-center gap-2">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {urlValue}
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(linkUrl, "_blank");
            }}
            className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-blue-700"
            title="Open in new tab"
          >
            ↗
          </button>
        </div>
      );
    }

    return <span className="break-all">{value ? value.toString() : ""}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Content Worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Content
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Content Worksheet
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredProducts.length} of {products.length} articles
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>

            {/* Global Search */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search all fields..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={fetchProducts}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <h3 className="font-medium text-gray-700 flex-shrink-0">
              Filters:
            </h3>

            {/* Article Title Filter */}
            <input
              type="text"
              placeholder="Article Title..."
              value={searchFilters.articleTitleName}
              onChange={(e) => updateFilter("articleTitleName", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Posted By Filter */}
            <select
              value={searchFilters.postedBy}
              onChange={(e) => updateFilter("postedBy", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Posted By</option>
              {uniqueValues.postedBys.map((postedBy) => (
                <option key={postedBy} value={postedBy}>
                  {postedBy}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={searchFilters.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              {uniqueValues.statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Content Doc Filter */}
            <select
              value={searchFilters.contentDoc}
              onChange={(e) => updateFilter("contentDoc", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Content Doc</option>
              {uniqueValues.contentDocs.map((contentDoc) => (
                <option key={contentDoc} value={contentDoc}>
                  {contentDoc}
                </option>
              ))}
            </select>

            {/* URL Filter */}
            <input
              type="text"
              placeholder="URL..."
              value={searchFilters.url}
              onChange={(e) => updateFilter("url", e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[60px]">
                    S.N.
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[250px]">
                    Article Title Name
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[120px]">
                    Posted By
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[100px]">
                    Status
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[120px]">
                    Content Doc
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[100px]">
                    Date Posted
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[200px]">
                    URL
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 border-r border-gray-200 min-w-[200px]">
                    Website Affiliate Link
                  </th>
                  <th className="text-left p-3 font-medium text-gray-700 min-w-[200px]">
                    Reference Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Add New Row */}
                <tr className="border-b border-gray-200 bg-green-50">
                  <td className="p-3 border-r border-gray-200 font-medium text-green-700">
                    {nextSN}
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Enter article title..."
                      value={newProduct.articleTitleName || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          articleTitleName: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Posted by..."
                      value={newProduct.postedBy || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          postedBy: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Status..."
                      value={newProduct.status || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Content doc..."
                      value={newProduct.contentDoc || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          contentDoc: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Date posted..."
                      value={newProduct.datePosted || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          datePosted: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="URL..."
                      value={newProduct.url || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3 border-r border-gray-200">
                    <input
                      type="text"
                      placeholder="Affiliate link..."
                      value={newProduct.websiteAffiliateLink || ""}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          websiteAffiliateLink: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reference link..."
                        value={newProduct.referenceLink || ""}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            referenceLink: e.target.value,
                          }))
                        }
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        onClick={addProduct}
                        disabled={
                          adding || !newProduct.articleTitleName?.trim()
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {adding ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Data Rows */}
                {filteredProducts.map((product, index) => {
                  const isDuplicate =
                    products.filter(
                      (p) =>
                        p.articleTitleName.toLowerCase() ===
                        product.articleTitleName.toLowerCase()
                    ).length > 1;

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        isDuplicate ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="p-3 border-r border-gray-200 font-medium text-gray-700">
                        {product.sn}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() =>
                          handleCellClick(index, "articleTitleName")
                        }
                      >
                        {renderCellContent(product, "articleTitleName", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "postedBy")}
                      >
                        {renderCellContent(product, "postedBy", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "status")}
                      >
                        {renderCellContent(product, "status", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "contentDoc")}
                      >
                        {renderCellContent(product, "contentDoc", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "datePosted")}
                      >
                        {renderCellContent(product, "datePosted", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "url")}
                      >
                        {renderCellContent(product, "url", index)}
                      </td>
                      <td
                        className="p-3 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                        onClick={() =>
                          handleCellClick(index, "websiteAffiliateLink")
                        }
                      >
                        {renderCellContent(
                          product,
                          "websiteAffiliateLink",
                          index
                        )}
                      </td>
                      <td
                        className="p-3 cursor-pointer hover:bg-blue-50"
                        onClick={() => handleCellClick(index, "referenceLink")}
                      >
                        {renderCellContent(product, "referenceLink", index)}
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state */}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      {hasActiveFilters || globalSearch.trim()
                        ? "No content matches your search criteria"
                        : "No content available"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Saving changes...</span>
          </div>
        </div>
      )}
    </div>
  );
}
