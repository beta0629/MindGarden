/**
 * 테넌트 어드민 — 포인트·리워드 정책 설정 (P2-admin MVP)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import { ADMIN_SHOP_API } from '../../constants/adminShopApi';
import { USER_ROLES } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-point-policies-title';

const buildInitialForm = () => ({
  earnRatePercentBps: '0',
  earnCapAmountMinor: '0',
  minOrderForRedeemMinor: '0',
  maxRedeemAmountMinor: '0',
  allowPgMix: true,
  allowPointsOnly: true
});

function mapPoliciesToForm(policies) {
  const base = buildInitialForm();
  if (!policies || typeof policies !== 'object') {
    return base;
  }
  const earnRate = policies.earn_rate;
  if (earnRate && typeof earnRate === 'object' && earnRate.percentBps != null) {
    base.earnRatePercentBps = String(earnRate.percentBps);
  }
  const earnCap = policies.earn_cap_per_order;
  if (earnCap && typeof earnCap === 'object' && earnCap.amountMinor != null) {
    base.earnCapAmountMinor = String(earnCap.amountMinor);
  }
  const minOrder = policies.min_order_for_redeem;
  if (minOrder && typeof minOrder === 'object' && minOrder.amountMinor != null) {
    base.minOrderForRedeemMinor = String(minOrder.amountMinor);
  }
  const maxRedeem = policies.max_redeem_per_order;
  if (maxRedeem && typeof maxRedeem === 'object' && maxRedeem.amountMinor != null) {
    base.maxRedeemAmountMinor = String(maxRedeem.amountMinor);
  }
  if (policies.allow_pg_mix === false) {
    base.allowPgMix = false;
  }
  if (policies.allow_points_only === false) {
    base.allowPointsOnly = false;
  }
  return base;
}

function parseMinor(value) {
  const n = Number.parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

function buildPatchBody(form) {
  return {
    policies: {
      earn_rate: { percentBps: parseMinor(form.earnRatePercentBps) },
      earn_cap_per_order: { amountMinor: parseMinor(form.earnCapAmountMinor) },
      min_order_for_redeem: { amountMinor: parseMinor(form.minOrderForRedeemMinor) },
      max_redeem_per_order: { amountMinor: parseMinor(form.maxRedeemAmountMinor) },
      allow_pg_mix: Boolean(form.allowPgMix),
      allow_points_only: Boolean(form.allowPointsOnly)
    }
  };
}

const AdminShopPointPoliciesPage = () => {
  const navigate = useNavigate();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(buildInitialForm);
  const [tenantIdLine, setTenantIdLine] = useState('');

  const loadPolicies = useCallback(async() => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await StandardizedApi.get(ADMIN_SHOP_API.POINT_POLICIES);
      const data = res?.data ?? res;
      if (data && typeof data === 'object') {
        setTenantIdLine(toDisplayString(data.tenantId, ''));
        setForm(mapPoliciesToForm(data.policies));
      } else {
        setLoadError('정책을 불러오지 못했습니다.');
      }
    } catch (e) {
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/', { replace: true });
      return;
    }
    loadPolicies();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadPolicies]);

  const handleSave = async() => {
    setSaving(true);
    try {
      const body = buildPatchBody(form);
      await StandardizedApi.patch(ADMIN_SHOP_API.POINT_POLICIES, body);
      notificationManager.show('리워드 정책이 저장되었습니다.', 'success');
      await loadPolicies();
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCommonLayout title="리워드 정책">
      <ContentArea>
        <ContentHeader
          titleId={PAGE_TITLE_ID}
          title="리워드 정책"
          description="적립·사용 한도 등 테넌트 포인트 정책(MVP)을 설정합니다."
        />
        <ContentSection>
          {tenantIdLine ? (
            <p className="mg-v2-text-muted admin-shop-point-policies__tenant">
              테넌트:
              {' '}
              {tenantIdLine}
            </p>
          ) : null}
          {loading ? (
            <UnifiedLoading message="정책을 불러오는 중…" />
          ) : loadError ? (
            <SafeErrorDisplay error={loadError} />
          ) : (
            <form
              className="mg-v2-form-stack admin-shop-point-policies__form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <label className="mg-v2-label" htmlFor={`${baseId}-earn-bps`}>
                적립률 (basis points, 100 = 1%)
              </label>
              <input
                id={`${baseId}-earn-bps`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.earnRatePercentBps}
                onChange={(e) => setForm((f) => ({ ...f, earnRatePercentBps: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-earn-cap`}>
                주문당 적립 상한(원)
              </label>
              <input
                id={`${baseId}-earn-cap`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.earnCapAmountMinor}
                onChange={(e) => setForm((f) => ({ ...f, earnCapAmountMinor: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-min-order`}>
                포인트 사용 최소 주문액(원)
              </label>
              <input
                id={`${baseId}-min-order`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.minOrderForRedeemMinor}
                onChange={(e) => setForm((f) => ({ ...f, minOrderForRedeemMinor: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-max-redeem`}>
                주문당 최대 사용 포인트(원)
              </label>
              <input
                id={`${baseId}-max-redeem`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.maxRedeemAmountMinor}
                onChange={(e) => setForm((f) => ({ ...f, maxRedeemAmountMinor: e.target.value }))}
              />
              <label className="mg-v2-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.allowPgMix}
                  onChange={(e) => setForm((f) => ({ ...f, allowPgMix: e.target.checked }))}
                />
                포인트 + PG 혼합 결제 허용
              </label>
              <label className="mg-v2-checkbox-row">
                <input
                  type="checkbox"
                  checked={form.allowPointsOnly}
                  onChange={(e) => setForm((f) => ({ ...f, allowPointsOnly: e.target.checked }))}
                />
                포인트 전액 결제 허용
              </label>
              <div className="admin-shop-point-policies__actions">
                <MGButton
                  type="submit"
                  className={buildErpMgButtonClassName('primary')}
                  disabled={saving}
                >
                  {saving ? ERP_MG_BUTTON_LOADING_TEXT : '저장'}
                </MGButton>
              </div>
            </form>
          )}
        </ContentSection>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default AdminShopPointPoliciesPage;
