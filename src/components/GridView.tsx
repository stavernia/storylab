import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Check, X, Eye, EyeOff, Settings, Info, AlignJustify, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import type { Theme, Chapter, ThreadRole, Character, Part } from '@/App';
import { Tag, tagService } from '@/services/tag';
import { useInspector } from '@/contexts/InspectorContext'; // NEW: Inspector v2
import { useChapterNumbering } from '@/contexts/ChapterNumberingContext';
import { ThemeInfoForm } from './info-forms/ThemeInfoForm';
import { ThemeData } from '@/services/theme';
import { GridCellInfoForm } from './info-forms/GridCellInfoForm';
import { ChapterContentPanel } from './info-panels/ChapterContentPanel';
import { useTagFilter } from '@/contexts/TagFilterContext';
import { useEntityTags } from '@/hooks/useEntityTags';
import { toast } from 'sonner';
import { getOrderedChapters } from '@/utils/chapter-ordering';
import { makeGridKey, type GridCell, type GridKey } from '@/lib/grid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';

// NEW: Thread Lines v1 - Helper functions
const threadRoles: ThreadRole[] = ['none', 'seed', 'buildup', 'event', 'aftermath'];

// Phase 3: Grid Cleanup - Column size helper
type GridColumnSize = 'minimal' | 'compact' | 'full';

// Phase 3: Grid Cleanup - Column width presets (clearly distinct)
const COLUMN_WIDTH_CLASSES: Record<GridColumnSize, string> = {
  minimal: 'min-w-[60px] max-w-[80px]',     // Narrowest - just enough for checkbox
  compact: 'min-w-[160px] max-w-[200px]',   // Current-ish
  full: 'min-w-[220px] max-w-[260px]',      // Widest - comfortable reading
};

function getColumnClasses(columnSize: GridColumnSize = 'compact') {
  const widthClass = COLUMN_WIDTH_CLASSES[columnSize];
  
  switch (columnSize) {
    case 'minimal':
      return `${widthClass} px-1`; // minimal padding
    case 'compact':
      return `${widthClass} px-2`; // modest padding
    case 'full':
    default:
      return `${widthClass} px-3`; // generous padding
  }
}

function nextThreadRole(current?: ThreadRole): ThreadRole {
  const role = current ?? 'none';
  const index = threadRoles.indexOf(role);
  const nextIndex = (index + 1) % threadRoles.length;
  return threadRoles[nextIndex];
}

function getThreadBounds(
  theme: Theme,
  chapters: Chapter[],
  getCellForChapter: (chapterId: string) => GridCell | undefined
) {
  const indices: number[] = [];

  chapters.forEach((ch, index) => {
    const cell = getCellForChapter(ch.id);
    const role = cell?.threadRole ?? 'none';
    if (role !== 'none') {
      indices.push(index);
    }
  });

  if (indices.length === 0) {
    return { firstIndex: -1, lastIndex: -1, eventIndex: -1 };
  }

  const firstIndex = indices[0];
  const lastIndex = indices[indices.length - 1];

  const eventIndex = chapters.findIndex((ch) => {
    const cell = getCellForChapter(ch.id);
    return (cell?.threadRole ?? 'none') === 'event';
  });

  return { firstIndex, lastIndex, eventIndex };
}

function getThreadLineColorClass(theme: Theme): string {
  const color = theme.color || 'purple';
  
  switch (color) {
    case 'red':
      return 'bg-red-300';
    case 'orange':
      return 'bg-orange-300';
    case 'amber':
      return 'bg-amber-300';
    case 'yellow':
      return 'bg-yellow-300';
    case 'lime':
      return 'bg-lime-300';
    case 'green':
      return 'bg-green-300';
    case 'emerald':
      return 'bg-emerald-300';
    case 'teal':
      return 'bg-teal-300';
    case 'cyan':
      return 'bg-cyan-300';
    case 'sky':
      return 'bg-sky-300';
    case 'blue':
      return 'bg-blue-300';
    case 'indigo':
      return 'bg-indigo-300';
    case 'violet':
      return 'bg-violet-300';
    case 'purple':
      return 'bg-purple-300';
    case 'fuchsia':
      return 'bg-fuchsia-300';
    case 'pink':
      return 'bg-pink-300';
    case 'rose':
      return 'bg-rose-300';
    case 'gray':
    case 'grey':
      return 'bg-gray-300';
    default:
      return 'bg-purple-300';
  }
}

function getThreadCellTintClass(theme: Theme): string {
  const color = theme.color || 'purple';
  
  switch (color) {
    case 'red':
      return 'bg-red-50';
    case 'orange':
      return 'bg-orange-50';
    case 'amber':
      return 'bg-amber-50';
    case 'yellow':
      return 'bg-yellow-50';
    case 'lime':
      return 'bg-lime-50';
    case 'green':
      return 'bg-green-50';
    case 'emerald':
      return 'bg-emerald-50';
    case 'teal':
      return 'bg-teal-50';
    case 'cyan':
      return 'bg-cyan-50';
    case 'sky':
      return 'bg-sky-50';
    case 'blue':
      return 'bg-blue-50';
    case 'indigo':
      return 'bg-indigo-50';
    case 'violet':
      return 'bg-violet-50';
    case 'purple':
      return 'bg-purple-50';
    case 'fuchsia':
      return 'bg-fuchsia-50';
    case 'pink':
      return 'bg-pink-50';
    case 'rose':
      return 'bg-rose-50';
    case 'gray':
    case 'grey':
      return 'bg-gray-50';
    default:
      return 'bg-purple-50';
  }
}

