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
import SettingSwitchRow from '../common/molecules/SettingSwitchRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import { ADMIN_SHOP_API } from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_HOLD_TTL_DEFAULT_MINUTES,
  ADMIN_SHOP_POINT_POLICY_FIELD_LABELS,
  ADMIN_SHOP_POINT_POLICY_KEYS,
  ADMIN_SHOP_POINT_POLICY_TOGGLE_IMMEDIATE_HINT,
  ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_FAIL,
  ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_SUCCESS
} from '../../constants/adminShopPointPolicies';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import { useSettingToggleSave } from '../../hooks';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-point-policies-title';

const buildInitialForm = () => ({
  earnRatePercentBps: '0',
  earnCapAmountMinor: '0',
  minOrderForRedeemMinor: '0',
  maxRedeemAmountMinor: '0',
  holdTtlMinutes: String(ADMIN_SHOP_HOLD_TTL_DEFAULT_MINUTES),
  allowPgMix: true,
  allowPointsOnly: true
});

function mapPoliciesToForm(policies) {
  const base = buildInitialForm();
  if (!policies || typeof policies !== 'object') {
    return base;
  }
  const earnRate = policies[ADMIN_SHOP_POINT_POLICY_KEYS.EARN_RATE];
  if (earnRate && typeof earnRate === 'object' && earnRate.percentBps != null) {
    base.earnRatePercentBps = String(earnRate.percentBps);
  }
  const earnCap = policies[ADMIN_SHOP_POINT_POLICY_KEYS.EARN_CAP_PER_ORDER];
  if (earnCap && typeof earnCap === 'object' && earnCap.amountMinor != null) {
    base.earnCapAmountMinor = String(earnCap.amountMinor);
  }
  const minOrder = policies[ADMIN_SHOP_POINT_POLICY_KEYS.MIN_ORDER_FOR_REDEEM];
  if (minOrder && typeof minOrder === 'object' && minOrder.amountMinor != null) {
    base.minOrderForRedeemMinor = String(minOrder.amountMinor);
  }
  const maxRedeem = policies[ADMIN_SHOP_POINT_POLICY_KEYS.MAX_REDEEM_PER_ORDER];
  if (maxRedeem && typeof maxRedeem === 'object' && maxRedeem.amountMinor != null) {
    base.maxRedeemAmountMinor = String(maxRedeem.amountMinor);
  }
  const holdTtl = policies[ADMIN_SHOP_POINT_POLICY_KEYS.HOLD_TTL_MINUTES];
  if (holdTtl && typeof holdTtl === 'object' && holdTtl.minutes != null) {
    base.holdTtlMinutes = String(holdTtl.minutes);
  }
  if (policies[ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_PG_MIX] === false) {
    base.allowPgMix = false;
  }
  if (policies[ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_POINTS_ONLY] === false) {
    base.allowPointsOnly = false;
  }
  return base;
}

