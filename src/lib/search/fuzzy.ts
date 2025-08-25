import levenshtein from "fast-levenshtein";

/**
 * Calculates fuzzy match score using Levenshtein distance
 * Returns a score between 0-100 (higher is better match)
 */
export function fuzzyMatch(
  query: string,
  target: string,
  threshold = 2
): number {
  if (!query || !target) return 0;

  const distance = levenshtein.get(query.toLowerCase(), target.toLowerCase());
  const maxLength = Math.max(query.length, target.length);

  // If distance is greater than threshold, no match
  if (distance > threshold) return 0;

  // Calculate similarity score (0-100)
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(similarity);
}

interface FuzzyTarget<T = unknown> {
  id: string;
  text: string;
  data: T;
}

interface FuzzyMatch<T = unknown> extends FuzzyTarget<T> {
  score: number;
}

/**
 * Finds fuzzy matches for a query against an array of targets
 * Returns matches sorted by similarity score
 */
export function findFuzzyMatches<T = unknown>(
  query: string,
  targets: FuzzyTarget<T>[],
  threshold = 2,
  limit = 10
): FuzzyMatch<T>[] {
  if (!query.trim()) return [];

  const matches = targets
    .map((target) => ({
      ...target,
      score: fuzzyMatch(query, target.text, threshold),
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return matches;
}

/**
 * Enhanced fuzzy search that combines exact matches with fuzzy matching
 */
export function hybridSearch<T>(
  query: string,
  items: T[],
  getSearchText: (item: T) => string,
  options: {
    fuzzyThreshold?: number;
    exactMatchBonus?: number;
    prefixMatchBonus?: number;
    limit?: number;
  } = {}
): Array<T & { searchScore: number }> {
  const {
    fuzzyThreshold = 2,
    exactMatchBonus = 50,
    prefixMatchBonus = 25,
    limit = 20,
  } = options;

  if (!query.trim()) return [];

  const queryLower = query.toLowerCase();

  const scored = items.map((item) => {
    const text = getSearchText(item).toLowerCase();
    let score = 0;

    // Exact match
    if (text === queryLower) {
      score += 100 + exactMatchBonus;
    }
    // Prefix match
    else if (text.startsWith(queryLower)) {
      score += 75 + prefixMatchBonus;
    }
    // Contains match
    else if (text.includes(queryLower)) {
      score += 50;
    }
    // Fuzzy match
    else {
      const fuzzyScore = fuzzyMatch(queryLower, text, fuzzyThreshold);
      score += fuzzyScore;
    }

    return {
      ...item,
      searchScore: score,
    };
  });

  return scored
    .filter((item) => item.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, limit);
}
