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
 * 카운트다운 remainingMs≤0 이고 연장 버튼이 진행 중이 아니면
 * logout({ reason: sessionExpiry }) → /login?logout=success&redirect=… (복귀 경로 보존).
 * 모달 「로그아웃」 버튼·수동 로그아웃은 options 없이 복귀 경로를 붙이지 않는다.
 * 그 전 checkSession(idleExpiry) 는 중복 로그인 종료만 구분한다.
 * current-user 가 200 이거나 재확인 뒤 remainingMs>0 이어도 연장으로 보지 않고 로그아웃한다.
 * 연장으로 세는 것은 연장 버튼뿐이다.
 * 중복 로그인으로 sessionManager 사용자가 비면 logout 하지 않고 모달만 닫는다.
 * 남은 시간은 `lastAccessedTime`(ms) + `maxInactiveInterval`(s)×1000 만료 시각 기준이며,
 * 서버 `ApiResponse`는 sessionManager에서 `data` 언랩됨(미언랩 시 toSafeNumber가 -1로 떨어져 타이머가 비활성).
 * lastAccessedTime / maxInactiveInterval = Servlet HttpSession(밀리초/초), serverNow = 서버 now(ms),
 * `AuthController.putHttpSessionTimingFields`와 동일.
 * 미인증(`isAuthenticated !== true`) 응답에는 타이밍 필드가 없으므로(서버가 제외) 경고·카운트다운을 표시하지 않는다.
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
import {
  SESSION_IDLE_EXPIRY_TIMER_SLACK_MS,
  SESSION_IDLE_WARNING_MS,
  SESSION_LOGOUT_REASON,
  SESSION_REMAINING_DISPLAY,
  isSessionPublicPath
} from '../../constants/session';
import { toSafeNumber } from '../../utils/safeDisplay';
import { sessionManager } from '../../utils/sessionManager';
import {
  buildSessionExpiryLabel,
  computeSessionExpiryState,
  formatSessionCountdown
} from '../../utils/sessionExpiryDisplay';

/** setTimeout 콜백에서 “아직 1분+여유”면 모달을 열지 않고 타이머만 재스케줄 (스냅샷·갱신 레이스) */
const SESSION_IDLE_WARN_OPEN_SLACK_MS = 2000;
/** 백그라운드 탭에서 긴 setTimeout이 지연될 때 대비, 남은 시간 재계산 주기(ms) — 30~60초 권장 */
const SESSION_IDLE_WARN_POLL_MS = 45 * 1000;
/** 갱신으로 남은 시간이 경고창을 크게 벗어나면(사실상 연장) 열린 모달 자동 닫힘 */
const SESSION_IDLE_MODAL_AUTO_CLOSE_SURPLUS_MS = 3000;

/**
 * 경고 모달 오픈 여부를 refs 스냅샷으로 판정(폴링·setTimeout 콜백 공통).
 *
 * @param {object} snap — { isOpen, expiryLogoutDone, user, isLoginPath, sessionInfo }
 * @param {number} clientNowMs
 * @returns {'open'|'reschedule'|'noop'}
 */
function evaluateIdleWarnOpenFromSnapshot(snap, clientNowMs) {
  if (snap.isOpen || snap.expiryLogoutDone) {
    return 'noop';
  }
  if (!snap.user || snap.isLoginPath) {
    return 'noop';
  }
  const si = snap.sessionInfo;
  if (!si || si.isAuthenticated !== true) {
    return 'noop';
  }
  const rem = computeSessionExpiryState(si, clientNowMs, { allowFallback: false }).remainingMs;
  if (rem == null) {
    return 'noop';
  }
  if (rem > SESSION_IDLE_WARNING_MS + SESSION_IDLE_WARN_OPEN_SLACK_MS) {
    return 'reschedule';
  }
  return 'open';
}

