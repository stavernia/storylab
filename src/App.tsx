import { useState, useEffect, useMemo, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Search, Plus, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, BookOpenText } from 'lucide-react';
import { manuscriptApi } from "./api/manuscript";
import { booksApi } from "./api/books";
import type { Book } from './types/book';
import * as partService from './services/part';
import { seedTags } from './utils/seed-tags';
import { getOrderedChapters } from './utils/chapter-ordering';
import { EditorView } from './components/EditorView';
import { GridView } from './components/GridView';
import { OutlineView } from './components/OutlineView';
import { Corkboard } from './components/corkboard/Corkboard';
import { ThemeManager } from './components/ThemeManager';
import { CharacterManager } from './components/CharacterManager';
import { BooksView } from './components/BooksView';
import { PartsView } from './components/PartsView';
import { SettingsOverlay } from './components/SettingsOverlay';
import { Pane } from './components/layout/Pane';
import { StatusBar } from './components/layout/StatusBar';
import { ToolRail } from './components/layout/ToolRail';
import { InspectorSidebar } from './components/layout/InspectorSidebar';
import { SearchAndFilterOverlay } from './components/layout/SearchAndFilterOverlay';
import { SideTab } from './components/layout/SideTab';
import { BinderWrapper } from './components/shared/BinderWrapper';
import { TagFilterProvider, useTagFilter } from './contexts/TagFilterContext';
import { FilterProvider, useFilters } from './contexts/FilterContext';
import { InspectorProvider, useInspector } from './contexts/InspectorContext';
import { ChapterNumberingProvider } from './contexts/ChapterNumberingContext';
import { OnboardingTourProvider, useOnboardingTour } from './onboarding/OnboardingTourContext';
import { OnboardingTourOverlay } from './onboarding/OnboardingTourOverlay';
import type { TourStep } from './onboarding/tourConfig';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { User as UserIcon, Settings as SettingsIcon, MessageSquare } from 'lucide-react';
const StoryLabLogo = "/storylab-logo.png";
import { APP_VIEWS, type AppViewId, type PaneId } from './config/views';
import { EditorProjectInfoPanel } from './components/info-panels/EditorProjectInfoPanel';
import { FeedbackModal } from './components/FeedbackModal';

// NEW: Multi-book support - Book type is now imported from ./types/book
export type Part = {
  id: string;
  bookId: string; // NEW: Multi-book support
  title: string;
  sortOrder: number;
  notes?: string | null;
};

export type Chapter = {
  id: string;
  bookId: string; // NEW: Multi-book support
  title: string;
  content: string;
  lastEdited?: Date;
  wordCount?: number;
  sortOrder?: number;
  partId?: string | null; // NEW: Parts v1 - reference to Part
  // NEW: Outliner Enhancement Pack - Goal/Conflict/Stakes metadata
  outlineGoal?: string;
  outlineConflict?: string;
  outlineStakes?: string;
  // Outline view fields
  outline?: string;
  outlinePOV?: string;
  outlinePurpose?: string;
  outlineEstimate?: number;
  customOutlineFields?: Record<string, string>;
};

export type ThreadRole = 'none' | 'seed' | 'buildup' | 'event' | 'aftermath';
export type ThemeSource = 'theme' | 'character' | 'custom' | 'thread';
export type ThemeMode = 'presence' | 'heatmap' | 'thread';

export type Theme = {
  id: string;
  bookId: string; // NEW: Multi-book support
  name: string;
  color: string;
  // NEW: Grid 2.0 fields
  kind?: 'tracker' | 'info';
  source?: ThemeSource;
  mode?: ThemeMode;
  sourceRefId?: string | null;
  // NEW: Grid Enhancement Pack - Row Metadata
  description?: string;   // What this row tracks conceptually
  notes?: string;         // General notes about this tracker row
  aiGuide?: string;       // Instructions for future AI analysis
  rowOrder?: number | null; // Row position in the Grid (for sorting)
  isHidden?: boolean;       // Optional persistent hide flag
  // NEW: Thread Lines v1
  threadLabel?: string;     // Optional label for thread (e.g., "Job loss → starting over")
};

export type Character = {
  id: string;
  bookId: string; // NEW: Multi-book support
  name: string;
  color: string;
  role?: string;
  notes?: string;
};

export type ThemeNote = {
  chapterId: string;
  themeId: string;
  note: string;
  // NEW: Grid 2.0 fields
  presence?: boolean;
  intensity?: number; // 0–3
  // NEW: Thread Lines v1
  threadRole?: ThreadRole; // if undefined, treat as 'none'
};

// NEW: Dual Pane v1 - Pane state
type PaneState = {
  id: PaneId;
  activeViewId: AppViewId;
  selectedChapterId: string;
};

// NEW: Centralized Selection - Selection types for binder/breadcrumbs
export type ManuscriptSelection =
  | { kind: 'manuscript' }
  | { kind: 'part'; partId: string }
  | { kind: 'chapter'; chapterId: string };

