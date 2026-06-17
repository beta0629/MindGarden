"use client";

import TrinityLogo from "../TrinityLogo";
import TenantNetworkVisual from "./TenantNetworkVisual";
import { useOnboardingLayout } from "./OnboardingLayoutContext";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

/**
 * 온보딩 v2 좌측 Dark Panel — Trinity F1 + network visual + value prop + stats
 */
export default function OnboardingSidePanel() {
  const { displayStep, totalDisplaySteps, showStepIndicator, panelMode } =
    useOnboardingLayout();

  const { PANEL } = TRINITY_CONSTANTS.ONBOARDING_V2;
  const progressPercent =
    totalDisplaySteps > 1
      ? ((displayStep - 1) / (totalDisplaySteps - 1)) * 100
      : 0;

  return (
    <aside
      className="trinity-onboarding-split__panel"
      aria-label={PANEL.ARIA_LABEL}
    >
      <div className="trinity-onboarding-split__panel-inner">
        <header className="trinity-onboarding-split__brand">
          <TrinityLogo
            variant="inverse"
            className="trinity-onboarding-split__logo"
          />
        </header>

        <div className="trinity-onboarding-split__visual-wrap">
          <TenantNetworkVisual className="trinity-onboarding-split__visual" />
        </div>

        <footer className="trinity-onboarding-split__value-prop">
          <h2 className="trinity-onboarding-split__value-title">
            {PANEL.VALUE_PROP_TITLE}
          </h2>
          <p className="trinity-onboarding-split__value-desc">
            {PANEL.VALUE_PROP_DESC}
          </p>

          <dl className="trinity-onboarding-split__stats">
            {PANEL.STATS.map((stat) => (
              <div key={stat.label} className="trinity-onboarding-split__stat">
                <dt className="trinity-onboarding-split__stat-value">
                  {stat.value}
                </dt>
                <dd className="trinity-onboarding-split__stat-label">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>

          {showStepIndicator && panelMode === "flow" ? (
            <div
              className="trinity-onboarding-split__step-indicator"
              aria-live="polite"
            >
              <span className="trinity-onboarding-split__step-label">
                <span className="trinity-onboarding-split__step-current">
                  {`${PANEL.STEP_LABEL} ${displayStep}`}
                </span>
                <span className="trinity-onboarding-split__step-total">
                  {` ${PANEL.STEP_OF} ${totalDisplaySteps}`}
                </span>
              </span>
              <div
                className="trinity-onboarding-split__step-bar"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={totalDisplaySteps}
                aria-valuenow={displayStep}
              >
                <div
                  className="trinity-onboarding-split__step-bar-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}
        </footer>
      </div>
    </aside>
  );
}
