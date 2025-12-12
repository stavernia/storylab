import { useState, useEffect, useRef } from "react";
import type { Book } from "@/types/book";
import { Download, X, Trash2, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { booksApi } from "@/api/books";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PLACEHOLDERS } from "@/constants/ui";

interface BookManageSheetProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (book: Book) => void;
  onDelete: (bookId: string) => void;
  onExport?: (bookId: string) => void;
  onImport?: (bookId: string, file: File) => Promise<void>;
  canExportTemplates?: boolean;
}

export function BookManageSheet({
  book,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onExport,
  onImport,
  canExportTemplates,
}: BookManageSheetProps) {
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(""); // Placeholder for future
  const [description, setDescription] = useState(book.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when book changes
  useEffect(() => {
    setTitle(book.title);
    setDescription(book.description || "");
    setSubtitle("");
  }, [book.id]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Book title is required");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await booksApi.update(book.id, {
        title,
        description,
      });
      onUpdate(updated);
      toast.success("Book updated");
      onClose();
    } catch (error) {
      console.error("Failed to update book:", error);
      toast.error("Failed to update book");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to archive "${book.title}"? This moves the book to Trash for 30 days before permanent deletion.`,
      )
    ) {
      return;
    }

    setIsArchiving(true);
    try {
      await booksApi.archive(book.id);
      onDelete(book.id);
      toast.success("Book archived");
      onClose();
    } catch (error) {
      console.error("Failed to archive book:", error);
      toast.error("Failed to archive book");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(book.id);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a JSON file
      if (!file.name.endsWith(".json")) {
        toast.error("Please select a JSON file");
        return;
      }
      setSelectedFile(file);
      setShowImportConfirm(true);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportConfirm = async () => {
    if (!selectedFile || !onImport) return;

    setIsImporting(true);
    setShowImportConfirm(false);

    try {
      await onImport(book.id, selectedFile);
      toast.success("Book imported successfully");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to import book: ${message}`);
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setSelectedFile(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-sm text-gray-900">Manage Book</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="book-title">Title</Label>
            <Input
              id="book-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={PLACEHOLDERS.BOOK_TITLE}
            />
          </div>

          {/* Subtitle (placeholder) */}
          <div className="space-y-2">
            <Label htmlFor="book-subtitle">Subtitle</Label>
            <Input
              id="book-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={PLACEHOLDERS.BOOK_SUBTITLE}
              disabled
              className="opacity-50"
            />
            <p className="text-xs text-gray-500">Coming soon</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="book-description">Description</Label>
            <Textarea
              id="book-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={PLACEHOLDERS.BOOK_DESCRIPTION}
              rows={6}
            />
          </div>

          {/* Future placeholders */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="text-xs text-gray-500">
              <p className="mb-2">Future features:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Cover image</li>
                <li>Genre tags</li>
                <li>Target word count</li>
                <li>Sharing & collaboration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-3 bg-gray-50">
          {canExportTemplates && (
            <>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleExport}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isSaving || isArchiving || isImporting}
                >
                  <Upload className="w-4 h-4" />
                  Export as template
                </Button>
                <Button
                  onClick={handleImportClick}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isSaving || isArchiving || isImporting}
                >
                  <Download className="w-4 h-4" />
                  Import from template
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || isArchiving}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSaving || isArchiving}
            >
              Cancel
            </Button>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={isSaving || isArchiving}
                className="w-full flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isArchiving ? "Archiving..." : "Archive Book"}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-left">
              Moves this book to Trash. Archived books are kept for 30 days
              before permanent deletion.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      {showImportConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60]"
            onClick={handleImportCancel}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[70] p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Confirm Import
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure? All current book data (chapters, themes, characters,
              outline data, corkboard, grid cells, tags) will be overwritten.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              The book title and description will remain unchanged.
            </p>
            <p className="text-xs text-gray-500 mb-6">
              File: <span className="font-mono">{selectedFile?.name}</span>
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleImportConfirm}
                variant="default"
                className="flex-1"
              >
                Import
              </Button>
              <Button
                onClick={handleImportCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
