/**
 * SessionIdleWarningModal — 만료 시각이 정수 초에서 1·500·999ms 어긋나도
 * 카운트다운 0 이후 logout(→ /login?logout=success) 을 정확히 한 번 호출한다.
 * (#1723 검증 FAIL: 표시 초가 0 으로 고정된 뒤 만료 판정이 다시 돌지 않던 회귀)
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

/* eslint-disable import/first -- jest.mock 이후 import */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SessionIdleWarningModal from '../SessionIdleWarningModal';
import { useSession } from '../../../contexts/SessionContext';
import { sessionManager } from '../../../utils/sessionManager';
import { SESSION_IDLE_WARNING_MS } from '../../../constants/session';
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

/** 정수 초 잔여 — 경고 임계 안이라 마운트 직후 모달이 열린다 */
const BASE_REMAINING_SEC = 4;
const OFFSETS_MS = [1, 500, 999];
/** 만료 후 여유를 두고 1초씩 진행할 횟수 */
const TICKS_PAST_EXPIRY = BASE_REMAINING_SEC + 6;

const sessionInfoWithOffset = (offsetMs) => {
  const lastAccessedTime = CLOCK_BASE_MS - (ACTIVE_WINDOW_SEC - BASE_REMAINING_SEC) * MS_PER_SECOND + offsetMs;
  return {
    isAuthenticated: true,
    maxInactiveInterval: ACTIVE_WINDOW_SEC,
    lastAccessedTime,
    serverNow: CLOCK_BASE_MS,
    clientReceivedAt: CLOCK_BASE_MS
  };
};

describe('SessionIdleWarningModal 만료 시각 ms 어긋남', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(CLOCK_BASE_MS);
    useSession.mockReset();
    sessionManager.getUser.mockReset();
    sessionManager.getSessionInfo.mockReset();
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it.each(OFFSETS_MS)('잔여 %pms 어긋남이어도 0 이후 logout 을 한 번만 호출한다', async(offsetMs) => {
    // Given
    const sessionInfo = sessionInfoWithOffset(offsetMs);
    expect(remainingMsOf(sessionInfo, CLOCK_BASE_MS)).toBe(BASE_REMAINING_SEC * MS_PER_SECOND + offsetMs);
    const logout = jest.fn(() => Promise.resolve());
    const checkSession = jest.fn().mockResolvedValue(true);
    useSession.mockReturnValue({ user: SIGNED_IN_USER, sessionInfo, checkSession, logout });
    sessionManager.getUser.mockReturnValue(SIGNED_IN_USER);
    sessionManager.getSessionInfo.mockReturnValue(sessionInfo);

    await renderAndSettle();
    expect(screen.getByTestId('session-idle-extend')).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    // When — 1초 틱으로 만료를 지나 충분히 진행
    for (let tick = 0; tick < TICKS_PAST_EXPIRY; tick += 1) {
      // eslint-disable-next-line no-await-in-loop
      await act(async() => {
        jest.advanceTimersByTime(MS_PER_SECOND);
        await flushMicrotasks();
      });
    }

    // Then — 유휴 만료 재확인 후 logout 1회 (logout 이 /login?logout=success 로 보낸다)
    expect(checkSession).toHaveBeenCalledWith(true, { silent: true, idleExpiry: true });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('session-idle-extend')).not.toBeInTheDocument();
  });
});
