/**
 * OnboardingStepForm — 6단계 온보딩 입력 양식 통합 Organism
 *
 * Phase C-1 Onboarding §3~§8 Step별 입력 필드 렌더.
 * 비즈니스 로직·API 호출은 props 콜백으로만 위임 (Phase C-3 페이지에서 주입).
 * mg-v2-* 토큰 한정, 다크 모드 자동 지원.
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './OnboardingStepForm.css';

const STEP_TITLES = [
  { titleKey: 'public.onboarding.step1Title', titleFallback: '기본 정보를 입력해 주세요', subtitleKey: 'public.onboarding.step1Subtitle', subtitleFallback: '생성될 기관의 대표 정보를 설정합니다.' },
  { titleKey: 'public.onboarding.step2Title', titleFallback: '비즈니스 정보를 입력해 주세요', subtitleKey: 'public.onboarding.step2Subtitle', subtitleFallback: '기관의 규모와 업종을 알려주세요.' },
  { titleKey: 'public.onboarding.step3Title', titleFallback: '결제 정보를 선택해 주세요', subtitleKey: 'public.onboarding.step3Subtitle', subtitleFallback: '서비스 이용 플랜과 결제 방식을 선택합니다.' },
  { titleKey: 'public.onboarding.step4Title', titleFallback: '약관에 동의해 주세요', subtitleKey: 'public.onboarding.step4Subtitle', subtitleFallback: '서비스 이용을 위한 필수 약관에 동의합니다.' },
  { titleKey: 'public.onboarding.step5Title', titleFallback: '관리자 계정을 생성해 주세요', subtitleKey: 'public.onboarding.step5Subtitle', subtitleFallback: '어드민 패널에 로그인할 최초 관리자 계정입니다.' },
  { titleKey: 'public.onboarding.step6Title', titleFallback: '신청이 완료되었습니다', subtitleKey: 'public.onboarding.step6Subtitle', subtitleFallback: '' },
];

const BUSINESS_TYPES = [
  { value: '', labelKey: 'public.onboarding.selectPlaceholder', fallback: '선택해주세요' },
  { value: 'counseling', labelKey: 'public.onboarding.bizCounseling', fallback: '상담' },
  { value: 'coaching', labelKey: 'public.onboarding.bizCoaching', fallback: '코칭' },
  { value: 'hospital', labelKey: 'public.onboarding.bizHospital', fallback: '병원' },
  { value: 'other', labelKey: 'public.onboarding.bizOther', fallback: '기타' },
];

const CATEGORY_OPTIONS = [
  { value: 'child', labelKey: 'public.onboarding.catChild', fallback: '아동/청소년' },
  { value: 'couple', labelKey: 'public.onboarding.catCouple', fallback: '부부/가족' },
  { value: 'worker', labelKey: 'public.onboarding.catWorker', fallback: '직장인' },
  { value: 'addiction', labelKey: 'public.onboarding.catAddiction', fallback: '중독' },
];

const STAFF_SIZE_OPTIONS = [
  { value: '1', labelKey: 'public.onboarding.staff1', fallback: '1인' },
  { value: '2-5', labelKey: 'public.onboarding.staff2to5', fallback: '2~5인' },
  { value: '6-10', labelKey: 'public.onboarding.staff6to10', fallback: '6~10인' },
  { value: '11+', labelKey: 'public.onboarding.staff11plus', fallback: '11인 이상' },
];

const PLAN_OPTIONS = [
  { value: 'basic', nameKey: 'public.onboarding.planBasic', nameFallback: 'Basic', price: '₩TBD', descKey: 'public.onboarding.planBasicDesc', descFallback: '1인 센터 추천', recommended: false },
  { value: 'pro', nameKey: 'public.onboarding.planPro', nameFallback: 'Pro', price: '₩TBD', descKey: 'public.onboarding.planProDesc', descFallback: '소규모 기관 추천', recommended: true },
  { value: 'enterprise', nameKey: 'public.onboarding.planEnterprise', nameFallback: 'Enterprise', price: '별도 문의', descKey: 'public.onboarding.planEnterpriseDesc', descFallback: '맞춤 솔루션', recommended: false },
];

const PAYMENT_METHODS = [
  { value: 'card', labelKey: 'public.onboarding.payCard', fallback: '카드' },
  { value: 'bank', labelKey: 'public.onboarding.payBank', fallback: '계좌이체' },
  { value: 'invoice', labelKey: 'public.onboarding.payInvoice', fallback: '세금계산서' },
];

const TERM_ITEMS = [
  { key: 'terms', labelKey: 'public.onboarding.termsOfService', fallback: '이용약관 동의', required: true },
  { key: 'privacy', labelKey: 'public.onboarding.privacyPolicy', fallback: '개인정보 처리방침 동의', required: true },
  { key: 'marketing', labelKey: 'public.onboarding.marketingConsent', fallback: '마케팅 수신 동의', required: false },
];

const PASSWORD_STRENGTH_LEVELS = { NONE: 0, WEAK: 1, FAIR: 2, STRONG: 3 };
const TOTAL_STRENGTH_BARS = 4;

const getPasswordStrength = (password) => {
  if (!password) return PASSWORD_STRENGTH_LEVELS.NONE;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return PASSWORD_STRENGTH_LEVELS.WEAK;
  if (score <= 2) return PASSWORD_STRENGTH_LEVELS.FAIR;
  return PASSWORD_STRENGTH_LEVELS.STRONG;
};

const STRENGTH_META = {
  [PASSWORD_STRENGTH_LEVELS.WEAK]: { labelKey: 'public.onboarding.strengthWeak', fallback: '취약', className: 'weak' },
  [PASSWORD_STRENGTH_LEVELS.FAIR]: { labelKey: 'public.onboarding.strengthFair', fallback: '보통', className: 'fair' },
  [PASSWORD_STRENGTH_LEVELS.STRONG]: { labelKey: 'public.onboarding.strengthStrong', fallback: '안전', className: 'strong' },
};

/* ============================================================
   Step별 렌더 함수
   ============================================================ */

