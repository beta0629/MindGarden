/**
 * 센터 설정 「사업자·약관」 — Clinic-OS merchant legal
 * 결제 연결 이웃. PG 승인(ops)과 분리.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../erp/common/erpMgButtonProps';
import MerchantLegalFooterPreview from './MerchantLegalFooterPreview';
import {
  deriveMerchantLegalStatusLabels,
  getMerchantLegal,
  saveMerchantLegal
} from '../../utils/merchantLegalApi';
import {
  BUSINESS_REGISTRATION_INVALID_MESSAGE,
  formatBusinessRegistrationNumber,
  isValidBusinessRegistrationNumberOrEmpty
} from '../../utils/businessRegistrationNumber';
import notificationManager from '../../utils/notification';
import '../../styles/unified-design-tokens.css';
import './MerchantLegalSettings.css';

const EMPTY_FORM = {
  businessRegistrationNumber: '',
  representativeName: '',
  businessLandline: '',
  businessAddress: '',
  mailOrderReportNumber: '',
  refundPolicyText: '',
  productPriceGuideText: ''
};

const MerchantLegalSettings = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const tenantId = user?.tenantId || user?.tenant_id;
  const centerName = user?.tenantName || user?.tenant?.name || '';

  const [form, setForm] = useState(EMPTY_FORM);
  const [savedSnapshot, setSavedSnapshot] = useState(EMPTY_FORM);
  const [statusLabels, setStatusLabels] = useState({
    registrationStatusLabel: '미등록',
    mailOrderStatusLabel: '미등록',
    sitePublicStatusLabel: '비공개'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bizError, setBizError] = useState('');
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setLoadError(null);
      const data = await getMerchantLegal(tenantId);
      const next = {
        businessRegistrationNumber: data?.businessRegistrationNumber || '',
        representativeName: data?.representativeName || '',
        businessLandline: data?.businessLandline || '',
        businessAddress: data?.businessAddress || '',
        mailOrderReportNumber: data?.mailOrderReportNumber || '',
        refundPolicyText: data?.refundPolicyText || '',
        productPriceGuideText: data?.productPriceGuideText || ''
      };
      setForm(next);
      setSavedSnapshot(next);
      setStatusLabels({
        registrationStatusLabel: data?.registrationStatusLabel || '미등록',
        mailOrderStatusLabel: data?.mailOrderStatusLabel || '미등록',
        sitePublicStatusLabel: data?.sitePublicStatusLabel || '비공개'
      });
    } catch (err) {
      console.error(err);
      setLoadError('사업자·약관 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && tenantId) {
      load();
    }
  }, [sessionLoading, isLoggedIn, tenantId, load]);

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

  const handleSave = async () => {
    if (!tenantId) return;
    if (!isValidBusinessRegistrationNumberOrEmpty(form.businessRegistrationNumber)) {
      setBizError(BUSINESS_REGISTRATION_INVALID_MESSAGE);
      notificationManager.show(BUSINESS_REGISTRATION_INVALID_MESSAGE, 'error');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...form,
        businessRegistrationNumber: form.businessRegistrationNumber
          ? formatBusinessRegistrationNumber(form.businessRegistrationNumber)
          : ''
      };
      const data = await saveMerchantLegal(tenantId, payload);
      const next = {
        businessRegistrationNumber: data?.businessRegistrationNumber || payload.businessRegistrationNumber,
        representativeName: data?.representativeName || payload.representativeName,
        businessLandline: data?.businessLandline || payload.businessLandline,
        businessAddress: data?.businessAddress || payload.businessAddress,
        mailOrderReportNumber: data?.mailOrderReportNumber || payload.mailOrderReportNumber,
        refundPolicyText: data?.refundPolicyText || payload.refundPolicyText,
        productPriceGuideText: data?.productPriceGuideText || payload.productPriceGuideText
      };
      setForm(next);
      setSavedSnapshot(next);
      setStatusLabels({
        registrationStatusLabel: data?.registrationStatusLabel || liveStatus.registrationStatusLabel,
        mailOrderStatusLabel: data?.mailOrderStatusLabel || liveStatus.mailOrderStatusLabel,
        sitePublicStatusLabel: data?.sitePublicStatusLabel || liveStatus.sitePublicStatusLabel
      });
      setBizError('');
      notificationManager.show('사업자·약관이 저장되었습니다.', 'success');
    } catch (err) {
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
      <AdminCommonLayout title="사업자·약관">
        <ContentArea>
          <p>세션 확인 중…</p>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    navigate('/login');
    return null;
  }

  return (
    <AdminCommonLayout title="사업자·약관">
      <ContentArea className="merchant-legal-settings--clinic-os">
        <ContentHeader
          title="사업자·약관"
          subtitle="사이트·PG 검증에 쓰는 입점 정보 · 센터별로 등록합니다."
          actions={(
            <div className="merchant-legal-settings__header-actions">
              <MGButton
                variant="secondary"
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                onClick={() => {
                  const el = document.getElementById('merchant-legal-public-preview');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                미리보기
              </MGButton>
              <MGButton
                variant="primary"
                className={`merchant-legal-settings__save ${buildErpMgButtonClassName({
                  variant: 'primary',
                  loading: saving
                })}`}
                loading={saving}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleSave}
                data-testid="merchant-legal-save"
              >
                저장
              </MGButton>
            </div>
          )}
        />

        <div className="merchant-legal-settings-summary mapping-management-summary" aria-label="등록 상태">
          <div className="merchant-legal-settings-summary__cell">
            <span className="merchant-legal-settings-summary__label">등록</span>
            <strong data-testid="merchant-legal-status-reg">
              {statusLabels.registrationStatusLabel}
            </strong>
          </div>
          <div className="merchant-legal-settings-summary__cell">
            <span className="merchant-legal-settings-summary__label">통신판매</span>
            <strong data-testid="merchant-legal-status-mail">
              {statusLabels.mailOrderStatusLabel}
            </strong>
          </div>
          <div className="merchant-legal-settings-summary__cell">
            <span className="merchant-legal-settings-summary__label">사이트 공개</span>
            <strong data-testid="merchant-legal-status-site">
              {statusLabels.sitePublicStatusLabel}
            </strong>
          </div>
        </div>

        <div
          className="merchant-legal-settings__preview-rail"
          id="merchant-legal-public-preview"
          data-testid="merchant-legal-preview-rail"
        >
          <div className="merchant-legal-settings__preview-rail-text">
            <strong>공개 미리보기</strong>
            <span>
              저장하면 고객에게 이렇게 보입니다. 결제 연결은 「결제 연결」에서 진행합니다.
              {' '}
              {JSON.stringify(form) === JSON.stringify(savedSnapshot)
                ? '현재 미리보기는 저장본과 동일합니다.'
                : '저장 전 미리보기입니다. 저장하면 공개 값이 갱신됩니다.'}
            </span>
          </div>
          <span className="merchant-legal-settings__preview-badge">
            {liveStatus.registrationStatusLabel}
          </span>
        </div>

        {loadError && (
          <p className="merchant-legal-settings__error" role="alert">{loadError}</p>
        )}

        <div className="merchant-legal-settings__stage">
          <div className="merchant-legal-settings__form-col">
            {loading ? (
              <p>불러오는 중…</p>
            ) : (
              <>
                <section className="merchant-legal-settings__section" aria-labelledby="ml-biz">
                  <h2 id="ml-biz">사업자</h2>
                  <label className="merchant-legal-settings__field">
                    <span>사업자등록번호</span>
                    <input
                      type="text"
                      value={form.businessRegistrationNumber}
                      onChange={onChange('businessRegistrationNumber')}
                      placeholder="000-00-00000"
                      aria-invalid={Boolean(bizError)}
                      data-testid="merchant-legal-biz-number"
                    />
                    {bizError && (
                      <span className="merchant-legal-settings__field-error" role="alert">
                        {bizError}
                      </span>
                    )}
                  </label>
                  <label className="merchant-legal-settings__field">
                    <span>대표자</span>
                    <input
                      type="text"
                      value={form.representativeName}
                      onChange={onChange('representativeName')}
                      placeholder="대표 이름"
                    />
                  </label>
                  <label className="merchant-legal-settings__field">
                    <span>유선전화</span>
                    <input
                      type="text"
                      value={form.businessLandline}
                      onChange={onChange('businessLandline')}
                      placeholder="000-000-0000"
                    />
                  </label>
                  <label className="merchant-legal-settings__field">
                    <span>사업장 주소</span>
                    <input
                      type="text"
                      value={form.businessAddress}
                      onChange={onChange('businessAddress')}
                      placeholder="주소"
                    />
                  </label>
                </section>

                <section className="merchant-legal-settings__section" aria-labelledby="ml-mail">
                  <h2 id="ml-mail">통신판매</h2>
                  <label className="merchant-legal-settings__field">
                    <span>통신판매업 신고번호</span>
                    <input
                      type="text"
                      value={form.mailOrderReportNumber}
                      onChange={onChange('mailOrderReportNumber')}
                      placeholder="제0000-OOOO-0000호"
                    />
                  </label>
                </section>

                <section className="merchant-legal-settings__section" aria-labelledby="ml-refund">
                  <h2 id="ml-refund">환불·취소·청약철회</h2>
                  <label className="merchant-legal-settings__field">
                    <span>안내 문구</span>
                    <textarea
                      rows={4}
                      value={form.refundPolicyText}
                      onChange={onChange('refundPolicyText')}
                      placeholder="센터 정책에 맞는 환불·취소·청약철회 안내 (DB)"
                    />
                  </label>
                </section>

                <section className="merchant-legal-settings__section" aria-labelledby="ml-price">
                  <h2 id="ml-price">상품·가격</h2>
                  <label className="merchant-legal-settings__field">
                    <span>안내 문구</span>
                    <textarea
                      rows={4}
                      value={form.productPriceGuideText}
                      onChange={onChange('productPriceGuideText')}
                      placeholder="상품 구성·가격 안내 (DB · 하드코딩 금지)"
                    />
                  </label>
                </section>

                <p className="merchant-legal-settings__hint">
                  온보딩에서 입력한 값이 있으면 여기에 미리 채워집니다. 비어 있는 항목만 보완하면 됩니다.
                </p>
              </>
            )}
          </div>

          <aside className="merchant-legal-settings__preview-col" aria-label="사이트에 보이는 모습">
            <h2>사이트에 보이는 모습</h2>
            <MerchantLegalFooterPreview
              centerName={previewCenterName}
              legal={form}
              compact
              showAccountLinks={false}
            />
            <p className="merchant-legal-settings__preview-note">
              예시 레이아웃 · 실제 값은 센터 DB에서 가져옵니다.
            </p>
          </aside>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default MerchantLegalSettings;
