"use client";

import CoreSolutionLogo from "../CoreSolutionLogo";
import TenantNetworkVisual from "./TenantNetworkVisual";
import { useOnboardingLayout } from "./OnboardingLayoutContext";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

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
      className="hidden lg:flex flex-col w-2/5 min-h-screen bg-slate-900 p-12 text-white justify-between relative overflow-hidden"
      aria-label={PANEL.ARIA_LABEL}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <header className="mb-16">
          <CoreSolutionLogo
            variant="inverse"
            className="h-8 w-auto"
          />
        </header>

        <div className="flex items-center justify-center mb-16 opacity-90">
          <TenantNetworkVisual className="w-full max-w-sm" />
        </div>
      </div>

      <footer className="relative z-10">
        <h2 className="text-2xl font-bold mb-3 text-white">
          {PANEL.VALUE_PROP_TITLE}
        </h2>
        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          {PANEL.VALUE_PROP_DESC}
        </p>

        <dl className="grid grid-cols-3 gap-6 mb-12 border-t border-slate-800 pt-8">
          {PANEL.STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="text-2xl font-bold text-blue-400 mb-1">
                {stat.value}
              </dt>
              <dd className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>

        {showStepIndicator && panelMode === "flow" && (
          <div className="mt-auto" aria-live="polite">
            <div className="flex justify-between items-center mb-3 text-xs uppercase tracking-widest font-semibold">
              <span className="text-blue-400">
                {`${PANEL.STEP_LABEL} ${displayStep}`}
              </span>
              <span className="text-slate-500">
                {`${PANEL.STEP_OF} ${totalDisplaySteps}`}
              </span>
            </div>
            <div
              className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalDisplaySteps}
              aria-valuenow={displayStep}
            >
              <div
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </footer>
    </aside>
  );
}
