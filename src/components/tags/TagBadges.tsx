import { Tag, displayTagName } from '@/services/tag';
import { theme } from '@/theme';

interface TagBadgesProps {
  tags: Tag[];
  max?: number;
  size?: 'sm' | 'xs';
}

const TAG_COLORS: Record<string, string> = {
  amber: '#f59e0b',
  blue: '#3b82f6',
  gray: '#6b7280',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
};

export function TagBadges({ tags, max = 3, size = 'xs' }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, max);
  const remaining = tags.length - max;

  const getTagColor = (color?: string) => {
    if (!color) return '#6b7280';
    return TAG_COLORS[color] || color;
  };

  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {displayTags.map(tag => (
        <div
          key={tag.id}
          className={`inline-flex items-center gap-1 bg-gray-100 rounded ${sizeClasses}`}
          style={{ borderRadius: `${theme.radii.sm}px` }}
          title={displayTagName(tag.name)}
        >
          <div
            className={size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2'}
            style={{
              backgroundColor: getTagColor(tag.color),
              borderRadius: '50%',
            }}
          />
          <span className="text-gray-700 truncate max-w-[60px]">
            {displayTagName(tag.name)}
          </span>
        </div>
      ))}
      {remaining > 0 && (
        <span
          className={`text-gray-500 ${sizeClasses}`}
          title={`${remaining} more tag${remaining === 1 ? '' : 's'}`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
