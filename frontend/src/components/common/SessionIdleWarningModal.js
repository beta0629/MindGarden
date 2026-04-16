/**
 * HTTP 세션 만료 임박(비활성 타임아웃 기준) 시 UnifiedModal로 안내.
 * 매핑 화면 SessionExtensionModal(상담 회기 연장)과 역할·이름이 다름.
 *
 * Smoke (core-tester): 로그인 후 GET /api/v1/auth/session-info 응답에
 * maxInactiveInterval, lastAccessedTime, serverNow 포함 확인 →
 * 만료 약 1분 전 모달 표시 → 연장 시 세션 갱신(checkSession(true))·모달 닫힘 →
 * 로그아웃 시 SessionContext.logout 재사용.
 *
 * 표시 경계: COMMON_DISPLAY_BOUNDARY_MEETING_20260322 — 본문은 정적 문구·SafeText, API 숫자 필드는 toSafeNumber.
 *
 * @author CoreSolution
 * @since 2026-04-14
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import UnifiedModal from './modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import SafeText from './SafeText';
import { useSession } from '../../contexts/SessionContext';
import { SESSION_IDLE_WARNING_MS } from '../../constants/session';
import { toSafeNumber } from '../../utils/safeDisplay';

/** 서버 만료 시각 기준 남은 초 → MM:SS (표시용, 음수는 0으로) */
function formatSessionCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(toSafeNumber(totalSeconds, 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const SessionIdleWarningModal = () => {
  const { pathname } = useLocation();
  const { user, sessionInfo, checkSession, logout } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current != null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  /** 모달이 열려 있을 때 만료까지 남은 시간(초)을 1초마다 갱신 */
  useEffect(() => {
    clearCountdownInterval();
    if (!isOpen || !sessionInfo) {
      setRemainingSec(0);
      return undefined;
    }

    const maxSec = toSafeNumber(sessionInfo.maxInactiveInterval, -1);
    const lastAcc = toSafeNumber(sessionInfo.lastAccessedTime, -1);
    if (maxSec <= 0 || lastAcc <= 0) {
      setRemainingSec(0);
      return undefined;
    }

    const serverNow =
      sessionInfo.serverNow != null
        ? toSafeNumber(sessionInfo.serverNow, Date.now())
        : Date.now();
    const offsetMs = serverNow - Date.now();
    const expiryMs = lastAcc + maxSec * 1000;

    const tick = () => {
      const rem = Math.max(
        0,
        Math.floor((expiryMs - (Date.now() + offsetMs)) / 1000)
      );
      setRemainingSec(rem);
    };
    tick();
    countdownIntervalRef.current = setInterval(tick, 1000);
    return () => {
      clearCountdownInterval();
    };
  }, [isOpen, sessionInfo, clearCountdownInterval]);

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      clearTimer();
      clearCountdownInterval();
    }
  }, [user, clearTimer, clearCountdownInterval]);

  const isLoginPath =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/landing' ||
    pathname === '/' ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/tablet/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/oauth2/callback');

  useEffect(() => {
    clearTimer();

    if (isOpen) {
      return undefined;
    }

    if (!user || isLoginPath || !sessionInfo || sessionInfo.isAuthenticated !== true) {
      return undefined;
    }

    const maxSec = toSafeNumber(sessionInfo.maxInactiveInterval, -1);
    const lastAcc = toSafeNumber(sessionInfo.lastAccessedTime, -1);
    if (maxSec <= 0 || lastAcc <= 0) {
      return undefined;
    }

    const serverNow = sessionInfo.serverNow != null
      ? toSafeNumber(sessionInfo.serverNow, Date.now())
      : Date.now();
    const offsetMs = serverNow - Date.now();
    const expiryMs = lastAcc + maxSec * 1000;
    const warnAtMs = expiryMs - SESSION_IDLE_WARNING_MS;
    const delayMs = Math.max(0, warnAtMs - (Date.now() + offsetMs));

    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, delayMs);

    return () => {
      clearTimer();
    };
  }, [user, sessionInfo, isLoginPath, isOpen, clearTimer]);

  const handleExtend = async() => {
    await checkSession(true);
    setIsOpen(false);
  };

  const handleLogout = async() => {
    setIsOpen(false);
    await logout();
  };

  const bodyLine =
    '일정 시간 동안 사용이 없어 서버 세션이 곧 만료됩니다. 계속 사용하시려면 연장을 눌러 주세요.';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleExtend}
      title="세션 만료 임박"
      size="small"
      variant="alert"
      backdropClick={false}
      showCloseButton={false}
      zIndex={9990}
      actions={
        <>
          <MGButton
            variant="outline"
            size="medium"
            onClick={handleLogout}
            preventDoubleClick={false}
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            <LogOut size={20} className="mg-v2-icon-inline" />
            로그아웃
          </MGButton>
          <MGButton
            variant="primary"
            size="medium"
            onClick={handleExtend}
            preventDoubleClick={false}
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          >
            <Clock size={20} className="mg-v2-icon-inline" />
            연장
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-empty-state">
        <Clock size={48} className="mg-v2-color-warning" />
        <SafeText className="mg-v2-text-base mg-v2-mt-md" tag="p">{bodyLine}</SafeText>
        <p
          className={`session-idle-warning__countdown${remainingSec <= 10 ? ' session-idle-warning__countdown--urgent' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="session-idle-warning__countdown-label">남은 시간</span>
          <time
            className="session-idle-warning__countdown-value"
            dateTime={`PT${Math.max(0, remainingSec)}S`}
          >
            {formatSessionCountdown(remainingSec)}
          </time>
        </p>
      </div>
    </UnifiedModal>
  );
};

export default SessionIdleWarningModal;
