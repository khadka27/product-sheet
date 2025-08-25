/*
  Warnings:

  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."product_tags" DROP CONSTRAINT "product_tags_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_tags" DROP CONSTRAINT "product_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "public"."products_categoryId_idx";

-- DropIndex
DROP INDEX "public"."products_createdAt_idx";

-- DropIndex
DROP INDEX "public"."products_slug_key";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "categoryId",
DROP COLUMN "currency",
DROP COLUMN "description",
DROP COLUMN "price",
DROP COLUMN "slug",
DROP COLUMN "stock";

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."product_tags";

-- DropTable
DROP TABLE "public"."tags";