function renderThreadMiniStrip(
  theme: Theme,
  chapters: Chapter[],
  getCellForChapter: (chapterId: string) => GridCell | undefined
) {
  const eventIndex = chapters.findIndex(ch => {
    const cell = getCellForChapter(ch.id);
    return (cell?.threadRole ?? 'none') === 'event';
  });

  return (
    <div className="mt-1 flex items-center gap-[2px]">
      {chapters.map((chapter, index) => {
        const cell = getCellForChapter(chapter.id);
        const role: ThreadRole = cell?.threadRole ?? 'none';

        if (role === 'none') {
          return (
            <span
              key={chapter.id}
              className="h-1 w-1 rounded-full bg-gray-100"
            />
          );
        }

        // dot size
        let sizeClass = 'h-1.5 w-1.5';
        if (role === 'event') sizeClass = 'h-2 w-2';

        // dot color by role
        let colorClass = 'bg-purple-400';
        if (role === 'seed') colorClass = 'bg-purple-300';
        if (role === 'event') colorClass = 'bg-purple-600';
        if (role === 'aftermath') colorClass = 'bg-purple-400';

        // optional "thickness" near event (ring)
        let ringClass = '';
        if (eventIndex >= 0) {
          const distance = Math.abs(index - eventIndex);
          if (distance === 0) {
            ringClass = 'ring-2 ring-purple-500';
          } else if (distance === 1) {
            ringClass = 'ring-1 ring-purple-300';
          }
        }

        return (
          <span
            key={chapter.id}
            className={`${sizeClass} rounded-full ${colorClass} ${ringClass}`}
          />
        );
      })}
    </div>
  );
}

type GridViewProps = {
  bookId: string;
  chapters: Chapter[];
  themes: Theme[];
  gridCellsByKey: Record<GridKey, GridCell>;
  characters: Character[];
  updateGridCell: (
    chapterId: string,
    themeId: string,
    changes: Partial<Pick<GridCell, "note" | "presence" | "intensity" | "threadRole">>,
  ) => void;
  addTheme: (name?: string) => Promise<Theme>;
  updateTheme: (id: string, name: string) => void;
  updateThemeDetails: (id: string, values: Partial<Theme>) => void;
  deleteTheme: (id: string) => void;
  addChapter: (title?: string) => Promise<string>;
  deleteChapter: (id: string) => void;
  updateChapterTitle: (id: string, title: string) => void;
  parts?: Part[];
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  showAddThemeDialog?: boolean;
  setShowAddThemeDialog?: (show: boolean) => void;
  showAddChapterDialog?: boolean;
  setShowAddChapterDialog?: (show: boolean) => void;
  // Phase 3: Grid Cleanup - Column Size Control
  columnSize?: 'minimal' | 'compact' | 'full';
  setColumnSize?: (size: 'minimal' | 'compact' | 'full') => void;
};

