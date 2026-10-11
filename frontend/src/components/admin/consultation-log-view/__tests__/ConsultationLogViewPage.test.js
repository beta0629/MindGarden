/**
 * ConsultationLogViewPage — 어드민 상담일지 조회 페이지 단위 테스트.
 *
 * P0 핫픽스 (2026-05-29) 회귀 가드:
 *  - 진입 시 default startDate/endDate ("지난 달 1일 ~ 이번 달 말일") 가 API 호출 params 에 포함.
 *  - 사용자가 기간을 변경하면 새 startDate/endDate 로 재호출.
 *  - 백엔드 응답 records 가 렌더링되고, 빈 응답이어도 React #130 미발생.
 *
 * Early-month truncation 회귀 가드 (2026-09):
 *  - size=200 + unwrapApiEnvelope:false 로 totalPages 를 읽어 전 페이지 수집.
 *  - page0 에 월 후반만 있어도 page1 의 월 초 레코드가 list/calendar SSOT 에 포함.
 *
 * 참고: docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md
 *
 * @author MindGarden
 * @since 2026-05-29
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

const MOCK_ADMIN_USER = { id: 1, name: '관리자', role: 'ADMIN' };
let mockSessionUser = MOCK_ADMIN_USER;

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ success: true, data: [], totalCount: 0, totalPages: 1 }),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => ({
    user: mockSessionUser,
    isLoggedIn: true
  })
}));

jest.mock('../../ClientComprehensiveManagement/molecules/SavedViewControls', () => ({
  __esModule: true,
  default: () => <div data-testid="saved-view-controls" />
}));

jest.mock('../../../../utils/consultantHelper', () => ({
  __esModule: true,
  getAllConsultantsWithStats: jest.fn().mockResolvedValue([]),
  getAllClientsWithStats: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle, actions }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ children }) => <section>{children}</section>
}));

jest.mock('../../../dashboard-v2/content/ContentCard', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading" role="status">{text}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    type = 'button',
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    disabled,
    id
  }) => (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      disabled={disabled}
      id={id}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description, action }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      <p>{description}</p>
      {action}
    </div>
  )
}));

jest.mock('../../../common/ListTableView', () => ({
  __esModule: true,
  default: ({ data, columns, renderCell, caption, selectedRowKey }) => (
    <table data-testid="list-table">
      <caption>{caption}</caption>
      <tbody>
        {(data || []).map((row, i) => (
          <tr key={row.id ?? i} data-testid={`row-${row.id ?? i}`} aria-selected={selectedRowKey === row.id}>
            {(columns || []).map((column) => (
              <td key={column.key}>
                {renderCell ? renderCell(column.key, row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: () => <div data-testid="full-calendar" />
}));
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useSearchParams: () => [new URLSearchParams(''), jest.fn()]
}));

jest.mock('../../../consultant/ConsultationLogModal', () => ({
  __esModule: true,
  default: ({ isOpen, editOnly }) => (
    isOpen ? <div data-testid="record-modal" data-edit-only={editOnly ? 'true' : 'false'} /> : null
  )
}));

jest.mock('../../ConsultationLogViewPage.css', () => ({}), { virtual: true });
jest.mock('../ConsultationLogTableBlock.css', () => ({}), { virtual: true });
jest.mock('../ConsultationLogCalendarBlock.css', () => ({}), { virtual: true });

import '../../../../i18n';
import ConsultationLogViewPage, {
  computeDefaultDateRange,
  fetchAllAdminConsultationRecords,
  fetchConsultationRecordPages,
  normalizeAdminConsultationRecordsPage,
  ADMIN_CONSULTATION_RECORDS_PAGE_SIZE,
  ADMIN_CONSULTATION_RECORDS_MAX_PAGES
} from '../ConsultationLogViewPage';
import { CONSULTATION_LOG_TABLE_PAGE_SIZE } from '../consultationLogQuery';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

const installDesktopMedia = () => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
};

describe('ConsultationLogViewPage — P0 핫픽스 회귀 가드 (2026-05-29)', () => {
  beforeEach(() => {
    installDesktopMedia();
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [],
      totalCount: 0,
      totalPages: 1
    });
    notificationManager.error.mockClear();
    notificationManager.info.mockClear();
  });

  describe('computeDefaultDateRange', () => {
    test('지난 달 1일 ~ 이번 달 말일 을 반환한다', () => {
      const now = new Date(2026, 4, 15); // 2026-05-15
      const { startDate, endDate } = computeDefaultDateRange(now);
      expect(startDate).toBe('2026-04-01');
      expect(endDate).toBe('2026-05-31');
    });

    test('연도 경계 처리: 1월 진입 시 전년 12월 1일 ~ 1월 말일', () => {
      const now = new Date(2026, 0, 10); // 2026-01-10
      const { startDate, endDate } = computeDefaultDateRange(now);
      expect(startDate).toBe('2025-12-01');
      expect(endDate).toBe('2026-01-31');
    });
  });

  describe('normalizeAdminConsultationRecordsPage / fetchAllAdminConsultationRecords', () => {
    test('envelope 응답을 data/totalCount/totalPages 로 정규화한다', () => {
      const normalized = normalizeAdminConsultationRecordsPage({
        success: true,
        data: [{ id: 1 }],
        totalCount: 201,
        totalPages: 2
      });
      expect(normalized).toEqual({
        data: [{ id: 1 }],
        totalCount: 201,
        totalPages: 2
      });
    });

    test('배열-only 응답도 허용한다', () => {
      const normalized = normalizeAdminConsultationRecordsPage([{ id: 9 }]);
      expect(normalized).toEqual({
        data: [{ id: 9 }],
        totalCount: 1,
        totalPages: 1
      });
    });

    test('totalPages 없이 totalCount 만 있으면 pageSize 로 totalPages 를 계산한다', () => {
      const normalized = normalizeAdminConsultationRecordsPage(
        { success: true, data: [], totalCount: 250 },
        200
      );
      expect(normalized.totalPages).toBe(2);
    });

    test('totalPages > 1 이면 page 0..N-1 을 순서대로 수집한다', async () => {
      const apiGet = jest.fn()
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 1, sessionDate: '2026-08-20' }],
          totalCount: 2,
          totalPages: 2
        })
        .mockResolvedValueOnce({
          success: true,
          data: [{ id: 2, sessionDate: '2026-08-01' }],
          totalCount: 2,
          totalPages: 2
        });

      const list = await fetchAllAdminConsultationRecords(apiGet, {
        startDate: '2026-08-01',
        endDate: '2026-09-30'
      });

      expect(apiGet).toHaveBeenCalledTimes(2);
      expect(apiGet.mock.calls[0][1]).toEqual(expect.objectContaining({
        page: 0,
        size: ADMIN_CONSULTATION_RECORDS_PAGE_SIZE,
        startDate: '2026-08-01',
        endDate: '2026-09-30'
      }));
      expect(apiGet.mock.calls[0][2]).toEqual({ unwrapApiEnvelope: false });
      expect(apiGet.mock.calls[1][1]).toEqual(expect.objectContaining({ page: 1, size: 200 }));
      expect(list.map((r) => r.id)).toEqual([1, 2]);
      expect(list.some((r) => r.sessionDate === '2026-08-01')).toBe(true);
    });

    test('공통 목록 모듈 규칙 — size 상한 200, 페이지 상한에서 멈춘다 (전체 dump 금지)', async () => {
      const apiGet = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1 }],
        totalCount: 100000,
        totalPages: 100000
      });
      await fetchAllAdminConsultationRecords(apiGet, { startDate: '2026-08-01', endDate: '2026-09-30' }, {
        pageSize: 100000
      });
      expect(apiGet).toHaveBeenCalledTimes(ADMIN_CONSULTATION_RECORDS_MAX_PAGES);
      apiGet.mock.calls.forEach(([, params]) => {
        expect(params.size).toBe(200);
      });
    });

    test('안전 상한을 넘기면 truncated 로 알리고 침묵 절단하지 않는다', async() => {
      const apiGet = jest.fn().mockResolvedValue({
        success: true,
        data: [{ id: 1 }],
        totalCount: 100000,
        totalPages: 100000
      });
      const result = await fetchConsultationRecordPages(apiGet, '/api/v1/admin/consultation-records', {
        startDate: '2026-08-01',
        endDate: '2026-09-30'
      }, { maxPages: 2, pageSize: 200 });
      expect(apiGet).toHaveBeenCalledTimes(2);
      expect(result.truncated).toBe(true);
      expect(result.totalCount).toBe(100000);
      expect(result.records).toHaveLength(2);
    });
  });

  test('진입 시 startDate/endDate 가 default range 로 API 호출 params 에 포함된다 (표 size)', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());

    const firstCall = StandardizedApi.get.mock.calls[0];
    expect(firstCall[0]).toBe('/api/v1/admin/consultation-records');
    expect(firstCall[1]).toEqual(expect.objectContaining({
      page: 0,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE,
      startDate: expect.stringMatching(/^\d{4}-\d{2}-01$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    }));
    expect(firstCall[2]).toEqual({ unwrapApiEnvelope: false });

    const expected = computeDefaultDateRange();
    expect(firstCall[1].startDate).toBe(expected.startDate);
    expect(firstCall[1].endDate).toBe(expected.endDate);
  });

  test('기간 입력만으로는 재조회하지 않고 조회 버튼을 눌러야 새 기간으로 호출한다', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    const startInput = screen.getByLabelText('시작일');
    const newStart = '2024-01-15';
    await act(async () => {
      fireEvent.change(startInput, { target: { value: newStart } });
    });
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '조회' }));
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    const lastCall = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(expect.objectContaining({
      startDate: newStart,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE
    }));
    expect(lastCall[2]).toEqual({ unwrapApiEnvelope: false });
  });

  test('백엔드 응답 records 가 표에 렌더링된다', async () => {
    const range = computeDefaultDateRange();
    const inRangeDate = range.startDate;
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [
        { id: 101, sessionDate: inRangeDate, clientName: '내담자A', consultantName: '상담사A', isSessionCompleted: true, summaryPreview: '요약A' },
        { id: 102, sessionDate: inRangeDate, clientName: '내담자B', consultantName: '상담사B', isSessionCompleted: false }
      ],
      totalCount: 2,
      totalPages: 1
    });

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    expect(await screen.findByRole('button', { name: `${inRangeDate} 내담자A 상담일지 열기` })).toBeInTheDocument();
    expect(screen.getByText('요약A')).toBeInTheDocument();
    expect(screen.getByText(`총 2건`)).toBeInTheDocument();
  });

  test('records=[] 빈 응답 — EmptyState 표시 및 React #130 미발생', async () => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [],
      totalCount: 0,
      totalPages: 1
    });

    let renderError = null;
    const originalError = console.error;
    console.error = (msg, ...args) => {
      if (typeof msg === 'string' && msg.includes('Minified React error #130')) {
        renderError = msg;
      }
      originalError(msg, ...args);
    };

    try {
      await act(async () => {
        render(<ConsultationLogViewPage />);
      });

      await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
      expect(await screen.findByText('조건에 맞는 상담일지가 없습니다')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: '초기화' }).length).toBeGreaterThan(0);
      expect(renderError).toBeNull();
    } finally {
      console.error = originalError;
    }
  });

  test('불러오는 중에는 로딩 문구를 보여 준다', async () => {
    let resolveGet;
    StandardizedApi.get.mockImplementation(() => new Promise((resolve) => {
      resolveGet = resolve;
    }));
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });
    expect(screen.getByText('상담일지를 불러오는 중입니다')).toBeInTheDocument();
    await act(async () => {
      resolveGet({ success: true, data: [], totalCount: 0, totalPages: 1 });
    });
    expect(await screen.findByText('조건에 맞는 상담일지가 없습니다')).toBeInTheDocument();
  });

  test('조회 실패(403)는 상담사 API로 다시 부르지 않고 다시 시도를 보여 준다', async () => {
    const forbidden = Object.assign(new Error('forbidden'), { status: 403 });
    StandardizedApi.get.mockRejectedValueOnce(forbidden);
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [],
      totalCount: 0,
      totalPages: 1
    });

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    expect(await screen.findByText('상담일지를 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.getByText('네트워크 연결을 확인한 뒤 다시 시도해 주세요.')).toBeInTheDocument();
    expect(screen.queryByText('조건에 맞는 상담일지가 없습니다')).toBeNull();
    expect(notificationManager.error).not.toHaveBeenCalled();
    expect(StandardizedApi.get.mock.calls.some((call) => String(call[0]).includes('consultant-records'))).toBe(false);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('조건에 맞는 상담일지가 없습니다')).toBeInTheDocument();
    expect(StandardizedApi.get.mock.calls.every((call) => call[0] === '/api/v1/admin/consultation-records')).toBe(true);
  });

  test('표는 현재 페이지만 요청하고 다음 페이지는 page 인덱스를 올린다', async () => {
    StandardizedApi.get.mockImplementation((_endpoint, params) => Promise.resolve({
      success: true,
      data: [{ id: params.page === 0 ? 1 : 2, sessionDate: '2026-09-01', clientName: '내담자A', isSessionCompleted: true }],
      totalCount: 40,
      totalPages: 2
    }));

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));
    expect(StandardizedApi.get.mock.calls[0][1]).toEqual(expect.objectContaining({
      page: 0,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE
    }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '다음' }));
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    expect(StandardizedApi.get.mock.calls[1][1]).toEqual(expect.objectContaining({
      page: 1,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE
    }));
  });

  test('사용자가 기간을 비운 뒤 조회하면 기본 기간으로 보완한다', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.change(screen.getByLabelText('시작일'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('종료일'), { target: { value: '' } });
    });
    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '조회' }));
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    const last = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    const fallback = computeDefaultDateRange();
    expect(last[1]).toEqual(expect.objectContaining({
      page: 0,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE,
      startDate: fallback.startDate,
      endDate: fallback.endDate
    }));
  });

  test('표는 한 페이지만 보여주고 캘린더는 월 범위를 이어서 받는다', async () => {
    const range = computeDefaultDateRange();
    const earlyDate = range.startDate;
    const [y, m] = range.startDate.split('-');
    const lateDate = `${y}-${m}-20`;
    const earlyRecord = {
      id: 201,
      sessionDate: earlyDate,
      clientName: '월초내담자',
      consultantName: '상담사X',
      isSessionCompleted: true
    };
    const lateRecord = {
      id: 101,
      sessionDate: lateDate,
      clientName: '월후내담자',
      consultantName: '상담사Y',
      isSessionCompleted: true
    };

    StandardizedApi.get.mockImplementation((_endpoint, params) => {
      if (params?.page === 0) {
        return Promise.resolve({
          success: true,
          data: [lateRecord],
          totalCount: 2,
          totalPages: 2
        });
      }
      if (params?.page === 1) {
        return Promise.resolve({
          success: true,
          data: [earlyRecord],
          totalCount: 2,
          totalPages: 2
        });
      }
      return Promise.resolve({ success: true, data: [], totalCount: 2, totalPages: 2 });
    });

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));
    expect(StandardizedApi.get.mock.calls[0][1]).toEqual(expect.objectContaining({
      page: 0,
      size: CONSULTATION_LOG_TABLE_PAGE_SIZE,
      startDate: range.startDate,
      endDate: range.endDate
    }));
    expect(screen.getByRole('button', { name: `${lateDate} 월후내담자 상담일지 열기` })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `${earlyDate} 월초내담자 상담일지 열기` })).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '캘린더' }));
    });

    await waitFor(() => {
      const pages = StandardizedApi.get.mock.calls.map((call) => call[1]?.page);
      expect(pages).toEqual(expect.arrayContaining([0, 1]));
    });
    const calendarCalls = StandardizedApi.get.mock.calls.filter((call) => call[1]?.size === ADMIN_CONSULTATION_RECORDS_PAGE_SIZE);
    expect(calendarCalls.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('full-calendar')).toBeInTheDocument();
  });

  test('행은 상세 패널만 열고 수정 버튼이 수정 모달을 연다', async () => {
    const range = computeDefaultDateRange();
    const row = {
      id: 101,
      sessionDate: range.startDate,
      clientName: '내담자A',
      consultantName: '상담사A',
      isSessionCompleted: true,
      summaryPreview: '요약A'
    };
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('/consultation-records/')) {
        return Promise.resolve({ success: true, data: { ...row, mainIssues: '본문' } });
      }
      return Promise.resolve({ success: true, data: [row], totalCount: 1, totalPages: 1 });
    });

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    const opener = await screen.findByRole('button', { name: `${range.startDate} 내담자A 상담일지 열기` });
    await act(async () => {
      fireEvent.click(opener);
    });
    expect(screen.getByRole('heading', { name: '상담일지 상세' })).toBeInTheDocument();
    expect(screen.queryByTestId('record-modal')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '수정' }));
    });
    const modal = screen.getByTestId('record-modal');
    expect(modal).toHaveAttribute('data-edit-only', 'true');

    await act(async () => {
      fireEvent.click(opener);
    });
    expect(screen.queryByRole('heading', { name: '상담일지 상세' })).toBeNull();
  });
});

describe('ConsultationLogViewPage — saved view restore race (그록 P0)', () => {
  const originalSessionManager = window.sessionManager;

  beforeEach(() => {
    installDesktopMedia();
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [],
      totalCount: 0,
      totalPages: 1
    });
    localStorage.clear();
    window.sessionManager = {
      getUser: () => ({ id: 1, tenantId: 'tenant-test', name: '관리자', role: 'ADMIN' })
    };
  });

  afterEach(() => {
    window.sessionManager = originalSessionManager;
    localStorage.clear();
  });

  test('localStorage 좁은 filters 복원 후 최종 API params는 저장된 기간이다', async () => {
    const storageKey = 'mg.savedView.v1:tenant-test:1:admin.consultation-logs';
    localStorage.setItem(storageKey, JSON.stringify({
      viewMode: 'list',
      filters: {
        consultantId: 12,
        clientId: null,
        startDate: '2026-03-01',
        endDate: '2026-03-07'
      },
      sort: {},
      density: 'comfortable'
    }));

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    expect(screen.getByLabelText('시작일')).toBeInTheDocument();

    await waitFor(() => {
      const adminCalls = StandardizedApi.get.mock.calls.filter(
        (c) => c[0] === '/api/v1/admin/consultation-records'
      );
      expect(adminCalls.length).toBeGreaterThanOrEqual(1);
      const last = adminCalls[adminCalls.length - 1];
      expect(last[1]).toEqual(expect.objectContaining({
        startDate: '2026-03-01',
        endDate: '2026-03-07',
        consultantId: 12,
        size: CONSULTATION_LOG_TABLE_PAGE_SIZE
      }));
    });

    const defaultRange = computeDefaultDateRange();
    const adminCalls = StandardizedApi.get.mock.calls.filter(
      (c) => c[0] === '/api/v1/admin/consultation-records'
    );
    expect(adminCalls.every((c) => (
      c[1]?.startDate === '2026-03-01' && c[1]?.endDate === '2026-03-07'
    ))).toBe(true);
    expect(defaultRange.startDate).not.toBe('2026-03-01');
  });
});

describe('ConsultationLogViewPage — 상담일지 본문 진입 권한 (사무원 제외)', () => {
  const range = computeDefaultDateRange();
  const row = {
    id: 501,
    sessionDate: range.startDate,
    consultationDate: range.startDate,
    clientName: '내담자S',
    isSessionCompleted: true
  };

  beforeEach(() => {
    installDesktopMedia();
    StandardizedApi.get.mockReset();
    notificationManager.info.mockClear();
  });

  afterEach(() => {
    mockSessionUser = MOCK_ADMIN_USER;
  });

  test('ADMIN — 행은 상세 패널을 열고 모달은 수정에서만 연다', async () => {
    mockSessionUser = MOCK_ADMIN_USER;
    StandardizedApi.get.mockResolvedValue({ success: true, data: [row], totalCount: 1, totalPages: 1 });
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });
    const opener = await screen.findByRole('button', { name: `${range.startDate} 내담자S 상담일지 열기` });
    await act(async () => {
      fireEvent.click(opener);
    });
    expect(screen.getByRole('heading', { name: '상담일지 상세' })).toBeInTheDocument();
    expect(screen.queryByTestId('record-modal')).toBeNull();
    expect(notificationManager.info).not.toHaveBeenCalled();
  });

  test('STAFF — 행을 눌러도 패널과 모달이 열리지 않고 안내만 보인다', async () => {
    mockSessionUser = { id: 2, name: '사무원', role: 'STAFF' };
    StandardizedApi.get.mockResolvedValue([row]);
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });
    const opener = await screen.findByRole('button', { name: `${range.startDate} 내담자S 상담일지 열기` });
    await act(async () => {
      fireEvent.click(opener);
    });
    expect(screen.queryByRole('heading', { name: '상담일지 상세' })).toBeNull();
    expect(screen.queryByTestId('record-modal')).toBeNull();
    expect(notificationManager.info).toHaveBeenCalledTimes(1);
  });
});
