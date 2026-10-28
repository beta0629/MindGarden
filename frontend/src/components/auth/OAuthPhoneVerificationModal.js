/**
 * OAuthPhoneVerificationModal — provider-agnostic OAuth 휴대폰 매칭(OTP) 모달 (web).
 *
 * 디자이너 산출 (Phase 2 — `docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md`)
 * D-4 = (ii) 신규 모달, UnifiedModal variant="form" size="small".
 *
 * 14 상태 머신 (idle / sending / cooldown / otp idle / filling / auto-verify /
 *               verifying / error / expired / resend-disabled / resend-enabled /
 *               verified-single / verified-multi / daily-limit / token-expired) 모두 처리.
 *
 * 회피 라인 무수정 — `SocialSignupModal` / `OAuth2Callback` 의 특정 라인은 본 파일에서
 * 침범하지 않는다. 본 모달은 부모 컴포넌트에서 `isOpen` + `socialUser` (provider,
 * phoneVerificationToken, name, email 등) 만 받아 독립 동작한다.
 *
 * 시각:
 * - `var(--mg-*)` 디자인 토큰 + `mg-v2-form-*` + `MGButton` + `UnifiedModal` 만 사용.
 * - 하드코딩 색/간격/radius 0건.
 *
 * 접근성:
 * - aria-live="polite" 카운트다운 (10초 단위 announce).
 * - PII 마스킹 (010-****-5678) — 운영 로그 노출 금지.
 * - Kakao name null 시 prefillBox 이름 행 숨김.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../common/modals/UnifiedModal';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import OtpCodeInput from '../atoms/OtpCodeInput';
import {
  formatPhoneNumber
} from '../../utils/common';
import {
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from '../../utils/koreanMobilePhone';
import {
  OAUTH_OTP_CODE_LENGTH,
  OAUTH_OTP_DEFAULT_EXPIRES_SECONDS,
  OAUTH_OTP_RESEND_COOLDOWN_SECONDS,
  applyOAuthServerExpiresIn,
  applyOAuthServerResendCooldown,
  applyOAuthServerRetryAfter,
  canResendOAuthOtp,
  formatOAuthOtpCountdown,
  resolveMaskedPhoneForDisplay,
  resolveOAuthOtpErrorCopy,
  resolveOAuthProviderDisplayName,
  tickOAuthOtpCountdown,
  validateKoreanMobileInputForOAuth
} from '../../utils/oauthPhoneOtp';
import {
  mapOAuthPhoneSendResponse,
  mapOAuthPhoneVerifyResponse,
  sendOAuthPhoneOtp,
  verifyOAuthPhoneOtp
} from '../../api/auth/oauthPhoneVerificationApi';
import { toDisplayString } from '../../utils/safeDisplay';
import './OAuthPhoneVerificationModal.css';

const STEP_PHONE = 'phone';
const STEP_OTP = 'otp';

const PROVIDER_DATA_KEY_MAP = {
  APPLE: 'apple',
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver'
};

const ARIA_LIVE_ANNOUNCE_INTERVAL_SECONDS = 10;

const isKakaoNullName = (provider, name) =>
  String(provider ?? '').toUpperCase() === 'KAKAO' && !String(name ?? '').trim();

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose 모달 닫기 (사용자 취소 / 백 액션)
 * @param {{
 *   provider: string,
 *   phoneVerificationToken: string,
 *   name?: string,
 *   nickname?: string,
 *   email?: string
 * }} props.socialUser BE 콜백에서 받은 OAuth provider/토큰/식별 정보
 * @param {(payload: {
 *   accessToken: string,
 *   refreshToken?: string,
 *   matchedAccount: { userId: number, tenantId?: string, role?: string },
 *   provider: string
 * }) => void} props.onVerifiedSingle 단일 매칭 성공
 * @param {(payload: {
 *   phoneAccountSelectionToken: string,
 *   provider: string
 * }) => void} props.onRequiresAccountSelection 다중 매칭 → 계정 선택 라우팅
 * @param {(payload: { code: string }) => void} [props.onTokenExpired] 세션 만료
 */
