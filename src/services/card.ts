import { corkboardApi, type CorkboardCard } from "../api/corkboard";

export const cardService = {
  async getById(id: string): Promise<CorkboardCard | null> {
    const cards = await corkboardApi.loadCards();
    return cards.find(c => c.id === id) || null;
  },

  async update(id: string, values: Partial<CorkboardCard>): Promise<void> {
    await corkboardApi.updateCard(id, values);
  },

  async create(values: CorkboardCard): Promise<void> {
    await corkboardApi.createCard(values);
  },

  async remove(id: string): Promise<void> {
    await corkboardApi.deleteCard(id);
  },
};
