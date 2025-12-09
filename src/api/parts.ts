import { fetchLocalJson } from "./http";
import type { Part } from "@/App";

export const partsApi = {
  async list(bookId: string): Promise<Part[]> {
    const { parts } = await fetchLocalJson<{ parts: Part[] }>(
      `/api/books/${bookId}/parts`,
    );
    return parts || [];
  },

  async create(
    bookId: string,
    data: { title: string; notes?: string },
  ): Promise<Part> {
    if (!bookId) {
      throw new Error("bookId is required to create a part");
    }

    const { part } = await fetchLocalJson<{ part: Part }>(
      `/api/books/${bookId}/parts`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return part;
  },

  async update(
    bookId: string,
    partId: string,
    updates: Partial<Pick<Part, "title" | "notes" | "sortOrder">>,
  ): Promise<Part> {
    const { part } = await fetchLocalJson<{ part: Part }>(
      `/api/books/${bookId}/parts/${partId}`,
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );

    return part;
  },

  async remove(bookId: string, partId: string): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/parts/${partId}`, {
      method: "DELETE",
    });
  },

  async reorder(bookId: string, reorderedParts: Part[]): Promise<void> {
    await Promise.all(
      reorderedParts.map((part, index) =>
        partsApi.update(bookId, part.id, { sortOrder: index }),
      ),
    );
  },
};
