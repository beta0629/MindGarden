"use client";

import { useEffect, useRef } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import "../../styles/components/animated-progress-bar.css";

interface AnimatedProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * 애니메이션 진행 바 컴포넌트
 * 부드러운 진행 효과와 모바일 최적화
 * 
 * @author Trinity Team
 * @version 1.0.0
 * @since 2025-12-09
 */
export default function AnimatedProgressBar({
  currentStep,
  totalSteps,
}: AnimatedProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  }, [progressPercentage]);

  return (
    <div className="trinity-progress-bar">
      <div className="trinity-progress-bar__container">
        <div 
          ref={progressRef}
          className="trinity-progress-bar__fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="trinity-progress-bar__steps">
        {TRINITY_CONSTANTS.ONBOARDING_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`trinity-progress-bar__step ${
              currentStep >= step.id ? "trinity-progress-bar__step--active" : ""
            } ${currentStep === step.id ? "trinity-progress-bar__step--current" : ""}`}
          >
            <div className="trinity-progress-bar__step-number">
              {step.id}
            </div>
            {index < TRINITY_CONSTANTS.ONBOARDING_STEPS.length - 1 && (
              <div className="trinity-progress-bar__step-line" />
            )}
          </div>
        ))}
      </div>
      <div className="trinity-progress-bar__labels">
        {TRINITY_CONSTANTS.ONBOARDING_STEPS.map((step) => (
          <span
            key={step.id}
            className={`trinity-progress-bar__label ${
              currentStep === step.id ? "trinity-progress-bar__label--current" : ""
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

