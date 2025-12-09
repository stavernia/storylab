import { useState } from 'react';
import type { Book } from '@/types/book';
import { LayoutGrid, List, Plus, Calendar, FolderOpen, Settings, Download } from 'lucide-react';
import { Button } from './ui/button';
import { BookManageSheet } from './BookManageSheet';
import { CreateBookDialog } from './CreateBookDialog';

interface BooksViewProps {
  books: Book[];
  currentBookId: string | null;
  onSelectBook: (bookId: string) => void;
  onCreateBook: (title: string, description: string) => Promise<void>;
  onUpdateBook?: (book: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onExportBook?: (bookId: string) => void;
  canExportTemplates?: boolean;
}

type ViewMode = 'cards' | 'table';

export function BooksView({ books, currentBookId, onSelectBook, onCreateBook, onUpdateBook, onDeleteBook, onExportBook, canExportTemplates }: BooksViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [manageBookId, setManageBookId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const manageBook = books.find(b => b.id === manageBookId);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleOpenBook = (bookId: string) => {
    onSelectBook(bookId);
  };

  const handleManageBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setManageBookId(bookId);
  };

  const handleCloseManage = () => {
    setManageBookId(null);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    if (onUpdateBook) {
      onUpdateBook(updatedBook);
    }
  };

  const handleDeleteBook = (bookId: string) => {
    if (onDeleteBook) {
      onDeleteBook(bookId);
    }
  };

  const handleExportBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExportBook) {
      onExportBook(bookId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h1 className="text-lg text-gray-900">Your Books</h1>
          <p className="text-xs text-gray-500 mt-1">{books.length} {books.length === 1 ? 'book' : 'books'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-l-lg text-xs transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-r-lg text-xs transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Create book button */}
          <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Book
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div data-tour-id="libraryBooks" className="flex-1 overflow-y-auto p-6">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-gray-400 mb-4">
              <LayoutGrid className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-lg text-gray-900 mb-2">No books yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Create your first book to start writing your story.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Book
            </Button>
          </div>
        ) : viewMode === 'cards' ? (
          // Cards View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => {
              const isCurrentBook = book.id === currentBookId;
              return (
                <div
                  key={book.id}
                  className={`group relative p-5 rounded-lg border-2 text-left transition-all flex flex-col ${
                    isCurrentBook
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isCurrentBook && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-[10px] text-white">
                        Current
                      </span>
                    </div>
                  )}
                  
                  {/* Top section: Title and subtitle */}
                  <div className="mb-auto">
                    <h3 className="text-base text-gray-900 mb-1 pr-16">
                      {book.title}
                    </h3>
                    <div className="min-h-[2rem]">
                      {book.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom section: Date and actions */}
                  <div className="mt-4">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>Updated {formatDate(book.updatedAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleOpenBook(book.id)}
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-2 bg-[rgb(96,129,142)]"
                      >
                        <FolderOpen className="w-3 h-3" />
                        Open
                      </Button>
                      {canExportTemplates && (
                        <Button
                          onClick={(e) => handleExportBook(book.id, e)}
                          variant="secondary"
                          size="sm"
                          className="flex items-center justify-center gap-2"
                        >
                          <Download className="w-3 h-3" />
                          Export JSON
                        </Button>
                      )}
                      <Button
                        onClick={(e) => handleManageBook(book.id, e)}
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center gap-2"
                      >
                        <Settings className="w-3 h-3" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Table View
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  {canExportTemplates && (
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {books.map((book) => {
                  const isCurrentBook = book.id === currentBookId;
                  return (
                    <tr
                      key={book.id}
                      onClick={() => handleOpenBook(book.id)}
                      className={`cursor-pointer transition-colors ${
                        isCurrentBook
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {book.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {book.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(book.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isCurrentBook && (
                          <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                            Current
                          </span>
                        )}
                      </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Manage Sheet */}
      {manageBook && (
        <BookManageSheet
          book={manageBook}
          isOpen={true}
          onClose={handleCloseManage}
          onUpdate={handleUpdateBook}
          onDelete={handleDeleteBook}
          onExport={onExportBook}
          canExportTemplates={canExportTemplates}
        />
      )}

      {/* Create Book Dialog */}
      <CreateBookDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateBook={onCreateBook}
      />
    </div>
  );
}