const SessionIdleWarningModal = () => {
  const { pathname } = useLocation();
  const { user, sessionInfo, checkSession, logout } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const [expiryLabel, setExpiryLabel] = useState('');
  const timerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const warnPollIntervalRef = useRef(null);
  /** 실제 만료 시각에 맞춘 판정 타이머 (표시 초와 무관) */
  const expiryTimerRef = useRef(null);
  /** 만료 판정 재실행 트리거 — 만료 타이머 발화 시 증가 */
  const [expiryCheckSeq, setExpiryCheckSeq] = useState(0);
  /** 카운트다운 0 도달 시 logout 1회만 (중복 호출 방지) */
  const expiryLogoutStartedRef = useRef(false);
  /** 연장 클릭이 진행 중이면, 그 확인이 성공한 경우에만 만료 logout 을 건너뛴다 */
  const extendInFlightRef = useRef(false);
  /** 만료 logout 을 이미 호출했으면 같은 만료 세션으로 모달을 다시 열거나 logout 을 다시 부르지 않는다 */
  const expiryLogoutDoneRef = useRef(false);

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

  const clearExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current != null) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  /**
   * 모달이 열려 있으면 만료 시각(remainingMs)에 맞춰 판정 타이머를 건다.
   * 표시용 remainingSec 은 1→0 전환 뒤 0 으로 고정돼 재평가 트리거가 되지 못하므로(만료 시각이
   * 정수 초에서 어긋난 경우) 실제 만료 시각 기준 타이머로 판정을 다시 돌린다.
   */
  useEffect(() => {
    clearExpiryTimer();
    if (!isOpen || !sessionInfo || sessionInfo.isAuthenticated !== true) {
      return undefined;
    }
    const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now(), {
      allowFallback: false
    });
    if (remainingMs == null || remainingMs <= 0) {
      return undefined;
    }
    expiryTimerRef.current = setTimeout(() => {
      expiryTimerRef.current = null;
      setExpiryCheckSeq((seq) => seq + 1);
    }, remainingMs + SESSION_IDLE_EXPIRY_TIMER_SLACK_MS);
    return () => {
      clearExpiryTimer();
    };
  }, [isOpen, sessionInfo, expiryCheckSeq, clearExpiryTimer]);

  const clearWarnPollInterval = useCallback(() => {
    if (warnPollIntervalRef.current != null) {
      clearInterval(warnPollIntervalRef.current);
      warnPollIntervalRef.current = null;
    }
  }, []);

  const tryOpenIdleWarningFromRefs = useCallback(() => {
    const snap = {
      isOpen: isOpenRef.current,
      expiryLogoutDone: expiryLogoutDoneRef.current,
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
    if (isOpenRef.current || expiryLogoutDoneRef.current) {
      return;
    }
    const si = sessionInfoRef.current;
    if (!userRef.current || isLoginPathRef.current || !si || si.isAuthenticated !== true) {
      return;
    }

    const clientNow = Date.now();
    const { remainingMs, expiryMs } = computeSessionExpiryState(si, clientNow, {
      allowFallback: false
    });
    if (remainingMs == null || expiryMs == null) {
      return;
    }

    const delayMs = Math.max(0, remainingMs - SESSION_IDLE_WARNING_MS);
    timerRef.current = setTimeout(() => {
      const snap = {
        isOpen: isOpenRef.current,
        expiryLogoutDone: expiryLogoutDoneRef.current,
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
      setExpiryLabel('');
      return undefined;
    }

    if (sessionInfo.isAuthenticated !== true) {
      setRemainingSec(0);
      setExpiryLabel('');
      return undefined;
    }

    const maxSec = toSafeNumber(sessionInfo.maxInactiveInterval, -1);
    const lastAcc = toSafeNumber(sessionInfo.lastAccessedTime, -1);
    if (maxSec <= 0 || lastAcc <= 0) {
      setRemainingSec(0);
      setExpiryLabel('');
      return undefined;
    }

    const tick = () => {
      const { remainingMs, expiryMs } = computeSessionExpiryState(sessionInfo, Date.now(), {
        allowFallback: false
      });
      if (remainingMs == null) {
        setRemainingSec(0);
        setExpiryLabel('');
        return;
      }
      setRemainingSec(Math.max(0, Math.floor(remainingMs / 1000)));
      setExpiryLabel(buildSessionExpiryLabel(expiryMs));
    };
    tick();
    countdownIntervalRef.current = setInterval(tick, 1000);
    return () => {
      clearCountdownInterval();
    };
  }, [isOpen, sessionInfo, clearCountdownInterval]);

  /** 사용자가 바뀌거나 새 세션(잔여>0)이 오면 만료 logout 완료 표시를 푼다 */
  useEffect(() => {
    if (!expiryLogoutDoneRef.current) {
      return;
    }
    const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now(), {
      allowFallback: false
    });
    if (!user || (remainingMs != null && remainingMs > 0)) {
      expiryLogoutDoneRef.current = false;
    }
  }, [user, sessionInfo]);

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
    const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now(), {
      allowFallback: false
    });
    if (remainingMs == null) {
      return;
    }
    if (remainingMs > SESSION_IDLE_WARNING_MS + SESSION_IDLE_MODAL_AUTO_CLOSE_SURPLUS_MS) {
      setIsOpen(false);
    }
  }, [isOpen, sessionInfo]);

  /**
   * 만료(remainingMs≤0) 이고 연장 버튼이 진행 중이 아니면
   * logout({ reason: SESSION_EXPIRY }) → /login?logout=success&redirect=… .
   * checkSession(idleExpiry) 는 중복 로그인 종료만 구분한다. 200 이나 remainingMs>0 은 연장이 아니다.
   * 중복 로그인 킥은 sessionManager 가 이미 이동시키므로 logout 으로 쿼리를 덮지 않는다.
   */
  useEffect(() => {
    if (!isOpen) {
      expiryLogoutStartedRef.current = false;
      return;
    }
    if (!sessionInfo || expiryLogoutStartedRef.current || expiryLogoutDoneRef.current) {
      return;
    }
    const { remainingMs } = computeSessionExpiryState(sessionInfo, Date.now(), {
      allowFallback: false
    });
    // 판정은 remainingMs(실제 만료 시각) 기준. expiryCheckSeq(만료 시각 타이머)·remainingSec(1초 틱) 모두 재평가 트리거.
    if (remainingMs == null || remainingMs > 0) {
      return;
    }
    expiryLogoutStartedRef.current = true;

    void (async() => {
      // 이미 연장 클릭이 진행 중이면 그 foreground 확인에 맡긴다.
      if (extendInFlightRef.current) {
        expiryLogoutStartedRef.current = false;
        return;
      }
      let stillValid = false;
      try {
        // silent 만 넘기면 SessionContext 가 background 로 올려 401 에도 사용자를 유지한다.
        // 유휴 만료는 그 경로가 아니므로 idleExpiry 로 grace·refresh·background 유지를 끈다.
        stillValid = await checkSession(true, { silent: true, idleExpiry: true }) === true;
      } catch {
        stillValid = false;
      }
      // 연장 클릭의 확인이 세션을 살렸으면 logout 하지 않음 (모달을 닫는 쪽은 handleExtend)
      if (extendInFlightRef.current && stillValid) {
        expiryLogoutStartedRef.current = false;
        return;
      }
      // 중복 로그인 종료는 sessionManager 가 user 를 비우고 redirect 까지 끝낸다.
      if (!stillValid && !sessionManager.getUser()) {
        expiryLogoutStartedRef.current = false;
        setIsOpen(false);
        return;
      }
      expiryLogoutDoneRef.current = true;
      setIsOpen(false);
      await logout({
        preserveReturnPath: true,
        reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY
      });
    })();
  }, [isOpen, sessionInfo, remainingSec, expiryCheckSeq, logout, checkSession]);

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
    extendInFlightRef.current = true;
    try {
      await checkSession(true);
      setIsOpen(false);
    } finally {
      extendInFlightRef.current = false;
    }
  };

  const handleLogout = async() => {
    setIsOpen(false);
    await logout();
  };

  const bodyLine =
    '일정 시간 동안 사용이 없어 서버 세션이 곧 만료됩니다. 계속 사용하시려면 연장을 눌러 주세요.';

  // 미인증·로그아웃 스냅샷에서는 잔여 카운트다운을 보여주지 않는다 (기존 만료 → logout 흐름은 유지)
  const canShowWarning = !!user && !isLoginPath && sessionInfo?.isAuthenticated === true;

  return (
    <UnifiedModal
      isOpen={isOpen && canShowWarning}
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
          <span className="session-idle-warning__countdown-label">
            {SESSION_REMAINING_DISPLAY.COUNTDOWN_LABEL}
          </span>
          <time
            className="session-idle-warning__countdown-value"
            dateTime={`PT${Math.max(0, remainingSec)}S`}
          >
            {formatSessionCountdown(remainingSec)}
          </time>
        </p>
        {expiryLabel ? (
          <SafeText
            tag="p"
            className={`${SESSION_REMAINING_DISPLAY.MODAL_EXPIRY_CLASS} mg-v2-text-xs`}
            fallback=""
          >
            {expiryLabel}
          </SafeText>
        ) : null}
      </div>
    </UnifiedModal>
  );
};

export default SessionIdleWarningModal;
