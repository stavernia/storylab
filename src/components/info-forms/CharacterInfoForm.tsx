import { useState, useEffect } from 'react';
import { Character } from '../../App';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface CharacterInfoFormProps {
  character?: Character;
  onSubmit: (values: Partial<Character>) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
  { value: '#10B981', label: 'Green' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#14B8A6', label: 'Teal' },
];

export function CharacterInfoForm({ character, onSubmit, onClose }: CharacterInfoFormProps) {
  const [name, setName] = useState(character?.name || '');
  const [color, setColor] = useState(character?.color || '#3B82F6');
  const [role, setRole] = useState(character?.role || '');
  const [notes, setNotes] = useState(character?.notes || '');

  // Phase 1.5: Update form when character prop changes
  useEffect(() => {
    if (character) {
      setName(character.name || '');
      setColor(character.color || '#3B82F6');
      setRole(character.role || '');
      setNotes(character.notes || '');
    }
  }, [character?.id]); // Only re-run when character ID changes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || 'Unnamed Character',
      color,
      role,
      notes,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="char-name">Name *</Label>
        <Input
          id="char-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          autoFocus
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="char-color">Color</Label>
        <Select value={color} onValueChange={setColor}>
          <SelectTrigger id="char-color">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent position="popper" className="z-[9999]" sideOffset={5}>
            {COLOR_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: option.value }}
                  />
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label htmlFor="char-role">Role</Label>
        <Input
          id="char-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Protagonist, Antagonist, Mentor"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="char-notes">Notes</Label>
        <Textarea
          id="char-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Character background, traits, arc..."
          rows={6}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {character ? 'Save Changes' : 'Create Character'}
        </Button>
      </div>
    </form>
  );
}