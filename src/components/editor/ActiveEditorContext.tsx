import { createContext, useContext, useState, useRef, ReactNode } from 'react';

export type EditorHandle = {
  focus: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  toggleUnorderedList: () => void;
  toggleOrderedList: () => void;
  isBoldActive: () => boolean;
  isItalicActive: () => boolean;
};

export type ActiveEditorContextValue = {
  activeEditorId: string | null;
  setActiveEditorId: (id: string | null) => void;
  registerEditor: (id: string, handle: EditorHandle) => void;
  unregisterEditor: (id: string) => void;
  getActiveEditor: () => EditorHandle | null;
};

const ActiveEditorContext = createContext<ActiveEditorContextValue | null>(null);

export function ActiveEditorProvider({ children }: { children: ReactNode }) {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const registryRef = useRef<Record<string, EditorHandle>>({});

  const registerEditor = (id: string, handle: EditorHandle) => {
    registryRef.current[id] = handle;
  };

  const unregisterEditor = (id: string) => {
    delete registryRef.current[id];
    if (activeEditorId === id) {
      setActiveEditorId(null);
    }
  };

  const getActiveEditor = (): EditorHandle | null => {
    if (!activeEditorId) return null;
    return registryRef.current[activeEditorId] || null;
  };

  return (
    <ActiveEditorContext.Provider
      value={{
        activeEditorId,
        setActiveEditorId,
        registerEditor,
        unregisterEditor,
        getActiveEditor,
      }}
    >
      {children}
    </ActiveEditorContext.Provider>
  );
}

export function useActiveEditorContext(): ActiveEditorContextValue {
  const context = useContext(ActiveEditorContext);
  if (!context) {
    throw new Error('useActiveEditorContext must be used within ActiveEditorProvider');
  }
  return context;
}
