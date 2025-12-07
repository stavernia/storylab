import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useEditorContext } from './EditorContext';

// Toolbar component that works with Tiptap Editor via EditorContext
export function EditorToolbar() {
  const { activeEditor: editor } = useEditorContext();

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus
          editor?.chain().focus().toggleHeading({ level: 1 }).run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleBold().run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleItalic().run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleBulletList().run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleOrderedList().run();
        }}
        disabled={!editor}
        className="p-2 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}
