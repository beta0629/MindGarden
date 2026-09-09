"use client";

import MGButton from "@/components/ui/MGButton";

/**
 * OpsQuietHeader — OpsApprovalQuietHeader twin (h1 + optional ghost CTA).
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type OpsQuietHeaderProps = {
  title: string;
  titleId: string;
  onRefresh?: () => void;
  refreshLabel?: string;
  refreshing?: boolean;
  disabled?: boolean;
};

export default function OpsQuietHeader({
  title,
  titleId,
  onRefresh,
  refreshLabel = "새로고침",
  refreshing = false,
  disabled = false
}: OpsQuietHeaderProps) {
  return (
    <header className="ops-shell-header" aria-label={title}>
      <h1 id={titleId} className="ops-shell-header__title">
        {title}
      </h1>
      {typeof onRefresh === "function" ? (
        <div className="ops-shell-header__controls">
          <MGButton
            type="button"
            variant="ghost"
            size="small"
            onClick={onRefresh}
            loading={refreshing}
            disabled={disabled}
            aria-label={refreshLabel}
            preventDoubleClick={false}
          >
            {refreshLabel}
          </MGButton>
        </div>
      ) : null}
    </header>
  );
}
