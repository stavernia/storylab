import { useState, useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from 'lucide-react';

interface OutlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function OutlineEditor({ value, onChange, placeholder }: OutlineEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isClient]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  if (!isClient) {
    return (
      <div className="flex-1 overflow-auto bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap">
        <button
          type="button"
          onClick={() => formatBlock('h1')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h2')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatBlock('h3')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 overflow-auto p-6 outline-none prose prose-sm max-w-none"
        style={{
          minHeight: '200px',
        }}
        dangerouslySetInnerHTML={value ? undefined : { __html: '' }}
        suppressContentEditableWarning
      />
      {!value && (
        <div className="absolute top-14 left-6 text-gray-400 pointer-events-none">
          {placeholder || 'Start writing your outline...'}
        </div>
      )}
    </div>
  );
}