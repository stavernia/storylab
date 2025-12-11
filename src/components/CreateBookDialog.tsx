import { useState } from "react";
import { X } from "lucide-react";
import { PLACEHOLDERS } from "@/constants/ui";
import { Button } from "./ui/button";

type CreateBookDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (title: string, description: string) => Promise<void>;
};

export function CreateBookDialog({
  isOpen,
  onClose,
  onCreateBook,
}: CreateBookDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      await onCreateBook(title.trim(), description.trim());
      // Reset form
      setTitle("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error creating book:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Book
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Add a new book to your library
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Title Field */}
            <div>
              <label
                htmlFor="book-title"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="book-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={PLACEHOLDERS.BOOK_TITLE}
                disabled={isCreating}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#60818E] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                required
              />
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="book-description"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Description{" "}
                <span className="text-xs text-gray-500">(optional)</span>
              </label>
              <textarea
                id="book-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={PLACEHOLDERS.BOOK_DESCRIPTION}
                disabled={isCreating}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#60818E] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              size="sm"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating || !title.trim()}
            >
              {isCreating ? "Creating..." : "Create Book"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
