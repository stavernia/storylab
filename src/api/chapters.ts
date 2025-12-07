import { fetchLocalJson } from "./http";
import type { Chapter } from "../App";

export const chaptersApi = {
  async list(bookId: string): Promise<Chapter[]> {
    const { chapters } = await fetchLocalJson<{ chapters: Chapter[] }>(
      `/api/books/${bookId}/chapters`,
    );
    return chapters || [];
  },

  async create(bookId: string, data: Partial<Chapter>): Promise<Chapter> {
    const { chapter } = await fetchLocalJson<{ chapter: Chapter }>(
      `/api/books/${bookId}/chapters`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return chapter;
  },

  async update(
    bookId: string,
    chapterId: string,
    updates: Partial<Chapter>,
  ): Promise<Chapter> {
    const { chapter } = await fetchLocalJson<{ chapter: Chapter }>(
      `/api/books/${bookId}/chapters/${chapterId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    return chapter;
  },

  async remove(bookId: string, chapterId: string): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/chapters/${chapterId}`, {
      method: "DELETE",
    });
  },
};
