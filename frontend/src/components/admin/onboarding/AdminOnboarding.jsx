import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../../../hooks/useConfirm';
import { useAlert } from '../../../hooks/useAlert';
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
  const [confirm, ConfirmModal] = useConfirm();
  const [alert, AlertModal] = useAlert();
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
    const ok = await confirm({
      variant: 'warning',
      message: t('admin:onboarding.confirm.approve'),
    });
    if (!ok) return;

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'APPROVED',
        actorId: 'admin_user',
        note: ONBOARDING_MOCK_DATA.NOTE_APPROVE
      });
      await alert({
        variant: 'success',
        message: t('admin:onboarding.msg.approveSuccess'),
      });
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      await alert({
        variant: 'danger',
        message: t('admin:onboarding.msg.errorDecision'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async() => {
    if (!rejectReason.trim()) {
      await alert({
        variant: 'warning',
        message: t('admin:onboarding.msg.rejectReasonRequired'),
      });
      return;
    }

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'REJECTED',
        actorId: 'admin_user',
        note: rejectReason
      });
      await alert({
        variant: 'success',
        message: t('admin:onboarding.msg.rejectSuccess'),
      });
      setIsRejectModalOpen(false);
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      await alert({
        variant: 'danger',
        message: t('admin:onboarding.msg.errorDecision'),
      });
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
    if (!onboardingData) return <div>{t('common:state.loadingData')}</div>;

    switch (currentStep) {
      case 1:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.1.label')}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.tenantName')}</span>
              <div className="mg-v2-form-value">{onboardingData.tenantName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.contactPhone')}</span>
              <div className="mg-v2-form-value">{onboardingData.contactPhone}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.businessType')}</span>
              <div className="mg-v2-form-value">{onboardingData.businessType}</div>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.2.label')}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.adminName')}</span>
              <div className="mg-v2-form-value">{onboardingData.adminName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{t('admin:onboarding.field.adminEmail')}</span>
              <div className="mg-v2-form-value">{onboardingData.adminEmail}</div>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{t('admin:onboarding.step.3.label')}</h3>
            <p className="mg-v2-text--secondary">{t('admin:onboarding.field.finalReviewDesc')}</p>
            <div className="mg-v2-action-group mg-v2-margin-top--large">
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--primary"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {t('admin:onboarding.btn.approve')}
              </button>
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--danger"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isLoading}
              >
                {t('admin:onboarding.btn.reject')}
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
        {t('admin:onboarding.btn.cancel')}
      </button>
      <button
        type="button"
        className="mg-v2-btn mg-v2-btn--danger"
        onClick={handleReject}
        disabled={isLoading}
      >
        {t('admin:onboarding.btn.confirm')}
      </button>
    </>
  );

  return (
    <AdminCommonLayout title={t('admin:onboarding.title')}>
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
            {t('admin:onboarding.btn.prev')}
          </button>

          {currentStep < ONBOARDING_STEPS.length && (
            <button
              type="button"
              className="mg-v2-btn mg-v2-btn--primary"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              {t('admin:onboarding.btn.next')}
            </button>
          )}
        </div>
      </div>

      <UnifiedModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={t('admin:onboarding.modal.rejectTitle')}
        subtitle={t('admin:onboarding.modal.rejectSubtitle')}
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
            placeholder={t('admin:onboarding.modal.rejectReasonPlaceholder')}
            disabled={isLoading}
          />
        </div>
      </UnifiedModal>
      <ConfirmModal />
      <AlertModal />
    </AdminCommonLayout>
  );
};

export default AdminOnboarding;
