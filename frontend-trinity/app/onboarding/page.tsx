"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import { useOnboarding } from "../../hooks/useOnboarding";
import { apiGet } from "../../utils/api";
import ProgressSteps from "../../components/onboarding/ProgressSteps";
import ErrorMessage from "../../components/onboarding/ErrorMessage";
import Step1BasicInfo from "../../components/onboarding/Step1BasicInfo";
import Step2BusinessType from "../../components/onboarding/Step2BusinessType";
import Step3PricingPlan from "../../components/onboarding/Step3PricingPlan";
import Step4Payment from "../../components/onboarding/Step4Payment";
import Step5Completion from "../../components/onboarding/Step5Completion";

export default function OnboardingPage() {
  const router = useRouter();
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const {
    step,
    setStep,
    loading,
    error,
    setError,
    formData,
    setFormData,
    pricingPlans,
    businessCategories,
    businessCategoryItems,
    selectedCategoryId,
    setSelectedCategoryId,
    paymentMethodVerified,
    paymentMethodVerifying,
    skipPaymentMethod,
    setSkipPaymentMethod,
    paymentOption,
    setPaymentOption,
    customerKey,
    emailFormatError,
    setEmailFormatError,
    emailDuplicateChecked,
    setEmailDuplicateChecked,
    emailDuplicateChecking,
    setEmailDuplicateChecking,
    emailDuplicateError,
    setEmailDuplicateError,
    emailVerified,
    setEmailVerified,
    emailVerificationCode,
    setEmailVerificationCode,
    emailVerificationSending,
    emailVerificationVerifying,
    emailVerificationTimeLeft,
    setEmailVerificationTimeLeft,
    resendCooldown,
    verificationAttempts,
    setVerificationAttempts,
    validateEmailFormat,
    loadPricingPlans,
    loadBusinessCategories,
    loadBusinessCategoryItems,
    handleSubmit,
    checkEmailDuplicate,
    sendEmailVerificationCode,
    verifyEmailCode,
    createPaymentMethod,
  } = useOnboarding();

  // 요금제 정보 로드 (step 3 진입 시)
  useEffect(() => {
    if (step === 3 && pricingPlans.length === 0) {
      loadPricingPlans();
    }
  }, [step, pricingPlans.length, loadPricingPlans]);

  // 업종 카테고리 로드 (step 2 진입 시)
  useEffect(() => {
    if (step === 2 && businessCategories.length === 0) {
      loadBusinessCategories();
    }
  }, [step, businessCategories.length, loadBusinessCategories]);

  // 선택된 카테고리의 아이템 로드
  useEffect(() => {
    if (selectedCategoryId) {
      loadBusinessCategoryItems(selectedCategoryId);
    }
  }, [selectedCategoryId, loadBusinessCategoryItems]);

  // 온보딩 접근 권한 확인 (이미 테넌트에 속한 사용자는 접근 불가)
  useEffect(() => {
    const checkOnboardingAccess = async () => {
      try {
        // 현재 사용자 정보 조회 시도
        try {
          const response = await apiGet<{ success: boolean; data?: { tenantId?: string | null } }>('/api/auth/current-user');
          
          if (response.success && response.data) {
            const user = response.data;
            // tenant_id가 있으면 이미 테넌트에 속한 사용자
            if (user.tenantId && user.tenantId.trim() !== '') {
              setAccessError('이미 테넌트에 속한 사용자는 온보딩에 접근할 수 없습니다. 기존 테넌트 관리 페이지를 사용해주세요.');
              setAccessChecking(false);
              // 3초 후 홈으로 리다이렉트
              setTimeout(() => {
                router.push('/');
              }, 3000);
              return;
            }
          }
        } catch (err) {
          // 인증되지 않은 사용자이거나 API 오류인 경우 접근 허용 (새로운 테넌트 등록 가능)
          console.debug('사용자 정보 조회 실패 또는 인증되지 않은 사용자 - 온보딩 접근 허용:', err);
        }
        
        setAccessChecking(false);
      } catch (err) {
        console.error('온보딩 접근 권한 확인 실패:', err);
        // 오류 발생 시에도 접근 허용 (백엔드에서 최종 검증)
        setAccessChecking(false);
      }
    };

    checkOnboardingAccess();
  }, [router]);

  // 접근 권한 확인 중이면 로딩 표시
  if (accessChecking) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh',
            fontSize: '18px',
            color: '#666'
          }}>
            접근 권한 확인 중...
          </div>
        </main>
      </div>
    );
  }

  // 접근 권한 오류가 있으면 오류 메시지 표시
  if (accessError) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div className={COMPONENT_CSS.ONBOARDING.FORM}>
            <ErrorMessage message={accessError} />
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
              잠시 후 홈으로 이동합니다...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
      <Header />
      <main className="container">
        <div className={COMPONENT_CSS.ONBOARDING.FORM}>
          <h2 className="trinity-onboarding__title">서비스 신청</h2>

          <ErrorMessage message={error} />

          <ProgressSteps currentStep={step} />

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <Step1BasicInfo
                formData={formData}
                setFormData={setFormData}
                emailFormatError={emailFormatError}
                emailDuplicateChecked={emailDuplicateChecked}
                emailDuplicateChecking={emailDuplicateChecking}
                emailDuplicateError={emailDuplicateError}
                emailVerified={emailVerified}
                emailVerificationCode={emailVerificationCode}
                emailVerificationSending={emailVerificationSending}
                emailVerificationVerifying={emailVerificationVerifying}
                emailVerificationTimeLeft={emailVerificationTimeLeft}
                resendCooldown={resendCooldown}
                setEmailVerified={setEmailVerified}
                setEmailVerificationCode={setEmailVerificationCode}
                setEmailDuplicateChecked={setEmailDuplicateChecked}
                setEmailDuplicateError={setEmailDuplicateError}
                setEmailVerificationTimeLeft={setEmailVerificationTimeLeft}
                setVerificationAttempts={setVerificationAttempts}
                sendEmailVerificationCode={sendEmailVerificationCode}
                verifyEmailCode={verifyEmailCode}
                validateEmailFormat={validateEmailFormat}
                checkEmailDuplicate={checkEmailDuplicate}
                setError={setError}
                setEmailFormatError={setEmailFormatError}
              />
            )}

            {step === 2 && (
              <Step2BusinessType
                formData={formData}
                setFormData={setFormData}
                businessCategories={businessCategories}
                businessCategoryItems={businessCategoryItems}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                loading={loading}
              />
            )}

            {step === 3 && (
              <Step3PricingPlan
                formData={formData}
                setFormData={setFormData}
                pricingPlans={pricingPlans}
                loading={loading}
              />
            )}

            {step === 4 && (
              <Step4Payment
                formData={formData}
                setFormData={setFormData}
                paymentOption={paymentOption}
                setPaymentOption={setPaymentOption}
                paymentMethodVerified={paymentMethodVerified}
                paymentMethodVerifying={paymentMethodVerifying}
                skipPaymentMethod={skipPaymentMethod}
                setSkipPaymentMethod={setSkipPaymentMethod}
                customerKey={customerKey}
                createPaymentMethod={createPaymentMethod}
                setError={setError}
              />
                )}

            {step === 5 && (
              <Step5Completion formData={formData} />
            )}

            {/* Navigation Buttons */}
            {step < 5 && (
                <div className="trinity-onboarding__buttons">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className={COMPONENT_CSS.ONBOARDING.BUTTON_SECONDARY}
                  >
                    {TRINITY_CONSTANTS.MESSAGES.PREVIOUS}
                  </button>
                )}
                <button
                  type={step < 4 ? "button" : "submit"}
                  onClick={() => {
                    if (step < 4) {
                      setStep(step + 1);
                            }
                  }}
                  className={COMPONENT_CSS.ONBOARDING.BUTTON}
                  disabled={
                    loading || 
                    (step === 1 && (!formData.tenantName || !formData.adminPassword || !formData.adminPasswordConfirm || formData.adminPassword !== formData.adminPasswordConfirm || formData.adminPassword.length < 8)) ||
                    (step === 2 && !formData.businessType) || 
                    (step === 3 && !formData.planId)
                  }
                >
                  {loading 
                    ? TRINITY_CONSTANTS.MESSAGES.PROCESSING 
                    : step < 4 
                      ? TRINITY_CONSTANTS.MESSAGES.NEXT 
                      : TRINITY_CONSTANTS.MESSAGES.SUBMIT}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
