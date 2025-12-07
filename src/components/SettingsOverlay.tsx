import { useState, useEffect } from 'react';
import { Book } from '../types/book';
import { Info, Play, X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Button } from './ui/button';
import { useOnboardingTour } from '../onboarding/OnboardingTourContext';

type SettingsOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book | null;
  updateBookSettings: (updates: Partial<Book>) => Promise<void>;
};

export function SettingsOverlay({ isOpen, onClose, currentBook, updateBookSettings }: SettingsOverlayProps) {
  const { startTour } = useOnboardingTour();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [initialChapterNumbering, setInitialChapterNumbering] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNeedsRefresh(false);
      setInitialChapterNumbering(currentBook?.chapterNumbering || 'per-book');
    }
  }, [isOpen, currentBook?.chapterNumbering]);

  if (!isOpen) return null;

  const chapterNumbering = currentBook?.chapterNumbering || 'per-book';

  const handleChapterNumberingChange = async (value: 'per-book' | 'per-part') => {
    setIsUpdating(true);
    try {
      await updateBookSettings({ chapterNumbering: value });
      // Only mark for refresh if the value actually changed from initial
      if (value !== initialChapterNumbering) {
        setNeedsRefresh(true);
      } else {
        setNeedsRefresh(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    // Prevent closing while an update is in progress
    if (isUpdating) return;
    
    // If we need to refresh, just reload immediately without closing
    if (needsRefresh) {
      window.location.reload();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-600">Configure your preferences</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="space-y-8">
            {/* APP SETTINGS - Always visible */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">App Settings</h3>
              <div className="space-y-4">
                {/* Onboarding Tour Section */}
                <section className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold text-gray-900">Onboarding Tour</h2>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Take a quick tour of StoryLab's main features and interface.
                  </p>
                  <Button
                    onClick={() => {
                      startTour();
                      onClose();
                    }}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Restart Tour
                  </Button>
                </section>
              </div>
            </div>

            {/* BOOK SETTINGS - Only visible when a book is selected */}
            {currentBook && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Settings</h3>
                <div className="space-y-4">
                  {/* Chapter Numbering Section */}
                  <section className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-sm font-semibold text-gray-900">Chapter Numbering</h2>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs z-[10000]">
                          <p className="text-xs">
                            Choose how chapter numbers are calculated. Continuous numbering counts chapters across the entire book (1, 2, 3...), 
                            while restart per part resets to 1 at the beginning of each part.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex gap-4">
                      {/* Per Book Option */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="chapterNumbering"
                          value="per-book"
                          checked={chapterNumbering === 'per-book'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChapterNumberingChange('per-book');
                            }
                          }}
                          className="w-4 h-4 text-[#60818E] border-gray-300 focus:ring-[#60818E] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          Continuous
                        </span>
                      </label>

                      {/* Per Part Option */}
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="chapterNumbering"
                          value="per-part"
                          checked={chapterNumbering === 'per-part'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleChapterNumberingChange('per-part');
                            }
                          }}
                          className="w-4 h-4 text-[#60818E] border-gray-300 focus:ring-[#60818E] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          Restart per part
                        </span>
                      </label>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={handleClose} variant="default">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}