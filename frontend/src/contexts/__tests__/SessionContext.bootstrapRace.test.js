/**
 * 마운트 복원(checkSession(true))이 끝나기 전 비강제 checkSession(SessionGuard 등)이
 * 세션을 비우거나 hasCheckedSession 을 확정하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { SessionProvider, useSession } from '../SessionContext';
import { sessionManager } from '../../utils/sessionManager';

jest.mock('../../utils/sessionManager', () => ({
  sessionManager: {
    checkSession: jest.fn(),
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
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

const CLIENT_USER = { id: 101, role: 'CLIENT', tenantId: 'tenant-test' };

let sessionApi = null;

function SessionProbe() {
  sessionApi = useSession();
  return null;
}

describe('SessionContext bootstrap race', () => {
  let releaseBootstrap = null;
  let restoredUser = null;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionApi = null;
    restoredUser = null;
    sessionManager.getUser.mockImplementation(() => restoredUser);
    sessionManager.isLoggedIn.mockImplementation(() => restoredUser !== null);
    sessionManager.checkSession.mockImplementation((force) => {
      if (force) {
        return new Promise((resolve) => {
          releaseBootstrap = resolve;
        });
      }
      return Promise.resolve(restoredUser !== null);
    });
  });

  it('복원 전 비강제 확인은 hasCheckedSession 을 확정하지 않고 복원 결과를 기다린다', async() => {
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>
    );

    let earlyResult;
    await act(async() => {
      earlyResult = await sessionApi.checkSession(false, { silent: true });
    });

    expect(earlyResult).toBe(false);
    expect(sessionApi.hasCheckedSession).toBe(false);
    expect(sessionManager.checkSession).toHaveBeenCalledTimes(1);

    await act(async() => {
      restoredUser = CLIENT_USER;
      releaseBootstrap(true);
    });

    expect(sessionApi.hasCheckedSession).toBe(true);
    expect(sessionApi.user).toEqual(CLIENT_USER);
  });

  it('복원이 끝난 뒤의 비강제 확인은 기존대로 sessionManager 로 위임된다', async() => {
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>
    );

    await act(async() => {
      restoredUser = CLIENT_USER;
      releaseBootstrap(true);
    });

    await act(async() => {
      await sessionApi.checkSession(false, { silent: true });
    });

    expect(sessionManager.checkSession).toHaveBeenCalledTimes(2);
    expect(sessionApi.user).toEqual(CLIENT_USER);
  });
});
