/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/forbid-dom-props */
/* eslint-disable no-magic-numbers */
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
import OnboardingLogin from "../../components/onboarding/OnboardingLogin";

export default function OnboardingPage() {
  const router = useRouter();
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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

  // 온보딩 접근 권한 확인 (로그인 상태 확인)
  useEffect(() => {
    const checkOnboardingAccess = async () => {
      try {
        // 현재 사용자 정보 조회 시도
        try {
          const response = await apiGet<{ success: boolean; data?: { tenantId?: string | null; email?: string } }>('/api/auth/current-user');
          
          if (response.success && response.data) {
            const user = response.data;
            setIsLoggedIn(true);
            setShowLogin(false);
            
            // 이미 로그인된 사용자는 이메일 정보를 자동으로 채움
            if (user.email) {
              const userEmail = user.email; // 타입 가드
              setFormData(prev => ({
                ...prev,
                contactEmail: userEmail,
                // 필요한 경우 다른 필드도 채울 수 있음
              }));
              // 이메일 인증 완료 처리 (이미 로그인된 사용자이므로)
              setEmailVerified(true);
            }
            
            // TODO: 진행 중인 온보딩 요청이 있는지 확인하고 이어하기 옵션 제공
          } else {
            // 로그인되지 않은 경우 로그인 옵션 표시
            setIsLoggedIn(false);
            setShowLogin(true);
          }
        } catch (err) {
          // 인증되지 않은 사용자이거나 API 오류인 경우
          setIsLoggedIn(false);
          setShowLogin(true);
        }
        
        setAccessChecking(false);
      } catch (err) {
        console.error('온보딩 접근 권한 확인 실패:', err);
        setAccessChecking(false);
        // 오류 발생 시 로그인 화면 표시
        setShowLogin(true);
      }
    };

    checkOnboardingAccess();
  }, [router, setFormData, setEmailVerified]);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (user: any) => {
    setIsLoggedIn(true);
    setShowLogin(false);
    // 사용자 정보로 폼 채우기
    if (user.email) {
      const userEmail = user.email; // 타입 가드
      setFormData(prev => ({
        ...prev,
        contactEmail: userEmail
      }));
      setEmailVerified(true);
    }
  };

  // 로그인 건너뛰기 핸들러
  const handleSkipLogin = () => {
    setShowLogin(false);
  };

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

  // 로그인 화면 표시
  if (showLogin) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div className={COMPONENT_CSS.ONBOARDING.FORM}>
            <OnboardingLogin 
              onLoginSuccess={handleLoginSuccess}
              onSkipLogin={handleSkipLogin}
            />
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
              <>
                <Step3PricingPlan
                  formData={formData}
                  setFormData={setFormData}
                  pricingPlans={pricingPlans}
                  loading={loading}
                />
                {/* PG 결제 프로세스 안내 메시지 */}
                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '20px',
                  marginTop: '20px'
                }}>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#856404',
                    marginBottom: '10px'
                  }}>
                    ⚠️ PG사 결제 프로세스는 추후 진행 예정입니다
                  </p>
                  <p style={{ color: '#856404', lineHeight: '1.6', fontSize: '14px' }}>
                    현재는 결제 수단 등록 없이 바로 온보딩 등록이 가능합니다.
                    <br />
                    온보딩 승인 후 서비스 이용 시점에 결제 수단을 등록하실 수 있습니다.
                  </p>
                </div>
              </>
            )}

            {/* Step 4는 일단 숨김 (추후 활성화 가능) */}
            {false && step === 4 && (
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
                  type={step === 3 ? "submit" : step < 4 ? "button" : "submit"}
                  onClick={() => {
                    if (step < 3) {
                      setStep(step + 1);
                    } else if (step === 3) {
                      // step 3에서 바로 제출 (step 4 결제 단계 건너뛰기)
                      // handleSubmit이 자동으로 호출됨
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
                    : step === 3
                      ? TRINITY_CONSTANTS.MESSAGES.SUBMIT
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
