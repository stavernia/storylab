import { fetchLocalJson } from "./http";
import type { Theme, ThemeNote } from "../App";

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
    const { themeNotes } = await fetchLocalJson<{ themeNotes: ThemeNote[] }>(
      `/api/books/${bookId}/theme-notes`,
    );

    return themeNotes || [];
  },

  async save(bookId: string, note: ThemeNote): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/theme-notes`, {
      method: "POST",
      body: JSON.stringify(note),
    });
  },
};
