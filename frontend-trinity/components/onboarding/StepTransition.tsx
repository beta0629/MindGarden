"use client";

import { useEffect, useState, ReactNode } from "react";
import "../../styles/components/step-transition.css";

interface StepTransitionProps {
  children: ReactNode;
  step: number;
  currentStep: number;
  direction?: "forward" | "backward";
  className?: string;
}

/**
 * 단계 전환 애니메이션 컴포넌트
 * iOS/Android 설정 화면 스타일의 부드러운 전환 효과
 * 
 * @author Trinity Team
 * @version 1.0.0
 * @since 2025-12-09
 */
export default function StepTransition({
  children,
  step,
  currentStep,
  direction = "forward",
  className = "",
}: StepTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    if (step === currentStep) {
      setIsAnimating(true);
      setDisplay(true);
      // 애니메이션 완료 후 상태 정리
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      // 단계가 변경되면 즉시 숨김
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplay(false);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, currentStep]);

  if (!display && step !== currentStep) {
    return null;
  }

  const animationClass = direction === "forward" 
    ? "trinity-step-transition--slide-forward" 
    : "trinity-step-transition--slide-backward";

  return (
    <div
      className={`trinity-step-transition ${animationClass} ${isAnimating ? "trinity-step-transition--animating" : ""} ${className}`}
      data-step={step}
      data-current-step={currentStep}
    >
      {children}
    </div>
  );
}

