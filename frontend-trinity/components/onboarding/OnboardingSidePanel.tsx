"use client";

import TrinityLogo from "../TrinityLogo";
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
      className="hidden md:flex flex-col w-full md:w-2/5 lg:w-[40%] min-h-screen bg-[#0f172a] p-8 md:p-12 lg:p-16 text-white justify-between relative overflow-hidden shrink-0"
      aria-label={PANEL.ARIA_LABEL}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <header className="mb-8 shrink-0 flex items-center gap-3">
          <TrinityLogo
            variant="inverse"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-xl tracking-tight text-white">
            Trinity
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center my-8 opacity-90 min-h-0">
          <TenantNetworkVisual className="w-full max-w-[320px] h-auto object-contain" />
        </div>

        <footer className="shrink-0">
          <h2 className="text-3xl lg:text-[40px] font-bold mb-4 text-white leading-[1.4] tracking-tight">
            {PANEL.VALUE_PROP_TITLE}
          </h2>
          <p className="text-slate-400 text-lg lg:text-xl mb-10 leading-relaxed font-normal">
            {PANEL.VALUE_PROP_DESC}
          </p>

          {showStepIndicator && panelMode === "flow" && (
            <div className="mt-8" aria-live="polite">
              <div className="flex items-center gap-2 mb-3 text-sm tracking-widest uppercase">
                <span className="text-blue-500 font-bold">
                  {`${PANEL.STEP_LABEL} ${displayStep}`}
                </span>
                <span className="text-slate-500 font-medium">
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
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </footer>
      </div>
    </aside>
  );
}
