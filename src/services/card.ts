import { corkboardApi, type CorkboardCard, type CreateCardInput } from "@/api/corkboard";

export const cardService = {
  async getById(bookId: string, id: string): Promise<CorkboardCard | null> {
    const cards = await corkboardApi.loadCards(bookId);
    return cards.find(c => c.id === id) || null;
  },

  async update(
    bookId: string,
    id: string,
    values: Partial<CorkboardCard>,
  ): Promise<CorkboardCard> {
    return corkboardApi.updateCard(bookId, id, values);
  },

  async create(bookId: string, values: CreateCardInput): Promise<CorkboardCard> {
    return corkboardApi.createCard(bookId, values);
  },

  async remove(bookId: string, id: string): Promise<void> {
    await corkboardApi.deleteCard(bookId, id);
  },
};
