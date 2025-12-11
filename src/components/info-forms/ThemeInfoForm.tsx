import { useState, useEffect } from "react";
import { ThemeData } from "@/services/theme";
import { Character } from "@/App";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PLACEHOLDERS } from "@/constants/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagChipInput } from "@/components/tags/TagChipInput";
import { Tag } from "@/services/tag";
import { useDebounce } from "@/hooks/useDebounce";
import { Check, Loader2 } from "lucide-react";

interface ThemeInfoFormProps {
  theme?: ThemeData;
  characters?: Character[];
  onChange?: (values: Partial<ThemeData>) => void;
  onSubmit?: (values: Partial<ThemeData>) => void;
  onClose?: () => void;
  tags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  onSave?: (updates: Partial<ThemeData>) => Promise<void>;
  onTagsSave?: (tags: Tag[]) => Promise<void>;
  isSaving?: boolean;
  showSaveStatus?: boolean;
}

const colorOptions = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#6b7280", label: "Gray" },
];

export function ThemeInfoForm({
  theme,
  characters,
  onChange,
  onSubmit,
  onClose,
  tags,
  onTagsChange,
  onSave,
  onTagsSave,
  isSaving,
  showSaveStatus,
}: ThemeInfoFormProps) {
  const [name, setName] = useState(theme?.name || "");
  const [color, setColor] = useState(theme?.color || "#3b82f6");
  const [purpose, setPurpose] = useState(theme?.purpose || "");
  const [notes, setNotes] = useState(theme?.notes || "");

  // Grid 2.0 fields
  const [source, setSource] = useState<
    "character" | "theme" | "custom" | "thread"
  >(theme?.source || "theme");
  const [mode, setMode] = useState<"presence" | "heatmap" | "thread">(
    theme?.mode || "presence",
  );
  const [sourceRefId, setSourceRefId] = useState<string | null>(
    theme?.sourceRefId || null,
  );

  // NEW: Grid Enhancement Pack - Row Metadata
  const [description, setDescription] = useState(theme?.description || "");
  const [aiGuide, setAiGuide] = useState(theme?.aiGuide || "");

  // NEW: Thread Lines v1
  const [threadLabel, setThreadLabel] = useState(theme?.threadLabel || "");

  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);

  // Phase 1.5: Update form when theme prop changes
  useEffect(() => {
    if (theme) {
      setName(theme.name || "");
      setColor(theme.color || "#3b82f6");
      setPurpose(theme.purpose || "");
      setNotes(theme.notes || "");
      setSource(theme.source || "theme");
      setMode(theme.mode || "presence");
      setSourceRefId(theme.sourceRefId || null);
      setDescription(theme.description || "");
      setAiGuide(theme.aiGuide || "");
      setThreadLabel(theme.threadLabel || "");
    }
  }, [theme?.id]); // Only re-run when theme ID changes

  // Debounced save for text fields
  const debouncedSave = useDebounce(async (updates: Partial<ThemeData>) => {
    if (onSave) {
      await onSave(updates);
      setLastSavedTime(Date.now());
    }
  }, 600);

  // Immediate save for dropdowns and non-text fields
  const immediateSave = async (updates: Partial<ThemeData>) => {
    if (onSave) {
      await onSave(updates);
      setLastSavedTime(Date.now());
    }
  };

  // Handle field changes with auto-save
  const handleNameChange = (value: string) => {
    setName(value);
    onChange?.({ name: value.trim() });
    if (value.trim()) {
      debouncedSave({ name: value.trim() });
    }
  };

  const handleColorChange = (value: string) => {
    setColor(value);
    onChange?.({ color: value });
    immediateSave({ color: value });
  };

  const handlePurposeChange = (value: string) => {
    setPurpose(value);
    onChange?.({ purpose: value.trim() || undefined });
    debouncedSave({ purpose: value.trim() || undefined });
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onChange?.({ notes: value.trim() || undefined });
    debouncedSave({ notes: value.trim() || undefined });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onChange?.({ description: value.trim() || undefined });
    debouncedSave({ description: value.trim() || undefined });
  };

  const handleAiGuideChange = (value: string) => {
    setAiGuide(value);
    onChange?.({ aiGuide: value.trim() || undefined });
    debouncedSave({ aiGuide: value.trim() || undefined });
  };

  const handleThreadLabelChange = (value: string) => {
    setThreadLabel(value);
    onChange?.({ threadLabel: value.trim() || undefined });
    debouncedSave({ threadLabel: value.trim() || undefined });
  };

  const handleSourceChange = (
    value: "character" | "theme" | "custom" | "thread",
  ) => {
    setSource(value);
    onChange?.({ source: value });
    immediateSave({ source: value });
  };

  const handleModeChange = (value: "presence" | "heatmap" | "thread") => {
    setMode(value);
    onChange?.({ mode: value });
    immediateSave({ mode: value });
  };

  const handleSourceRefIdChange = (value: string | null) => {
    setSourceRefId(value);
    onChange?.({ sourceRefId: value });
    immediateSave({ sourceRefId: value });
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    if (onTagsChange) {
      onTagsChange(newTags);
    }
    if (onTagsSave) {
      await onTagsSave(newTags);
      setLastSavedTime(Date.now());
    }
  };

  // For the embedded/live-update pattern (used in GridView) - only if NO onSave handler
  useEffect(() => {
    if (onChange && !onSave) {
      onChange({
        name: name.trim(),
        color,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
        source,
        mode,
        sourceRefId,
        description: description.trim() || undefined,
        aiGuide: aiGuide.trim() || undefined,
        threadLabel: threadLabel.trim() || undefined,
      });
    }
  }, [
    name,
    color,
    purpose,
    notes,
    source,
    mode,
    sourceRefId,
    description,
    aiGuide,
    threadLabel,
    onChange,
    onSave,
  ]);

  // For the submit pattern (used in ThemeManager)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        name: name.trim() || "Unnamed Theme",
        color,
        purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
        source,
        mode,
        sourceRefId,
        description: description.trim() || undefined,
        aiGuide: aiGuide.trim() || undefined,
        threadLabel: threadLabel.trim() || undefined,
      });
    }
    if (onClose) {
      onClose();
    }
  };

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="theme-name">Name {onSubmit && "*"}</Label>
        <Input
          id="theme-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={PLACEHOLDERS.THEME_NAME}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-color">Color</Label>
        <Select value={color} onValueChange={handleColorChange}>
          <SelectTrigger id="theme-color">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color }}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]" sideOffset={5}>
            {colorOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: option.value }}
                  />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid 2.0: Row Type Configuration */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm text-gray-700">Row Type (Grid 2.0)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="theme-source">Source</Label>
            <Select value={source} onValueChange={handleSourceChange}>
              <SelectTrigger id="theme-source">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[9999]"
                sideOffset={5}
              >
                <SelectItem value="theme">Theme</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme-mode">Display Mode</Label>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger id="theme-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[9999]"
                sideOffset={5}
              >
                <SelectItem value="presence">Presence (✔/✖)</SelectItem>
                <SelectItem value="heatmap">Heatmap (0–3)</SelectItem>
                <SelectItem value="thread">Thread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {source === "character" && characters && characters.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="theme-character">Linked Character</Label>
            <Select
              value={sourceRefId || "none"}
              onValueChange={handleSourceRefIdChange}
            >
              <SelectTrigger id="theme-character">
                <SelectValue placeholder="Select character" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[9999]"
                sideOffset={5}
              >
                <SelectItem value="none">None</SelectItem>
                {characters.map((char) => (
                  <SelectItem key={char.id} value={char.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: char.color }}
                      />
                      {char.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-purpose">Purpose</Label>
        <Textarea
          id="theme-purpose"
          value={purpose}
          onChange={(e) => handlePurposeChange(e.target.value)}
          placeholder="What role does this theme play in your story?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-notes">Notes</Label>
        <Textarea
          id="theme-notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Additional notes about this theme"
          rows={4}
        />
      </div>

      {/* NEW: Grid Enhancement Pack - Row Metadata */}
      <div className="space-y-2">
        <Label htmlFor="theme-description">Description</Label>
        <Textarea
          id="theme-description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Detailed description of the theme"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme-ai-guide">AI Guide</Label>
        <Textarea
          id="theme-ai-guide"
          value={aiGuide}
          onChange={(e) => handleAiGuideChange(e.target.value)}
          placeholder="Instructions for AI to understand and use this theme"
          rows={4}
        />
      </div>

      {/* NEW: Thread Lines v1 */}
      {mode === "thread" && (
        <div className="space-y-2">
          <Label htmlFor="theme-thread-label">Thread Label</Label>
          <Input
            id="theme-thread-label"
            value={threadLabel}
            onChange={(e) => handleThreadLabelChange(e.target.value)}
            placeholder="Label for the thread"
          />
        </div>
      )}

      {onTagsChange && (
        <div className="space-y-2">
          <Label htmlFor="theme-tags">Tags</Label>
          <TagChipInput value={tags || []} onChange={handleTagsChange} />
        </div>
      )}

      {/* Submit/Cancel buttons only for submit pattern */}
      {onSubmit && onClose && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {theme ? "Save Changes" : "Create Theme"}
          </Button>
        </div>
      )}
    </div>
  );

  // Wrap in form if using submit pattern, otherwise just return content
  return onSubmit ? <form onSubmit={handleSubmit}>{content}</form> : content;
}
