"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";

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
}

interface SearchFilters {
  articleTitleName: string;
  postedBy: string;
  status: string;
  contentDoc: string;
  url: string;
  websiteAffiliateLink: string;
  referenceLink: string;
}

const normalizeSearchText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeSearchText(str1);
  const s2 = normalizeSearchText(str2);

  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  if (s1.includes(s2) || s2.includes(s1)) return 90;

  const matrix = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.round(((maxLength - distance) / maxLength) * 100);
};

const createSearchVariations = (searchTerm: string): string[] => {
  const normalized = normalizeSearchText(searchTerm);
  const original = searchTerm.toLowerCase().trim();
  const withoutSpaces = original.replace(/\s+/g, "");
  const withDashes = original.replace(/\s+/g, "-");
  const withUnderscores = original.replace(/\s+/g, "_");
  const words = original.split(/\s+/);

  const variations = [
    original,
    normalized,
    withoutSpaces,
    withDashes,
    withUnderscores,
    ...words,
  ];
  return [...new Set(variations)];
};

const isProductMatch = (product: Product, filters: SearchFilters): boolean => {
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

    let maxSimilarity = 0;
    for (const searchVar of searchVariations) {
      for (const titleVar of titleVariations) {
        const similarity = calculateSimilarity(titleVar, searchVar);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    if (maxSimilarity < 50) return false;
  }

  if (filters.postedBy) {
    const similarity = calculateSimilarity(product.postedBy, filters.postedBy);
    if (similarity < 60) return false;
  }

  if (filters.status) {
    const similarity = calculateSimilarity(product.status, filters.status);
    if (similarity < 60) return false;
  }

  if (filters.contentDoc) {
    const similarity = calculateSimilarity(
      product.contentDoc,
      filters.contentDoc
    );
    if (similarity < 60) return false;
  }

  if (filters.url) {
    const similarity = calculateSimilarity(product.url, filters.url);
    if (similarity < 60) return false;
  }

  if (filters.websiteAffiliateLink) {
    const similarity = calculateSimilarity(
      product.websiteAffiliateLink,
      filters.websiteAffiliateLink
    );
    if (similarity < 60) return false;
  }

  if (filters.referenceLink) {
    const similarity = calculateSimilarity(
      product.referenceLink,
      filters.referenceLink
    );
    if (similarity < 60) return false;
  }

  return true;
};

export default function ContentWorksheetPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const { addToast } = useToast();

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    articleTitleName: "",
    postedBy: "",
    status: "",
    contentDoc: "",
    url: "",
    websiteAffiliateLink: "",
    referenceLink: "",
  });

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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch content";
      setError(errorMessage);
      addToast({ title: `Error: ${errorMessage}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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

  // Global search across all fields with fuzzy matching
  const globalSearchResults = useMemo(() => {
    if (!globalSearch.trim()) return products;

    const searchTerm = globalSearch.toLowerCase();
    return products.filter((product) => {
      // Check each field for similarity
      const fields = [
        product.articleTitleName,
        product.postedBy,
        product.status,
        product.contentDoc,
        product.url,
        product.websiteAffiliateLink,
        product.referenceLink,
        product.datePosted,
      ];

      return fields.some((field) => {
        if (!field) return false;

        // Exact match or substring match
        if (field.toString().toLowerCase().includes(searchTerm)) return true;

        // Fuzzy matching with 60% similarity threshold
        const similarity = calculateSimilarity(field.toString(), searchTerm);
        return similarity >= 60;
      });
    });
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

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Render cell content - Read Only View
  const renderCellContent = (product: Product, field: keyof Product) => {
    const value = product[field];

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
            className="text-blue-400 hover:text-blue-300 underline break-all font-medium text-sm"
          >
            {urlValue}
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(linkUrl, "_blank");
            }}
            className="text-xs bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded text-blue-300"
            title="Open in new tab"
          >
            ↗
          </button>
        </div>
      );
    }

    return (
      <span className="break-all text-white font-medium">
        {value ? value.toString() : ""}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Content Worksheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-300 mb-2">
              Error Loading Content
            </h2>
            <p className="text-red-400 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-900">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Content Worksheet
              </h1>
              <p className="text-sm text-gray-300 mt-1 font-medium">
                {filteredProducts.length} of {products.length} articles
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search all fields..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {globalSearch && (
                  <button
                    onClick={() => setGlobalSearch("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
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

      {/* Sticky Filters */}
      <div className="sticky top-24 z-40 bg-gray-800 border-b border-gray-700">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <h3 className="font-medium text-gray-300 flex-shrink-0">
              Filters:
            </h3>

            {/* Article Title Filter */}
            <input
              type="text"
              placeholder="Article Title..."
              value={searchFilters.articleTitleName}
              onChange={(e) => updateFilter("articleTitleName", e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Posted By Filter */}
            <select
              value={searchFilters.postedBy}
              onChange={(e) => updateFilter("postedBy", e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-3 py-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Table - Read Only View */}
      <div className="max-w-full mx-auto px-4 py-6 pt-4">
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-700 border-b border-gray-600">
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[60px]">
                    S.N.
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[250px]">
                    Article Title Name
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[120px]">
                    Posted By
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[100px]">
                    Status
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[120px]">
                    Content Doc
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[100px]">
                    Date Posted
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[200px]">
                    URL
                  </th>
                  <th className="text-left p-3 font-bold text-white border-r border-gray-600 min-w-[200px]">
                    Website Affiliate Link
                  </th>
                  <th className="text-left p-3 font-bold text-white min-w-[200px]">
                    Reference Link
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Data Rows - Read Only View */}
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
                      className={`border-b border-gray-600 hover:bg-blue-900 transition-colors ${
                        isDuplicate
                          ? "bg-yellow-900"
                          : index % 2 === 0
                            ? "bg-gray-800"
                            : "bg-gray-700"
                      }`}
                    >
                      <td className="p-3 border-r border-gray-600 font-bold text-white">
                        {product.sn}
                      </td>
                      <td className="p-3 border-r border-gray-600 text-white font-medium">
                        {renderCellContent(product, "articleTitleName")}
                      </td>
                      <td className="p-3 border-r border-gray-600 text-gray-300">
                        {renderCellContent(product, "postedBy")}
                      </td>
                      <td className="p-3 border-r border-gray-600 text-gray-300">
                        {renderCellContent(product, "status")}
                      </td>
                      <td className="p-3 border-r border-gray-600 text-gray-300">
                        {renderCellContent(product, "contentDoc")}
                      </td>
                      <td className="p-3 border-r border-gray-600 text-gray-300">
                        {renderCellContent(product, "datePosted")}
                      </td>
                      <td className="p-3 border-r border-gray-600">
                        {renderCellContent(product, "url")}
                      </td>
                      <td className="p-3 border-r border-gray-600">
                        {renderCellContent(product, "websiteAffiliateLink")}
                      </td>
                      <td className="p-3">
                        {renderCellContent(product, "referenceLink")}
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state */}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
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
    </div>
  );
}
