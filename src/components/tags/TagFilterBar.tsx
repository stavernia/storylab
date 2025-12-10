import { Eye, EyeOff, X, Filter } from 'lucide-react';
import { Tag, displayTagName } from '@/services/tag';
import { FilterMode } from '@/contexts/TagFilterContext';
import { TagChipInput } from './TagChipInput';
import { theme } from '@/theme';

interface TagFilterBarProps {
  selectedTags: Tag[];
  onSelectedTagsChange: (tags: Tag[]) => void;
  mode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  onClear: () => void;
  isActive: boolean;
}

export function TagFilterBar({
  selectedTags,
  onSelectedTagsChange,
  mode,
  onModeChange,
  onClear,
  isActive,
}: TagFilterBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filter:</span>
      </div>

      <div className="flex-1 max-w-md">
        <TagChipInput
          value={selectedTags}
          onChange={onSelectedTagsChange}
          allowCreate={false}
          placeholder="Select tags to filter..."
        />
      </div>

      {isActive && (
        <>
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onModeChange('dim')}
              className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${
                mode === 'dim'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Dim unmatched items"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dim</span>
            </button>
            <button
              onClick={() => onModeChange('hide')}
              className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-1.5 ${
                mode === 'hide'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Hide unmatched items"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hide</span>
            </button>
          </div>

          {/* Clear Button */}
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
            title="Clear all filters"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </>
      )}

      {!isActive && (
        <span className="text-xs text-gray-400 hidden sm:inline">
          Select tags to filter content
        </span>
      )}
    </div>
  );
}
