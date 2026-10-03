import React, { useState, useEffect, useCallback } from 'react';
import PrivacyConsentModal from '../../common/PrivacyConsentModal';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ConfirmModal from '../../common/ConfirmModal';
import UnifiedLoading from '../../common/UnifiedLoading';
import MGButton from '../../common/MGButton';
import MypageSectionPanel from '../layout/MypageSectionPanel';
import MypageDefinitionRows from '../layout/MypageDefinitionRows';
import MypageActionButton from '../layout/MypageActionButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_SECTION_LABELS,
  MYPAGE_SECTION_CAPTIONS,
  MYPAGE_FEATURE_READY,
  MYPAGE_PRIVACY_COPY
} from '../../../constants/mypageRoleLayout';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_PRIVACY_CONSENT_STATUS = '/api/v1/privacy-consent/status';
const API_PRIVACY_CONSENT_UPDATE = '/api/v1/privacy-consent/update';


const TERMS_PLACEHOLDER =
  '약관 전문은 관리자 설정에 따라 제공됩니다. 자세한 내용은 고객센터로 문의해 주세요.';

const PrivacyConsentSection = ({ editDisabled = false }) => {
  const { t } = useTranslation();
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
  const [dataRequestOpen, setDataRequestOpen] = useState(false);

  const loadConsentStatus = useCallback(async() => {
    try {
      setLoading(true);
      const result = await StandardizedApi.get(API_PRIVACY_CONSENT_STATUS);
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

  const updateConsentStatus = async(consentData) => {
    try {
      setUpdating(true);
      const result = await StandardizedApi.post(API_PRIVACY_CONSENT_UPDATE, consentData);
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
    if (!dateString) return '';
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

  const agreedLabel = (value) => (value ? MYPAGE_PRIVACY_COPY.AGREED : MYPAGE_PRIVACY_COPY.NOT_AGREED);
  const lastUpdated = formatDate(consentStatus.consentDate);
  const caption = lastUpdated
    ? `${MYPAGE_PRIVACY_COPY.LAST_UPDATED} ${lastUpdated}`
    : MYPAGE_SECTION_CAPTIONS[MYPAGE_SECTION_KEYS.PRIVACY];

  const headerAction = (
    <MypageActionButton
      variant="outline"
      onClick={() => setShowConsentModal(true)}
      disabled={editDisabled || updating || loading}
      loading={updating}
      data-testid="mypage-privacy-edit"
    >
      {consentStatus.hasConsent ? MYPAGE_PRIVACY_COPY.EDIT : MYPAGE_PRIVACY_COPY.START}
    </MypageActionButton>
  );

  return (
    <>
      <MypageSectionPanel
        sectionKey={MYPAGE_SECTION_KEYS.PRIVACY}
        title={MYPAGE_SECTION_LABELS[MYPAGE_SECTION_KEYS.PRIVACY]}
        caption={caption}
        headerAction={headerAction}
      >
        {loading ? (
          <div aria-busy="true">
            <UnifiedLoading type="inline" text="개인정보 동의 상태를 불러오는 중..." />
          </div>
        ) : (
          <>
            <MypageDefinitionRows
              testId="mypage-privacy-rows"
              rows={[
                {
                  key: 'terms',
                  label: MYPAGE_PRIVACY_COPY.TERMS,
                  value: agreedLabel(consentStatus.termsConsent),
                  caption: MYPAGE_PRIVACY_COPY.REQUIRED,
                  action: (
                    <MypageActionButton variant="ghost" onClick={() => setTermsModalOpen(true)}>
                      {MYPAGE_PRIVACY_COPY.VIEW_TERMS}
                    </MypageActionButton>
                  )
                },
                {
                  key: 'privacy',
                  label: MYPAGE_PRIVACY_COPY.PRIVACY,
                  value: agreedLabel(consentStatus.privacyConsent),
                  caption: MYPAGE_PRIVACY_COPY.REQUIRED
                },
                {
                  key: 'marketing',
                  label: MYPAGE_PRIVACY_COPY.MARKETING,
                  value: agreedLabel(consentStatus.marketingConsent),
                  caption: MYPAGE_PRIVACY_COPY.OPTIONAL
                },
                MYPAGE_FEATURE_READY.DATA_REQUEST
                  ? {
                    key: 'data-request',
                    label: '내 데이터 요청',
                    value: '개인정보 사본',
                    action: (
                      <MypageActionButton variant="ghost" onClick={() => setDataRequestOpen(true)}>
                        요청
                      </MypageActionButton>
                    )
                  }
                  : null
              ]}
            />
            {!consentStatus.isComplete ? (
              <p className="mg-mypage-panel__caption" role="status" data-testid="mypage-privacy-incomplete">
                {MYPAGE_PRIVACY_COPY.INCOMPLETE}
              </p>
            ) : null}
          </>
        )}
      </MypageSectionPanel>

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
        title={MYPAGE_PRIVACY_COPY.TERMS}
        size="medium"
        backdropClick
        showCloseButton
        actions={
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setTermsModalOpen(false)}
            preventDoubleClick={false}
          >
            {t('common.actions.close')}
          </MGButton>
        }
      >
        <div className="mg-mypage-legal-body">
          {TERMS_PLACEHOLDER}
        </div>
      </UnifiedModal>

      {MYPAGE_FEATURE_READY.DATA_REQUEST ? (
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
      ) : null}
    </>
  );
};

export default PrivacyConsentSection;
