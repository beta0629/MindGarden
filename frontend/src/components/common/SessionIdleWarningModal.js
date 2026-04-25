/**
 * HTTP 세션 만료 임박(비활성 타임아웃 기준) 시 UnifiedModal로 안내.
 * 매핑 화면 SessionExtensionModal(상담 회기 연장)과 역할·이름이 다름.
 * 타이머 발화·sessionInfo 갱신 사이 **레이스**로 잘못 열리지 않도록, 콜백·폴링에서 남은 시간을
 * **재검증(가드)**하며, 백그라운드 갱신으로 경고 구간을 벗어나면 모달을 닫는다.
 * 백그라운드 탭에서는 긴 `setTimeout`이 크롬 정책상 지연될 수 있어 `SESSION_IDLE_WARN_POLL_MS` 주기 폴링을 병행한다.
 *
 * Smoke (core-tester): 로그인 후 GET /api/v1/auth/session-info 응답에
 * maxInactiveInterval, lastAccessedTime, serverNow 포함 확인 →
 * 만료 `SESSION_IDLE_WARNING_MS` 전 모달 표시 → 연장 시 세션 갱신(checkSession(true))·모달 닫힘 →
 * 로그아웃 시 SessionContext.logout 재사용.
 * 남은 시간은 `lastAccessedTime`(ms) + `maxInactiveInterval`(s)×1000 만료 시각 기준이며,
 * 서버 `ApiResponse`는 sessionManager에서 `data` 언랩됨(미언랩 시 toSafeNumber가 -1로 떨어져 타이머가 비활성).
 * lastAccessedTime / maxInactiveInterval = Servlet HttpSession(밀리초/초), serverNow = 서버 now(ms),
 * `AuthController.putHttpSessionTimingFields`와 동일.
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
import { SESSION_IDLE_WARNING_MS, isSessionPublicPath } from '../../constants/session';
import { toSafeNumber } from '../../utils/safeDisplay';

/** setTimeout 콜백에서 “아직 1분+여유”면 모달을 열지 않고 타이머만 재스케줄 (스냅샷·갱신 레이스) */
const SESSION_IDLE_WARN_OPEN_SLACK_MS = 2000;
/** 백그라운드 탭에서 긴 setTimeout이 지연될 때 대비, 남은 시간 재계산 주기(ms) — 30~60초 권장 */
const SESSION_IDLE_WARN_POLL_MS = 45 * 1000;
/** 갱신으로 남은 시간이 경고창을 크게 벗어나면(사실상 연장) 열린 모달 자동 닫힘 */
const SESSION_IDLE_MODAL_AUTO_CLOSE_SURPLUS_MS = 3000;

/**
 * 경고 모달 오픈 여부를 refs 스냅샷으로 판정(폴링·setTimeout 콜백 공통).
 *
 * @param {object} snap — { isOpen, user, isLoginPath, sessionInfo }
 * @param {number} clientNowMs
 * @returns {'open'|'reschedule'|'noop'}
 */
function evaluateIdleWarnOpenFromSnapshot(snap, clientNowMs) {
  if (snap.isOpen) {
    return 'noop';
  }
  if (!snap.user || snap.isLoginPath) {
    return 'noop';
  }
  const si = snap.sessionInfo;
  if (!si || si.isAuthenticated !== true) {
    return 'noop';
  }
  const rem = computeSessionExpiryState(si, clientNowMs).remainingMs;
  if (rem == null) {
    return 'noop';
  }
  if (rem > SESSION_IDLE_WARNING_MS + SESSION_IDLE_WARN_OPEN_SLACK_MS) {
    return 'reschedule';
  }
  return 'open';
}

/**
 * @param {object|null|undefined} si — sessionInfo
 * @param {number} clientNowMs
 * @returns {{ expiryMs: (number|null), offsetMs: number, remainingMs: (number|null) }}
 */