const StepBasicInfo = ({ formData, onChange, errors, onDomainCheck, domainStatus, t }) => (
  <>
    <div className="mg-v2-step-form__field">
      <label className="mg-v2-step-form__label" htmlFor="tenantName">
        {t('public.onboarding.tenantName', '테넌트명')}
        <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
      </label>
      <input
        id="tenantName"
        name="tenantName"
        type="text"
        className={`mg-v2-step-form__input${errors?.tenantName ? ' mg-v2-step-form__input--error' : ''}`}
        value={formData?.tenantName || ''}
        onChange={onChange}
        placeholder={t('public.onboarding.tenantNamePlaceholder', '예: 코어솔루션 심리상담센터')}
        required
        aria-required="true"
        aria-invalid={!!errors?.tenantName}
        aria-describedby={errors?.tenantName ? 'tenantName-error' : undefined}
        autoComplete="organization"
      />
      {errors?.tenantName && (
        <span id="tenantName-error" className="mg-v2-step-form__error" role="alert">{errors.tenantName}</span>
      )}
    </div>

    <div className="mg-v2-step-form__field">
      <label className="mg-v2-step-form__label" htmlFor="domain">
        {t('public.onboarding.domain', '도메인')}
        <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
      </label>
      <div className="mg-v2-step-form__domain-row">
        <input
          id="domain"
          name="domain"
          type="text"
          className={`mg-v2-step-form__input${errors?.domain ? ' mg-v2-step-form__input--error' : ''}${domainStatus === 'available' ? ' mg-v2-step-form__input--success' : ''}`}
          value={formData?.domain || ''}
          onChange={onChange}
          placeholder={t('public.onboarding.domainPlaceholder', '영문 소문자, 숫자, 하이픈(-)')}
          required
          aria-required="true"
          aria-invalid={!!errors?.domain}
          aria-describedby="domain-help"
          autoComplete="off"
        />
        <span className="mg-v2-step-form__domain-suffix" aria-hidden="true">.mindgarden.co.kr</span>
        <button
          type="button"
          className="mg-v2-step-form__check-btn"
          onClick={onDomainCheck}
          aria-label={t('public.onboarding.domainCheckLabel', '도메인 중복 확인')}
        >
          {t('public.onboarding.domainCheck', '중복확인')}
        </button>
      </div>
      <span id="domain-help" className="mg-v2-step-form__helper">
        {t('public.onboarding.domainHelp', '영문 소문자와 숫자, 하이픈(-)만 가능')}
      </span>
      {errors?.domain && (
        <span className="mg-v2-step-form__error" role="alert">{errors.domain}</span>
      )}
      {domainStatus === 'available' && (
        <span className="mg-v2-step-form__success" role="status">
          {t('public.onboarding.domainAvailable', '사용 가능한 도메인입니다.')}
        </span>
      )}
    </div>

    <div className="mg-v2-step-form__field">
      <label className="mg-v2-step-form__label" htmlFor="phone">
        {t('public.onboarding.phone', '대표 연락처')}
        <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        className={`mg-v2-step-form__input${errors?.phone ? ' mg-v2-step-form__input--error' : ''}`}
        value={formData?.phone || ''}
        onChange={onChange}
        placeholder={t('public.onboarding.phonePlaceholder', '숫자만 입력')}
        required
        aria-required="true"
        aria-invalid={!!errors?.phone}
        aria-describedby={errors?.phone ? 'phone-error' : undefined}
        autoComplete="tel"
      />
      {errors?.phone && (
        <span id="phone-error" className="mg-v2-step-form__error" role="alert">{errors.phone}</span>
      )}
    </div>

    <div className="mg-v2-step-form__field">
      <label className="mg-v2-step-form__label" htmlFor="email">
        {t('public.onboarding.email', '대표 이메일')}
        <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
      </label>
      <input
        id="email"
        name="email"
        type="email"
        className={`mg-v2-step-form__input${errors?.email ? ' mg-v2-step-form__input--error' : ''}`}
        value={formData?.email || ''}
        onChange={onChange}
        placeholder={t('public.onboarding.emailPlaceholder', '예: hello@example.com')}
        required
        aria-required="true"
        aria-invalid={!!errors?.email}
        aria-describedby={errors?.email ? 'email-error' : undefined}
        autoComplete="email"
      />
      {errors?.email && (
        <span id="email-error" className="mg-v2-step-form__error" role="alert">{errors.email}</span>
      )}
    </div>
  </>
);

