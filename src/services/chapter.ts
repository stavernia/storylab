import { manuscriptApi } from "../api/manuscript";

export interface ChapterData {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  sortOrder?: number;
  wordQuota?: number;
  notes?: string;
  // Outline fields for Outliner MVP
  outline?: string;
  outlinePurpose?: string;
  outlinePOV?: string;
  outlineEstimate?: number;
  // NEW: Outliner Enhancement Pack fields
  outlineGoal?: string;
  outlineConflict?: string;
  outlineStakes?: string;
  customOutlineFields?: {
    [fieldId: string]: string; // key = field identifier, value = freeform text
  };
  lastEdited?: string; // ISO timestamp, updated on any content change
  // Binder-ready fields (unused for now)
  type?: 'chapter' | 'scene' | 'part' | 'custom';
  parentId?: string | null;
  metadata?: any;
}

export const chapterService = {
  async getById(id: string): Promise<ChapterData | null> {
    const data = await manuscriptApi.loadData();
    return data.chapters.find(c => c.id === id) || null;
  },

  async update(id: string, values: Partial<ChapterData>): Promise<void> {
    await manuscriptApi.updateChapter(id, values);
  },

  async create(values: Partial<ChapterData>): Promise<string> {
    const newChapter = {
      id: String(Date.now()),
      title: values.title || 'New Chapter',
      content: values.content || '',
      wordCount: values.wordCount || 0,
      sortOrder: values.sortOrder,
      wordQuota: values.wordQuota,
      notes: values.notes,
      // Outline fields for Outliner MVP
      outline: values.outline,
      outlinePurpose: values.outlinePurpose,
      outlinePOV: values.outlinePOV,
      outlineEstimate: values.outlineEstimate,
      // NEW: Outliner Enhancement Pack fields
      outlineGoal: values.outlineGoal,
      outlineConflict: values.outlineConflict,
      outlineStakes: values.outlineStakes,
      customOutlineFields: values.customOutlineFields,
      lastEdited: values.lastEdited,
      // Binder-ready fields (unused for now)
      type: values.type,
      parentId: values.parentId,
      metadata: values.metadata,
    };
    await manuscriptApi.saveChapter(newChapter);
    return newChapter.id;
  },

  async remove(id: string): Promise<void> {
    await manuscriptApi.deleteChapter(id);
  },
};
