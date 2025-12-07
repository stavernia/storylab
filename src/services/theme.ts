import { manuscriptApi } from "../api/manuscript";
import { booksApi } from "../api/books";

export interface ThemeData {
  bookId: string;
  id: string;
  name: string;
  color: string;
  purpose?: string;
  notes?: string;
  // Grid 2.0 fields
  kind?: 'tracker' | 'info';
  source?: 'character' | 'theme' | 'custom' | 'thread';
  mode?: 'presence' | 'heatmap' | 'thread';
  sourceRefId?: string | null;
  // NEW: Grid Enhancement Pack - Row Metadata
  description?: string;
  aiGuide?: string;
  rowOrder?: number | null;
  isHidden?: boolean;
  // NEW: Thread Lines v1
  threadLabel?: string;
}

export const themeService = {
  async getById(id: string): Promise<ThemeData | null> {
    const data = await manuscriptApi.loadData();
    return data.themes.find(t => t.id === id) || null;
  },

  async update(id: string, values: Partial<ThemeData>): Promise<void> {
    const theme = await this.getById(id);

    if (!theme?.bookId) {
      throw new Error("Unable to resolve book for theme update");
    }

    await manuscriptApi.updateTheme(theme.bookId, id, values);
  },

  async create(values: Partial<ThemeData>): Promise<string> {
    const books = await booksApi.listAll();
    const bookId = values.bookId || books[0]?.id;

    if (!bookId) {
      throw new Error("bookId is required to create a theme");
    }

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    const newTheme = {
      id: String(Date.now()),
      bookId,
      name: values.name || 'New Theme',
      color: values.color || colors[0],
      purpose: values.purpose,
      notes: values.notes,
    };
    await manuscriptApi.saveTheme(newTheme);
    return newTheme.id;
  },

  async remove(id: string): Promise<void> {
    const theme = await this.getById(id);

    if (!theme?.bookId) {
      throw new Error("Unable to resolve book for theme deletion");
    }

    await manuscriptApi.deleteTheme(theme.bookId, id);
  },
};
