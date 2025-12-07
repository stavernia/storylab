// Book type definition
export interface Book {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  ownerUserId?: string | null; // reserved for future auth
  isArchived?: boolean;        // false by default
  chapterNumbering?: 'per-book' | 'per-part'; // Chapter numbering preference
}