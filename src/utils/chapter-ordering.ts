import type { Chapter, Part } from '@/App';

/**
 * Returns chapters in the same order as displayed in the ChapterList sidebar:
 * 1. For each part (sorted by sortOrder):
 *    - The part's chapters in their original order
 * 2. Unassigned chapters at the end
 */
export function getOrderedChapters(chapters: Chapter[], parts?: Part[]): Chapter[] {
  if (!parts || parts.length === 0) {
    return chapters;
  }

  const ordered: Chapter[] = [];
  const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
  
  // Add chapters for each part
  sortedParts.forEach(part => {
    const partChapters = chapters.filter(ch => ch.partId === part.id);
    ordered.push(...partChapters);
  });
  
  // Add unassigned chapters
  const unassignedChapters = chapters.filter(ch => !ch.partId);
  ordered.push(...unassignedChapters);
  
  return ordered;
}
