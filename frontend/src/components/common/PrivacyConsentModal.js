import { useEffect, useState } from 'react';
import { XCircle, Check, ChevronDown, ChevronUp, FileText, Megaphone } from 'lucide-react';
import UnifiedModal from './modals/UnifiedModal';
import MGButton from './MGButton';
import notificationManager from '../../utils/notification';
import { PrivacyPolicyContent } from './PrivacyPolicy';
import { TermsOfServiceContent } from './TermsOfService';
import StandardizedApi from '../../utils/standardizedApi';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  DEFAULT_GNB_LOGO_LABEL,
  SESSION_SUBDOMAIN_TENANT_NAME_KEY,
  getConsentModalTenantLabel,
  shouldFetchSubdomainTenantDisplayNameForConsent
} from '../../utils/tenantDisplayName';
import { getTenantSubdomainFromHost } from '../../utils/subdomainUtils';
import './PrivacyConsentModal.css';

/**
 * 개인정보 수집 및 이용 동의 모달 컴포넌트
 *
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-17
 */
const PrivacyConsentModal = ({
  isOpen,
  onClose,
  onConsent,
  title = '개인정보 수집 및 이용 동의',
  showMarketingConsent = true,
  tenantDisplayName = null,
  brandingInfo = null
}) => {
  const [introTenantLabel, setIntroTenantLabel] = useState(() =>
    getConsentModalTenantLabel({ tenantDisplayName, brandingInfo })
  );

  const [consents, setConsents] = useState({
    privacy: false,
    terms: false,
    marketing: false
  });

  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const opts = { tenantDisplayName, brandingInfo };
    setIntroTenantLabel(getConsentModalTenantLabel(opts));

    if (!shouldFetchSubdomainTenantDisplayNameForConsent({ brandingInfo, tenantDisplayName })) {
      return;
    }

    const subdomain = getTenantSubdomainFromHost();
    if (!subdomain) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const tenantData = await StandardizedApi.get('/api/v1/auth/tenant/by-subdomain', { subdomain });
        if (cancelled) {
          return;
        }
        if (tenantData && tenantData.found && tenantData.tenant) {
          const nm = toDisplayString(tenantData.tenant.name, '').trim();
          const toStore = nm || subdomain;
          try {
            globalThis.window?.sessionStorage?.setItem(SESSION_SUBDOMAIN_TENANT_NAME_KEY, toStore);
          } catch {
            /* 저장 실패 시 무시 */
          }
          setIntroTenantLabel(getConsentModalTenantLabel(opts));
        }
      } catch (e) {
        console.warn('PrivacyConsentModal: 테넌트 표시명 보강 실패', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, tenantDisplayName, brandingInfo]);

  const handleConsentChange = (type) => {
    setConsents((prev) => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSubmit = () => {
    if (!consents.privacy || !consents.terms) {
      notificationManager.show('필수 동의 항목에 모두 동의해주세요.', 'info');
      return;
    }

    onConsent({
      privacy: consents.privacy,
      terms: consents.terms,
      marketing: consents.marketing
    });
    onClose();
  };

  const isSubmitDisabled = !consents.privacy || !consents.terms;

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="auto"
      backdropClick={true}
      showCloseButton={true}
      actions={
        <>
          <MGButton variant="secondary" type="button" onClick={onClose}>
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </MGButton>
          <MGButton
            variant="primary"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            preventDoubleClick={false}
          >
            <Check size={20} className="mg-v2-icon-inline" />
            동의하고 계속하기
          </MGButton>
        </>
      }
    >
      <div className="privacy-consent-modal">
        <div className="mg-v2-info-box mg-v2-mb-lg">
          <p className="mg-v2-text-sm">
            {`${toDisplayString(introTenantLabel, DEFAULT_GNB_LOGO_LABEL)} 서비스 이용을 위해 아래 개인정보 수집 및 이용에 동의해주세요.`}
          </p>
        </div>

        <div className="mg-v2-form-section">
          <h3 className="mg-v2-section-title mg-v2-mb-md">
            필수 동의 항목
            <span className="mg-v2-badge mg-v2-badge--danger">필수</span>
          </h3>

          <div className={`mg-v2-form-checkbox-group ${consents.privacy ? 'mg-v2-form-checkbox-group--checked' : ''}`}>
            <label className="mg-v2-form-checkbox">
              <input
                type="checkbox"
                checked={consents.privacy}
                onChange={() => handleConsentChange('privacy')}
              />
              <div className="mg-v2-form-checkbox-content">
                <div className="mg-v2-form-checkbox-title">
                  <FileText size={16} className="mg-v2-icon-inline" />
                  개인정보 처리방침에 동의합니다 <span className="mg-v2-form-label-required">*</span>
                </div>
                <div className="mg-v2-form-checkbox-description">
                  서비스 이용을 위해 필요한 개인정보 수집 및 이용에 동의합니다.
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                  className="mg-v2-button mg-v2-button--link mg-v2-mt-xs"
                >
                  {showPrivacyDetail ? (
                    <>
                      <ChevronUp size={14} className="mg-v2-icon-inline" />
                      간략히 보기
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mg-v2-icon-inline" />
                      자세히 보기
                    </>
                  )}
                </button>
              </div>
            </label>

            {showPrivacyDetail && (
              <div className="privacy-consent-modal__legal-scroll mg-v2-info-box mg-v2-mt-sm">
                <PrivacyPolicyContent omitHeading />
              </div>
            )}
          </div>

          <div className={`mg-v2-form-checkbox-group ${consents.terms ? 'mg-v2-form-checkbox-group--checked' : ''}`}>
            <label className="mg-v2-form-checkbox">
              <input
                type="checkbox"
                checked={consents.terms}
                onChange={() => handleConsentChange('terms')}
              />
              <div className="mg-v2-form-checkbox-content">
                <div className="mg-v2-form-checkbox-title">
                  <FileText size={16} className="mg-v2-icon-inline" />
                  이용약관에 동의합니다 <span className="mg-v2-form-label-required">*</span>
                </div>
                <div className="mg-v2-form-checkbox-description">
                  서비스 이용을 위한 이용약관에 동의합니다.
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsDetail(!showTermsDetail)}
                  className="mg-v2-button mg-v2-button--link mg-v2-mt-xs"
                >
                  {showTermsDetail ? (
                    <>
                      <ChevronUp size={14} className="mg-v2-icon-inline" />
                      간략히 보기
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="mg-v2-icon-inline" />
                      자세히 보기
                    </>
                  )}
                </button>
              </div>
            </label>

            {showTermsDetail && (
              <div className="privacy-consent-modal__legal-scroll mg-v2-info-box mg-v2-mt-sm">
                <TermsOfServiceContent omitHeading />
              </div>
            )}
          </div>
        </div>

        {showMarketingConsent && (
          <div className="mg-v2-form-section mg-v2-mt-lg">
            <h3 className="mg-v2-section-title mg-v2-mb-md">선택 동의 항목</h3>

            <div className={`mg-v2-form-checkbox-group ${consents.marketing ? 'mg-v2-form-checkbox-group--checked' : ''}`}>
              <label className="mg-v2-form-checkbox">
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={() => handleConsentChange('marketing')}
                />
                <div className="mg-v2-form-checkbox-content">
                  <div className="mg-v2-form-checkbox-title">
                    <Megaphone size={16} className="mg-v2-icon-inline" />
                    마케팅 정보 수신에 동의합니다 (선택)
                  </div>
                  <div className="mg-v2-form-checkbox-description">
                    이벤트 정보, 맞춤형 서비스 제공을 위한 마케팅 정보 수신에 동의합니다.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="mg-v2-alert mg-v2-alert--info mg-v2-mt-lg">
          <p className="mg-v2-text-xs">
            <strong>안내:</strong> 개인정보는 서비스 제공을 위해 필요한 최소한의 정보만 수집하며,
            관련 법령에 따라 안전하게 보호됩니다. 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </div>
    </UnifiedModal>
  );
};

export default PrivacyConsentModal;
