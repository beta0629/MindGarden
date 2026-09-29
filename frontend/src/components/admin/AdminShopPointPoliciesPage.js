/**
 * 테넌트 어드민 — 리워드 정책 (쌓기 · 쓰기 · 계산 예시)
 * 저장 규칙 하나: 토글·숫자 모두 헤더 「저장」으로 반영. 금액 0 = 제한/조건 없음.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import EmptyState from '../common/EmptyState';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import Switch from '../common/Switch';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import StandardizedApi from '../../utils/standardizedApi';
import { ADMIN_SHOP_API } from '../../constants/adminShopApi';
import {
  ADMIN_SHOP_HOLD_TTL_DEFAULT_MINUTES,
  ADMIN_SHOP_POINT_POLICY_KEYS
} from '../../constants/adminShopPointPolicies';
import {
  ADMIN_SHOP_REWARD_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../constants/adminShopSuite';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { formatShopMoney } from '../../utils/clientShopFormat';
import { listAdminShopPackageFees } from '../../services/adminShopCatalogService';
import {
  adminShopBpsToPercent,
  adminShopPercentToBps,
  computeAdminShopRewardExample,
  countAdminShopFormChanges
} from '../../utils/adminShopSuite';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import { AdminShopPairPanel } from './shop/AdminShopSuiteParts';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopClinicOs.css';
import '../../styles/shop/AdminShopSuite.css';
import './AdminDashboard/AdminDashboardB0KlA.css';

const PAGE_TITLE_ID = 'admin-shop-point-policies-title';
const PERCENT_MAX = 100;
const HOLD_TTL_MIN = 1;

const buildInitialForm = () => ({
  earnPercent: '0',
  earnCap: '0',
  minOrder: '0',
  maxRedeem: '0',
  holdTtl: String(ADMIN_SHOP_HOLD_TTL_DEFAULT_MINUTES),
  allowPgMix: true,
  allowPointsOnly: true
});

/**
 * @param {object} policies
 * @param {string} key
 * @param {string} field
 * @returns {string|null}
 */
function readPolicyNumber(policies, key, field) {
  const value = policies?.[key];
  if (value && typeof value === 'object' && value[field] != null) {
    return String(value[field]);
  }
  return null;
}

/**
 * @param {object|null|undefined} policies
 * @returns {ReturnType<typeof buildInitialForm>}
 */
function mapPoliciesToForm(policies) {
  const base = buildInitialForm();
  if (!policies || typeof policies !== 'object') {
    return base;
  }
  const bps = readPolicyNumber(policies, ADMIN_SHOP_POINT_POLICY_KEYS.EARN_RATE, 'percentBps');
  return {
    earnPercent: bps != null ? adminShopBpsToPercent(bps) : base.earnPercent,
    earnCap: readPolicyNumber(policies, ADMIN_SHOP_POINT_POLICY_KEYS.EARN_CAP_PER_ORDER, 'amountMinor') ?? base.earnCap,
    minOrder: readPolicyNumber(policies, ADMIN_SHOP_POINT_POLICY_KEYS.MIN_ORDER_FOR_REDEEM, 'amountMinor') ?? base.minOrder,
    maxRedeem: readPolicyNumber(policies, ADMIN_SHOP_POINT_POLICY_KEYS.MAX_REDEEM_PER_ORDER, 'amountMinor') ?? base.maxRedeem,
    holdTtl: readPolicyNumber(policies, ADMIN_SHOP_POINT_POLICY_KEYS.HOLD_TTL_MINUTES, 'minutes') ?? base.holdTtl,
    allowPgMix: policies[ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_PG_MIX] !== false,
    allowPointsOnly: policies[ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_POINTS_ONLY] !== false
  };
}

/**
 * @param {string} value
 * @returns {number|null}
 */
function parseAmount(value) {
  const raw = String(value ?? '').replace(/[,\s]/g, '');
  if (raw === '') {
    return 0;
  }
  return /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : null;
}

/**
 * @param {ReturnType<typeof buildInitialForm>} form
 * @returns {{ valid: boolean, errors: Record<string, string>, values: object }}
 */
function validateRewardForm(form) {
  const errors = {};
  const earnBps = adminShopPercentToBps(form.earnPercent);
  if (earnBps == null || earnBps < 0 || earnBps > adminShopPercentToBps(PERCENT_MAX)) {
    errors.earnPercent = ADMIN_SHOP_REWARD_COPY.EARN_RATE_ERROR;
  }
  const values = {
    earnBps: earnBps ?? 0,
    earnCap: parseAmount(form.earnCap),
    minOrder: parseAmount(form.minOrder),
    maxRedeem: parseAmount(form.maxRedeem),
    holdTtl: parseAmount(form.holdTtl)
  };
  ['earnCap', 'minOrder', 'maxRedeem'].forEach((key) => {
    if (values[key] == null) {
      errors[key] = ADMIN_SHOP_REWARD_COPY.AMOUNT_ERROR;
    }
  });
  if (values.holdTtl == null || values.holdTtl < HOLD_TTL_MIN) {
    errors.holdTtl = ADMIN_SHOP_REWARD_COPY.HOLD_TTL_ERROR;
  }
  return { valid: Object.keys(errors).length === 0, errors, values };
}

