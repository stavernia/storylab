import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tag } from '../services/tag';

export type FilterMode = 'dim' | 'hide';

interface TagFilterContextType {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  mode: FilterMode;
  setMode: (mode: FilterMode) => void;
  matches: (entityTags: Tag[]) => boolean;
  isActive: boolean;
  clear: () => void;
}

const TagFilterContext = createContext<TagFilterContextType | undefined>(undefined);

export function TagFilterProvider({ children }: { children: ReactNode }) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [mode, setMode] = useState<FilterMode>('dim');

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagsParam = params.get('tags');
    const visParam = params.get('vis');

    if (visParam === 'dim' || visParam === 'hide') {
      setMode(visParam);
    }

    // Note: Tag names from URL would need to be resolved to Tag objects
    // This requires loading all tags and matching by name
    // For now, URL restore will be implemented when tags are loaded in parent
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.map(t => t.name).join(','));
      params.set('vis', mode);
    } else {
      params.delete('tags');
      params.delete('vis');
    }

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedTags, mode]);

  const isActive = selectedTags.length > 0;

  // Check if entity matches all selected tags (AND logic)
  const matches = (entityTags: Tag[]): boolean => {
    if (!isActive) return true;
    
    return selectedTags.every(selectedTag =>
      entityTags.some(entityTag => entityTag.id === selectedTag.id)
    );
  };

  const clear = () => {
    setSelectedTags([]);
  };

  return (
    <TagFilterContext.Provider
      value={{
        selectedTags,
        setSelectedTags,
        mode,
        setMode,
        matches,
        isActive,
        clear,
      }}
    >
      {children}
    </TagFilterContext.Provider>
  );
}

export function useTagFilter() {
  const context = useContext(TagFilterContext);
  if (!context) {
    throw new Error('useTagFilter must be used within TagFilterProvider');
  }
  return context;
}
