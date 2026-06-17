"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

export interface OnboardingLayoutState {
  displayStep: number;
  totalDisplaySteps: number;
  showStepIndicator: boolean;
  panelMode: "welcome" | "flow";
}

interface OnboardingLayoutContextValue extends OnboardingLayoutState {
  setLayoutState: (patch: Partial<OnboardingLayoutState>) => void;
}

const DEFAULT_TOTAL = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.length;

const defaultState: OnboardingLayoutState = {
  displayStep: 1,
  totalDisplaySteps: DEFAULT_TOTAL,
  showStepIndicator: false,
  panelMode: "welcome",
};

const OnboardingLayoutContext = createContext<OnboardingLayoutContextValue | null>(
  null
);

export function OnboardingLayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingLayoutState>(defaultState);

  const setLayoutState = useCallback((patch: Partial<OnboardingLayoutState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setLayoutState,
    }),
    [state, setLayoutState]
  );

  return (
    <OnboardingLayoutContext.Provider value={value}>
      {children}
    </OnboardingLayoutContext.Provider>
  );
}

export function useOnboardingLayout() {
  const context = useContext(OnboardingLayoutContext);
  if (!context) {
    throw new Error("useOnboardingLayout must be used within OnboardingLayoutProvider");
  }
  return context;
}

export function resolveDisplayStep(currentStep: number): number {
  const match = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.find(
    (step) => step.stepKey === currentStep
  );
  return match?.displayId ?? 1;
}
