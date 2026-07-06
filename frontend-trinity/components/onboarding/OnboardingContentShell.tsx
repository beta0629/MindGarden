"use client";

import Link from "next/link";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import OnboardingStepDots from "./OnboardingStepDots";

interface OnboardingContentShellProps {
  children: React.ReactNode;
  currentStep?: number;
  showStepper?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export default function OnboardingContentShell({
  children,
  currentStep = 1,
  showStepper = true,
  eyebrow = TRINITY_CONSTANTS.ONBOARDING_V2.WELCOME_EYEBROW,
  title = TRINITY_CONSTANTS.ONBOARDING_V2.DEFAULT_TITLE,
  subtitle = TRINITY_CONSTANTS.ONBOARDING_V2.DEFAULT_SUBTITLE,
}: OnboardingContentShellProps) {
  const totalDisplaySteps = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.length;
  // Map internal step (1,2,3,6,5) to displayStep (1,2,3,4,5)
  const displayStep = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.find(
    (s) => s.stepKey === currentStep
  )?.displayId ?? 1;

  return (
    <div className="flex flex-col min-h-screen px-6 py-12 md:px-12 lg:px-16 xl:px-24 relative bg-white">
      <div className="w-full max-w-[560px] mx-auto flex flex-col flex-1">
        
        <div className="flex justify-end mb-12">
          <Link
            href={`mailto:${TRINITY_CONSTANTS.COMPANY.EMAIL}`}
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {TRINITY_CONSTANTS.ONBOARDING_V2.HELP_LABEL}
          </Link>
        </div>

        {showStepper && currentStep > 0 && (
          <div className="mb-12">
            <OnboardingStepDots totalSteps={totalDisplaySteps} currentStep={displayStep - 1} />
          </div>
        )}

        <header className="mb-10">
          <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-3">
            {eyebrow}
          </span>
          <h1 className="text-3xl lg:text-[32px] font-bold text-slate-900 mb-4 tracking-tight leading-[1.25]">
            {title}
          </h1>
          <p className="text-base lg:text-lg text-slate-500 leading-[1.6] font-normal">
            {subtitle}
          </p>
        </header>

        <div className="flex-1 w-full min-w-0 pb-20">
          {children}
        </div>

      </div>
    </div>
  );
}
