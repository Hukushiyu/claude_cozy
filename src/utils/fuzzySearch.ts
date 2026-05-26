import { Suggestion } from '../types/chat';

export interface FuzzyMatch {
  item: Suggestion;
  score: number;
  matchedIndices: number[];
}

/**
 * Performs fuzzy search on suggestions
 * Returns matches sorted by score (best first)
 */
export function fuzzySearch(query: string, items: Suggestion[]): FuzzyMatch[] {
  if (!query) {
    // No query - return all items with neutral score
    return items.map(item => ({
      item,
      score: 0,
      matchedIndices: []
    }));
  }

  const normalizedQuery = query.toLowerCase();
  const matches: FuzzyMatch[] = [];

  for (const item of items) {
    const searchText = item.type === 'command'
      ? item.name.toLowerCase()
      : item.relativePath.toLowerCase();

    const result = fuzzyMatch(normalizedQuery, searchText);

    if (result.matched) {
      matches.push({
        item,
        score: result.score,
        matchedIndices: result.indices
      });
    }
  }

  // Sort by score (higher is better)
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Fuzzy match algorithm
 * - All query characters must appear in order
 * - Consecutive matches score higher
 * - Matches at word boundaries score higher
 * - Earlier matches score higher
 */
function fuzzyMatch(query: string, text: string): {
  matched: boolean;
  score: number;
  indices: number[];
} {
  const indices: number[] = [];
  let score = 0;
  let textIndex = 0;
  let previousMatchIndex = -1;

  for (let i = 0; i < query.length; i++) {
    const queryChar = query[i];
    let found = false;

    // Search for query character in remaining text
    while (textIndex < text.length) {
      if (text[textIndex] === queryChar) {
        found = true;
        indices.push(textIndex);

        // Score calculation
        if (previousMatchIndex === textIndex - 1) {
          // Consecutive match - bonus points
          score += 10;
        } else {
          // Gap penalty
          const gap = textIndex - previousMatchIndex - 1;
          score -= gap;
        }

        // Word boundary bonus (match at start or after space/separator)
        if (textIndex === 0 || /[\s\-_./\\]/.test(text[textIndex - 1])) {
          score += 5;
        }

        // Early match bonus
        score += (text.length - textIndex) * 0.1;

        previousMatchIndex = textIndex;
        textIndex++;
        break;
      }
      textIndex++;
    }

    if (!found) {
      // Query character not found - no match
      return { matched: false, score: 0, indices: [] };
    }
  }

  return { matched: true, score, indices };
}
