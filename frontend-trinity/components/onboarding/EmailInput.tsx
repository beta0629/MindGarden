/**
 * 이메일 입력 컴포넌트
 * 이메일 로컬 파트, 도메인 선택, 직접 입력 도메인을 포함
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../constants/trinity";
import Button from "../Button";

interface EmailInputProps {
  emailLocal: string;
  emailDomain: string;
  emailCustomDomain: string;
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
  onEmailLocalChange: (local: string, fullEmail: string) => void;
  onEmailDomainChange: (domain: string, fullEmail: string) => void;
  onEmailCustomDomainChange: (customDomain: string, fullEmail: string) => void;
  onCheckDuplicate: () => void;
  onResetDuplicate: () => void;
  onSendVerificationCode: (email: string) => void;
  onVerifyCode: (email: string, code: string) => void;
  setEmailVerificationCode: (code: string) => void;
  validateEmailFormat: (email: string) => { valid: boolean; error?: string };
  setEmailFormatError: (error: string | null) => void;
}

export default function EmailInput({
  emailLocal,
  emailDomain,
  emailCustomDomain,
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
  onEmailLocalChange,
  onEmailDomainChange,
  onEmailCustomDomainChange,
  onCheckDuplicate,
  onResetDuplicate,
  onSendVerificationCode,
  onVerifyCode,
  setEmailVerificationCode,
  validateEmailFormat,
  setEmailFormatError,
}: EmailInputProps) {
  const fullEmail = emailDomain === '@직접입력' 
    ? (emailCustomDomain ? `${emailLocal}${emailCustomDomain}` : emailLocal)
    : (emailDomain ? `${emailLocal}${emailDomain}` : emailLocal);

  return (
    <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
      <label className={COMPONENT_CSS.ONBOARDING.LABEL}>이메일 *</label>
      <div className={COMPONENT_CSS.ONBOARDING.EMAIL_INPUT_WRAPPER}>
        <input
          type="text"
          required
          value={emailLocal}
          onChange={(e) => {
            const local = e.target.value;
            let domain = '';
            if (emailDomain === '@직접입력') {
              domain = emailCustomDomain || '';
            } else {
              domain = emailDomain || '';
            }
            const newEmail = domain ? `${local}${domain}` : local;
            
            // 이메일 형식 검증
            if (newEmail && newEmail.includes('@')) {
              const validation = validateEmailFormat(newEmail);
              if (!validation.valid) {
                setEmailFormatError(validation.error || null);
              } else {
                setEmailFormatError(null);
              }
            } else {
              setEmailFormatError(null);
            }
            
            onEmailLocalChange(local, newEmail);
          }}
          className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-onboarding__email-input-local`}
          placeholder={TRINITY_CONSTANTS.MESSAGES.PLACEHOLDER_EMAIL_LOCAL}
        />
        <span className={COMPONENT_CSS.ONBOARDING.EMAIL_SEPARATOR}>@</span>
        <select
          value={emailDomain}
          onChange={(e) => {
            const domain = e.target.value;
            const local = emailLocal;
            let newEmail = '';
            if (domain === '@직접입력') {
              const customDomain = emailCustomDomain || '';
              newEmail = customDomain ? `${local}${customDomain}` : local;
            } else {
              newEmail = domain ? `${local}${domain}` : local;
            }
            onEmailDomainChange(domain, newEmail);
          }}
          className={`${COMPONENT_CSS.ONBOARDING.INPUT} ${COMPONENT_CSS.ONBOARDING.EMAIL_DOMAIN_SELECT}`}
          required
        >
          <option value="">도메인 선택</option>
          {TRINITY_CONSTANTS.EMAIL_DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>
      {emailDomain === '@직접입력' && (
        <div className={COMPONENT_CSS.ONBOARDING.CUSTOM_DOMAIN_WRAPPER}>
          <input
            type="text"
            value={emailCustomDomain}
            onChange={(e) => {
              let customDomain = e.target.value.trim();
              if (customDomain && !customDomain.startsWith('@')) {
                customDomain = `@${customDomain}`;
              }
              const newEmail = emailLocal ? `${emailLocal}${customDomain}` : customDomain;
              
              // 이메일 형식 검증
              if (newEmail && newEmail.includes('@')) {
                const validation = validateEmailFormat(newEmail);
                if (!validation.valid) {
                  setEmailFormatError(validation.error || null);
                } else {
                  setEmailFormatError(null);
                }
              } else {
                setEmailFormatError(null);
              }
              
              onEmailCustomDomainChange(customDomain, newEmail);
            }}
            className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-onboarding__custom-domain-input`}
            placeholder="@example.com"
          />
          <small className={COMPONENT_CSS.ONBOARDING.CUSTOM_DOMAIN_HINT}>
            도메인을 입력해주세요 (예: @example.com)
          </small>
        </div>
      )}
      {emailFormatError && (
        <div className={COMPONENT_CSS.ONBOARDING.ERROR_BOX}>
          <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>
            ⚠️ {emailFormatError}
          </small>
        </div>
      )}
      {fullEmail && fullEmail.includes('@') && !emailFormatError && (
        <div className="trinity-onboarding__email-actions">
          {!emailDuplicateChecked ? (
            <Button
              type="button"
              onClick={onCheckDuplicate}
              disabled={emailDuplicateChecking || !fullEmail || !fullEmail.includes('@') || !!emailFormatError}
              variant="outline"
              size="small"
              loading={emailDuplicateChecking}
              loadingText="확인 중..."
            >
              이메일 중복 확인
            </Button>
          ) : (
            <div className={COMPONENT_CSS.ONBOARDING.FLEX_ROW}>
              <span className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>
                ✓ 사용 가능한 이메일입니다.
              </span>
              <Button
                type="button"
                onClick={onResetDuplicate}
                variant="outline"
                size="small"
              >
                다시 확인
              </Button>
            </div>
          )}
          {emailDuplicateError && (
            <div className={`${COMPONENT_CSS.ONBOARDING.ERROR_BOX} trinity-onboarding__email-error-box`}>
              <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>
                ⚠️ {emailDuplicateError}
              </small>
            </div>
          )}
          {emailDuplicateChecked && !emailVerified && (
            <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_SECTION}>
              <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_BUTTON_WRAPPER}>
                <Button
                  type="button"
                  onClick={() => onSendVerificationCode(fullEmail)}
                  disabled={emailVerificationSending || !fullEmail || !fullEmail.includes('@') || !!emailFormatError || resendCooldown > 0}
                  variant="outline"
                  size="small"
                  loading={emailVerificationSending}
                  loadingText="발송 중..."
                >
                  {resendCooldown > 0 ? `재발송 (${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')})` : '인증 코드 발송'}
                </Button>
                {emailVerificationTimeLeft !== null && emailVerificationTimeLeft > 0 && (
                  <div className={`${COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER_WRAPPER} ${emailVerificationTimeLeft <= 60 ? COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER_WARNING : ''}`}>
                    <span className={COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER}>
                      ⏱️ {Math.floor(emailVerificationTimeLeft / 60)}:{String(emailVerificationTimeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
              {emailVerificationTimeLeft !== null && (
                <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_WRAPPER}>
                  <input
                    type="text"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`${COMPONENT_CSS.ONBOARDING.INPUT} ${COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_INPUT}`}
                    placeholder="인증 코드 입력 (6자리)"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    onClick={() => onVerifyCode(fullEmail, emailVerificationCode)}
                    disabled={emailVerificationVerifying || !emailVerificationCode || emailVerificationCode.length !== 6}
                    variant="primary"
                    size="small"
                    loading={emailVerificationVerifying}
                    loadingText="확인 중..."
                  >
                    인증 확인
                  </Button>
                </div>
              )}
            </div>
          )}
          {emailVerified && (
            <div className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>
              ✓ 이메일 인증이 완료되었습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

