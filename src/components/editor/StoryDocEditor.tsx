import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useActiveEditorContext } from './ActiveEditorContext';

// Toolbar component that works with the ActiveEditorContext
export function EditorToolbar() {
  const { getActiveEditor } = useActiveEditorContext();

  const handleBoldClick = () => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.toggleBold();
  };

  const handleItalicClick = () => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.toggleItalic();
  };

  const handleHeadingClick = (level: 1 | 2 | 3) => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.toggleHeading(level);
  };

  const handleUnorderedListClick = () => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.toggleUnorderedList();
  };

  const handleOrderedListClick = () => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.toggleOrderedList();
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          handleHeadingClick(1);
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleHeadingClick(2);
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleHeadingClick(3);
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleBoldClick();
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleItalicClick();
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleUnorderedListClick();
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleOrderedListClick();
        }}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}