// Lexicographic ranking utility for efficient reordering without reindexing
// Based on LexoRank algorithm - generates strings that sort lexicographically

const MIN_CHAR = '0';
const MAX_CHAR = 'z';
const MID_CHAR = 'U';

/**
 * Generates a rank string between two existing ranks
 * @param prev - The rank before the desired position (undefined if at start)
 * @param next - The rank after the desired position (undefined if at end)
 * @returns A new rank string that sorts between prev and next
 */
export function getBetweenRank(prev?: string, next?: string): string {
  // At the beginning
  if (!prev && !next) {
    return MID_CHAR;
  }
  
  // At the start
  if (!prev) {
    return getBeforeRank(next!);
  }
  
  // At the end
  if (!next) {
    return getAfterRank(prev);
  }
  
  // Between two ranks
  return getBetween(prev, next);
}

function getBeforeRank(rank: string): string {
  // Generate a rank that comes before the given rank
  const firstChar = rank[0];
  if (firstChar > MIN_CHAR) {
    // Find midpoint between MIN_CHAR and firstChar
    const midCode = Math.floor((MIN_CHAR.charCodeAt(0) + firstChar.charCodeAt(0)) / 2);
    return String.fromCharCode(midCode);
  }
  // Prepend a character
  return MIN_CHAR + rank;
}

function getAfterRank(rank: string): string {
  // Generate a rank that comes after the given rank
  const lastChar = rank[rank.length - 1];
  if (lastChar < MAX_CHAR) {
    // Increment last character
    const nextCode = Math.floor((lastChar.charCodeAt(0) + MAX_CHAR.charCodeAt(0)) / 2);
    return rank.slice(0, -1) + String.fromCharCode(nextCode);
  }
  // Append a character
  return rank + MID_CHAR;
}

function getBetween(prev: string, next: string): string {
  // Ensure prev < next
  if (prev >= next) {
    console.error(`Invalid rank order detected: prev="${prev}" (${prev.charCodeAt(0)}) >= next="${next}" (${next.charCodeAt(0)})`);
    console.error('This usually means ranks need rebalancing. Returning a fallback rank.');
    // Return a rank that's likely to work - use the next value with a suffix
    return next + MIN_CHAR;
  }
  
  // Find the first position where they differ
  const maxLen = Math.max(prev.length, next.length);
  let result = '';
  
  for (let i = 0; i < maxLen; i++) {
    const prevChar = prev[i] || MIN_CHAR;
    const nextChar = next[i] || MAX_CHAR;
    
    if (prevChar === nextChar) {
      result += prevChar;
      continue;
    }
    
    // Found difference
    const prevCode = prevChar.charCodeAt(0);
    const nextCode = nextChar.charCodeAt(0);
    
    if (nextCode - prevCode > 1) {
      // Room to insert between
      const midCode = Math.floor((prevCode + nextCode) / 2);
      return result + String.fromCharCode(midCode);
    } else {
      // No room, need to extend
      result += prevChar;
      // Continue to find or create space
      if (i + 1 < prev.length) {
        continue;
      } else {
        return result + MID_CHAR;
      }
    }
  }
  
  // Fallback - should not reach here
  return result + MID_CHAR;
}

/**
 * Generates an initial rank for the first item in a list
 */
export function getInitialRank(): string {
  return MID_CHAR;
}

/**
 * Rebalances ranks if they get too long (optional optimization)
 * Returns new ranks for all items in order
 */
export function rebalanceRanks(count: number): string[] {
  const ranks: string[] = [];
  const step = MAX_CHAR.charCodeAt(0) - MIN_CHAR.charCodeAt(0);
  const increment = step / (count + 1);
  
  for (let i = 1; i <= count; i++) {
    const code = MIN_CHAR.charCodeAt(0) + Math.floor(increment * i);
    ranks.push(String.fromCharCode(code));
  }
  
  return ranks;
}