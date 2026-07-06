"use client";

import React from "react";

interface OnboardingStepDotsProps {
  totalSteps?: number;
  currentStep?: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

const STEP_STATUS = {
  COMPLETED: "completed",
  CURRENT: "current",
  PENDING: "pending",
} as const;

export default function OnboardingStepDots({
  totalSteps = 4,
  currentStep = 0,
  onStepClick,
  className = "",
}: OnboardingStepDotsProps) {
  const getStatus = (index: number, current: number) => {
    if (index < current) return STEP_STATUS.COMPLETED;
    if (index === current) return STEP_STATUS.CURRENT;
    return STEP_STATUS.PENDING;
  };

  return (
    <nav className={`w-full ${className}`} aria-label="온보딩 진행률">
      <ol className="flex items-center w-full m-0 p-0 list-none" role="list">
        {Array.from({ length: totalSteps }, (_, index) => {
          const status = getStatus(index, currentStep);
          const stepNumber = index + 1;
          const isClickable = Boolean(onStepClick) && status === STEP_STATUS.COMPLETED;

          return (
            <li
              key={index}
              className="relative flex items-center flex-1 last:flex-none"
            >
              <button
                type="button"
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-colors z-10 shrink-0 ${
                  status === STEP_STATUS.COMPLETED
                    ? "bg-blue-600 border-blue-600 text-white"
                    : status === STEP_STATUS.CURRENT
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-slate-200 text-slate-400"
                } ${isClickable ? "cursor-pointer hover:bg-blue-700" : "cursor-default"}`}
                onClick={isClickable && onStepClick ? () => onStepClick(index) : undefined}
                disabled={!isClickable}
                aria-current={status === STEP_STATUS.CURRENT ? "step" : undefined}
                aria-label={`Step ${stepNumber} OF ${totalSteps}`}
                tabIndex={isClickable ? 0 : -1}
              >
                {status === STEP_STATUS.COMPLETED ? (
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </button>
              
              {index < totalSteps - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? "bg-blue-600" : "bg-slate-200"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
