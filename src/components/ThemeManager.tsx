import { useState, useEffect } from 'react';
import { Theme, Character } from '@/App';
import { ThemeInfoForm } from './info-forms/ThemeInfoForm';
import { InfoPanelModal } from './shared/InfoPanelModal';
import { Button } from './ui/button';
import { Edit2, Trash2, Plus, Info, Palette, GripVertical } from 'lucide-react';
import { themeService, ThemeData } from '@/services/theme';
import { useInspector } from '@/contexts/InspectorContext';
import { Tag, tagService } from '@/services/tag';

interface ThemeManagerProps {
  themes: Theme[];
  characters: Character[];
  addTheme: (name?: string) => Promise<Theme>;
  updateThemeDetails: (id: string, values: Partial<Theme>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  showAddDialog?: boolean;
  setShowAddDialog?: (show: boolean) => void;
  // NEW: Manager Consistency - Display mode and search
  displayMode?: 'cards' | 'list';
  onDisplayModeChange?: (mode: 'cards' | 'list') => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function ThemeManager({
  themes,
  characters,
  addTheme,
  updateThemeDetails,
  deleteTheme,
  showAddDialog,
  setShowAddDialog,
  displayMode = 'cards',
  onDisplayModeChange,
  searchQuery = '',
  onSearchQueryChange,
}: ThemeManagerProps) {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [themeTags, setThemeTags] = useState<Tag[]>([]);
  const [themeFormValues, setThemeFormValues] = useState<Partial<ThemeData>>({});

  // NEW: Inspector v2
  const { openInspector, closeInspector } = useInspector();

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
      console.error('Failed to load theme tags:', error);
      setThemeTags([]);
    }
  };

  // NEW: Inspector handler for theme details
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
    
    // Open inspector immediately
    openInspector({
      title: theme.name,
      subtitle: 'Theme',
      icon: <Palette className="w-5 h-5" />,
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

  // Update inspector content when selectedTheme data changes OR tags load
  useEffect(() => {
    if (selectedTheme) {
      openInspector({
        title: selectedTheme.name,
        subtitle: 'Theme',
        icon: <Palette className="w-5 h-5" />,
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

  const handleCreateTheme = async (values: any) => {
    try {
      const createdTheme = await addTheme(values.name);
      // Update with full details including Grid 2.0 fields
      await updateThemeDetails(createdTheme.id, values);
    } catch (error) {
      console.error('Failed to create theme:', error);
    } finally {
      setIsCreating(false);
      (setShowAddDialog ?? setIsCreating)(false);
    }
  };

  const handleUpdateTheme = async (values: any) => {
    if (selectedTheme) {
      await updateThemeDetails(selectedTheme.id, values);
      setSelectedTheme(null);
    }
  };

  const handleDeleteTheme = async (id: string, name: string) => {
    if (confirm(`Delete theme "${name}"? This will also delete all associated notes.`)) {
      await deleteTheme(id);
    }
  };

  const getSourceLabel = (theme: Theme) => {
    const source = theme.source || 'theme';
    if (source === 'character' && theme.sourceRefId) {
      const char = characters.find(c => c.id === theme.sourceRefId);
      return char ? `Character: ${char.name}` : 'Character';
    }
    return source.charAt(0).toUpperCase() + source.slice(1);
  };

  const getModeLabel = (theme: Theme) => {
    const mode = theme.mode || 'presence';
    return mode === 'presence' ? 'Presence (✔/✖)' : 'Heatmap (0–3)';
  };

  // NEW: Filter themes based on search query
  const filteredThemes = themes.filter(theme => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      theme.name.toLowerCase().includes(query) ||
      theme.description?.toLowerCase().includes(query) ||
      theme.notes?.toLowerCase().includes(query)
    );
  });

  // NEW: Cards View
  const renderCardsView = () => {
    if (filteredThemes.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Palette className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>
              {searchQuery ? 'No themes match your search.' : 'No themes yet. Click "Add Theme" to create one.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-6 auto-rows-min">
        {filteredThemes.map((theme) => (
          <div
            key={theme.id}
            onClick={() => handleOpenThemeInspector(theme)}
            className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border border-gray-200 hover:border-gray-300"
          >
            {/* Color dot */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 border-2 border-gray-200"
                style={{ backgroundColor: theme.color }}
              />
            </div>

            {/* Theme name */}
            <h3 className="truncate mb-1">{theme.name}</h3>

            {/* Description preview */}
            {theme.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {theme.description}
              </p>
            )}

            {/* Delete button - appears on hover */}
            <button
              className="absolute top-2 right-2 p-1 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTheme(theme.id, theme.name);
              }}
              aria-label="Delete theme"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Theme Card Placeholder */}
        <button
          onClick={() => (setShowAddDialog ?? setIsCreating)(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-100 transition-colors p-4 flex flex-col items-center justify-center min-h-[120px] text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-6 h-6 mb-2" />
          <span className="text-sm">Add Theme</span>
        </button>
      </div>
    );
  };

  // NEW: List View
  const renderListView = () => {
    return (
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 z-10">
            <tr>
              <th className="w-12"></th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Color
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Mode
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredThemes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? 'No themes match your search.' : 'No themes yet. Click "Add Theme" to create one.'}
                </td>
              </tr>
            ) : (
              filteredThemes.map((theme) => (
                <tr
                  key={theme.id}
                  onClick={() => handleOpenThemeInspector(theme)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group h-[52px]"
                >
                  <td className="px-3 py-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.color }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{theme.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 truncate max-w-md">
                      {theme.description || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {getSourceLabel(theme)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {getModeLabel(theme)}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Main content - cards or list */}
      {displayMode === 'cards' ? renderCardsView() : renderListView()}

      {/* Create Modal */}
      <InfoPanelModal
        isOpen={showAddDialog ?? isCreating}
        onClose={() => (setShowAddDialog ?? setIsCreating)(false)}
        title="Create New Theme"
      >
        <ThemeInfoForm
          characters={characters}
          tags={themeTags}
          onSubmit={handleCreateTheme}
          onClose={() => (setShowAddDialog ?? setIsCreating)(false)}
        />
      </InfoPanelModal>
    </div>
  );
}