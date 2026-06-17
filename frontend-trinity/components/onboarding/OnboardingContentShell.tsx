"use client";

import Link from "next/link";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import OnboardingVerticalStepper from "./OnboardingVerticalStepper";

interface OnboardingContentShellProps {
  children: React.ReactNode;
  currentStep?: number;
  showStepper?: boolean;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * 온보딩 v2 우측 Form Panel — vertical stepper + step content (mockup parity)
 */
export default function OnboardingContentShell({
  children,
  currentStep = 1,
  showStepper = true,
  eyebrow = TRINITY_CONSTANTS.ONBOARDING_V2.WELCOME_EYEBROW,
  title = TRINITY_CONSTANTS.ONBOARDING_V2.DEFAULT_TITLE,
  subtitle = TRINITY_CONSTANTS.ONBOARDING_V2.DEFAULT_SUBTITLE,
}: OnboardingContentShellProps) {
  return (
    <div className="trinity-onboarding-v2__shell trinity-onboarding">
      <div className="trinity-onboarding-v2__form-wrapper">
        <div className="trinity-onboarding-v2__top">
          <Link
            href={`mailto:${TRINITY_CONSTANTS.COMPANY.EMAIL}`}
            className="trinity-onboarding-v2__help"
          >
            {TRINITY_CONSTANTS.ONBOARDING_V2.HELP_LABEL}
          </Link>
        </div>

        <header className="trinity-onboarding-v2__header">
          <span className="trinity-onboarding-v2__eyebrow">{eyebrow}</span>
          <h1 className="trinity-onboarding-v2__title">{title}</h1>
          <p className="trinity-onboarding-v2__subtitle">{subtitle}</p>
        </header>

        <div className="trinity-onboarding-v2__body">
          {showStepper && currentStep > 0 ? (
            <OnboardingVerticalStepper currentStep={currentStep} />
          ) : null}
          <div className="trinity-onboarding-v2__form-area">{children}</div>
        </div>
      </div>
    </div>
  );
}
