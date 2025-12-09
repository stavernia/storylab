import { FileText, BookOpen, Hash } from 'lucide-react';
import type { Chapter } from '@/App';

type InfoPanelProps = {
  chapter: Chapter;
  chapters: Chapter[];
};

export function InfoPanel({ chapter, chapters }: InfoPanelProps) {
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount ?? 0), 0);
  const averageWords = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;

  if (!chapter) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-gray-500 text-center">No chapter selected</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-gray-900">Document Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Current Chapter Stats */}
        <div>
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Current Chapter
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Words</span>
              <span className="text-sm text-gray-900">{chapter.wordCount ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Characters</span>
              <span className="text-sm text-gray-900">{chapter.content.length}</span>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div>
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Overall Stats
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Chapters</span>
              <span className="text-sm text-gray-900">{chapters.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Words</span>
              <span className="text-sm text-gray-900">{totalWords}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average per Chapter</span>
              <span className="text-sm text-gray-900">{averageWords}</span>
            </div>
          </div>
        </div>

        {/* Chapter Progress */}
        <div>
          <h3 className="text-sm text-gray-600 mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Chapter Progress
          </h3>
          <div className="space-y-2">
            {chapters.map((ch) => {
              const quota = ch.wordQuota || 3000;
              const progress = Math.min(((ch.wordCount ?? 0) / quota) * 100, 100);
              
              return (
                <div key={ch.id} className="bg-gray-50 rounded p-2">
                  <div className="text-sm text-gray-900 truncate mb-1">
                    {ch.title}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {ch.wordCount} / {quota} words
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
