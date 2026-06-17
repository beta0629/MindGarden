"use client";

import { Suspense, type ReactNode } from "react";
import OnboardingSidePanel from "./OnboardingSidePanel";
import { OnboardingLayoutProvider } from "./OnboardingLayoutContext";
import "../../styles/components/onboarding-layout.css";

interface OnboardingLayoutClientProps {
  children: ReactNode;
}

/**
 * 온보딩 v2 Split 레이아웃 — mockup 40/60 (좌 navy / 우 white)
 */
export default function OnboardingLayoutClient({
  children,
}: OnboardingLayoutClientProps) {
  return (
    <OnboardingLayoutProvider>
      <div className="trinity-onboarding-split">
        <OnboardingSidePanel />
        <main className="trinity-onboarding-split__main">
          <Suspense
            fallback={
              <div className="trinity-onboarding-split__loading">
                페이지 로딩 중...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </OnboardingLayoutProvider>
  );
}
