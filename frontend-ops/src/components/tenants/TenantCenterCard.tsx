'use client';

import { useRouter } from 'next/navigation';

import MGButton from '@/components/ui/MGButton';
import TenantOverflowMenu from '@/components/tenants/TenantOverflowMenu';
import {
  OPS_TENANT_CSS,
  OPS_TENANT_LABELS,
  OPS_TENANT_STATUS,
  OPS_TENANT_STATUS_LABELS,
  buildCenterEnterUrl,
  buildPgApprovalHref,
  toDisplayString
} from '@/constants/opsTenants';
import type { OpsTenantItem } from '@/services/tenantOpsService';
import notificationManager from '@/utils/notification';

/**
 * TenantCenterCard — 센터명 first · status · quiet 격리 · subdomain · CTA 36 · ⋯
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

type TenantCenterCardProps = {
  tenant: OpsTenantItem;
  onDetail: (tenant: OpsTenantItem) => void;
  onSuspend: (tenant: OpsTenantItem) => void;
  onResume: (tenant: OpsTenantItem) => void;
};

function statusClass(status: string): string {
  switch (status) {
    case OPS_TENANT_STATUS.ACTIVE:
      return `${OPS_TENANT_CSS.STATUS_BADGE} ${OPS_TENANT_CSS.STATUS_ACTIVE}`;
    case OPS_TENANT_STATUS.SUSPENDED:
      return `${OPS_TENANT_CSS.STATUS_BADGE} ${OPS_TENANT_CSS.STATUS_SUSPENDED}`;
    case OPS_TENANT_STATUS.PENDING:
      return `${OPS_TENANT_CSS.STATUS_BADGE} ${OPS_TENANT_CSS.STATUS_PENDING}`;
    case OPS_TENANT_STATUS.CLOSED:
      return `${OPS_TENANT_CSS.STATUS_BADGE} ${OPS_TENANT_CSS.STATUS_CLOSED}`;
    default:
      return OPS_TENANT_CSS.STATUS_BADGE;
  }
}

export default function TenantCenterCard({
  tenant,
  onDetail,
  onSuspend,
  onResume
}: TenantCenterCardProps) {
  const router = useRouter();
  const centerName = toDisplayString(tenant.name, OPS_TENANT_LABELS.TITLE);
  const statusLabel =
    OPS_TENANT_STATUS_LABELS[tenant.status] || toDisplayString(tenant.status);
  const subdomainCaption = toDisplayString(tenant.subdomain);

  const handleEnter = () => {
    const url = buildCenterEnterUrl(tenant.subdomain);
    if (!url) {
      notificationManager.warning(OPS_TENANT_LABELS.ENTER_NO_SUBDOMAIN);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewPg = () => {
    router.push(buildPgApprovalHref(tenant.tenantId));
  };

  return (
    <article className={OPS_TENANT_CSS.CARD} data-testid="ops-tenant-card">
      <div className={OPS_TENANT_CSS.CARD_HEADER}>
        <h2 className={OPS_TENANT_CSS.CARD_TITLE}>{centerName}</h2>
        <span className={statusClass(tenant.status)}>{statusLabel}</span>
      </div>
      <div className={OPS_TENANT_CSS.CARD_BADGES}>
        <span className={OPS_TENANT_CSS.ISOLATION}>
          {OPS_TENANT_LABELS.ISOLATION_BADGE}
        </span>
      </div>
      {subdomainCaption ? (
        <p className={OPS_TENANT_CSS.SUBDOMAIN}>{subdomainCaption}</p>
      ) : (
        <p className={OPS_TENANT_CSS.SUBDOMAIN}>—</p>
      )}
      <div className={OPS_TENANT_CSS.ACTIONS}>
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={OPS_TENANT_CSS.CTA}
          onClick={handleEnter}
          preventDoubleClick={false}
        >
          {OPS_TENANT_LABELS.ENTER_CENTER}
        </MGButton>
        <TenantOverflowMenu
          status={tenant.status}
          onDetail={() => onDetail(tenant)}
          onSuspend={() => onSuspend(tenant)}
          onResume={() => onResume(tenant)}
          onViewPg={handleViewPg}
        />
      </div>
    </article>
  );
}
