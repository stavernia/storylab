import { useState, useEffect } from 'react';
import { Character } from '../App';
import { CharacterInfoForm } from './info-forms/CharacterInfoForm';
import { InfoPanelModal } from './shared/InfoPanelModal';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Edit2, Trash2, Plus, User, GripVertical, Users } from 'lucide-react';
import { useInspector } from '../contexts/InspectorContext';
import { Tag, tagService } from '../services/tag';

interface CharacterManagerProps {
  characters: Character[];
  addCharacter: (values?: Partial<Character>) => Promise<string>;
  updateCharacter: (id: string, values: Partial<Character>) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  // NEW: UI Cohesion - Lifted state for Context Bar controls
  showAddDialog?: boolean;
  setShowAddDialog?: (show: boolean) => void;
  // NEW: Manager Consistency - Display mode and search
  displayMode?: 'cards' | 'list';
  onDisplayModeChange?: (mode: 'cards' | 'list') => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

// Helper to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function CharacterManager({
  characters,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  showAddDialog,
  setShowAddDialog,
  displayMode = 'cards',
  onDisplayModeChange,
  searchQuery = '',
  onSearchQueryChange,
}: CharacterManagerProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [characterTags, setCharacterTags] = useState<Tag[]>([]);
  const [characterFormValues, setCharacterFormValues] = useState<Partial<Character>>({});

  // NEW: Inspector v2
  const { openInspector, closeInspector } = useInspector();

  // Load tags when character is selected
  useEffect(() => {
    if (selectedCharacter) {
      loadCharacterTags(selectedCharacter.id);
    } else {
      setCharacterTags([]);
    }
  }, [selectedCharacter?.id]);

  const loadCharacterTags = async (characterId: string) => {
    // Guard: don't load if characterId is empty or invalid
    if (!characterId || characterId.trim() === '') {
      setCharacterTags([]);
      return;
    }
    
    try {
      const tags = await tagService.listForEntity('character', characterId);
      setCharacterTags(tags);
    } catch (error) {
      console.error('Failed to load character tags:', error);
      setCharacterTags([]);
    }
  };

  // NEW: Inspector handler for character details
  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setCharacterFormValues({
      name: character.name,
      role: character.role,
      color: character.color,
      notes: character.notes,
      motivation: character.motivation,
      backstory: character.backstory,
    });
    loadCharacterTags(character.id);
    
    openInspector({
      title: character.name,
      subtitle: 'Character',
      icon: <User className="w-5 h-5" />,
      content: (
        <CharacterInfoForm
          character={character}
          onSubmit={async (values) => {
            await updateCharacter(character.id, values);
            closeInspector();
          }}
          onClose={closeInspector}
        />
      ),
    });
  };

  const handleCreateCharacter = async (values: Partial<Character>) => {
    await addCharacter(values);
    setIsCreating(false);
    (setShowAddDialog ?? setIsCreating)(false);
  };

  const handleUpdateCharacter = async (values: Partial<Character>) => {
    if (selectedCharacter) {
      await updateCharacter(selectedCharacter.id, values);
      setSelectedCharacter(null);
    }
  };

  const handleDeleteCharacter = async (id: string, name: string) => {
    if (confirm(`Delete character "${name}"? This action cannot be undone.`)) {
      await deleteCharacter(id);
    }
  };

  // NEW: Filter characters based on search query
  const filteredCharacters = characters.filter(character => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      character.name.toLowerCase().includes(query) ||
      character.role?.toLowerCase().includes(query) ||
      character.notes?.toLowerCase().includes(query)
    );
  });

  // NEW: Cards View
  const renderCardsView = () => {
    if (filteredCharacters.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>
              {searchQuery ? 'No characters match your search.' : 'No characters yet. Click "Add Character" to create one.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-6 auto-rows-min">
        {filteredCharacters.map((character) => (
          <div
            key={character.id}
            onClick={() => handleEditCharacter(character)}
            className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 border border-gray-200 hover:border-gray-300"
          >
            {/* Avatar with initials */}
            <div className="flex flex-col items-center mb-3">
              <Avatar className="w-16 h-16 mb-2">
                <AvatarFallback 
                  className="text-white text-lg"
                  style={{ backgroundColor: character.color }}
                >
                  {getInitials(character.name)}
                </AvatarFallback>
              </Avatar>
              
              {/* Character name */}
              <h3 className="text-center truncate w-full">{character.name}</h3>
              
              {/* Role tag */}
              {character.role && (
                <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 mt-1">
                  {character.role}
                </span>
              )}
            </div>

            {/* Color indicator dot */}
            <div 
              className="absolute top-2 left-2 w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: character.color }}
            />

            {/* Delete button - appears on hover */}
            <button
              className="absolute top-2 right-2 p-1 rounded-md bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCharacter(character.id, character.name);
              }}
              aria-label="Delete character"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Character Card Placeholder */}
        <button
          onClick={() => (setShowAddDialog ?? setIsCreating)(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-100 transition-colors p-4 flex flex-col items-center justify-center min-h-[140px] text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-6 h-6 mb-2" />
          <span className="text-sm">Add Character</span>
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
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCharacters.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  {searchQuery ? 'No characters match your search.' : 'No characters yet. Click "Add Character" to create one.'}
                </td>
              </tr>
            ) : (
              filteredCharacters.map((character) => (
                <tr
                  key={character.id}
                  onClick={() => handleEditCharacter(character)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group h-[52px]"
                >
                  <td className="px-3 py-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: character.color }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback 
                          className="text-white text-xs"
                          style={{ backgroundColor: character.color }}
                        >
                          {getInitials(character.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-gray-900">{character.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600">
                      {character.role || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 truncate max-w-md">
                      {character.notes || '—'}
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
        title="Create New Character"
      >
        <CharacterInfoForm
          onSubmit={handleCreateCharacter}
          onClose={() => (setShowAddDialog ?? setIsCreating)(false)}
        />
      </InfoPanelModal>
    </div>
  );
}