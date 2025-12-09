/**
 * 온보딩 비즈니스 로직 커스텀 훅
 * 하드코딩 금지 원칙에 따라 모든 비즈니스 로직을 여기로 분리
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  createOnboardingRequest,
  getActivePricingPlans,
  getRootBusinessCategories,
  getBusinessCategoryItems,
  createPaymentMethod,
  createSubscription,
  sendEmailVerificationCode,
  verifyEmailCode,
  checkEmailDuplicate,
  type OnboardingCreateRequest,
  type PricingPlan,
  type BusinessCategory,
  type BusinessCategoryItem,
} from "../utils/api";
import { generateUUID } from "../utils/uuid";
import { TRINITY_CONSTANTS } from "../constants/trinity";
import { getDefaultRiskLevel, getRegionCodes, type CommonCode } from "../utils/commonCodeUtils";

export interface OnboardingFormData {
  tenantName: string;
  businessType: string;
  regionCode: string; // 지역 코드 (테넌트 ID 생성 시 사용)
  brandName: string; // 브랜드명 (상호, 브랜딩 적용 시 사용)
  contactEmail: string;
  contactEmailLocal: string;
  contactEmailDomain: string;
  contactEmailCustomDomain: string;
  contactPhone: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  planId: string;
  paymentMethodToken: string;
  paymentMethodId: string;
  subscriptionId: string;
  dashboardTemplates?: Record<string, string>; // 역할별 선택된 템플릿 ID
  dashboardWidgets?: Record<string, string[]>; // 역할별 위젯 목록 (템플릿 수정 시)
}

export const useOnboarding = () => {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [businessCategoryItems, setBusinessCategoryItems] = useState<BusinessCategoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({
    tenantName: "",
    businessType: "",
    regionCode: "",
    brandName: "",
    contactEmail: "",
    contactEmailLocal: "",
    contactEmailDomain: "",
    contactEmailCustomDomain: "",
    contactPhone: "",
    adminPassword: "",
    adminPasswordConfirm: "",
    planId: "",
    paymentMethodToken: "",
    paymentMethodId: "",
    subscriptionId: "",
  });
  const [paymentMethodVerified, setPaymentMethodVerified] = useState(false);
  const [paymentMethodVerifying, setPaymentMethodVerifying] = useState(false);
  const [skipPaymentMethod, setSkipPaymentMethod] = useState(false);
  const [paymentOption, setPaymentOption] = useState<"register" | "pay" | "skip">("register");
  const [customerKey, setCustomerKey] = useState<string>("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailVerificationSending, setEmailVerificationSending] = useState(false);
  const [emailVerificationVerifying, setEmailVerificationVerifying] = useState(false);
  const [emailDuplicateChecked, setEmailDuplicateChecked] = useState(false);
  const [emailDuplicateChecking, setEmailDuplicateChecking] = useState(false);
  const [emailDuplicateError, setEmailDuplicateError] = useState<string | null>(null);
  const [emailVerificationTimeLeft, setEmailVerificationTimeLeft] = useState<number | null>(null);
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [canResendCode, setCanResendCode] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [defaultRiskLevel, setDefaultRiskLevel] = useState<string>("LOW"); // 기본값 (공통 코드 로드 전)
  const [regionCodes, setRegionCodes] = useState<CommonCode[]>([]); // 지역 코드 목록

  // customerKey 생성
  useEffect(() => {
    if (!customerKey) {
      setCustomerKey(generateUUID());
    }
  }, [customerKey]);

  // 기본 위험도 로드 (컴포넌트 마운트 시 - 첫 번째 단계 진입 시에만)
  useEffect(() => {
    // 첫 번째 단계가 아니면 로드하지 않음 (불필요한 API 호출 방지)
    if (step !== 1) {
      return;
    }

    const loadDefaultRiskLevel = async () => {
      try {
        const riskLevel = await getDefaultRiskLevel();
        setDefaultRiskLevel(riskLevel);
      } catch (err) {
        // 기본값 "LOW" 유지 (에러는 조용히 처리)
        // getDefaultRiskLevel이 이미 기본값을 반환하므로 여기서는 추가 처리 불필요
      }
    };
    loadDefaultRiskLevel();
  }, [step]);

  // 이메일 인증 코드 타이머
  useEffect(() => {
    if (emailVerificationTimeLeft === null || emailVerificationTimeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setEmailVerificationTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [emailVerificationTimeLeft]);

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResendCode(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          setCanResendCode(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // URL 파라미터에서 planId 가져오기
  useEffect(() => {
    const planIdFromUrl = searchParams.get('planId');
    if (planIdFromUrl && !formData.planId) {
      setFormData(prev => ({ ...prev, planId: planIdFromUrl }));
    }

    const paymentMethodRegistered = searchParams.get('paymentMethodRegistered');
    if (paymentMethodRegistered === 'true') {
      setPaymentMethodVerified(true);
      setPaymentMethodVerifying(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('paymentMethodRegistered');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, formData.planId]);

  // 이메일 형식 검증
  const validateEmailFormat = (email: string): { valid: boolean; error?: string } => {
    if (!email || email.trim() === '') {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_REQUIRED };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_INVALID };
    }

    const [localPart, domainPart] = email.split('@');
    if (!localPart || localPart.length === 0) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_LOCAL_REQUIRED };
    }
    if (localPart.length > 64) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_LOCAL_TOO_LONG };
    }
    if (!/^[a-zA-Z0-9._+-]+$/.test(localPart)) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_LOCAL_INVALID };
    }

    if (!domainPart || domainPart.length === 0) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_DOMAIN_REQUIRED };
    }
    if (domainPart.length > 255) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_DOMAIN_TOO_LONG };
    }
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainPart)) {
      return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_DOMAIN_INVALID };
    }

    return { valid: true };
  };

  // 요금제 로드
  const loadPricingPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getActivePricingPlans();
      setPricingPlans(plans);
    } catch (err) {
      console.error("요금제 정보 로드 실패:", err);
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_PRICING);
    } finally {
      setLoading(false);
    }
  };

  // 업종 카테고리 로드
  // 무한 루프 방지: useRef를 사용하여 로딩 상태 및 완료 상태 추적
  const loadingRef = useRef(false);
  const loadedRef = useRef(false); // 로드 완료 여부 추적
  const errorRef = useRef(false); // 에러 발생 시 재시도 방지
  
  const loadBusinessCategories = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (loadingRef.current) {
      return;
    }
    
    // 이미 로드 완료되었으면 재시도하지 않음 (무한 루프 방지)
    if (loadedRef.current) {
      return;
    }
    
    // 에러가 발생했으면 재시도하지 않음 (무한 루프 방지)
    if (errorRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const categories = await getRootBusinessCategories();
      setBusinessCategories(categories || []);
      loadedRef.current = true; // 로드 완료 표시
      
      // 카테고리가 없으면 에러 메시지 표시
      if (!categories || categories.length === 0) {
        setError(TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES);
      }
    } catch (err) {
      console.error("업종 카테고리 로드 실패:", err);
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES);
      // 에러 발생 시 빈 배열 설정 및 재시도 방지 플래그 설정
      setBusinessCategories([]);
      errorRef.current = true; // 에러 발생 시 재시도 방지
      loadedRef.current = true; // 에러 발생해도 로드 시도 완료로 표시
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // 의존성 배열 비움 - 함수는 한 번만 생성

  // 업종 카테고리 아이템 로드
  // 무한 루프 방지: useRef를 사용하여 로딩 상태 및 완료 상태 추적
  const categoryItemsLoadingRef = useRef<Set<string>>(new Set()); // 로딩 중인 categoryId 추적
  const categoryItemsLoadedRef = useRef<Set<string>>(new Set()); // 로드 완료된 categoryId 추적
  
  const loadBusinessCategoryItems = useCallback(async (categoryId: string) => {
    // 이미 로딩 중이면 중복 호출 방지
    if (categoryItemsLoadingRef.current.has(categoryId)) {
      return;
    }
    
    // 이미 로드 완료되었으면 재시도하지 않음 (무한 루프 방지)
    if (categoryItemsLoadedRef.current.has(categoryId)) {
      return;
    }
    
    try {
      categoryItemsLoadingRef.current.add(categoryId);
      setLoading(true);
      setError(null);
      const items = await getBusinessCategoryItems(categoryId);
      setBusinessCategoryItems(items || []);
      categoryItemsLoadedRef.current.add(categoryId); // 로드 완료 표시
      
      // 세부 항목이 없어도 정상 (에러 아님)
      if (!items || items.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] 카테고리 아이템이 없습니다:', categoryId);
        }
      }
    } catch (err) {
      console.error("업종 아이템 로드 실패:", err);
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES);
      // 에러 발생 시 빈 배열 설정 및 재시도 방지 플래그 설정
      setBusinessCategoryItems([]);
      categoryItemsLoadedRef.current.add(categoryId); // 에러 발생해도 로드 시도 완료로 표시
    } finally {
      categoryItemsLoadingRef.current.delete(categoryId);
      setLoading(false);
    }
  }, []); // 의존성 배열 비움 - 함수는 한 번만 생성

  // 지역 코드 로드
  const loadRegionCodes = async () => {
    try {
      const codes = await getRegionCodes();
      setRegionCodes(codes);
    } catch (err) {
      console.error("지역 코드 로드 실패:", err);
      // 에러는 조용히 처리 (기본값 사용)
    }
  };

  // 개발/로컬 환경 체크
  const isDevelopment = () => {
    return process.env.NODE_ENV === 'development' || 
           process.env.NEXT_PUBLIC_ENV === 'development' ||
           process.env.NEXT_PUBLIC_ENV === 'local' ||
           typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  };

  // 이메일 인증 건너뛰기 플래그 (개발 환경에서만 사용)
  // 환경 변수로 제어 가능: NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true
  const shouldSkipEmailVerification = () => {
    if (!isDevelopment()) {
      return false; // 프로덕션에서는 항상 인증 필요
    }
    // 환경 변수로 제어 가능
    const skipFlag = process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION;
    // 기본값은 true (개발 환경에서는 기본적으로 인증 건너뛰기)
    return skipFlag === undefined || skipFlag === 'true' || skipFlag === '1';
  };

  // 이메일 인증 코드 발송
  const handleSendEmailVerificationCode = async (email: string) => {
    try {
      setEmailVerificationSending(true);
      setError(null);
      
      // 개발 환경에서 플래그로 인증 건너뛰기 제어
      if (shouldSkipEmailVerification()) {
        console.log('[개발 모드] 이메일 인증 코드 발송 건너뛰기:', email);
        setEmailVerified(true); // 자동으로 검증 완료 처리
        setEmailVerificationTimeLeft(null);
        setCanResendCode(false);
        setResendCooldown(0);
        return;
      }
      
      await sendEmailVerificationCode(email);
      setEmailVerificationTimeLeft(600); // 10분 (600초)
      setCanResendCode(false);
      setResendCooldown(60); // 1분 쿨다운
    } catch (err) {
      console.error("인증 코드 발송 실패:", err);
      setError(err instanceof Error ? err.message : "인증 코드 발송에 실패했습니다.");
    } finally {
      setEmailVerificationSending(false);
    }
  };

  // 이메일 인증 코드 검증
  const handleVerifyEmailCode = async (email: string, code: string) => {
    try {
      setEmailVerificationVerifying(true);
      setError(null);
      
      // 개발 환경에서 플래그로 인증 건너뛰기 제어
      if (shouldSkipEmailVerification()) {
        console.log('[개발 모드] 이메일 인증 코드 검증 건너뛰기:', email);
        setEmailVerified(true);
        setEmailVerificationCode("");
        setEmailVerificationTimeLeft(null);
        setVerificationAttempts(0);
        return;
      }
      
      await verifyEmailCode(email, code);
      setEmailVerified(true);
      setEmailVerificationCode("");
      setEmailVerificationTimeLeft(null);
      setVerificationAttempts(0);
    } catch (err) {
      console.error("인증 코드 검증 실패:", err);
      setVerificationAttempts((prev) => prev + 1);
      setError(err instanceof Error ? err.message : "인증 코드가 올바르지 않습니다.");
    } finally {
      setEmailVerificationVerifying(false);
    }
  };

  // 온보딩 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantName || !formData.businessType || !formData.contactEmail || !formData.planId) {
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_REQUIRED_FIELDS);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: OnboardingCreateRequest = {
        tenantId: undefined,
        tenantName: formData.tenantName,
        requestedBy: formData.contactEmail,
        riskLevel: defaultRiskLevel as "LOW" | "MEDIUM" | "HIGH", // 공통 코드에서 동적으로 가져온 값
        businessType: formData.businessType,
        regionCode: formData.regionCode || undefined,
        brandName: formData.brandName || undefined,
        checklistJson: JSON.stringify({
          contactPhone: formData.contactPhone,
          planId: formData.planId,
          adminPassword: formData.adminPassword,
          paymentMethodId: formData.paymentMethodId,
          subscriptionId: formData.subscriptionId,
          dashboardTemplates: formData.dashboardTemplates || {}, // 대시보드 템플릿 설정
          dashboardWidgets: formData.dashboardWidgets || {}, // 대시보드 위젯 설정 (템플릿 수정 시)
        }),
      };

      const result = await createOnboardingRequest(request);
      setStep(TRINITY_CONSTANTS.ONBOARDING_STEP.COMPLETION);
      console.log("온보딩 요청 성공:", result);
    } catch (err) {
      console.error("온보딩 요청 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : TRINITY_CONSTANTS.MESSAGES.ONBOARDING_ERROR
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
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
    emailVerified,
    setEmailVerified,
    emailVerificationCode,
    setEmailVerificationCode,
    emailVerificationSending,
    setEmailVerificationSending,
    emailVerificationVerifying,
    setEmailVerificationVerifying,
    emailDuplicateChecked,
    setEmailDuplicateChecked,
    emailDuplicateChecking,
    setEmailDuplicateChecking,
    emailDuplicateError,
    setEmailDuplicateError,
    emailVerificationTimeLeft,
    setEmailVerificationTimeLeft,
    emailFormatError,
    setEmailFormatError,
    verificationAttempts,
    setVerificationAttempts,
    canResendCode,
    setCanResendCode,
    resendCooldown,
    setResendCooldown,
    
    // Methods
    validateEmailFormat,
    loadPricingPlans,
    loadBusinessCategories,
    loadBusinessCategoryItems,
    loadRegionCodes,
    regionCodes,
    handleSubmit,
    checkEmailDuplicate,
    sendEmailVerificationCode: handleSendEmailVerificationCode,
    verifyEmailCode: handleVerifyEmailCode,
    createPaymentMethod,
    createSubscription,
  };
};