export function GridView({
  bookId,
  chapters,
  themes,
  gridCellsByKey,
  characters,
  updateGridCell,
  addTheme,
  updateTheme,
  updateThemeDetails,
  deleteTheme,
  addChapter,
  deleteChapter,
  updateChapterTitle,
  parts,
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  showAddThemeDialog,
  setShowAddThemeDialog,
  showAddChapterDialog,
  setShowAddChapterDialog,
  // Phase 3: Grid Cleanup - Column Size Control
  columnSize,
  setColumnSize
}: GridViewProps) {
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editThemeName, setEditThemeName] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [focusedCell, setFocusedCell] = useState<{ chapterId: string; themeId: string } | null>(null);
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [selectedGridCell, setSelectedGridCell] = useState<{ chapterId: string; themeId: string } | null>(null);
  const [themeFormValues, setThemeFormValues] = useState<Partial<ThemeData>>({});
  const [cellNote, setCellNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [themeTags, setThemeTags] = useState<Tag[]>([]);
  const [cellTags, setCellTags] = useState<Tag[]>([]);

  // NEW: Chapter content preview
  const [selectedChapterForContent, setSelectedChapterForContent] = useState<Chapter | null>(null);

  // NEW: Grid Enhancement Pack - Grouping, Visibility, and Dragging
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    characters: false,
    themes: false,
    custom: false,
  });

  const [hiddenThemeIds, setHiddenThemeIds] = useState<string[]>([]);

  const [draggingThemeId, setDraggingThemeId] = useState<string | null>(null);

  // NEW: Inspector v2
  const { openInspector, closeInspector } = useInspector();

  // Tag filtering
  const { matches, mode, isActive } = useTagFilter();

  const getCell = (chapterId: string, themeId: string) =>
    gridCellsByKey[makeGridKey(bookId, chapterId, themeId)];

  const getNote = (chapterId: string, themeId: string) =>
    getCell(chapterId, themeId)?.note || '';

  const loadThemeTags = async (themeId: string) => {
    // Guard: don't load if themeId is empty or invalid
    if (!themeId || themeId.trim() === '') {
      setThemeTags([]);
      return;
    }
    
    try {
      const tags = await tagService.listForEntity('theme', themeId);
      setThemeTags(tags);
    } catch (error) {
      console.error(`Failed to load tags for theme ${themeId}:`, error);
      setThemeTags([]); // Set empty array on error to prevent undefined issues
    }
  };

  const loadCellTags = async (chapterId: string, themeId: string) => {
    // Guard: don't load if chapterId or themeId is empty or invalid
    if (!chapterId || chapterId.trim() === '' || !themeId || themeId.trim() === '') {
      setCellTags([]);
      return;
    }
    
    try {
      const entityId = `${chapterId}:${themeId}`;
      const tags = await tagService.listForEntity('grid_cell', entityId);
      setCellTags(tags);
    } catch (error) {
      console.error(`Failed to load tags for cell ${chapterId}:${themeId}:`, error);
      setCellTags([]); // Set empty array on error to prevent undefined issues
    }
  };

  // NEW: Inspector handlers for theme row info
  const handleOpenThemeInspector = (theme: Theme) => {
    // If clicking the same theme, don't do anything (let InspectorContext handle the toggle)
    if (selectedTheme?.id === theme.id) {
      return;
    }

    setSelectedTheme(theme);
    setThemeFormValues({
      name: theme.name,
      color: theme.color,
      kind: theme.kind,
      source: theme.source,
      mode: theme.mode,
      sourceRefId: theme.sourceRefId,
      description: theme.description,
      notes: theme.notes,
      aiGuide: theme.aiGuide,
      rowOrder: theme.rowOrder,
      isHidden: theme.isHidden,
      threadLabel: theme.threadLabel,
    });
    loadThemeTags(theme.id);
    
    openInspector({
      title: theme.name,
      subtitle: 'Theme Row',
      icon: <Info className="w-5 h-5" />,
      content: (
        <ThemeInfoForm
          theme={theme as ThemeData}
          characters={characters}
          onChange={(updates) => {
            setThemeFormValues(prev => ({ ...prev, ...updates }));
          }}
          tags={[]} // Tags will be loaded async
          onTagsChange={setThemeTags}
          onSave={async (updates) => {
            await updateThemeDetails(theme.id, updates);
          }}
          onTagsSave={async (newTags) => {
            await tagService.syncEntityTags('theme', theme.id, newTags);
          }}
          showSaveStatus={true}
        />
      ),
    });
  };

  // NEW: Inspector handler for grid cell info
  const handleOpenCellInspector = (chapterId: string, themeId: string) => {
    setSelectedGridCell({ chapterId, themeId });
    const currentCellData = getCellData(chapterId, themeId);
    const currentTheme = themes.find(t => t.id === themeId);
    const chapter = chapters.find(c => c.id === chapterId);
    setCellNote(getNote(chapterId, themeId));
    loadCellTags(chapterId, themeId);
    
    openInspector({
      title: chapter?.title || 'Chapter',
      subtitle: `Cell • ${currentTheme?.name || 'Theme'}`,
      icon: <Info className="w-5 h-5" />,
      content: (
        <GridCellInfoForm
          cellData={currentCellData}
          chapterTitle={chapter?.title || ''}
          themeName={currentTheme?.name || ''}
          themeColor={currentTheme?.color || '#000'}
          themeMode={currentTheme?.mode || 'presence'}
          onChange={setCellNote}
          onPresenceChange={(presence) => {
            updateGridCell(chapterId, themeId, { presence });
          }}
          onIntensityChange={(intensity) => {
            updateGridCell(chapterId, themeId, { intensity });
          }}
          onThreadRoleChange={(threadRole) => {
            updateGridCell(chapterId, themeId, { threadRole });
          }}
          threadRole={(getCell(chapterId, themeId)?.threadRole as ThreadRole | null) ?? undefined}
          tags={cellTags}
          onTagsChange={setCellTags}
        />
      ),
    });
  };

  // NEW: Inspector handler for chapter content
  const handleOpenChapterContentInspector = (chapter: Chapter) => {
    setSelectedChapterForContent(chapter);
    
    openInspector({
      title: chapter.title || 'Chapter',
      subtitle: 'Outline & manuscript preview',
      icon: <Info className="w-5 h-5" />,
      content: <ChapterContentPanel chapter={chapter} />,
    });
  };

  // Load tags when theme is selected
  useEffect(() => {
    if (selectedTheme) {
      loadThemeTags(selectedTheme.id);
    } else {
      setThemeTags([]);
    }
  }, [selectedTheme?.id]);

  // NEW: Sync selectedTheme with themes array updates
  useEffect(() => {
    if (selectedTheme) {
      const updatedTheme = themes.find(t => t.id === selectedTheme.id);
      if (updatedTheme && JSON.stringify(updatedTheme) !== JSON.stringify(selectedTheme)) {
        setSelectedTheme(updatedTheme);
      }
    }
  }, [themes, selectedTheme]);

  // Update inspector content when selectedTheme data changes OR tags load
  useEffect(() => {
    if (selectedTheme) {
      openInspector({
        title: selectedTheme.name,
        subtitle: 'Theme Row',
        icon: <Info className="w-5 h-5" />,
        content: (
          <ThemeInfoForm
            theme={selectedTheme as ThemeData}
            characters={characters}
            onChange={(updates) => {
              setThemeFormValues(prev => ({ ...prev, ...updates }));
            }}
            tags={themeTags}
            onTagsChange={setThemeTags}
            onSave={async (updates) => {
              await updateThemeDetails(selectedTheme.id, updates);
            }}
            onTagsSave={async (newTags) => {
              await tagService.syncEntityTags('theme', selectedTheme.id, newTags);
            }}
            showSaveStatus={true}
          />
        ),
      });
    }
  }, [selectedTheme, themeTags]); // Update when theme data OR tags change

  // Load tags when cell is selected
  useEffect(() => {
    if (selectedGridCell) {
      loadCellTags(selectedGridCell.chapterId, selectedGridCell.themeId);
      setCellNote(getNote(selectedGridCell.chapterId, selectedGridCell.themeId));
    } else {
      setCellTags([]);
    }
  }, [selectedGridCell?.chapterId, selectedGridCell?.themeId]);

  // Grid 2.0: Get complete cell data
  const getCellData = (chapterId: string, themeId: string): GridCell => {
    const existing = getCell(chapterId, themeId);

    return {
      id: existing?.id || makeGridKey(bookId, chapterId, themeId),
      bookId,
      chapterId,
      themeId,
      note: existing?.note ?? '',
      presence: existing?.presence || false,
      intensity: typeof existing?.intensity === 'number' ? existing.intensity : 0,
      threadRole: existing?.threadRole ?? null,
    };
  };

  // Grid 2.0: Get row configuration
  const getRowMode = (theme: Theme) => theme.mode || 'presence';
  const getRowSource = (theme: Theme) => theme.source || 'theme';

  // NEW: Grid Enhancement Pack - Sorted and grouped themes
  const sortedThemes = [...themes].sort((a, b) => {
    const aOrder = typeof a.rowOrder === 'number' ? a.rowOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = typeof b.rowOrder === 'number' ? b.rowOrder : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) return aOrder - bOrder;

    // fallback: stable sort by name
    return (a.name || '').localeCompare(b.name || '');
  });

  const groups = [
    {
      id: 'characters',
      label: 'Characters',
      match: (t: Theme) => (t.source ?? 'theme') === 'character',
    },
    {
      id: 'themes',
      label: 'Themes',
      match: (t: Theme) => (t.source ?? 'theme') === 'theme',
    },
    {
      id: 'custom',
      label: 'Custom trackers',
      match: (t: Theme) => (t.source ?? 'theme') === 'custom',
    },
    {
      id: 'threads',
      label: 'Threads',
      match: (t: Theme) => (t.source ?? 'theme') === 'thread',
    },
  ];

  const groupedThemes = groups.map(group => ({
    ...group,
    themes: sortedThemes.filter(group.match),
  }));

  // NEW: Grid Enhancement Pack - Handle row reorder
  const handleRowReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const current = sortedThemes;
    const sourceIndex = current.findIndex(t => t.id === sourceId);
    const targetIndex = current.findIndex(t => t.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...current];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Assign sequential rowOrder and persist
    reordered.forEach((theme, index) => {
      if (theme.rowOrder !== index) {
        updateThemeDetails(theme.id, { rowOrder: index });
      }
    });
  };

  const startEditingTheme = (theme: Theme) => {
    setEditingThemeId(theme.id);
    setEditThemeName(theme.name);
  };

  const saveThemeEdit = () => {
    if (editingThemeId && editThemeName.trim()) {
      updateTheme(editingThemeId, editThemeName.trim());
    }
    setEditingThemeId(null);
  };

  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditChapterTitle(chapter.title);
  };

  const saveChapterEdit = () => {
    if (editingChapterId && editChapterTitle.trim()) {
      updateChapterTitle(editingChapterId, editChapterTitle.trim());
    }
    setEditingChapterId(null);
  };

  const handleAddTheme = () => {
    setIsAddingTheme(true);
    setNewThemeName('');
  };

  const saveNewTheme = () => {
    if (newThemeName.trim()) {
      addTheme(newThemeName.trim());
    }
    setIsAddingTheme(false);
    setNewThemeName('');
  };

  const handleAddChapter = () => {
    setIsAddingChapter(true);
    setNewChapterTitle('');
  };

  const saveNewChapter = () => {
    if (newChapterTitle.trim()) {
      addChapter(newChapterTitle.trim());
    }
    setIsAddingChapter(false);
    setNewChapterTitle('');
  };

  // NEW: Parts v1 - Calculate part spans for grid header
  const partSpans: Array<{ part: Part | null; startIndex: number; count: number }> = [];
  if (parts && parts.length > 0) {
    const sortedParts = [...parts].sort((a, b) => a.sortOrder - b.sortOrder);
    
    sortedParts.forEach(part => {
      const partChapters = chapters.filter(ch => ch.partId === part.id);
      if (partChapters.length > 0) {
        const firstIndex = chapters.findIndex(ch => ch.id === partChapters[0].id);
        partSpans.push({ part, startIndex: firstIndex, count: partChapters.length });
      }
    });
    
    // Add unassigned chapters
    const unassignedChapters = chapters.filter(ch => !ch.partId);
    if (unassignedChapters.length > 0) {
      const firstIndex = chapters.findIndex(ch => ch.id === unassignedChapters[0].id);
      partSpans.push({ part: null, startIndex: firstIndex, count: unassignedChapters.length });
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable grid container */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="inline-block min-w-full px-8 pb-8">
          <div className="inline-flex min-w-max">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="border-collapse">
                <thead>
                  {/* Parts header row */}
                  {partSpans.length > 0 && (
                    <tr className="sticky top-0 z-20">
                      <th className={`sticky left-0 z-30 bg-gray-50 border-b border-r border-gray-200 p-2 text-left ${
                        columnSize === 'full' ? 'min-w-[140px] max-w-[180px]' : 'min-w-[75px] max-w-[95px]'
                      }`}>
                        <span className="text-xs text-gray-600">Parts</span>
                      </th>
                      {partSpans.map((span, idx) => (
                        <th
                          key={idx}
                          colSpan={span.count}
                          className="bg-gray-50 border-b border-l border-gray-200 px-3 py-2 text-left"
                        >
                          <span className="text-sm text-gray-700">
                            {span.part ? span.part.title : 'Unassigned'}
                          </span>
                        </th>
                      ))}
                    </tr>
                  )}
                  {/* Chapter headers row */}
                  <tr className="sticky top-[41px] z-20">
                    <th className={`sticky left-0 z-30 bg-gray-100 border-b border-r border-gray-200 p-3 text-left ${
                      columnSize === 'full' ? 'min-w-[140px] max-w-[180px]' : 'min-w-[75px] max-w-[95px]'
                    }`}>
                      <span className="text-sm text-gray-700">Theme / Chapter</span>
                    </th>
                    {chapters.map((chapter) => (
                      <FilteredChapterHeader
                        key={chapter.id}
                        chapter={chapter}
                        editingChapterId={editingChapterId}
                        editChapterTitle={editChapterTitle}
                        setEditChapterTitle={setEditChapterTitle}
                        saveChapterEdit={saveChapterEdit}
                        setEditingChapterId={setEditingChapterId}
                        startEditingChapter={startEditingChapter}
                        deleteChapter={deleteChapter}
                        setSelectedChapterForContent={setSelectedChapterForContent}
                        columnSize={columnSize}
                      />
                    ))}
                  </tr>
                </thead>
                {groupedThemes.map(group => {
                  const groupThemes = group.themes;
                  if (groupThemes.length === 0) return null;

                  const isCollapsed = collapsedGroups[group.id] ?? false;

                  return (
                    <tbody key={group.id}>
                      {/* Group header row */}
                      <tr className="sticky left-0 z-10">
                        <td
                          className="sticky left-0 z-10 bg-gray-50 border-b border-gray-200 px-3 py-2 min-w-[110px] max-w-[140px]"
                        >
                          <div className="w-full flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedGroups(prev => ({
                                  ...prev,
                                  [group.id]: !isCollapsed,
                                }))
                              }
                              className="flex items-center gap-2"
                            >
                              <ChevronRight
                                className={`w-4 h-4 text-gray-500 transition-transform ${
                                  isCollapsed ? '' : 'rotate-90'
                                }`}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {group.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                {groupThemes.length} rows
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Show all rows in this group
                                setHiddenThemeIds(prev =>
                                  prev.filter(id => !groupThemes.some(t => t.id === id))
                                );
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Show all
                            </button>
                          </div>
                        </td>
                        <td colSpan={chapters.length} className="bg-gray-50 border-b border-gray-200"></td>
                      </tr>

                      {/* Rows in this group */}
                      {!isCollapsed &&
                        groupThemes
                          .filter(theme => !hiddenThemeIds.includes(theme.id))
                          .map(theme => (
                            <FilteredThemeRow
                              key={theme.id}
                              theme={theme}
                              chapters={chapters}
                              getCell={getCell}
                              editingThemeId={editingThemeId}
                              editThemeName={editThemeName}
                              setEditThemeName={setEditThemeName}
                              saveThemeEdit={saveThemeEdit}
                              setEditingThemeId={setEditingThemeId}
                              startEditingTheme={startEditingTheme}
                              deleteTheme={deleteTheme}
                              setSelectedTheme={setSelectedTheme}
                              getNote={getNote}
                              getCellData={getCellData}
                              updateGridCell={updateGridCell}
                              focusedCell={focusedCell}
                              setFocusedCell={setFocusedCell}
                              setSelectedGridCell={setSelectedGridCell}
                              // NEW props
                              rowMode={getRowMode(theme)}
                              isHidden={hiddenThemeIds.includes(theme.id)}
                              onToggleHidden={() => {
                                setHiddenThemeIds(prev =>
                                  prev.includes(theme.id)
                                    ? prev.filter(id => id !== theme.id)
                                    : [...prev, theme.id]
                                );
                              }}
                              draggingThemeId={draggingThemeId}
                              onDragStart={() => setDraggingThemeId(theme.id)}
                              onDragEnd={() => setDraggingThemeId(null)}
                              onDropOn={() => {
                                if (draggingThemeId && draggingThemeId !== theme.id) {
                                  handleRowReorder(draggingThemeId, theme.id);
                                }
                                setDraggingThemeId(null);
                              }}
                              handleOpenThemeInspector={handleOpenThemeInspector}
                              handleOpenCellInspector={handleOpenCellInspector}
                              columnSize={columnSize}
                            />
                          ))}
                    </tbody>
                  );
                })}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Theme Dialog */}
      <Dialog open={showAddThemeDialog ?? isAddingTheme} onOpenChange={setShowAddThemeDialog ?? setIsAddingTheme}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Theme</DialogTitle>
            <DialogDescription>
              Create a new theme or tracking row for your grid.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="themeName">Theme Name</Label>
              <Input
                id="themeName"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Enter theme name"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => (setShowAddThemeDialog ?? setIsAddingTheme)(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveNewTheme}>
              Add Theme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={showAddChapterDialog ?? isAddingChapter} onOpenChange={setShowAddChapterDialog ?? setIsAddingChapter}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Chapter</DialogTitle>
            <DialogDescription>
              Create a new chapter column for your grid.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="chapterTitle">Chapter Title</Label>
              <Input
                id="chapterTitle"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Enter chapter title"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => (setShowAddChapterDialog ?? setIsAddingChapter)(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveNewChapter}>
              Add Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for filtered chapter headers
