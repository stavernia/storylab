import { createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";

type EditorCtx = {
  activeEditor: Editor | null;
  setActiveEditor: (editor: Editor | null) => void;
};

export const EditorContext = createContext<EditorCtx>({
  activeEditor: null,
  setActiveEditor: () => {},
});

export const useEditorContext = () => useContext(EditorContext);
