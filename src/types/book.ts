// Book type definition
export interface Book {
  id: string;
  title: string;
  userId: string;
  description?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  isArchived?: boolean;        // false by default
  archivedAt?: string | null;
  chapterNumbering?: 'per-book' | 'per-part'; // Chapter numbering preference
  showPartTitles?: boolean;
  showChapterTitles?: boolean;
}