/**
 * ConsultationLogViewPage — 어드민 상담일지 조회 페이지 단위 테스트.
 *
 * P0 핫픽스 (2026-05-29) 회귀 가드:
 *  - 진입 시 default startDate/endDate ("지난 달 1일 ~ 이번 달 말일") 가 API 호출 params 에 포함.
 *  - 사용자가 기간을 변경하면 새 startDate/endDate 로 재호출.
 *  - 백엔드 응답 records 가 렌더링되고, 빈 응답이어도 React #130 미발생.
 *
 * 참고: docs/project-management/2026-05-29/CONSULTATION_LOG_VIEW_APRIL_MISSING_DEBUG.md
 *
 * @author MindGarden
 * @since 2026-05-29
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
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
    user: { id: 1, name: '관리자', role: 'ADMIN' },
    isLoggedIn: true
  })
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
  default: ({ title }) => <h1 data-testid="content-header">{title}</h1>
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
  default: () => <div data-testid="loading" />
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, type = 'button', 'aria-label': ariaLabel }) => (
    <button type={type} onClick={onClick} aria-label={ariaLabel}>{children}</button>
  )
}));

jest.mock('../../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="empty-state">{title}</div>
}));

jest.mock('../../../common/ListTableView', () => ({
  __esModule: true,
  default: ({ data }) => (
    <table data-testid="list-table">
      <tbody>
        {(data || []).map((row, i) => (
          <tr key={row.id ?? i} data-testid={`row-${row.id ?? i}`}>
            <td>{row.sessionDate}</td>
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

jest.mock('../../../consultant/ConsultationLogModal', () => ({
  __esModule: true,
  default: ({ isOpen }) => (isOpen ? <div data-testid="record-modal" /> : null)
}));

jest.mock('../../ConsultationLogViewPage.css', () => ({}), { virtual: true });
jest.mock('../ConsultationLogTableBlock.css', () => ({}), { virtual: true });
jest.mock('../ConsultationLogCalendarBlock.css', () => ({}), { virtual: true });

import ConsultationLogViewPage, { computeDefaultDateRange } from '../ConsultationLogViewPage';
import StandardizedApi from '../../../../utils/standardizedApi';

describe('ConsultationLogViewPage — P0 핫픽스 회귀 가드 (2026-05-29)', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockResolvedValue({ success: true, data: [] });
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

  test('진입 시 startDate/endDate 가 default range 로 API 호출 params 에 포함된다', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());

    const firstCall = StandardizedApi.get.mock.calls[0];
    expect(firstCall[0]).toBe('/api/v1/admin/consultation-records');
    expect(firstCall[1]).toEqual(expect.objectContaining({
      page: 0,
      size: 100,
      startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    }));
  });

  test('사용자가 startDate 를 변경하면 새 값으로 재호출된다', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    const startInput = screen.getByLabelText('시작일');
    // default 와 다른 값으로 변경 (default = 지난 달 1일)
    const newStart = '2024-01-15';
    await act(async () => {
      fireEvent.change(startInput, { target: { value: newStart } });
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    const lastCall = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(expect.objectContaining({ startDate: newStart }));
  });

  test('백엔드 응답 records 가 렌더링된다 (4월 데이터 노출 회귀 가드)', async () => {
    // 현재 default range 안에 들도록 sessionDate 를 지난 달로 설정 (테스트 결정적 보장)
    const range = computeDefaultDateRange();
    const inRangeDate = range.startDate; // 지난 달 1일
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: [
        { id: 101, sessionDate: inRangeDate, clientName: '내담자A', consultantName: '상담사A', isSessionCompleted: true },
        { id: 102, sessionDate: inRangeDate, clientName: '내담자B', consultantName: '상담사B', isSessionCompleted: false }
      ],
      totalCount: 2
    });

    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByText('등록된 상담일지가 없습니다.')).toBeNull();
    });
    // 렌더링된 카드의 aria-label 에 내담자명 포함
    expect(screen.getByLabelText(new RegExp(`상담일지 ${inRangeDate} 내담자A 수정`))).toBeInTheDocument();
  });

  test('records=[] 빈 응답 — EmptyState 표시 및 React #130 미발생', async () => {
    StandardizedApi.get.mockResolvedValue({ success: true, data: [] });

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
      expect(renderError).toBeNull();
    } finally {
      console.error = originalError;
    }
  });

  test('사용자가 startDate/endDate 를 모두 지우면 백엔드에 미전송 (전체 모드)', async () => {
    await act(async () => {
      render(<ConsultationLogViewPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    const startInput = screen.getByLabelText('시작일');
    await act(async () => {
      fireEvent.change(startInput, { target: { value: '' } });
    });
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));

    const endInput = screen.getByLabelText('종료일');
    await act(async () => {
      fireEvent.change(endInput, { target: { value: '' } });
    });
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(3));

    const last = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    expect(last[1]).not.toHaveProperty('startDate');
    expect(last[1]).not.toHaveProperty('endDate');
  });
});
