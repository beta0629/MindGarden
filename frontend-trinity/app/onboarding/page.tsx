/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/forbid-dom-props */
/* eslint-disable no-magic-numbers */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import { useOnboarding } from "../../hooks/useOnboarding";
import { apiGet, getPublicOnboardingRequests, type OnboardingRequest } from "../../utils/api";
import ProgressSteps from "../../components/onboarding/ProgressSteps";
import AnimatedProgressBar from "../../components/onboarding/AnimatedProgressBar";
import StepTransition from "../../components/onboarding/StepTransition";
import ErrorMessage from "../../components/onboarding/ErrorMessage";
import Step1BasicInfo from "../../components/onboarding/Step1BasicInfo";
import Step1BasicInfoProgressive from "../../components/onboarding/Step1BasicInfoProgressive";
import Step2BusinessType from "../../components/onboarding/Step2BusinessType";
import Step3PricingPlan from "../../components/onboarding/Step3PricingPlan";
import Step4Payment from "../../components/onboarding/Step4Payment";
import Step5Completion from "../../components/onboarding/Step5Completion";
import Step6DashboardSetup from "../../components/onboarding/Step6DashboardSetup";
import OnboardingLogin from "../../components/onboarding/OnboardingLogin";
import OnboardingWelcome from "../../components/onboarding/OnboardingWelcome";

