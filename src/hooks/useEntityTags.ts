import { useState, useEffect } from 'react';
import { Tag, tagService } from '../services/tag';

// Module-level cache
const tagCache = new Map<string, Tag[]>();

export function useEntityTags(
  entityType: 'chapter' | 'card' | 'theme' | 'grid_cell',
  entityId: string
) {
  const cacheKey = `${entityType}:${entityId}`;
  const [tags, setTags] = useState<Tag[] | undefined>(tagCache.get(cacheKey));
  const [isLoading, setIsLoading] = useState(!tagCache.has(cacheKey));

  const reload = async () => {
    // Guard: don't load if entityId is empty or invalid
    if (!entityId || entityId.trim() === '') {
      setTags([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const fetchedTags = await tagService.listForEntity(entityType, entityId);
      tagCache.set(cacheKey, fetchedTags);
      setTags(fetchedTags);
    } catch (error) {
      console.error(`Failed to load tags for ${cacheKey}:`, error);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Guard: don't load if entityId is empty or invalid
    if (!entityId || entityId.trim() === '') {
      setTags([]);
      setIsLoading(false);
      return;
    }
    
    if (!tagCache.has(cacheKey)) {
      reload();
    }
  }, [cacheKey]);

  return { tags, reload, isLoading };
}

// Utility to invalidate cache when tags are updated
export function invalidateEntityTags(entityType: string, entityId: string) {
  const cacheKey = `${entityType}:${entityId}`;
  tagCache.delete(cacheKey);
}

// Utility to clear all cached tags
export function clearTagCache() {
  tagCache.clear();
}