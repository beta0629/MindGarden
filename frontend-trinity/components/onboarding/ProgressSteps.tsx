/**
 * 온보딩 진행 단계 표시 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <>
      <div className={COMPONENT_CSS.ONBOARDING.PROGRESS}>
        {TRINITY_CONSTANTS.ONBOARDING_STEPS.map((s, index) => (
          <div 
            key={s.id} 
            className={`trinity-onboarding__progress-item ${
              currentStep >= s.id ? COMPONENT_CSS.ONBOARDING.PROGRESS_ITEM_ACTIVE : ""
            }`}
          >
            <div className="trinity-onboarding__progress-number">
              {s.id}
            </div>
            {index < TRINITY_CONSTANTS.ONBOARDING_STEPS.length - 1 && (
              <div className="trinity-onboarding__progress-line" />
            )}
          </div>
        ))}
      </div>
      <div className="trinity-onboarding__progress-labels">
        {TRINITY_CONSTANTS.ONBOARDING_STEPS.map((s) => (
          <span 
            key={s.id} 
            className={`trinity-onboarding__progress-label ${
              currentStep === s.id ? "trinity-onboarding__progress-label--current" : ""
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </>
  );
}

