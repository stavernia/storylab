import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import { useEditorContext } from "./EditorContext";
import { PLACEHOLDERS } from "@/constants/ui";

export type TiptapChapterEditorProps = {
  chapterId: string;
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
};

export function TiptapChapterEditor({
  chapterId,
  value,
  onChange,
  readOnly = false,
}: TiptapChapterEditorProps) {
  const { setActiveEditor } = useEditorContext();
  const [isFocused, setIsFocused] = useState(false);
  const activeChapterRef = useRef(chapterId);
  const isHydratingRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: PLACEHOLDERS.CHAPTER_CONTENT,
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (isHydratingRef.current) return;

      const html = editor.getHTML();

      if (activeChapterRef.current !== chapterId) return;

      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "outline-none tiptap-editor",
      },
    },
  });

  // Register this editor on focus
  useEffect(() => {
    if (editor) {
      const handleFocus = () => {
        setActiveEditor(editor);
        setIsFocused(true);
      };
      const handleBlur = () => {
        setIsFocused(false);
      };

      editor.on("focus", handleFocus);
      editor.on("blur", handleBlur);

      return () => {
        editor.off("focus", handleFocus);
        editor.off("blur", handleBlur);
      };
    }
  }, [editor, setActiveEditor]);

  // Update editor content when value changes from outside
  // BUT ONLY if editor is not focused (prevents reverting while typing)
  useEffect(() => {
    if (editor && !isFocused && value !== editor.getHTML()) {
      isHydratingRef.current = true;
      editor.commands.setContent(value, false);
      isHydratingRef.current = false;
    }
  }, [value, editor, isFocused]);

  useEffect(() => {
    if (!editor) return;

    activeChapterRef.current = chapterId;
    isHydratingRef.current = true;
    editor.commands.setContent(value, false);
    isHydratingRef.current = false;
    editor.commands.focus();
  }, [chapterId, editor, value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  return (
    <div
      className={`tiptap-wrapper rounded-lg transition-all hover:ring-1 hover:ring-blue-100 ${isFocused ? "ring-2 ring-blue-200 ring-offset-2" : ""}`}
      style={{ minHeight: "120px" }}
      onClick={() => editor?.commands.focus()}
    >
      <EditorContent editor={editor} style={{ minHeight: "120px" }} />
    </div>
  );
}
