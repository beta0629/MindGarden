"use client";

import { useCallback, useEffect, useState } from "react";

import OpsQuietHeader from "@/components/shell/OpsQuietHeader";
import { OPS_OVERVIEW_COPY } from "@/constants/opsShell";
import { useAuth } from "@/hooks/useAuth";
import { fetchPendingPgApprovals } from "@/services/pgApprovalService";

/**
 * 현황 placeholder — pending PG 승인 건수만 (full KPI 금지).
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPendingPgApprovals();
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error("[DashboardPage] pending count failed:", err);
      setError(err instanceof Error ? err.message : OPS_OVERVIEW_COPY.ERROR);
      setPendingCount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      return;
    }
    if (isAuthenticated === true) {
      loadPendingCount();
    }
  }, [isAuthenticated, loadPendingCount]);

  return (
    <>
      <OpsQuietHeader
        title={OPS_OVERVIEW_COPY.TITLE}
        titleId={OPS_OVERVIEW_COPY.TITLE_ID}
        onRefresh={loadPendingCount}
        refreshLabel={OPS_OVERVIEW_COPY.REFRESH}
        refreshing={loading}
      />
      <section
        className="ops-shell__stage"
        aria-labelledby={OPS_OVERVIEW_COPY.TITLE_ID}
        aria-busy={loading}
      >
        {error ? (
          <p className="form-feedback form-feedback--error">{error}</p>
        ) : (
          <div className="ops-shell-summary" data-testid="ops-overview-pending">
            <p className="ops-shell-summary__label">
              {OPS_OVERVIEW_COPY.PENDING_CAPTION}
            </p>
            <p className="ops-shell-summary__value">
              {loading && pendingCount == null
                ? OPS_OVERVIEW_COPY.LOADING
                : pendingCount ?? 0}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
