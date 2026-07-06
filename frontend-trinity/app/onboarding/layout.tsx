import { Suspense } from "react";
import OnboardingSidePanel from "../../components/onboarding/OnboardingSidePanel";
import { OnboardingLayoutProvider } from "../../components/onboarding/OnboardingLayoutContext";
import "../../styles/components/onboarding-layout.css";

/**
 * 온보딩 페이지 레이아웃
 * useSearchParams를 사용하는 컴포넌트를 Suspense로 감싸기
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingLayoutProvider>
      <div className="trinity-onboarding-layout">
        <OnboardingSidePanel />
        <div className="trinity-onboarding-layout__main">
          <Suspense
            fallback={
              <div className="trinity-onboarding-layout__loading">
                페이지 로딩 중...
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </OnboardingLayoutProvider>
  );
}

