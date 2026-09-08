'use client';

import OpsQuietHeader from '@/components/shell/OpsQuietHeader';
import EmptyState from '@/components/ui/EmptyState';
import { OPS_TENANT_CSS, OPS_TENANT_LABELS } from '@/constants/opsTenants';

/**
 * Ops 테넌트 Phase 1 — quiet header + paper stage + EmptyState coming only.
 * 풀 관리(strip/cards/들어가기/정지·재개)는 Deferred.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
export default function TenantsPage() {
  return (
    <div className={OPS_TENANT_CSS.PAGE}>
      <OpsQuietHeader
        title={OPS_TENANT_LABELS.TITLE}
        titleId={OPS_TENANT_LABELS.TITLE_ID}
      />

      <section
        className={`ops-shell__stage ${OPS_TENANT_CSS.STAGE}`}
        aria-labelledby={OPS_TENANT_LABELS.TITLE_ID}
        data-testid="ops-tenants-stage"
      >
        <EmptyState
          className={OPS_TENANT_CSS.EMPTY}
          titleClassName={OPS_TENANT_CSS.EMPTY_TITLE}
          descriptionClassName={OPS_TENANT_CSS.EMPTY_DESC}
          title={OPS_TENANT_LABELS.EMPTY_TITLE}
          description={OPS_TENANT_LABELS.EMPTY_DESCRIPTION}
          testId="ops-tenants-empty"
        />
      </section>
    </div>
  );
}
