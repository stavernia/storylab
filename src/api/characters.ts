import { fetchLocalJson } from "./http";
import type { Character } from "@/App";

export const charactersApi = {
  async list(bookId: string): Promise<Character[]> {
    const { characters } = await fetchLocalJson<{ characters: Character[] }>(
      `/api/books/${bookId}/characters`,
    );

    return characters || [];
  },

  async get(bookId: string, characterId: string): Promise<Character> {
    const { character } = await fetchLocalJson<{ character: Character }>(
      `/api/books/${bookId}/characters/${characterId}`,
    );

    return character;
  },

  async create(bookId: string, data: Partial<Character>): Promise<Character> {
    const { bookId: _bookId, id: _id, ...payload } = data as Partial<
      Character
    > & { bookId?: string; id?: string };

    const { character } = await fetchLocalJson<{ character: Character }>(
      `/api/books/${bookId}/characters`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    return character;
  },

  async update(
    bookId: string,
    characterId: string,
    updates: Partial<Character>,
  ): Promise<Character> {
    const { bookId: _bookId, id: _id, ...payload } = updates as Partial<
      Character
    > & { bookId?: string; id?: string };

    const { character } = await fetchLocalJson<{ character: Character }>(
      `/api/books/${bookId}/characters/${characterId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return character;
  },

  async remove(bookId: string, characterId: string): Promise<void> {
    await fetchLocalJson(`/api/books/${bookId}/characters/${characterId}`, {
      method: "DELETE",
    });
  },
};
