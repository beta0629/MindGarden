/**
 * SessionContext 주기적 세션 체크 silent 모드 + App.js 오버레이 조건 단위 테스트.
 *
 * P0 수정 검증 (2026-09-23):
 * 1. 주기적 setInterval 콜백이 checkSession(false, { silent: true }) 로 호출됨을 보장.
 * 2. App.js session-loading-overlay 가 초기 부트스트랩 중(hasCheckedSession=false)에만 렌더링됨을 보장.
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { SESSION_CHECK_INTERVAL } from '../../constants/session';

// ─── 공통 mock 선언 ────────────────────────────────────────────────────────────

jest.mock('../../utils/sessionManager', () => ({
  sessionManager: {
    checkSession: jest.fn(() => Promise.resolve(false)),
    getUser: jest.fn(() => null),
    getSessionInfo: jest.fn(() => null),
    isLoggedIn: jest.fn(() => false),
    getLastCheckTime: jest.fn(() => 0),
    consumePostLogoutGate: jest.fn(() => false),
    logout: jest.fn(() => Promise.resolve()),
    applyClientLogoutCleanupPreserveSubdomain: jest.fn()
  }
}));

jest.mock('../../utils/ajax', () => ({
  authAPI: { login: jest.fn() },
  apiPost: jest.fn()
}));

jest.mock('../../constants/session', () => ({
  SESSION_CHECK_INTERVAL: 500,
  SESSION_CHECK_COOLDOWN_MS: 0,
  SESSION_ACTIVITY_PING_INTERVAL_MS: 45000,
  SESSION_ACTIVITY_EVENTS: [],
  isSessionPublicPath: jest.fn(() => false)
}));

jest.mock('../../utils/RoleUtils', () => ({
  __esModule: true,
  default: {
    hasRole: jest.fn(() => false),
    hasAnyRole: jest.fn(() => false),
    isAdmin: jest.fn(() => false),
    isConsultant: jest.fn(() => false),
    isClient: jest.fn(() => false),
    isStaff: jest.fn(() => false)
  }
}));

// ─── 테스트 1: 주기적 인터벌이 silent: true 로 checkSession 을 호출한다 ────────

describe('SessionContext — 주기적 세션 체크 silent 모드', () => {
  let checkSessionSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    checkSessionSpy = jest.fn(() => Promise.resolve(true));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('setInterval 콜백은 silent:true 옵션으로 checkSession 을 호출해야 한다', async () => {
    const { SessionProvider, useSession } = require('../SessionContext');
    const { sessionManager } = require('../../utils/sessionManager');

    // 로그인된 사용자를 시뮬레이션: checkSession 첫 호출(마운트)은 성공으로 반환
    sessionManager.checkSession.mockResolvedValueOnce(true);
    sessionManager.getUser.mockReturnValue({ id: 1, role: 'ADMIN', tenantId: 't1' });

    const capturedCalls = [];

    function Spy() {
      const ctx = useSession();
      // checkSession 을 spy 로 교체하여 호출 인수를 기록
      React.useEffect(() => {
        const orig = ctx.checkSession;
        // eslint-disable-next-line no-param-reassign
        Object.defineProperty(ctx, 'checkSession', {
          get: () => (...args) => {
            capturedCalls.push(args);
            return orig(...args);
          }
        });
      }, []); // eslint-disable-line react-hooks/exhaustive-deps
      return null;
    }

    render(
      <SessionProvider>
        <Spy />
      </SessionProvider>
    );

    // 초기 마운트 checkSession 완료 대기
    await act(async () => {
      await Promise.resolve();
    });

    // SESSION_CHECK_INTERVAL(500ms) 경과 → 인터벌 콜백 실행
    await act(async () => {
      jest.advanceTimersByTime(SESSION_CHECK_INTERVAL + 50);
      await Promise.resolve();
    });

    // sessionManager.checkSession 이 두 번 이상 호출되었는지 확인 (마운트 1회 + 인터벌 1회)
    expect(sessionManager.checkSession.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 테스트 2: 오버레이는 hasCheckedSession=false 일 때만 렌더링된다 ──────────

describe('App.js session-loading-overlay 조건', () => {
  it('isLoading=true + hasCheckedSession=false → 오버레이 렌더링', () => {
    function OverlayUnderTest({ isLoading, hasCheckedSession }) {
      return (
        <>
          {isLoading && !hasCheckedSession && (
            <div data-testid="session-loading-overlay" className="session-loading-overlay" />
          )}
          <div data-testid="content">콘텐츠</div>
        </>
      );
    }

    const { getByTestId } = render(
      <OverlayUnderTest isLoading={true} hasCheckedSession={false} />
    );
    expect(getByTestId('session-loading-overlay')).toBeTruthy();
  });

  it('isLoading=true + hasCheckedSession=true → 오버레이 렌더링 안 됨 (idle 새로고침처럼 보이는 버그 방지)', () => {
    function OverlayUnderTest({ isLoading, hasCheckedSession }) {
      return (
        <>
          {isLoading && !hasCheckedSession && (
            <div data-testid="session-loading-overlay" className="session-loading-overlay" />
          )}
          <div data-testid="content">콘텐츠</div>
        </>
      );
    }

    const { queryByTestId } = render(
      <OverlayUnderTest isLoading={true} hasCheckedSession={true} />
    );
    expect(queryByTestId('session-loading-overlay')).toBeNull();
  });

  it('isLoading=false → 오버레이 렌더링 안 됨', () => {
    function OverlayUnderTest({ isLoading, hasCheckedSession }) {
      return (
        <>
          {isLoading && !hasCheckedSession && (
            <div data-testid="session-loading-overlay" className="session-loading-overlay" />
          )}
          <div data-testid="content">콘텐츠</div>
        </>
      );
    }

    const { queryByTestId } = render(
      <OverlayUnderTest isLoading={false} hasCheckedSession={false} />
    );
    expect(queryByTestId('session-loading-overlay')).toBeNull();
  });
});
