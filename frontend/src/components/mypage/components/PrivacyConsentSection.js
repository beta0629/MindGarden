import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../constants/api';
import PrivacyConsentModal from '../../common/PrivacyConsentModal';
import './PrivacyConsentSection.css';

/**
 * 개인정보 동의 관리 섹션 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const PrivacyConsentSection = () => {
  const [consentStatus, setConsentStatus] = useState({
    hasConsent: false,
    privacyConsent: false,
    termsConsent: false,
    marketingConsent: false,
    consentDate: null,
    isComplete: false
  });
  const [loading, setLoading] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 개인정보 동의 상태 로드
  const loadConsentStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/privacy-consent/status`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConsentStatus(result.data);
        } else {
          console.error('개인정보 동의 상태 로드 실패:', result.message);
        }
      } else {
        console.error('개인정보 동의 상태 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('개인정보 동의 상태 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 개인정보 동의 상태 업데이트
  const updateConsentStatus = async (consentData) => {
    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}/api/privacy-consent/update`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consentData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 동의 상태 다시 로드
          await loadConsentStatus();
          alert('개인정보 동의 상태가 업데이트되었습니다.');
        } else {
          alert('개인정보 동의 상태 업데이트에 실패했습니다: ' + result.message);
        }
      } else {
        alert('개인정보 동의 상태 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('개인정보 동의 상태 업데이트 오류:', error);
      alert('개인정보 동의 상태 업데이트 중 오류가 발생했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  // 개인정보 동의 모달 열기
  const openConsentModal = () => {
    setShowConsentModal(true);
  };

  // 개인정보 동의 처리
  const handleConsent = (consents) => {
    // 프론트엔드 키를 백엔드 키로 변환
    const consentData = {
      privacyConsent: consents.privacy,
      termsConsent: consents.terms,
      marketingConsent: consents.marketing
    };
    updateConsentStatus(consentData);
    setShowConsentModal(false);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    loadConsentStatus();
  }, []);

  if (loading) {
    return (
      <div className="mypage-section">
        <h2>개인정보 동의 관리</h2>
        <div className="privacy-consent-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>개인정보 동의 상태를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-section">
      <h2>
        <i className="bi bi-shield-check"></i>
        개인정보 동의 관리
      </h2>
      
      <div className="privacy-consent-container">
        {/* 동의 상태 요약 */}
        <div className="consent-summary">
          <div className="consent-status-card">
            <div className="consent-status-header">
              <h3>현재 동의 상태</h3>
              <div className={`consent-status-badge ${consentStatus.isComplete ? 'complete' : 'incomplete'}`}>
                {consentStatus.isComplete ? '완료' : '미완료'}
              </div>
            </div>
            
            <div className="consent-status-list">
              <div className="consent-status-item">
                <div className="consent-status-icon">
                  <i className={`bi bi-${consentStatus.privacyConsent ? 'check-circle-fill' : 'circle'} consent-icon ${consentStatus.privacyConsent ? 'consent-icon--checked' : 'consent-icon--unchecked'}`}></i>
                </div>
                <div className="consent-status-info">
                  <span className="consent-status-label">개인정보 처리방침</span>
                  <span className={`consent-status-value ${consentStatus.privacyConsent ? 'agreed' : 'not-agreed'}`}>
                    {consentStatus.privacyConsent ? '동의함' : '미동의'}
                  </span>
                </div>
              </div>
              
              <div className="consent-status-item">
                <div className="consent-status-icon">
                  <i className={`bi bi-${consentStatus.termsConsent ? 'check-circle-fill' : 'circle'} consent-icon ${consentStatus.termsConsent ? 'consent-icon--checked' : 'consent-icon--unchecked'}`}></i>
                </div>
                <div className="consent-status-info">
                  <span className="consent-status-label">이용약관</span>
                  <span className={`consent-status-value ${consentStatus.termsConsent ? 'agreed' : 'not-agreed'}`}>
                    {consentStatus.termsConsent ? '동의함' : '미동의'}
                  </span>
                </div>
              </div>
              
              <div className="consent-status-item">
                <div className="consent-status-icon">
                  <i className={`bi bi-${consentStatus.marketingConsent ? 'check-circle-fill' : 'circle'}`} 
                     data-consent-color={consentStatus.marketingConsent ? '#28a745' : '#6c757d'}></i>
                </div>
                <div className="consent-status-info">
                  <span className="consent-status-label">마케팅 정보 수신</span>
                  <span className={`consent-status-value ${consentStatus.marketingConsent ? 'agreed' : 'not-agreed'}`}>
                    {consentStatus.marketingConsent ? '동의함' : '미동의'}
                  </span>
                </div>
              </div>
            </div>
            
            {consentStatus.consentDate && (
              <div className="consent-date">
                <small className="text-muted">
                  <i className="bi bi-calendar"></i>
                  마지막 동의: {formatDate(consentStatus.consentDate)}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* 동의 관리 버튼 */}
        <div className="consent-actions">
          <button
            className="btn btn-primary consent-action-btn"
            onClick={openConsentModal}
            disabled={updating}
          >
            <i className="bi bi-pencil-square"></i>
            {consentStatus.hasConsent ? '동의 상태 수정' : '개인정보 동의하기'}
          </button>
          
          <button
            className="btn btn-outline-secondary consent-action-btn"
            onClick={loadConsentStatus}
            disabled={updating}
          >
            <i className="bi bi-arrow-clockwise"></i>
            새로고침
          </button>
        </div>

        {/* 안내 메시지 */}
        {!consentStatus.isComplete && (
          <div className="consent-notice">
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle"></i>
              <strong>개인정보 동의가 필요합니다.</strong>
              <p className="mb-0">
                서비스 이용을 위해 개인정보 처리방침과 이용약관에 동의해주세요.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 개인정보 동의 모달 */}
      <PrivacyConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsent}
        title="개인정보 수집 및 이용 동의"
        showMarketingConsent={true}
      />
    </div>
  );
};

export default PrivacyConsentSection;
