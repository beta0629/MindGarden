/**
 * SessionIdleWarningModal — 카운트다운 0 로그아웃, 연장, current-user 401.
 * 유휴 만료 재확인이 새 세션 remaining 을 돌려줘도 연장 버튼이 아니면 logout 한다.
 * current-user 401 로 사용자가 비어도 서버 logout 은 한 번, 거절돼도 로그인으로 보낸다.
 * checkSession 이 끝난 뒤의 렌더는 SessionProvider 처럼 그 스냅을 다시 내려준다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

jest.mock('../../../contexts/SessionContext', () => {
  const ReactActual = jest.requireActual('react');
  return {
    SessionContext: ReactActual.createContext(null),
    useSession: jest.fn()
  };
});

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: jest.fn(),
    getSessionInfo: jest.fn()
  }
}));

jest.mock('../../../utils/sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn(() => true),
  getCurrentLocationReturnUrl: jest.fn(() => '/admin/clients?tab=3')
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SessionIdleWarningModal from '../SessionIdleWarningModal';
import { useSession } from '../../../contexts/SessionContext';
import { sessionManager } from '../../../utils/sessionManager';
import { getCurrentLocationReturnUrl, redirectToLoginPageOnce } from '../../../utils/sessionRedirect';
import { SESSION_IDLE_WARNING_MS, SESSION_LOGOUT_REASON } from '../../../constants/session';
import { computeSessionExpiryState } from '../../../utils/sessionExpiryDisplay';
/* eslint-enable import/first */

const CLOCK_BASE_MS = 1_800_000_000_000;
const MS_PER_SECOND = 1000;
/** 경고 임계(SESSION_IDLE_WARNING_MS)보다 짧은 유효 창 — 마운트 직후 모달이 열린다 */
const ACTIVE_WINDOW_SEC = 5;
const RENEWED_MAX_INACTIVE_SEC = 60 * 60;
const RENEWED_ELAPSED_SEC = 0;
const DUPLICATE_GUARD_ADVANCE_MS = 5 * MS_PER_SECOND;
const PAST_EXPIRY_SLACK_MS = MS_PER_SECOND;
const DASHBOARD_PATH = '/admin/dashboard';
/** 만료 직전에 잡아 두는 복귀 경로. 라우터 엔트리와 별개로 window 주소를 흉내 낸다. */
const RETURN_PATH = '/admin/clients?tab=3';
const SIGNED_IN_USER = Object.freeze({ id: 1, role: 'ADMIN' });
const MICROTASK_FLUSHES = 4;

/**
 * offset 0 스냅샷. remainingMs = (maxInactiveSec - elapsedSec) * MS_PER_SECOND.
 *
 * @param {{ now: number, maxInactiveSec: number, elapsedSec: number }} input
 * @returns {object}
 */
const sessionInfoAt = ({ now, maxInactiveSec, elapsedSec }) => {
  const lastAccessedTime = now - elapsedSec * MS_PER_SECOND;
  return {
    isAuthenticated: true,
    maxInactiveInterval: maxInactiveSec,
    lastAccessedTime,
    serverNow: lastAccessedTime,
    clientReceivedAt: lastAccessedTime
  };
};

const remainingMsOf = (sessionInfo, now = Date.now()) => (
  computeSessionExpiryState(sessionInfo, now, { allowFallback: false }).remainingMs
);

const renewedSessionInfo = () => sessionInfoAt({
  now: CLOCK_BASE_MS,
  maxInactiveSec: RENEWED_MAX_INACTIVE_SEC,
  elapsedSec: RENEWED_ELAPSED_SEC
});

const renderModal = () => render(
  <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
    <SessionIdleWarningModal />
  </MemoryRouter>
);

const flushMicrotasks = async() => {
  for (let step = 0; step < MICROTASK_FLUSHES; step += 1) {
    await Promise.resolve();
  }
};

/**
 * 폴링 effect 가 모달을 연 뒤 checkSession 마이크로태스크까지 끝낸다.
 * delay 0 타이머는 여기서 밀지 않는다. 닫힌 직후 재오픈과 겹치지 않게 하기 위함.
 */
