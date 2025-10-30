import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Shield, XCircle, Check, ChevronDown, ChevronUp, FileText, Megaphone } from 'lucide-react';
import notificationManager from '../../utils/notification';

/**
 * 개인정보 수집 및 이용 동의 모달 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const PrivacyConsentModal = ({ 
  isOpen, 
  onClose, 
  onConsent, 
  title = "개인정보 수집 및 이용 동의",
  showMarketingConsent = true 
}) => {
  const [consents, setConsents] = useState({
    privacy: false,
    terms: false,
    marketing: false
  });

  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);

  const handleConsentChange = (type) => {
    setConsents(prev => ({
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

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <Shield size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">{title}</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
          <div className="mg-v2-info-box mg-v2-mb-lg">
            <p className="mg-v2-text-sm">
              마인드가든 서비스 이용을 위해 아래 개인정보 수집 및 이용에 동의해주세요.
            </p>
          </div>

          {/* 필수 동의 항목 */}
          <div className="mg-v2-form-section">
            <h3 className="mg-v2-section-title mg-v2-mb-md">
              필수 동의 항목
              <span className="mg-v2-badge mg-v2-badge--danger">필수</span>
            </h3>

            {/* 개인정보 처리방침 동의 */}
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
                <div className="mg-v2-info-box mg-v2-mt-sm">
                  <h6 className="mg-v2-text-sm mg-v2-font-semibold mg-v2-mb-xs">수집하는 개인정보 항목</h6>
                  <ul className="mg-v2-list-bullet">
                    <li>필수: 이름, 이메일, 전화번호, 생년월일, 성별, 주소</li>
                    <li>선택: 프로필 사진, 마케팅 정보 수신 동의</li>
                  </ul>
                  
                  <h6 className="mg-v2-text-sm mg-v2-font-semibold mg-v2-mt-md mg-v2-mb-xs">개인정보 수집 및 이용 목적</h6>
                  <ul className="mg-v2-list-bullet">
                    <li>회원 가입 및 관리</li>
                    <li>상담 서비스 제공</li>
                    <li>결제 및 환불 처리</li>
                    <li>고객 지원</li>
                  </ul>

                  <h6 className="mg-v2-text-sm mg-v2-font-semibold mg-v2-mt-md mg-v2-mb-xs">보유 및 이용 기간</h6>
                  <p className="mg-v2-text-xs">
                    회원 탈퇴 시까지 (단, 관계법령에 의해 보존이 필요한 경우 해당 기간까지)
                  </p>
                </div>
              )}
            </div>

            {/* 이용약관 동의 */}
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
                <div className="mg-v2-info-box mg-v2-mt-sm">
                  <h6 className="mg-v2-text-sm mg-v2-font-semibold mg-v2-mb-xs">주요 내용</h6>
                  <ul className="mg-v2-list-bullet">
                    <li>서비스 이용 조건 및 제한사항</li>
                    <li>이용자의 권리와 의무</li>
                    <li>서비스 이용료 및 환불 정책</li>
                    <li>개인정보보호 및 보안</li>
                    <li>면책조항 및 분쟁해결</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 선택 동의 항목 */}
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

          {/* 안내 메시지 */}
          <div className="mg-v2-alert mg-v2-alert--info mg-v2-mt-lg">
            <p className="mg-v2-text-xs">
              <strong>안내:</strong> 개인정보는 서비스 제공을 위해 필요한 최소한의 정보만 수집하며, 
              관련 법령에 따라 안전하게 보호됩니다. 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mg-v2-modal-footer">
          <button
            className="mg-v2-button mg-v2-button--secondary"
            onClick={onClose}
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </button>
          <button
            className="mg-v2-button mg-v2-button--primary"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            <Check size={20} className="mg-v2-icon-inline" />
            동의하고 계속하기
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default PrivacyConsentModal;
