import type { Chapter, Part } from '@/App';

export type ChapterNumberingMode = 'per-book' | 'per-part';

/**
 * Centralized chapter numbering calculation.
 * Returns a map of chapterId -> chapter number.
 */
export function calculateChapterNumbers(
  chapters: Chapter[],
  parts: Part[],
  mode: ChapterNumberingMode = 'per-book'
): Map<string, number> {
  const chapterNumberMap = new Map<string, number>();

  if (mode === 'per-book') {
    // Continuous numbering across the entire book
    chapters.forEach((chapter, index) => {
      chapterNumberMap.set(chapter.id, index + 1);
    });
  } else {
    // Restart numbering per part
    // Group chapters by part
    const partGroups = new Map<string, Chapter[]>();
    const unpartedChapters: Chapter[] = [];

    chapters.forEach(chapter => {
      if (chapter.partId) {
        if (!partGroups.has(chapter.partId)) {
          partGroups.set(chapter.partId, []);
        }
        partGroups.get(chapter.partId)!.push(chapter);
      } else {
        unpartedChapters.push(chapter);
      }
    });

    // Number unparted chapters first
    unpartedChapters.forEach((chapter, index) => {
      chapterNumberMap.set(chapter.id, index + 1);
    });

    // Number chapters within each part
    parts.forEach(part => {
      const partChapters = partGroups.get(part.id) || [];
      partChapters.forEach((chapter, index) => {
        chapterNumberMap.set(chapter.id, index + 1);
      });
    });
  }

  return chapterNumberMap;
}

/**
 * Get chapter number for a specific chapter
 */
export function getChapterNumber(
  chapterId: string,
  chapters: Chapter[],
  parts: Part[],
  mode: ChapterNumberingMode = 'per-book'
): number {
  const numberMap = calculateChapterNumbers(chapters, parts, mode);
  return numberMap.get(chapterId) || 1;
}

/**
 * Calculate part numbers based on sortOrder.
 * Returns a map of partId -> part number.
 */
export function calculatePartNumbers(parts: Part[]): Map<string, number> {
  const partNumberMap = new Map<string, number>();
  
  // Sort parts by sortOrder
  const sortedParts = [...parts].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
  
  // Assign sequential numbers
  sortedParts.forEach((part, index) => {
    partNumberMap.set(part.id, index + 1);
  });
  
  return partNumberMap;
}

/**
 * Get part number for a specific part
 */
export function getPartNumber(partId: string, parts: Part[]): number {
  const numberMap = calculatePartNumbers(parts);
  return numberMap.get(partId) || 1;
}