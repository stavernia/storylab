import { manuscriptApi } from "../api/manuscript";

export interface GridCellData {
  chapterId: string;
  themeId: string;
  note: string;
  // Grid 2.0 fields
  presence?: boolean;
  intensity?: number; // 0–3
}

export const gridCellService = {
  async getById(chapterId: string, themeId: string): Promise<GridCellData | null> {
    const data = await manuscriptApi.loadData();
    const themeNote = data.themeNotes.find(
      tn => tn.chapterId === chapterId && tn.themeId === themeId
    );
    return themeNote || { chapterId, themeId, note: '' };
  },

  async update(chapterId: string, themeId: string, note: string): Promise<void> {
    await manuscriptApi.saveThemeNote({ chapterId, themeId, note });
  },
};
