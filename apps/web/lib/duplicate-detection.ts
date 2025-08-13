import { db } from "@/packages/db"

interface SimilarityScore {
  productId: string
  score: number
  reasons: string[]
}

interface DuplicateGroup {
  products: any[]
  averageScore: number
  reasons: string[]
}

// Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1]
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + 1, // substitution
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
}

export function calculateSimilarity(product1: any, product2: any): { score: number; reasons: string[] } {
  const reasons: string[] = []
  let totalScore = 0
  let weightSum = 0

  // Name similarity (weight: 40%)
  const nameWeight = 0.4
  const nameSimilarity = stringSimilarity(normalizeString(product1.name), normalizeString(product2.name))
  totalScore += nameSimilarity * nameWeight
  weightSum += nameWeight

  if (nameSimilarity > 0.8) {
    reasons.push(`Very similar names (${Math.round(nameSimilarity * 100)}% match)`)
  } else if (nameSimilarity > 0.6) {
    reasons.push(`Similar names (${Math.round(nameSimilarity * 100)}% match)`)
  }

  // SKU similarity (weight: 30%)
  const skuWeight = 0.3
  const skuSimilarity = stringSimilarity(normalizeString(product1.sku), normalizeString(product2.sku))
  totalScore += skuSimilarity * skuWeight
  weightSum += skuWeight

  if (skuSimilarity > 0.7) {
    reasons.push(`Similar SKUs (${Math.round(skuSimilarity * 100)}% match)`)
  }

  // Brand match (weight: 15%)
  const brandWeight = 0.15
  if (product1.brand?.name && product2.brand?.name) {
    const brandMatch = product1.brand.name === product2.brand.name ? 1 : 0
    totalScore += brandMatch * brandWeight
    weightSum += brandWeight

    if (brandMatch) {
      reasons.push("Same brand")
    }
  }

  // Category match (weight: 10%)
  const categoryWeight = 0.1
  if (product1.category?.name && product2.category?.name) {
    const categoryMatch = product1.category.name === product2.category.name ? 1 : 0
    totalScore += categoryMatch * categoryWeight
    weightSum += categoryWeight

    if (categoryMatch) {
      reasons.push("Same category")
    }
  }

  // Description similarity (weight: 5%)
  const descWeight = 0.05
  if (product1.description && product2.description) {
    const descSimilarity = stringSimilarity(
      normalizeString(product1.description),
      normalizeString(product2.description),
    )
    totalScore += descSimilarity * descWeight
    weightSum += descWeight

    if (descSimilarity > 0.8) {
      reasons.push(`Very similar descriptions (${Math.round(descSimilarity * 100)}% match)`)
    }
  }

  const finalScore = weightSum > 0 ? totalScore / weightSum : 0
  return { score: finalScore, reasons }
}

export async function findDuplicates(threshold = 0.7): Promise<DuplicateGroup[]> {
  const products = await db.product.findMany({
    include: {
      brand: true,
      category: true,
      createdBy: {
        select: { name: true, email: true },
      },
    },
  })

  const duplicateGroups: Map<string, DuplicateGroup> = new Map()
  const processedPairs = new Set<string>()

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      const product1 = products[i]
      const product2 = products[j]

      const pairKey = [product1.id, product2.id].sort().join("-")
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      const { score, reasons } = calculateSimilarity(product1, product2)

      if (score >= threshold) {
        const groupKey = `${Math.min(i, j)}-${Math.max(i, j)}`

        if (!duplicateGroups.has(groupKey)) {
          duplicateGroups.set(groupKey, {
            products: [product1, product2],
            averageScore: score,
            reasons,
          })
        } else {
          const group = duplicateGroups.get(groupKey)!
          if (!group.products.find((p) => p.id === product2.id)) {
            group.products.push(product2)
            group.averageScore = (group.averageScore + score) / 2
            group.reasons = [...new Set([...group.reasons, ...reasons])]
          }
        }
      }
    }
  }

  return Array.from(duplicateGroups.values()).sort((a, b) => b.averageScore - a.averageScore)
}

export async function mergeDuplicates(
  primaryProductId: string,
  duplicateProductIds: string[],
  mergeOptions: {
    keepName?: boolean
    keepDescription?: boolean
    keepPrice?: boolean
    keepBrand?: boolean
    keepCategory?: boolean
  },
): Promise<void> {
  const primaryProduct = await db.product.findUnique({
    where: { id: primaryProductId },
    include: { brand: true, category: true },
  })

  if (!primaryProduct) {
    throw new Error("Primary product not found")
  }

  const duplicateProducts = await db.product.findMany({
    where: { id: { in: duplicateProductIds } },
    include: { brand: true, category: true },
  })

  // Merge data based on options
  const mergedData: any = { ...primaryProduct }

  for (const duplicate of duplicateProducts) {
    if (!mergeOptions.keepName && duplicate.name && duplicate.name.length > mergedData.name.length) {
      mergedData.name = duplicate.name
    }

    if (!mergeOptions.keepDescription && duplicate.description && !mergedData.description) {
      mergedData.description = duplicate.description
    }

    if (!mergeOptions.keepPrice && duplicate.price && !mergedData.price) {
      mergedData.price = duplicate.price
    }

    if (!mergeOptions.keepBrand && duplicate.brandId && !mergedData.brandId) {
      mergedData.brandId = duplicate.brandId
    }

    if (!mergeOptions.keepCategory && duplicate.categoryId && !mergedData.categoryId) {
      mergedData.categoryId = duplicate.categoryId
    }
  }

  // Update primary product
  await db.product.update({
    where: { id: primaryProductId },
    data: {
      name: mergedData.name,
      description: mergedData.description,
      price: mergedData.price,
      brandId: mergedData.brandId,
      categoryId: mergedData.categoryId,
    },
  })

  // Delete duplicate products
  await db.product.deleteMany({
    where: { id: { in: duplicateProductIds } },
  })

  // Create audit log
  await db.auditLog.create({
    data: {
      action: "MERGE",
      entityType: "PRODUCT",
      entityId: primaryProductId,
      userId: primaryProduct.createdById,
      details: `Merged ${duplicateProductIds.length} duplicate products into ${primaryProduct.name}`,
    },
  })
}
