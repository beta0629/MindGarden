import OnboardingLayoutClient from "../../components/onboarding/OnboardingLayoutClient";

/**
 * 온보딩 페이지 레이아웃 — mockup v2 40/60 split
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingLayoutClient>{children}</OnboardingLayoutClient>;
}
