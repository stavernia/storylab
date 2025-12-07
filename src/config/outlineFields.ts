export const builtInOutlineFields = [
  { id: 'outlineGoal', label: 'Goal', type: 'text' },
  { id: 'outlineConflict', label: 'Conflict', type: 'text' },
  { id: 'outlineStakes', label: 'Stakes', type: 'text' },
];

export const defaultOutlineFieldConfig = {
  useGoal: true,
  useConflict: true,
  useStakes: true,
  customFields: [] as { id: string; label: string }[],
};
