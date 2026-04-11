import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import {
  ONBOARDING_STEPS,
  ONBOARDING_MESSAGES,
  ONBOARDING_API_ENDPOINTS,
  ONBOARDING_TEXT,
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
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

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

  const handleApprove = async () => {
    if (!window.confirm(ONBOARDING_MESSAGES.CONFIRM_APPROVE)) return;

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'APPROVED',
        actorId: 'admin_user',
        note: ONBOARDING_MOCK_DATA.NOTE_APPROVE
      });
      alert(ONBOARDING_MESSAGES.APPROVE_SUCCESS);
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      alert(ONBOARDING_MESSAGES.ERROR_DECISION);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert(ONBOARDING_MESSAGES.REJECT_REASON_REQUIRED);
      return;
    }

    setIsLoading(true);
    try {
      await StandardizedApi.post(ONBOARDING_API_ENDPOINTS.DECISION(id || ''), {
        status: 'REJECTED',
        actorId: 'admin_user',
        note: rejectReason
      });
      alert(ONBOARDING_MESSAGES.REJECT_SUCCESS);
      setIsRejectModalOpen(false);
      navigate('/admin/onboarding');
    } catch (error) {
      console.error(error);
      alert(ONBOARDING_MESSAGES.ERROR_DECISION);
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
    if (!onboardingData) return <div>{ONBOARDING_TEXT.LOADING}</div>;

    switch (currentStep) {
      case 1:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{ONBOARDING_TEXT.SECTION_BASIC_INFO}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{ONBOARDING_TEXT.LABEL_TENANT_NAME}</span>
              <div className="mg-v2-form-value">{onboardingData.tenantName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{ONBOARDING_TEXT.LABEL_CONTACT_PHONE}</span>
              <div className="mg-v2-form-value">{onboardingData.contactPhone}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{ONBOARDING_TEXT.LABEL_BUSINESS_TYPE}</span>
              <div className="mg-v2-form-value">{onboardingData.businessType}</div>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{ONBOARDING_TEXT.SECTION_ADMIN_INFO}</h3>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{ONBOARDING_TEXT.LABEL_ADMIN_NAME}</span>
              <div className="mg-v2-form-value">{onboardingData.adminName}</div>
            </div>
            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">{ONBOARDING_TEXT.LABEL_ADMIN_EMAIL}</span>
              <div className="mg-v2-form-value">{onboardingData.adminEmail}</div>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="mg-v2-card">
            <h3 className="mg-v2-card__title">{ONBOARDING_TEXT.SECTION_FINAL_REVIEW}</h3>
            <p className="mg-v2-text--secondary">{ONBOARDING_TEXT.DESC_FINAL_REVIEW}</p>
            <div className="mg-v2-action-group mg-v2-margin-top--large">
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--primary"
                onClick={handleApprove}
                disabled={isLoading}
              >
                {ONBOARDING_MESSAGES.BTN_APPROVE}
              </button>
              <button
                type="button"
                className="mg-v2-btn mg-v2-btn--danger"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={isLoading}
              >
                {ONBOARDING_MESSAGES.BTN_REJECT}
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
        {ONBOARDING_MESSAGES.BTN_CANCEL}
      </button>
      <button
        type="button"
        className="mg-v2-btn mg-v2-btn--danger"
        onClick={handleReject}
        disabled={isLoading}
      >
        {ONBOARDING_MESSAGES.BTN_CONFIRM}
      </button>
    </>
  );

  return (
    <AdminCommonLayout title={ONBOARDING_TEXT.PAGE_TITLE}>
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
            {ONBOARDING_MESSAGES.BTN_PREV}
          </button>

          {currentStep < ONBOARDING_STEPS.length && (
            <button
              type="button"
              className="mg-v2-btn mg-v2-btn--primary"
              onClick={handleNextStep}
              disabled={isLoading}
            >
              {ONBOARDING_MESSAGES.BTN_NEXT}
            </button>
          )}
        </div>
      </div>

      <UnifiedModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title={ONBOARDING_MESSAGES.MODAL_REJECT_TITLE}
        subtitle={ONBOARDING_MESSAGES.MODAL_REJECT_SUBTITLE}
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
            placeholder={ONBOARDING_MESSAGES.MODAL_PLACEHOLDER_REASON}
            disabled={isLoading}
          />
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default AdminOnboarding;
