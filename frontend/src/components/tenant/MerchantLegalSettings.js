/**
 * 센터 설정 「사업자·약관」 — Clinic-OS merchant legal
 * 결제 연결 이웃. PG 승인(ops)과 분리.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import {
  SettingsPageShell,
  SettingsSectionPanel,
  SettingsSummaryStrip,
  SettingsButton
} from '../admin/settings-shell';
import UnifiedLoading from '../common/UnifiedLoading';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import MerchantLegalFooterPreview from './MerchantLegalFooterPreview';
import {
  deriveMerchantLegalStatusLabels,
  getMerchantLegal,
  sanitizeMerchantLegalGuideText,
  saveMerchantLegal
} from '../../utils/merchantLegalApi';
import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE,
  formatBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty,
  resolveBizSaveErrorMessage
} from '../../utils/businessRegistrationNumber';
import { KR_PUBLIC_DATA_COPY } from '../../content/krPublicData';
import {
  fetchKrPublicDataCapabilities,
  lookupBusinessRegistration,
  searchKrAddresses
} from '../../utils/krPublicDataApi';
import { openingDateError, representativeNameError } from '../../utils/merchantOpeningDate';
import {
  LEGAL_PUBLIC_LABELS,
  LEGAL_PUBLIC_PATHS
} from '../../constants/legalPublic';
import notificationManager from '../../utils/notification';
import '../../styles/unified-design-tokens.css';
import './MerchantLegalSettings.css';

const EMPTY_FORM = {
  businessRegistrationNumber: '',
  representativeName: '',
  openingDate: '',
  businessLandline: '',
  businessAddress: '',
  mailOrderReportNumber: '',
  refundPolicyText: '',
  productPriceGuideText: ''
};

const BIZ_NUMBER_INPUT_ID = 'merchant-legal-biz-number';
const BIZ_NUMBER_ERROR_ID = 'merchant-legal-biz-number-error';
const BIZ_NUMBER_TEST_ID = 'merchant-legal-biz-number';

const GUIDE_SANITIZE_HINT =
  '자리표시자 `[분]` 을 읽기 쉬운 문구로 바꿨습니다. 저장하면 반영됩니다.';

const TEXTAREA_ROWS = 6;

const PAGE_TITLE = '사업자·약관';
const PAGE_TITLE_ID = 'merchant-legal-settings-title';
const PAGE_CLASS_NAME = 'merchant-legal-settings--clinic-os';

/**
 * 사업자등록번호 입력으로 포커스·스크롤.
 */
