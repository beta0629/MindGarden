/**
 * /consultant/schedule 수용 — 레거시 셸 제거 · 조용한 헤더(ghost 새로고침) · 요약 3칸 · slate 칩 · 통합 스킨 달력
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '../../../i18n';
import ConsultantSchedule from '../ConsultantSchedule';
import { CONSULTANT_SUITE_CLASS, CONSULTANT_SUITE_TEST_ID } from '../../../constants/consultantSuite';

const mockUnifiedProps = { current: null };
const mockReloadMissing = jest.fn();

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, className }) => <div data-testid="admin-common-layout" className={className}>{children}</div>
}));

jest.mock('../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: (props) => {
    mockUnifiedProps.current = props;
    return <div data-testid="unified-schedule" />;
  }
}));

jest.mock('../../admin/mapping/CheckoutSameDayModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../schedule/hooks/useScheduleDetailSameDayCheckout', () => ({
  __esModule: true,
  default: () => ({
    onCheckoutSameDayFromDetail: jest.fn(),
    checkoutSameDayMapping: null,
    closeCheckoutSameDay: jest.fn(),
    handleCheckoutSameDayCompleted: jest.fn()
  })
}));

jest.mock('../../../hooks/useConsultantIncompleteRecordCount', () => ({
  __esModule: true,
  default: () => ({ count: 3, loading: false, reload: mockReloadMissing })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: jest.fn()
}));

const { useSession } = require('../../../contexts/SessionContext');

const FORBIDDEN_CTA = /배정|신규|등록|일정 추가|승인|지급/;

describe('ConsultantSchedule suite 수용', () => {
  beforeEach(() => {
    mockUnifiedProps.current = null;
    mockReloadMissing.mockClear();
    useSession.mockReturnValue({ user: { id: 77, role: 'CONSULTANT' }, isLoading: false });
  });

  it('레거시 data-layout-context·cr-* 없음 · dashboard 셸 클래스', () => {
    const { container } = render(<ConsultantSchedule />);
    expect(container.querySelector('[data-layout-context="consultant-legacy-schedule"]')).toBeNull();
    expect(container.querySelector('[class*="cr-"]')).toBeNull();
    expect(screen.getByTestId('admin-common-layout')).toHaveClass('mg-v2-dashboard-layout');
    expect(screen.getByTestId(CONSULTANT_SUITE_TEST_ID.SCHEDULE_PAGE)).toHaveClass(CONSULTANT_SUITE_CLASS.ROOT);
  });

  it('헤더: 「내 일정」 + 부제 · 새로고침 outline 1개 · primary 0 · 배정 CTA 없음', () => {
    const { container } = render(<ConsultantSchedule />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('내 일정');
    expect(screen.getByText('나의 상담 일정을 확인합니다')).toBeInTheDocument();
    const refresh = screen.getByRole('button', { name: '새로고침' });
    expect(refresh).toHaveClass('mg-button--outline');
    expect(container.querySelectorAll('.mg-button--primary').length).toBe(0);
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn.textContent).not.toMatch(FORBIDDEN_CTA);
    });
  });

  it('요약 3칸: 오늘 · 이번 주 · 일지 미작성', () => {
    const { container } = render(<ConsultantSchedule />);
    const summary = container.querySelector(`.${CONSULTANT_SUITE_CLASS.SUMMARY}`);
    expect(summary).toHaveTextContent('오늘');
    expect(summary).toHaveTextContent('이번 주');
    expect(summary).toHaveTextContent('일지 미작성');
    expect(summary).toHaveTextContent('3건');
  });

  it('상태 칩 전체·예정·완료·취소 — slate 선택 · data-status-filter 동기화', () => {
    const { container } = render(<ConsultantSchedule />);
    const group = screen.getByRole('group', { name: /상태/ });
    const labels = within(group).getAllByRole('button').map((b) => b.textContent);
    expect(labels).toEqual(['전체', '예정', '완료', '취소']);
    const panel = container.querySelector('.consultant-schedule__panel');
    expect(panel).toHaveAttribute('data-status-filter', 'all');
    fireEvent.click(screen.getByTestId('consultant-schedule-status-completed'));
    expect(panel).toHaveAttribute('data-status-filter', 'completed');
    expect(screen.getByTestId('consultant-schedule-status-completed')).toHaveClass(CONSULTANT_SUITE_CLASS.CHIP_SELECTED);
  });

  it('달력: 통합 스킨 · 본인 userId · 제목 숨김 · Empty·캡션', () => {
    const { container } = render(<ConsultantSchedule />);
    const panel = container.querySelector('.consultant-schedule__panel');
    expect(panel).toHaveAttribute('data-calendar-skin', 'integrated');
    expect(mockUnifiedProps.current).toEqual(expect.objectContaining({
      userRole: 'CONSULTANT',
      userId: 77,
      hideScheduleTitle: true,
      calendarSkin: 'integrated',
      integratedMonthEventLayout: true
    }));
    expect(panel.querySelector(`.${CONSULTANT_SUITE_CLASS.EMPTY}`)).toHaveTextContent('이 기간에 일정이 없습니다');
    expect(panel).toHaveTextContent('일정 등록·배정은 관리자·스태프 화면에서 처리합니다.');
  });

  it('툴바 CSS: status-chips 는 absolute/고정 toolbar-rows 가 아닌 문서 흐름', () => {
    const fs = require('fs');
    const path = require('path');
    const css = fs.readFileSync(
      path.resolve(__dirname, '../ConsultantScheduleSuite.css'),
      'utf8'
    );
    expect(css).toMatch(/\.consultant-schedule__status-chips\s*\{[^}]*position:\s*static/s);
    expect(css).not.toMatch(/--consultant-schedule-toolbar-rows/);
    expect(css).not.toMatch(/position:\s*absolute/);
  });

  it('새로고침: refetchTrigger 증가 + 일지 미작성 재조회', () => {
    render(<ConsultantSchedule />);
    const before = mockUnifiedProps.current.refetchTrigger;
    fireEvent.click(screen.getByRole('button', { name: '새로고침' }));
    expect(mockUnifiedProps.current.refetchTrigger).toBe(before + 1);
    expect(mockReloadMissing).toHaveBeenCalled();
  });

  it('요약: 이번 주를 덮는 범위 조회로만 갱신 — 다른 달로 이동한 범위 조회는 이전 요약 유지', () => {
    const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const now = new Date();
    const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
    const coveringRange = { startDate: ymd(shift(-14)), endDate: ymd(shift(14)) };
    const farRange = { startDate: ymd(shift(60)), endDate: ymd(shift(100)) };
    const todayEvent = { id: 1, start: new Date(), extendedProps: { status: 'BOOKED' } };

    const { container } = render(<ConsultantSchedule />);
    const todayCell = () => container.querySelector(`.${CONSULTANT_SUITE_CLASS.SUMMARY}`);

    act(() => {
      mockUnifiedProps.current.onScheduleEventsChange([todayEvent], coveringRange);
    });
    expect(todayCell()).toHaveTextContent('1건');

    act(() => {
      mockUnifiedProps.current.onScheduleEventsChange([], farRange);
    });
    expect(todayCell()).toHaveTextContent('1건');

    act(() => {
      mockUnifiedProps.current.onScheduleEventsChange([], coveringRange);
    });
    expect(todayCell()).not.toHaveTextContent('1건');
  });

  it('세션 로딩 중에는 달력 미마운트', () => {
    useSession.mockReturnValue({ user: null, isLoading: true });
    render(<ConsultantSchedule />);
    expect(screen.queryByTestId('unified-schedule')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('내 일정');
  });
});
