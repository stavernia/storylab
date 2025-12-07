import { useState, useEffect } from 'react';
import { CorkboardCard } from "../../api/corkboard";
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TagChipInput } from '../tags/TagChipInput';
import { Tag } from '../../services/tag';
import { useDebounce } from '../../hooks/useDebounce';
import { Check, Loader2 } from 'lucide-react';

interface CardInfoFormProps {
  card: CorkboardCard;
  chapters: Array<{ id: string; title: string }>;
  onChange: (values: Partial<CorkboardCard>) => void;
  tags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  onSave?: (updates: Partial<CorkboardCard>) => Promise<void>;
  onTagsSave?: (tags: Tag[]) => Promise<void>;
  isSaving?: boolean;
  showSaveStatus?: boolean;
}

export function CardInfoForm({ 
  card, 
  chapters, 
  onChange, 
  tags, 
  onTagsChange,
  onSave,
  onTagsSave,
  isSaving = false,
  showSaveStatus = false,
}: CardInfoFormProps) {
  const [title, setTitle] = useState(card.title);
  const [summary, setSummary] = useState(card.summary || '');
  const [chapterId, setChapterId] = useState<string | undefined>(card.chapterId);
  const [status, setStatus] = useState<'idea' | 'draft' | 'done' | undefined>(card.status);
  const [color, setColor] = useState<'blue' | 'amber' | 'gray' | 'green' | 'purple' | 'red' | undefined>(card.color);
  const [wordEstimate, setWordEstimate] = useState<number | undefined>(card.wordEstimate);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  // Update local state when card prop changes (for when switching between cards)
  useEffect(() => {
    setTitle(card.title);
    setSummary(card.summary || '');
    setChapterId(card.chapterId);
    setStatus(card.status);
    setColor(card.color);
    setWordEstimate(card.wordEstimate);
  }, [card.id]);

  // Debounced save for text fields
  const debouncedSave = useDebounce(async (updates: Partial<CorkboardCard>) => {
    if (onSave) {
      await onSave(updates);
      setLastSavedTime(Date.now());
    }
  }, 600);

  // Immediate save for dropdowns and non-text fields
  const immediateSave = async (updates: Partial<CorkboardCard>) => {
    if (onSave) {
      await onSave(updates);
      setLastSavedTime(Date.now());
    }
  };

  // Get scope label for display
  const getScopeLabel = () => {
    const scope = card.scope || 'chapter';
    return scope.charAt(0).toUpperCase() + scope.slice(1);
  };

  // Handle title change with debounced save
  const handleTitleChange = (value: string) => {
    setTitle(value);
    onChange({ title: value.trim() });
    if (value.trim()) {
      debouncedSave({ title: value.trim() });
    }
  };

  // Handle summary change with debounced save
  const handleSummaryChange = (value: string) => {
    setSummary(value);
    onChange({ summary: value.trim() || undefined });
    debouncedSave({ summary: value.trim() || undefined });
  };

  // Handle title blur - immediate save
  const handleTitleBlur = () => {
    if (title.trim() && onSave) {
      immediateSave({ title: title.trim() });
    }
  };

  // Handle summary blur - immediate save
  const handleSummaryBlur = () => {
    if (onSave) {
      immediateSave({ summary: summary.trim() || undefined });
    }
  };

  // Handle chapter change - immediate save
  const handleChapterChange = (val: string) => {
    const newChapterId = val === 'unassigned' ? undefined : val;
    setChapterId(newChapterId);
    onChange({ chapterId: newChapterId });
    immediateSave({ chapterId: newChapterId });
  };

  // Handle status change - immediate save
  const handleStatusChange = (val: string) => {
    const newStatus = val === 'none' ? undefined : val as any;
    setStatus(newStatus);
    onChange({ status: newStatus });
    immediateSave({ status: newStatus });
  };

  // Handle color change - immediate save
  const handleColorChange = (val: string) => {
    const newColor = val === 'none' ? undefined : val as any;
    setColor(newColor);
    onChange({ color: newColor });
    immediateSave({ color: newColor });
  };

  // Handle word estimate change - debounced save
  const handleWordEstimateChange = (value: string) => {
    const num = value ? parseInt(value) : undefined;
    setWordEstimate(num);
    onChange({ wordEstimate: num && num > 0 ? num : undefined });
    debouncedSave({ wordEstimate: num && num > 0 ? num : undefined });
  };

  // Handle word estimate blur - immediate save
  const handleWordEstimateBlur = () => {
    if (onSave) {
      immediateSave({ wordEstimate: wordEstimate && wordEstimate > 0 ? wordEstimate : undefined });
    }
  };

  // Handle tags change - immediate save
  const handleTagsChange = async (newTags: Tag[]) => {
    if (onTagsChange) {
      onTagsChange(newTags);
    }
    if (onTagsSave) {
      await onTagsSave(newTags);
      setLastSavedTime(Date.now());
    }
  };

  // Show "Saved" for 2 seconds after save
  const showSaved = lastSavedTime && (Date.now() - lastSavedTime < 2000);

  return (
    <div className="space-y-4">
      {/* Save Status Indicator */}
      {showSaveStatus && (
        <div className="flex items-center justify-end text-xs h-4">
          {isSaving ? (
            <div className="flex items-center gap-1 text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : showSaved ? (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Scope Display */}
      <div className="px-3 py-2 bg-gray-100 rounded-md border border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Scope</div>
        <div className="text-sm font-medium text-gray-700">{getScopeLabel()}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-title">Title *</Label>
        <Input
          id="card-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Card title"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-summary">Summary</Label>
        <Textarea
          id="card-summary"
          value={summary}
          onChange={(e) => handleSummaryChange(e.target.value)}
          onBlur={handleSummaryBlur}
          placeholder="Brief description of this scene or beat"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Only show chapter selector for chapter-scoped cards */}
        {(card.scope === 'chapter' || !card.scope) && (
          <div className="space-y-2">
            <Label htmlFor="card-chapter">Chapter</Label>
            <Select
              value={chapterId || 'unassigned'}
              onValueChange={handleChapterChange}
            >
              <SelectTrigger id="card-chapter">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999]" sideOffset={5}>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {chapters.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="card-status">Status</Label>
          <Select
            value={status || 'none'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger id="card-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[9999]" sideOffset={5}>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="card-color">Color</Label>
          <Select
            value={color || 'none'}
            onValueChange={handleColorChange}
          >
            <SelectTrigger id="card-color">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[9999]" sideOffset={5}>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
              <SelectItem value="amber">Amber</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="gray">Gray</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card-words">Word Estimate</Label>
          <Input
            id="card-words"
            type="number"
            min="0"
            value={wordEstimate || ''}
            onChange={(e) => handleWordEstimateChange(e.target.value)}
            onBlur={handleWordEstimateBlur}
            placeholder="e.g., 500"
          />
        </div>
      </div>

      {onTagsChange && (
        <div className="space-y-2">
          <Label htmlFor="card-tags">Tags</Label>
          <TagChipInput
            value={tags || []}
            onChange={handleTagsChange}
          />
        </div>
      )}
    </div>
  );
}
