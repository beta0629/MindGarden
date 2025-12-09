/**
 * 순차적 진행 이메일 입력 컴포넌트
 * 도메인 자동완성 및 이메일 검증 컴포넌트를 조합하여 사용
 */

import { useState, useEffect } from "react";
import { COMPONENT_CSS } from "../../constants/css-variables";
import EmailDomainAutocomplete from "./EmailDomainAutocomplete";
import EmailVerification from "./EmailVerification";

// 도메인 목록 (EmailDomainAutocomplete와 동일하게 유지)
const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'naver.com',
  'daum.net',
  'kakao.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'hanmail.net',
  'nate.com',
  'icloud.com',
  'live.co.kr',
];

interface EmailInputProgressiveProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  validateEmailFormat: (email: string) => { valid: boolean; error?: string };
  placeholder?: string;
  // 이메일 검증 관련 props
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
  onCheckDuplicate: () => void;
  onResetDuplicate: () => void;
  onSendVerificationCode: (email: string) => void;
  onVerifyCode: (email: string, code: string) => void;
  setEmailVerificationCode: (code: string) => void;
  setEmailFormatError: (error: string | null) => void;
}

export default function EmailInputProgressive({
  value,
  onChange,
  onValidationChange,
  validateEmailFormat,
  placeholder = 'example@email.com',
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
  onCheckDuplicate,
  onResetDuplicate,
  onSendVerificationCode,
  onVerifyCode,
  setEmailVerificationCode,
  setEmailFormatError,
}: EmailInputProgressiveProps) {
  const [emailLocal, setEmailLocal] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [emailCustomDomain, setEmailCustomDomain] = useState('');

  // 초기값 분리
  useEffect(() => {
    if (value && value.includes('@')) {
      const [local, domain] = value.split('@');
      setEmailLocal(local || '');
      setEmailDomain(domain || '');
    } else {
      setEmailLocal(value || '');
      setEmailDomain('');
    }
  }, [value]);

  // 전체 이메일 조합
  const fullEmail = emailDomain === '@직접입력'
    ? (emailLocal && emailCustomDomain ? `${emailLocal}${emailCustomDomain}` : emailLocal)
    : (emailLocal && emailDomain ? `${emailLocal}@${emailDomain}` : value);

  // 입력 변경 처리 (EmailDomainAutocomplete가 전체 이메일을 반환)
  const handleEmailChange = (fullEmail: string) => {
    // 전체 이메일을 받아서 파싱
    if (fullEmail.includes('@')) {
      const [local, domain] = fullEmail.split('@');
      setEmailLocal(local || '');
      setEmailDomain(domain || '');
    } else {
      setEmailLocal(fullEmail);
      setEmailDomain('');
    }
    
    onChange(fullEmail);
    
    // 이메일 형식 검증
    if (fullEmail && fullEmail.includes('@')) {
      const validation = validateEmailFormat(fullEmail);
      if (!validation.valid) {
        setEmailFormatError(validation.error || null);
      } else {
        setEmailFormatError(null);
      }
      
      if (onValidationChange) {
        onValidationChange(validation.valid && emailDuplicateChecked && emailVerified);
      }
    }
  };

  // 로컬 파트 변경 처리
  const handleLocalChange = (local: string) => {
    setEmailLocal(local);
    const full = local && emailDomain ? `${local}@${emailDomain}` : local;
    handleEmailChange(full);
  };

  // 도메인 변경 처리 (EmailDomainAutocomplete의 onDomainChange)
  const handleDomainChange = (domain: string) => {
    setEmailDomain(domain);
    let full = '';
    if (domain === '@직접입력') {
      full = emailLocal && emailCustomDomain ? `${emailLocal}${emailCustomDomain}` : emailLocal;
    } else {
      full = emailLocal ? `${emailLocal}@${domain}` : (domain ? `@${domain}` : '');
    }
    handleEmailChange(full);
  };

  // 커스텀 도메인 변경 처리
  const handleCustomDomainChange = (customDomain: string) => {
    setEmailCustomDomain(customDomain);
    const full = emailLocal ? `${emailLocal}${customDomain}` : customDomain;
    handleEmailChange(full);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 도메인 자동완성 입력 필드 */}
      <EmailDomainAutocomplete
        emailLocal={emailLocal}
        emailDomain={emailDomain}
        emailCustomDomain={emailCustomDomain}
        onLocalChange={handleLocalChange}
        onDomainChange={handleDomainChange}
        onCustomDomainChange={handleCustomDomainChange}
        className={COMPONENT_CSS.ONBOARDING.INPUT}
        placeholder={placeholder}
      />
      
      {/* 이메일 형식 오류 */}
      {emailFormatError && (
        <div className={COMPONENT_CSS.ONBOARDING.ERROR_BOX} style={{ marginTop: '8px' }}>
          <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>
            ⚠️ {emailFormatError}
          </small>
        </div>
      )}
      
      {/* 이메일 검증 컴포넌트 */}
      <EmailVerification
        email={fullEmail}
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
        onCheckDuplicate={onCheckDuplicate}
        onResetDuplicate={onResetDuplicate}
        onSendVerificationCode={onSendVerificationCode}
        onVerifyCode={onVerifyCode}
        setEmailVerificationCode={setEmailVerificationCode}
      />
    </div>
  );
}

