import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-841a689e`;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`Tag API Error at ${endpoint}:`, error);
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Network error or server not available
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error(`Tag API: Server unavailable at ${API_URL}${endpoint}`);
      throw new Error('Tag server unavailable. Please refresh the page.');
    }
    throw error;
  }
}

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
  entityType: 'chapter' | 'card' | 'theme' | 'grid_cell';
  entityId: string;
  createdAt: string;
}

export const tagService = {
  async listAll(): Promise<Tag[]> {
    const { tags } = await fetchAPI('/tags');
    return tags.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
  },

  async create(name: string, color?: string): Promise<Tag> {
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) {
      throw new Error('Tag name cannot be empty');
    }
    
    const { tag } = await fetchAPI('/tag', {
      method: 'POST',
      body: JSON.stringify({ name: normalizedName, color }),
    });
    return tag;
  },

  async update(id: string, updates: { name?: string; color?: string }): Promise<void> {
    if (updates.name) {
      updates.name = updates.name.trim().toLowerCase();
      if (!updates.name) {
        throw new Error('Tag name cannot be empty');
      }
    }
    
    await fetchAPI(`/tag/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async remove(id: string): Promise<void> {
    await fetchAPI(`/tag/${id}`, {
      method: 'DELETE',
    });
  },

  async listForEntity(entityType: string, entityId: string): Promise<Tag[]> {
    // Guard: validate entityId before making API call
    if (!entityId || entityId.trim() === '') {
      console.warn(`listForEntity called with empty entityId for entityType: ${entityType}`);
      return [];
    }
    
    const { tags } = await fetchAPI(`/tags/entity/${entityType}/${entityId}`);
    return tags.sort((a: Tag, b: Tag) => a.name.localeCompare(b.name));
  },

  async addToEntity(tagId: string, entityType: string, entityId: string): Promise<void> {
    await fetchAPI('/tag-link', {
      method: 'POST',
      body: JSON.stringify({ tagId, entityType, entityId }),
    });
  },

  async removeFromEntity(tagId: string, entityType: string, entityId: string): Promise<void> {
    await fetchAPI(`/tag-link/${tagId}/${entityType}/${entityId}`, {
      method: 'DELETE',
    });
  },

  // Helper to sync tags for an entity
  async syncEntityTags(entityType: string, entityId: string, newTags: Tag[]): Promise<void> {
    const currentTags = await this.listForEntity(entityType, entityId);
    
    // Find tags to add
    const toAdd = newTags.filter(nt => !currentTags.find(ct => ct.id === nt.id));
    
    // Find tags to remove
    const toRemove = currentTags.filter(ct => !newTags.find(nt => nt.id === ct.id));
    
    // Execute changes
    await Promise.all([
      ...toAdd.map(tag => this.addToEntity(tag.id, entityType, entityId)),
      ...toRemove.map(tag => this.removeFromEntity(tag.id, entityType, entityId)),
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