/**
 * Tokenizes a search query into individual searchable terms
 * Handles quoted phrases and removes empty strings
 */
export function tokenizeQuery(query: string): string[] {
  if (!query.trim()) return [];

  // Match quoted phrases or individual words
  const tokens = query.match(/"[^"]*"|[^\s]+/g) || [];

  return tokens
    .map((token) => token.replace(/"/g, "").trim())
    .filter((token) => token.length > 0)
    .map((token) => token.toLowerCase());
}

/**
 * Generates SQL LIKE patterns for search tokens
 */
export function generateLikePatterns(tokens: string[]): string[] {
  return tokens.map((token) => `%${token}%`);
}

/**
 * Creates a search score based on matching criteria
 * Higher scores indicate better matches
 */
export function calculateSearchScore(
  item: {
    name: string;
    sku: string;
    description?: string | null;
    tags?: Array<{ tag: { name: string } }>;
  },
  tokens: string[]
): number {
  let score = 0;
  const name = item.name.toLowerCase();
  const sku = item.sku.toLowerCase();
  const description = (item.description || "").toLowerCase();
  const tagNames = item.tags?.map((pt) => pt.tag.name.toLowerCase()) || [];

  for (const token of tokens) {
    // Exact name match gets highest score
    if (name === token) score += 100;
    // Name starts with token
    else if (name.startsWith(token)) score += 50;
    // Name contains token
    else if (name.includes(token)) score += 30;

    // SKU exact match
    if (sku === token) score += 80;
    // SKU starts with token
    else if (sku.startsWith(token)) score += 40;
    // SKU contains token
    else if (sku.includes(token)) score += 20;

    // Description contains token
    if (description.includes(token)) score += 10;

    // Tag exact match
    if (tagNames.some((tag) => tag === token)) score += 60;
    // Tag contains token
    else if (tagNames.some((tag) => tag.includes(token))) score += 25;
  }

  return score;
}
