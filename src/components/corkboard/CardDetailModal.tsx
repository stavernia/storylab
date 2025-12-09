import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CorkboardCard } from "@/api/corkboard";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CardDetailModalProps {
  card: CorkboardCard | null;
  chapters: Array<{ id: string; title: string }>;
  onClose: () => void;
  onSave: (updates: Partial<CorkboardCard>) => void;
}

export function CardDetailModal({ card, chapters, onClose, onSave }: CardDetailModalProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [chapterId, setChapterId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'idea' | 'draft' | 'done' | undefined>(undefined);
  const [color, setColor] = useState<'blue' | 'amber' | 'gray' | 'green' | 'purple' | 'red' | undefined>(undefined);
  const [wordEstimate, setWordEstimate] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setSummary(card.summary || '');
      setChapterId(card.chapterId);
      setStatus(card.status);
      setColor(card.color);
      setWordEstimate(card.wordEstimate);
    }
  }, [card]);

  const handleSave = () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    onSave({
      title: title.trim(),
      summary: summary.trim() || undefined,
      chapterId: chapterId || undefined,
      status,
      color,
      wordEstimate: wordEstimate && wordEstimate > 0 ? wordEstimate : undefined,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!card) return null;

  return (
    <Dialog open={!!card} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="card-title">Title *</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-summary">Summary</Label>
            <Textarea
              id="card-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of this scene or beat"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card-chapter">Chapter</Label>
              <Select
                value={chapterId || 'unassigned'}
                onValueChange={(val) => setChapterId(val === 'unassigned' ? undefined : val)}
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

            <div className="space-y-2">
              <Label htmlFor="card-status">Status</Label>
              <Select
                value={status || 'none'}
                onValueChange={(val) => {
                  const newStatus: CorkboardCard["status"] | undefined = val === 'none' ? undefined : val;
                  setStatus(newStatus);
                }}
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
                onValueChange={(val) => {
                  const newColor: CorkboardCard["color"] | undefined = val === 'none' ? undefined : val;
                  setColor(newColor);
                }}
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
                onChange={(e) => setWordEstimate(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save <span className="ml-1 text-xs text-gray-400">(Cmd/Ctrl+S)</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
