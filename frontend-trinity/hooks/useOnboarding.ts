/**
 * 온보딩 비즈니스 로직 커스텀 훅
 * 하드코딩 금지 원칙에 따라 모든 비즈니스 로직을 여기로 분리
 */

import { useState, useEffect } from "react";
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
import { getDefaultRiskLevel } from "../utils/commonCodeUtils";

export interface OnboardingFormData {
  tenantName: string;
  businessType: string;
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

  // customerKey 생성
  useEffect(() => {
    if (!customerKey) {
      setCustomerKey(generateUUID());
    }
  }, [customerKey]);

  // 기본 위험도 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const loadDefaultRiskLevel = async () => {
      try {
        const riskLevel = await getDefaultRiskLevel();
        setDefaultRiskLevel(riskLevel);
      } catch (err) {
        console.error("기본 위험도 로드 실패:", err);
        // 기본값 "LOW" 유지
      }
    };
    loadDefaultRiskLevel();
  }, []);

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
  const loadBusinessCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const categories = await getRootBusinessCategories();
      setBusinessCategories(categories);
    } catch (err) {
      console.error("업종 카테고리 로드 실패:", err);
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  // 업종 카테고리 아이템 로드
  const loadBusinessCategoryItems = async (categoryId: string) => {
    try {
      setLoading(true);
      const items = await getBusinessCategoryItems(categoryId);
      setBusinessCategoryItems(items);
    } catch (err) {
      console.error("업종 아이템 로드 실패:", err);
      setError(TRINITY_CONSTANTS.MESSAGES.ERROR_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 인증 코드 발송
  const handleSendEmailVerificationCode = async (email: string) => {
    try {
      setEmailVerificationSending(true);
      setError(null);
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
        checklistJson: JSON.stringify({
          contactPhone: formData.contactPhone,
          planId: formData.planId,
          adminPassword: formData.adminPassword,
          paymentMethodId: formData.paymentMethodId,
          subscriptionId: formData.subscriptionId,
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
    handleSubmit,
    checkEmailDuplicate,
    sendEmailVerificationCode: handleSendEmailVerificationCode,
    verifyEmailCode: handleVerifyEmailCode,
    createPaymentMethod,
    createSubscription,
  };
};

