import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Quote,
  Minus,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
} from "lucide-react";
import { useEditorContext } from "./EditorContext";
import { useEffect, useState } from "react";

// Toolbar component that works with Tiptap Editor via EditorContext
export function EditorToolbar() {
  const { activeEditor: editor } = useEditorContext();
  const [, forceUpdate] = useState({});

  // Force re-render when editor state changes for instant button feedback
  useEffect(() => {
    if (!editor) return;

    const updateHandler = () => forceUpdate({});
    editor.on("update", updateHandler);
    editor.on("selectionUpdate", updateHandler);

    return () => {
      editor.off("update", updateHandler);
      editor.off("selectionUpdate", updateHandler);
    };
  }, [editor]);

  // Helper to get button class with active state
  const getButtonClass = (isActive: boolean) => {
    return `p-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      isActive
        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-white">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setParagraph().run();
        }}
        disabled={!editor}
        className={getButtonClass(editor?.isActive("paragraph") ?? false)}
        title="Normal Text"
      >
        <Type className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleHeading({ level: 1 }).run();
        }}
        disabled={!editor}
        className={getButtonClass(
          editor?.isActive("heading", { level: 1 }) ?? false,
        )}
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
        className={getButtonClass(
          editor?.isActive("heading", { level: 2 }) ?? false,
        )}
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
        className={getButtonClass(
          editor?.isActive("heading", { level: 3 }) ?? false,
        )}
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
        className={getButtonClass(editor?.isActive("bold") ?? false)}
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
        className={getButtonClass(editor?.isActive("italic") ?? false)}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleUnderline().run();
        }}
        disabled={!editor}
        className={getButtonClass(editor?.isActive("underline") ?? false)}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleStrike().run();
        }}
        disabled={!editor}
        className={getButtonClass(editor?.isActive("strike") ?? false)}
        title="Strikethrough"
      >
        <StrikethroughIcon className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleBulletList().run();
        }}
        disabled={!editor}
        className={getButtonClass(editor?.isActive("bulletList") ?? false)}
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
        className={getButtonClass(editor?.isActive("orderedList") ?? false)}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().toggleBlockquote().run();
        }}
        disabled={!editor}
        className={getButtonClass(editor?.isActive("blockquote") ?? false)}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setHorizontalRule().run();
        }}
        disabled={!editor}
        className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Horizontal Rule (Scene Break)"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setTextAlign("left").run();
        }}
        disabled={!editor}
        className={getButtonClass(
          editor?.isActive({ textAlign: "left" }) ?? false,
        )}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setTextAlign("center").run();
        }}
        disabled={!editor}
        className={getButtonClass(
          editor?.isActive({ textAlign: "center" }) ?? false,
        )}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setTextAlign("right").run();
        }}
        disabled={!editor}
        className={getButtonClass(
          editor?.isActive({ textAlign: "right" }) ?? false,
        )}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().setTextAlign("justify").run();
        }}
        disabled={!editor}
        className={getButtonClass(
          editor?.isActive({ textAlign: "justify" }) ?? false,
        )}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().clearNodes().unsetAllMarks().run();
        }}
        disabled={!editor}
        className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().undo().run();
        }}
        disabled={!editor || !editor?.can().undo()}
        className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor?.chain().focus().redo().run();
        }}
        disabled={!editor || !editor?.can().redo()}
        className="p-2 rounded transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
}
