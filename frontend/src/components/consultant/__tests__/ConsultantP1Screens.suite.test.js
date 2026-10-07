/**
 * P1 상담사 화면 수용 — availability · clients · messages · consultation-records
 * 공통: dashboard 셸 · suite 루트 · primary ≤1 · slate 칩 · 배정/승인/지급 CTA·₩ 없음 · 레거시 cr-* 없음
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '../../../i18n';
import ConsultantAvailability from '../ConsultantAvailability';
import ConsultantClientList from '../ConsultantClientList';
import ConsultantMessages from '../ConsultantMessages';
import ConsultantRecords from '../ConsultantRecords';
import { CONSULTANT_SUITE_CLASS, CONSULTANT_SUITE_TEST_ID } from '../../../constants/consultantSuite';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, className }) => <div data-testid="admin-common-layout" className={className}>{children}</div>
}));

jest.mock('../ConsultationLogModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../ClientDetailModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../contexts/SessionContext', () => {
  const { createContext } = jest.requireActual('react');
  return {
    useSession: jest.fn(),
    SessionContext: createContext(null)
  };
});

jest.mock('../../../hooks/useSession', () => ({
  useSession: jest.fn()
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ loadUnreadCount: jest.fn(), unreadCount: 0 })
}));

jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }
}));

jest.mock('../../../utils/commonCodeUtils', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn(), success: jest.fn(), error: jest.fn() }
}));

const { useSession: useContextSession } = require('../../../contexts/SessionContext');
const { useSession: useHookSession } = require('../../../hooks/useSession');
const { apiGet } = require('../../../utils/ajax');
const StandardizedApi = require('../../../utils/standardizedApi').default;

const CONSULTANT = { id: 77, role: 'CONSULTANT', name: '김상담' };
const FORBIDDEN_CTA = /배정|승인|지급|정산하기|선택하기/;

const MAPPINGS = ['이민지', '박서준', '최유나'].map((name, i) => ({
  id: 900 + i,
  clientId: 500 + i,
  status: 'ACTIVE',
  totalSessions: 10,
  usedSessions: 4,
  remainingSessions: 6,
  client: { id: 500 + i, name, phone: `010-0000-000${i}`, email: `c${i}@example.test`, createdAt: '2026-09-03T10:00:00' }
}));

const MESSAGES = [
  {
    id: 4000, clientId: 500, clientName: '이민지', senderType: 'CONSULTANT', title: '이민지님 회기 안내',
    content: '과제를 확인해 주세요.', messageType: 'GENERAL', isRead: true, isImportant: false, isUrgent: false,
    createdAt: '2026-10-07T09:30:00'
  },
  {
    id: 4001, clientId: 501, clientName: '박서준', senderType: 'CONSULTANT', title: '박서준님 과제',
    content: '과제 안내입니다.', messageType: 'HOMEWORK', isRead: false, isImportant: true, isUrgent: false,
    createdAt: '2026-10-06T09:31:00'
  }
];

const RECORDS = [
  {
    id: 3000, clientId: 500, clientName: '이민지', sessionDate: '2026-10-01', sessionNumber: 3,
    isSessionCompleted: true, status: 'COMPLETED', title: '이민지 3회기', updatedAt: '2026-10-01T12:00:00'
  },
  {
    id: 3001, clientId: 501, clientName: '박서준', sessionDate: '2026-10-02', sessionNumber: 4,
    isSessionCompleted: true, status: 'COMPLETED', title: '박서준 4회기', updatedAt: '2026-10-02T12:00:00'
  }
];

const AVAILABILITY = [
  { id: 6000, dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '18:00', duration: 50 },
  { id: 6001, dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '12:00' }
];

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

const expectSuiteShell = (container, testId) => {
  expect(screen.getByTestId('admin-common-layout')).toHaveClass('mg-v2-dashboard-layout');
  const page = screen.getByTestId(testId);
  expect(page).toHaveClass(CONSULTANT_SUITE_CLASS.ROOT);
  expect(page).toHaveAttribute('data-surface', 'consultant');
  expect(container.querySelector('[class*="cr-"]')).toBeNull();
  expect(container.textContent).not.toMatch(/[₩￦]/);
  screen.queryAllByRole('button').forEach((btn) => {
    expect(btn.textContent).not.toMatch(FORBIDDEN_CTA);
  });
  return page;
};

const expectSlateChips = (container) => {
  const chips = container.querySelectorAll(`.${CONSULTANT_SUITE_CLASS.CHIP}`);
  expect(chips.length).toBeGreaterThan(0);
  chips.forEach((chip) => {
    expect(chip).not.toHaveClass('mg-button--primary');
    expect(chip).toHaveAttribute('aria-pressed');
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  useContextSession.mockReturnValue({ user: CONSULTANT, isLoggedIn: true, isLoading: false });
  useHookSession.mockReturnValue({ user: CONSULTANT, isLoggedIn: true, isLoading: false });
});

describe('ConsultantAvailability P1 수용', () => {
  beforeEach(() => {
    StandardizedApi.get.mockImplementation((url) => Promise.resolve(
      url.includes('/availability') ? AVAILABILITY : []
    ));
  });

  it('셸 · 헤더 primary 「상담 가능 시간 추가」 1개 + ghost 새로고침', async() => {
    const { container } = render(<ConsultantAvailability />);
    await screen.findByText('50분');
    const page = expectSuiteShell(container, CONSULTANT_SUITE_TEST_ID.AVAILABILITY_PAGE);
    const primaries = page.querySelectorAll('.mg-button--primary');
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent('상담 가능 시간 추가');
    expect(screen.getByRole('button', { name: '새로고침' })).toHaveClass('mg-button--outline');
  });

  it('요일 카드: slate 개수 칩 · 슬롯 행 · 수정/삭제 ghost', async() => {
    const { container } = render(<ConsultantAvailability />);
    await screen.findByText('50분');
    expect(container.querySelectorAll('.consultant-availability__day')).toHaveLength(7);
    expect(screen.getAllByText('1개 시간')).toHaveLength(2);
    expect(screen.getByText('50분')).toBeInTheDocument();
    screen.getAllByRole('button', { name: '수정' }).forEach((btn) => expect(btn).toHaveClass('mg-button--outline'));
    screen.getAllByRole('button', { name: '삭제' }).forEach((btn) => expect(btn).toHaveClass('mg-button--outline'));
    expect(container.querySelector('.consultant-availability-container')).toBeNull();
  });

  it('빈 상태: DS EmptyState · 본문 CTA 없음(헤더와 중복 금지)', async() => {
    StandardizedApi.get.mockResolvedValue([]);
    const { container } = render(<ConsultantAvailability />);
    await screen.findByText('설정된 상담 가능 시간이 없습니다');
    const empty = container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`);
    expect(empty).not.toBeNull();
    expect(within(empty).queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(1);
  });
});

describe('ConsultantClientList P1 수용', () => {
  beforeEach(() => {
    apiGet.mockResolvedValue({ mappings: MAPPINGS, count: MAPPINGS.length });
  });

  it('셸 · slate 안내(role=note) · primary 0 · 카드별 「선택하기」 없음', async() => {
    const { container } = renderWithRouter(<ConsultantClientList />);
    await screen.findByText('이민지');
    const page = expectSuiteShell(container, CONSULTANT_SUITE_TEST_ID.CLIENTS_PAGE);
    expect(within(page).getByRole('note')).toHaveClass(CONSULTANT_SUITE_CLASS.NOTICE);
    expect(page.querySelectorAll('.mg-button--primary')).toHaveLength(0);
    expect(container.querySelector('.mg-v2-client-view-btn')).toBeNull();
  });

  it('검색 + slate 상태 칩 한 줄 툴바 · 「전체 N」 선택', async() => {
    const { container } = renderWithRouter(<ConsultantClientList />);
    await screen.findByText('이민지');
    const toolbar = container.querySelector(`.${CONSULTANT_SUITE_CLASS.TOOLBAR}`);
    expect(within(toolbar).getByRole('searchbox')).toBeInTheDocument();
    expectSlateChips(toolbar);
    expect(within(toolbar).getByRole('button', { name: /^전체 \d+$/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('검색어로 카드 필터링', async() => {
    renderWithRouter(<ConsultantClientList />);
    await screen.findByText('이민지');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '박서준' } });
    await waitFor(() => expect(screen.queryByText('이민지')).toBeNull());
    expect(screen.getByText('박서준')).toBeInTheDocument();
  });
});

describe('ConsultantMessages P1 수용', () => {
  beforeEach(() => {
    apiGet.mockImplementation((url) => Promise.resolve(
      url.includes('/consultation-messages/') ? { messages: MESSAGES } : { mappings: MAPPINGS }
    ));
  });

  it('「새 메시지」는 헤더 h36 primary 1개뿐 · 전폭 바 없음', async() => {
    const { container } = renderWithRouter(<ConsultantMessages />);
    await screen.findByText('이민지님 회기 안내');
    const page = expectSuiteShell(container, CONSULTANT_SUITE_TEST_ID.MESSAGES_PAGE);
    const primaries = page.querySelectorAll('.mg-button--primary');
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent('새 메시지');
    expect(page.querySelector('.consultant-suite__body .mg-button--primary')).toBeNull();
    expect(container.querySelector('.consultant-messages-empty-btn')).toBeNull();
  });

  it('유형 칩 slate · 좌측 정렬 목록 행(button) · 유형 필터 동작', async() => {
    const { container } = renderWithRouter(<ConsultantMessages />);
    await screen.findByText('이민지님 회기 안내');
    expectSlateChips(container.querySelector(`.${CONSULTANT_SUITE_CLASS.TOOLBAR}`));
    expect(screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW)).toHaveLength(2);
    fireEvent.click(screen.getByTestId('consultant-messages-type-HOMEWORK'));
    const rows = screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('박서준님 과제');
    expect(rows[0]).toHaveClass('consultant-messages__row--unread');
  });

  it('빈 상태: EmptyState + ghost 「첫 메시지 보내기」', async() => {
    apiGet.mockResolvedValue({ messages: [] });
    const { container } = renderWithRouter(<ConsultantMessages />);
    const cta = await screen.findByRole('button', { name: '첫 메시지 보내기' });
    expect(cta).toHaveClass('mg-button--outline');
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(1);
  });
});

describe('ConsultantRecords P1 수용', () => {
  beforeEach(() => {
    StandardizedApi.get.mockResolvedValue(RECORDS);
  });

  it('제목 「상담 일지」 · primary 0 · 단일 검색+칩 툴바', async() => {
    const { container } = renderWithRouter(<ConsultantRecords />);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    const page = expectSuiteShell(container, CONSULTANT_SUITE_TEST_ID.RECORDS_PAGE);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('상담 일지');
    expect(page.querySelectorAll('.mg-button--primary')).toHaveLength(0);
    const toolbars = container.querySelectorAll(`.${CONSULTANT_SUITE_CLASS.TOOLBAR}`);
    expect(toolbars).toHaveLength(1);
    expect(within(toolbars[0]).getByRole('searchbox')).toBeInTheDocument();
    expectSlateChips(toolbars[0]);
  });

  it('카드: 완료 slate 배지 · ghost 「일지 보기」', async() => {
    renderWithRouter(<ConsultantRecords />);
    const cards = await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(cards).toHaveLength(2);
    const badge = within(cards[0]).getByText('완료');
    expect(badge).toHaveClass(CONSULTANT_SUITE_CLASS.STATUS);
    const view = within(cards[0]).getByRole('button', { name: /일지/ });
    expect(view).toHaveTextContent('일지 보기');
    expect(view).toHaveClass('mg-button--outline');
  });

  it('빈 상태: DS EmptyState · CTA 는 ghost', async() => {
    StandardizedApi.get.mockResolvedValue([]);
    const { container } = renderWithRouter(<ConsultantRecords />);
    await waitFor(() => expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull());
    const empty = container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`);
    within(empty).queryAllByRole('button').forEach((btn) => expect(btn).toHaveClass('mg-button--outline'));
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(0);
  });
});
