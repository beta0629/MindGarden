"use client";

import { Suspense, type ReactNode } from "react";
import OnboardingSidePanel from "./OnboardingSidePanel";
import { OnboardingLayoutProvider } from "./OnboardingLayoutContext";

interface OnboardingLayoutClientProps {
  children: ReactNode;
}

export default function OnboardingLayoutClient({
  children,
}: OnboardingLayoutClientProps) {
  return (
    <OnboardingLayoutProvider>
      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 w-full overflow-hidden font-sans text-slate-900">
        <OnboardingSidePanel />
        <main className="flex-1 w-full lg:w-3/5 overflow-y-auto relative bg-white">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
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