export default function OnboardingPage() {
  const router = useRouter();
  const [accessChecking, setAccessChecking] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [existingRequests, setExistingRequests] = useState<OnboardingRequest[]>([]);
  const [showExistingRequests, setShowExistingRequests] = useState(false);
  const [loadingExistingRequests, setLoadingExistingRequests] = useState(false);
  const prevStepRef = useRef<number>(1);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  
  const {
    step,
    setStep: setStepInternal,
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
    loadRegionCodes,
    regionCodes,
    handleSubmit,
    checkEmailDuplicate,
    sendEmailVerificationCode,
    verifyEmailCode,
    createPaymentMethod,
  } = useOnboarding();

  // 단계 변경 시 방향 감지 및 애니메이션 방향 설정
  const setStep = (newStep: number) => {
    if (newStep > prevStepRef.current) {
      setTransitionDirection("forward");
    } else if (newStep < prevStepRef.current) {
      setTransitionDirection("backward");
    }
    prevStepRef.current = newStep;
    setStepInternal(newStep);
  };

  // 요금제 정보 로드 (step 3 진입 시)
  useEffect(() => {
    if (step === 3 && pricingPlans.length === 0) {
      loadPricingPlans();
    }
  }, [step, pricingPlans.length, loadPricingPlans]);

  // 업종 카테고리 로드 (step 2 진입 시)
  // 무한 루프 방지: 한 번만 실행되도록 ref 사용
  const categoriesLoadedRef = useRef(false);
  useEffect(() => {
    // step 2가 아니면 초기화하고 리턴
    if (step !== 2) {
      categoriesLoadedRef.current = false;
      return;
    }
    
    // 이미 로드 시도했으면 실행하지 않음 (무한 루프 방지)
    if (categoriesLoadedRef.current) {
      return;
    }
    
    // 한 번만 실행
    categoriesLoadedRef.current = true;
    loadBusinessCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, loadBusinessCategories]); // loadBusinessCategories는 useCallback으로 안정화됨

  // 선택된 카테고리의 아이템 로드
  // 무한 루프 방지: 한 번만 실행되도록 ref 사용
  const categoryItemsLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    // selectedCategoryId가 없으면 초기화하고 리턴
    if (!selectedCategoryId) {
      categoryItemsLoadedRef.current = null;
      return;
    }
    
    // 이미 로드 시도했으면 실행하지 않음 (무한 루프 방지)
    if (categoryItemsLoadedRef.current === selectedCategoryId) {
      return;
    }
    
    // 한 번만 실행
    categoryItemsLoadedRef.current = selectedCategoryId;
    loadBusinessCategoryItems(selectedCategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]); // loadBusinessCategoryItems는 useCallback으로 안정화됨

  // 온보딩 접근 권한 확인 (로그인 상태 확인 - 선택사항)
  useEffect(() => {
    // 환영 화면에서는 API 호출하지 않음
    if (showWelcome) {
      setAccessChecking(false);
      setIsLoggedIn(false);
      setShowLogin(false);
      return;
    }

    const checkOnboardingAccess = async () => {
      try {
        // 현재 사용자 정보 조회 시도 (로그인된 경우에만 편의 기능 제공)
        // 표준화: /api/v1/ 경로 사용
        try {
          const response = await apiGet<{ success: boolean; data?: { tenantId?: string | null; email?: string } } | { tenantId?: string | null; email?: string }>('/api/v1/auth/current-user');
          
          // apiGet이 이미 ApiResponse의 data를 추출하므로, response는 직접 user 객체일 수 있음
          let user: { tenantId?: string | null; email?: string } | null = null;
          
          if (response && typeof response === 'object') {
            // ApiResponse 래퍼가 있는 경우
            if ('success' in response && 'data' in response && response.success && response.data) {
              user = response.data;
            } 
            // 직접 user 객체인 경우
            else if ('email' in response || 'tenantId' in response) {
              user = response as { tenantId?: string | null; email?: string };
            }
          }
          
          if (user) {
            setIsLoggedIn(true);
            setShowLogin(false);
            
            // 이미 로그인된 사용자는 이메일 정보를 자동으로 채움
            // React 경고 방지: 상태 업데이트를 다음 렌더링 사이클로 지연
            if (user.email) {
              const userEmail = user.email; // 타입 가드
              // setTimeout으로 상태 업데이트를 다음 이벤트 루프로 지연
              setTimeout(() => {
                setFormData(prev => ({
                  ...prev,
                  contactEmail: userEmail,
                  // 필요한 경우 다른 필드도 채울 수 있음
                }));
                // 이메일 인증 완료 처리 (이미 로그인된 사용자이므로)
                setEmailVerified(true);
                
                // 진행 중인 온보딩 요청 조회
                loadExistingOnboardingRequests(userEmail);
              }, 0);
            }
          } else {
            // 로그인되지 않은 경우 - 온보딩 바로 시작 가능
            setIsLoggedIn(false);
            setShowLogin(false); // 로그인 화면 표시하지 않음
          }
        } catch (err) {
          // 네트워크 오류 등 예상치 못한 오류만 catch
          // 400/401/403 오류는 api.ts에서 조용히 처리되어 여기까지 오지 않음
          // Connection failed는 네트워크 오류 (백엔드 미연결) - 조용히 처리
          setIsLoggedIn(false);
          setShowLogin(false); // 로그인 화면 표시하지 않음
        }
        
        setAccessChecking(false);
      } catch (err) {
        // 예상치 못한 오류도 무시하고 온보딩 진행 (에러 로그 출력 안 함)
        setAccessChecking(false);
        setIsLoggedIn(false);
        setShowLogin(false); // 로그인 화면 표시하지 않음
      }
    };

    checkOnboardingAccess();
  }, [router, setFormData, setEmailVerified, showWelcome]);

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

  // 환영 화면 시작 버튼 핸들러
  const handleWelcomeStart = () => {
    setShowWelcome(false);
  };

  // 접근 권한 확인 중이면 로딩 표시
  if (accessChecking) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div className="trinity-onboarding__loading-container">
            접근 권한 확인 중...
          </div>
        </main>
      </div>
    );
  }

  // 환영 화면 표시
  if (showWelcome) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div className={COMPONENT_CSS.ONBOARDING.FORM}>
            <OnboardingWelcome onStart={handleWelcomeStart} />
          </div>
        </main>
      </div>
    );
  }

  // 기존 온보딩 요청 선택 화면 표시
  if (showExistingRequests && existingRequests.length > 0) {
    return (
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <Header />
        <main className="container">
          <div className={COMPONENT_CSS.ONBOARDING.FORM}>
            <h2 className="trinity-onboarding__title">진행 중인 온보딩</h2>
            <p className="trinity-onboarding__description">
              진행 중인 온보딩 요청이 있습니다. 이어서 진행하시겠습니까?
            </p>
            
            <div className="trinity-onboarding__existing-requests">
              {existingRequests.map((request) => (
                <div
                  key={request.id}
                  className="trinity-onboarding__request-card"
                  onClick={() => handleContinueExistingRequest(request)}
                >
                  <div className="trinity-onboarding__request-title">
                    {request.tenantName || '테넌트 이름 없음'}
                  </div>
                  <div className="trinity-onboarding__request-meta">
                    신청일: {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="trinity-onboarding__request-status">
                    상태: 대기 중
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => setShowExistingRequests(false)}
                className={`${COMPONENT_CSS.ONBOARDING.BUTTON_SECONDARY} trinity-onboarding__new-start-button`}
              >
                새로 시작하기
              </button>
            </div>
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
            <p className="trinity-onboarding__error-message">
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

          <AnimatedProgressBar currentStep={step} totalSteps={TRINITY_CONSTANTS.ONBOARDING_STEPS.length} />

          <form onSubmit={handleSubmit}>
            <StepTransition step={1} currentStep={step} direction={transitionDirection}>
              {step === 1 && (
                <Step1BasicInfoProgressive
                formData={formData}
                setFormData={setFormData}
                onStepComplete={() => setStep(2)}
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
                regionCodes={regionCodes}
                loadRegionCodes={loadRegionCodes}
              />
              )}
            </StepTransition>

            <StepTransition step={2} currentStep={step} direction={transitionDirection}>
              {step === 2 && (
                <Step2BusinessType
                formData={formData}
                setFormData={setFormData}
                businessCategories={businessCategories}
                businessCategoryItems={businessCategoryItems}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                loading={loading}
                loadBusinessCategories={loadBusinessCategories}
              />
              )}
            </StepTransition>

            <StepTransition step={3} currentStep={step} direction={transitionDirection}>
              {step === 3 && (
                <>
                  <Step3PricingPlan
                  formData={formData}
                  setFormData={setFormData}
                  pricingPlans={pricingPlans}
                  loading={loading}
                />
                {/* PG 결제 프로세스 안내 메시지 */}
                <div className="trinity-onboarding__warning-box">
                  <p className="trinity-onboarding__warning-title">
                    ⚠️ PG사 결제 프로세스는 추후 진행 예정입니다
                  </p>
                  <p className="trinity-onboarding__warning-text">
                    현재는 결제 수단 등록 없이 바로 온보딩 등록이 가능합니다.
                    <br />
                    온보딩 승인 후 서비스 이용 시점에 결제 수단을 등록하실 수 있습니다.
                  </p>
                </div>
                </>
              )}
            </StepTransition>

            {/* Step 4는 일단 숨김 (추후 활성화 가능) */}
            <StepTransition step={4} currentStep={step} direction={transitionDirection}>
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
            </StepTransition>

            <StepTransition step={5} currentStep={step} direction={transitionDirection}>
              {step === 5 && (
                <Step5Completion formData={formData} />
              )}
            </StepTransition>

            <StepTransition step={6} currentStep={step} direction={transitionDirection}>
              {step === 6 && (
                <Step6DashboardSetup
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </StepTransition>

            {/* Navigation Buttons - Step 1은 순차적 진행 컴포넌트 내부 버튼 사용 */}
            {step !== 1 && (step < 5 || step === 6) && (
                <div className="trinity-progressive-fields__navigation">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="trinity-progressive-fields__nav-button trinity-progressive-fields__nav-button--previous"
                  >
                    ← {TRINITY_CONSTANTS.MESSAGES.PREVIOUS}
                  </button>
                )}
                <button
                  type={step === 3 || step === 6 ? "submit" : step < 4 ? "button" : "submit"}
                  onClick={() => {
                    if (step < 3) {
                      setStep(step + 1);
                    } else if (step === 3) {
                      // step 3에서 step 6으로 이동 (step 4, 5 건너뛰기)
                      setStep(6);
                    } else if (step === 6) {
                      // step 6에서 제출
                      // handleSubmit이 자동으로 호출됨
                    }
                  }}
                  className="trinity-progressive-fields__nav-button trinity-progressive-fields__nav-button--next"
                  disabled={
                    loading || 
                    (step === 2 && !formData.businessType) || 
                    (step === 3 && !formData.planId) ||
                    (step === 6 && false) // Step6DashboardSetup 내부에서 검증
                  }
                >
                  {loading 
                    ? TRINITY_CONSTANTS.MESSAGES.PROCESSING 
                    : step === 3
                      ? `${TRINITY_CONSTANTS.MESSAGES.NEXT} →`
                      : step === 6
                        ? `${TRINITY_CONSTANTS.MESSAGES.SUBMIT} →`
                        : step < 4 
                          ? `${TRINITY_CONSTANTS.MESSAGES.NEXT} →`
                          : `${TRINITY_CONSTANTS.MESSAGES.SUBMIT} →`}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
