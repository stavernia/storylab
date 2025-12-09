import { Chapter } from '@/App';
import { useMemo, useState } from 'react';

interface ChapterContentPanelProps {
  chapter: Chapter;
}

type ChapterContentTab = 'outline' | 'manuscript';

export function ChapterContentPanel({ chapter }: ChapterContentPanelProps) {
  const [tab, setTab] = useState<ChapterContentTab>('outline');

  const outlineHtml = chapter.outline || '';
  const manuscriptHtml = chapter.content || '';

  const hasOutline = !!outlineHtml;
  const hasManuscript = !!manuscriptHtml;

  const activeHtml = useMemo(() => {
    if (tab === 'outline') return outlineHtml;
    return manuscriptHtml;
  }, [tab, outlineHtml, manuscriptHtml]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTab('outline')}
          className={`px-3 py-1.5 text-xs rounded-full border ${
            tab === 'outline'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          Outline
        </button>
        <button
          type="button"
          onClick={() => setTab('manuscript')}
          className={`px-3 py-1.5 text-xs rounded-full border ${
            tab === 'manuscript'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-700 border-gray-200'
          }`}
        >
          Manuscript
        </button>
      </div>

      {!activeHtml ? (
        <p className="text-sm text-gray-500">
          {tab === 'outline'
            ? 'No outline content for this chapter yet.'
            : 'No manuscript content for this chapter yet.'}
        </p>
      ) : (
        <div className="flex-1 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-sm prose prose-sm max-w-none">
          {/* Read-only; content is already HTML from rich text editor */}
          <div
            dangerouslySetInnerHTML={{ __html: activeHtml }}
          />
        </div>
      )}
    </div>
  );
}
