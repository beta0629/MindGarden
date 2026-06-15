/**
 * OnboardingPage — 테넌트 신청 온보딩 페이지 (Phase C-3 W1)
 *
 * §P 옵션 C: 셀프 신청 → 어드민 심사 하이브리드.
 * 6단계 Stepper 폼 상태 관리 + API 호출 + 검증.
 * 라우트: /onboarding
 *
 * React issue-130 / safeDisplay 준수: 객체 직접 출력 금지.
 * StandardizedApi 사용, mg-v2-* 토큰 100%.
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OnboardingTemplate from '../../components/public/templates/OnboardingTemplate';
import PublicErrorBoundary from '../../components/public/organisms/PublicErrorBoundary';
import StandardizedApi from '../../utils/standardizedApi';

const TOTAL_STEPS = 6;
const FIRST_STEP = 0;
const COMPLETE_STEP = 5;

const API_ENDPOINTS = Object.freeze({
  DOMAIN_CHECK: '/api/v1/public/onboarding/domain-check',
  SUBMIT: '/api/v1/public/onboarding/submit',
});

const INITIAL_FORM_DATA = Object.freeze({
  tenantName: '',
  domain: '',
  phone: '',
  email: '',
  businessType: '',
  categories: [],
  staffSize: '',
  plan: '',
  paymentMethod: '',
  terms: false,
  privacy: false,
  marketing: false,
  adminName: '',
  adminEmail: '',
  password: '',
  passwordConfirm: '',
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const PHONE_PATTERN = /^[0-9]{9,11}$/;
const MIN_PASSWORD_LENGTH = 8;

const OnboardingPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState({});
  const [domainStatus, setDomainStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleDomainCheck = useCallback(async () => {
    const domain = formData.domain;
    if (!domain) {
      setErrors((prev) => ({
        ...prev,
        domain: t('public.onboarding.errorDomainRequired', '도메인을 입력해주세요.'),
      }));
      return;
    }
    if (!DOMAIN_PATTERN.test(domain)) {
      setErrors((prev) => ({
        ...prev,
        domain: t('public.onboarding.errorDomainFormat', '영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.'),
      }));
      return;
    }

    setDomainStatus('checking');
    try {
      const result = await StandardizedApi.get(API_ENDPOINTS.DOMAIN_CHECK, { domain });
      const available = result?.available ?? result?.data?.available ?? false;
      setDomainStatus(available ? 'available' : 'taken');
      if (!available) {
        setErrors((prev) => ({
          ...prev,
          domain: t('public.onboarding.errorDomainTaken', '이미 사용 중인 도메인입니다.'),
        }));
      } else {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.domain;
          return next;
        });
      }
    } catch {
      setDomainStatus('idle');
      setErrors((prev) => ({
        ...prev,
        domain: t('public.onboarding.errorDomainCheckFailed', '도메인 확인 중 오류가 발생했습니다.'),
      }));
    }
  }, [formData.domain, t]);

  const validateStep = useCallback((step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.tenantName.trim()) {
        newErrors.tenantName = t('public.onboarding.errorTenantNameRequired', '테넌트명을 입력해주세요.');
      }
      if (!formData.domain.trim()) {
        newErrors.domain = t('public.onboarding.errorDomainRequired', '도메인을 입력해주세요.');
      }
      if (!formData.phone.trim()) {
        newErrors.phone = t('public.onboarding.errorPhoneRequired', '연락처를 입력해주세요.');
      } else if (!PHONE_PATTERN.test(formData.phone)) {
        newErrors.phone = t('public.onboarding.errorPhoneFormat', '올바른 전화번호 형식이 아닙니다.');
      }
      if (!formData.email.trim()) {
        newErrors.email = t('public.onboarding.errorEmailRequired', '이메일을 입력해주세요.');
      } else if (!EMAIL_PATTERN.test(formData.email)) {
        newErrors.email = t('public.onboarding.errorEmailFormat', '올바른 이메일 형식이 아닙니다.');
      }
    }

    if (step === 3) {
      if (!formData.terms) {
        newErrors.terms = t('public.onboarding.errorTermsRequired', '이용약관에 동의해주세요.');
      }
      if (!formData.privacy) {
        newErrors.privacy = t('public.onboarding.errorPrivacyRequired', '개인정보 처리방침에 동의해주세요.');
      }
    }

    if (step === 4) {
      if (!formData.adminName.trim()) {
        newErrors.adminName = t('public.onboarding.errorAdminNameRequired', '관리자 이름을 입력해주세요.');
      }
      if (!formData.adminEmail.trim()) {
        newErrors.adminEmail = t('public.onboarding.errorAdminEmailRequired', '관리자 이메일을 입력해주세요.');
      } else if (!EMAIL_PATTERN.test(formData.adminEmail)) {
        newErrors.adminEmail = t('public.onboarding.errorAdminEmailFormat', '올바른 이메일 형식이 아닙니다.');
      }
      if (!formData.password) {
        newErrors.password = t('public.onboarding.errorPasswordRequired', '비밀번호를 입력해주세요.');
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        newErrors.password = t('public.onboarding.errorPasswordLength', '비밀번호는 8자 이상이어야 합니다.');
      }
      if (formData.password !== formData.passwordConfirm) {
        newErrors.passwordConfirm = t('public.onboarding.errorPasswordMismatch', '비밀번호가 일치하지 않습니다.');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) {
      return Boolean(
        formData.tenantName.trim() &&
        formData.domain.trim() &&
        formData.phone.trim() &&
        formData.email.trim()
      );
    }
    if (currentStep === 3) {
      return formData.terms && formData.privacy;
    }
    if (currentStep === 4) {
      return Boolean(
        formData.adminName.trim() &&
        formData.adminEmail.trim() &&
        formData.password &&
        formData.password.length >= MIN_PASSWORD_LENGTH &&
        formData.password === formData.passwordConfirm
      );
    }
    if (currentStep === COMPLETE_STEP) return true;
    return true;
  }, [currentStep, formData]);

  const handlePrev = useCallback(() => {
    if (currentStep > FIRST_STEP) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep === COMPLETE_STEP) {
      navigate('/');
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  }, [currentStep, navigate, validateStep]);

  const handleStepClick = useCallback((stepIndex) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      await StandardizedApi.post(API_ENDPOINTS.SUBMIT, {
        tenantName: formData.tenantName,
        domain: formData.domain,
        phone: formData.phone,
        email: formData.email,
        businessType: formData.businessType,
        categories: formData.categories,
        staffSize: formData.staffSize,
        plan: formData.plan,
        paymentMethod: formData.paymentMethod,
        termsAccepted: formData.terms,
        privacyAccepted: formData.privacy,
        marketingConsent: formData.marketing,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        password: formData.password,
      });
      setCurrentStep(COMPLETE_STEP);
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: t('public.onboarding.errorSubmitFailed', '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'),
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [currentStep, formData, t, validateStep]);

  return (
    <PublicErrorBoundary>
      <OnboardingTemplate
        currentStep={currentStep}
        formData={formData}
        errors={errors}
        domainStatus={domainStatus}
        isValid={isCurrentStepValid}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onDomainCheck={handleDomainCheck}
        onStepClick={handleStepClick}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </PublicErrorBoundary>
  );
};

export default OnboardingPage;