const renderAndSettle = async() => {
  await act(async() => {
    renderModal();
    await flushMicrotasks();
  });
};

describe('SessionIdleWarningModal 유휴 만료 로그아웃', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(CLOCK_BASE_MS);
    useSession.mockReset();
    sessionManager.getUser.mockReset();
    sessionManager.getSessionInfo.mockReset();
    redirectToLoginPageOnce.mockClear();
    getCurrentLocationReturnUrl.mockReset();
    getCurrentLocationReturnUrl.mockReturnValue(RETURN_PATH);
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it('활성 창은 유휴 경고 임계보다 짧다', () => {
    expect(ACTIVE_WINDOW_SEC * MS_PER_SECOND).toBeLessThan(SESSION_IDLE_WARNING_MS);
  });

  it('카운트다운이 0이면 checkSession 이 true 여도 logout 을 한 번 호출한다', async() => {
    // Given — remaining 0. 재확인이 잔여가 큰 새 스냅을 줘도 연장으로 보지 않는다.
    const expired = sessionInfoAt({
      now: CLOCK_BASE_MS,
      maxInactiveSec: ACTIVE_WINDOW_SEC,
      elapsedSec: ACTIVE_WINDOW_SEC
    });
    expect(remainingMsOf(expired, CLOCK_BASE_MS)).toBe(0);

    const logout = jest.fn(() => Promise.resolve());
    let published = expired;
    const checkSession = jest.fn(async() => {
      published = renewedSessionInfo();
      sessionManager.getSessionInfo.mockReturnValue(published);
      return true;
    });
    useSession.mockImplementation(() => ({
      user: SIGNED_IN_USER,
      sessionInfo: published,
      checkSession,
      logout
    }));
    sessionManager.getUser.mockReturnValue(SIGNED_IN_USER);
    sessionManager.getSessionInfo.mockReturnValue(expired);

    // When
    await renderAndSettle();

    // Then — 프로브 스냅의 remaining 이 커도 logout 은 1회
    const probed = sessionManager.getSessionInfo();
    expect(probed.clientReceivedAt).toBeGreaterThan(expired.clientReceivedAt);
    expect(remainingMsOf(probed, CLOCK_BASE_MS)).toBeGreaterThan(SESSION_IDLE_WARNING_MS);
    expect(checkSession).toHaveBeenCalledWith(true, { silent: true, idleExpiry: true });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith(expect.objectContaining({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY,
      returnPath: RETURN_PATH
    }));

    await act(async() => {
      jest.advanceTimersByTime(DUPLICATE_GUARD_ADVANCE_MS);
      await flushMicrotasks();
    });
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('수동 로그아웃 버튼은 복귀 보존 옵션 없이 logout 한다', async() => {
    const sessionInfo = sessionInfoAt({
      now: CLOCK_BASE_MS,
      maxInactiveSec: ACTIVE_WINDOW_SEC,
      elapsedSec: 0
    });
    const logout = jest.fn(() => Promise.resolve());
    const checkSession = jest.fn().mockResolvedValue(true);
    useSession.mockReturnValue({
      user: SIGNED_IN_USER,
      sessionInfo,
      checkSession,
      logout
    });
    sessionManager.getUser.mockReturnValue(SIGNED_IN_USER);
    sessionManager.getSessionInfo.mockReturnValue(sessionInfo);

    await renderAndSettle();
    expect(screen.getByTestId('session-idle-logout')).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByTestId('session-idle-logout'));
      await flushMicrotasks();
    });

    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith();
    expect(logout.mock.calls[0]).toEqual([]);
  });

  it('0 전에 연장을 누르면 logout 하지 않는다', async() => {
    // Given — 경고 창 안, 아직 만료 전. 연장 성공 시 컨텍스트는 긴 창으로 갱신된다.
    const sessionInfo = sessionInfoAt({
      now: CLOCK_BASE_MS,
      maxInactiveSec: ACTIVE_WINDOW_SEC,
      elapsedSec: 0
    });
    expect(remainingMsOf(sessionInfo, CLOCK_BASE_MS)).toBe(ACTIVE_WINDOW_SEC * MS_PER_SECOND);

    const logout = jest.fn(() => Promise.resolve());
    let published = sessionInfo;
    const checkSession = jest.fn(async() => {
      published = renewedSessionInfo();
      sessionManager.getSessionInfo.mockReturnValue(published);
      return true;
    });
    useSession.mockImplementation(() => ({
      user: SIGNED_IN_USER,
      sessionInfo: published,
      checkSession,
      logout
    }));
    sessionManager.getUser.mockReturnValue(SIGNED_IN_USER);
    sessionManager.getSessionInfo.mockReturnValue(sessionInfo);

    await renderAndSettle();

    expect(screen.getByTestId('session-idle-extend')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    // When — 0 전에 연장. 만료 경로가 타면 getUser 가 있어 logout 이 불린다.
    await act(async() => {
      fireEvent.click(screen.getByTestId('session-idle-extend'));
      await flushMicrotasks();
    });
    await act(async() => {
      jest.advanceTimersByTime(ACTIVE_WINDOW_SEC * MS_PER_SECOND + PAST_EXPIRY_SLACK_MS);
      await flushMicrotasks();
    });

    // Then — 연장 경로는 checkSession(true) 한 인자. idleExpiry 로 부르지 않는다.
    expect(logout).not.toHaveBeenCalled();
    expect(checkSession).toHaveBeenCalledTimes(1);
    expect(checkSession).toHaveBeenCalledWith(true);
    expect(checkSession).not.toHaveBeenCalledWith(
      true,
      expect.objectContaining({ idleExpiry: true })
    );
  });

  const renderExpiredWithClearedUser = (logout) => {
    const expired = sessionInfoAt({
      now: CLOCK_BASE_MS,
      maxInactiveSec: ACTIVE_WINDOW_SEC,
      elapsedSec: ACTIVE_WINDOW_SEC
    });
    const checkSession = jest.fn().mockResolvedValue(false);
    useSession.mockReturnValue({
      user: SIGNED_IN_USER,
      sessionInfo: expired,
      checkSession,
      logout
    });
    sessionManager.getUser.mockReturnValue(null);
    sessionManager.getSessionInfo.mockReturnValue(expired);
    return { checkSession };
  };

  it('current-user 401 로 사용자가 비면 logout 을 한 번 호출하고 로그인으로 보낸다', async() => {
    // Given — 만료 재확인(current-user 401)이 사용자를 비운 뒤 false
    const logout = jest.fn(() => Promise.resolve());
    const { checkSession } = renderExpiredWithClearedUser(logout);

    // When
    await renderAndSettle();
    await act(async() => {
      jest.advanceTimersByTime(DUPLICATE_GUARD_ADVANCE_MS);
      await flushMicrotasks();
    });

    // Then — 서버 로그아웃 1회(복귀 보존), 잡아 둔 경로로 로그인 이동 1회
    expect(checkSession).toHaveBeenCalledWith(true, { silent: true, idleExpiry: true });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY,
      returnPath: RETURN_PATH
    });
    expect(redirectToLoginPageOnce).toHaveBeenCalledTimes(1);
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({ returnUrl: RETURN_PATH });
    expect(screen.queryByTestId('session-idle-extend')).not.toBeInTheDocument();
  });

  it('logout 이 거절돼도 로그인으로 보낸다', async() => {
    // Given
    const logout = jest.fn(() => Promise.reject(new Error('logout failed')));
    renderExpiredWithClearedUser(logout);

    // When
    await renderAndSettle();

    // Then
    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY,
      returnPath: RETURN_PATH
    });
    expect(redirectToLoginPageOnce).toHaveBeenCalledTimes(1);
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({ returnUrl: RETURN_PATH });
    expect(screen.queryByTestId('session-idle-extend')).not.toBeInTheDocument();
  });
});
