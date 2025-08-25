import { z } from "zod";

// Product validation schemas
export const ProductInput = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(256, "Name must be 256 characters or less"),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative("Price must be non-negative").default(0),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
  stock: z.coerce
    .number()
    .int()
    .min(0, "Stock must be non-negative")
    .default(0),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const ProductUpdate = ProductInput.partial().extend({
  id: z.string().min(1, "Product ID is required"),
});

export const ProductCreate = ProductInput;

// Category validation schemas
export const CategoryInput = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Name must be 100 characters or less"),
});

export const CategoryUpdate = CategoryInput.extend({
  id: z.string().min(1, "Category ID is required"),
});

// Tag validation schemas
export const TagInput = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Name must be 50 characters or less"),
});

export const TagUpdate = TagInput.extend({
  id: z.string().min(1, "Tag ID is required"),
});

// Search and filter schemas
export const SearchFilters = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStockOnly: z.boolean().optional(),
  sortBy: z
    .enum(["relevance", "price_asc", "price_desc", "newest", "name_asc"])
    .default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// CSV import schemas
export const CsvRowInput = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z
    .string()
    .refine(
      (val: string) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      "Price must be a valid non-negative number"
    )
    .default("0"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
  stock: z
    .string()
    .refine(
      (val: string) => !isNaN(parseInt(val)) && parseInt(val) >= 0,
      "Stock must be a valid non-negative integer"
    )
    .default("0"),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
});

export const CsvImportResult = z.object({
  success: z.boolean(),
  totalRows: z.number(),
  successfulRows: z.number(),
  failedRows: z.number(),
  errors: z.array(
    z.object({
      row: z.number(),
      sku: z.string().optional(),
      errors: z.array(z.string()),
    })
  ),
});

// API response schemas
export const ApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });

// Type exports
export type ProductInputType = z.infer<typeof ProductInput>;
export type ProductUpdateType = z.infer<typeof ProductUpdate>;
export type CategoryInputType = z.infer<typeof CategoryInput>;
export type TagInputType = z.infer<typeof TagInput>;
export type SearchFiltersType = z.infer<typeof SearchFilters>;
export type CsvRowInputType = z.infer<typeof CsvRowInput>;
export type CsvImportResultType = z.infer<typeof CsvImportResult>;
