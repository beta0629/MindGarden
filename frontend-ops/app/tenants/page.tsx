'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import TenantCenterCard from '@/components/tenants/TenantCenterCard';
import TenantSummaryStrip from '@/components/tenants/TenantSummaryStrip';
import OpsQuietHeader from '@/components/shell/OpsQuietHeader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import MGButton from '@/components/ui/MGButton';
import { Modal } from '@/components/ui/Modal';
import {
  OPS_TENANT_CSS,
  OPS_TENANT_LABELS,
  OPS_TENANT_STATUS,
  OPS_TENANT_STATUS_LABELS,
  OPS_TENANT_STRIP_FILTER,
  type OpsTenantStripFilter,
  toDisplayString
} from '@/constants/opsTenants';
import {
  fetchOpsTenants,
  resumeOpsTenant,
  suspendOpsTenant,
  type OpsTenantItem
} from '@/services/tenantOpsService';
import notificationManager from '@/utils/notification';

type ConfirmAction = 'suspend' | 'resume' | null;

/**
 * Ops 테넌트 본문 — quiet header → strip3 → search → center cards
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
export default function TenantsPage() {
  const [tenants, setTenants] = useState<OpsTenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stripFilter, setStripFilter] = useState<OpsTenantStripFilter>(
    OPS_TENANT_STRIP_FILTER.ALL
  );
  const [search, setSearch] = useState('');
  const [detailTenant, setDetailTenant] = useState<OpsTenantItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmTenant, setConfirmTenant] = useState<OpsTenantItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOpsTenants();
      setTenants(data);
    } catch (err) {
      console.error('[TenantsPage] load failed:', err);
      setError(
        err instanceof Error ? err.message : OPS_TENANT_LABELS.ERROR_LOAD
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const counts = useMemo(() => {
    let active = 0;
    let suspended = 0;
    for (const tenant of tenants) {
      if (tenant.status === OPS_TENANT_STATUS.ACTIVE) {
        active += 1;
      } else if (tenant.status === OPS_TENANT_STATUS.SUSPENDED) {
        suspended += 1;
      }
    }
    return {
      total: tenants.length,
      active,
      suspended
    };
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    let list = tenants;
    if (stripFilter === OPS_TENANT_STRIP_FILTER.ACTIVE) {
      list = list.filter((t) => t.status === OPS_TENANT_STATUS.ACTIVE);
    } else if (stripFilter === OPS_TENANT_STRIP_FILTER.SUSPENDED) {
      list = list.filter((t) => t.status === OPS_TENANT_STATUS.SUSPENDED);
    }

    const q = search.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((t) => {
      const name = toDisplayString(t.name).toLowerCase();
      const subdomain = toDisplayString(t.subdomain).toLowerCase();
      return name.includes(q) || subdomain.includes(q);
    });
  }, [tenants, stripFilter, search]);

  const openSuspend = (tenant: OpsTenantItem) => {
    setConfirmTenant(tenant);
    setConfirmAction('suspend');
  };

  const openResume = (tenant: OpsTenantItem) => {
    setConfirmTenant(tenant);
    setConfirmAction('resume');
  };

  const closeConfirm = () => {
    if (submitting) {
      return;
    }
    setConfirmAction(null);
    setConfirmTenant(null);
  };

  const handleConfirm = async () => {
    if (!confirmTenant || !confirmAction) {
      return;
    }
    try {
      setSubmitting(true);
      if (confirmAction === 'suspend') {
        await suspendOpsTenant(confirmTenant.tenantId);
        notificationManager.success(OPS_TENANT_LABELS.SUSPEND_SUCCESS);
      } else {
        await resumeOpsTenant(confirmTenant.tenantId);
        notificationManager.success(OPS_TENANT_LABELS.RESUME_SUCCESS);
      }
      setConfirmAction(null);
      setConfirmTenant(null);
      await loadTenants();
    } catch (err) {
      console.error('[TenantsPage] status change failed:', err);
      notificationManager.error(
        err instanceof Error ? err.message : OPS_TENANT_LABELS.ERROR_LOAD
      );
    } finally {
      setSubmitting(false);
    }
  };

  const emptyMessage =
    tenants.length === 0
      ? OPS_TENANT_LABELS.EMPTY_ALL
      : OPS_TENANT_LABELS.EMPTY_FILTER;

  return (
    <div className={OPS_TENANT_CSS.PAGE}>
      <OpsQuietHeader
        title={OPS_TENANT_LABELS.TITLE}
        titleId={OPS_TENANT_LABELS.TITLE_ID}
        onRefresh={loadTenants}
        refreshLabel={OPS_TENANT_LABELS.REFRESH}
        refreshing={loading}
      />

      <TenantSummaryStrip
        total={counts.total}
        active={counts.active}
        suspended={counts.suspended}
        selected={stripFilter}
        loading={loading}
        onSelect={setStripFilter}
      />

      <div className={OPS_TENANT_CSS.TOOLBAR}>
        <input
          type="search"
          className={OPS_TENANT_CSS.SEARCH}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={OPS_TENANT_LABELS.SEARCH_PLACEHOLDER}
          aria-label={OPS_TENANT_LABELS.SEARCH_ARIA}
        />
      </div>

      <section
        className={`ops-shell__stage ${OPS_TENANT_CSS.STAGE}`}
        aria-labelledby={OPS_TENANT_LABELS.TITLE_ID}
        aria-busy={loading}
        data-testid="ops-tenants-stage"
      >
        {error ? (
          <div className={OPS_TENANT_CSS.EMPTY}>
            <p>{error}</p>
            <MGButton
              type="button"
              variant="ghost"
              size="small"
              onClick={loadTenants}
              preventDoubleClick={false}
            >
              {OPS_TENANT_LABELS.RETRY}
            </MGButton>
          </div>
        ) : null}

        {!error && loading && tenants.length === 0 ? (
          <p className={OPS_TENANT_CSS.EMPTY}>{OPS_TENANT_LABELS.LOADING}</p>
        ) : null}

        {!error && !loading && filteredTenants.length === 0 ? (
          <div className={OPS_TENANT_CSS.EMPTY}>
            <p>{emptyMessage}</p>
            {stripFilter !== OPS_TENANT_STRIP_FILTER.ALL || search.trim() ? (
              <MGButton
                type="button"
                variant="ghost"
                size="small"
                onClick={() => {
                  setStripFilter(OPS_TENANT_STRIP_FILTER.ALL);
                  setSearch('');
                }}
                preventDoubleClick={false}
              >
                {OPS_TENANT_LABELS.RESET_FILTER}
              </MGButton>
            ) : null}
          </div>
        ) : null}

        {!error && filteredTenants.length > 0 ? (
          <ul className={OPS_TENANT_CSS.GRID}>
            {filteredTenants.map((tenant) => (
              <li key={tenant.tenantId}>
                <TenantCenterCard
                  tenant={tenant}
                  onDetail={setDetailTenant}
                  onSuspend={openSuspend}
                  onResume={openResume}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Modal
        open={!!detailTenant}
        title={OPS_TENANT_LABELS.DETAIL_TITLE}
        onClose={() => setDetailTenant(null)}
      >
        {detailTenant ? (
          <>
            <dl className={OPS_TENANT_CSS.DETAIL_DL}>
              <dt>{OPS_TENANT_LABELS.DETAIL_NAME}</dt>
              <dd>{toDisplayString(detailTenant.name)}</dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_STATUS}</dt>
              <dd>
                {OPS_TENANT_STATUS_LABELS[detailTenant.status] ||
                  toDisplayString(detailTenant.status)}
              </dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_SUBDOMAIN}</dt>
              <dd>{toDisplayString(detailTenant.subdomain, '—')}</dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_BUSINESS}</dt>
              <dd>{toDisplayString(detailTenant.businessType, '—')}</dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_CONTACT}</dt>
              <dd>{toDisplayString(detailTenant.contactPerson, '—')}</dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_EMAIL}</dt>
              <dd>{toDisplayString(detailTenant.contactEmail, '—')}</dd>
              <dt>{OPS_TENANT_LABELS.DETAIL_PHONE}</dt>
              <dd>{toDisplayString(detailTenant.contactPhone, '—')}</dd>
            </dl>
            <div className="ops-form-actions">
              <MGButton
                type="button"
                variant="secondary"
                onClick={() => setDetailTenant(null)}
              >
                {OPS_TENANT_LABELS.DETAIL_CLOSE}
              </MGButton>
            </div>
          </>
        ) : null}
      </Modal>

      <ConfirmModal
        open={!!confirmAction && !!confirmTenant}
        title={
          confirmAction === 'suspend'
            ? OPS_TENANT_LABELS.CONFIRM_SUSPEND_TITLE
            : OPS_TENANT_LABELS.CONFIRM_RESUME_TITLE
        }
        message={
          confirmAction === 'suspend'
            ? OPS_TENANT_LABELS.CONFIRM_SUSPEND_MESSAGE
            : OPS_TENANT_LABELS.CONFIRM_RESUME_MESSAGE
        }
        confirmLabel={
          confirmAction === 'suspend'
            ? OPS_TENANT_LABELS.CONFIRM_SUSPEND_OK
            : OPS_TENANT_LABELS.CONFIRM_RESUME_OK
        }
        cancelLabel={OPS_TENANT_LABELS.CONFIRM_CANCEL}
        variant={confirmAction === 'suspend' ? 'outlineWarn' : 'warning'}
        loading={submitting}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