function focusBizNumberField() {
  const el =
    document.querySelector(`[data-testid="${BIZ_NUMBER_TEST_ID}"]`) ||
    document.getElementById(BIZ_NUMBER_INPUT_ID);
  if (!el) return;
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

/**
 * API/폼 안내 문구의 `[분]` 자리표시자만 정리한다. 가격·상품 대괄호는 유지.
 *
 * @param {object} raw
 * @returns {{form: object, sanitized: boolean}}
 */
function normalizeGuideFields(raw = {}) {
  const refundRaw = raw.refundPolicyText ?? '';
  const priceRaw = raw.productPriceGuideText ?? '';
  const refundPolicyText = sanitizeMerchantLegalGuideText(refundRaw);
  const productPriceGuideText = sanitizeMerchantLegalGuideText(priceRaw);
  const sanitized =
    refundPolicyText !== refundRaw || productPriceGuideText !== priceRaw;

  return {
    form: {
      businessRegistrationNumber: raw.businessRegistrationNumber ?? '',
      representativeName: raw.representativeName ?? '',
      openingDate: raw.openingDate ?? '',
      businessLandline: raw.businessLandline ?? '',
      businessAddress: raw.businessAddress ?? '',
      mailOrderReportNumber: raw.mailOrderReportNumber ?? '',
      refundPolicyText,
      productPriceGuideText
    },
    sanitized
  };
}

const MerchantLegalSettings = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const tenantId = user?.tenantId || user?.tenant_id;
  const centerName = user?.tenantName || user?.tenant?.name || '';

  const [form, setForm] = useState(EMPTY_FORM);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_FORM);
  const [guideSanitizeHint, setGuideSanitizeHint] = useState(false);
  const [statusLabels, setStatusLabels] = useState({
    registrationStatusLabel: '미등록',
    mailOrderStatusLabel: '미등록',
    sitePublicStatusLabel: '비공개'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bizError, setBizError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [verification, setVerification] = useState(null);
  const [addressSearchEnabled, setAddressSearchEnabled] = useState(false);
  const [addressHits, setAddressHits] = useState([]);
  const [addressMessage, setAddressMessage] = useState('');
  const [addressSearching, setAddressSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getMerchantLegal(tenantId);
      const { form: next, sanitized } = normalizeGuideFields(data);
      setForm(next);
      setSavedSnapshot(next);
      setGuideSanitizeHint(sanitized);
      setStatusLabels({
        registrationStatusLabel: data?.registrationStatusLabel || '미등록',
        mailOrderStatusLabel: data?.mailOrderStatusLabel || '미등록',
        sitePublicStatusLabel: data?.sitePublicStatusLabel || '비공개'
      });
      setVerification(data?.businessVerification || null);
    } catch (err) {
      console.error(err);
      setLoadError('사업자·약관 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    let cancelled = false;
    fetchKrPublicDataCapabilities()
      .then((caps) => {
        if (!cancelled) {
          setAddressSearchEnabled(Boolean(caps?.addressSearchEnabled));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddressSearchEnabled(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && tenantId) {
      load();
    }
  }, [sessionLoading, isLoggedIn, tenantId, load]);

  const refreshLookup = async () => {
    setRefreshing(true);
    setFieldError('');
    try {
      const result = await lookupBusinessRegistration({
        businessRegistrationNumber: form.businessRegistrationNumber,
        openingDate: form.openingDate,
        representativeName: form.representativeName
      });
      setVerification(result || null);
    } catch (err) {
      setFieldError(err?.message || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED);
    } finally {
      setRefreshing(false);
    }
  };

  const searchAddress = async () => {
    setAddressSearching(true);
    setAddressMessage('');
    try {
      const items = await searchKrAddresses(form.businessAddress || '');
      setAddressHits(items);
      if (!items.length) {
        setAddressMessage(KR_PUBLIC_DATA_COPY.ADDRESS_EMPTY);
      }
    } catch {
      setAddressHits([]);
      setAddressMessage(KR_PUBLIC_DATA_COPY.ADDRESS_FAILED);
    } finally {
      setAddressSearching(false);
    }
  };

  const liveStatus = useMemo(() => deriveMerchantLegalStatusLabels(form), [form]);
  const previewCenterName =
    (centerName && String(centerName).trim()) ||
    form.representativeName ||
    '입점 센터명';

  const onChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'businessRegistrationNumber') {
      if (!isValidBusinessRegistrationNumberOrEmpty(value)) {
        setBizError(BUSINESS_REGISTRATION_INVALID_MESSAGE);
      } else {
        setBizError('');
      }
    }
  };

  const onGuideBlur = (key) => () => {
    setForm((prev) => {
      const raw = prev[key] ?? '';
      const cleaned = sanitizeMerchantLegalGuideText(raw);
      if (cleaned === raw) {
        return prev;
      }
      setGuideSanitizeHint(true);
      return { ...prev, [key]: cleaned };
    });
  };

  const handleSave = async () => {
    if (!tenantId) return;
    if (!isValidBusinessRegistrationNumberOrEmpty(form.businessRegistrationNumber)) {
      setBizError(BUSINESS_REGISTRATION_INVALID_MESSAGE);
      notificationManager.show(BUSINESS_REGISTRATION_SAVE_BLOCKED_MESSAGE, 'error');
      focusBizNumberField();
      return;
    }
    const repError = representativeNameError(form.representativeName);
    const dateError = openingDateError(form.openingDate);
    if (repError || dateError) {
      setFieldError(repError || dateError);
      notificationManager.show(repError || dateError, 'error');
      return;
    }
    setFieldError('');
    try {
      setSaving(true);
      const { form: sanitizedForm } = normalizeGuideFields(form);
      const payload = {
        ...sanitizedForm,
        businessRegistrationNumber: sanitizedForm.businessRegistrationNumber
          ? formatBusinessRegistrationNumber(sanitizedForm.businessRegistrationNumber)
          : '',
        refundPolicyText: sanitizedForm.refundPolicyText,
        productPriceGuideText: sanitizedForm.productPriceGuideText
      };
      const data = await saveMerchantLegal(tenantId, payload);
      const { form: next } = normalizeGuideFields({
        businessRegistrationNumber:
          data?.businessRegistrationNumber ?? payload.businessRegistrationNumber,
        representativeName: data?.representativeName ?? payload.representativeName,
        openingDate: data?.openingDate ?? payload.openingDate,
        businessLandline: data?.businessLandline ?? payload.businessLandline,
        businessAddress: data?.businessAddress ?? payload.businessAddress,
        mailOrderReportNumber: data?.mailOrderReportNumber ?? payload.mailOrderReportNumber,
        refundPolicyText: data?.refundPolicyText ?? payload.refundPolicyText,
        productPriceGuideText: data?.productPriceGuideText ?? payload.productPriceGuideText
      });
      setForm(next);
      setSavedSnapshot(next);
      setGuideSanitizeHint(false);
      setStatusLabels({
        registrationStatusLabel: data?.registrationStatusLabel || liveStatus.registrationStatusLabel,
        mailOrderStatusLabel: data?.mailOrderStatusLabel || liveStatus.mailOrderStatusLabel,
        sitePublicStatusLabel: data?.sitePublicStatusLabel || liveStatus.sitePublicStatusLabel
      });
      setBizError('');
      setVerification(data?.businessVerification || null);
      notificationManager.show('사업자·약관이 저장되었습니다.', 'success');
    } catch (err) {
      const bizSaveMsg = resolveBizSaveErrorMessage(err);
      if (bizSaveMsg) {
        setBizError(bizSaveMsg);
        notificationManager.show(bizSaveMsg, 'error');
        focusBizNumberField();
        return;
      }
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '저장에 실패했습니다.';
      notificationManager.show(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout title={PAGE_TITLE}>
        <SettingsPageShell title={PAGE_TITLE} titleId={PAGE_TITLE_ID} className={PAGE_CLASS_NAME}>
          <UnifiedLoading type="inline" text="세션 확인 중…" />
        </SettingsPageShell>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  const summaryItems = [
    { key: 'registration', label: '등록', value: statusLabels.registrationStatusLabel },
    { key: 'mailOrder', label: '통신판매', value: statusLabels.mailOrderStatusLabel },
    { key: 'sitePublic', label: '사이트 공개', value: statusLabels.sitePublicStatusLabel }
  ];

  return (
    <AdminCommonLayout title={PAGE_TITLE}>
      <SettingsPageShell
        title={PAGE_TITLE}
        titleId={PAGE_TITLE_ID}
        className={PAGE_CLASS_NAME}
        actions={(
          <>
            <SettingsButton
              variant="ghost"
              preventDoubleClick
              onClick={() => {
                const el = document.getElementById('merchant-legal-public-preview');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              미리보기
            </SettingsButton>
            <SettingsButton
              variant="primary"
              preventDoubleClick
              loading={saving}
              onClick={handleSave}
              data-testid="merchant-legal-save"
            >
              저장
            </SettingsButton>
          </>
        )}
        summary={<SettingsSummaryStrip items={summaryItems} ariaLabel="등록 상태" />}
      >
        <SettingsSectionPanel
          id="merchant-legal-public-preview"
          testId="merchant-legal-preview-rail"
          className="merchant-legal-settings__preview-rail"
          title="공개 미리보기"
          body="plain"
          actions={(
            <span className="merchant-legal-settings__preview-badge">
              {liveStatus.registrationStatusLabel}
            </span>
          )}
        >
          <p className="mg-v2-settings-muted">
            저장하면 고객에게 이렇게 보입니다. 결제 연결은 「결제 연결」에서 진행합니다.
            {' '}
            {JSON.stringify(form) === JSON.stringify(savedSnapshot)
              ? '현재 미리보기는 저장본과 동일합니다.'
              : '저장 전 미리보기입니다. 저장하면 공개 값이 갱신됩니다.'}
          </p>
        </SettingsSectionPanel>

        <SafeErrorDisplay error={loadError} />

        <div className="merchant-legal-settings__stage">
          <div className="merchant-legal-settings__form-col">
            {loading ? (
              <p className="mg-v2-settings-muted">불러오는 중…</p>
            ) : (
              <>
                <SettingsSectionPanel title="사업자">
                  <div className="mg-v2-settings-form-grid">
                    <label className="mg-v2-settings-field merchant-legal-settings__field">
                      <span className="mg-v2-form-label">사업자등록번호</span>
                      <input
                        id={BIZ_NUMBER_INPUT_ID}
                        type="text"
                        className="mg-v2-form-input"
                        value={form.businessRegistrationNumber}
                        onChange={onChange('businessRegistrationNumber')}
                        placeholder="000-00-00000"
                        aria-invalid={Boolean(bizError)}
                        aria-describedby={bizError ? BIZ_NUMBER_ERROR_ID : undefined}
                        data-testid={BIZ_NUMBER_TEST_ID}
                      />
                      {bizError && (
                        <span
                          id={BIZ_NUMBER_ERROR_ID}
                          className="merchant-legal-settings__field-error"
                          role="alert"
                        >
                          {bizError}
                        </span>
                      )}
                    </label>
                    <label className="mg-v2-settings-field merchant-legal-settings__field">
                      <span className="mg-v2-form-label">대표자</span>
                      <input
                        type="text"
                        className="mg-v2-form-input"
                        value={form.representativeName}
                        onChange={onChange('representativeName')}
                        placeholder="대표 이름"
                      />
                    </label>
                    <p className="merchant-legal-settings__notice">{KR_PUBLIC_DATA_COPY.PRIVACY_NOTICE}</p>
                    <label className="mg-v2-settings-field merchant-legal-settings__field">
                      <span className="mg-v2-form-label">{KR_PUBLIC_DATA_COPY.LABEL_OPENING_DATE}</span>
                      <input
                        type="date"
                        className="mg-v2-form-input"
                        value={form.openingDate}
                        onChange={onChange('openingDate')}
                        data-testid="merchant-legal-opening-date"
                      />
                    </label>
                    {fieldError && (
                      <p className="merchant-legal-settings__field-error" role="alert">
                        {fieldError}
                      </p>
                    )}
                    <div className="merchant-legal-settings__verification" data-testid="merchant-legal-verification">
                      <span className="mg-v2-form-label">{KR_PUBLIC_DATA_COPY.LABEL_VERIFICATION}</span>
                      <p>
                        {KR_PUBLIC_DATA_COPY.LABEL_MATCH} {verification?.overallStatus || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                      </p>
                      <p>
                        {KR_PUBLIC_DATA_COPY.LABEL_STATUS} {verification?.businessStatus || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                      </p>
                      <p>
                        {KR_PUBLIC_DATA_COPY.LABEL_TAX} {verification?.taxType || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                      </p>
                      <p>
                        {KR_PUBLIC_DATA_COPY.LABEL_CHECKED_AT} {verification?.checkedAt || KR_PUBLIC_DATA_COPY.OVERALL_UNCONFIRMED}
                      </p>
                      <button
                        type="button"
                        className="mg-v2-settings-button"
                        onClick={refreshLookup}
                        disabled={refreshing}
                      >
                        {KR_PUBLIC_DATA_COPY.REFRESH}
                      </button>
                    </div>
                    <label className="mg-v2-settings-field merchant-legal-settings__field">
                      <span className="mg-v2-form-label">유선전화</span>
                      <input
                        type="text"
                        className="mg-v2-form-input"
                        value={form.businessLandline}
                        onChange={onChange('businessLandline')}
                        placeholder="000-000-0000"
                      />
                    </label>
                    <label className="mg-v2-settings-field merchant-legal-settings__field">
                      <span className="mg-v2-form-label">사업장 주소</span>
                      <input
                        type="text"
                        className="mg-v2-form-input"
                        value={form.businessAddress}
                        onChange={onChange('businessAddress')}
                        placeholder="주소"
                      />
                      {addressSearchEnabled && (
                        <button
                          type="button"
                          className="mg-v2-settings-button merchant-legal-settings__address-search"
                          onClick={searchAddress}
                          disabled={addressSearching}
                        >
                          {addressSearching
                            ? KR_PUBLIC_DATA_COPY.ADDRESS_SEARCHING
                            : KR_PUBLIC_DATA_COPY.ADDRESS_SEARCH}
                        </button>
                      )}
                      {addressMessage && <p className="mg-v2-settings-muted">{addressMessage}</p>}
                      {addressHits.length > 0 && (
                        <ul className="merchant-legal-settings__address-hits">
                          {addressHits.map((item) => (
                            <li key={`${item.zipCode}-${item.roadAddress}`}>
                              <button
                                type="button"
                                className="merchant-legal-settings__address-hit"
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, businessAddress: item.roadAddress }));
                                  setAddressHits([]);
                                  setAddressMessage('');
                                }}
                              >
                                {item.zipCode} {item.roadAddress}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </label>
                  </div>
                </SettingsSectionPanel>

                <SettingsSectionPanel title="통신판매">
                  <label className="mg-v2-settings-field merchant-legal-settings__field">
                    <span className="mg-v2-form-label">통신판매업 신고번호</span>
                    <input
                      type="text"
                      className="mg-v2-form-input"
                      value={form.mailOrderReportNumber}
                      onChange={onChange('mailOrderReportNumber')}
                      placeholder="제0000-OOOO-0000호"
                    />
                  </label>
                </SettingsSectionPanel>

                <SettingsSectionPanel
                  title="이용약관·개인정보처리방침"
                  className="merchant-legal-settings__section--platform"
                  testId="merchant-legal-platform-notice"
                >
                  <p className="mg-v2-settings-muted">
                    이용약관·개인정보처리방침은 플랫폼 공통 · 편집 불가
                  </p>
                  <div className="merchant-legal-settings__platform-links">
                    <Link
                      to={LEGAL_PUBLIC_PATHS.TERMS}
                      className="merchant-legal-settings__platform-link"
                      data-testid="merchant-legal-platform-terms"
                    >
                      {LEGAL_PUBLIC_LABELS.TERMS}
                    </Link>
                    <Link
                      to={LEGAL_PUBLIC_PATHS.PRIVACY}
                      className="merchant-legal-settings__platform-link"
                      data-testid="merchant-legal-platform-privacy"
                    >
                      {LEGAL_PUBLIC_LABELS.PRIVACY}
                    </Link>
                  </div>
                </SettingsSectionPanel>

                <SettingsSectionPanel title="환불·취소·청약철회">
                  <label className="mg-v2-settings-field merchant-legal-settings__field">
                    <span className="mg-v2-form-label">안내 문구</span>
                    <textarea
                      rows={TEXTAREA_ROWS}
                      className="mg-v2-form-textarea"
                      value={form.refundPolicyText}
                      onChange={onChange('refundPolicyText')}
                      onBlur={onGuideBlur('refundPolicyText')}
                      placeholder="센터 정책에 맞는 환불·취소·청약철회 안내를 입력하세요"
                    />
                  </label>
                  <p className="mg-v2-settings-field__hint">
                    비어 있으면 공개 페이지
                    {' '}
                    <Link to={LEGAL_PUBLIC_PATHS.REFUND}>{LEGAL_PUBLIC_LABELS.REFUND}</Link>
                    에 플랫폼 기본 안내가 표시됩니다. 등록하면 센터 문구가 우선합니다.
                  </p>
                </SettingsSectionPanel>

                <SettingsSectionPanel title="상품·가격">
                  <label className="mg-v2-settings-field merchant-legal-settings__field">
                    <span className="mg-v2-form-label">안내 문구</span>
                    <textarea
                      rows={TEXTAREA_ROWS}
                      className="mg-v2-form-textarea"
                      value={form.productPriceGuideText}
                      onChange={onChange('productPriceGuideText')}
                      onBlur={onGuideBlur('productPriceGuideText')}
                      placeholder="상품 구성과 가격 안내를 입력하세요"
                    />
                  </label>
                  {guideSanitizeHint && (
                    <p
                      className="mg-v2-settings-field__hint"
                      data-testid="merchant-legal-sanitize-hint"
                    >
                      {GUIDE_SANITIZE_HINT}
                    </p>
                  )}
                  <p className="mg-v2-settings-field__hint">
                    고객에게 보이는 상품·가격 목록은 「패키지 요금」에 등록된 항목이며, 공개 페이지
                    {' '}
                    <Link to={LEGAL_PUBLIC_PATHS.PRODUCTS}>{LEGAL_PUBLIC_LABELS.PRODUCTS}</Link>
                    에서 확인합니다.
                  </p>
                </SettingsSectionPanel>

                <p className="mg-v2-settings-field__hint">
                  온보딩에서 입력한 값이 있으면 여기에 미리 채워집니다. 비어 있는 항목만 보완하면 됩니다.
                </p>
              </>
            )}
          </div>

          <aside className="merchant-legal-settings__preview-col" aria-label="사이트에 보이는 모습">
            <SettingsSectionPanel title="사이트에 보이는 모습" body="plain">
              <MerchantLegalFooterPreview
                centerName={previewCenterName}
                legal={form}
                compact
                showAccountLinks={false}
              />
              <p className="mg-v2-settings-field__hint">
                예시 레이아웃 · 실제 값은 센터 DB에서 가져옵니다.
              </p>
            </SettingsSectionPanel>
          </aside>
        </div>
      </SettingsPageShell>
    </AdminCommonLayout>
  );
};

export default MerchantLegalSettings;
