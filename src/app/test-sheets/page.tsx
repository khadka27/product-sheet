"use client";

import { useState } from "react";

interface Product {
  id: string;
  sn: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function GoogleSheetsTest() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        setMessage(`Loaded ${data.length} products from Google Sheets`);
      } else {
        setMessage("Failed to fetch products");
      }
    } catch (error) {
      setMessage("Error fetching products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async () => {
    if (!productName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [productName.trim()] }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setProductName("");
        fetchProducts(); // Refresh list
      } else {
        const errorData = await res.json();
        setMessage(errorData.error);
      }
    } catch (error) {
      setMessage("Error adding product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Google Sheets Integration Test
      </h1>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load from Google Sheets"}
          </button>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addProduct}
            disabled={loading || !productName.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Add Product
          </button>
        </div>

        {message && (
          <div className="p-3 bg-gray-100 border rounded">{message}</div>
        )}
      </div>

      <div className="border rounded overflow-hidden">
        <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b">
          Products ({products.length})
        </h2>

        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    SN
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">
                      {product.sn}
                    </td>
                    <td className="px-4 py-2 text-sm">{product.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {product.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No products found. Click &quot;Load from Google Sheets&quot; to
            fetch data.
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">
          Setup Instructions:
        </h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>
            1. Create a Google Sheet with columns: SN | Name | CreatedAt |
            UpdatedAt | ID
          </li>
          <li>2. Set up Google Service Account and get credentials</li>
          <li>
            3. Update .env.local with your GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL,
            and GOOGLE_PRIVATE_KEY
          </li>
          <li>4. Share your Google Sheet with the service account email</li>
          <li>5. Make sure the sheet is named &quot;Products&quot;</li>
        </ol>
      </div>
    </div>
  );
}
