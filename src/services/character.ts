import { manuscriptApi } from "../api/manuscript";

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
    const newCharacter: CharacterData = {
      id: String(Date.now()),
      name: values.name || 'New Character',
      color: values.color || '#3B82F6',
      role: values.role,
      notes: values.notes,
    };
    await manuscriptApi.saveCharacter(newCharacter);
    return newCharacter.id;
  },

  async update(id: string, values: Partial<CharacterData>): Promise<void> {
    await manuscriptApi.saveCharacter({ id, ...values } as CharacterData);
  },

  async remove(id: string): Promise<void> {
    await manuscriptApi.deleteCharacter(id);
  },
};
