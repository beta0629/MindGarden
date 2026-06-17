import TrinityLogo from '../TrinityLogo';

/**
 * 온보딩 좌측 Dark Panel — inverse 로고 (F1)
 */
export default function OnboardingSidePanel() {
  return (
    <aside className="trinity-onboarding-layout__panel" aria-label="Trinity 브랜드">
      <TrinityLogo variant="inverse" className="trinity-onboarding-layout__logo" />
    </aside>
  );
}
