import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Tag, tagService, displayTagName } from '@/services/tag';
import { theme } from '@/theme';

interface TagChipInputProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  allowCreate?: boolean;
  placeholder?: string;
}

const TAG_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  gray: '#6b7280',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
};

export function TagChipInput({
  value = [],
  onChange,
  allowCreate = true,
  placeholder = 'Add tags...',
}: TagChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all tags
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tags = await tagService.listAll();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // Filter tags based on input
  useEffect(() => {
    if (inputValue) {
      const query = inputValue.toLowerCase();
      const filtered = allTags.filter(
        tag => !value.find(v => v.id === tag.id) && tag.name.includes(query)
      );
      setFilteredTags(filtered);
      setShowDropdown(true);
      setSelectedIndex(0);
    } else {
      setFilteredTags([]);
      setShowDropdown(false);
    }
  }, [inputValue, allTags, value]);

  const addTag = async (tag: Tag) => {
    onChange([...value, tag]);
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const createAndAddTag = async (name: string) => {
    try {
      const normalizedName = name.trim().toLowerCase();
      if (!normalizedName) return;

      // Check if tag already exists
      const existing = allTags.find(t => t.name === normalizedName);
      if (existing) {
        addTag(existing);
        return;
      }

      // Create new tag
      const newTag = await tagService.create(normalizedName);
      setAllTags([...allTags, newTag]);
      addTag(newTag);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const removeTag = (tagId: string) => {
    onChange(value.filter(t => t.id !== tagId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTags.length > 0 && selectedIndex < filteredTags.length) {
        addTag(filteredTags[selectedIndex]);
      } else if (allowCreate && inputValue.trim()) {
        createAndAddTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setInputValue('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredTags.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1].id);
    }
  };

  const getTagColor = (color?: string) => {
    if (!color) return '#6b7280';
    return TAG_COLORS[color] || color;
  };

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-white min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-sm"
            style={{ borderRadius: `${theme.radii.sm}px` }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getTagColor(tag.color) }}
              aria-label={`Tag color: ${tag.color || 'default'}`}
            />
            <span>{displayTagName(tag.name)}</span>
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{ zIndex: theme.z.dropdown }}
        >
          {filteredTags.length > 0 ? (
            filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getTagColor(tag.color) }}
                />
                <span>{displayTagName(tag.name)}</span>
              </button>
            ))
          ) : allowCreate && inputValue.trim() ? (
            <button
              type="button"
              onClick={() => createAndAddTag(inputValue)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Create "{inputValue}"</span>
            </button>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>
          )}
        </div>
      )}
    </div>
  );
}
