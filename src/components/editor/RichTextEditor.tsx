import { useRef, useEffect, useCallback } from "react";
import {
  useActiveEditorContext,
  type EditorHandle,
} from "./ActiveEditorContext";
import type { Chapter } from "@/App";

export type RichTextEditorProps = {
  editorId: string;
  value: string;
  onChange: (html: string) => void;
  chapter?: Chapter;
  readOnly?: boolean;
  onFocus?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export function RichTextEditor({
  editorId,
  value,
  onChange,
  readOnly = false,
  onFocus,
  className = "",
  style = {},
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const { registerEditor, unregisterEditor, setActiveEditorId } =
    useActiveEditorContext();

  // Update editor content when value changes from outside
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Save selection whenever it changes
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0);
    }
  }, []);

  // Restore selection
  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current || readOnly) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    saveSelection();
  }, [onChange, readOnly, saveSelection]);

  // Register this editor instance with the context
  useEffect(() => {
    const handle: EditorHandle = {
      focus: () => {
        editorRef.current?.focus();
        restoreSelection();
      },
      toggleBold: () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        restoreSelection();
        document.execCommand("bold", false);
        handleInput();
      },
      toggleItalic: () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        restoreSelection();
        document.execCommand("italic", false);
        handleInput();
      },
      toggleHeading: (level: 1 | 2 | 3) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        restoreSelection();
        document.execCommand("formatBlock", false, `h${level}`);
        handleInput();
      },
      toggleUnorderedList: () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        restoreSelection();
        document.execCommand("insertUnorderedList", false);
        handleInput();
      },
      toggleOrderedList: () => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        restoreSelection();
        document.execCommand("insertOrderedList", false);
        handleInput();
      },
      isBoldActive: () => {
        return document.queryCommandState("bold");
      },
      isItalicActive: () => {
        return document.queryCommandState("italic");
      },
    };

    registerEditor(editorId, handle);

    return () => {
      unregisterEditor(editorId);
    };
  }, [
    editorId,
    registerEditor,
    unregisterEditor,
    handleInput,
    restoreSelection,
  ]);

  const handleFocus = () => {
    // Set this editor as the active one
    setActiveEditorId(editorId);

    // Save the selection
    saveSelection();

    // Call the optional onFocus callback
    if (onFocus) {
      onFocus();
    }
  };

  const handleSelectionChange = () => {
    // Only save selection if this editor is focused
    if (document.activeElement === editorRef.current) {
      saveSelection();
    }
  };

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable={!readOnly}
      onInput={handleInput}
      onFocus={handleFocus}
      onMouseUp={saveSelection}
      onKeyUp={saveSelection}
      className={`outline-none prose prose-sm max-w-none text-gray-900 ${
        readOnly ? "cursor-default select-text" : ""
      } ${className}`}
      style={{
        minHeight: "500px",
        lineHeight: "1.75",
        ...style,
      }}
      suppressContentEditableWarning
    />
  );
}
