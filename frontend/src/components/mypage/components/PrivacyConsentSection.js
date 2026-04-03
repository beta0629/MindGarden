import React, { useState, useEffect, useCallback } from 'react';
import PrivacyConsentModal from '../../common/PrivacyConsentModal';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ConfirmModal from '../../common/ConfirmModal';
import UnifiedLoading from '../../common/UnifiedLoading';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';

const TERMS_PLACEHOLDER =
  '약관 전문은 관리자 설정에 따라 제공됩니다. 자세한 내용은 고객센터로 문의해 주세요.';

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
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [dataRequestOpen, setDataRequestOpen] = useState(false);

  const loadConsentStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await StandardizedApi.get('/api/privacy-consent/status');
      if (result?.success && result.data) {
        setConsentStatus(result.data);
      } else if (result && typeof result === 'object' && 'privacyConsent' in result) {
        setConsentStatus(result);
      }
    } catch (error) {
      console.error('개인정보 동의 상태 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConsentStatus = async (consentData) => {
    try {
      setUpdating(true);
      const result = await StandardizedApi.post('/api/privacy-consent/update', consentData);
      if (result && result.success !== false) {
        await loadConsentStatus();
        notificationManager.show('개인정보 동의 상태가 업데이트되었습니다.', 'info');
      } else {
        notificationManager.show(
          `업데이트에 실패했습니다: ${result?.message || '알 수 없는 오류'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('개인정보 동의 상태 업데이트 오류:', error);
      notificationManager.show('개인정보 동의 상태 업데이트 중 오류가 발생했습니다.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleConsent = (consents) => {
    const consentData = {
      privacyConsent: consents.privacy,
      termsConsent: consents.terms,
      marketingConsent: consents.marketing
    };
    updateConsentStatus(consentData);
    setShowConsentModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
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
  }, [loadConsentStatus]);

  if (loading) {
    return (
      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-busy="true">
        <div className="mg-mypage__card-body">
          <UnifiedLoading type="inline" text="개인정보 동의 상태를 불러오는 중..." />
        </div>
      </article>
    );
  }

  return (
    <>
      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-privacy-summary-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-privacy-summary-title" className="mg-mypage__section-title">
              동의 요약
            </h2>
            <p className="mg-mypage__section-description">
              최종 업데이트: {formatDate(consentStatus.consentDate)}
            </p>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <div className="mg-mypage__consent-badges">
            <span className="mg-v2-status-badge mg-v2-badge--info" role="status">
              {consentStatus.isComplete ? '동의 완료' : '동의 미완료'}
            </span>
          </div>
          <button type="button" className="mg-mypage__link" onClick={() => setTermsModalOpen(true)}>
            전체 약관 보기
          </button>
        </div>
      </article>

      <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-privacy-list-title">
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-privacy-list-title" className="mg-mypage__section-title">
              항목별 동의
            </h2>
          </div>
        </div>
        <ul className="mg-mypage__list">
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__device-name">서비스 이용약관</p>
              <span className="mg-v2-status-badge mg-v2-badge--danger" role="status">
                필수
              </span>
              <p className="mg-mypage__section-description">서비스 이용에 필요한 최소 동의입니다.</p>
              <button
                type="button"
                className="mg-v2-button mg-v2-button--outline"
                onClick={() => setTermsModalOpen(true)}
              >
                약관 전문
              </button>
            </div>
            <div className="mg-mypage__list-item-meta">
              <input
                type="checkbox"
                checked={!!consentStatus.termsConsent}
                disabled
                readOnly
                role="switch"
                aria-checked={!!consentStatus.termsConsent}
              />
            </div>
          </li>
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__device-name">개인정보 처리방침</p>
              <span className="mg-v2-status-badge mg-v2-badge--danger" role="status">
                필수
              </span>
              <p className="mg-mypage__section-description">개인정보 수집·이용에 동의합니다.</p>
            </div>
            <div className="mg-mypage__list-item-meta">
              <input
                type="checkbox"
                checked={!!consentStatus.privacyConsent}
                disabled
                readOnly
                role="switch"
                aria-checked={!!consentStatus.privacyConsent}
              />
            </div>
          </li>
          <li className="mg-mypage__list-item mg-mypage__preference-row">
            <div className="mg-mypage__list-item-main">
              <p className="mg-mypage__device-name">마케팅 수신</p>
              <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
                선택
              </span>
              <p className="mg-mypage__section-description">이벤트·혜택 정보를 받습니다.</p>
            </div>
            <div className="mg-mypage__list-item-meta">
              <input
                type="checkbox"
                checked={!!consentStatus.marketingConsent}
                disabled
                readOnly
                role="switch"
                aria-checked={!!consentStatus.marketingConsent}
              />
            </div>
          </li>
        </ul>
        <div className="mg-mypage__consent-actions">
          <button
            type="button"
            className="mg-v2-button mg-v2-button--primary"
            onClick={() => setShowConsentModal(true)}
            disabled={updating}
          >
            {consentStatus.hasConsent ? '동의 상태 수정' : '개인정보 동의하기'}
          </button>
          <button
            type="button"
            className="mg-v2-button mg-v2-button--outline"
            onClick={loadConsentStatus}
            disabled={updating}
          >
            새로고침
          </button>
        </div>
        {!consentStatus.isComplete ? (
          <div className="mg-mypage-consent-notice" role="alert">
            <strong>개인정보 동의가 필요합니다.</strong>
            <p className="mg-mypage__section-description">
              서비스 이용을 위해 개인정보 처리방침과 이용약관에 동의해주세요.
            </p>
          </div>
        ) : null}
      </article>

      <article
        className="mg-v2-ad-b0kla__card mg-mypage__card mg-mypage__danger-zone"
        aria-labelledby="mg-mypage-privacy-danger-title"
      >
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-privacy-danger-title" className="mg-mypage__section-title">
              데이터 및 계정
            </h2>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <button type="button" className="mg-v2-button mg-v2-button--outline" onClick={() => setDataRequestOpen(true)}>
            내 데이터 요청
          </button>
          <button
            type="button"
            className="mg-v2-button mg-v2-button--danger mg-v2-button--outline"
            onClick={() => setWithdrawOpen(true)}
          >
            회원 탈퇴
          </button>
        </div>
      </article>

      <PrivacyConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onConsent={handleConsent}
        title="개인정보 수집 및 이용 동의"
        showMarketingConsent
      />

      <UnifiedModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="서비스 이용약관"
        size="medium"
        backdropClick
        showCloseButton
        actions={
          <button type="button" className="mg-v2-button mg-v2-button--primary" onClick={() => setTermsModalOpen(false)}>
            닫기
          </button>
        }
      >
        <div className="mg-mypage__modal-scroll">
          <div className="mg-mypage__legal-body">
            {TERMS_PLACEHOLDER}
          </div>
        </div>
      </UnifiedModal>

      <ConfirmModal
        isOpen={dataRequestOpen}
        onClose={() => setDataRequestOpen(false)}
        onConfirm={() => {
          setDataRequestOpen(false);
          notificationManager.show('내 데이터 요청 절차는 준비 중입니다.', 'info');
        }}
        title="내 데이터 요청"
        message="개인정보 사본을 요청하시겠습니까? 담당 부서 확인 후 안내드립니다."
        confirmText="요청"
        cancelText="취소"
        type="default"
      />

      <ConfirmModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => {
          setWithdrawOpen(false);
          notificationManager.show('회원 탈퇴는 고객센터 또는 별도 절차로 진행됩니다.', 'info');
        }}
        title="회원 탈퇴"
        message="탈퇴 시 계정과 데이터가 삭제되거나 분리될 수 있습니다. 계속하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        type="danger"
      />
    </>
  );
};

export default PrivacyConsentSection;