function FilteredChapterHeader({ 
  chapter,
  editingChapterId,
  editChapterTitle,
  setEditChapterTitle,
  saveChapterEdit,
  setEditingChapterId,
  startEditingChapter,
  deleteChapter,
  setSelectedChapterForContent,
  columnSize
}: {
  chapter: Chapter;
  editingChapterId: string | null;
  editChapterTitle: string;
  setEditChapterTitle: (title: string) => void;
  saveChapterEdit: () => void;
  setEditingChapterId: (id: string | null) => void;
  startEditingChapter: (chapter: Chapter) => void;
  deleteChapter: (id: string) => void;
  setSelectedChapterForContent: (chapter: Chapter | null) => void;
  columnSize?: 'minimal' | 'compact' | 'full';
}) {
  const { matches, mode, isActive } = useTagFilter();
  const { tags } = useEntityTags('chapter', chapter.id);
  const { getChapterNumber } = useChapterNumbering();
  
  const visible = !isActive || (tags && matches(tags));
  const dimmed = isActive && !visible && mode === 'dim';
  const hidden = isActive && !visible && mode === 'hide';
  
  if (hidden) return null;
  
  // Phase 3: Grid Cleanup - Apply column size classes
  const sizeClasses = getColumnClasses(columnSize || 'compact');
  const size = columnSize || 'compact';
  
  const chapterNumber = getChapterNumber(chapter.id);
  
  return (
    <th
      className={`bg-gray-100 border-b border-gray-200 py-3 min-w-[40px] relative group ${sizeClasses} ${
        dimmed ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {editingChapterId === chapter.id ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={editChapterTitle}
            onChange={(e) => setEditChapterTitle(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveChapterEdit();
              if (e.key === 'Escape') setEditingChapterId(null);
            }}
          />
          <div className="flex gap-1 justify-center">
            <button
              onClick={saveChapterEdit}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button
              onClick={() => setEditingChapterId(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Phase 3: Minimal mode - show chapter number only */}
          {size === 'minimal' ? (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-gray-700 font-medium" title={chapter.title}>
                {chapterNumber}
              </div>
              <button
                onClick={() => setSelectedChapterForContent(chapter)}
                className="p-0.5 hover:bg-gray-200 rounded"
                title="View chapter content"
              >
                <Info className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <div className={`${size === 'compact' ? 'text-xs' : 'text-sm'} text-gray-900 mb-1 pr-6`}>
                {chapter.title}
              </div>
              <div className="text-xs text-gray-500">
                {chapter.wordCount} words
              </div>
              <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedChapterForContent(chapter)}
                  className="p-1 hover:bg-gray-200 rounded bg-white"
                  title="View chapter content"
                >
                  <Info className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            </>
          )}
        </>
      )}
    </th>
  );
}

// Helper component for filtered theme rows
function FilteredThemeRow({
  theme,
  chapters,
  getCell,
  editingThemeId,
  editThemeName,
  setEditThemeName,
  saveThemeEdit,
  setEditingThemeId,
  startEditingTheme,
  deleteTheme,
  setSelectedTheme,
  getNote,
  getCellData,
  updateGridCell,
  focusedCell,
  setFocusedCell,
  setSelectedGridCell,
  // NEW props
  rowMode,
  isHidden,
  onToggleHidden,
  draggingThemeId,
  onDragStart,
  onDragEnd,
  onDropOn,
  handleOpenThemeInspector,
  handleOpenCellInspector,
  columnSize
}: {
  theme: Theme;
  chapters: Chapter[];
  getCell: (chapterId: string, themeId: string) => GridCell | undefined;
  editingThemeId: string | null;
  editThemeName: string;
  setEditThemeName: (name: string) => void;
  saveThemeEdit: () => void;
  setEditingThemeId: (id: string | null) => void;
  startEditingTheme: (theme: Theme) => void;
  deleteTheme: (id: string) => void;
  setSelectedTheme: (theme: Theme) => void;
  getNote: (chapterId: string, themeId: string) => string;
  getCellData: (chapterId: string, themeId: string) => GridCell;
  updateGridCell: (
    chapterId: string,
    themeId: string,
    changes: Partial<Pick<GridCell, "note" | "presence" | "intensity" | "threadRole">>,
  ) => void;
  focusedCell: { chapterId: string; themeId: string } | null;
  setFocusedCell: (cell: { chapterId: string; themeId: string } | null) => void;
  setSelectedGridCell: (cell: { chapterId: string; themeId: string }) => void;
  // NEW props
  rowMode: 'presence' | 'heatmap' | 'thread';
  isHidden: boolean;
  onToggleHidden: () => void;
  draggingThemeId: string | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
  handleOpenThemeInspector: (theme: Theme) => void;
  handleOpenCellInspector: (chapterId: string, themeId: string) => void;
  columnSize?: 'minimal' | 'compact' | 'full';
}) {
  const { matches, mode, isActive } = useTagFilter();
  const { tags } = useEntityTags('theme', theme.id);
  
  const visible = !isActive || (tags && matches(tags));
  const dimmed = isActive && !visible && mode === 'dim';
  const hidden = isActive && !visible && mode === 'hide';
  
  // Grid 2.0: Get theme configuration
  const rowSource = theme.source || 'theme';
  
  if (hidden) return null;
  
  return (
    <tr 
      key={theme.id} 
      className={`group/row ${dimmed ? 'opacity-50 pointer-events-none' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropOn();
      }}
    >
      <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 p-3">
        {editingThemeId === theme.id ? (
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.color }}
            />
            <input
              type="text"
              value={editThemeName}
              onChange={(e) => setEditThemeName(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveThemeEdit();
                if (e.key === 'Escape') setEditingThemeId(null);
              }}
            />
            <button
              onClick={saveThemeEdit}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Check className="w-3 h-3 text-green-600" />
            </button>
            <button
              onClick={() => setEditingThemeId(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-red-600" />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <GripVertical className="w-3 h-3 mt-1 text-gray-400 cursor-grab" />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">{theme.name}</span>
                  
                  {/* Source/Mode badges */}
                  {rowSource === 'thread' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Thread
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {rowSource === 'character' ? 'Character' : rowSource}
                    </span>
                  )}
                  
                  {rowMode === 'thread' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                      Foreshadow / Payoff
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {rowMode}
                    </span>
                  )}
                  
                  {/* AI Guide indicator */}
                  {theme.aiGuide && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      AI guide set
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                {theme.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {theme.description}
                  </p>
                )}

                {/* Mini arc strip for heatmap rows */}
                {rowMode === 'heatmap' && (
                  <div className="mt-1 flex items-center gap-1">
                    {chapters.map(chapter => {
                      const cell = getCellData(chapter.id, theme.id);
                      const intensity = cell.intensity ?? 0;
                      const colorClass =
                        intensity === 0
                          ? 'bg-gray-100'
                          : intensity === 1
                            ? 'bg-orange-100'
                            : intensity === 2
                              ? 'bg-orange-300'
                              : 'bg-orange-500';

                      return (
                        <div
                          key={chapter.id}
                          className={`h-1 rounded-sm ${colorClass}`}
                          style={{ flex: 1, minWidth: 4 }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Mini thread strip for thread rows */}
                {rowSource === 'thread' && (
                  renderThreadMiniStrip(theme, chapters, chapterId => {
                    return getCell(chapterId, theme.id);
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Info button only */}
              <button
                onClick={() => handleOpenThemeInspector(theme)}
                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover/row:opacity-100 transition-opacity"
                title="Theme info"
              >
                <Info className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </td>
      {(() => {
        // Calculate thread bounds once per row (for thread mode)
        const threadBounds = rowMode === 'thread'
          ? getThreadBounds(
              theme,
              chapters,
              (chapterId) => getCell(chapterId, theme.id)
            )
          : { firstIndex: -1, lastIndex: -1, eventIndex: -1 };
        
        return chapters.map((chapter, colIndex) => {
          const cellData = getCellData(chapter.id, theme.id);
          const isFocused =
            focusedCell?.chapterId === chapter.id &&
            focusedCell?.themeId === theme.id;

          // Grid 2.0: Calculate heatmap background
          const getHeatmapBg = () => {
            if (rowMode === 'heatmap') {
              const colors = ['bg-white', 'bg-orange-50', 'bg-orange-100', 'bg-orange-200'];
              return colors[cellData.intensity] || 'bg-white';
            } else if (rowMode === 'presence' && cellData.presence) {
              return 'bg-green-50';
            }
            return 'bg-white';
          };

          return (
            <td
              key={`${chapter.id}-${theme.id}`}
              className={`border-b border-gray-200 relative group/cell transition-colors ${getHeatmapBg()} ${
                isFocused ? 'ring-2 ring-blue-300 ring-inset' : ''
              }`}
            >
              {/* Phase 3: Minimal mode - signal-only rendering */}
              {columnSize === 'minimal' ? (
                <div className="relative flex items-center justify-center p-2">
                  {rowMode === 'presence' ? (
                    <button
                      type="button"
                      onClick={() => updateGridCell(chapter.id, theme.id, { presence: !cellData.presence })}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        cellData.presence
                          ? 'bg-[#60818E] border-[#60818E]'
                          : 'bg-white border-slate-300 hover:border-slate-400'
                      }`}
                      aria-label={cellData.presence ? 'Present' : 'Not present'}
                    >
                      {cellData.presence && (
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      )}
                    </button>
                  ) : rowMode === 'heatmap' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const nextIntensity = (cellData.intensity + 1) % 4;
                        updateGridCell(chapter.id, theme.id, { intensity: nextIntensity });
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
                        cellData.intensity === 0
                          ? 'bg-gray-100 text-gray-600'
                          : cellData.intensity === 1
                            ? 'bg-orange-100 text-orange-700'
                            : cellData.intensity === 2
                              ? 'bg-orange-300 text-orange-900'
                              : 'bg-orange-500 text-white'
                      }`}
                    >
                      {cellData.intensity}
                    </button>
                  ) : rowMode === 'thread' ? (
                    (() => {
                      const note = getCell(chapter.id, theme.id);
                      const role: ThreadRole = (note?.threadRole as ThreadRole) ?? 'none';

                      const handleClick = () => {
                        const updatedRole = nextThreadRole(role);
                        updateGridCell(chapter.id, theme.id, {
                          threadRole: updatedRole,
                        });
                      };

                      const letter = role === 'seed' ? 'S' : role === 'buildup' ? 'B' : role === 'event' ? 'E' : role === 'aftermath' ? 'A' : '–';
                      
                      // Size based on role
                      const sizeClass = role === 'seed' ? 'w-5 h-5 text-[10px]' : role === 'event' ? 'w-8 h-8 text-xs' : role === 'none' ? 'w-4 h-4 text-[9px]' : 'w-6 h-6 text-[11px]';
                      
                      const colorClass =
                        role === 'none'
                          ? 'bg-gray-100 text-gray-400'
                          : role === 'event'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-200 text-purple-800';

                      return (
                        <button
                          type="button"
                          onClick={handleClick}
                          className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-medium`}
                        >
                          {letter}
                        </button>
                      );
                    })()
                  ) : null}
                </div>
              ) : (
                <div className="relative p-3">
                  {/* Grid 2.0: Presence/Heatmap/Thread UI */}
                  <div className="flex items-center justify-between mb-2">
                  {rowMode === 'presence' ? (
                    <button
                      type="button"
                      onClick={() => updateGridCell(chapter.id, theme.id, { presence: !cellData.presence })}
                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                        cellData.presence
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {cellData.presence ? '✓ Present' : '✗ Not present'}
                    </button>
                  ) : rowMode === 'heatmap' ? (
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => updateGridCell(chapter.id, theme.id, { intensity: level })}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            cellData.intensity >= level && level > 0
                              ? 'bg-orange-400 border-orange-500'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}
                          title={`Intensity ${level}`}
                        />
                      ))}
                    </div>
                  ) : rowMode === 'thread' ? (
                    (() => {
                      // NEW: Thread Lines v1 - Thread cell rendering with horizontal line
                      const note = getCell(chapter.id, theme.id);
                      const role: ThreadRole = (note?.threadRole as ThreadRole) ?? 'none';

                      const handleClick = () => {
                        const updatedRole = nextThreadRole(role);
                        updateGridCell(chapter.id, theme.id, {
                          threadRole: updatedRole,
                        });
                      };

                      const label =
                        role === 'none'
                          ? '–'
                          : role === 'seed'
                          ? 'Seed'
                          : role === 'buildup'
                          ? 'Build'
                          : role === 'event'
                          ? 'Event'
                          : 'After';

                      const baseClass =
                        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px]';

                      const roleClass =
                        role === 'none'
                          ? 'border-gray-200 text-gray-400 bg-white'
                          : role === 'event'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-purple-300 bg-purple-50 text-purple-700';

                      // Is this column inside the active thread span?
                      const inPath =
                        threadBounds.firstIndex >= 0 &&
                        threadBounds.lastIndex >= 0 &&
                        colIndex >= threadBounds.firstIndex &&
                        colIndex <= threadBounds.lastIndex;

                      // Slightly thicker line near the event
                      let lineThicknessClass = 'h-[2px]';
                      if (threadBounds.eventIndex >= 0) {
                        const distance = Math.abs(colIndex - threadBounds.eventIndex);
                        if (distance === 0) lineThicknessClass = 'h-[3px]';
                        else if (distance === 1) lineThicknessClass = 'h-[2.5px]';
                      }

                      const lineColorClass = getThreadLineColorClass(theme);
                      const tintColorClass = getThreadCellTintClass(theme);

                      return (
                        <div
                          className={`relative flex items-center justify-center ${
                            inPath ? tintColorClass : ''
                          }`}
                        >
                          {inPath && (
                            <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center">
                              <div
                                className={`w-full ${lineThicknessClass} rounded-full ${lineColorClass}`}
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleClick}
                            className={`${baseClass} ${roleClass} relative z-10`}
                          >
                            {label}
                          </button>
                        </div>
                      );
                    })()
                  ) : null}

                  {/* Info button */}
                  <button
                    onClick={() => handleOpenCellInspector(chapter.id, theme.id)}
                    className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity"
                    title="Cell details"
                  >
                    <Info className="w-3 h-3 text-gray-600" />
                  </button>
                </div>

                {/* Note textarea */}
                <textarea
                  value={cellData.note}
                  onChange={(e) =>
                    updateGridCell(chapter.id, theme.id, { note: e.target.value })
                  }
                  onFocus={() =>
                    setFocusedCell({ chapterId: chapter.id, themeId: theme.id })
                  }
                  onBlur={() => setFocusedCell(null)}
                  placeholder="Add note..."
                  className="w-full min-h-[60px] resize-none border-none outline-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400"
                />
              </div>
              )}
            </td>
          );
        });
      })()}
    </tr>
  );
}
