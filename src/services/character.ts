import { manuscriptApi } from "@/api/manuscript";
import { booksApi } from "@/api/books";

export interface CharacterData {
  id: string;
  name: string;
  color: string;
  role?: string;
  notes?: string;
}

export const characterService = {
  async list(): Promise<CharacterData[]> {
    const data = await manuscriptApi.loadData();
    return data.characters || [];
  },

  async getById(id: string): Promise<CharacterData | null> {
    const data = await manuscriptApi.loadData();
    return (data.characters || []).find((c: CharacterData) => c.id === id) || null;
  },

  async create(values: Partial<CharacterData>): Promise<string> {
    const books = await booksApi.listAll();
    const bookId = (values as any).bookId || books[0]?.id;

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
    const character = await this.getById(id);

    if (!character || !(character as any).bookId) {
      throw new Error("Unable to resolve book for character update");
    }

    await manuscriptApi.saveCharacter({
      ...(character as any),
      ...values,
    } as CharacterData & { bookId: string });
  },

  async remove(id: string): Promise<void> {
    const character = await this.getById(id);

    if (!character || !(character as any).bookId) {
      throw new Error("Unable to resolve book for character deletion");
    }

    await manuscriptApi.deleteCharacter((character as any).bookId, id);
  },
};