function parseMinor(value) {
  const n = Number.parseInt(String(value).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/** 수치 필드만 — boolean 토글은 즉시 PATCH 경로와 분리 */
function buildNumericPatchBody(form) {
  return {
    policies: {
      [ADMIN_SHOP_POINT_POLICY_KEYS.EARN_RATE]: { percentBps: parseMinor(form.earnRatePercentBps) },
      [ADMIN_SHOP_POINT_POLICY_KEYS.EARN_CAP_PER_ORDER]: { amountMinor: parseMinor(form.earnCapAmountMinor) },
      [ADMIN_SHOP_POINT_POLICY_KEYS.MIN_ORDER_FOR_REDEEM]: { amountMinor: parseMinor(form.minOrderForRedeemMinor) },
      [ADMIN_SHOP_POINT_POLICY_KEYS.MAX_REDEEM_PER_ORDER]: { amountMinor: parseMinor(form.maxRedeemAmountMinor) },
      [ADMIN_SHOP_POINT_POLICY_KEYS.HOLD_TTL_MINUTES]: { minutes: parseMinor(form.holdTtlMinutes) }
    }
  };
}

function buildBooleanPatchBody(key, value) {
  // 단일 정책 키만 — 수치 dirty 와 분리
  return {
    policies: {
      [key]: Boolean(value)
    }
  };
}

/**
 * 단일 boolean 정책 토글 행
 */
function PointPolicyBooleanToggle({
  id,
  label,
  checked,
  onValueChange,
  policyKey,
  statusOn,
  statusOff,
  disabled
}) {
  const save = useCallback(async(next) => {
    await StandardizedApi.patch(
      ADMIN_SHOP_API.POINT_POLICIES,
      buildBooleanPatchBody(policyKey, next)
    );
  }, [policyKey]);

  const { busy, disabled: hookDisabled, onCheckedChange } = useSettingToggleSave({
    value: checked,
    onValueChange,
    save,
    optimistic: true,
    onSuccess: () => {
      notificationManager.show(ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_SUCCESS, 'success');
    },
    onError: (e) => {
      notificationManager.error(
        e?.message != null
          ? toDisplayString(e.message, ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_FAIL)
          : ADMIN_SHOP_POINT_POLICY_TOGGLE_SAVE_FAIL
      );
    },
    isEnabled: !disabled
  });

  return (
    <SettingSwitchRow
      id={id}
      label={label}
      hint={ADMIN_SHOP_POINT_POLICY_TOGGLE_IMMEDIATE_HINT}
      statusLabel={checked ? statusOn : statusOff}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={hookDisabled || disabled}
      isPending={busy}
      ariaLabel={label}
    />
  );
}

const AdminShopPointPoliciesPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

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
      const body = buildNumericPatchBody(form);
      await StandardizedApi.patch(ADMIN_SHOP_API.POINT_POLICIES, body);
      notificationManager.show('리워드 정책이 저장되었습니다.', 'success');
      await loadPolicies();
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const statusOn = t('common:label.on');
  const statusOff = t('common:label.off');

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
                {ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.earnRatePercentBps}
              </label>
              <input
                id={`${baseId}-earn-bps`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.earnRatePercentBps}
                onChange={(e) => setForm((f) => ({ ...f, earnRatePercentBps: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-earn-cap`}>
                {ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.earnCapAmountMinor}
              </label>
              <input
                id={`${baseId}-earn-cap`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.earnCapAmountMinor}
                onChange={(e) => setForm((f) => ({ ...f, earnCapAmountMinor: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-min-order`}>
                {ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.minOrderForRedeemMinor}
              </label>
              <input
                id={`${baseId}-min-order`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.minOrderForRedeemMinor}
                onChange={(e) => setForm((f) => ({ ...f, minOrderForRedeemMinor: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-max-redeem`}>
                {ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.maxRedeemAmountMinor}
              </label>
              <input
                id={`${baseId}-max-redeem`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.maxRedeemAmountMinor}
                onChange={(e) => setForm((f) => ({ ...f, maxRedeemAmountMinor: e.target.value }))}
              />
              <label className="mg-v2-label" htmlFor={`${baseId}-hold-ttl`}>
                {ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.holdTtlMinutes}
              </label>
              <input
                id={`${baseId}-hold-ttl`}
                className="mg-v2-input"
                inputMode="numeric"
                value={form.holdTtlMinutes}
                onChange={(e) => setForm((f) => ({ ...f, holdTtlMinutes: e.target.value }))}
              />
              <PointPolicyBooleanToggle
                id={`${baseId}-allow-pg-mix`}
                label={ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.allowPgMix}
                checked={form.allowPgMix}
                onValueChange={(next) => setForm((f) => ({ ...f, allowPgMix: next }))}
                policyKey={ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_PG_MIX}
                statusOn={statusOn}
                statusOff={statusOff}
                disabled={saving}
              />
              <PointPolicyBooleanToggle
                id={`${baseId}-allow-points-only`}
                label={ADMIN_SHOP_POINT_POLICY_FIELD_LABELS.allowPointsOnly}
                checked={form.allowPointsOnly}
                onValueChange={(next) => setForm((f) => ({ ...f, allowPointsOnly: next }))}
                policyKey={ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_POINTS_ONLY}
                statusOn={statusOn}
                statusOff={statusOff}
                disabled={saving}
              />
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
