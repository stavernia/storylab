import type { Book } from "../types/book";

async function fetchLocalJson<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorBody.error || "Request failed");
  }

  return response.json();
}

export const booksApi = {
  async listAll(): Promise<Book[]> {
    const { books } = await fetchLocalJson<{ books: Book[] }>("/api/books");
    return books || [];
  },

  async create(data: { title: string; description?: string }): Promise<Book> {
    const { book } = await fetchLocalJson<{ book: Book }>("/api/books", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return book;
  },

  async update(id: string, updates: Partial<Book>): Promise<Book> {
    const { book } = await fetchLocalJson<{ book: Book }>(`/api/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return book;
  },

  async archive(id: string): Promise<void> {
    await fetchLocalJson(`/api/books/${id}`, {
      method: "DELETE",
    });
  },
};
