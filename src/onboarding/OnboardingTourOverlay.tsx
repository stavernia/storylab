import { useLayoutEffect, useState } from 'react';
import { useOnboardingTour } from './OnboardingTourContext';
import { TOUR_STEPS } from './tourConfig';
import { Button } from '../components/ui/button';

export const OnboardingTourOverlay: React.FC = () => {
  const { isOpen, currentStep, stepIndex, nextStep, prevStep, closeTour } =
    useOnboardingTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      return;
    }
    
    let selector: string | null = null;
    switch (currentStep.target) {
      case 'appRail':
        selector = '[data-tour-id="appRail"]';
        break;
      case 'libraryBooks':
        selector = '[data-tour-id="libraryBooks"]';
        break;
      case 'breadcrumbs':
        selector = '[data-tour-id="breadcrumbs"]';
        break;
      case 'workspace':
        selector = '[data-tour-id="workspace"]';
        break;
      case 'utilityRail':
        selector = '[data-tour-id="utilityRail"]';
        break;
      case 'settings':
        selector = '[data-tour-id="settings"]';
        break;
      case 'center':
      default:
        selector = null;
        break;
    }

    if (selector) {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        return;
      }
    }

    setTargetRect(null);
  }, [isOpen, currentStep]);

  if (!isOpen || !currentStep) {
    return null;
  }

  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const isFirstStep = stepIndex === 0;

  // Calculate card position based on target
  let cardStyle: React.CSSProperties = {};
  let highlightStyle: React.CSSProperties = {};

  if (targetRect) {
    // Ensure the highlight box stays within viewport bounds to show all borders
    const highlightPadding = 4;
    const borderWidth = 3;
    const top = Math.max(borderWidth, targetRect.top - highlightPadding);
    const left = Math.max(borderWidth, targetRect.left - highlightPadding);
    const right = Math.min(window.innerWidth - borderWidth, targetRect.right + highlightPadding);
    const bottom = Math.min(window.innerHeight - borderWidth, targetRect.bottom + highlightPadding);
    
    highlightStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${right - left}px`,
      height: `${bottom - top}px`,
      border: '3px solid rgba(59, 130, 246, 0.8)',
      borderRadius: '8px',
      pointerEvents: 'none',
      zIndex: 10001,
      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
      // Use outline as backup for edge cases
      outline: '3px solid rgba(59, 130, 246, 0.8)',
      outlineOffset: '-3px',
    };

    // Position card to the right or below the target, depending on space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 400;
    const cardHeight = 240;
    const padding = 24;

    // Try to position to the right
    if (targetRect.right + padding + cardWidth < viewportWidth) {
      cardStyle = {
        position: 'fixed',
        top: `${Math.max(padding, Math.min(targetRect.top, viewportHeight - cardHeight - padding))}px`,
        left: `${targetRect.right + padding}px`,
        width: `${cardWidth}px`,
      };
    }
    // Try to position to the left
    else if (targetRect.left - padding - cardWidth > 0) {
      cardStyle = {
        position: 'fixed',
        top: `${Math.max(padding, Math.min(targetRect.top, viewportHeight - cardHeight - padding))}px`,
        right: `${viewportWidth - targetRect.left + padding}px`,
        width: `${cardWidth}px`,
      };
    }
    // Position below
    else if (targetRect.bottom + padding + cardHeight < viewportHeight) {
      cardStyle = {
        position: 'fixed',
        top: `${targetRect.bottom + padding}px`,
        left: `${Math.max(padding, Math.min(targetRect.left, viewportWidth - cardWidth - padding))}px`,
        width: `${cardWidth}px`,
      };
    }
    // Position above
    else if (targetRect.top - padding - cardHeight > 0) {
      cardStyle = {
        position: 'fixed',
        bottom: `${viewportHeight - targetRect.top + padding}px`,
        left: `${Math.max(padding, Math.min(targetRect.left, viewportWidth - cardWidth - padding))}px`,
        width: `${cardWidth}px`,
      };
    }
    // Fallback to center if no good position
    else {
      cardStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${cardWidth}px`,
      };
    }
  } else {
    // Center the card
    cardStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '400px',
    };
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 z-[10000]"
        onClick={(e) => {
          // Allow clicking backdrop to close
          if (e.target === e.currentTarget) {
            closeTour();
          }
        }}
      />

      {/* Highlight box around target */}
      {targetRect && <div style={highlightStyle} />}

      {/* Card */}
      <div
        style={cardStyle}
        className="z-[10002] bg-white rounded-lg shadow-2xl p-6"
      >
        {/* Step counter */}
        <div className="text-xs text-gray-500 mb-3">
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </div>

        {/* Title */}
        <h2 className="text-xl mb-3 text-gray-900">
          {currentStep.title}
        </h2>

        {/* Body */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {currentStep.body}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3">
          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTour}
              className="text-gray-600 hover:text-gray-900"
            >
              Skip Tour
            </Button>
          )}

          <div className={`flex items-center gap-2 ${isLastStep ? 'ml-auto' : ''}`}>
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
              >
                Back
              </Button>
            )}

            <Button
              size="sm"
              onClick={isLastStep ? closeTour : nextStep}
              className="bg-[rgb(96,129,142)] hover:bg-[#7d9ca8] text-white"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};