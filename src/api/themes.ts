import type { Theme, ThemeNote } from "@/App";
import { fetchLocalJson } from "./http";
import { gridApi } from "./grid";

export const themesApi = {
  async list(bookId: string): Promise<Theme[]> {
    const { themes } = await fetchLocalJson<{ themes: Theme[] }>(
      `/api/books/${bookId}/themes`,
    );

    return themes || [];
  },

  async get(bookId: string, themeId: string): Promise<Theme> {
    const { theme } = await fetchLocalJson<{ theme: Theme }>(
      `/api/books/${bookId}/themes/${themeId}`,
    );

    return theme;
  },

  async create(bookId: string, data: Partial<Theme>): Promise<Theme> {
    const { bookId: _bookId, id: _id, ...payload } = data as Partial<
      Theme
    > & { bookId?: string; id?: string };

    const { theme } = await fetchLocalJson<{ theme: Theme }>(
      `/api/books/${bookId}/themes`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return theme;
  },

  async update(
    bookId: string,
    themeId: string,
    updates: Partial<Theme>,
  ): Promise<Theme> {
    const { bookId: _bookId, id: _id, ...payload } = updates as Partial<
      Theme
    > & { bookId?: string; id?: string };

    const { theme } = await fetchLocalJson<{ theme: Theme }>(
      `/api/books/${bookId}/themes/${themeId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return theme;
  },

  async remove(bookId: string, themeId: string): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/themes/${themeId}`, {
      method: "DELETE",
    });
  },
};

export const themeNotesApi = {
  async list(bookId: string): Promise<ThemeNote[]> {
    const cells = await gridApi.list(bookId);

    return cells.map((cell) => ({
      chapterId: cell.chapterId,
      themeId: cell.themeId,
      note: cell.note ?? "",
      presence: cell.presence,
      intensity: cell.intensity,
      threadRole: cell.threadRole as ThemeNote["threadRole"],
    }));
  },

  async save(bookId: string, note: ThemeNote): Promise<void> {
    await gridApi.upsertMany(bookId, [
      {
        chapterId: note.chapterId,
        themeId: note.themeId,
        note: note.note,
        presence: note.presence,
        intensity: note.intensity,
        threadRole: note.threadRole,
      },
    ]);
  },
};
