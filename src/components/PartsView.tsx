import { useState } from 'react';
import { Plus, GripVertical, Edit2, Trash2, Check, X, Library } from 'lucide-react';
import type { Part } from '@/App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';

type PartsViewProps = {
  parts: Part[];
  onUpdate: (parts: Part[]) => void;
  onAdd: (data: { title: string; notes?: string }) => Promise<Part>;
  onUpdatePart: (id: string, data: Partial<Pick<Part, 'title' | 'notes'>>) => Promise<Part>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (parts: Part[]) => Promise<void>;
  // NEW: Manager Consistency - Lifted state for Context Bar controls
  showAddDialog?: boolean;
  setShowAddDialog?: (show: boolean) => void;
};

export function PartsView({
  parts,
  onUpdate,
  onAdd,
  onUpdatePart,
  onDelete,
  onReorder,
  showAddDialog,
  setShowAddDialog
}: PartsViewProps) {
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPartTitle, setNewPartTitle] = useState('');
  const [newPartNotes, setNewPartNotes] = useState('');
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editPartTitle, setEditPartTitle] = useState('');
  const [editPartNotes, setEditPartNotes] = useState('');
  const [draggingPartId, setDraggingPartId] = useState<string | null>(null);

  // Sort parts by sortOrder
  const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddPart = async () => {
    if (newPartTitle.trim()) {
      await onAdd({ title: newPartTitle.trim(), notes: newPartNotes.trim() || undefined });
      setIsAddingPart(false);
      setNewPartTitle('');
      setNewPartNotes('');
    }
  };

  const handleStartEdit = (part: Part) => {
    setEditingPartId(part.id);
    setEditPartTitle(part.title);
    setEditPartNotes(part.notes || '');
  };

  const handleSaveEdit = async () => {
    if (editingPartId && editPartTitle.trim()) {
      await onUpdatePart(editingPartId, {
        title: editPartTitle.trim(),
        notes: editPartNotes.trim() || undefined
      });
      setEditingPartId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete part "${title}"? Chapters in this part will be moved to "Ungrouped".`)) {
      await onDelete(id);
    }
  };

  const handleDragStart = (partId: string) => {
    setDraggingPartId(partId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetPartId: string) => {
    if (!draggingPartId || draggingPartId === targetPartId) {
      setDraggingPartId(null);
      return;
    }

    const sourceIndex = sortedParts.findIndex(p => p.id === draggingPartId);
    const targetIndex = sortedParts.findIndex(p => p.id === targetPartId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingPartId(null);
      return;
    }

    const reordered = [...sortedParts];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update sortOrder
    const updated = reordered.map((part, index) => ({
      ...part,
      sortOrder: index
    }));

    onUpdate(updated);
    await onReorder(updated);
    setDraggingPartId(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* List View - Consistent with other managers */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
            <tr>
              <th className="w-12"></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedParts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <Library className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No parts yet. Add your first part to organize your manuscript.</p>
                </td>
              </tr>
            ) : (
              sortedParts.map((part) => (
                <tr
                  key={part.id}
                  draggable
                  onDragStart={() => handleDragStart(part.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(part.id)}
                  className={`hover:bg-gray-50 transition-colors group h-[52px] ${
                    draggingPartId === part.id ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  </td>
                  <td className="px-4 py-3">
                    {editingPartId === part.id ? (
                      <Input
                        value={editPartTitle}
                        onChange={(e) => setEditPartTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingPartId(null);
                        }}
                        className="text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{part.title}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingPartId === part.id ? (
                      <Textarea
                        value={editPartNotes}
                        onChange={(e) => setEditPartNotes(e.target.value)}
                        rows={2}
                        placeholder="Add notes about this part..."
                        className="text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-600 truncate max-w-md">
                        {part.notes || '—'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {editingPartId === part.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                          <button
                            onClick={() => setEditingPartId(null)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(part)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Edit part"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id, part.title)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Delete part"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Part Dialog */}
      <Dialog open={showAddDialog || isAddingPart} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPart(false);
          if (setShowAddDialog) setShowAddDialog(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Part</DialogTitle>
            <DialogDescription>
              Create a new part to organize chapters into larger sections.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="partTitle">Title</Label>
              <Input
                id="partTitle"
                value={newPartTitle}
                onChange={(e) => setNewPartTitle(e.target.value)}
                placeholder="e.g., Part I: The Beginning"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPart();
                }}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="partNotes">Notes (optional)</Label>
              <Textarea
                id="partNotes"
                value={newPartNotes}
                onChange={(e) => setNewPartNotes(e.target.value)}
                placeholder="Add notes about this part..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingPart(false);
                setNewPartTitle('');
                setNewPartNotes('');
                if (setShowAddDialog) setShowAddDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPart}>
              Add Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}