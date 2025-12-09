import { createContext, useContext, useState, ReactNode } from 'react';
import { Tag } from '@/services/tag';

export type PaneId = 'primary' | 'secondary';

export interface PaneFilterState {
  tagIds: string[];         // normalized tag IDs
  tagMode: 'dim' | 'hide';  // same semantics as useTagFilter
  textQuery: string;        // free-text search query
}

export interface FilterContextValue {
  activePaneId: PaneId;
  filtersByPane: Record<PaneId, PaneFilterState>;
  
  setActivePane(paneId: PaneId): void;
  
  updatePaneFilters(
    paneId: PaneId,
    partial: Partial<PaneFilterState>
  ): void;
  
  resetPaneFilters(paneId: PaneId): void;
  resetAllFilters(): void;
  
  // Convenience: current active pane filters
  activeFilters: PaneFilterState;
  
  // Overlay visibility
  isOverlayOpen: boolean;
  openOverlay(): void;
  closeOverlay(): void;
}

const defaultFilterState: PaneFilterState = {
  tagIds: [],
  tagMode: 'dim',
  textQuery: '',
};

const FilterContext = createContext<FilterContextValue | null>(null);

interface FilterProviderProps {
  children: ReactNode;
  activePaneId: PaneId;
  onActivePaneChange?: (paneId: PaneId) => void;
}

export function FilterProvider({ children, activePaneId, onActivePaneChange }: FilterProviderProps) {
  const [filtersByPane, setFiltersByPane] = useState<Record<PaneId, PaneFilterState>>({
    primary: { ...defaultFilterState },
    secondary: { ...defaultFilterState },
  });
  
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  
  const updatePaneFilters = (paneId: PaneId, partial: Partial<PaneFilterState>) => {
    setFiltersByPane(prev => ({
      ...prev,
      [paneId]: {
        ...prev[paneId],
        ...partial,
      },
    }));
  };
  
  const resetPaneFilters = (paneId: PaneId) => {
    setFiltersByPane(prev => ({
      ...prev,
      [paneId]: { ...defaultFilterState },
    }));
  };
  
  const resetAllFilters = () => {
    setFiltersByPane({
      primary: { ...defaultFilterState },
      secondary: { ...defaultFilterState },
    });
  };
  
  const setActivePane = (paneId: PaneId) => {
    if (onActivePaneChange) {
      onActivePaneChange(paneId);
    }
  };
  
  const openOverlay = () => setIsOverlayOpen(true);
  const closeOverlay = () => setIsOverlayOpen(false);
  
  const value: FilterContextValue = {
    activePaneId,
    filtersByPane,
    setActivePane,
    updatePaneFilters,
    resetPaneFilters,
    resetAllFilters,
    activeFilters: filtersByPane[activePaneId],
    isOverlayOpen,
    openOverlay,
    closeOverlay,
  };
  
  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
}
