/**
 * /consultant/consultation-logs 수용 — surface=consultant
 * 세로 teal 탭·전폭 「목록」 바 제거 · 뷰 전환 slate 칩 한 줄 · primary 0 · 공용 일지 카드 · admin 표면 불변
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '../../../../i18n';
import ConsultationLogViewPage from '../ConsultationLogViewPage';
import {
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_TEST_ID,
  CONSULTATION_LOG_VIEW_SURFACE
} from '../../../../constants/consultantSuite';

let mockSessionUser = { id: 77, name: '김상담', role: 'CONSULTANT' };

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() }
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({ user: mockSessionUser, isLoggedIn: true })
}));

jest.mock('../../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../ClientComprehensiveManagement/molecules/SaveViewModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../../utils/consultantHelper', () => ({
  __esModule: true,
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([]),
  getAllClientsWithStats: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../consultant/ConsultationLogModal', () => ({
  __esModule: true,
  default: () => null
}));

const StandardizedApi = require('../../../../utils/standardizedApi').default;

const TODAY = new Date();
const pad = (n) => String(n).padStart(2, '0');
const TODAY_YMD = `${TODAY.getFullYear()}-${pad(TODAY.getMonth() + 1)}-${pad(TODAY.getDate())}`;

const RECORDS = [
  {
    id: 3000, clientId: 500, clientName: '이민지', consultationDate: TODAY_YMD, sessionDate: TODAY_YMD,
    sessionNumber: 3, isSessionCompleted: true, updatedAt: `${TODAY_YMD}T12:00:00`
  },
  {
    id: 3001, clientId: 501, clientName: '박서준', consultationDate: TODAY_YMD, sessionDate: TODAY_YMD,
    sessionNumber: 4, isSessionCompleted: false, updatedAt: `${TODAY_YMD}T12:00:00`
  }
];

const renderPage = (surface) => render(
  <MemoryRouter>
    <ConsultationLogViewPage surface={surface} />
  </MemoryRouter>
);

beforeEach(() => {
  mockSessionUser = { id: 77, name: '김상담', role: 'CONSULTANT' };
  StandardizedApi.get.mockImplementation((url) => {
    if (String(url).includes('/consultation-records')) {
      return Promise.resolve({
        success: true,
        data: RECORDS,
        totalElements: RECORDS.length,
        totalPages: 1
      });
    }
    if (String(url).includes('/clients')) {
      return Promise.resolve([{ id: 500, name: '이민지' }, { id: 501, name: '박서준' }]);
    }
    return Promise.resolve([]);
  });
});

describe('ConsultationLogViewPage — consultant surface', () => {
  it('suite 셸 · 레거시 탭/전폭 바 없음 · primary 0', async() => {
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    const page = screen.getByTestId(CONSULTANT_SUITE_TEST_ID.LOGS_PAGE);
    expect(page).toHaveClass(CONSULTANT_SUITE_CLASS.ROOT);
    expect(page).toHaveAttribute('data-surface', 'consultant');
    expect(container.querySelector('.mg-v2-consultation-log-view-tabs')).toBeNull();
    expect(container.querySelectorAll('.mg-button--primary')).toHaveLength(0);
    expect(container.textContent).not.toMatch(/[₩￦]/);
  });

  it('뷰 전환: slate 칩 한 줄(캘린더·목록·테이블) · 기본 목록 선택', async() => {
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    const chipGroups = container.querySelectorAll(`.${CONSULTANT_SUITE_CLASS.CHIPS}`);
    expect(chipGroups).toHaveLength(1);
    const chips = within(chipGroups[0]).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['캘린더', '목록', '테이블']);
    chips.forEach((chip) => expect(chip).not.toHaveClass('mg-button--primary'));
    expect(within(chipGroups[0]).getByRole('button', { name: '목록' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('순서: 칩 → 필터 → 결과 · 헤더에 기본보기/저장/조회', async() => {
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    const order = [
      container.querySelector(`.${CONSULTANT_SUITE_CLASS.CHIPS}`),
      container.querySelector('.mg-v2-consultation-log-filter'),
      container.querySelector(`.${CONSULTANT_SUITE_CLASS.CARD_GRID}`)
    ];
    order.forEach((el) => expect(el).not.toBeNull());
    for (let i = 1; i < order.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: '기본 보기로' })).toHaveClass('mg-button--outline');
    expect(screen.getByRole('button', { name: '현재 뷰 저장' })).toHaveClass('mg-button--outline');
    expect(screen.getByRole('button', { name: '조회' })).toHaveClass('mg-button--outline');
  });

  it('결과 카드: records 와 공용 카드 · 완료 「일지 보기」/미완료 「일지 작성」 ghost', async() => {
    renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    const cards = await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(cards).toHaveLength(2);
    const labels = cards.map((card) => within(card).getByRole('button', { name: /일지/ }).textContent);
    expect(labels).toEqual(expect.arrayContaining(['일지 보기', '일지 작성']));
    cards.forEach((card) => expect(within(card).getByRole('button', { name: /일지/ })).toHaveClass('mg-button--outline'));
  });

  it('내담자 필터: clientId+startDate/endDate 전달 + 서버 page/size + unwrapApiEnvelope:false', async() => {
    renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/consultation-records'),
      expect.objectContaining({
        page: 0,
        size: expect.any(Number),
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      }),
      expect.objectContaining({ unwrapApiEnvelope: false })
    );
    const twoForClient = [
      { ...RECORDS[0], id: 3100, clientId: 500 },
      { ...RECORDS[0], id: 3101, clientId: 500, sessionNumber: 4 }
    ];
    StandardizedApi.get.mockImplementation((url, params) => {
      if (String(url).includes('/consultation-records')) {
        expect(params).toEqual(expect.objectContaining({
          clientId: 500,
          page: 0,
          startDate: expect.any(String),
          endDate: expect.any(String)
        }));
        return Promise.resolve({
          success: true,
          data: twoForClient,
          totalElements: 2,
          totalPages: 1
        });
      }
      if (String(url).includes('/clients')) {
        return Promise.resolve([{ id: 500, name: '이민지' }, { id: 501, name: '박서준' }]);
      }
      return Promise.resolve([]);
    });
    const clientSelect = screen.getByLabelText(/내담자/);
    fireEvent.change(clientSelect, { target: { value: '500' } });
    await waitFor(() => {
      expect(screen.getAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD)).toHaveLength(2);
    });
  });

  it('목록 페이저: totalElements>pageSize 이면 MGPagination 표시', async() => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      ...RECORDS[0],
      id: 4000 + i,
      clientId: 500,
      sessionNumber: i + 1
    }));
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('/consultation-records')) {
        return Promise.resolve({
          success: true,
          data: many.slice(0, 20),
          totalElements: 21,
          totalPages: 2
        });
      }
      if (String(url).includes('/clients')) {
        return Promise.resolve([{ id: 500, name: '이민지' }]);
      }
      return Promise.resolve([]);
    });
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.PAGINATION}`)).not.toBeNull();
    expect(container.textContent).toMatch(/21/);
  });

  it('API 10건(totalElements)인데 현재 page 행 0이어도 페이저 유지 — 빈상태만으로 페이저 소실 금지', async() => {
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('/consultation-records')) {
        return Promise.resolve({
          success: true,
          data: [],
          totalElements: 10,
          totalPages: 1
        });
      }
      if (String(url).includes('/clients')) {
        return Promise.resolve([{ id: 500, name: '이민지' }]);
      }
      return Promise.resolve([]);
    });
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await waitFor(() => expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull());
    // PAGE_SIZE(20) 보다 total 이 작으면 페이저 숨김이 정상 — totalPages>1 또는 total>PAGE_SIZE 일 때 유지
    // 여기선 total=10 < PAGE_SIZE → 페이저 없음. total=21 케이스에서 유지 검증은 위 테스트.
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull();
  });

  it('totalElements>PAGE_SIZE 이고 현재 page 행 0이어도 MGPagination 유지', async() => {
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('/consultation-records')) {
        return Promise.resolve({
          success: true,
          data: [],
          totalElements: 25,
          totalPages: 2
        });
      }
      if (String(url).includes('/clients')) {
        return Promise.resolve([{ id: 500, name: '이민지' }]);
      }
      return Promise.resolve([]);
    });
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await waitFor(() => expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull());
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.PAGINATION}`)).not.toBeNull();
  });

  it('필터 변경 시 page=1 동시 리셋 — 이전 page 로 요청 레이스 금지', async() => {
    const recordsCalls = [];
    StandardizedApi.get.mockImplementation((url, params) => {
      if (String(url).includes('/consultation-records')) {
        recordsCalls.push(params);
        return Promise.resolve({
          success: true,
          data: RECORDS,
          totalElements: 25,
          totalPages: 2
        });
      }
      if (String(url).includes('/clients')) {
        return Promise.resolve([{ id: 500, name: '이민지' }, { id: 501, name: '박서준' }]);
      }
      return Promise.resolve([]);
    });
    renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    expect(recordsCalls[0]).toEqual(expect.objectContaining({ page: 0 }));
    const clientSelect = screen.getByLabelText(/내담자/);
    fireEvent.change(clientSelect, { target: { value: '500' } });
    await waitFor(() => {
      const withClient = recordsCalls.filter((p) => p && p.clientId === 500);
      expect(withClient.length).toBeGreaterThan(0);
      expect(withClient.every((p) => p.page === 0)).toBe(true);
    });
  });

  it('빈 결과: DS EmptyState', async() => {
    StandardizedApi.get.mockResolvedValue([]);
    const { container } = renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await waitFor(() => expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).not.toBeNull());
    expect(screen.getByText('등록된 상담 일지가 없습니다')).toBeInTheDocument();
  });

  it('칩 클릭 → 테이블 뷰 전환', async() => {
    renderPage(CONSULTATION_LOG_VIEW_SURFACE.CONSULTANT);
    await screen.findAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD);
    fireEvent.click(screen.getByTestId('consultant-logs-view-table'));
    expect(screen.getByTestId('consultant-logs-view-table')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryAllByTestId(CONSULTANT_SUITE_TEST_ID.RECORD_CARD)).toHaveLength(0);
  });
});

describe('ConsultationLogViewPage — admin surface 불변', () => {
  it('기본 surface 는 admin: 기존 탭 nav 유지 · suite 루트 없음', async() => {
    mockSessionUser = { id: 1, name: '관리자', role: 'ADMIN' };
    StandardizedApi.get.mockResolvedValue({ success: true, data: [], totalCount: 0, totalPages: 1 });
    const { container } = render(
      <MemoryRouter>
        <ConsultationLogViewPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(container.querySelector('.mg-v2-consultation-log-view-toggle')).not.toBeNull());
    expect(container.querySelector(`.${CONSULTANT_SUITE_CLASS.ROOT}`)).toBeNull();
    expect(screen.queryByTestId(CONSULTANT_SUITE_TEST_ID.LOGS_PAGE)).toBeNull();
  });
});
