/**
 * 온보딩 최종 제출 직전 Turnstile CAPTCHA 영역 (TRINITY_ONBOARDING_PUBLIC_CAPTCHA_UX_SPEC)
 *
 * @author CoreSolution
 * @since 2026-04-11
 */

"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { TRINITY_CONSTANTS } from "../../constants/trinity";

/** Primary CTA와 연결(aria-describedby)용 고정 id */
export const ONBOARDING_CAPTCHA_STATUS_ELEMENT_ID =
  "trinity-onboarding-captcha-status-live";

export interface OnboardingCaptchaSectionProps {
  /** fetchPublicCaptchaSiteKey 결과 — 있을 때만 위젯 마운트 */
  readonly siteKey: string | null;
  /** 서버/ENV에서 site key 해석 중 */
  readonly configLoading: boolean;
  /** 검증 토큰 변경(성공 시 문자열, 만료·오류 시 null) */
  readonly onTokenChange: (token: string | null) => void;
}

type StatusKind = "loading" | "idle" | "success" | "fail" | "network";

export default function OnboardingCaptchaSection({
  siteKey,
  configLoading,
  onTokenChange,
}: OnboardingCaptchaSectionProps) {
  const regionId = useId();
  const statusId = ONBOARDING_CAPTCHA_STATUS_ELEMENT_ID;
  const [mounted, setMounted] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<StatusKind>("idle");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (configLoading) {
      setStatus("loading");
      return;
    }
    setStatus("idle");
  }, [configLoading, siteKey]);

  const handleSuccess = useCallback(
    (token: string) => {
      onTokenChange(token);
      setStatus("success");
    },
    [onTokenChange]
  );

  const handleExpire = useCallback(() => {
    onTokenChange(null);
    setStatus("fail");
  }, [onTokenChange]);

  const handleError = useCallback(() => {
    onTokenChange(null);
    setStatus("network");
  }, [onTokenChange]);

  const handleRetry = useCallback(() => {
    onTokenChange(null);
    setStatus("idle");
    setRetryKey((k) => k + 1);
  }, [onTokenChange]);

  const statusMessage = (() => {
    if (configLoading) {
      return TRINITY_CONSTANTS.MESSAGES.CAPTCHA_LOADING;
    }
    switch (status) {
      case "loading":
        return TRINITY_CONSTANTS.MESSAGES.CAPTCHA_LOADING;
      case "success":
        return TRINITY_CONSTANTS.MESSAGES.CAPTCHA_SUCCESS;
      case "fail":
        return TRINITY_CONSTANTS.MESSAGES.CAPTCHA_FAIL;
      case "network":
        return TRINITY_CONSTANTS.MESSAGES.CAPTCHA_NETWORK;
      default:
        return "";
    }
  })();

  if (!configLoading && !siteKey) {
    return null;
  }

  return (
    <section
      className="trinity-onboarding__captcha-region"
      role="region"
      aria-label="보안 확인(자동 입력 방지)"
      id={regionId}
    >
      <div
        className="trinity-onboarding__captcha-box"
        data-testid="onboarding-captcha-box"
      >
        <div
          id={statusId}
          className="trinity-onboarding__captcha-live"
          aria-live="polite"
        >
          {statusMessage ? (
            <p className="trinity-onboarding__captcha-status-text">{statusMessage}</p>
          ) : null}
        </div>

        {mounted && siteKey && !configLoading ? (
          <div className="trinity-onboarding__captcha-widget-wrap">
            <Turnstile
              key={retryKey}
              siteKey={siteKey}
              onSuccess={handleSuccess}
              onExpire={handleExpire}
              onError={handleError}
            />
          </div>
        ) : null}

        {(status === "fail" || status === "network") && siteKey && !configLoading ? (
          <div className="trinity-onboarding__captcha-actions">
            <button
              type="button"
              className="trinity-onboarding__captcha-retry"
              onClick={handleRetry}
            >
              {TRINITY_CONSTANTS.MESSAGES.RETRY}
            </button>
            <p className="trinity-onboarding__captcha-hint">
              {TRINITY_CONSTANTS.MESSAGES.CAPTCHA_REFRESH_HINT}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
