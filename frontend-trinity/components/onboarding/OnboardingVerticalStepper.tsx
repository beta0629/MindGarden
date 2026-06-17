"use client";

import { TRINITY_CONSTANTS } from "../../constants/trinity";
import "../../styles/components/onboarding-vertical-stepper.css";

interface OnboardingVerticalStepperProps {
  currentStep: number;
}

function resolveDisplayStep(currentStep: number): number {
  const match = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.find(
    (s) => s.stepKey === currentStep
  );
  return match?.displayId ?? 1;
}

/**
 * 온보딩 v2 세로 Stepper — Desktop 세로 / Mobile compact
 */
export default function OnboardingVerticalStepper({
  currentStep,
}: OnboardingVerticalStepperProps) {
  const displayStep = resolveDisplayStep(currentStep);
  const totalSteps = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.length;
  const progressPercent = ((displayStep - 1) / (totalSteps - 1)) * 100;
  const currentLabel =
    TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.find((s) => s.displayId === displayStep)
      ?.label ?? "";

  return (
    <nav
      className="trinity-onboarding-stepper"
      aria-label="온보딩 진행 단계"
    >
      <div className="trinity-onboarding-stepper__mobile">
        <div className="trinity-onboarding-stepper__mobile-bar">
          <div
            className="trinity-onboarding-stepper__mobile-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="trinity-onboarding-stepper__mobile-text">
          <strong>
            {displayStep}/{totalSteps}
          </strong>{" "}
          {currentLabel}
        </p>
      </div>

      <ol className="trinity-onboarding-stepper__list trinity-onboarding-stepper__desktop">
        {TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.map((step, index) => {
          const isActive = displayStep === step.displayId;
          const isCompleted = displayStep > step.displayId;

          return (
            <li
              key={step.displayId}
              className={`trinity-onboarding-stepper__item ${
                isActive ? "trinity-onboarding-stepper__item--active" : ""
              } ${isCompleted ? "trinity-onboarding-stepper__item--completed" : ""}`}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="trinity-onboarding-stepper__indicator-col">
                <div className="trinity-onboarding-stepper__circle">
                  {isCompleted ? (
                    <span className="trinity-onboarding-stepper__check" aria-hidden>
                      ✓
                    </span>
                  ) : (
                    step.displayId
                  )}
                </div>
                {index < TRINITY_CONSTANTS.ONBOARDING_STEPS_V2.length - 1 && (
                  <div className="trinity-onboarding-stepper__line" />
                )}
              </div>
              <span className="trinity-onboarding-stepper__label">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
