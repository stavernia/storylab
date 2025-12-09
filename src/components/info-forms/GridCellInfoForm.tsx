import { useState, useEffect } from 'react';
import type { ThreadRole } from '@/App';
import type { GridCell } from '@/lib/grid';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { TagChipInput } from '@/components/tags/TagChipInput';
import { Tag } from '@/services/tag';

// NEW: Thread Lines v1 - Thread roles
const threadRoles: ThreadRole[] = ['none', 'seed', 'buildup', 'event', 'aftermath'];

interface GridCellInfoFormProps {
  cellData: GridCell;
  chapterTitle: string;
  themeName: string;
  themeColor: string;
  themeMode?: 'presence' | 'heatmap' | 'thread';
  onChange: (note: string) => void;
  onPresenceChange?: (presence: boolean) => void;
  onIntensityChange?: (intensity: number) => void;
  onThreadRoleChange?: (role: ThreadRole) => void;
  threadRole?: ThreadRole;
  tags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
}

export function GridCellInfoForm({
  cellData,
  chapterTitle,
  themeName,
  themeColor,
  themeMode = 'presence',
  onChange,
  onPresenceChange,
  onIntensityChange,
  onThreadRoleChange,
  threadRole,
  tags,
  onTagsChange,
}: GridCellInfoFormProps) {
  const [note, setNote] = useState(cellData.note || "");
  const [presence, setPresence] = useState(cellData.presence || false);
  const [intensity, setIntensity] = useState(cellData.intensity || 0);

  // Phase 1.5: Update form when cellData changes (e.g., clicking different cell)
  useEffect(() => {
    setNote(cellData.note || "");
    setPresence(cellData.presence || false);
    setIntensity(cellData.intensity || 0);
  }, [cellData.chapterId, cellData.themeId]); // Update when cell identity changes

  useEffect(() => {
    onChange(note);
  }, [note, onChange]);

  const handlePresenceToggle = () => {
    const newPresence = !presence;
    setPresence(newPresence);
    if (onPresenceChange) {
      onPresenceChange(newPresence);
    }
  };

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    if (onIntensityChange) {
      onIntensityChange(newIntensity);
    }
  };

  const handleThreadRoleChange = (role: ThreadRole) => {
    if (onThreadRoleChange) {
      onThreadRoleChange(role);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Chapter</span>
          <span className="text-sm text-gray-900">{chapterTitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Theme</span>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: themeColor }}
            />
            <span className="text-sm text-gray-900">{themeName}</span>
          </div>
        </div>
      </div>

      {/* Grid 2.0: Presence/Intensity Controls */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-sm text-gray-700">Tracking</h3>
        
        {themeMode === 'presence' ? (
          <div className="space-y-2">
            <Label>Presence in Chapter</Label>
            <button
              type="button"
              onClick={handlePresenceToggle}
              className={`w-full px-4 py-2 text-sm rounded-md border transition-colors ${
                presence
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {presence ? '✓ Present in this chapter' : '✗ Not present in this chapter'}
            </button>
          </div>
        ) : themeMode === 'heatmap' ? (
          <div className="space-y-3">
            <Label>Intensity Level (0–3)</Label>
            <div className="flex items-center gap-4">
              <Slider
                min={0}
                max={3}
                step={1}
                value={[intensity]}
                onValueChange={handleIntensityChange}
                className="flex-1"
              />
              <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-200 bg-gray-50">
                <span className="text-lg text-gray-900">{intensity}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>None</span>
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        ) : themeMode === 'thread' ? (
          <section className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Thread role in this chapter
            </p>
            <div className="flex flex-wrap gap-2">
              {threadRoles.map((role) => {
                const isActive = (threadRole ?? 'none') === role;
                const label =
                  role === 'none'
                    ? 'None'
                    : role === 'seed'
                    ? 'Seed'
                    : role === 'buildup'
                    ? 'Buildup'
                    : role === 'event'
                    ? 'Event'
                    : 'Aftermath';

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleThreadRoleChange(role)}
                    className={`px-2 py-0.5 rounded-full border text-[11px] ${
                      isActive
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 bg-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Use Seed/Buildup/Event/Aftermath to mark how this chapter participates in the thread.
              Logic rules (e.g., ensuring the seed comes before the event) will be added in a later version.
            </p>
          </section>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cell-notes">Notes</Label>
        <Textarea
          id="cell-notes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add notes about how this theme appears in this chapter..."
          rows={8}
          autoFocus
        />
      </div>

      {onTagsChange && (
        <div className="space-y-2">
          <Label htmlFor="cell-tags">Tags</Label>
          <TagChipInput
            value={tags || []}
            onChange={onTagsChange}
            placeholder="Add tags to categorize this theme..."
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Track how themes, motifs, and narrative elements appear throughout your chapters.
      </p>
    </div>
  );
}