function computeSessionExpiryState(si, clientNowMs) {
  if (!si) {
    return { expiryMs: null, offsetMs: 0, remainingMs: null };
  }
  const maxSec = toSafeNumber(si.maxInactiveInterval, -1);
  const lastAcc = toSafeNumber(si.lastAccessedTime, -1);
  if (maxSec <= 0 || lastAcc <= 0) {
    return { expiryMs: null, offsetMs: 0, remainingMs: null };
  }
  const serverNow =
    si.serverNow != null
      ? toSafeNumber(si.serverNow, clientNowMs)
      : clientNowMs;
  const offsetMs = serverNow - clientNowMs;
  const expiryMs = lastAcc + maxSec * 1000;
  const remainingMs = expiryMs - (clientNowMs + offsetMs);
  return { expiryMs, offsetMs, remainingMs };
}

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
  const warnPollIntervalRef = useRef(null);

  const isLoginPath = isSessionPublicPath(pathname);
  const sessionInfoRef = useRef(sessionInfo);
  const userRef = useRef(user);
  const isLoginPathRef = useRef(isLoginPath);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    sessionInfoRef.current = sessionInfo;
    userRef.current = user;
    isLoginPathRef.current = isLoginPath;
    isOpenRef.current = isOpen;
  }, [sessionInfo, user, isLoginPath, isOpen]);

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

  const clearWarnPollInterval = useCallback(() => {
    if (warnPollIntervalRef.current != null) {
      clearInterval(warnPollIntervalRef.current);
      warnPollIntervalRef.current = null;
    }
  }, []);

  const tryOpenIdleWarningFromRefs = useCallback(() => {
    const snap = {
      isOpen: isOpenRef.current,
      user: userRef.current,
      isLoginPath: isLoginPathRef.current,
      sessionInfo: sessionInfoRef.current
    };
    if (evaluateIdleWarnOpenFromSnapshot(snap, Date.now()) === 'open') {
      setIsOpen(true);
    }
  }, []);

  const armWarnTimer = useCallback(() => {
    clearTimer();
    if (isOpenRef.current) {
      return;
    }
    const si = sessionInfoRef.current;
    if (!userRef.current || isLoginPathRef.current || !si || si.isAuthenticated !== true) {
      return;
    }

    const clientNow = Date.now();
    const { remainingMs, expiryMs } = computeSessionExpiryState(si, clientNow);
    if (remainingMs == null || expiryMs == null) {
      return;
    }

    const delayMs = Math.max(0, remainingMs - SESSION_IDLE_WARNING_MS);
    timerRef.current = setTimeout(() => {
      const snap = {
        isOpen: isOpenRef.current,
        user: userRef.current,
        isLoginPath: isLoginPathRef.current,
        sessionInfo: sessionInfoRef.current
      };
      const action = evaluateIdleWarnOpenFromSnapshot(snap, Date.now());
      if (action === 'reschedule') {
        setTimeout(() => {
          armWarnTimer();
        }, 0);
        return;
      }
      if (action === 'open') {
        setIsOpen(true);
      }
    }, delayMs);
  }, [clearTimer]);

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

    const tick = () => {
      const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now());
      if (remainingMs == null) {
        setRemainingSec(0);
        return;
      }
      setRemainingSec(Math.max(0, Math.floor(remainingMs / 1000)));
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
      clearWarnPollInterval();
    }
  }, [user, clearTimer, clearCountdownInterval, clearWarnPollInterval]);

  /** 경고 임계 밖으로 연장되면 모달 닫기 */
  useEffect(() => {
    if (!isOpen || !sessionInfo) {
      return;
    }
    const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now());
    if (remainingMs == null) {
      return;
    }
    if (remainingMs > SESSION_IDLE_WARNING_MS + SESSION_IDLE_MODAL_AUTO_CLOSE_SURPLUS_MS) {
      setIsOpen(false);
    }
  }, [isOpen, sessionInfo]);

  useEffect(() => {
    armWarnTimer();
    return () => {
      clearTimer();
    };
  }, [user, sessionInfo, isLoginPath, isOpen, armWarnTimer, clearTimer]);

  /** 짧은 주기 폴링(백그라운드 탭 setTimeout 지연 보완) + 포커스 복귀 시 경고 타이머 재스케줄 */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      armWarnTimer();
      tryOpenIdleWarningFromRefs();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const clearPoll = () => {
      if (warnPollIntervalRef.current != null) {
        clearInterval(warnPollIntervalRef.current);
        warnPollIntervalRef.current = null;
      }
    };

    if (!user || isLoginPath || !sessionInfo || sessionInfo.isAuthenticated !== true) {
      clearPoll();
      return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        clearPoll();
      };
    }

    tryOpenIdleWarningFromRefs();
    warnPollIntervalRef.current = setInterval(
      tryOpenIdleWarningFromRefs,
      SESSION_IDLE_WARN_POLL_MS
    );

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearPoll();
    };
  }, [user, isLoginPath, sessionInfo, armWarnTimer, tryOpenIdleWarningFromRefs]);

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
      className="session-idle-warning-modal mg-modal--footer-safe"
      actions={
        <>
          {/* 연장을 먼저 두고 세로 스택에서도 상단에 주요 액션이 오도록 함 (가로 배치 시에도 flex-end로 오른쪽 정렬) */}
          <MGButton
            type="button"
            variant="success"
            size="medium"
            onClick={handleExtend}
            preventDoubleClick={false}
            className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            data-testid="session-idle-extend"
          >
            <Clock size={20} className="mg-v2-icon-inline" aria-hidden />
            연장
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            size="medium"
            onClick={handleLogout}
            preventDoubleClick={false}
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            data-testid="session-idle-logout"
          >
            <LogOut size={20} className="mg-v2-icon-inline" aria-hidden />
            로그아웃
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
