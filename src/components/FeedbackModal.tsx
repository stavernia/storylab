import { useState } from 'react';
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

  if (!isOpen) return null;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot must be less than 5MB');
        return;
      }
      setScreenshot(file);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (activeTab === 'bug') {
      if (!whatTrying.trim() || !whatHappened.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      if (!suggestion.trim()) {
        toast.error('Please fill in your suggestion');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual feedback submission to backend
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Thank you for your feedback!');
      
      // Reset form
      setEmail('');
      setWhatTrying('');
      setWhatHappened('');
      setScreenshot(null);
      setSuggestion('');
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
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
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}