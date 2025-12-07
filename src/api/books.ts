import { fetchJson } from "./client";
import type { Book } from "../types/book";

export const booksApi = {
  async listAll(): Promise<Book[]> {
    const { books } = await fetchJson("/books");
    return books || [];
  },

  async create(data: { title: string; description?: string }): Promise<Book> {
    const { book } = await fetchJson("/book", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return book;
  },

  async update(id: string, updates: Partial<Book>): Promise<Book> {
    const { book } = await fetchJson(`/book/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return book;
  },

  async archive(id: string): Promise<void> {
    await fetchJson(`/book/${id}`, {
      method: "DELETE",
    });
  },
};
