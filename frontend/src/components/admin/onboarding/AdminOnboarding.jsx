import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import {
  ONBOARDING_STEPS,
  ONBOARDING_API_ENDPOINTS,
  ONBOARDING_MOCK_DATA
} from '../../../constants/adminOnboarding';
import '../../../styles/main.css';

/**
 * 어드민 온보딩 심사 화면 컴포넌트
 * Phase 2 마크업 기반 3단계 Stepper 구현
 *
 * @author CoreSolution
 * @since 2026-03-29
 */
const AdminOnboarding = () => {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const [currentStep, setCurrentStep] = useState(1);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    if (id) {
      setOnboardingData({
        id,
        tenantName: ONBOARDING_MOCK_DATA.TENANT_NAME,
        contactPhone: ONBOARDING_MOCK_DATA.CONTACT_PHONE,
        businessType: ONBOARDING_MOCK_DATA.BUSINESS_TYPE,
        adminName: ONBOARDING_MOCK_DATA.ADMIN_NAME,
        adminEmail: ONBOARDING_MOCK_DATA.ADMIN_EMAIL
      });
    }
  }, [id]);

  const handleNextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleApprove = async() => {
    if (!window.confirm(t('admin:onboarding.confirm.approve', '이 온보딩 요청을 승인하시겠어요?'))) return;

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'APPROVED',
        actorId: 'admin_user',
        note: ONBOARDING_MOCK_DATA.NOTE_APPROVE
      });
      alert(t('admin:onboarding.msg.approveSuccess', '온보딩이 성공적으로 승인되었습니다.'));
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      alert(t('admin:onboarding.msg.errorDecision', '심사 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async() => {
    if (!rejectReason.trim()) {
      alert(t('admin:onboarding.msg.rejectReasonRequired', '반려 사유를 입력해 주세요.'));
      return;
    }

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'REJECTED',
        actorId: 'admin_user',
        note: rejectReason
      });
      alert(t('admin:onboarding.msg.rejectSuccess', '온보딩이 반려되었습니다.'));
      setIsRejectModalOpen(false);
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      alert(t('admin:onboarding.msg.errorDecision', '심사 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepper = () => (
    <div className="mg-v2-stepper">
      {ONBOARDING_STEPS.map((step) => (
        <div
          key={step.id}
          className={`mg-v2-stepper__item ${currentStep === step.id ? 'mg-v2-stepper__item--active' : ''} ${currentStep > step.id ? 'mg-v2-stepper__item--completed' : ''}`}
        >
          <div className="mg-v2-stepper__circle">{step.id}</div>
          <div className="mg-v2-stepper__label">{step.label}</div>
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    if (!onboardingData) return <div>{t('common:state.loadingData', '데이터를 불러오는 중...')}</div>;

    switch (currentStep) {
      case 1:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.1.label', '기본 정보')}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.tenantName', '기관명')}</span>
              <div className="mg-v2-form-value">{onboardingData.tenantName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.contactPhone', '연락처')}</span>
              <div className="mg-v2-form-value">{onboardingData.contactPhone}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.businessType', '업종')}</span>
              <div className="mg-v2-form-value">{onboardingData.businessType}</div>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.2.label', '자격 확인')}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.adminName', '관리자 이름')}</span>
              <div className="mg-v2-form-value">{onboardingData.adminName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.adminEmail', '관리자 이메일')}</span>
              <div className="mg-v2-form-value">{onboardingData.adminEmail}</div>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.3.label', '최종 심사')}</h3>
            <p className="mg-v2-text--secondary">{t('admin:onboarding.field.finalReviewDesc', '입력된 모든 정보를 확인했습니다. 승인 또는 반려를 선택해주세요.')}</p>
            <div className="mg-v2-action-group mg-v2-margin-top--large">
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--primary"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {t('admin:onboarding.btn.approve', '승인')}
              </button>
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--danger"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isLoading}
              >
                {t('admin:onboarding.btn.reject', '거절')}
              </button>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  const rejectModalActions = (
    <>
      <button
        type="button"
        className="mg-v2-btn mg-v2-btn--secondary"
        onClick={() => setIsRejectModalOpen(false)}
        disabled={isLoading}
      >
        {t('admin:onboarding.btn.cancel', '취소')}
      </button>
      <button
        type="button"
        className="mg-v2-btn mg-v2-btn--danger"
        onClick={handleReject}
        disabled={isLoading}
      >
        {t('admin:onboarding.btn.confirm', '확인')}
      </button>
    </>
  );

  return (
    <AdminCommonLayout title={t('admin:onboarding.title', '온보딩 심사')}>
      <div className="mg-v2-page-container">
        {renderStepper()}

        <div className="mg-v2-content-area mg-v2-margin-top--large">
          {renderStepContent()}
        </div>

        <div className="mg-v2-action-group mg-v2-action-group--between mg-v2-margin-top--large">
          <button
            type="button"
            className="mg-v2-btn mg-v2-btn--secondary"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isLoading}
          >
            {t('admin:onboarding.btn.prev', '이전')}
          </button>

          {currentStep < ONBOARDING_STEPS.length && (
            <button
              type="button"
              className="mg-v2-btn mg-v2-btn--primary"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              {t('admin:onboarding.btn.next', '다음')}
            </button>
          )}
        </div>
      </div>

      <UnifiedModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={t('admin:onboarding.modal.rejectTitle', '온보딩 반려')}
        subtitle={t('admin:onboarding.modal.rejectSubtitle', '반려 사유를 입력해 주세요. 해당 사유는 요청자에게 전달될 수 있습니다.')}
        size="medium"
        variant="form"
        actions={rejectModalActions}
        loading={isLoading}
      >
        <div className="mg-v2-form-group">
          <textarea
            className="mg-v2-textarea"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('admin:onboarding.modal.rejectReasonPlaceholder', '반려 사유 상세 입력')}
            disabled={isLoading}
          />
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminOnboarding;