const StepBusinessInfo = ({ formData, onChange, errors, t }) => {
  const toggleCategory = useCallback((value) => {
    const current = formData?.categories || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ target: { name: 'categories', value: next } });
  }, [formData?.categories, onChange]);

  return (
    <>
      <div className="mg-v2-step-form__field">
        <label className="mg-v2-step-form__label" htmlFor="businessType">
          {t('public.onboarding.businessType', '업종')}
        </label>
        <select
          id="businessType"
          name="businessType"
          className="mg-v2-step-form__select"
          value={formData?.businessType || ''}
          onChange={onChange}
          aria-invalid={!!errors?.businessType}
        >
          {BUSINESS_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {t(bt.labelKey, bt.fallback)}
            </option>
          ))}
        </select>
        {errors?.businessType && (
          <span className="mg-v2-step-form__error" role="alert">{errors.businessType}</span>
        )}
      </div>

      <div className="mg-v2-step-form__field">
        <span className="mg-v2-step-form__label">
          {t('public.onboarding.categories', '세부 카테고리')}
        </span>
        <div className="mg-v2-step-form__chips" role="group" aria-label={t('public.onboarding.categoriesLabel', '세부 카테고리 선택')}>
          {CATEGORY_OPTIONS.map((cat) => {
            const selected = (formData?.categories || []).includes(cat.value);
            return (
              <button
                key={cat.value}
                type="button"
                className={`mg-v2-step-form__chip${selected ? ' mg-v2-step-form__chip--selected' : ''}`}
                onClick={() => toggleCategory(cat.value)}
                aria-pressed={selected}
              >
                {t(cat.labelKey, cat.fallback)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mg-v2-step-form__field">
        <span className="mg-v2-step-form__label">
          {t('public.onboarding.staffSize', '상담사 수 규모')}
        </span>
        <div className="mg-v2-step-form__chips" role="radiogroup" aria-label={t('public.onboarding.staffSizeLabel', '상담사 수 선택')}>
          {STAFF_SIZE_OPTIONS.map((opt) => {
            const selected = formData?.staffSize === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                className={`mg-v2-step-form__chip${selected ? ' mg-v2-step-form__chip--selected' : ''}`}
                onClick={() => onChange({ target: { name: 'staffSize', value: opt.value } })}
                aria-checked={selected}
              >
                {t(opt.labelKey, opt.fallback)}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const StepPricing = ({ formData, onChange, errors, t }) => (
  <>
    <div className="mg-v2-step-form__field">
      <span className="mg-v2-step-form__label">
        {t('public.onboarding.selectPlan', '요금제 선택')}
      </span>
      <div className="mg-v2-step-form__plans" role="radiogroup" aria-label={t('public.onboarding.planSelectionLabel', '요금제 선택')}>
        {PLAN_OPTIONS.map((plan) => {
          const selected = formData?.plan === plan.value;
          return (
            <div
              key={plan.value}
              className={`mg-v2-step-form__plan-card${selected ? ' mg-v2-step-form__plan-card--selected' : ''}`}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onClick={() => onChange({ target: { name: 'plan', value: plan.value } })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange({ target: { name: 'plan', value: plan.value } }); } }}
            >
              {plan.recommended && (
                <span className="mg-v2-step-form__plan-badge">
                  {t('public.onboarding.recommended', '추천')}
                </span>
              )}
              <h4 className="mg-v2-step-form__plan-name">{t(plan.nameKey, plan.nameFallback)}</h4>
              <p className="mg-v2-step-form__plan-price">{plan.price} / {t('public.onboarding.perMonth', '월')}</p>
              <p className="mg-v2-step-form__plan-desc">{t(plan.descKey, plan.descFallback)}</p>
            </div>
          );
        })}
      </div>
      {errors?.plan && (
        <span className="mg-v2-step-form__error" role="alert">{errors.plan}</span>
      )}
    </div>

    <div className="mg-v2-step-form__field">
      <span className="mg-v2-step-form__label">
        {t('public.onboarding.paymentMethod', '결제 수단')}
      </span>
      <div className="mg-v2-step-form__payment-methods" role="radiogroup" aria-label={t('public.onboarding.paymentMethodLabel', '결제 수단 선택')}>
        {PAYMENT_METHODS.map((pm) => {
          const selected = formData?.paymentMethod === pm.value;
          return (
            <button
              key={pm.value}
              type="button"
              role="radio"
              className={`mg-v2-step-form__payment-method${selected ? ' mg-v2-step-form__payment-method--selected' : ''}`}
              onClick={() => onChange({ target: { name: 'paymentMethod', value: pm.value } })}
              aria-checked={selected}
            >
              {t(pm.labelKey, pm.fallback)}
            </button>
          );
        })}
      </div>
    </div>
  </>
);

const StepTerms = ({ formData, onChange, t }) => {
  const allChecked = TERM_ITEMS.every((item) => formData?.[item.key]);

  const handleToggleAll = useCallback(() => {
    const newVal = !allChecked;
    TERM_ITEMS.forEach((item) => {
      onChange({ target: { name: item.key, value: newVal, type: 'checkbox', checked: newVal } });
    });
  }, [allChecked, onChange]);

  return (
    <div className="mg-v2-step-form__terms">
      <div className="mg-v2-step-form__term-all">
        <input
          type="checkbox"
          id="agreeAll"
          className="mg-v2-step-form__checkbox"
          checked={allChecked}
          onChange={handleToggleAll}
          aria-label={t('public.onboarding.agreeAll', '전체 동의')}
        />
        <label htmlFor="agreeAll" className="mg-v2-step-form__term-all-label">
          {t('public.onboarding.agreeAll', '전체 동의')}
        </label>
      </div>

      {TERM_ITEMS.map((item) => (
        <div key={item.key} className="mg-v2-step-form__term-item">
          <div className="mg-v2-step-form__term-left">
            <input
              type="checkbox"
              id={item.key}
              name={item.key}
              className="mg-v2-step-form__checkbox"
              checked={!!formData?.[item.key]}
              onChange={onChange}
              aria-required={item.required}
            />
            <span className={`mg-v2-step-form__term-badge mg-v2-step-form__term-badge--${item.required ? 'required' : 'optional'}`}>
              {item.required
                ? t('public.onboarding.required', '필수')
                : t('public.onboarding.optional', '선택')}
            </span>
            <label htmlFor={item.key} className="mg-v2-step-form__term-label">
              {t(item.labelKey, item.fallback)}
            </label>
          </div>
          {item.required && (
            <a href={`#${item.key}-detail`} className="mg-v2-step-form__term-link" tabIndex={0}>
              {t('public.onboarding.viewDetail', '내용 보기')}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};

const StepAdminAccount = ({ formData, onChange, errors, onDomainCheck, t }) => {
  const strength = useMemo(() => getPasswordStrength(formData?.password || ''), [formData?.password]);
  const strengthMeta = STRENGTH_META[strength];

  return (
    <>
      <div className="mg-v2-step-form__field">
        <label className="mg-v2-step-form__label" htmlFor="adminName">
          {t('public.onboarding.adminName', '관리자 이름')}
          <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
        </label>
        <input
          id="adminName"
          name="adminName"
          type="text"
          className={`mg-v2-step-form__input${errors?.adminName ? ' mg-v2-step-form__input--error' : ''}`}
          value={formData?.adminName || ''}
          onChange={onChange}
          required
          aria-required="true"
          aria-invalid={!!errors?.adminName}
          autoComplete="name"
        />
        {errors?.adminName && (
          <span className="mg-v2-step-form__error" role="alert">{errors.adminName}</span>
        )}
      </div>

      <div className="mg-v2-step-form__field">
        <label className="mg-v2-step-form__label" htmlFor="adminEmail">
          {t('public.onboarding.adminEmail', '로그인 이메일 (ID)')}
          <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
        </label>
        <div className="mg-v2-step-form__domain-row">
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            className={`mg-v2-step-form__input${errors?.adminEmail ? ' mg-v2-step-form__input--error' : ''}`}
            value={formData?.adminEmail || ''}
            onChange={onChange}
            required
            aria-required="true"
            aria-invalid={!!errors?.adminEmail}
            autoComplete="email"
          />
          <button
            type="button"
            className="mg-v2-step-form__check-btn"
            onClick={onDomainCheck}
            aria-label={t('public.onboarding.emailCheckLabel', '이메일 중복 확인')}
          >
            {t('public.onboarding.duplicateCheck', '중복확인')}
          </button>
        </div>
        {errors?.adminEmail && (
          <span className="mg-v2-step-form__error" role="alert">{errors.adminEmail}</span>
        )}
      </div>

      <div className="mg-v2-step-form__field">
        <label className="mg-v2-step-form__label" htmlFor="password">
          {t('public.onboarding.password', '비밀번호')}
          <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className={`mg-v2-step-form__input${errors?.password ? ' mg-v2-step-form__input--error' : ''}`}
          value={formData?.password || ''}
          onChange={onChange}
          required
          aria-required="true"
          aria-invalid={!!errors?.password}
          aria-describedby="password-strength"
          autoComplete="new-password"
        />
        {formData?.password && (
          <div className="mg-v2-step-form__password-strength" id="password-strength" aria-live="polite">
            <div className="mg-v2-step-form__strength-bars" aria-hidden="true">
              {Array.from({ length: TOTAL_STRENGTH_BARS }, (_, i) => (
                <div
                  key={i}
                  className={`mg-v2-step-form__strength-bar${i < strength ? ` mg-v2-step-form__strength-bar--${strengthMeta.className}` : ''}`}
                />
              ))}
            </div>
            <span className={`mg-v2-step-form__strength-text mg-v2-step-form__strength-text--${strengthMeta.className}`}>
              {t(strengthMeta.labelKey, strengthMeta.fallback)}
            </span>
          </div>
        )}
        {errors?.password && (
          <span className="mg-v2-step-form__error" role="alert">{errors.password}</span>
        )}
      </div>

      <div className="mg-v2-step-form__field">
        <label className="mg-v2-step-form__label" htmlFor="passwordConfirm">
          {t('public.onboarding.passwordConfirm', '비밀번호 확인')}
          <span className="mg-v2-step-form__required" aria-hidden="true">*</span>
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          className={`mg-v2-step-form__input${errors?.passwordConfirm ? ' mg-v2-step-form__input--error' : ''}`}
          value={formData?.passwordConfirm || ''}
          onChange={onChange}
          required
          aria-required="true"
          aria-invalid={!!errors?.passwordConfirm}
          autoComplete="new-password"
        />
        {errors?.passwordConfirm && (
          <span className="mg-v2-step-form__error" role="alert">{errors.passwordConfirm}</span>
        )}
      </div>
    </>
  );
};

const StepComplete = ({ t }) => (
  <div className="mg-v2-step-form__complete" role="status" aria-live="polite">
    <svg
      className="mg-v2-step-form__complete-icon"
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
    <h2 className="mg-v2-step-form__complete-title">
      {t('public.onboarding.completeTitle', '신청이 완료되었습니다')}
    </h2>
    <p className="mg-v2-step-form__complete-message">
      {t('public.onboarding.completeMessage', '내부 검토를 거쳐 1~2 영업일 내에 승인될 예정입니다. 승인이 완료되면 입력하신 관리자 이메일로 안내해 드립니다.')}
    </p>
  </div>
);

/* ============================================================
   Main Component
   ============================================================ */
const OnboardingStepForm = ({
  currentStep = 0,
  formData = {},
  onChange,
  onValidate,
  errors = {},
  onDomainCheck,
  domainStatus,
}) => {
  const { t } = useTranslation('common');
  const stepMeta = STEP_TITLES[currentStep] || STEP_TITLES[0];

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepBasicInfo formData={formData} onChange={onChange} errors={errors} onDomainCheck={onDomainCheck} domainStatus={domainStatus} t={t} />;
      case 1:
        return <StepBusinessInfo formData={formData} onChange={onChange} errors={errors} t={t} />;
      case 2:
        return <StepPricing formData={formData} onChange={onChange} errors={errors} t={t} />;
      case 3:
        return <StepTerms formData={formData} onChange={onChange} t={t} />;
      case 4:
        return <StepAdminAccount formData={formData} onChange={onChange} errors={errors} onDomainCheck={onDomainCheck} t={t} />;
      case 5:
        return <StepComplete t={t} />;
      default:
        return null;
    }
  };

  return (
    <section
      className="mg-v2-step-form"
      aria-label={t('public.onboarding.stepFormLabel', '온보딩 입력 양식')}
      data-step={currentStep}
    >
      {currentStep < 5 && (
        <header className="mg-v2-step-form__header">
          <h2 className="mg-v2-step-form__title">
            {t(stepMeta.titleKey, stepMeta.titleFallback)}
          </h2>
          {stepMeta.subtitleFallback && (
            <p className="mg-v2-step-form__subtitle">
              {t(stepMeta.subtitleKey, stepMeta.subtitleFallback)}
            </p>
          )}
        </header>
      )}
      {renderStep()}
    </section>
  );
};

OnboardingStepForm.propTypes = {
  currentStep: PropTypes.number,
  formData: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onValidate: PropTypes.func,
  errors: PropTypes.object,
  onDomainCheck: PropTypes.func,
  domainStatus: PropTypes.oneOf(['idle', 'checking', 'available', 'taken']),
};

export default OnboardingStepForm;
