/**
 * 내담자 화면 — 공통 세션 준비 훅으로만 로드 시작 · 전역 세션 재확인(isLoading)에 「불러오는 중」 고착 없음
 * 메시지: 공통 page/size(6) + MGPagination
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { CLIENT_WEB_SUITE_COPY } from '../../../constants/clientWebSuiteConstants';
import { CLIENT_NOTIFICATION_LIST_PAGE_SIZE } from '../../../constants/pagedList';
import ClientSchedule from '../ClientSchedule';
import ClientSessionManagement from '../ClientSessionManagement';
import ClientMessageScreen from '../ClientMessageScreen';

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: jest.fn(),
  SessionContext: jest.requireActual('react').createContext(null)
}));

jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn(), removeToast: jest.fn(), toasts: [] })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ title, main, aside, children }) => (
    <div data-testid="page-shell">
      <h1>{title}</h1>
      {main}
      {aside}
      {children}
    </div>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, vars) => {
      if (key === 'common:pagination.rangeSummary' && vars) {
        return `전체 ${vars.total}건 중 ${vars.start}–${vars.end}건 · ${vars.page}페이지 / 총 ${vars.totalPages}페이지`;
      }
      return key;
    }
  })
}));

import { useSession } from '../../../contexts/SessionContext';

const CLIENT_USER = { id: 101, role: 'CLIENT', tenantId: 'tenant-test', name: '테스트' };

let currentSession;
const setSession = (overrides) => {
  currentSession = {
    user: null,
    isLoggedIn: false,
    isLoading: false,
    hasCheckedSession: false,
    ...overrides
  };
};

const renderScreen = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

const LOADING_TEXT = CLIENT_WEB_SUITE_COPY.SCHEDULE_LOADING;

const buildMessages = (from, count) => Array.from({ length: count }, (_, i) => ({
  id: from + i,
  title: `메시지 ${from + i}`,
  content: '내용',
  messageType: 'GENERAL',
  isRead: true,
  sentAt: '2026-10-01T10:00:00'
}));

beforeEach(() => {
  jest.clearAllMocks();
  useSession.mockImplementation(() => currentSession);
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  StandardizedApi.get.mockImplementation((url, params) => {
    if (url.startsWith('/api/v1/consultation-messages/client/')) {
      const page = params?.page ?? 0;
      const size = params?.size ?? CLIENT_NOTIFICATION_LIST_PAGE_SIZE;
      const totalElements = size + 3;
      return Promise.resolve({
        messages: page === 0 ? buildMessages(0, size) : buildMessages(size, 3),
        totalElements,
        totalPages: 2
      });
    }
    if (url === '/api/v1/admin/mappings/client') {
      return Promise.resolve({ mappings: [], count: 0 });
    }
    return Promise.resolve([]);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each([
  ['ClientSchedule', () => <ClientSchedule />],
  ['ClientSessionManagement', () => <ClientSessionManagement />],
  ['ClientMessageScreen', () => <ClientMessageScreen />]
])('%s — 세션 준비 게이트', (name, makeElement) => {
  test('세션 확인 전에는 API 를 부르지 않고, 준비되면 한 번 읽는다', async() => {
    setSession({ hasCheckedSession: false });
    const view = renderScreen(makeElement());
    expect(StandardizedApi.get).not.toHaveBeenCalled();

    setSession({ user: CLIENT_USER, isLoggedIn: true, hasCheckedSession: true });
    view.rerender(<MemoryRouter>{makeElement()}</MemoryRouter>);
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText(LOADING_TEXT)).toBeNull());
    StandardizedApi.get.mock.calls.forEach(([url]) => expect(url).not.toMatch(/auth\/current-user/));
  });

  test('로드 뒤 전역 세션 재확인(isLoading=true)이 와도 다시 「불러오는 중」으로 돌아가지 않는다', async() => {
    setSession({ user: CLIENT_USER, isLoggedIn: true, hasCheckedSession: true });
    const view = renderScreen(makeElement());
    await waitFor(() => expect(screen.queryByText(LOADING_TEXT)).toBeNull());
    const callsAfterLoad = StandardizedApi.get.mock.calls.length;

    setSession({ user: { ...CLIENT_USER }, isLoggedIn: true, hasCheckedSession: true, isLoading: true });
    view.rerender(<MemoryRouter>{makeElement()}</MemoryRouter>);
    expect(screen.queryByText(LOADING_TEXT)).toBeNull();

    setSession({ user: { ...CLIENT_USER }, isLoggedIn: true, hasCheckedSession: true, isLoading: false });
    view.rerender(<MemoryRouter>{makeElement()}</MemoryRouter>);
    expect(StandardizedApi.get.mock.calls.length).toBe(callsAfterLoad);
  });

  test('본인 id 로만 조회한다', async() => {
    setSession({ user: CLIENT_USER, isLoggedIn: true, hasCheckedSession: true });
    renderScreen(makeElement());
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
    const [url, params] = StandardizedApi.get.mock.calls[0];
    const idInRequest = params?.clientId ?? params?.userId ?? url.split('/').pop();
    expect(String(idInRequest)).toBe(String(CLIENT_USER.id));
  });
});

describe('ClientMessageScreen — 공통 page/size + MGPagination', () => {
  test('size 6 첫 페이지 · 범위 안내 · 2페이지로 교체', async() => {
    setSession({ user: CLIENT_USER, isLoggedIn: true, hasCheckedSession: true });
    renderScreen(<ClientMessageScreen />);
    expect(await screen.findAllByTestId('client-messages-message-item')).toHaveLength(
      CLIENT_NOTIFICATION_LIST_PAGE_SIZE
    );
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      `/api/v1/consultation-messages/client/${CLIENT_USER.id}`,
      { page: 0, size: CLIENT_NOTIFICATION_LIST_PAGE_SIZE, sort: 'createdAt,desc' }
    );
    expect(screen.getByText(/전체 9건 중 1–6건/)).toBeInTheDocument();

    await act(async() => {
      fireEvent.click(screen.getByRole('button', { name: '2' }));
    });
    await waitFor(() => expect(screen.getAllByTestId('client-messages-message-item')).toHaveLength(3));
    expect(StandardizedApi.get).toHaveBeenLastCalledWith(
      `/api/v1/consultation-messages/client/${CLIENT_USER.id}`,
      { page: 1, size: CLIENT_NOTIFICATION_LIST_PAGE_SIZE, sort: 'createdAt,desc' }
    );
    expect(screen.getByText(/전체 9건 중 7–9건/)).toBeInTheDocument();
  });
});
