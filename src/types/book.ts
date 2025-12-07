// Book type definition
export interface Book {
  id: string;
  title: string;
  userId: string;
  description?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  isArchived?: boolean;        // false by default
  chapterNumbering?: 'per-book' | 'per-part'; // Chapter numbering preference
}