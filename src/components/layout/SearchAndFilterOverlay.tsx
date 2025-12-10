import { useEffect, useRef, useState } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { Tag, tagService } from '@/services/tag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SearchAndFilterOverlay() {
  const {
    activeFilters,
    activePaneId,
    updatePaneFilters,
    resetPaneFilters,
    isOverlayOpen,
    closeOverlay,
  } = useFilters();
  
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadTags = async () => {
    try {
      const tags = await tagService.listAll();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };
  
  // Load all tags
  useEffect(() => {
    loadTags();
  }, []);
  
  // Focus search input when overlay opens
  useEffect(() => {
    if (isOverlayOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOverlayOpen]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && isOverlayOpen) {
        closeOverlay();
      }
      
      // Cmd/Ctrl+Shift+F to open
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        if (!isOverlayOpen) {
          closeOverlay();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayOpen, closeOverlay]);
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeOverlay();
    }
  };
  
  const toggleTag = (tagId: string) => {
    const currentTagIds = activeFilters.tagIds;
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter(id => id !== tagId)
      : [...currentTagIds, tagId];
    
    updatePaneFilters(activePaneId, { tagIds: newTagIds });
  };
  
  const handleTextQueryChange = (textQuery: string) => {
    updatePaneFilters(activePaneId, { textQuery });
  };
  
  const handleModeToggle = () => {
    const newMode = activeFilters.tagMode === 'dim' ? 'hide' : 'dim';
    updatePaneFilters(activePaneId, { tagMode: newMode });
  };
  
  const handleClearFilters = () => {
    resetPaneFilters(activePaneId);
  };
  
  if (!isOverlayOpen) return null;
  
  const hasActiveFilters = activeFilters.tagIds.length > 0 || activeFilters.textQuery.trim() !== '';
  
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
      onClick={handleBackdropClick}
    >
      <div
        ref={overlayRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-gray-900">Search & Filter</h2>
            <span className="text-sm text-gray-500">
              ({activePaneId === 'primary' ? 'Left pane' : 'Right pane'})
            </span>
          </div>
          <button
            onClick={closeOverlay}
            className="p-1 hover:bg-gray-100 rounded"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Text Search */}
          <div className="space-y-2">
            <Label htmlFor="search-input" className="text-sm font-medium text-gray-700">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search-input"
                ref={searchInputRef}
                type="text"
                placeholder="Search chapters, cards, themes…"
                value={activeFilters.textQuery}
                onChange={(e) => handleTextQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Tag Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Filter by Tags
              </Label>
              {activeFilters.tagIds.length > 0 && (
                <button
                  onClick={handleModeToggle}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {activeFilters.tagMode === 'dim' ? 'Dim unmatched' : 'Hide unmatched'}
                </button>
              )}
            </div>
            
            {allTags.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tags available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = activeFilters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        isSelected
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? tag.color + '20' : undefined,
                        borderColor: isSelected ? tag.color : undefined,
                        color: isSelected ? tag.color : undefined,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
            
            {activeFilters.tagIds.length > 0 && (
              <p className="text-xs text-gray-500">
                {activeFilters.tagIds.length} tag{activeFilters.tagIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={closeOverlay}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
