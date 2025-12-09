import { tagsApi } from "@/api/tags";
import { booksApi } from "@/api/books";

export interface Tag {
  id: string;
  bookId: string; // NEW: Multi-book support
  name: string;
  color?: string;
  createdAt: string;
}

export interface TagLink {
  id: string;
  tagId: string;
  entityType: 'chapter' | 'card' | 'theme' | 'grid_cell' | 'character';
  entityId: string;
  createdAt: string;
}

let cachedBookId: string | null = null;

async function resolveBookId(bookId?: string): Promise<string> {
  if (bookId) {
    cachedBookId = bookId;
    return bookId;
  }

  if (cachedBookId) {
    return cachedBookId;
  }

  const books = await booksApi.listAll();

  if (!books[0]?.id) {
    throw new Error("Unable to resolve book context for tags");
  }

  cachedBookId = books[0].id;
  return cachedBookId;
}

export const tagService = {
  async listAll(bookId?: string): Promise<Tag[]> {
    const resolvedBookId = await resolveBookId(bookId);
    const tags = await tagsApi.list(resolvedBookId);
    return tags.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
  },

  async create(name: string, color?: string, bookId?: string): Promise<Tag> {
    const resolvedBookId = await resolveBookId(bookId);
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) {
      throw new Error('Tag name cannot be empty');
    }

    return tagsApi.create(resolvedBookId, { name: normalizedName, color });
  },

  async update(
    id: string,
    updates: { name?: string; color?: string; bookId?: string },
  ): Promise<void> {
    const resolvedBookId = await resolveBookId(updates.bookId);
    if (updates.name) {
      updates.name = updates.name.trim().toLowerCase();
      if (!updates.name) {
        throw new Error('Tag name cannot be empty');
      }
    }

    await tagsApi.update(resolvedBookId, id, updates);
  },

  async remove(id: string, bookId?: string): Promise<void> {
    const resolvedBookId = await resolveBookId(bookId);
    await tagsApi.remove(resolvedBookId, id);
  },

  async listForEntity(entityType: string, entityId: string, bookId?: string): Promise<Tag[]> {
    if (!entityId || entityId.trim() === '') {
      console.warn(`listForEntity called with empty entityId for entityType: ${entityType}`);
      return [];
    }

    const resolvedBookId = await resolveBookId(bookId);
    const tags = await tagsApi.listForEntity(resolvedBookId, entityType as any, entityId);
    return tags.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
  },

  async addToEntity(tagId: string, entityType: string, entityId: string, bookId?: string): Promise<void> {
    const resolvedBookId = await resolveBookId(bookId);
    await tagsApi.attachToEntity(resolvedBookId, entityType as any, entityId, tagId);
  },

  async removeFromEntity(
    tagId: string,
    entityType: string,
    entityId: string,
    bookId?: string,
  ): Promise<void> {
    const resolvedBookId = await resolveBookId(bookId);
    await tagsApi.detachFromEntity(resolvedBookId, entityType as any, entityId, tagId);
  },

  async syncEntityTags(
    entityType: string,
    entityId: string,
    newTags: Tag[],
    bookId?: string,
  ): Promise<void> {
    const resolvedBookId = await resolveBookId(bookId);
    const currentTags = await this.listForEntity(entityType, entityId, resolvedBookId);

    const toAdd = newTags.filter(nt => !currentTags.find(ct => ct.id === nt.id));
    const toRemove = currentTags.filter(ct => !newTags.find(nt => nt.id === ct.id));

    await Promise.all([
      ...toAdd.map(tag => this.addToEntity(tag.id, entityType, entityId, resolvedBookId)),
      ...toRemove.map(tag => this.removeFromEntity(tag.id, entityType, entityId, resolvedBookId)),
    ]);
  },
};

// Helper to display tag name in Title Case
export function displayTagName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
