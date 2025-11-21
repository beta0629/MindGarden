/**
 * Step 1: 기본 정보 입력 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import EmailInput from "./EmailInput";
import type { OnboardingFormData } from "../../hooks/useOnboarding";

interface Step1BasicInfoProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData | ((prev: OnboardingFormData) => OnboardingFormData)) => void;
  emailFormatError: string | null;
  emailDuplicateChecked: boolean;
  emailDuplicateChecking: boolean;
  emailDuplicateError: string | null;
  emailVerified: boolean;
  emailVerificationCode: string;
  emailVerificationSending: boolean;
  emailVerificationVerifying: boolean;
  emailVerificationTimeLeft: number | null;
  resendCooldown: number;
  setEmailVerified: (verified: boolean) => void;
  setEmailVerificationCode: (code: string) => void;
  setEmailDuplicateChecked: (checked: boolean) => void;
  setEmailDuplicateError: (error: string | null) => void;
  setEmailVerificationTimeLeft: (time: number | null) => void;
  setVerificationAttempts: (attempts: number) => void;
  sendEmailVerificationCode: (email: string) => void;
  verifyEmailCode: (email: string, code: string) => void;
  validateEmailFormat: (email: string) => { valid: boolean; error?: string };
  checkEmailDuplicate: (email: string) => Promise<{ isDuplicate: boolean }>;
  setError: (error: string | null) => void;
  setEmailFormatError: (error: string | null) => void;
}

export default function Step1BasicInfo({
  formData,
  setFormData,
  emailFormatError,
  emailDuplicateChecked,
  emailDuplicateChecking,
  emailDuplicateError,
  emailVerified,
  emailVerificationCode,
  emailVerificationSending,
  emailVerificationVerifying,
  emailVerificationTimeLeft,
  resendCooldown,
  setEmailVerified,
  setEmailVerificationCode,
  setEmailDuplicateChecked,
  setEmailDuplicateError,
  setEmailVerificationTimeLeft,
  setVerificationAttempts,
  sendEmailVerificationCode,
  verifyEmailCode,
  validateEmailFormat,
  checkEmailDuplicate,
  setError,
  setEmailFormatError,
}: Step1BasicInfoProps) {
  const handleEmailLocalChange = (local: string, fullEmail: string) => {
    // 이메일 형식 검증
    if (fullEmail && fullEmail.includes('@')) {
      const validation = validateEmailFormat(fullEmail);
      if (!validation.valid) {
        // setEmailFormatError는 부모에서 처리
      }
    }
    
    // 이메일이 변경되면 인증 상태 및 중복 확인 상태 초기화
    if (fullEmail !== formData.contactEmail) {
      setEmailVerified(false);
      setEmailVerificationCode("");
      setEmailDuplicateChecked(false);
      setEmailDuplicateError(null);
      setEmailVerificationTimeLeft(null);
      setVerificationAttempts(0);
    }
    
    setFormData({
      ...formData,
      contactEmailLocal: local,
      contactEmail: fullEmail,
    });
  };

  const handleEmailDomainChange = (domain: string, fullEmail: string) => {
    // 이메일이 변경되면 인증 상태 및 중복 확인 상태 초기화
    if (fullEmail !== formData.contactEmail) {
      setEmailVerified(false);
      setEmailVerificationCode("");
      setEmailDuplicateChecked(false);
      setEmailDuplicateError(null);
      setEmailVerificationTimeLeft(null);
    }
    
    setFormData({
      ...formData,
      contactEmailDomain: domain,
      contactEmail: fullEmail,
    });
  };

  const handleEmailCustomDomainChange = (customDomain: string, fullEmail: string) => {
    // 이메일 형식 검증
    if (fullEmail && fullEmail.includes('@')) {
      const validation = validateEmailFormat(fullEmail);
      if (!validation.valid) {
        // setEmailFormatError는 부모에서 처리
      }
    }
    
    // 이메일이 변경되면 인증 상태 및 중복 확인 상태 초기화
    if (fullEmail !== formData.contactEmail) {
      setEmailVerified(false);
      setEmailVerificationCode("");
      setEmailDuplicateChecked(false);
      setEmailDuplicateError(null);
      setEmailVerificationTimeLeft(null);
      setVerificationAttempts(0);
    }
    
    setFormData({
      ...formData,
      contactEmailCustomDomain: customDomain,
      contactEmail: fullEmail,
    });
  };

  const handleCheckDuplicate = async () => {
    // 이메일 형식 최종 검증
    const validation = validateEmailFormat(formData.contactEmail);
    if (!validation.valid) {
      setError(validation.error || TRINITY_CONSTANTS.MESSAGES.ERROR_EMAIL_INVALID);
      return;
    }
    
    try {
      setEmailDuplicateError(null);
      setError(null);
      const result = await checkEmailDuplicate(formData.contactEmail);
      if (result.isDuplicate) {
        // 백엔드에서 반환한 메시지 사용 (예: "승인 대기 중입니다.")
        const errorMessage = (result as { message?: string }).message || "이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.";
        setEmailDuplicateError(errorMessage);
        setEmailDuplicateChecked(false);
      } else {
        setEmailDuplicateChecked(true);
        setEmailDuplicateError(null);
      }
    } catch (err) {
      setEmailDuplicateError(err instanceof Error ? err.message : "이메일 중복 확인에 실패했습니다.");
      setEmailDuplicateChecked(false);
    }
  };

  const handleResetDuplicate = () => {
    setEmailDuplicateChecked(false);
    setEmailVerified(false);
    setEmailVerificationCode("");
    setEmailVerificationTimeLeft(null);
    setVerificationAttempts(0);
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__step-title">기본 정보 입력</h3>
      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <label className={COMPONENT_CSS.ONBOARDING.LABEL}>회사명 *</label>
        <input
          type="text"
          required
          value={formData.tenantName}
          onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
          className={COMPONENT_CSS.ONBOARDING.INPUT}
          placeholder={TRINITY_CONSTANTS.MESSAGES.PLACEHOLDER_COMPANY_NAME}
        />
      </div>
      <EmailInput
        emailLocal={formData.contactEmailLocal}
        emailDomain={formData.contactEmailDomain}
        emailCustomDomain={formData.contactEmailCustomDomain}
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
        onEmailLocalChange={handleEmailLocalChange}
        onEmailDomainChange={handleEmailDomainChange}
        onEmailCustomDomainChange={handleEmailCustomDomainChange}
        onCheckDuplicate={handleCheckDuplicate}
        onResetDuplicate={handleResetDuplicate}
        onSendVerificationCode={sendEmailVerificationCode}
        onVerifyCode={verifyEmailCode}
        setEmailVerificationCode={setEmailVerificationCode}
        validateEmailFormat={validateEmailFormat}
        setEmailFormatError={setEmailFormatError}
      />
      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <label className={COMPONENT_CSS.ONBOARDING.LABEL}>연락처</label>
        <input
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          className={COMPONENT_CSS.ONBOARDING.INPUT}
          placeholder={TRINITY_CONSTANTS.MESSAGES.PLACEHOLDER_PHONE}
        />
      </div>
      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <label className={COMPONENT_CSS.ONBOARDING.LABEL}>관리자 비밀번호 *</label>
        <input
          type="password"
          required
          value={formData.adminPassword}
          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
          className={COMPONENT_CSS.ONBOARDING.INPUT}
          placeholder="관리자 계정 비밀번호를 입력하세요"
          minLength={8}
        />
        <small className="trinity-onboarding__hint">
          최소 8자 이상의 비밀번호를 입력해주세요. 테넌트 승인 시 관리자 계정 생성에 사용됩니다.
        </small>
      </div>
      <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
        <label className={COMPONENT_CSS.ONBOARDING.LABEL}>관리자 비밀번호 확인 *</label>
        <input
          type="password"
          required
          value={formData.adminPasswordConfirm}
          onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
          className={COMPONENT_CSS.ONBOARDING.INPUT}
          placeholder="비밀번호를 다시 입력하세요"
          minLength={8}
        />
        {formData.adminPassword && formData.adminPasswordConfirm && 
         formData.adminPassword !== formData.adminPasswordConfirm && (
          <small className="trinity-onboarding__error">
            비밀번호가 일치하지 않습니다.
          </small>
        )}
      </div>
    </div>
  );
}

