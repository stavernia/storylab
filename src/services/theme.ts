import { manuscriptApi } from "../api/manuscript";

export interface ThemeData {
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
    await manuscriptApi.updateTheme(id, values);
  },

  async create(values: Partial<ThemeData>): Promise<string> {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    const newTheme = {
      id: String(Date.now()),
      name: values.name || 'New Theme',
      color: values.color || colors[0],
      purpose: values.purpose,
      notes: values.notes,
    };
    await manuscriptApi.saveTheme(newTheme);
    return newTheme.id;
  },

  async remove(id: string): Promise<void> {
    await manuscriptApi.deleteTheme(id);
  },
};
