"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface CsvExportProps {
  filters?: Record<string, unknown>;
  className?: string;
}

export function CsvExport({ filters = {}, className }: CsvExportProps) {
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  const handleExport = async (scope: "current" | "all") => {
    setExporting(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.set("scope", scope);

      if (scope === "current" && Object.keys(filters).length > 0) {
        // Add current filters to export
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              params.set(key, value.join(","));
            } else {
              params.set(key, String(value));
            }
          }
        });
      }

      // Make request
      const response = await fetch(`/api/csv/export?${params.toString()}`);

      if (response.ok) {
        // Get filename from response headers or generate one
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "products-export.csv";

        if (contentDisposition) {
          const filenameMatch =
            contentDisposition.match(/filename="?([^"]*)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        addToast({
          type: "success",
          title: "Export successful",
          description: `Products exported to ${filename}`,
        });
      } else {
        const errorData = await response.json();
        addToast({
          type: "error",
          title: "Export failed",
          description: errorData.error || "Failed to export products",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      addToast({
        type: "error",
        title: "Export failed",
        description: "An unexpected error occurred during export",
      });
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.keys(filters).some((key) => {
    const value = filters[key];
    return (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0)
    );
  });

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => handleExport("current")}
          loading={exporting}
          disabled={exporting}
        >
          Export {hasFilters ? "Filtered" : "Current"} Results
        </Button>

        <Button
          variant="outline"
          onClick={() => handleExport("all")}
          loading={exporting}
          disabled={exporting}
        >
          Export All Products
        </Button>
      </div>

      {hasFilters && (
        <p className="text-xs text-gray-500 mt-1">
          Current export will include applied filters
        </p>
      )}
    </div>
  );
}
