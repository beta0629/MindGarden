/**
 * OnboardingPage — Core Solution 테넌트 신청 온보딩 (Phase C-Refine v2)
 *
 * SPEC: docs/design/v2/refine/v2/DESIGN_V2_REFINE_V2_ONBOARDING_SPEC.md
 *   - 40/60 Split View 레이아웃 (OnboardingTemplate)
 *   - 4단계 stepper (기존 6단계 → SPEC §9 4단계로 축소)
 *     Step 0: 회사 기본 정보 (회사명 / 업종 / 임직원 규모)  ← v2 mockup 주 화면
 *     Step 1: 서비스 설정 (도메인 / 연락처 / 이메일)
 *     Step 2: 관리자 계정 + 약관 동의
 *     Step 3: 신청 완료 (PENDING 안내)
 *   - StandardizedApi 사용, mg-v2-onboarding-* 토큰 100%, 하드코딩 0.
 *   - React issue-130 / safeDisplay 준수.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import OnboardingTemplate from '../../components/public/templates/OnboardingTemplate';
import OnboardingSegmentedControl from '../../components/public/molecules/OnboardingSegmentedControl';
import PublicErrorBoundary from '../../components/public/organisms/PublicErrorBoundary';
import StandardizedApi from '../../utils/standardizedApi';
import './OnboardingPage.css';

const TOTAL_STEPS = 4;
const FIRST_STEP = 0;
const LAST_INPUT_STEP = 2;
const COMPLETE_STEP = 3;

const API_ENDPOINTS = Object.freeze({
  DOMAIN_CHECK: '/api/v1/public/onboarding/domain-check',
  SUBMIT: '/api/v1/public/onboarding/submit',
});

const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const PHONE_PATTERN = /^[0-9]{9,11}$/;
const MIN_PASSWORD_LENGTH = 8;

const INITIAL_FORM_DATA = Object.freeze({
  tenantName: '',
  businessType: '',
  staffSize: '',
  domain: '',
  phone: '',
  email: '',
  adminName: '',
  adminEmail: '',
  password: '',
  passwordConfirm: '',
  terms: false,
  privacy: false,
  marketing: false,
});

const INDUSTRY_OPTIONS = Object.freeze([
  { value: 'b2b-saas', labelKey: 'public.onboarding.v2.industryB2bSaas', fallback: 'B2B SaaS' },
  { value: 'fintech', labelKey: 'public.onboarding.v2.industryFintech', fallback: '핀테크' },
  { value: 'healthcare', labelKey: 'public.onboarding.v2.industryHealthcare', fallback: '헬스케어' },
  { value: 'ecommerce', labelKey: 'public.onboarding.v2.industryEcommerce', fallback: '이커머스' },
  { value: 'other', labelKey: 'public.onboarding.v2.industryOther', fallback: '기타' },
]);

const STAFF_SIZE_OPTIONS = Object.freeze([
  { value: '1-10', labelKey: 'public.onboarding.v2.staffSize1to10', fallback: '1-10' },
  { value: '11-50', labelKey: 'public.onboarding.v2.staffSize11to50', fallback: '11-50' },
  { value: '51-200', labelKey: 'public.onboarding.v2.staffSize51to200', fallback: '51-200' },
  { value: '201+', labelKey: 'public.onboarding.v2.staffSize201plus', fallback: '201+' },
]);

const OnboardingPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(FIRST_STEP);
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA });
  const [errors, setErrors] = useState({});
  const [domainStatus, setDomainStatus] = useState('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (name === 'domain' && domainStatus !== 'idle') {
      setDomainStatus('idle');
    }
  }, [domainStatus]);

  const handleDomainCheck = useCallback(async () => {
    const domain = formData.domain.trim();
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
        newErrors.tenantName = t('public.onboarding.errorTenantNameRequired', '회사명을 입력해주세요.');
      }
    }
    if (step === 1) {
      if (!formData.domain.trim()) {
        newErrors.domain = t('public.onboarding.errorDomainRequired', '도메인을 입력해주세요.');
      } else if (!DOMAIN_PATTERN.test(formData.domain)) {
        newErrors.domain = t('public.onboarding.errorDomainFormat', '영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.');
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
    if (step === 2) {
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
      if (!formData.terms) {
        newErrors.terms = t('public.onboarding.errorTermsRequired', '이용약관에 동의해주세요.');
      }
      if (!formData.privacy) {
        newErrors.privacy = t('public.onboarding.errorPrivacyRequired', '개인정보 처리방침에 동의해주세요.');
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const isCurrentStepValid = useMemo(() => {
    if (currentStep === 0) {
      return Boolean(formData.tenantName.trim());
    }
    if (currentStep === 1) {
      return Boolean(
        formData.domain.trim()
        && formData.phone.trim()
        && formData.email.trim()
      );
    }
    if (currentStep === 2) {
      return Boolean(
        formData.adminName.trim()
        && formData.adminEmail.trim()
        && formData.password
        && formData.password.length >= MIN_PASSWORD_LENGTH
        && formData.password === formData.passwordConfirm
        && formData.terms
        && formData.privacy
      );
    }
    return true;
  }, [currentStep, formData]);

  const handlePrev = useCallback(() => {
    if (currentStep > FIRST_STEP) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(LAST_INPUT_STEP)) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await StandardizedApi.post(API_ENDPOINTS.SUBMIT, {
        tenantName: formData.tenantName,
        businessType: formData.businessType,
        staffSize: formData.staffSize,
        domain: formData.domain,
        phone: formData.phone,
        email: formData.email,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        password: formData.password,
        termsAccepted: formData.terms,
        privacyAccepted: formData.privacy,
        marketingConsent: formData.marketing,
      });
      setCurrentStep(COMPLETE_STEP);
    } catch {
      setSubmitError(t('public.onboarding.errorSubmitFailed', '신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, t, validateStep]);

  const handleNext = useCallback(() => {
    if (currentStep === COMPLETE_STEP) {
      navigate(ROUTES.HOME);
      return;
    }
    if (currentStep === LAST_INPUT_STEP) {
      handleSubmit();
      return;
    }
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  }, [currentStep, navigate, validateStep, handleSubmit]);

  const handleStepClick = useCallback((stepIndex) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep]);

  const industryOptions = useMemo(() => INDUSTRY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey, opt.fallback),
  })), [t]);

  const staffSizeOptions = useMemo(() => STAFF_SIZE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey, opt.fallback),
  })), [t]);

  const renderStepHeader = (titleKey, titleFallback, subtitleKey, subtitleFallback) => (
    <header className="mg-v2-onboarding-form__header">
      <h1 className="mg-v2-onboarding-form__title">
        {t(titleKey, titleFallback)}
      </h1>
      <p className="mg-v2-onboarding-form__subtitle">
        {t(subtitleKey, subtitleFallback)}
      </p>
    </header>
  );

  const renderCta = (label, options = {}) => (
    <button
      type="button"
      className="mg-v2-onboarding-form__cta"
      onClick={handleNext}
      disabled={!isCurrentStepValid || isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting && <span className="mg-v2-onboarding-form__cta-spinner" aria-hidden="true" />}
      <span>{label}</span>
      {!isSubmitting && options.showArrow !== false && (
        <svg
          className="mg-v2-onboarding-form__cta-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );

  const renderPrev = () => (
    <button
      type="button"
      className="mg-v2-onboarding-form__cta-secondary"
      onClick={handlePrev}
      disabled={isSubmitting}
    >
      {t('public.onboarding.v2.previousStep', '이전 단계')}
    </button>
  );

  const renderLoginLink = () => (
    <p className="mg-v2-onboarding-form__login-link">
      {t('public.onboarding.v2.alreadyHaveAccount', '이미 계정이 있으신가요?')}
      <a href={ROUTES.LOGIN} className="mg-v2-onboarding-form__login-anchor">
        {t('public.onboarding.v2.login', '로그인')}
      </a>
    </p>
  );

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <section
          className="mg-v2-onboarding-form"
          aria-live="polite"
          aria-label={t('public.onboarding.v2.stepCompanyAria', '회사 기본 정보 입력')}
          data-step="0"
        >
          {renderStepHeader(
            'public.onboarding.v2.title', '테넌트 등록을 시작하세요',
            'public.onboarding.v2.subtitle', '1분 안에 비즈니스 정보를 입력하고 시작합니다'
          )}

          <div className="mg-v2-onboarding-form__fields">
            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="tenantName">
                {t('public.onboarding.v2.companyName', '회사명')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="tenantName"
                name="tenantName"
                type="text"
                className={`mg-v2-onboarding-form__input${errors.tenantName ? ' mg-v2-onboarding-form__input--error' : ''}`}
                placeholder={t('public.onboarding.v2.companyNamePlaceholder', '회사명을 입력하세요')}
                value={formData.tenantName}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.tenantName)}
                aria-describedby={errors.tenantName ? 'tenantName-error' : undefined}
                autoComplete="organization"
              />
              {errors.tenantName && (
                <span id="tenantName-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.tenantName}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="businessType">
                {t('public.onboarding.v2.industry', '업종 선택')}
              </label>
              <select
                id="businessType"
                name="businessType"
                className="mg-v2-onboarding-form__select"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="">
                  {t('public.onboarding.v2.industryPlaceholder', '업종을 선택하세요')}
                </option>
                {industryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mg-v2-onboarding-form__field">
              <span className="mg-v2-onboarding-form__label" id="staffSize-label">
                {t('public.onboarding.v2.staffSize', '임직원 규모')}
              </span>
              <OnboardingSegmentedControl
                name="staffSize"
                options={staffSizeOptions}
                value={formData.staffSize}
                onChange={handleChange}
                ariaLabel={t('public.onboarding.v2.staffSize', '임직원 규모')}
              />
            </div>
          </div>

          <div className="mg-v2-onboarding-form__actions">
            {renderCta(t('public.onboarding.v2.nextStep', '다음 단계'))}
          </div>
          {renderLoginLink()}
        </section>
      );
    }

    if (currentStep === 1) {
      return (
        <section
          className="mg-v2-onboarding-form"
          aria-live="polite"
          aria-label={t('public.onboarding.v2.stepContactAria', '서비스 설정 입력')}
          data-step="1"
        >
          {renderStepHeader(
            'public.onboarding.v2.contactTitle', '서비스 설정',
            'public.onboarding.v2.contactSubtitle', '서비스 접속 도메인과 연락처를 입력해주세요'
          )}

          <div className="mg-v2-onboarding-form__fields">
            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="domain">
                {t('public.onboarding.v2.domain', '서비스 도메인')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="domain"
                name="domain"
                type="text"
                className={`mg-v2-onboarding-form__input${errors.domain ? ' mg-v2-onboarding-form__input--error' : ''}`}
                placeholder={t('public.onboarding.v2.domainPlaceholder', '영문 소문자, 숫자, 하이픈(-)')}
                value={formData.domain}
                onChange={handleChange}
                onBlur={handleDomainCheck}
                aria-required="true"
                aria-invalid={Boolean(errors.domain)}
                aria-describedby={errors.domain ? 'domain-error' : undefined}
                autoComplete="off"
              />
              {errors.domain && (
                <span id="domain-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.domain}
                </span>
              )}
              {domainStatus === 'available' && !errors.domain && (
                <span className="mg-v2-onboarding-form__login-link" role="status">
                  {t('public.onboarding.v2.domainAvailable', '사용 가능한 도메인입니다.')}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="phone">
                {t('public.onboarding.v2.phone', '대표 연락처')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`mg-v2-onboarding-form__input${errors.phone ? ' mg-v2-onboarding-form__input--error' : ''}`}
                placeholder={t('public.onboarding.v2.phonePlaceholder', '숫자만 입력')}
                value={formData.phone}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
                autoComplete="tel"
              />
              {errors.phone && (
                <span id="phone-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.phone}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="email">
                {t('public.onboarding.v2.email', '대표 이메일')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`mg-v2-onboarding-form__input${errors.email ? ' mg-v2-onboarding-form__input--error' : ''}`}
                placeholder={t('public.onboarding.v2.emailPlaceholder', '예: hello@example.com')}
                value={formData.email}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <span id="email-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>
          </div>

          <div className="mg-v2-onboarding-form__actions">
            {renderCta(t('public.onboarding.v2.nextStep', '다음 단계'))}
            {renderPrev()}
          </div>
        </section>
      );
    }

    if (currentStep === 2) {
      return (
        <section
          className="mg-v2-onboarding-form"
          aria-live="polite"
          aria-label={t('public.onboarding.v2.stepAccountAria', '관리자 계정 및 약관 동의')}
          data-step="2"
        >
          {renderStepHeader(
            'public.onboarding.v2.accountTitle', '관리자 계정',
            'public.onboarding.v2.accountSubtitle', '어드민에 로그인할 최초 관리자 계정을 생성합니다'
          )}

          <div className="mg-v2-onboarding-form__fields">
            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="adminName">
                {t('public.onboarding.v2.adminName', '관리자 이름')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                className={`mg-v2-onboarding-form__input${errors.adminName ? ' mg-v2-onboarding-form__input--error' : ''}`}
                value={formData.adminName}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.adminName)}
                aria-describedby={errors.adminName ? 'adminName-error' : undefined}
                autoComplete="name"
              />
              {errors.adminName && (
                <span id="adminName-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.adminName}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="adminEmail">
                {t('public.onboarding.v2.adminEmail', '관리자 이메일 (로그인 ID)')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                className={`mg-v2-onboarding-form__input${errors.adminEmail ? ' mg-v2-onboarding-form__input--error' : ''}`}
                value={formData.adminEmail}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.adminEmail)}
                aria-describedby={errors.adminEmail ? 'adminEmail-error' : undefined}
                autoComplete="email"
              />
              {errors.adminEmail && (
                <span id="adminEmail-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.adminEmail}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="password">
                {t('public.onboarding.v2.password', '비밀번호')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`mg-v2-onboarding-form__input${errors.password ? ' mg-v2-onboarding-form__input--error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="new-password"
              />
              {errors.password && (
                <span id="password-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__field">
              <label className="mg-v2-onboarding-form__label" htmlFor="passwordConfirm">
                {t('public.onboarding.v2.passwordConfirm', '비밀번호 확인')}
                <span className="mg-v2-onboarding-form__required" aria-hidden="true">*</span>
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                className={`mg-v2-onboarding-form__input${errors.passwordConfirm ? ' mg-v2-onboarding-form__input--error' : ''}`}
                value={formData.passwordConfirm}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={Boolean(errors.passwordConfirm)}
                aria-describedby={errors.passwordConfirm ? 'passwordConfirm-error' : undefined}
                autoComplete="new-password"
              />
              {errors.passwordConfirm && (
                <span id="passwordConfirm-error" className="mg-v2-onboarding-form__error" role="alert">
                  {errors.passwordConfirm}
                </span>
              )}
            </div>

            <div className="mg-v2-onboarding-form__terms">
              <div className="mg-v2-onboarding-form__term-item">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="mg-v2-onboarding-form__checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <label htmlFor="terms" className="mg-v2-onboarding-form__term-label">
                  <span className="mg-v2-onboarding-form__term-required" aria-hidden="true">*</span>
                  {t('public.onboarding.v2.termsAgreement', '이용약관에 동의합니다.')}
                </label>
              </div>
              {errors.terms && (
                <span className="mg-v2-onboarding-form__error" role="alert">{errors.terms}</span>
              )}
              <div className="mg-v2-onboarding-form__term-item">
                <input
                  id="privacy"
                  name="privacy"
                  type="checkbox"
                  className="mg-v2-onboarding-form__checkbox"
                  checked={formData.privacy}
                  onChange={handleChange}
                />
                <label htmlFor="privacy" className="mg-v2-onboarding-form__term-label">
                  <span className="mg-v2-onboarding-form__term-required" aria-hidden="true">*</span>
                  {t('public.onboarding.v2.privacyAgreement', '개인정보 처리방침에 동의합니다.')}
                </label>
              </div>
              {errors.privacy && (
                <span className="mg-v2-onboarding-form__error" role="alert">{errors.privacy}</span>
              )}
              <div className="mg-v2-onboarding-form__term-item">
                <input
                  id="marketing"
                  name="marketing"
                  type="checkbox"
                  className="mg-v2-onboarding-form__checkbox"
                  checked={formData.marketing}
                  onChange={handleChange}
                />
                <label htmlFor="marketing" className="mg-v2-onboarding-form__term-label">
                  {t('public.onboarding.v2.marketingAgreement', '(선택) 마케팅 정보 수신에 동의합니다.')}
                </label>
              </div>
            </div>
          </div>

          {submitError && (
            <p className="mg-v2-onboarding-form__error" role="alert">{submitError}</p>
          )}

          <div className="mg-v2-onboarding-form__actions">
            {renderCta(
              isSubmitting
                ? t('public.onboarding.v2.submitting', '신청 중...')
                : t('public.onboarding.v2.submit', '신청 완료하기'),
              { showArrow: false }
            )}
            {renderPrev()}
          </div>
        </section>
      );
    }

    return (
      <section
        className="mg-v2-onboarding-form"
        aria-live="polite"
        aria-label={t('public.onboarding.v2.stepCompleteAria', '신청 완료')}
        data-step="3"
      >
        <div className="mg-v2-onboarding-form__complete" role="status">
          <svg
            className="mg-v2-onboarding-form__complete-icon"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="3" />
            <polyline
              points="24,42 35,53 56,30"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <h2 className="mg-v2-onboarding-form__complete-title">
            {t('public.onboarding.v2.completeTitle', '신청이 완료되었습니다')}
          </h2>
          <p className="mg-v2-onboarding-form__complete-message">
            {t(
              'public.onboarding.v2.completeMessage',
              '내부 검토를 거쳐 1~2 영업일 내에 승인될 예정입니다. 승인이 완료되면 관리자 이메일로 안내해 드립니다.'
            )}
          </p>
        </div>

        <div className="mg-v2-onboarding-form__actions">
          {renderCta(t('public.onboarding.v2.goHome', '홈으로 돌아가기'), { showArrow: false })}
        </div>
      </section>
    );
  };

  return (
    <PublicErrorBoundary>
      <OnboardingTemplate
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onStepClick={handleStepClick}
      >
        {renderStepContent()}
      </OnboardingTemplate>
    </PublicErrorBoundary>
  );
};

export default OnboardingPage;
