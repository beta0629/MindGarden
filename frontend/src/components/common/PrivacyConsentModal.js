import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import './PrivacyConsentModal.css';

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
      alert('필수 동의 항목에 모두 동의해주세요.');
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

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose} 
      size="lg" 
      centered
      backdrop="static"
    >
      <Modal.Header className="privacy-consent-header">
        <Modal.Title className="privacy-consent-title">
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="privacy-consent-body">
        <div className="privacy-consent-intro">
          <p className="privacy-consent-intro-text">
            마인드가든 서비스 이용을 위해 아래 개인정보 수집 및 이용에 동의해주세요.
          </p>
        </div>

        {/* 필수 동의 항목 */}
        <div className="privacy-consent-section">
          <h5 className="privacy-consent-section-title">
            필수 동의 항목
            <span className="privacy-consent-section-badge privacy-consent-section-badge--required">
              필수
            </span>
          </h5>

          {/* 개인정보 처리방침 동의 */}
          <div style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            background: consents.privacy ? '#f8f9fa' : '#ffffff'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              margin: 0
            }}>
              <input
                type="checkbox"
                checked={consents.privacy}
                onChange={() => handleConsentChange('privacy')}
                style={{
                  marginRight: '12px',
                  marginTop: '2px',
                  transform: 'scale(1.2)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '4px'
                }}>
                  개인정보 처리방침에 동의합니다 <span style={{ color: '#dc3545' }}>*</span>
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: '#6c757d',
                  marginBottom: '8px'
                }}>
                  서비스 이용을 위해 필요한 개인정보 수집 및 이용에 동의합니다.
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyDetail(!showPrivacyDetail)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    fontSize: 'var(--font-size-xs)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPrivacyDetail ? '간략히 보기' : '자세히 보기'}
                </button>
              </div>
            </label>

            {showPrivacyDetail && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                    fontSize: 'var(--font-size-xs)',
                color: '#495057',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: '8px' }}>
                  수집하는 개인정보 항목
                </h6>
                <ul style={{ paddingLeft: '16px', margin: '0 0 12px 0' }}>
                  <li>필수: 이름, 이메일, 전화번호, 생년월일, 성별, 주소</li>
                  <li>선택: 프로필 사진, 마케팅 정보 수신 동의</li>
                </ul>
                
                <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: '8px' }}>
                  개인정보 수집 및 이용 목적
                </h6>
                <ul style={{ paddingLeft: '16px', margin: '0 0 12px 0' }}>
                  <li>회원 가입 및 관리</li>
                  <li>상담 서비스 제공</li>
                  <li>결제 및 환불 처리</li>
                  <li>고객 지원</li>
                </ul>

                <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: '8px' }}>
                  보유 및 이용 기간
                </h6>
                <p style={{ margin: '0', fontSize: 'var(--font-size-xs)' }}>
                  회원 탈퇴 시까지 (단, 관계법령에 의해 보존이 필요한 경우 해당 기간까지)
                </p>
              </div>
            )}
          </div>

          {/* 이용약관 동의 */}
          <div style={{
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '16px',
            background: consents.terms ? '#f8f9fa' : '#ffffff'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              cursor: 'pointer',
              margin: 0
            }}>
              <input
                type="checkbox"
                checked={consents.terms}
                onChange={() => handleConsentChange('terms')}
                style={{
                  marginRight: '12px',
                  marginTop: '2px',
                  transform: 'scale(1.2)'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: '#495057',
                  marginBottom: '4px'
                }}>
                  이용약관에 동의합니다 <span style={{ color: '#dc3545' }}>*</span>
                </div>
                <div style={{
                  fontSize: 'var(--font-size-xs)',
                  color: '#6c757d',
                  marginBottom: '8px'
                }}>
                  서비스 이용을 위한 이용약관에 동의합니다.
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsDetail(!showTermsDetail)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    fontSize: 'var(--font-size-xs)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showTermsDetail ? '간략히 보기' : '자세히 보기'}
                </button>
              </div>
            </label>

            {showTermsDetail && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                    fontSize: 'var(--font-size-xs)',
                color: '#495057',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <h6 style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', marginBottom: '8px' }}>
                  주요 내용
                </h6>
                <ul style={{ paddingLeft: '16px', margin: '0 0 12px 0' }}>
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
          <div style={{ marginBottom: '24px' }}>
            <h5 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: '600',
              color: '#495057',
              marginBottom: '16px'
            }}>
              선택 동의 항목
            </h5>

            <div style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px',
              background: consents.marketing ? '#f8f9fa' : '#ffffff'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                cursor: 'pointer',
                margin: 0
              }}>
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={() => handleConsentChange('marketing')}
                  style={{
                    marginRight: '12px',
                    marginTop: '2px',
                    transform: 'scale(1.2)'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '500',
                    color: '#495057',
                    marginBottom: '4px'
                  }}>
                    마케팅 정보 수신에 동의합니다 (선택)
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#6c757d'
                  }}>
                    이벤트 정보, 맞춤형 서비스 제공을 위한 마케팅 정보 수신에 동의합니다.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div style={{
          background: '#e8f4fd',
          border: '1px solid #bee5eb',
          borderRadius: '6px',
          padding: '12px',
                    fontSize: 'var(--font-size-xs)',
          color: '#0c5460'
        }}>
          <p style={{ margin: '0' }}>
            <strong>안내:</strong> 개인정보는 서비스 제공을 위해 필요한 최소한의 정보만 수집하며, 
            관련 법령에 따라 안전하게 보호됩니다. 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer style={{
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        padding: '16px 24px'
      }}>
        <Button
          variant="secondary"
          onClick={onClose}
          style={{
            padding: '8px 16px',
            fontSize: 'var(--font-size-sm)',
            borderRadius: '6px'
          }}
        >
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          style={{
            padding: '8px 16px',
            fontSize: 'var(--font-size-sm)',
            borderRadius: '6px',
            opacity: isSubmitDisabled ? 0.6 : 1
          }}
        >
          동의하고 계속하기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PrivacyConsentModal;
