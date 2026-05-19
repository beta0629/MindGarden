/**
 * 슈퍼어드민 — 테넌트 Shop·Reward 컴포넌트 활성화 (MVP)
 *
 * @author CoreSolution
 * @since 2026-05-22
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { useSession } from '../../contexts/SessionContext';
import { getDashboardPathByRole } from '../../constants/session';
import { SUPER_ADMIN_ROLE } from '../../constants/superAdminRoutes';
import { SUPER_ADMIN_TENANT_COMPONENT_API } from '../../constants/superAdminTenantComponentApi';
import {
  SHOP_REWARD_BUNDLE_STATUS_ITEMS,
  SUPER_ADMIN_TENANT_COMPONENT_COPY
} from '../../constants/superAdminTenantComponentCopy';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './SuperAdminTenantComponentPage.css';

const PAGE_TITLE_ID = 'super-admin-tenant-components-title';

const COPY = SUPER_ADMIN_TENANT_COMPONENT_COPY;

/**
 * @typedef {'unknown' | 'active' | 'inactive'} ComponentStatusKind
 */

/**
 * @param {string | undefined} tenantId
 * @returns {string}
 */
function normalizeTenantId(tenantId) {
  return tenantId != null ? String(tenantId).trim() : '';
}

const SuperAdminTenantComponentPage = () => {
  const { user } = useSession();
  const [tenantIdInput, setTenantIdInput] = useState('');
  const [searchedTenantId, setSearchedTenantId] = useState('');
  /** @type {Record<string, ComponentStatusKind>} */
  const [statusByCode, setStatusByCode] = useState({});
  const [activating, setActivating] = useState(false);
  const [lastActivatedCount, setLastActivatedCount] = useState(null);

  const handleSearch = useCallback(() => {
    const normalized = normalizeTenantId(tenantIdInput);
    if (!normalized) {
      notificationManager.error(COPY.TENANT_ID_REQUIRED);
      return;
    }
    setSearchedTenantId(normalized);
    setLastActivatedCount(null);
    const unknown = {};
    SHOP_REWARD_BUNDLE_STATUS_ITEMS.forEach((item) => {
      unknown[item.code] = 'unknown';
    });
    setStatusByCode(unknown);
  }, [tenantIdInput]);

  const handleActivate = useCallback(async() => {
    const tenantId = normalizeTenantId(searchedTenantId || tenantIdInput);
    if (!tenantId) {
      notificationManager.error(COPY.TENANT_ID_REQUIRED);
      return;
    }
    if (!searchedTenantId) {
      setSearchedTenantId(tenantId);
    }

    setActivating(true);
    try {
      const response = await StandardizedApi.post(
        SUPER_ADMIN_TENANT_COMPONENT_API.SHOP_REWARD_ACTIVATE(tenantId),
        {},
        { unwrapApiEnvelope: false }
      );
      const payload = response?.data ?? response;
      const activatedCodes = Array.isArray(payload?.activatedComponentCodes)
        ? payload.activatedComponentCodes
        : [];
      const activatedCount =
        typeof payload?.activatedCount === 'number' ? payload.activatedCount : activatedCodes.length;

      setStatusByCode((prev) => {
        const next = { ...prev };
        SHOP_REWARD_BUNDLE_STATUS_ITEMS.forEach((item) => {
          if (activatedCodes.includes(item.code)) {
            next[item.code] = 'active';
          } else if (activatedCount === 0) {
            next[item.code] = 'active';
          } else if (next[item.code] !== 'active') {
            next[item.code] = 'inactive';
          }
        });
        return next;
      });
      setLastActivatedCount(activatedCount);
      notificationManager.success(COPY.TOAST_SUCCESS);
    } catch {
      notificationManager.error(COPY.TOAST_ERROR);
    } finally {
      setActivating(false);
    }
  }, [searchedTenantId, tenantIdInput]);

  const statusCards = useMemo(
    () =>
      SHOP_REWARD_BUNDLE_STATUS_ITEMS.map((item) => {
        const kind = statusByCode[item.code] ?? 'unknown';
        let statusLabel = COPY.STATUS_UNKNOWN;
        if (kind === 'active') {
          statusLabel = COPY.STATUS_ACTIVE;
        } else if (kind === 'inactive') {
          statusLabel = COPY.STATUS_INACTIVE;
        }
        return {
          ...item,
          kind,
          statusLabel
        };
      }),
    [searchedTenantId, statusByCode]
  );

  const activateDisabled = activating || !normalizeTenantId(searchedTenantId || tenantIdInput);

  if (user?.role !== SUPER_ADMIN_ROLE) {
    return <Navigate to={getDashboardPathByRole(user?.role)} replace />;
  }

  return (
    <AdminCommonLayout title={COPY.PAGE_TITLE} loading={false}>
      <div className="mg-v2-ad-b0kla super-admin-tenant-components" data-testid="super-admin-tenant-components-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel={COPY.PAGE_TITLE}>
            <p className="super-admin-tenant-components__breadcrumb">
              <SafeText tag="span">{COPY.BREADCRUMB}</SafeText>
            </p>
            <ContentHeader
              title={COPY.PAGE_TITLE}
              subtitle={COPY.PAGE_SUBTITLE}
              titleId={PAGE_TITLE_ID}
            />

            <section className="mg-v2-section-block" aria-labelledby="super-admin-tenant-search-title">
              <div className="mg-v2-section-block__head">
                <span className="mg-v2-accent-bar" aria-hidden="true" />
                <h2 id="super-admin-tenant-search-title" className="mg-v2-section-block__title">
                  {COPY.SEARCH_SECTION_TITLE}
                </h2>
              </div>
              <div className="super-admin-tenant-components__search-row">
                <div className="super-admin-tenant-components__field">
                  <label className="super-admin-tenant-components__label" htmlFor="super-admin-tenant-id-input">
                    {COPY.TENANT_ID_LABEL}
                  </label>
                  <input
                    id="super-admin-tenant-id-input"
                    className="super-admin-tenant-components__input"
                    type="text"
                    value={tenantIdInput}
                    onChange={(e) => setTenantIdInput(e.target.value)}
                    placeholder={COPY.TENANT_ID_PLACEHOLDER}
                    autoComplete="off"
                    data-testid="super-admin-tenant-id-input"
                  />
                </div>
                <MGButton
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'md' })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleSearch}
                  data-testid="super-admin-tenant-search-btn"
                >
                  {COPY.SEARCH_BUTTON}
                </MGButton>
              </div>
            </section>

            <section className="mg-v2-section-block" aria-labelledby="super-admin-bundle-status-title">
              <div className="mg-v2-section-block__head">
                <span className="mg-v2-accent-bar" aria-hidden="true" />
                <h2 id="super-admin-bundle-status-title" className="mg-v2-section-block__title">
                  {COPY.BUNDLE_SECTION_TITLE}
                </h2>
              </div>
              {searchedTenantId ? (
                <p className="super-admin-tenant-components__hint">
                  <SafeText tag="span">
                    {COPY.SEARCH_HINT} (테넌트: {searchedTenantId})
                  </SafeText>
                </p>
              ) : (
                <p className="super-admin-tenant-components__hint">
                  <SafeText tag="span">{COPY.SEARCH_HINT}</SafeText>
                </p>
              )}
              <div className="super-admin-tenant-components__status-grid" data-testid="super-admin-bundle-status-grid">
                {statusCards.map((card) => (
                  <article
                    key={card.code}
                    className={`super-admin-tenant-components__status-card super-admin-tenant-components__status-card--${card.kind}`}
                    data-testid={`super-admin-status-${card.code}`}
                  >
                    <p className="super-admin-tenant-components__status-code">{card.shortLabel}</p>
                    <p className="super-admin-tenant-components__status-desc">{card.description}</p>
                    <p className="super-admin-tenant-components__status-label">{card.statusLabel}</p>
                  </article>
                ))}
              </div>
              {lastActivatedCount != null ? (
                <p className="super-admin-tenant-components__hint">
                  <SafeText tag="span">{COPY.ACTIVATED_COUNT(lastActivatedCount)}</SafeText>
                </p>
              ) : null}
              <div className="super-admin-tenant-components__actions">
                <MGButton
                  type="button"
                  variant="primary"
                  className={`${buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: activating
                  })} super-admin-tenant-components__activate-btn mg-v2-button-primary`}
                  loading={activating}
                  disabled={activateDisabled}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleActivate}
                  data-testid="super-admin-shop-reward-activate-btn"
                >
                  {COPY.ACTIVATE_BUTTON}
                </MGButton>
              </div>
            </section>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default SuperAdminTenantComponentPage;
