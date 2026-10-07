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
import {
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_TEST_ID
} from '../../../constants/consultantSuite';

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
  useNotification: () => ({ loadUnreadCount: jest.fn(), unreadCount: 0, markMessageAsRead: jest.fn() })
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

jest.mock('../../../hooks/useConfirm', () => ({
  __esModule: true,
  default: () => [jest.fn().mockResolvedValue(false), null],
  useConfirm: () => [jest.fn().mockResolvedValue(false), null]
}));

const { useSession: useContextSession } = require('../../../contexts/SessionContext');
const { useSession: useHookSession } = require('../../../hooks/useSession');
const StandardizedApi = require('../../../utils/standardizedApi').default;

const CONSULTANT = { id: 77, role: 'CONSULTANT', name: '김상담' };
const FORBIDDEN_CTA = /배정|승인|지급|정산하기|선택하기/;

const MAPPINGS = [
  {
    id: 900,
    mappingId: 900,
    status: 'ACTIVE',
    totalSessions: 10,
    usedSessions: 4,
    remainingSessions: 6,
    packageName: '기본 10회',
    lastSessionDate: '2026-10-01',
    client: { id: 500, name: '이민지', phone: '010-0000-0000', email: 'c0@example.test', createdAt: '2026-09-03T10:00:00' }
  },
  {
    id: 901,
    mappingId: 901,
    status: 'SESSIONS_EXHAUSTED',
    totalSessions: 8,
    usedSessions: 8,
    remainingSessions: 0,
    packageName: '패키지 A',
    lastSessionDate: null,
    client: { id: 501, name: '박서준', phone: '010-0000-0001', email: 'c1@example.test', createdAt: '2026-09-03T10:00:00' }
  },
  {
    id: 902,
    mappingId: 902,
    status: 'PENDING_PAYMENT',
    totalSessions: 5,
    usedSessions: 0,
    remainingSessions: 5,
    packageName: '패키지 B',
    lastSessionDate: '2026-09-20',
    client: { id: 502, name: '최유나', phone: '010-0000-0002', email: 'c2@example.test', createdAt: '2026-09-03T10:00:00' }
  }
];

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
  },
  {
    id: 4002, clientId: 502, clientName: '최유나', senderType: 'SYSTEM', title: '결제 완료 안내',
    content: '결제가 완료되었습니다.', messageType: 'PAYMENT_COMPLETION', isRead: true, isImportant: false, isUrgent: false,
    createdAt: '2026-10-05T09:00:00'
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
  { id: 6000, dayOfWeek: 'MONDAY', startTime: '10:00:00', endTime: '18:00:00', duration: 50, isActive: true },
  { id: 6001, dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '12:00', isActive: true }
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
    await screen.findByText(/월요일/);
    const page = expectSuiteShell(container, CONSULTANT_SUITE_TEST_ID.AVAILABILITY_PAGE);
    const primaries = page.querySelectorAll('.mg-button--primary');
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent('상담 가능 시간 추가');
    expect(screen.getByRole('button', { name: '새로고침' })).toHaveClass('mg-button--outline');
  });

  it('슬롯 있는 날만 row 카드 · 「N개 시간」 칩 없음 · Bootstrap 클래스 없음', async() => {
    const { container } = render(<ConsultantAvailability />);
    await screen.findByText(/월요일/);
    expect(container.querySelectorAll('.consultant-availability__day')).toHaveLength(0);
    expect(screen.queryByText(/개 시간/)).toBeNull();
    expect(screen.getAllByText('활성').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('10:00 – 18:00')).toBeInTheDocument();
    expect(container.querySelector('.alert')).toBeNull();
    expect(container.querySelector('.form-control')).toBeNull();
    expect(container.querySelector('.bi')).toBeNull();
    expect(container.querySelector('.day-card')).toBeNull();
    expect(container.innerHTML).not.toMatch(/#3498db/);
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
    StandardizedApi.get.mockResolvedValue({
      mappings: MAPPINGS,
      count: MAPPINGS.length,
      totalElements: MAPPINGS.length,
      totalPages: 1
    });
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

  it('status = mapping.status · simulatedStatus 없음 · 총 N회 · page/size 호출', async() => {
    renderWithRouter(<ConsultantClientList />);
    await screen.findByText('이민지');
    expect(screen.getByText('진행')).toBeInTheDocument();
    expect(screen.getByText('회기 소진')).toBeInTheDocument();
    expect(screen.getByText('결제 대기')).toBeInTheDocument();
    expect(screen.getByText('총 10회')).toBeInTheDocument();
    expect(screen.queryByText('진행중')).toBeNull();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/mappings/consultant/77/clients'),
      expect.objectContaining({ page: 0, size: expect.any(Number) })
    );
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
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('/consultation-messages/')) {
        return Promise.resolve({
          messages: MESSAGES,
          totalElements: MESSAGES.length,
          totalPages: 1
        });
      }
      return Promise.resolve({ mappings: MAPPINGS, totalElements: MAPPINGS.length });
    });
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

  it('유형 칩 slate · suite 카드 · PAYMENT_COMPLETION 라벨 · page/size', async() => {
    const { container } = renderWithRouter(<ConsultantMessages />);
    await screen.findByText('이민지님 회기 안내');
    expectSlateChips(container.querySelector(`.${CONSULTANT_SUITE_CLASS.TOOLBAR}`));
    expect(screen.getByText('전체 유형')).toBeInTheDocument();
    expect(screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW)).toHaveLength(3);
    expect(screen.getAllByText('결제 완료').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('consultant-messages-type-PAYMENT_COMPLETION')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('consultant-messages-type-HOMEWORK'));
    await waitFor(() => {
      const rows = screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.MESSAGE_ROW);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent('박서준님 과제');
      expect(rows[0]).toHaveTextContent('과제 안내');
    });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/consultation-messages/consultant/77'),
      expect.objectContaining({ page: 0, size: expect.any(Number) })
    );
  });

  it('빈 상태: EmptyState + ghost 「첫 메시지 보내기」', async() => {
    StandardizedApi.get.mockResolvedValue({ messages: [], totalElements: 0 });
    const { container } = renderWithRouter(<ConsultantMessages />);
    const cta = await screen.findByRole('button', { name: '첫 메시지 보내기' });
    expect(cta).toHaveClass('mg-button--outline');
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(1);
  });
});

describe('ConsultantRecords P1 수용', () => {
  beforeEach(() => {
    StandardizedApi.get.mockResolvedValue({
      data: RECORDS,
      totalElements: RECORDS.length,
      totalPages: 1
    });
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

  it('카드: 완료 slate 필 · ghost 「일지 보기」 · page/size', async() => {
    renderWithRouter(<ConsultantRecords />);
    const cards = await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('완료')).toHaveClass(CONSULTANT_SUITE_CLASS.PILL);
    const view = within(cards[0]).getByRole('button', { name: /일지/ });
    expect(view).toHaveTextContent('일지 보기');
    expect(view).toHaveClass('mg-button--outline');
    expect(within(cards[0]).queryByText('회기')).toBeNull();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/consultation-records'),
      expect.objectContaining({ page: 0, size: expect.any(Number) })
    );
  });

  it('빈 상태: DS EmptyState · CTA 는 ghost', async() => {
    StandardizedApi.get.mockResolvedValue({ data: [], totalElements: 0 });
    const { container } = renderWithRouter(<ConsultantRecords />);
    await waitFor(() => expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull());
    const empty = container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`);
    within(empty).queryAllByRole('button').forEach((btn) => expect(btn).toHaveClass('mg-button--outline'));
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(0);
  });
});
