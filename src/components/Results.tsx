"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface Product {
  id: string;
  sn: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  category: { id: string; name: string } | null;
  tags: Array<{ tag: { id: string; name: string } }>;
  createdAt: Date;
  updatedAt: Date;
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ResultsProps {
  products: Product[];
  pagination: Pagination;
  loading?: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Results({
  products,
  pagination,
  loading,
  onPageChange,
  className,
}: ResultsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
            <div
              key={key}
              className="bg-white p-4 rounded-lg border animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No products found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or filters.
          </p>
          <div className="mt-6">
            <Link href="/products/new">
              <Button>Add your first product</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {pagination.totalItems} product
          {pagination.totalItems !== 1 ? "s" : ""} found
        </div>

        {/* View toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      {/* Products */}
      <div
        className={cn(
          "gap-4",
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "space-y-4"
        )}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className={cn(
              "bg-white rounded-lg border hover:shadow-md transition-shadow",
              viewMode === "grid" ? "p-4" : "p-4 flex items-center space-x-4"
            )}
          >
            {viewMode === "grid" ? (
              // Grid view
              <div className="space-y-3">
                <div>
                  <Link
                    href={`/products/${product.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">SN: {product.sn}</p>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(product.price, product.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </div>
                  </div>

                  {product.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category.name}
                    </span>
                  )}
                </div>

                {product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((productTag) => (
                      <span
                        key={productTag.tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {productTag.tag.name}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{product.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // List view
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/products/${product.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">SN: {product.sn}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(product.price, product.currency)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </div>
                  </div>
                </div>

                {product.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                    {product.description}
                  </p>
                )}

                <div className="mt-2 flex items-center space-x-4">
                  {product.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category.name}
                    </span>
                  )}

                  {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 2).map((productTag) => (
                        <span
                          key={productTag.tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {productTag.tag.name}
                        </span>
                      ))}
                      {product.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{product.tags.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrev}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNumber = Math.max(1, pagination.page - 2) + i;
                if (pageNumber > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNumber}
                    variant={
                      pageNumber === pagination.page ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              }
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNext}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
