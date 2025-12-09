import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Chapter } from '@/App';
import { useDebounce } from '@/hooks/useDebounce';
import { defaultOutlineFieldConfig } from '@/config/outlineFields';

interface OutlineMetadataPanelProps {
  chapter: Chapter;
  updateChapterDetails: (id: string, updates: Partial<Chapter>) => void;
}

export function OutlineMetadataPanel({ chapter, updateChapterDetails }: OutlineMetadataPanelProps) {
  const [outlinePOV, setOutlinePOV] = useState('');
  const [outlinePurpose, setOutlinePurpose] = useState('');
  const [outlineEstimate, setOutlineEstimate] = useState<number | undefined>(undefined);
  const [outlineGoal, setOutlineGoal] = useState('');
  const [outlineConflict, setOutlineConflict] = useState('');
  const [outlineStakes, setOutlineStakes] = useState('');
  const [customFields, setCustomFields] = useState<{[key: string]: string}>({});

  // Load chapter data when chapter changes
  useEffect(() => {
    if (chapter) {
      setOutlinePOV(chapter.outlinePOV || '');
      setOutlinePurpose(chapter.outlinePurpose || '');
      setOutlineEstimate(chapter.outlineEstimate);
      setOutlineGoal(chapter.outlineGoal || '');
      setOutlineConflict(chapter.outlineConflict || '');
      setOutlineStakes(chapter.outlineStakes || '');
      setCustomFields(chapter.customOutlineFields || {});
    }
  }, [chapter.id]);

  // Auto-save functions with debounce
  const debouncedUpdateChapterDetails = useDebounce(
    (id: string, updates: Partial<Chapter>) => {
      updateChapterDetails(id, updates);
    },
    500
  );

  const handlePOVChange = (value: string) => {
    setOutlinePOV(value);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlinePOV: value,
      lastEdited: new Date().toISOString()
    });
  };

  const handlePurposeChange = (value: string) => {
    setOutlinePurpose(value);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlinePurpose: value,
      lastEdited: new Date().toISOString()
    });
  };

  const handleEstimateChange = (value: string) => {
    const num = value ? parseInt(value) : undefined;
    setOutlineEstimate(num);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlineEstimate: num,
      lastEdited: new Date().toISOString()
    });
  };

  const handleGoalChange = (value: string) => {
    setOutlineGoal(value);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlineGoal: value,
      lastEdited: new Date().toISOString()
    });
  };

  const handleConflictChange = (value: string) => {
    setOutlineConflict(value);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlineConflict: value,
      lastEdited: new Date().toISOString()
    });
  };

  const handleStakesChange = (value: string) => {
    setOutlineStakes(value);
    debouncedUpdateChapterDetails(chapter.id, { 
      outlineStakes: value,
      lastEdited: new Date().toISOString()
    });
  };

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [key]: value }));
    debouncedUpdateChapterDetails(chapter.id, { 
      customOutlineFields: { ...customFields, [key]: value },
      lastEdited: new Date().toISOString()
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="outline-pov">POV</Label>
          <Input
            id="outline-pov"
            value={outlinePOV}
            onChange={(e) => handlePOVChange(e.target.value)}
            placeholder="e.g., First person / Third person"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="outline-estimate">Estimated Words</Label>
          <Input
            id="outline-estimate"
            type="number"
            min="0"
            value={outlineEstimate || ''}
            onChange={(e) => handleEstimateChange(e.target.value)}
            placeholder="e.g., 2500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outline-purpose">Purpose</Label>
        <Textarea
          id="outline-purpose"
          value={outlinePurpose}
          onChange={(e) => handlePurposeChange(e.target.value)}
          placeholder="What does this chapter accomplish?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outline-goal">Goal</Label>
        <Textarea
          id="outline-goal"
          value={outlineGoal}
          onChange={(e) => handleGoalChange(e.target.value)}
          placeholder="What is the goal of this chapter?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outline-conflict">Conflict</Label>
        <Textarea
          id="outline-conflict"
          value={outlineConflict}
          onChange={(e) => handleConflictChange(e.target.value)}
          placeholder="What is the conflict in this chapter?"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outline-stakes">Stakes</Label>
        <Textarea
          id="outline-stakes"
          value={outlineStakes}
          onChange={(e) => handleStakesChange(e.target.value)}
          placeholder="What are the stakes in this chapter?"
          rows={3}
        />
      </div>

      {/* Custom fields */}
      {defaultOutlineFieldConfig.customFields && defaultOutlineFieldConfig.customFields.length > 0 && (
        <>
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm text-gray-600 mb-2">Custom Fields</h3>
          </div>
          {defaultOutlineFieldConfig.customFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`custom-${field.id}`}>{field.label}</Label>
              <Textarea
                id={`custom-${field.id}`}
                value={customFields[field.id] || ''}
                onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                rows={2}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