function AppContent() {
  // NEW: Onboarding Tour
  const { isOpen: tourIsOpen, currentStep: tourCurrentStep } = useOnboardingTour();
  
  // NEW: Multi-book support - Books state
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  
  // NEW: Dual Pane v1 - Replace single view state with pane state
  const [panes, setPanes] = useState<PaneState[]>([
    { id: 'primary', activeViewId: 'books', selectedChapterId: '' }, // NEW: Start with books view
  ]);
  
  // NEW: Unified Search/Filter - Track active pane for filters
  const [activePaneId, setActivePaneId] = useState<PaneId>('primary');
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeNotes, setThemeNotes] = useState<ThemeNote[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [parts, setParts] = useState<Part[]>([]); // NEW: Parts v1
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookData, setIsLoadingBookData] = useState(false); // NEW: Loading state for book switching
  
  // NEW: UI Cohesion - View-specific state for Context Bar controls
  const [corkboardDisplayMode, setCorkboardDisplayMode] = useState<'cards' | 'list'>('cards');
  const [corkboardSearchQuery, setCorkboardSearchQuery] = useState('');
  const [charactersDisplayMode, setCharactersDisplayMode] = useState<'cards' | 'list'>('cards');
  const [charactersSearchQuery, setCharactersSearchQuery] = useState('');
  const [themesDisplayMode, setThemesDisplayMode] = useState<'cards' | 'list'>('cards');
  const [themesSearchQuery, setThemesSearchQuery] = useState('');
  const [gridShowAddThemeDialog, setGridShowAddThemeDialog] = useState(false);
  const [gridShowAddChapterDialog, setGridShowAddChapterDialog] = useState(false);
  const [themeManagerShowAddDialog, setThemeManagerShowAddDialog] = useState(false);
  const [characterManagerShowAddDialog, setCharacterManagerShowAddDialog] = useState(false);
  const [partsViewShowAddDialog, setPartsViewShowAddDialog] = useState(false);
  // Settings overlay state
  const [settingsOverlayOpen, setSettingsOverlayOpen] = useState(false);
  // Feedback modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  // Phase 3: Grid Cleanup - Column Size Control
  type GridColumnSize = 'minimal' | 'compact' | 'full';
  const [gridColumnSize, setGridColumnSize] = useState<GridColumnSize>('compact');
  // Left sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  
  const [breadcrumbData, setBreadcrumbData] = useState<
    Record<PaneId, import("./components/layout/Pane").BreadcrumbData | undefined>
  >({});
  const breadcrumbSetters = useMemo(
    () => ({
      primary: (data: import("./components/layout/Pane").BreadcrumbData) =>
        setBreadcrumbData((prev) => ({ ...prev, primary: data })),
      secondary: (data: import("./components/layout/Pane").BreadcrumbData) =>
        setBreadcrumbData((prev) => ({ ...prev, secondary: data })),
    }),
    [],
  );
  
  // NEW: Centralized Selection - Selection state per pane
  const [paneSelections, setPaneSelections] = useState<Record<PaneId, ManuscriptSelection>>({
    primary: { kind: 'manuscript' }
  });
  
  // Helper to update selection for a pane
  const setSelectionForPane = (paneId: PaneId, selection: ManuscriptSelection) => {
    setPaneSelections(prev => ({ ...prev, [paneId]: selection }));
  };

  // Tag filter state
  const tagFilter = useTagFilter();
  
  // NEW: Unified Search/Filter
  const { openOverlay } = useFilters();
  
  // NEW: Inspector context
  const { openInspector, closeInspector } = useInspector();
  
  // Handler to open inspector for a chapter
  const handleChapterInfoClick = (chapter: Chapter) => {
    // Phase 1.5: Use NEW structured data API
    // Filter parts by current book
    const currentBookParts = currentBookId ? parts.filter(p => p.bookId === currentBookId) : [];
    
    openInspector({
      type: 'chapter',
      id: chapter.id,
      data: {
        chapter: chapter,
        tags: [], // Tags will be loaded by the inspector component
        parts: currentBookParts || [],
        updateChapterTitle: updateChapterTitle,
        deleteChapter: deleteChapter,
      }
    }, 'inspector');
  };

  // Handler to open inspector for full manuscript project info
  const handleManuscriptInfoClick = () => {
    // Filter chapters by current book
    const currentBookChapters = currentBookId ? chapters.filter(ch => ch.bookId === currentBookId) : [];
    
    openInspector({
      title: 'Manuscript Overview',
      subtitle: 'Project-wide stats',
      icon: <BookOpenText className="w-4 h-4" />,
      content: <EditorProjectInfoPanel chapters={currentBookChapters} />,
    });
  };

  // Handler to open inspector for a part
  const handlePartInfoClick = (part: Part) => {
    openInspector({
      type: 'part',
      id: part.id,
      data: {
        part: part,
        updatePartName: updatePartName,
        deletePart: deletePart,
      }
    }, 'inspector');
  };

  // Seed tags on first load
  useEffect(() => {
    seedTags();
  }, []);
  
  // NEW: Multi-book support - Update currentBook when currentBookId changes
  useEffect(() => {
    if (currentBookId) {
      const book = books.find(b => b.id === currentBookId);
      setCurrentBook(book || null);
    } else {
      setCurrentBook(null);
    }
  }, [currentBookId, books]);

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // NEW: Multi-book support - Load books first
        const loadedBooks = await booksApi.listAll();
        console.log('Loaded books:', loadedBooks);
        setBooks(loadedBooks);
        
        // Auto-select book based on count
        if (loadedBooks.length === 1) {
          // Single book: auto-select and load its data
          const book = loadedBooks[0];
          setCurrentBookId(book.id);
          
          // Switch to editor view
          setPanes(prev => prev.map(p => 
            p.id === 'primary' ? { ...p, activeViewId: 'editor' } : p
          ));
          
          // Load book data
          const data = await manuscriptApi.loadData(book.id);
          console.log('Loaded data from backend:', data);
          
          setChapters(data.chapters);
          setThemes(data.themes);
          setCharacters(data.characters || []);
          setThemeNotes(data.themeNotes);
          setParts(data.parts || []);
          
          // Initialize primary pane with first chapter
          setPanes(prev => prev.map(p => 
            p.id === 'primary' ? { ...p, selectedChapterId: data.chapters[0]?.id || '' } : p
          ));
        } else if (loadedBooks.length === 0) {
          // No books: default book will be created by backend, then load
          const data = await manuscriptApi.loadData(); // This will trigger default book creation
          console.log('Loaded data (created default book):', data);
          
          // Reload books to get the default book
          const reloadedBooks = await booksApi.listAll();
          setBooks(reloadedBooks);
          
          if (reloadedBooks.length > 0) {
            const book = reloadedBooks[0];
            setCurrentBookId(book.id);
            
            // Switch to editor view
            setPanes(prev => prev.map(p => 
              p.id === 'primary' ? { ...p, activeViewId: 'editor' } : p
            ));
          }
          
          setChapters(data.chapters);
          setThemes(data.themes);
          setCharacters(data.characters || []);
          setThemeNotes(data.themeNotes);
          setParts(data.parts || []);
          
          // Initialize primary pane with first chapter
          setPanes(prev => prev.map(p => 
            p.id === 'primary' ? { ...p, selectedChapterId: data.chapters[0]?.id || '' } : p
          ));
        } else {
          // Multiple books: stay on books view (already default)
          // User will select a book manually
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const updateChapter = async (id: string, content: string) => {
    const chapter = chapters.find(ch => ch.id === id);
    if (!chapter) {
      console.error('Cannot update chapter: chapter not found');
      return;
    }

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    setChapters(chapters.map(ch =>
      ch.id === id
        ? { ...ch, content, wordCount, lastEdited: new Date() }
        : ch
    ));
    
    try {
      console.log('Updating chapter:', id, 'Word count:', wordCount);
      await manuscriptApi.updateChapter(chapter.bookId, id, {
        content,
        wordCount,
        lastEdited: new Date(),
      });
    } catch (error) {
      console.error('Error updating chapter:', error);
    }
  };

  const addChapter = async (title?: string) => {
    if (!currentBookId) {
      console.error('Cannot add chapter: no book selected');
      return '';
    }
    
    const tempId = String(Date.now());
    const newChapter: Chapter = {
      id: tempId,
      bookId: currentBookId,
      title: title || `Chapter ${bookChapters.length + 1}`,
      content: '',
      wordCount: 0
    };
    setChapters([...chapters, newChapter]);
    
    try {
      const saved = await manuscriptApi.saveChapter(newChapter);
      setChapters((prev) =>
        prev.map((ch) => (ch.id === tempId ? { ...saved, bookId: currentBookId } : ch)),
      );
      return saved.id;
    } catch (error) {
      console.error('Error adding chapter:', error);
      // Remove optimistic chapter on failure
      setChapters((prev) => prev.filter((ch) => ch.id !== tempId));
    }
    
    return '';
  };

  const deleteChapter = async (id: string) => {
    const chapter = chapters.find(ch => ch.id === id);
    if (!chapter) {
      console.error('Cannot delete chapter: chapter not found');
      return;
    }

    setChapters(chapters.filter(ch => ch.id !== id));
    setThemeNotes(themeNotes.filter(note => note.chapterId !== id));

    try {
      console.log('Deleting chapter:', id);
      await manuscriptApi.deleteChapter(chapter.bookId, id);
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  const updateChapterTitle = async (id: string, title: string) => {
    const chapter = chapters.find(ch => ch.id === id);
    if (!chapter) {
      console.error('Cannot update chapter title: chapter not found');
      return;
    }

    setChapters(chapters.map(ch => ch.id === id ? { ...ch, title } : ch));

    try {
      console.log('Updating chapter title:', id, title);
      await manuscriptApi.updateChapter(chapter.bookId, id, { title });
    } catch (error) {
      console.error('Error updating chapter title:', error);
    }
  };

  const updateChapterDetails = async (id: string, updates: Partial<Chapter>) => {
    const chapter = chapters.find(ch => ch.id === id);
    if (!chapter) {
      console.error('Cannot update chapter details: chapter not found');
      return;
    }

    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeUpdates } = updates as any;
    setChapters(chapters.map(ch => ch.id === id ? { ...ch, ...safeUpdates } : ch));

    try {
      console.log('Updating chapter details:', id, safeUpdates);
      await manuscriptApi.updateChapter(chapter.bookId, id, safeUpdates);
    } catch (error) {
      console.error('Error updating chapter details:', error);
    }
  };

  const reorderChapters = async (reorderedChapters: Chapter[]) => {
    // Update sortOrder for all chapters
    const chaptersWithOrder = reorderedChapters.map((ch, index) => ({
      ...ch,
      sortOrder: index
    }));
    
    setChapters(chaptersWithOrder);
    
    try {
      // Save all chapter orders AND partId (in case chapters moved between parts)
      await Promise.all(
        chaptersWithOrder.map((ch) =>
          manuscriptApi.updateChapter(ch.bookId, ch.id, {
            sortOrder: ch.sortOrder,
            partId: ch.partId || null,
          }),
        ),
      );
    } catch (error) {
      console.error('Error reordering chapters:', error);
    }
  };

  // NEW: Handler for drag-and-drop reordering from ChapterList
  const handleReorderChapters = async (orderedIds: string[]) => {
    // Reorder the chapters array based on the orderedIds
    const idToChapter = new Map(chapters.map(ch => [ch.id, ch]));
    const reordered = orderedIds
      .map(id => idToChapter.get(id))
      .filter((ch): ch is Chapter => !!ch);

    // Append any chapters that weren't in orderedIds (just in case)
    const remaining = chapters.filter(ch => !orderedIds.includes(ch.id));
    const final = [...reordered, ...remaining];

    // Call existing reorderChapters function
    await reorderChapters(final);
  };

  // NEW: Multi-book support - Filter chapters and parts by current book
  const bookChapters = currentBookId 
    ? chapters.filter(ch => ch.bookId === currentBookId)
    : [];
  const bookParts = currentBookId
    ? parts.filter(p => p.bookId === currentBookId)
    : [];
  const bookThemes = currentBookId
    ? themes.filter(t => t.bookId === currentBookId)
    : [];
  const bookCharacters = currentBookId
    ? characters.filter(c => c.bookId === currentBookId)
    : [];

  // Sort chapters by sortOrder
  const sortedChapters = [...bookChapters].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  // NEW: Parts v1 - Get ordered chapters for display (parts ordering)
  const orderedChapters = getOrderedChapters(sortedChapters, bookParts);

  const addTheme = async (name?: string): Promise<Theme> => {
    if (!currentBookId) {
      console.error('Cannot add theme: no book selected');
      throw new Error('No book selected');
    }

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    const newTheme: Theme = {
      id: String(Date.now()),
      bookId: currentBookId,
      name: name || `Theme ${bookThemes.length + 1}`,
      color: colors[bookThemes.length % colors.length]
    };

    try {
      console.log('Adding new theme:', newTheme);
      const created = await manuscriptApi.saveTheme(newTheme);
      setThemes(prevThemes => [...prevThemes, created]);
      return created;
    } catch (error) {
      console.error('Error adding theme:', error);
      throw error;
    }
  };

  const updateTheme = async (id: string, name: string) => {
    if (!currentBookId) {
      console.error('Cannot update theme: no book selected');
      return;
    }

    setThemes(themes.map(t => t.id === id ? { ...t, name } : t));

    try {
      console.log('Updating theme:', id, name);
      await manuscriptApi.updateTheme(currentBookId, id, { name });
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const deleteTheme = async (id: string) => {
    if (!currentBookId) {
      console.error('Cannot delete theme: no book selected');
      return;
    }

    setThemes(themes.filter(t => t.id !== id));
    setThemeNotes(themeNotes.filter(note => note.themeId !== id));

    try {
      console.log('Deleting theme:', id);
      await manuscriptApi.deleteTheme(currentBookId, id);
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  const updateThemeNote = async (chapterId: string, themeId: string, note: string) => {
    const existing = themeNotes.find(
      tn => tn.chapterId === chapterId && tn.themeId === themeId
    );
    
    if (existing) {
      if (note === '') {
        setThemeNotes(themeNotes.filter(
          tn => !(tn.chapterId === chapterId && tn.themeId === themeId)
        ));
      } else {
        setThemeNotes(themeNotes.map(tn =>
          tn.chapterId === chapterId && tn.themeId === themeId
            ? { ...tn, note }
            : tn
        ));
      }
    } else if (note !== '') {
      setThemeNotes([...themeNotes, { chapterId, themeId, note }]);
    }
    
    try {
      console.log('Updating theme note:', chapterId, themeId, note);
      if (!currentBookId) {
        throw new Error('No book selected');
      }
      await manuscriptApi.saveThemeNote(currentBookId, { chapterId, themeId, note });
    } catch (error) {
      console.error('Error updating theme note:', error);
    }
  };

  // Grid 2.0: Comprehensive cell update function
  const updateThemeCell = async (
    chapterId: string,
    themeId: string,
    changes: Partial<ThemeNote>
  ) => {
    setThemeNotes(prev => {
      const existing = prev.find(tn => tn.chapterId === chapterId && tn.themeId === themeId);
      if (existing) {
        const updated = { ...existing, ...changes };
        return prev.map(tn =>
          tn.chapterId === chapterId && tn.themeId === themeId ? updated : tn
        );
      } else {
        const newNote: ThemeNote = {
          chapterId,
          themeId,
          note: changes.note ?? '',
          presence: changes.presence ?? false,
          intensity: changes.intensity ?? 0,
          threadRole: changes.threadRole,
        };
        return [...prev, newNote];
      }
    });

    // Save to backend
    const existing = themeNotes.find(tn => tn.chapterId === chapterId && tn.themeId === themeId);
    const cellData = {
      chapterId,
      themeId,
      note: changes.note ?? existing?.note ?? '',
      presence: changes.presence ?? existing?.presence ?? false,
      intensity: changes.intensity ?? existing?.intensity ?? 0,
      threadRole: changes.threadRole ?? existing?.threadRole,
    };

    try {
      if (!currentBookId) {
        throw new Error('No book selected');
      }
      await manuscriptApi.saveThemeNote(currentBookId, cellData);
    } catch (error) {
      console.error('Error updating theme cell:', error);
    }
  };

  // Character CRUD functions
  const addCharacter = async (values?: Partial<Character>) => {
    if (!currentBookId) {
      console.error('Cannot add character: no book selected');
      return '';
    }
    
    const colors = ['#3B82F6', '#EC4899', '#F97316', '#10B981', '#8B5CF6', '#EF4444'];
    const newCharacter: Character = {
      id: String(Date.now()),
      bookId: currentBookId,
      name: values?.name || `Character ${bookCharacters.length + 1}`,
      color: values?.color || colors[bookCharacters.length % colors.length],
      role: values?.role,
      notes: values?.notes,
    };
    setCharacters([...characters, newCharacter]);

    try {
      console.log('Adding new character:', newCharacter);
      await manuscriptApi.saveCharacter(newCharacter);
    } catch (error) {
      console.error('Error adding character:', error);
    }

    return newCharacter.id;
  };

  const updateCharacter = async (id: string, values: Partial<Character>) => {
    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeValues } = values as any;
    setCharacters(characters.map(c => c.id === id ? { ...c, ...safeValues } : c));

    try {
      console.log('Updating character:', id, safeValues);
      // Need to get the existing character to preserve bookId
      const existing = characters.find(c => c.id === id);
      if (existing) {
        await manuscriptApi.saveCharacter({ ...existing, ...safeValues } as Character);
      }
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  const deleteCharacter = async (id: string) => {
    if (!currentBookId) {
      console.error('Cannot delete character: no book selected');
      return;
    }

    setCharacters(characters.filter(c => c.id !== id));

    try {
      console.log('Deleting character:', id);
      await manuscriptApi.deleteCharacter(currentBookId, id);
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  // Enhanced theme update to support all fields
  const updateThemeDetails = async (id: string, values: Partial<Theme>) => {
    // CRITICAL: Never allow bookId to be overwritten
    const { bookId: _, ...safeValues } = values as any;
    setThemes(themes.map(t => t.id === id ? { ...t, ...safeValues } : t));

    try {
      console.log('Updating theme details:', id, safeValues);
      if (!currentBookId) {
        throw new Error('No book selected');
      }
      await manuscriptApi.updateTheme(currentBookId, id, safeValues);
    } catch (error) {
      console.error('Error updating theme details:', error);
    }
  };

  // NEW: Parts v1 - CRUD functions
  const addPart = async (data: { title: string; notes?: string }) => {
    if (!currentBookId) {
      console.error('Cannot add part: no book selected');
      throw new Error('No book selected');
    }
    
    console.log('🎯 Creating part with bookId:', currentBookId, 'title:', data.title);
    console.log('📚 Current book:', currentBook?.title);
    
    const part = await partService.createPart({ ...data, bookId: currentBookId });
    
    console.log('✅ Part created:', part);
    
    setParts([...parts, part]);
    return part;
  };

  const updatePartName = async (id: string, name: string) => {
    const part = parts.find(p => p.id === id);
    if (!part) {
      throw new Error('Part not found');
    }

    const updated = await partService.updatePart(part.bookId, id, { title: name });
    setParts(parts.map(p => p.id === id ? updated : p));
  };

  const updatePartDetails = async (id: string, data: Partial<Pick<Part, 'title' | 'notes'>>) => {
    const part = parts.find(p => p.id === id);
    if (!part) {
      throw new Error('Part not found');
    }

    const updated = await partService.updatePart(part.bookId, id, data);
    setParts(parts.map(p => p.id === id ? updated : p));
    return updated;
  };

  const deletePart = async (id: string) => {
    const part = parts.find(p => p.id === id);
    if (!part) {
      throw new Error('Part not found');
    }

    await partService.deletePart(part.bookId, id);
    setParts(parts.filter(p => p.id !== id));
    // Also clear partId from affected chapters
    setChapters(chapters.map(ch => ch.partId === id ? { ...ch, partId: null } : ch));
  };

  const reorderParts = async (reorderedParts: Part[]) => {
    // CRITICAL: When parts are reordered, we must reorder all chapters to maintain correct ordering
    // Build the new chapter order based on the new part order
    const reorderedChapters: Chapter[] = [];
    
    // Get current book's chapters directly from state
    const currentBookChapters = currentBookId
      ? chapters.filter(ch => ch.bookId === currentBookId)
      : [];
    
    // Process chapters in the new part order
    for (const part of reorderedParts) {
      const partChapters = currentBookChapters
        .filter(ch => ch.partId === part.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      
      reorderedChapters.push(...partChapters);
    }
    
    // Add unassigned chapters at the end
    const unassignedChapters = currentBookChapters
      .filter(ch => !ch.partId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    
    reorderedChapters.push(...unassignedChapters);
    
    // Assign new sortOrder values
    const chaptersWithNewOrder = reorderedChapters.map((ch, index) => ({
      ...ch,
      sortOrder: index
    }));
    
    // Update chapters state FIRST (synchronously), then update parts
    // This ensures the UI never shows an inconsistent state
    setChapters(prev => prev.map(ch => {
      const updated = chaptersWithNewOrder.find(c => c.id === ch.id);
      return updated || ch;
    }));
    
    // Now update parts state
    setParts(reorderedParts);
    
    // Persist to backend (async, but state is already updated)
    if (!currentBookId) {
      throw new Error('Cannot reorder parts without a selected book');
    }

    await partService.reorderParts(currentBookId, reorderedParts);
    
    try {
      await Promise.all(
        chaptersWithNewOrder.map(ch =>
          manuscriptApi.updateChapter(ch.bookId, ch.id, {
            sortOrder: ch.sortOrder,
            partId: ch.partId || null
          })
        )
      );
    } catch (error) {
      console.error('Error persisting chapter reorder:', error);
    }
  };

  // NEW: Multi-book support - Book handlers
  const handleSelectBook = async (bookId: string) => {
    setCurrentBookId(bookId);
    
    // Switch to editor view
    setPanes(prev => prev.map(p => 
      p.id === 'primary' ? { ...p, activeViewId: 'editor' } : p
    ));
    
    // Load book data
    try {
      setIsLoadingBookData(true);
    const data = await manuscriptApi.loadData(bookId);
      console.log('Loaded data for book', bookId, ':', data);
      
      setChapters(data.chapters);
      setThemes(data.themes);
      setCharacters(data.characters || []);
      setThemeNotes(data.themeNotes);
      setParts(data.parts || []);
      
      // Initialize primary pane with first chapter
      setPanes(prev => prev.map(p => 
        p.id === 'primary' ? { ...p, selectedChapterId: data.chapters[0]?.id || '' } : p
      ));
    } catch (error) {
      console.error('Error loading book data:', error);
    } finally {
      setIsLoadingBookData(false);
    }
  };
  
  const handleCreateBook = async (title: string, description: string) => {
    try {
      const newBook = await booksApi.create({
        title,
        description
      });
      
      setBooks([...books, newBook]);
      
      // Don't auto-navigate to the book - stay on library page
    } catch (error) {
      console.error('Error creating book:', error);
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
    // If current book is deleted, navigate to books view
    if (bookId === currentBookId) {
      setCurrentBookId(null);
      setPanes(prev => prev.map(p => 
        p.id === 'primary' ? { ...p, activeViewId: 'books' } : p
      ));
    }
  };

  const handleNavigateToBooks = () => {
    setPanes(prev => prev.map(p => 
      p.id === 'primary' ? { ...p, activeViewId: 'books' } : p
    ));
  };

  // NEW: Dual Pane v1 - Handler for App Menu (controls PRIMARY pane only)
  const handleAppMenuClick = (viewId: AppViewId) => {
    setPanes((prev) =>
      prev.map((p) =>
        p.id === 'primary' ? { ...p, activeViewId: viewId } : p
      )
    );
  };

  // NEW: Per-pane chapter selection handler
  const setCurrentChapterIdByPane = useMemo(
    () => ({
      primary: (chapterId: string) =>
        setPanes((prev) =>
          prev.map((p) =>
            p.id === "primary" ? { ...p, selectedChapterId: chapterId } : p,
          ),
        ),
      secondary: (chapterId: string) =>
        setPanes((prev) =>
          prev.map((p) =>
            p.id === "secondary" ? { ...p, selectedChapterId: chapterId } : p,
          ),
        ),
    }),
    [],
  );
  
  // NEW: UI Cohesion - Helper to create a card for corkboard
  const handleCreateCorkboardCard = () => {
    // This will be implemented by Corkboard internally
    console.log('Create card clicked - handled by corkboard');
  };
  
  // NEW: UI Cohesion - Function to render Context Bar for a view
  const renderContextBarForView = (viewId: AppViewId): React.ReactNode => {
    switch (viewId) {
      case 'editor':
        // UI Cohesion Pass - Empty Context Bar (to be populated in future phases)
        return <></>;
      
      case 'outline':
        // UI Cohesion Pass - Empty Context Bar (to be populated in future phases)
        return <></>;
      
      case 'corkboard':
        return (
          <>
            <div className="flex items-center gap-4">
              {/* Display Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={corkboardDisplayMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCorkboardDisplayMode('cards')}
                  className="rounded-r-none h-8"
                >
                  <LayoutGrid className="w-4 h-4 mr-1.5" />
                  Cards
                </Button>
                <Button
                  variant={corkboardDisplayMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCorkboardDisplayMode('list')}
                  className="rounded-l-none border-l h-8"
                >
                  <LayoutList className="w-4 h-4 mr-1.5" />
                  List
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search cards..."
                  value={corkboardSearchQuery}
                  onChange={(e) => setCorkboardSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleCreateCorkboardCard} 
                size="sm" 
                variant="outline"
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Card
              </Button>
            </div>
          </>
        );
      
      case 'grid':
        return (
          <>
            <div className="flex items-center gap-4">
              <h2 className="text-gray-900">Theme Tracker</h2>
              
              {/* Column Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Column size:</span>
                <div className="flex border rounded-lg">
                  <Button
                    variant={gridColumnSize === 'minimal' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridColumnSize('minimal')}
                    className="rounded-r-none h-7 text-xs px-2"
                  >
                    Minimal
                  </Button>
                  <Button
                    variant={gridColumnSize === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridColumnSize('compact')}
                    className="rounded-none border-l h-7 text-xs px-2"
                  >
                    Compact
                  </Button>
                  <Button
                    variant={gridColumnSize === 'full' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGridColumnSize('full')}
                    className="rounded-l-none border-l h-7 text-xs px-2"
                  >
                    Full
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setGridShowAddThemeDialog(true)} 
                size="sm" 
                variant="default"
                className="h-8 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Theme
              </Button>
              <Button 
                onClick={() => setGridShowAddChapterDialog(true)} 
                size="sm" 
                variant="default"
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Chapter
              </Button>
            </div>
          </>
        );
      
      case 'themes':
        return (
          <>
            <div className="flex items-center gap-4">
              {/* Display Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={themesDisplayMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemesDisplayMode('cards')}
                  className="rounded-r-none h-8"
                >
                  <LayoutGrid className="w-4 h-4 mr-1.5" />
                  Cards
                </Button>
                <Button
                  variant={themesDisplayMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemesDisplayMode('list')}
                  className="rounded-l-none border-l h-8"
                >
                  <LayoutList className="w-4 h-4 mr-1.5" />
                  List
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search themes..."
                  value={themesSearchQuery}
                  onChange={(e) => setThemesSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setThemeManagerShowAddDialog(true)} 
                size="sm" 
                variant="default"
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Theme
              </Button>
            </div>
          </>
        );
      
      case 'characters':
        return (
          <>
            <div className="flex items-center gap-4">
              {/* Display Mode Toggle */}
              <div className="flex border rounded-lg">
                <Button
                  variant={charactersDisplayMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCharactersDisplayMode('cards')}
                  className="rounded-r-none h-8"
                >
                  <LayoutGrid className="w-4 h-4 mr-1.5" />
                  Cards
                </Button>
                <Button
                  variant={charactersDisplayMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCharactersDisplayMode('list')}
                  className="rounded-l-none border-l h-8"
                >
                  <LayoutList className="w-4 h-4 mr-1.5" />
                  List
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Search characters..."
                  value={charactersSearchQuery}
                  onChange={(e) => setCharactersSearchQuery(e.target.value)}
                  className="pl-8 h-8 w-64"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setCharacterManagerShowAddDialog(true)} 
                size="sm" 
                variant="default"
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Character
              </Button>
            </div>
          </>
        );
      
      case 'parts':
        return (
          <>
            <div className="flex items-center gap-4">
              <h2 className="text-gray-900">Parts & Structure</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setPartsViewShowAddDialog(true)} 
                size="sm" 
                variant="default"
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Part
              </Button>
            </div>
          </>
        );
      
      case 'settings':
        // No context bar for settings
        return <></>;
      default:
        return null;
    }
  };

  // NEW: Dual Pane v1 - Pane helpers
  const hasSecondaryPane = panes.some((p) => p.id === 'secondary');
  const primaryPane = panes.find((p) => p.id === 'primary')!;
  const secondaryPane = panes.find((p) => p.id === 'secondary') || null;

  // NEW: Dual Pane v1 - Handler to change a pane's view
  const handleChangePaneView = (paneId: PaneId, viewId: AppViewId) => {
    setPanes((prev) =>
      prev.map((p) => (p.id === paneId ? { ...p, activeViewId: viewId } : p))
    );
  };

  // NEW: Dual Pane v1 - Handler to open secondary pane (vertical split)
  const handleSplitVertical = () => {
    setPanes((prev) => {
      // if secondary already exists, do nothing
      if (prev.some((p) => p.id === 'secondary')) return prev;

      const primary = prev.find((p) => p.id === 'primary')!;
      return [
        ...prev,
        { id: 'secondary', activeViewId: primary.activeViewId, selectedChapterId: '' },
      ];
    });
  };

  // NEW: Dual Pane v1 - Handler to close secondary pane
  const handleCloseSplit = () => {
    setPanes((prev) => prev.filter((p) => p.id === 'primary'));
  };

  // NEW: Onboarding Tour - Apply tour step layout when tour step changes
  useEffect(() => {
    if (!tourIsOpen || !tourCurrentStep) return;
    
    const applyTourStepLayout = (step: TourStep) => {
      if (step.route === 'library') {
        // Navigate to books view
        setPanes((prev) => 
          prev.map((p) => p.id === 'primary' ? { ...p, activeViewId: 'books' } : p)
        );
        return;
      }

      // route === 'manuscript'
      // Ensure some book is open; if none, open the first book
      if (!currentBookId && books.length > 0) {
        handleSelectBook(books[0].id);
      }

      // Get sorted chapters for consistent selection
      const currentBookChapters = currentBookId ? chapters.filter(ch => ch.bookId === currentBookId) : [];
      const sorted = [...currentBookChapters].sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

      // Handle inspector state
      if (step.inspectorOpen !== undefined) {
        if (step.inspectorOpen) {
          // Open inspector with Full Manuscript info
          if (step.manuscriptSelection === 'manuscript') {
            // Use setTimeout to ensure the DOM is ready
            setTimeout(() => {
              handleManuscriptInfoClick();
            }, 100);
          } else if (step.selectChapterIndex !== undefined && sorted.length > 0) {
            // Open inspector for selected chapter
            const chapterToSelect = sorted[step.selectChapterIndex];
            if (chapterToSelect) {
              setTimeout(() => {
                handleChapterInfoClick(chapterToSelect);
              }, 100);
            }
          }
        } else {
          closeInspector();
        }
      }

      // Handle chapter selection vs manuscript selection
      let selectedChapterId = '';
      let manuscriptSelection: ManuscriptSelection = { kind: 'manuscript' };
      
      if (step.selectChapterIndex !== undefined && sorted.length > 0) {
        const chapterToSelect = sorted[step.selectChapterIndex];
        if (chapterToSelect) {
          selectedChapterId = chapterToSelect.id;
          // Set selection to show chapter view
          if (step.manuscriptSelection !== 'manuscript') {
            manuscriptSelection = { kind: 'chapter', chapterId: chapterToSelect.id };
          }
        }
      } else if (step.manuscriptSelection === 'manuscript') {
        // Clear chapter selection for manuscript view
        selectedChapterId = '';
        manuscriptSelection = { kind: 'manuscript' };
      }
      
      // Update pane selections
      if (step.paneLayout === 'dual') {
        // For dual pane, update both panes
        setPaneSelections(prev => ({
          ...prev,
          primary: manuscriptSelection,
          secondary: manuscriptSelection
        }));
      } else if (step.viewId === 'editor') {
        // For single pane editor, update primary only
        setPaneSelections(prev => ({
          ...prev,
          primary: manuscriptSelection
        }));
      }

      if (step.paneLayout === 'dual') {
        // Enable dual pane mode
        const hasSecondary = panes.some((p) => p.id === 'secondary');
        
        if (!hasSecondary) {
          const leftView = step.leftViewId ?? 'editor';
          const rightView = step.rightViewId ?? 'outline';
          setPanes((prev) => {
            const primary = prev.find((p) => p.id === 'primary');
            if (!primary) return prev;
            return [
              { ...primary, activeViewId: leftView as AppViewId, selectedChapterId },
              { id: 'secondary', activeViewId: rightView as AppViewId, selectedChapterId },
            ];
          });
        } else {
          // Update existing panes
          const leftView = step.leftViewId ?? 'editor';
          const rightView = step.rightViewId ?? 'outline';
          setPanes((prev) => 
            prev.map((p) => {
              const updates: Partial<PaneState> = {};
              if (p.id === 'primary') updates.activeViewId = leftView as AppViewId;
              if (p.id === 'secondary') updates.activeViewId = rightView as AppViewId;
              // Always update selectedChapterId
              updates.selectedChapterId = selectedChapterId;
              return { ...p, ...updates };
            })
          );
        }
      } else {
        // Single pane default - close secondary if open
        setPanes((prev) => {
          const primary = prev.find((p) => p.id === 'primary');
          if (!primary) return prev;
          const view = step.viewId ?? 'editor';
          
          return [{ ...primary, activeViewId: view as AppViewId, selectedChapterId }];
        });
      }
    };

    applyTourStepLayout(tourCurrentStep);
  }, [tourIsOpen, tourCurrentStep, chapters, currentBook, currentBookId]);

  // NEW: Dual Pane v1 - Function to render any view by ID with pane-specific state
  const renderViewById = (viewId: AppViewId, paneId: PaneId) => {
    const pane = panes.find((p) => p.id === paneId);
    const currentChapterId = pane?.selectedChapterId || '';
    const setCurrentChapterId =
      setCurrentChapterIdByPane[paneId] || setCurrentChapterIdByPane.primary;

    // Show loading state while book data is loading (except for books view)
    if (isLoadingBookData && viewId !== 'books') {
      return (
        <div className="h-full flex items-center justify-center bg-white">
          <div className="text-gray-600">Loading book data...</div>
        </div>
      );
    }

    const commonProps = {
      chapters,
      themes,
      themeNotes,
      characters,
      parts,
      updateChapter,
      addChapter,
      deleteChapter,
      updateChapterTitle,
      updateChapterDetails,
      reorderChapters,
      updateThemeNote,
      updateThemeCell,
      addTheme,
      updateTheme,
      deleteTheme,
      updateThemeDetails,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      addPart,
      updatePartName,
      updatePartDetails,
      deletePart,
      reorderParts,
    };

    switch (viewId) {
      case 'books':
        return (
          <BooksView
            books={books}
            currentBookId={currentBookId}
            onSelectBook={handleSelectBook}
            onCreateBook={handleCreateBook}
            onUpdateBook={handleUpdateBook}
            onDeleteBook={handleDeleteBook}
          />
        );
      case 'editor':
        return (
          <BinderWrapper
            chapters={orderedChapters}
            parts={bookParts}
            bookTitle={currentBook?.title}
            selection={paneSelections[paneId] || { kind: 'manuscript' }}
            onSelectionChange={(selection) => setSelectionForPane(paneId, selection)}
            currentChapterId={currentChapterId}
            setCurrentChapterId={setCurrentChapterId}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            updateChapterDetails={updateChapterDetails}
            reorderChapters={reorderChapters}
            addPart={addPart}
            deletePart={deletePart}
            updatePartName={updatePartName}
            reorderParts={reorderParts}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
            setBreadcrumbData={breadcrumbSetters[paneId]}
            onChapterInfoClick={handleChapterInfoClick}
            onManuscriptInfoClick={handleManuscriptInfoClick}
            onPartInfoClick={handlePartInfoClick}
          >
            {(filteredChapters) => (
              <EditorView
                chapters={filteredChapters}
                selection={paneSelections[paneId] || { kind: 'manuscript' }}
                currentChapterId={currentChapterId}
                setCurrentChapterId={setCurrentChapterId}
                updateChapter={updateChapter}
                addChapter={addChapter}
                deleteChapter={deleteChapter}
                updateChapterTitle={updateChapterTitle}
                updateChapterDetails={updateChapterDetails}
                reorderChapters={reorderChapters}
                parts={bookParts}
                onChapterInfoClick={handleChapterInfoClick}
                onPartInfoClick={handlePartInfoClick}
              />
            )}
          </BinderWrapper>
        );
      case 'outline':
        return (
          <BinderWrapper
            chapters={orderedChapters}
            parts={bookParts}
            bookTitle={currentBook?.title}
            selection={paneSelections[paneId] || { kind: 'manuscript' }}
            onSelectionChange={(selection) => setSelectionForPane(paneId, selection)}
            currentChapterId={currentChapterId}
            setCurrentChapterId={setCurrentChapterId}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            updateChapterDetails={updateChapterDetails}
            reorderChapters={reorderChapters}
            addPart={addPart}
            deletePart={deletePart}
            updatePartName={updatePartName}
            reorderParts={reorderParts}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
            setBreadcrumbData={breadcrumbSetters[paneId]}
            onChapterInfoClick={handleChapterInfoClick}
            onManuscriptInfoClick={handleManuscriptInfoClick}
            onPartInfoClick={handlePartInfoClick}
          >
            {(filteredChapters) => (
              <OutlineView
                chapters={filteredChapters}
                selection={paneSelections[paneId] || { kind: 'manuscript' }}
                currentChapterId={currentChapterId}
                setCurrentChapterId={setCurrentChapterId}
                updateChapter={(id: string, outline: string) => updateChapterDetails(id, { outline })}
                addChapter={addChapter}
                deleteChapter={deleteChapter}
                updateChapterTitle={updateChapterTitle}
                parts={bookParts}
                onChapterInfoClick={handleChapterInfoClick}
                onPartInfoClick={handlePartInfoClick}
              />
            )}
          </BinderWrapper>
        );
      case 'grid':
        return (
          <GridView
            chapters={orderedChapters}
            themes={bookThemes}
            themeNotes={themeNotes}
            updateThemeNote={updateThemeNote}
            updateThemeCell={updateThemeCell}
            addTheme={addTheme}
            updateTheme={updateTheme}
            deleteTheme={deleteTheme}
            updateThemeDetails={updateThemeDetails}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            characters={bookCharacters}
            parts={bookParts}
            showAddThemeDialog={gridShowAddThemeDialog}
            setShowAddThemeDialog={setGridShowAddThemeDialog}
            showAddChapterDialog={gridShowAddChapterDialog}
            setShowAddChapterDialog={setGridShowAddChapterDialog}
            columnSize={gridColumnSize}
            setColumnSize={setGridColumnSize}
          />
        );
      case 'corkboard':
        return (
          <BinderWrapper
            chapters={orderedChapters}
            parts={bookParts}
            bookTitle={currentBook?.title}
            selection={paneSelections[paneId] || { kind: 'manuscript' }}
            onSelectionChange={(selection) => setSelectionForPane(paneId, selection)}
            currentChapterId={currentChapterId}
            setCurrentChapterId={setCurrentChapterId}
            addChapter={addChapter}
            deleteChapter={deleteChapter}
            updateChapterTitle={updateChapterTitle}
            updateChapterDetails={updateChapterDetails}
            reorderChapters={reorderChapters}
            addPart={addPart}
            deletePart={deletePart}
            updatePartName={updatePartName}
            reorderParts={reorderParts}
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
            setBreadcrumbData={breadcrumbSetters[paneId]}
            onChapterInfoClick={handleChapterInfoClick}
            onManuscriptInfoClick={handleManuscriptInfoClick}
            onPartInfoClick={handlePartInfoClick}
          >
            {(filteredChapters) => (
              <Corkboard
                bookId={currentBookId}
                chapters={filteredChapters}
                parts={bookParts}
                bookTitle={currentBook?.title}
                selection={paneSelections[paneId] || { kind: 'manuscript' }}
                onSelectionChange={(selection) => setSelectionForPane(paneId, selection)}
                addPart={addPart}
                deletePart={deletePart}
                updatePartName={updatePartName}
                reorderParts={reorderParts}
                updateChapterTitle={updateChapterTitle}
                updateChapterDetails={updateChapterDetails}
                deleteChapter={deleteChapter}
                addChapter={addChapter}
                reorderChapters={reorderChapters}
                displayMode={corkboardDisplayMode}
                onDisplayModeChange={setCorkboardDisplayMode}
                searchQuery={corkboardSearchQuery}
                onSearchQueryChange={setCorkboardSearchQuery}
                leftSidebarOpen={leftSidebarOpen}
                setLeftSidebarOpen={setLeftSidebarOpen}
              />
            )}
          </BinderWrapper>
        );
      case 'themes':
        return (
          <ThemeManager
            themes={bookThemes}
            characters={bookCharacters}
            addTheme={addTheme}
            updateThemeDetails={updateThemeDetails}
            deleteTheme={deleteTheme}
            showAddDialog={themeManagerShowAddDialog}
            setShowAddDialog={setThemeManagerShowAddDialog}
            displayMode={themesDisplayMode}
            onDisplayModeChange={setThemesDisplayMode}
            searchQuery={themesSearchQuery}
            onSearchQueryChange={setThemesSearchQuery}
          />
        );
      case 'characters':
        return (
          <CharacterManager
            characters={bookCharacters}
            addCharacter={addCharacter}
            updateCharacter={updateCharacter}
            deleteCharacter={deleteCharacter}
            showAddDialog={characterManagerShowAddDialog}
            setShowAddDialog={setCharacterManagerShowAddDialog}
            displayMode={charactersDisplayMode}
            onDisplayModeChange={setCharactersDisplayMode}
            searchQuery={charactersSearchQuery}
            onSearchQueryChange={setCharactersSearchQuery}
          />
        );
      case 'parts':
        return (
          <PartsView
            parts={bookParts}
            onUpdate={setParts}
            onAdd={addPart}
            onUpdatePart={updatePartDetails}
            onDelete={deletePart}
            onReorder={reorderParts}
            showAddDialog={partsViewShowAddDialog}
            setShowAddDialog={setPartsViewShowAddDialog}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading your story...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ChapterNumberingProvider chapters={orderedChapters} parts={bookParts} currentBook={currentBook}>
        <div className="h-screen flex bg-gray-50">
          <Toaster />
          
          {/* Left Sidebar Navigation */}
          <div data-tour-id="appRail" className="w-16 bg-[rgb(96,129,142)] border-r border-slate-700 flex flex-col items-center py-4 gap-1.5">
            {/* Logo - clickable to navigate to books */}
            <div className="border-b border-slate-700 pb-3 mb-1">
              <button 
                onClick={handleNavigateToBooks}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                  primaryPane.activeViewId === 'books'
                    ? 'bg-[#7d9ca8] text-white shadow-lg shadow-black/20'
                    : 'text-slate-300 hover:bg-[#4a6370] hover:text-white'
                }`}
              >
                <img src={StoryLabLogo} alt="StoryLab" className="w-10 h-10 object-contain" />
              </button>
            </div>
            
            {/* Main navigation */}
            <div className="flex-1 flex flex-col gap-1.5">
              {/* NEW: Render navigation from APP_VIEWS registry - hide book-specific views when in Books view */}
              {APP_VIEWS
                .filter((viewDef) => viewDef.id !== 'books') // Remove Books button since logo already navigates to books
                .filter((viewDef) => primaryPane.activeViewId !== 'books' || viewDef.id === 'books')
                .filter((viewDef) => viewDef.showInNav !== false) // Hide views that shouldn't show in main nav (like settings)
                .map((viewDef) => {
                  const Icon = viewDef.icon;
                  const isActive = primaryPane.activeViewId === viewDef.id;
                  return (
                    <div key={viewDef.id}>
                      {viewDef.dividerBefore && (
                        <div className="h-px bg-slate-700 my-2 mx-1" />
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleAppMenuClick(viewDef.id)}
                            className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60818E] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(96,129,142)] ${
                              isActive
                                ? 'bg-[#7d9ca8] text-white shadow-lg shadow-black/20'
                                : 'text-slate-300 hover:bg-[#4a6370] hover:text-white'
                            }`}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white/40 rounded-r-full" />
                            )}
                            <Icon className="w-5 h-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{viewDef.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
            </div>

            {/* Profile and Settings at bottom */}
            <div data-tour-id="settings" className="flex flex-col gap-1.5 border-t border-slate-700 pt-3 mt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setFeedbackModalOpen(true)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60818E] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(96,129,142)] text-slate-300 hover:bg-[#4a6370] hover:text-white"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Send Feedback</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSettingsOverlayOpen(true)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60818E] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(96,129,142)] text-slate-300 hover:bg-[#4a6370] hover:text-white"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ProfileMenu />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Profile</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* NEW: Dual Pane v1 - Restructured layout */}
            <div className="flex flex-1 min-h-0 min-w-0 relative">
              {/* Left side: Content + StatusBar */}
              <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <div className="flex flex-1 min-h-0 min-w-0 relative">
                  {/* Primary pane */}
                  <Pane
                    paneId="primary"
                    activeViewId={primaryPane.activeViewId}
                    onChangeView={handleChangePaneView}
                    bookTitle={currentBook?.title}
                    hasSecondaryPane={hasSecondaryPane}
                    onSplitVertical={handleSplitVertical}
                    onCloseSplit={handleCloseSplit}
                    breadcrumbData={breadcrumbData["primary"]}
                    contextBar={renderContextBarForView(primaryPane.activeViewId)}
                  >
                    {renderViewById(primaryPane.activeViewId, 'primary')}
                  </Pane>

                  {/* Optional secondary pane */}
                  {secondaryPane && (
                    <>
                      {/* Subtle separator between panes */}
                      <div className="w-px bg-gray-200 flex-shrink-0" />
                      <Pane
                        paneId="secondary"
                        activeViewId={secondaryPane.activeViewId}
                        onChangeView={handleChangePaneView}
                        bookTitle={currentBook?.title}
                        hasSecondaryPane={hasSecondaryPane}
                        onCloseSplit={handleCloseSplit}
                        breadcrumbData={breadcrumbData["secondary"]}
                        contextBar={renderContextBarForView(secondaryPane.activeViewId)}
                      >
                        {renderViewById(secondaryPane.activeViewId, 'secondary')}
                      </Pane>
                    </>
                  )}
                  
                  {/* Phase 1.5 - InspectorSidebar positioned between content and ToolRail */}
                  {primaryPane.activeViewId !== 'books' && <InspectorSidebar />}
                </div>
                
                {/* NEW: UI Cohesion - Status Bar (hidden on books view) */}
                {primaryPane.activeViewId !== 'books' && (
                  <StatusBar
                    leftContent={
                      <>
                        <span>View: {primaryPane.activeViewId}</span>
                      </>
                    }
                    rightContent={
                      <>
                        <span>{bookChapters.length} chapters</span>
                        <span>{bookChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0).toLocaleString()} words</span>
                      </>
                    }
                  />
                )}
              </div>
              
              {/* Phase 1.5 - Tool Rail at far right, extends full height */}
              {primaryPane.activeViewId !== 'books' && <ToolRail />}
            </div>
          </div>
        </div>
        
        {/* Settings Overlay */}
        <SettingsOverlay
          isOpen={settingsOverlayOpen}
          onClose={() => setSettingsOverlayOpen(false)}
          currentBook={currentBook}
          updateBookSettings={async (updates) => {
            if (!currentBook) return;
            try {
            const updatedBook = await booksApi.update(currentBook.id, updates);
              setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
            } catch (error) {
              console.error('Error updating book settings:', error);
            }
          }}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
        />
      </ChapterNumberingProvider>
    </TooltipProvider>
  );
}

function ProtectedApp() {
  const [activePaneId, setActivePaneId] = useState<PaneId>("primary");

  return (
    <OnboardingTourProvider>
      <TagFilterProvider>
        <FilterProvider
          activePaneId={activePaneId}
          onActivePaneChange={setActivePaneId}
        >
          <InspectorProvider>
            <AppContent />
            <SearchAndFilterOverlay />
            <OnboardingTourOverlay />
          </InspectorProvider>
        </FilterProvider>
      </TagFilterProvider>
    </OnboardingTourProvider>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              StoryLab
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
              The writer&apos;s OS for outlining, drafting, and story structure.
            </h1>
            <p className="mt-3 text-slate-300 max-w-2xl">
              Multi-view workspace (manuscript, outline, grid, corkboard), rich tagging, parts/chapters, and inspectors—built for long-form writing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/auth/signin"
              className="text-sm text-slate-300 hover:text-white underline underline-offset-4"
            >
              Go to sign-in
            </a>
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center justify-center rounded-lg bg-white text-slate-900 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition"
            >
              Sign in with Google
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {[
            { title: "Manuscript + Outline", desc: "Dual-pane binder, outline fields, parts/chapters with drag and drop." },
            { title: "Grid & Themes", desc: "Track themes/threads, intensity, and notes per chapter with filters." },
            { title: "Corkboard & Tags", desc: "Cards by book/part/chapter scopes, tag filtering, inspector-driven editing." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)]"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Ready to write?</h2>
              <p className="text-slate-300">
                Sign in with Google to open your workspace. More providers and billing will follow.
              </p>
            </div>
            <button
              onClick={() => signIn("google")}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 text-slate-900 px-5 py-2.5 text-sm font-semibold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  if (status !== "authenticated") {
    return <LandingPage />;
  }

  return <ProtectedApp />;
}

function ProfileMenu() {
  const { data } = useSession();
  const user = data?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all text-slate-300 hover:bg-[#4a6370] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60818E] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(96,129,142)]"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-9 h-9 rounded-lg object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            )}
          </button>

          {open && (
            <div className="absolute left-14 bottom-0 translate-y-[-12px] z-50 w-64 rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur p-3 text-left">
              <div className="flex items-center gap-3 mb-3">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white font-semibold truncate">
                    {user?.name || "Signed in"}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="w-full rounded-lg bg-slate-800 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Profile</p>
      </TooltipContent>
    </Tooltip>
  );
}
