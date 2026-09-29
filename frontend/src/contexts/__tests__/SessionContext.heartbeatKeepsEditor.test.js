/**
 * silent checkSession 이 같은 userId 의 새 객체를 넣어도
 * [user] 로드 effect 가 다시 돌지 않고 편집 입력은 남는다.
 * 초기에는 「데이터를 불러오는 중...」만 보인다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import React, { useEffect, useState } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider, useSession } from '../SessionContext';
import { AdminShellContext } from '../AdminShellContext';
import AdminCommonLayout from '../../components/layout/AdminCommonLayout';
import { sessionManager } from '../../utils/sessionManager';

jest.mock('../../utils/menuApi', () => ({
  getLnbMenus: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

jest.mock('../../components/dashboard-v2/templates', () => ({
  DesktopLayout: ({ children }) => <div>{children}</div>,
  MobileLayout: ({ children }) => <div>{children}</div>
}));

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
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../components/common/UnifiedLoading', () => ({ text }) => (
  <div data-testid="unified-loading">{text}</div>
));

const LOADING_TEXT = '데이터를 불러오는 중...';
const SERVER_TITLE = 'server-title';

const SHELL = {
  isInsideAdminShell: true,
  setShellMeta: () => {}
};

let editorLoads = 0;
let sessionApi = null;
let releaseInitialCheck = null;

function sameUserPayload() {
  return {
    id: 7,
    role: 'ADMIN',
    name: '관리',
    tenantId: 'tenant-a',
    permissionGroupCodes: ['OPS']
  };
}

function HeartbeatEditor() {
  const { user, isLoading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (sessionLoading || !user) {
      return undefined;
    }
    editorLoads += 1;
    setLoading(true);
    setTitle(SERVER_TITLE);
    setLoading(false);
    return undefined;
  }, [sessionLoading, user]);

  return (
    <AdminCommonLayout loading={loading}>
      <input
        data-testid="editor-title"
        aria-label="편집"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
    </AdminCommonLayout>
  );
}

function SessionProbe() {
  sessionApi = useSession();
  return null;
}

describe('SessionContext heartbeat keeps editor input', () => {
  beforeEach(() => {
    editorLoads = 0;
    sessionApi = null;
    releaseInitialCheck = null;
    jest.clearAllMocks();
    sessionManager.checkSession.mockImplementation(() => new Promise((resolve) => {
      releaseInitialCheck = resolve;
    }));
    sessionManager.getUser.mockImplementation(() => sameUserPayload());
    sessionManager.getSessionInfo.mockImplementation(() => ({
      lastAccessedTime: Date.now(),
      clientReceivedAt: Date.now(),
      isAuthenticated: true
    }));
    sessionManager.isLoggedIn.mockReturnValue(true);
  });

  it('초기 로드는 로딩 문구를 보여주고, 같은 userId ping 은 폼과 입력을 유지한다', async() => {
    render(
      <SessionProvider>
        <AdminShellContext.Provider value={SHELL}>
          <HeartbeatEditor />
          <SessionProbe />
        </AdminShellContext.Provider>
      </SessionProvider>
    );

    expect(screen.getByTestId('unified-loading')).toHaveTextContent(LOADING_TEXT);
    expect(screen.queryByTestId('editor-title')).not.toBeInTheDocument();

    await act(async() => {
      releaseInitialCheck(true);
    });

    const input = screen.getByTestId('editor-title');
    expect(input).toHaveValue(SERVER_TITLE);
    expect(editorLoads).toBe(1);
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: '작성중' } });
    expect(input).toHaveValue('작성중');

    sessionManager.checkSession.mockResolvedValue(true);
    await act(async() => {
      await sessionApi.checkSession(true, { silent: true });
    });

    expect(editorLoads).toBe(1);
    expect(screen.getByTestId('editor-title')).toBe(input);
    expect(screen.getByTestId('editor-title')).toHaveValue('작성중');
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    expect(sessionApi.user).toMatchObject({ id: 7, name: '관리' });
  });

  it('다른 userId 이면 편집 값을 서버 스냅샷으로 다시 불러온다', async() => {
    sessionManager.checkSession.mockResolvedValue(true);

    render(
      <SessionProvider>
        <AdminShellContext.Provider value={SHELL}>
          <HeartbeatEditor />
          <SessionProbe />
        </AdminShellContext.Provider>
      </SessionProvider>
    );

    await act(async() => {
      await Promise.resolve();
    });

    const input = await screen.findByTestId('editor-title');
    fireEvent.change(input, { target: { value: '작성중' } });
    const loadsAfterOpen = editorLoads;

    sessionManager.getUser.mockImplementation(() => ({
      id: 8,
      role: 'ADMIN',
      name: '다른',
      tenantId: 'tenant-a'
    }));
    await act(async() => {
      await sessionApi.checkSession(true, { silent: true });
    });

    expect(editorLoads).toBe(loadsAfterOpen + 1);
    expect(screen.getByTestId('editor-title')).toHaveValue(SERVER_TITLE);
    expect(sessionApi.user.id).toBe(8);
  });
});
