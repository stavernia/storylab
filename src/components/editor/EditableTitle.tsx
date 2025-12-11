import { useState } from "react";

type EditableTitleProps = {
  value: string;
  onSave: (newValue: string) => void;
  placeholder: string;
  maxLength?: number;
  className?: string;
  editClassName?: string;
};

export function EditableTitle({
  value,
  onSave,
  placeholder,
  maxLength = 100,
  className = "",
  editClassName = "",
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleClick = () => {
    setIsEditing(true);
    setLocalValue(value);
  };

  const handleSave = () => {
    const trimmed = localValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        maxLength={maxLength}
        placeholder={placeholder}
        autoFocus
        className={`border-transparent rounded hover:ring-1 hover:ring-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${editClassName}`}
      />
    );
  }

  return (
    <div
      className={`cursor-pointer rounded hover:ring-1 hover:ring-blue-200/50 transition-all ${className}`}
      onClick={handleClick}
    >
      {value || placeholder}
    </div>
  );
}
