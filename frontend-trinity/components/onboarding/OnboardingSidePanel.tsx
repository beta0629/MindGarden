import TrinityLogo from '../TrinityLogo';

/**
 * 온보딩 좌측 Dark Panel — inverse 로고 (F1) + 워터마크
 */
export default function OnboardingSidePanel() {
  return (
    <aside className="trinity-onboarding-layout__panel" aria-label="Trinity 브랜드">
      <div className="trinity-onboarding-layout__panel-inner">
        <TrinityLogo variant="inverse" className="trinity-onboarding-layout__logo" />
        <div className="trinity-onboarding-layout__watermark" aria-hidden="true">
          <TrinityLogo variant="icon" />
        </div>
      </div>
    </aside>
  );
}
