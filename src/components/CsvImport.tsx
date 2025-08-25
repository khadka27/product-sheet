"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface CsvImportProps {
  onImportComplete?: () => void;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    sku?: string;
    errors: string[];
  }>;
}

export function CsvImport({ onImportComplete }: CsvImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        addToast({
          type: "error",
          title: "Invalid file type",
          description: "Please select a CSV file.",
        });
        return;
      }

      setFile(selectedFile);

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(0, 11); // Header + 10 rows
        const data = lines.map((line) => {
          // Simple CSV parsing for preview
          const values = [];
          let current = "";
          let inQuotes = false;

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        });
        setPreviewData(data);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/csv/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success) {
          addToast({
            type: "success",
            title: "Import successful",
            description: `Successfully imported ${data.successfulRows} of ${data.totalRows} products.`,
          });
          if (onImportComplete) {
            onImportComplete();
          }
        } else {
          addToast({
            type: "warning",
            title: "Import completed with errors",
            description: `${data.successfulRows} successful, ${data.failedRows} failed.`,
          });
        }
      } else {
        addToast({
          type: "error",
          title: "Import failed",
          description: data.error || "Failed to import CSV file.",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      addToast({
        type: "error",
        title: "Import failed",
        description: "An unexpected error occurred during import.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFile(null);
    setPreviewData(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadExample = () => {
    const csvContent = `sku,name,description,price,currency,stock,category,tags
SKU-1001,Trail Backpack 30L,Lightweight pack for day hikes,79.99,USD,42,Bags,"hiking,water-resistant"
SKU-1002,Merino Tee,Soft breathable t-shirt,39.50,USD,120,Apparel,"merino,wool,summer"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "example-products.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Import CSV</Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Import Products from CSV
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {!result ? (
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">
                      CSV Format
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Your CSV file should include these columns: sku, name,
                      description, price, currency, stock, category, tags
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadExample}
                    >
                      Download Example CSV
                    </Button>
                  </div>

                  {/* File upload */}
                  <div>
                    <label
                      htmlFor="csv-file-input"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Select CSV File
                    </label>
                    <input
                      id="csv-file-input"
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  {/* Preview */}
                  {previewData && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Preview (first 10 rows)
                      </h3>
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {previewData[0]?.map((header, index) => (
                                <th
                                  key={`header-${header}-${index}`}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.slice(1).map((row, rowIndex) => (
                              <tr key={`row-${rowIndex}`}>
                                {row.map((cell, cellIndex) => (
                                  <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Results */
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Import Results
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total rows:</span>
                        <span className="ml-2 font-semibold">
                          {result.totalRows}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-600">Successful:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {result.successfulRows}
                        </span>
                      </div>
                      <div>
                        <span className="text-red-600">Failed:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          {result.failedRows}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Errors</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <div
                            key={`error-${error.row}-${index}`}
                            className="bg-red-50 p-3 rounded border-l-4 border-red-400"
                          >
                            <div className="text-sm">
                              <span className="font-medium text-red-800">
                                Row {error.row}
                              </span>
                              {error.sku && (
                                <span className="text-red-700">
                                  {" "}
                                  (SKU: {error.sku})
                                </span>
                              )}
                            </div>
                            <ul className="mt-1 text-sm text-red-700">
                              {error.errors.map((err, errIndex) => (
                                <li
                                  key={`error-${error.row}-${errIndex}-${err.slice(0, 10)}`}
                                >
                                  • {err}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                {result ? "Close" : "Cancel"}
              </Button>
              {!result && file && (
                <Button onClick={handleImport} loading={importing}>
                  Import Products
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
