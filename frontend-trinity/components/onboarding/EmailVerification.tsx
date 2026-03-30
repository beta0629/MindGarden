/**
 * 이메일 검증 컴포넌트
 * 중복 확인 및 인증 코드 검증 기능
 * 재사용 가능한 독립 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";
import Button from "../Button";

interface EmailVerificationProps {
  email: string;
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
  className?: string;
}

export default function EmailVerification({
  email,
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
  className = '',
}: EmailVerificationProps) {
  // 이메일이 유효하지 않으면 아무것도 표시하지 않음
  if (!email || !email.includes('@') || emailFormatError) {
    return null;
  }

  return (
    <div className={`trinity-onboarding__email-actions ${className}`} style={{ marginTop: '12px' }}>
      {/* 이메일 중복 확인 - 기존 로직 유지 */}
      {!emailDuplicateChecked ? (
        <Button
          type="button"
          onClick={onCheckDuplicate}
          disabled={emailDuplicateChecking || !email || !email.includes('@') || !!emailFormatError}
          variant="outline"
          size="small"
          loading={emailDuplicateChecking}
          loadingText="확인 중..."
        >
          이메일 중복 확인
        </Button>
      ) : (
        <div className={COMPONENT_CSS.ONBOARDING.FLEX_ROW} style={{ marginBottom: '8px' }}>
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
      
      {/* 중복 확인 오류 - 진행 중인 신청 안내 */}
      {emailDuplicateError && (
        <div className={`${COMPONENT_CSS.ONBOARDING.ERROR_BOX} trinity-onboarding__email-error-box`} style={{ marginTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT} style={{ fontWeight: '500' }}>
              ⚠️ {emailDuplicateError}
            </small>
            <small style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              이미 진행 중인 온보딩 신청이 있습니다. 신청 상태를 확인하시려면{' '}
              <a 
                href={`/onboarding/status?email=${encodeURIComponent(email)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--color-primary)', 
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                상태 확인 페이지
              </a>
              에서 조회하실 수 있습니다.
            </small>
          </div>
        </div>
      )}
      
      {/* 이메일 인증 코드 발송 및 검증 - 중복 확인 완료 후 표시 */}
      {emailDuplicateChecked && !emailVerified && (
        <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_SECTION} style={{ marginTop: '12px' }}>
          <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_BUTTON_WRAPPER}>
            <Button
              type="button"
              onClick={() => onSendVerificationCode(email)}
              disabled={emailVerificationSending || !email || !email.includes('@') || !!emailFormatError || resendCooldown > 0}
              variant="outline"
              size="small"
              loading={emailVerificationSending}
              loadingText="발송 중..."
            >
              {resendCooldown > 0 
                ? `재발송 (${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')})` 
                : '인증 코드 발송'}
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
            <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_WRAPPER} style={{ marginTop: '8px' }}>
              <input
                type="text"
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                className={`${COMPONENT_CSS.ONBOARDING.INPUT} ${COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_INPUT}`}
                placeholder="인증 코드 (6자리)"
                maxLength={6}
              />
              <Button
                type="button"
                onClick={() => onVerifyCode(email, emailVerificationCode)}
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
      
      {/* 인증 완료 메시지 */}
      {emailVerified && (
        <div className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT} style={{ marginTop: '8px' }}>
          ✓ 이메일 인증이 완료되었습니다.
        </div>
      )}
    </div>
  );
}

