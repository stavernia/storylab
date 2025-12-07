import { Chapter } from '../../App';

interface EditorProjectInfoPanelProps {
  chapters: Chapter[];
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export function EditorProjectInfoPanel({ chapters }: EditorProjectInfoPanelProps) {
  const totalWordCount = chapters.reduce(
    (sum, ch) => sum + (ch.wordCount ?? 0),
    0
  );

  const sortedChapters = [...chapters].sort((a, b) => {
    const aOrder = typeof a.sortOrder === 'number' ? a.sortOrder : 0;
    const bOrder = typeof b.sortOrder === 'number' ? b.sortOrder : 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (a.title || '').localeCompare(b.title || '');
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <section>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Manuscript
        </h3>
        <p className="mt-1 text-sm text-gray-900">
          {sortedChapters.length} chapters
        </p>
        <p className="mt-0.5 text-sm text-gray-900">
          {totalWordCount.toLocaleString()} total words
        </p>
      </section>

      {/* Chapter list */}
      <section className="border-t border-gray-200 pt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Chapter progress
        </h3>
        {sortedChapters.length === 0 ? (
          <p className="text-xs text-gray-500">
            No chapters yet. Create chapters to see their progress here.
          </p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-auto pr-1">
            {sortedChapters.map((chapter) => {
              const wc = chapter.wordCount ?? 0;
              const lastEditedLabel = chapter.lastEdited
                ? timeAgo(new Date(chapter.lastEdited))
                : 'Unknown';

              return (
                <li
                  key={chapter.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-100 bg-white px-2 py-1.5"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {chapter.title || 'Untitled chapter'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Last edited: {lastEditedLabel}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-900">
                      {wc.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500">words</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Future: targets / completion */}
      <section className="border-t border-gray-200 pt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Progress
        </h3>
        <div className="mt-2 space-y-2">
          {chapters.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Avg. chapter length</span>
                <span className="text-xs font-semibold text-gray-900">
                  {Math.round(totalWordCount / chapters.length).toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Longest chapter</span>
                <span className="text-xs font-semibold text-gray-900">
                  {Math.max(...chapters.map(ch => ch.wordCount ?? 0)).toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Shortest chapter</span>
                <span className="text-xs font-semibold text-gray-900">
                  {Math.min(...chapters.map(ch => ch.wordCount ?? 0)).toLocaleString()} words
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Chapters started</span>
                <span className="text-xs font-semibold text-gray-900">
                  {chapters.filter(ch => (ch.wordCount ?? 0) > 0).length} of {chapters.length}
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500">
              Create chapters to see progress statistics.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}