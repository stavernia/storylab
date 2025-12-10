import { manuscriptApi } from "@/api/manuscript";
import { booksApi } from "@/api/books";

export interface CharacterData {
  id: string;
  bookId: string;
  name: string;
  color: string;
  role?: string;
  notes?: string;
}

export const characterService = {
  async list(bookId: string): Promise<CharacterData[]> {
    const data = await manuscriptApi.loadData(bookId);
    return data.characters || [];
  },

  async getById(id: string, bookId: string): Promise<CharacterData | null> {
    const data = await manuscriptApi.loadData(bookId);
    return (data.characters || []).find((c: CharacterData) => c.id === id) || null;
  },

  async create(values: Partial<CharacterData>): Promise<string> {
    const books = await booksApi.listAll();
    const bookId = values.bookId || books[0]?.id;

    if (!bookId) {
      throw new Error("bookId is required to create a character");
    }

    const newCharacter: CharacterData = {
      id: String(Date.now()),
      bookId,
      name: values.name || 'New Character',
      color: values.color || '#3B82F6',
      role: values.role,
      notes: values.notes,
    };
    await manuscriptApi.saveCharacter(newCharacter);
    return newCharacter.id;
  },

  async update(id: string, values: Partial<CharacterData>): Promise<void> {
    if (!values.bookId) {
      throw new Error("bookId is required to update a character");
    }
    const character = await this.getById(id, values.bookId);
    if (!character?.bookId) {
      throw new Error("Unable to resolve book for character update");
    }
    await manuscriptApi.saveCharacter({
      ...character,
      ...values,
      bookId: values.bookId ?? character.bookId,
    });
  },

  async remove(id: string, bookId: string): Promise<void> {
    const character = await this.getById(id, bookId);
    if (!character?.bookId) {
      throw new Error("Unable to resolve book for character deletion");
    }
    await manuscriptApi.deleteCharacter(character.bookId, id);
  },
};