const OAuthPhoneVerificationModal = ({
  isOpen,
  onClose,
  socialUser,
  onVerifiedSingle,
  onRequiresAccountSelection,
  onTokenExpired
}) => {
  const providerKey = useMemo(() => {
    const upper = String(socialUser?.provider ?? '').toUpperCase();
    return PROVIDER_DATA_KEY_MAP[upper] || 'default';
  }, [socialUser?.provider]);

  const providerDisplayName = useMemo(
    () => resolveOAuthProviderDisplayName(socialUser?.provider),
    [socialUser?.provider]
  );

  const hideNameRow = isKakaoNullName(socialUser?.provider, socialUser?.name);

  const [step, setStep] = useState(STEP_PHONE);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);

  const [challengeToken, setChallengeToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [remainingExpiresSeconds, setRemainingExpiresSeconds] = useState(0);
  const [remainingResendSeconds, setRemainingResendSeconds] = useState(0);

  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);

  const lastAnnouncedRef = useRef('');
  const intervalRef = useRef(null);
  const autoVerifiedRef = useRef(false);

  const resetState = useCallback(() => {
    setStep(STEP_PHONE);
    setPhoneInput('');
    setPhoneError('');
    setBusy(false);
    setServerError('');
    setDailyLimitReached(false);
    setTokenExpired(false);
    setChallengeToken('');
    setMaskedPhone('');
    setRemainingExpiresSeconds(0);
    setRemainingResendSeconds(0);
    setOtpInput('');
    setOtpError('');
    setOtpExpired(false);
    autoVerifiedRef.current = false;
    lastAnnouncedRef.current = '';
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    if (step !== STEP_OTP) {
      return undefined;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setRemainingExpiresSeconds((prev) => {
        const { next, expired } = tickOAuthOtpCountdown(prev);
        if (expired) {
          setOtpExpired(true);
        }
        return next;
      });
      setRemainingResendSeconds((prev) => {
        const { next } = tickOAuthOtpCountdown(prev);
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen, step]);

  const handlePhoneInputChange = useCallback(
    (event) => {
      const raw = String(event.target.value ?? '');
      const cleaned = raw.replace(/\D/g, '').slice(0, 11);
      const formatted = formatPhoneNumber(cleaned);
      setPhoneInput(formatted);
      if (phoneError) {
        setPhoneError('');
      }
      if (serverError) {
        setServerError('');
      }
    },
    [phoneError, serverError]
  );

  const startSend = useCallback(async () => {
    if (!socialUser?.phoneVerificationToken) {
      setServerError('인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.');
      setTokenExpired(true);
      return;
    }
    const validationError = validateKoreanMobileInputForOAuth(phoneInput);
    if (validationError) {
      setPhoneError(validationError);
      return;
    }
    const digits = normalizeKoreanMobileDigits(phoneInput);
    if (!isValidKoreanMobileDigits(digits)) {
      setPhoneError('휴대폰 번호를 다시 확인해 주세요.');
      return;
    }
    setBusy(true);
    setServerError('');
    try {
      const raw = await sendOAuthPhoneOtp({
        oauthProvider: socialUser.provider,
        phoneVerificationToken: socialUser.phoneVerificationToken,
        phone: digits
      });
      const mapped = mapOAuthPhoneSendResponse(raw);
      if (mapped.kind === 'sent') {
        setChallengeToken(mapped.challengeToken);
        setMaskedPhone(
          resolveMaskedPhoneForDisplay(mapped.maskedPhone, digits)
        );
        setRemainingExpiresSeconds(
          applyOAuthServerExpiresIn(mapped.expiresInSeconds, OAUTH_OTP_DEFAULT_EXPIRES_SECONDS)
        );
        setRemainingResendSeconds(
          applyOAuthServerResendCooldown(
            mapped.resendCooldownSeconds,
            OAUTH_OTP_RESEND_COOLDOWN_SECONDS
          )
        );
        setOtpInput('');
        setOtpError('');
        setOtpExpired(false);
        autoVerifiedRef.current = false;
        setStep(STEP_OTP);
      } else if (mapped.kind === 'cooldown') {
        const wait = applyOAuthServerRetryAfter(
          mapped.retryAfterSeconds,
          OAUTH_OTP_RESEND_COOLDOWN_SECONDS
        );
        setRemainingResendSeconds(wait);
        setServerError(resolveOAuthOtpErrorCopy(mapped.code, mapped.message));
      } else {
        const code = String(mapped.code ?? '').toUpperCase();
        if (code === 'TOKEN_EXPIRED') {
          setTokenExpired(true);
          onTokenExpired?.({ code });
        }
        if (code === 'DAILY_LIMIT_EXCEEDED') {
          setDailyLimitReached(true);
        }
        setServerError(resolveOAuthOtpErrorCopy(mapped.code, mapped.message));
      }
    } catch (err) {
      const code = String(err?.response?.data?.code ?? err?.code ?? '').toUpperCase();
      const message = err?.response?.data?.message ?? err?.message ?? '';
      if (code === 'TOKEN_EXPIRED' || err?.status === 401) {
        setTokenExpired(true);
        onTokenExpired?.({ code: code || 'TOKEN_EXPIRED' });
      }
      setServerError(
        toDisplayString(message, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      );
    } finally {
      setBusy(false);
    }
  }, [onTokenExpired, phoneInput, socialUser]);

  const handleVerifyOtp = useCallback(
    async (codeOverride) => {
      const code = String(codeOverride ?? otpInput ?? '');
      if (code.length !== OAUTH_OTP_CODE_LENGTH) {
        setOtpError('인증번호 6자리를 입력해 주세요.');
        return;
      }
      if (!challengeToken) {
        setOtpError('인증 세션이 만료되었습니다. 인증번호를 다시 받아 주세요.');
        return;
      }
      if (otpExpired) {
        setOtpError('인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.');
        return;
      }
      setBusy(true);
      setOtpError('');
      setServerError('');
      try {
        const raw = await verifyOAuthPhoneOtp({
          oauthProvider: socialUser.provider,
          phoneVerificationToken: socialUser.phoneVerificationToken,
          challengeToken,
          otpCode: code
        });
        const mapped = mapOAuthPhoneVerifyResponse(raw);
        if (mapped.kind === 'authenticated') {
          onVerifiedSingle?.({
            accessToken: mapped.accessToken,
            refreshToken: mapped.refreshToken,
            matchedAccount: mapped.matchedAccount,
            provider: socialUser.provider
          });
          return;
        }
        if (mapped.kind === 'requiresPhoneAccountSelection') {
          onRequiresAccountSelection?.({
            phoneAccountSelectionToken: mapped.phoneAccountSelectionToken,
            provider: socialUser.provider
          });
          return;
        }
        const failureCode = String(mapped.code ?? '').toUpperCase();
        if (failureCode === 'OTP_EXPIRED') {
          setOtpExpired(true);
        }
        if (failureCode === 'TOKEN_EXPIRED') {
          setTokenExpired(true);
          onTokenExpired?.({ code: failureCode });
        }
        if (failureCode === 'DAILY_LIMIT_EXCEEDED') {
          setDailyLimitReached(true);
        }
        setOtpError(resolveOAuthOtpErrorCopy(mapped.code, mapped.message));
      } catch (err) {
        const failureCode = String(
          err?.response?.data?.code ?? err?.code ?? ''
        ).toUpperCase();
        const message = err?.response?.data?.message ?? err?.message ?? '';
        if (failureCode === 'TOKEN_EXPIRED' || err?.status === 401) {
          setTokenExpired(true);
          onTokenExpired?.({ code: failureCode || 'TOKEN_EXPIRED' });
        }
        setOtpError(
          toDisplayString(message, '인증 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        );
      } finally {
        setBusy(false);
      }
    },
    [
      challengeToken,
      onRequiresAccountSelection,
      onTokenExpired,
      onVerifiedSingle,
      otpExpired,
      otpInput,
      socialUser
    ]
  );

  const handleOtpChange = useCallback(
    (next) => {
      setOtpInput(next);
      if (otpError) {
        setOtpError('');
      }
      if (next.length < OAUTH_OTP_CODE_LENGTH) {
        autoVerifiedRef.current = false;
      }
    },
    [otpError]
  );

  const handleOtpComplete = useCallback(
    (next) => {
      if (
        busy ||
        otpExpired ||
        autoVerifiedRef.current ||
        !challengeToken ||
        tokenExpired ||
        dailyLimitReached
      ) {
        return;
      }
      autoVerifiedRef.current = true;
      handleVerifyOtp(next);
    },
    [busy, challengeToken, dailyLimitReached, handleVerifyOtp, otpExpired, tokenExpired]
  );

  const handleChangePhone = useCallback(() => {
    setStep(STEP_PHONE);
    setOtpInput('');
    setOtpError('');
    setChallengeToken('');
    setMaskedPhone('');
    setRemainingExpiresSeconds(0);
    setRemainingResendSeconds(0);
    setOtpExpired(false);
    autoVerifiedRef.current = false;
  }, []);

  const resendDisabled =
    busy ||
    dailyLimitReached ||
    tokenExpired ||
    !canResendOAuthOtp(remainingResendSeconds, busy);

  const verifyButtonDisabled =
    busy ||
    otpExpired ||
    tokenExpired ||
    dailyLimitReached ||
    otpInput.length !== OAUTH_OTP_CODE_LENGTH;

  const sendButtonDisabled =
    busy ||
    tokenExpired ||
    dailyLimitReached ||
    !!validateKoreanMobileInputForOAuth(phoneInput);

  const liveTimerLabel = useMemo(() => {
    if (otpExpired) {
      return '인증번호가 만료되었습니다.';
    }
    const flooredBucket = Math.floor(remainingExpiresSeconds / ARIA_LIVE_ANNOUNCE_INTERVAL_SECONDS);
    return `bucket-${flooredBucket}|${formatOAuthOtpCountdown(remainingExpiresSeconds)}`;
  }, [otpExpired, remainingExpiresSeconds]);

  useEffect(() => {
    lastAnnouncedRef.current = liveTimerLabel;
  }, [liveTimerLabel]);

  const modalTitle = `${providerDisplayName || 'OAuth'} 계정 연결`;
  const modalSubtitle =
    '본인 확인을 위해 가입된 휴대폰 번호로 SMS 인증 코드를 보내드립니다.';

  if (!isOpen) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="small"
      variant="form"
      showCloseButton={!busy}
      backdropClick={!busy}
      loading={busy && step === STEP_OTP && !otpError && !serverError}
    >
      <div className="oauth-phone-modal">
        <section
          className="oauth-phone-modal__provider"
          data-provider={providerKey}
          aria-label={`${providerDisplayName} 계정 정보`}
        >
          <p className="oauth-phone-modal__provider-text">
            {`${providerDisplayName} 계정과 휴대폰을 연결합니다.`}
          </p>
          {(socialUser?.email || (!hideNameRow && (socialUser?.name || socialUser?.nickname))) && (
            <dl className="oauth-phone-modal__prefill">
              {!hideNameRow && (socialUser?.name || socialUser?.nickname) && (
                <div className="oauth-phone-modal__prefill-row">
                  <dt className="oauth-phone-modal__prefill-key">이름</dt>
                  <dd className="oauth-phone-modal__prefill-value">
                    {toDisplayString(socialUser?.name || socialUser?.nickname, '')}
                  </dd>
                </div>
              )}
              {socialUser?.email && (
                <div className="oauth-phone-modal__prefill-row">
                  <dt className="oauth-phone-modal__prefill-key">이메일</dt>
                  <dd className="oauth-phone-modal__prefill-value">
                    {toDisplayString(socialUser.email, '')}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </section>

        {tokenExpired ? (
          <div
            className="oauth-phone-modal__banner oauth-phone-modal__banner--error"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle" aria-hidden />
            <span>
              {toDisplayString(
                '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.'
              )}
            </span>
          </div>
        ) : null}

        {dailyLimitReached && !tokenExpired ? (
          <div
            className="oauth-phone-modal__banner oauth-phone-modal__banner--error"
            role="alert"
          >
            <i className="bi bi-exclamation-triangle" aria-hidden />
            <span>
              {toDisplayString(
                '오늘 인증 시도 횟수를 초과했습니다. 내일 다시 시도하거나 다른 로그인 수단을 이용해 주세요.'
              )}
            </span>
          </div>
        ) : null}

        {step === STEP_PHONE && !tokenExpired && (
          <form
            className="oauth-phone-modal__form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!sendButtonDisabled) {
                startSend();
              }
            }}
          >
            <div className="mg-v2-form-group">
              <label htmlFor="oauth-phone-modal-phone" className="mg-v2-label">
                휴대폰 번호 <span className="mg-v2-form-label-required">*</span>
              </label>
              <input
                id="oauth-phone-modal-phone"
                name="phone"
                type="tel"
                className={`mg-v2-input mg-v2-w-full ${
                  phoneError ? 'oauth-phone-modal__input--error' : ''
                }`}
                value={phoneInput}
                onChange={handlePhoneInputChange}
                maxLength="13"
                placeholder="010-0000-0000"
                autoComplete="tel"
                autoFocus
                inputMode="numeric"
                aria-describedby="oauth-phone-modal-phone-help"
                disabled={busy || dailyLimitReached}
                aria-invalid={phoneError ? 'true' : undefined}
              />
              {phoneError && (
                <span className="oauth-phone-modal__error-text" role="alert">
                  {toDisplayString(phoneError)}
                </span>
              )}
              <span id="oauth-phone-modal-phone-help" className="mg-v2-form-help">
                휴대폰 번호 11자리를 입력해 주세요.
              </span>
            </div>

            {serverError && (
              <div
                className="oauth-phone-modal__banner oauth-phone-modal__banner--error"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle" aria-hidden />
                <span>{toDisplayString(serverError)}</span>
              </div>
            )}
          </form>
        )}

        {step === STEP_OTP && !tokenExpired && (
          <div className="oauth-phone-modal__otp">
            <p className="oauth-phone-modal__otp-description">
              {`문자로 전송된 6자리 인증번호를 입력해 주세요.${
                maskedPhone ? ` (${maskedPhone})` : ''
              }`}
            </p>
            <OtpCodeInput
              value={otpInput}
              onChange={handleOtpChange}
              onComplete={handleOtpComplete}
              length={OAUTH_OTP_CODE_LENGTH}
              error={otpError}
              disabled={busy || tokenExpired || dailyLimitReached}
              autoFocus
              ariaDescribedBy="oauth-phone-modal-otp-timer"
            />
            <div className="oauth-phone-modal__timer-row">
              <span
                id="oauth-phone-modal-otp-timer"
                className={`oauth-phone-modal__timer ${
                  otpExpired ? 'oauth-phone-modal__timer--expired' : ''
                }`}
                aria-live="polite"
                data-testid="oauth-phone-modal-otp-timer"
              >
                {otpExpired
                  ? '인증번호가 만료되었습니다.'
                  : `남은 시간 ${formatOAuthOtpCountdown(remainingExpiresSeconds)}`}
              </span>
              <button
                type="button"
                className={`oauth-phone-modal__resend ${
                  resendDisabled ? 'oauth-phone-modal__resend--disabled' : ''
                }`}
                onClick={() => {
                  if (!resendDisabled) {
                    startSend();
                  }
                }}
                disabled={resendDisabled}
                aria-label={
                  resendDisabled && remainingResendSeconds > 0
                    ? `인증번호 재발송 (재발송까지 ${formatOAuthOtpCountdown(
                        remainingResendSeconds
                      )})`
                    : '인증번호 재발송'
                }
              >
                {resendDisabled && remainingResendSeconds > 0
                  ? `인증번호 재발송 ${formatOAuthOtpCountdown(remainingResendSeconds)}`
                  : '인증번호 재발송'}
              </button>
            </div>

            {serverError && (
              <div
                className="oauth-phone-modal__banner oauth-phone-modal__banner--error"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle" aria-hidden />
                <span>{toDisplayString(serverError)}</span>
              </div>
            )}
          </div>
        )}

        <ActionBar align="end" gap="md" className="oauth-phone-modal__actions">
          {step === STEP_OTP && !tokenExpired && (
            <ActionBarButton
              variant="ghost"
              onClick={handleChangePhone}
              disabled={busy}
              className="oauth-phone-modal__action-secondary"
            >
              휴대폰 번호 변경
            </ActionBarButton>
          )}
          <ActionBarButton
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="oauth-phone-modal__action-cancel"
          >
            로그인으로
          </ActionBarButton>
          {step === STEP_PHONE && !tokenExpired && (
            <ActionBarButton
              variant="primary"
              onClick={startSend}
              disabled={sendButtonDisabled}
              loading={busy}
              className="oauth-phone-modal__action-primary"
            >
              {busy ? '발송 중…' : '인증번호 발송'}
            </ActionBarButton>
          )}
          {step === STEP_OTP && !tokenExpired && (
            <ActionBarButton
              variant="primary"
              onClick={() => handleVerifyOtp(otpInput)}
              disabled={verifyButtonDisabled}
              loading={busy}
              className="oauth-phone-modal__action-primary"
            >
              {busy ? '확인 중…' : '확인'}
            </ActionBarButton>
          )}
        </ActionBar>

        {/* aria-live announcer (시각 미노출) — 10초 단위 변화 시에만 새 텍스트 렌더 */}
        <span
          className="oauth-phone-modal__sr-only"
          aria-live="polite"
          data-testid="oauth-phone-modal-sr-live"
        >
          {liveTimerLabel}
        </span>
      </div>
    </UnifiedModal>
  );
};

OAuthPhoneVerificationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  socialUser: PropTypes.shape({
    provider: PropTypes.string,
    phoneVerificationToken: PropTypes.string,
    name: PropTypes.string,
    nickname: PropTypes.string,
    email: PropTypes.string
  }).isRequired,
  onVerifiedSingle: PropTypes.func.isRequired,
  onRequiresAccountSelection: PropTypes.func.isRequired,
  onTokenExpired: PropTypes.func
};

export default OAuthPhoneVerificationModal;