/**
 * @param {ReturnType<typeof buildInitialForm>} form
 * @param {object} values validateRewardForm().values
 * @returns {{ policies: object }}
 */
function buildPatchBody(form, values) {
  return {
    policies: {
      [ADMIN_SHOP_POINT_POLICY_KEYS.EARN_RATE]: { percentBps: values.earnBps },
      [ADMIN_SHOP_POINT_POLICY_KEYS.EARN_CAP_PER_ORDER]: { amountMinor: values.earnCap },
      [ADMIN_SHOP_POINT_POLICY_KEYS.MIN_ORDER_FOR_REDEEM]: { amountMinor: values.minOrder },
      [ADMIN_SHOP_POINT_POLICY_KEYS.MAX_REDEEM_PER_ORDER]: { amountMinor: values.maxRedeem },
      [ADMIN_SHOP_POINT_POLICY_KEYS.HOLD_TTL_MINUTES]: { minutes: values.holdTtl },
      [ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_PG_MIX]: Boolean(form.allowPgMix),
      [ADMIN_SHOP_POINT_POLICY_KEYS.ALLOW_POINTS_ONLY]: Boolean(form.allowPointsOnly)
    }
  };
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function AmountField({ id, label, hint, value, error, suffix, onChange }) {
  return (
    <div className="admin-shop-suite__field">
      <label className="admin-shop-suite__label" htmlFor={id}>{label}</label>
      <span className="admin-shop-suite__input-suffix">
        <input
          id={id}
          className={`admin-shop-suite__input admin-shop-suite__num${error ? ' admin-shop-suite__input--error' : ''}`}
          inputMode="decimal"
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix ? <span className="admin-shop-suite__muted">{suffix}</span> : null}
      </span>
      <span className={`admin-shop-suite__hint${error ? ' admin-shop-suite__hint--error' : ''}`}>
        {error || hint}
      </span>
    </div>
  );
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function ToggleLine({ label, hint, checked, disabled, onChange }) {
  return (
    <div className="admin-shop-suite__row-line">
      <span className="admin-shop-suite__row-line-label">
        {label}
        <span className="admin-shop-suite__muted">{hint}</span>
      </span>
      <Switch checked={checked} disabled={disabled} ariaLabel={label} onCheckedChange={onChange} />
    </div>
  );
}

const AdminShopPointPoliciesPage = () => {
  const navigate = useNavigate();
  const baseId = useId();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [form, setForm] = useState(buildInitialForm);
  const [initialForm, setInitialForm] = useState(buildInitialForm);
  const [touched, setTouched] = useState(false);
  const [exampleProduct, setExampleProduct] = useState(null);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 AdminCommonLayout loading 미사용
   */
  const loadPolicies = useCallback(async(options = {}) => {
    try {
      await runResourceLoad(options, setLoading, async() => {
        const res = await StandardizedApi.get(ADMIN_SHOP_API.POINT_POLICIES);
        const data = res?.data ?? res;
        const next = mapPoliciesToForm(data?.policies);
        setForm(next);
        setInitialForm(next);
        setLoadError(false);
      });
    } catch {
      setLoadError(true);
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
    listAdminShopPackageFees()
      .then(({ packages }) => {
        const ready = packages.find((p) => Number(p?.unitPriceMinor) > 0 && Number(p?.sessionCount) > 0);
        setExampleProduct(ready || null);
      })
      .catch(() => setExampleProduct(null));
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadPolicies]);

  const validation = validateRewardForm(form);
  const changes = countAdminShopFormChanges(initialForm, form);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const errorFor = (key) => (touched || form[key] !== initialForm[key] ? validation.errors[key] : '');

  const example = useMemo(() => computeAdminShopRewardExample({
    price: exampleProduct?.unitPriceMinor ?? 0,
    earnBps: validation.values.earnBps,
    earnCap: validation.values.earnCap ?? 0,
    maxRedeem: validation.values.maxRedeem ?? 0,
    allowPgMix: form.allowPgMix,
    allowPointsOnly: form.allowPointsOnly
  }), [exampleProduct, validation.values, form.allowPgMix, form.allowPointsOnly]);

  const handleSave = async() => {
    setTouched(true);
    if (!validation.valid) {
      return;
    }
    setSaving(true);
    try {
      await StandardizedApi.patch(ADMIN_SHOP_API.POINT_POLICIES, buildPatchBody(form, validation.values));
      notificationManager.success(ADMIN_SHOP_REWARD_COPY.SAVED);
      await softRefresh(loadPolicies);
    } catch (e) {
      notificationManager.error(e?.message != null ? String(e.message) : ADMIN_SHOP_REWARD_COPY.SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const exampleTitle = exampleProduct?.packageName
    ? `${exampleProduct.packageName} ${ADMIN_SHOP_REWARD_COPY.EXAMPLE_TITLE_SUFFIX}`
    : ADMIN_SHOP_REWARD_COPY.EXAMPLE_TITLE_FALLBACK;
  const limitText = example.limitBlocked
    ? ADMIN_SHOP_REWARD_COPY.EXAMPLE_LIMIT_BLOCKED
    : (example.limitUnlimited ? ADMIN_SHOP_REWARD_COPY.EXAMPLE_LIMIT_NONE : formatShopMoney(example.limit));
  const pointUnit = ADMIN_SHOP_REWARD_COPY.POINT_UNIT;
  const rateChanged = form.earnPercent !== initialForm.earnPercent && !validation.errors.earnPercent;

  return (
    <AdminCommonLayout title={ADMIN_SHOP_REWARD_COPY.TITLE} loading={loading}>
      <ContentArea className="admin-shop-clinic-os admin-shop-suite" ariaLabel={ADMIN_SHOP_REWARD_COPY.TITLE}>
        <div className="admin-shop-suite" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REWARD_PAGE}>
          <ContentHeader
            titleId={PAGE_TITLE_ID}
            title={ADMIN_SHOP_REWARD_COPY.TITLE}
            subtitle={ADMIN_SHOP_REWARD_COPY.SUBTITLE}
            actions={(
              <div className="admin-shop-suite__header-actions admin-shop-suite__header-actions--nowrap">
                {changes > 0 ? (
                  <span className="admin-shop-suite__muted admin-shop-suite__changes-count">
                    {formatAdminShopCopy(ADMIN_SHOP_REWARD_COPY.CHANGES, { count: changes })}
                  </span>
                ) : null}
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  disabled={changes === 0 || saving}
                  onClick={() => {
                    setForm(initialForm);
                    setTouched(false);
                  }}
                >
                  {ADMIN_SHOP_REWARD_COPY.REVERT}
                </MGButton>
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
                  disabled={changes === 0 || saving || loadError || (touched && !validation.valid)}
                  loading={saving}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleSave}
                  data-testid={ADMIN_SHOP_SUITE_TEST_IDS.REWARD_SAVE}
                >
                  {ADMIN_SHOP_REWARD_COPY.SAVE}
                </MGButton>
              </div>
            )}
          />

          {loadError ? (
            <EmptyState
              title={ADMIN_SHOP_REWARD_COPY.SAVE_FAILED}
              action={(
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                  onClick={() => loadPolicies()}
                >
                  {ADMIN_SHOP_REWARD_COPY.REVERT}
                </MGButton>
              )}
            />
          ) : (
            <div className="admin-shop-suite__layout admin-shop-suite__layout--reward">
              <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-earn`}>
                <div className="admin-shop-suite__card-head">
                  <h2 id={`${baseId}-earn`} className="admin-shop-suite__card-title">{ADMIN_SHOP_REWARD_COPY.EARN_TITLE}</h2>
                  <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_REWARD_COPY.EARN_HINT}</span>
                </div>
                <AmountField
                  id={`${baseId}-earn-rate`}
                  label={ADMIN_SHOP_REWARD_COPY.EARN_RATE}
                  hint={ADMIN_SHOP_REWARD_COPY.EARN_RATE_HINT}
                  value={form.earnPercent}
                  suffix="%"
                  error={errorFor('earnPercent')}
                  onChange={(v) => setField('earnPercent', v)}
                />
                <AmountField
                  id={`${baseId}-earn-cap`}
                  label={ADMIN_SHOP_REWARD_COPY.EARN_CAP}
                  hint={ADMIN_SHOP_REWARD_COPY.EARN_CAP_HINT}
                  value={form.earnCap}
                  error={errorFor('earnCap')}
                  onChange={(v) => setField('earnCap', v)}
                />
                <ToggleLine
                  label={ADMIN_SHOP_REWARD_COPY.CLAWBACK}
                  hint={ADMIN_SHOP_REWARD_COPY.CLAWBACK_HINT}
                  checked
                  disabled
                  onChange={() => {}}
                />
              </section>

              <section className="admin-shop-suite__card" aria-labelledby={`${baseId}-spend`}>
                <div className="admin-shop-suite__card-head">
                  <h2 id={`${baseId}-spend`} className="admin-shop-suite__card-title">{ADMIN_SHOP_REWARD_COPY.SPEND_TITLE}</h2>
                  <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_REWARD_COPY.SPEND_HINT}</span>
                </div>
                <div className="admin-shop-suite__grid-2">
                  <AmountField
                    id={`${baseId}-min-order`}
                    label={ADMIN_SHOP_REWARD_COPY.MIN_ORDER}
                    hint={ADMIN_SHOP_REWARD_COPY.MIN_ORDER_HINT}
                    value={form.minOrder}
                    error={errorFor('minOrder')}
                    onChange={(v) => setField('minOrder', v)}
                  />
                  <AmountField
                    id={`${baseId}-max-redeem`}
                    label={ADMIN_SHOP_REWARD_COPY.MAX_REDEEM}
                    hint={ADMIN_SHOP_REWARD_COPY.MAX_REDEEM_HINT}
                    value={form.maxRedeem}
                    error={errorFor('maxRedeem')}
                    onChange={(v) => setField('maxRedeem', v)}
                  />
                </div>
                <ToggleLine
                  label={ADMIN_SHOP_REWARD_COPY.PG_MIX}
                  hint={ADMIN_SHOP_REWARD_COPY.PG_MIX_HINT}
                  checked={form.allowPgMix}
                  disabled={saving}
                  onChange={(v) => setField('allowPgMix', v)}
                />
                <ToggleLine
                  label={ADMIN_SHOP_REWARD_COPY.POINTS_ONLY}
                  hint={ADMIN_SHOP_REWARD_COPY.POINTS_ONLY_HINT}
                  checked={form.allowPointsOnly}
                  disabled={saving}
                  onChange={(v) => setField('allowPointsOnly', v)}
                />
                <AmountField
                  id={`${baseId}-hold-ttl`}
                  label={ADMIN_SHOP_REWARD_COPY.HOLD_TTL}
                  hint={ADMIN_SHOP_REWARD_COPY.HOLD_TTL_HINT}
                  value={form.holdTtl}
                  suffix={ADMIN_SHOP_REWARD_COPY.HOLD_TTL_UNIT}
                  error={errorFor('holdTtl')}
                  onChange={(v) => setField('holdTtl', v)}
                />
              </section>

              <aside className="admin-shop-suite__card admin-shop-suite__sticky">
                <span className="admin-shop-suite__eyebrow">{ADMIN_SHOP_REWARD_COPY.EXAMPLE_EYEBROW}</span>
                <h2 className="admin-shop-suite__card-title"><SafeText>{exampleTitle}</SafeText></h2>
                <div className="admin-shop-suite__row-line">
                  <span>{ADMIN_SHOP_REWARD_COPY.EXAMPLE_PRICE}</span>
                  <span className="admin-shop-suite__row-line-value">
                    <SafeText>{formatShopMoney(exampleProduct?.unitPriceMinor ?? 0)}</SafeText>
                  </span>
                </div>
                <div className="admin-shop-suite__row-line">
                  <span>{ADMIN_SHOP_REWARD_COPY.EXAMPLE_LIMIT}</span>
                  <span className="admin-shop-suite__row-line-value"><SafeText>{limitText}</SafeText></span>
                </div>
                <div className="admin-shop-suite__row-line">
                  <span>{ADMIN_SHOP_REWARD_COPY.EXAMPLE_USED}</span>
                  <span className="admin-shop-suite__row-line-value"><SafeText>{`${example.used}${pointUnit}`}</SafeText></span>
                </div>
                <div className="admin-shop-suite__row-line">
                  <span>{ADMIN_SHOP_REWARD_COPY.EXAMPLE_PAY}</span>
                  <span className="admin-shop-suite__row-line-value"><SafeText>{formatShopMoney(example.pay)}</SafeText></span>
                </div>
                <AdminShopPairPanel
                  amountLabel={ADMIN_SHOP_REWARD_COPY.EXAMPLE_EARN}
                  amountText={`+${example.earn.toLocaleString()}${pointUnit}`}
                  sessionsLabel={ADMIN_SHOP_REWARD_COPY.EXAMPLE_SESSIONS}
                  sessionsText={exampleProduct?.sessionCount != null ? `+${exampleProduct.sessionCount}` : '—'}
                  sessionsCaption={example.capApplied
                    ? ADMIN_SHOP_REWARD_COPY.EXAMPLE_CAP_APPLIED
                    : ADMIN_SHOP_REWARD_COPY.EXAMPLE_SESSIONS_CAPTION}
                />
                {rateChanged ? (
                  <span className="admin-shop-suite__muted">
                    {formatAdminShopCopy(ADMIN_SHOP_REWARD_COPY.EXAMPLE_RATE_CHANGE, {
                      from: `${initialForm.earnPercent}%`,
                      to: `${form.earnPercent}%`
                    })}
                  </span>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default AdminShopPointPoliciesPage;
