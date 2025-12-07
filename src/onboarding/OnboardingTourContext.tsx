import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  TOUR_STEPS,
  TourStep,
  TourStepId,
  FIRST_TOUR_STEP_ID,
  TOUR_STORAGE_KEY,
} from './tourConfig';

interface OnboardingTourState {
  isOpen: boolean;
  currentStep: TourStep | null;
  stepIndex: number;
  startTour: () => void;
  closeTour: () => void;
  goToStep: (id: TourStepId) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourState | undefined>(
  undefined,
);

export const useOnboardingTour = (): OnboardingTourState => {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) {
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider');
  }
  return ctx;
};

export const OnboardingTourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep: TourStep | null =
    stepIndex >= 0 && stepIndex < TOUR_STEPS.length ? TOUR_STEPS[stepIndex] : null;

  // On first load, auto-start tour if not dismissed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(TOUR_STORAGE_KEY);
    if (!dismissed) {
      // Don't auto-open immediately; let the app layout mount first
      window.setTimeout(() => {
        setIsOpen(true);
        setStepIndex(0);
      }, 300);
    }
  }, []);

  const persistDismissed = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  const closeTour = () => {
    setIsOpen(false);
    persistDismissed();
  };

  const goToStep = (id: TourStepId) => {
    const idx = TOUR_STEPS.findIndex((s) => s.id === id);
    if (idx === -1) return;
    setIsOpen(true);
    setStepIndex(idx);
  };

  const nextStep = () => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TOUR_STEPS.length) {
        persistDismissed();
        return prev;
      }
      return next;
    });
  };

  const prevStep = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const startTour = () => {
    // allow reopening from Settings
    setIsOpen(true);
    setStepIndex(0);
  };

  return (
    <OnboardingTourContext.Provider
      value={{
        isOpen,
        currentStep,
        stepIndex,
        startTour,
        closeTour,
        goToStep,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
};
