import { fetchLocalJson } from "./http";
import type { Tag } from "../services/tag";

type EntityScope = "chapter" | "card" | "theme" | "grid_cell" | "character";

async function ensureBookId(bookId?: string): Promise<string> {
  if (!bookId) {
    throw new Error("bookId is required for tag operations");
  }

  return bookId;
}

export const tagsApi = {
  async list(bookId: string): Promise<Tag[]> {
    const resolvedBookId = await ensureBookId(bookId);
    const { tags } = await fetchLocalJson<{ tags: Tag[] }>(
      `/api/books/${resolvedBookId}/tags`,
    );

    return tags || [];
  },

  async create(bookId: string, data: Pick<Tag, "name" | "color">): Promise<Tag> {
    const resolvedBookId = await ensureBookId(bookId);
    const { tag } = await fetchLocalJson<{ tag: Tag }>(
      `/api/books/${resolvedBookId}/tags`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    return tag;
  },

  async update(
    bookId: string,
    tagId: string,
    updates: Partial<Pick<Tag, "name" | "color">>,
  ): Promise<void> {
    const resolvedBookId = await ensureBookId(bookId);

    await fetchLocalJson(`/api/books/${resolvedBookId}/tags/${tagId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async remove(bookId: string, tagId: string): Promise<void> {
    const resolvedBookId = await ensureBookId(bookId);

    await fetchLocalJson(`/api/books/${resolvedBookId}/tags/${tagId}`, {
      method: "DELETE",
    });
  },

  async listForEntity(
    bookId: string,
    entityType: EntityScope,
    entityId: string,
  ): Promise<Tag[]> {
    const resolvedBookId = await ensureBookId(bookId);
    const { tags } = await fetchLocalJson<{ tags: Tag[] }>(
      `/api/books/${resolvedBookId}/tags/entity/${entityType}/${entityId}`,
    );

    return tags || [];
  },

  async attachToEntity(
    bookId: string,
    entityType: EntityScope,
    entityId: string,
    tagId: string,
  ): Promise<void> {
    const resolvedBookId = await ensureBookId(bookId);

    await fetchLocalJson(`/api/books/${resolvedBookId}/tags/entity/${entityType}/${entityId}`, {
      method: "POST",
      body: JSON.stringify({ tagId }),
    });
  },

  async detachFromEntity(
    bookId: string,
    entityType: EntityScope,
    entityId: string,
    tagId: string,
  ): Promise<void> {
    const resolvedBookId = await ensureBookId(bookId);

    await fetchLocalJson(`/api/books/${resolvedBookId}/tags/entity/${entityType}/${entityId}`, {
      method: "DELETE",
      body: JSON.stringify({ tagId }),
    });
  },
};
