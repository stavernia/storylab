"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackTab = 'bug' | 'suggestion';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('bug');
  const [email, setEmail] = useState('');
  const [whatTrying, setWhatTrying] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pathname = usePathname();

  const isBugValid = useMemo(
    () => Boolean(whatTrying.trim()) && Boolean(whatHappened.trim()),
    [whatHappened, whatTrying],
  );

  const isSuggestionValid = useMemo(() => Boolean(suggestion.trim()), [suggestion]);

  const isSubmitDisabled = useMemo(
    () => isSubmitting || (activeTab === 'bug' ? !isBugValid : !isSuggestionValid),
    [activeTab, isBugValid, isSubmitting, isSuggestionValid],
  );

  const resetForm = () => {
    setEmail('');
    setWhatTrying('');
    setWhatHappened('');
    setScreenshot(null);
    setSuggestion('');
  };

  if (!isOpen) return null;

  const handleScreenshotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot must be less than 5MB');
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const trimmedTrying = whatTrying.trim();
    const trimmedHappened = whatHappened.trim();
    const trimmedSuggestion = suggestion.trim();
    const trimmedEmail = email.trim();

    if (activeTab === 'bug' ? !isBugValid : !isSuggestionValid) {
      toast.error('Please fill in all required fields');
      return;
    }

    const message =
      activeTab === 'bug'
        ? `Bug report\nWhat were you trying to do?\n${trimmedTrying}\n\nWhat happened instead?\n${trimmedHappened}`
        : `Suggestion\n${trimmedSuggestion}`;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          pagePath: pathname ?? undefined,
          contactEmail: trimmedEmail || undefined,
          context:
            activeTab === 'bug'
              ? {
                  type: 'bug',
                  whatTrying: trimmedTrying,
                  whatHappened: trimmedHappened,
                  contactEmail: trimmedEmail || undefined,
                }
              : {
                  type: 'suggestion',
                  suggestion: trimmedSuggestion,
                  contactEmail: trimmedEmail || undefined,
                },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const errorMessage = data?.error ?? 'Failed to submit feedback';
        throw new Error(errorMessage);
      }

      toast.success('Thank you for your feedback!');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('bug')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'bug'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bug
          </button>
          <button
            onClick={() => setActiveTab('suggestion')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'suggestion'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Suggestion
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 h-[400px] overflow-y-auto">
          {activeTab === 'bug' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="whatTrying" className="block text-sm font-medium text-gray-700 mb-1">
                  What were you trying to do? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="whatTrying"
                  value={whatTrying}
                  onChange={(e) => setWhatTrying(e.target.value)}
                  placeholder="Describe what you were trying to accomplish..."
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label htmlFor="whatHappened" className="block text-sm font-medium text-gray-700 mb-1">
                  What happened instead? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="whatHappened"
                  value={whatHappened}
                  onChange={(e) => setWhatHappened(e.target.value)}
                  placeholder="Describe what actually happened..."
                  className="w-full min-h-[80px]"
                />
              </div>

              <div>
                <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-1">
                  Screenshot <span className="text-gray-400">(optional)</span>
                </label>
                <div className="mt-1">
                  <label
                    htmlFor="screenshot"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      {screenshot ? screenshot.name : 'Choose a file or drag it here'}
                    </span>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                  {screenshot && (
                    <p className="mt-2 text-xs text-gray-500">
                      {(screenshot.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-1">
                  How can we improve? <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="Share your ideas and suggestions..."
                  className="w-full min-h-[160px]"
                />
              </div>
            </div>
          )}

          {/* Email field (shown on both tabs) */}
          <div className="mt-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Your email <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
