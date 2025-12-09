import { ReactNode, useEffect, useRef } from 'react';
import { X, Loader2, LayoutPanelLeft, Square } from 'lucide-react';
import { theme } from '@/theme';
import { Button } from '@/components/ui/button';
import { useInfoPanelLayout, InfoPanelLayout } from '@/hooks/useInfoPanelLayout';

export interface InfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
  width?: string;
  ariaLabel?: string;
  variant?: 'modal' | 'drawer';
  layout?: InfoPanelLayout;
}

export function InfoPanelModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  onSubmit,
  onCancel,
  isSaving = false,
  width = 'max-w-2xl',
  ariaLabel,
  variant = 'modal',
  layout: layoutProp,
}: InfoPanelProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [globalLayout, setGlobalLayout] = useInfoPanelLayout();
  const layout = layoutProp ?? globalLayout;

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Return focus to the previously focused element
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.() || onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (onSubmit && !isSaving) {
          onSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSubmit, onCancel, onClose, isSaving]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey as any);
    return () => modal.removeEventListener('keydown', handleTabKey as any);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel?.() || onClose();
    }
  };

  // Header content (shared between layouts)
  const headerContent = (
    <div
      className="flex items-start justify-between border-b border-gray-200"
      style={{ padding: `${theme.space.lg}px` }}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && <div className="text-gray-700 mt-0.5 flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <h2 className="text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {/* Layout toggle */}
        <button
          type="button"
          onClick={() => setGlobalLayout(layout === 'center' ? 'side' : 'center')}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-50"
          title={layout === 'center' ? 'Switch to side panel' : 'Switch to centered modal'}
        >
          {layout === 'center' ? (
            <>
              <LayoutPanelLeft className="w-3 h-3" />
              <span>Side</span>
            </>
          ) : (
            <>
              <Square className="w-3 h-3" />
              <span>Center</span>
            </>
          )}
        </button>
        <button
          onClick={onCancel || onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // Body content (shared between layouts)
  const bodyContent = (
    <div
      className="flex-1 overflow-y-auto"
      style={{ padding: `${theme.space.lg}px` }}
    >
      {children}
    </div>
  );

  // Footer content (shared between layouts)
  const footerContent = (onSubmit || onCancel) && (
    <div
      className="flex justify-end gap-2 border-t border-gray-200"
      style={{ padding: `${theme.space.lg}px` }}
    >
      <Button
        variant="outline"
        onClick={onCancel || onClose}
        disabled={isSaving}
      >
        Cancel
      </Button>
      {onSubmit && (
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save
              <span className="ml-1.5 text-xs text-gray-400">(Cmd/Ctrl+S)</span>
            </>
          )}
        </Button>
      )}
    </div>
  );

  // Side panel layout
  if (layout === 'side') {
    return (
      <div
        className="fixed inset-0 flex"
        style={{ zIndex: theme.z.modal }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
      >
        <div className="flex-1 bg-black/20" onClick={handleBackdropClick} />
        <aside
          ref={modalRef}
          className="relative w-full max-w-xl h-full bg-white shadow-xl border-l border-gray-200 flex flex-col"
          tabIndex={-1}
        >
          {headerContent}
          {bodyContent}
          {footerContent}
        </aside>
      </div>
    );
  }

  // Center modal layout (default)
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: theme.z.modal }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg w-full ${width} max-h-[90vh] flex flex-col`}
        style={{
          boxShadow: theme.shadow.modal,
          borderRadius: `${theme.radii.lg}px`,
        }}
        tabIndex={-1}
      >
        {headerContent}
        {bodyContent}
        {footerContent}
      </div>
    </div>
  );
}