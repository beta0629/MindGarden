/**
 * 상담일지 타임라인 블록.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../../../i18n';
import ConsultationLogTimelineBlock from '../ConsultationLogTimelineBlock';
import { CONSULTATION_LOG_TIMELINE_SORT } from '../consultationLogTimeline';

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-pressed': ariaPressed }) => (
    <button type="button" onClick={onClick} aria-pressed={ariaPressed}>{children}</button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

const record = (fields) => ({
  isSessionCompleted: true,
  summaryPreview: '요약',
  ...fields
});

describe('ConsultationLogTimelineBlock', () => {
  it('최근 순 카드와 정렬 전환, 쪽 경계 라벨을 그린다', () => {
    const onSortChange = jest.fn();
    const onOpenRow = jest.fn();
    const { rerender } = render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 9, sessionDate: '2026-10-08', sessionNumber: 9, clientId: 11, consultantId: 8,
            clientName: '한서윤', consultantName: '최하린', summaryPreview: '최근'
          }),
          record({
            id: 8, sessionDate: '2026-10-01', sessionNumber: 8, clientId: 11, consultantId: 8,
            clientName: '한서윤', consultantName: '최하린', summaryPreview: '이전'
          })
        ]}
        sort={CONSULTATION_LOG_TIMELINE_SORT.RECENT}
        onSortChange={onSortChange}
        onOpenRow={onOpenRow}
        grouping={{
          clientId: 11,
          consultantId: null,
          periodFrom: '2026-08-01',
          periodTo: '2026-10-31',
          summary: {
            mode: 'CLIENT',
            sessionCount: 9,
            firstSessionDate: '2026-08-13',
            lastSessionDate: '2026-10-08'
          }
        }}
      />
    );

    expect(screen.getByRole('button', { name: '최근 순' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '회기 순' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('상담사 · 최하린')).toBeInTheDocument();
    expect(screen.getByText('9회기')).toBeInTheDocument();
    expect(screen.getAllByText('상담사 최하린').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '2026-10-08 9회기 완료 최근 상담사 최하린' }));
    expect(onOpenRow).toHaveBeenCalledWith(9);
    fireEvent.click(screen.getByRole('button', { name: '회기 순' }));
    expect(onSortChange).toHaveBeenCalledWith(CONSULTATION_LOG_TIMELINE_SORT.SESSION);

    rerender(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 20, sessionDate: '2026-07-30', sessionNumber: 20, clientId: 11, consultantId: 7,
            clientName: '서지후', consultantName: '박지안', summaryPreview: '이어짐'
          })
        ]}
        sort={CONSULTATION_LOG_TIMELINE_SORT.RECENT}
        onSortChange={onSortChange}
        onOpenRow={onOpenRow}
        preceding={{ consultantId: 7, consultantName: '박지안', clientId: 11 }}
        grouping={{
          clientId: 11,
          consultantId: null,
          periodFrom: '2026-03-01',
          periodTo: '2026-10-31',
          summary: {
            mode: 'CLIENT',
            sessionCount: 30,
            firstSessionDate: '2026-03-01',
            lastSessionDate: '2026-10-08'
          }
        }}
      />
    );

    expect(screen.getByText('상담사 · 박지안')).toBeInTheDocument();
    expect(screen.queryByText(/상담사 변경/)).not.toBeInTheDocument();
  });

  it('상담사 선택이면 최근 상담이 위인 내담자 묶음을 보여 준다', () => {
    render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 3, sessionDate: '2026-10-08', sessionNumber: 3, clientId: 1, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          }),
          record({
            id: 1, sessionDate: '2026-09-24', sessionNumber: 1, clientId: 1, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          }),
          record({
            id: 4, sessionDate: '2026-10-06', sessionNumber: 3, clientId: 2, consultantId: 7,
            clientName: '오세아', consultantName: '박지안'
          })
        ]}
        onOpenRow={jest.fn()}
        grouping={{
          clientId: null,
          consultantId: 7,
          summary: {
            mode: 'COUNSELOR',
            clients: [
              { clientId: 1, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' },
              { clientId: 2, sessionCount: 3, lastSessionDate: '2026-10-06', firstSessionDate: '2026-09-22' }
            ]
          }
        }}
      />
    );

    expect(screen.queryByRole('button', { name: '최근 순' })).not.toBeInTheDocument();
    const names = screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent);
    expect(names).toEqual(['한서윤', '오세아']);
    const dates = screen.getAllByRole('button').map((node) => node.textContent);
    expect(dates[0]).toContain('2026-10-08');
    expect(dates[1]).toContain('2026-09-24');
    expect(screen.getByText(/기간 내 9건/)).toBeInTheDocument();
  });

  it('상담사 선택 2쪽은 서버가 준 최근 순을 유지하고 끊긴 묶음 머리를 다시 그린다', () => {
    render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 199, sessionDate: '2026-09-10', sessionNumber: 1, clientId: 10, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          }),
          record({
            id: 101, sessionDate: '2026-10-06', sessionNumber: 2, clientId: 20, consultantId: 7,
            clientName: '오세아', consultantName: '박지안'
          })
        ]}
        sort={CONSULTATION_LOG_TIMELINE_SORT.SESSION}
        preceding={{ consultantId: 7, consultantName: '박지안', clientId: 10 }}
        onOpenRow={jest.fn()}
        grouping={{
          clientId: null,
          consultantId: 7,
          summary: {
            mode: 'COUNSELOR',
            clients: [
              { clientId: 10, sessionCount: 9, lastSessionDate: '2026-10-08', firstSessionDate: '2026-08-13' },
              { clientId: 20, sessionCount: 3, lastSessionDate: '2026-10-06', firstSessionDate: '2026-09-22' }
            ]
          }
        }}
      />
    );

    expect(screen.queryByRole('button', { name: '회기 순' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent))
      .toEqual(['한서윤', '오세아']);
    const dates = screen.getAllByRole('button').map((node) => node.textContent);
    expect(dates[0]).toContain('2026-09-10');
    expect(dates[1]).toContain('2026-10-06');
  });

  it('요약은 이름·상담 수·첫 상담일·최근 상담일 네 칸이고 이름은 제목 글자 클래스다', () => {
    render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 9, sessionDate: '2026-10-08', sessionNumber: 9, clientId: 11, consultantId: 8,
            clientName: '한서윤', consultantName: '최하린'
          })
        ]}
        onOpenRow={jest.fn()}
        grouping={{
          clientId: 11,
          consultantId: null,
          periodFrom: '2026-08-01',
          periodTo: '2026-10-31',
          summary: {
            mode: 'CLIENT',
            sessionCount: 9,
            firstSessionDate: '2026-08-13',
            lastSessionDate: '2026-10-08'
          }
        }}
      />
    );

    expect(screen.getAllByRole('term').map((node) => node.textContent)).toEqual([
      '내담자 이름',
      '기간 내 상담 수',
      '기간 내 첫 상담일',
      '기간 내 최근 상담일'
    ]);
    expect(screen.getByText('한서윤')).toHaveClass('mg-v2-consultation-log-summary-strip__name');
    expect(screen.getByText('9건')).toBeInTheDocument();
    expect(screen.getByText('2026-08-13')).toBeInTheDocument();
    expect(screen.getByText('2026-10-08', { selector: 'dd' })).toBeInTheDocument();
  });

  it('회기 글자는 목록 sessionNumber만 쓰고 값이 없으면 1회기로 채우지 않는다', () => {
    render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 1, sessionDate: '2026-09-22', sessionNumber: 1, clientId: 11, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          }),
          record({
            id: 2, sessionDate: '2026-09-08', sessionNumber: 4, clientId: 11, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          }),
          record({
            id: 3, sessionDate: '2026-09-01', sessionNumber: null, clientId: 11, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          })
        ]}
        onOpenRow={jest.fn()}
        grouping={{
          clientId: 11,
          consultantId: null,
          summary: {
            mode: 'CLIENT',
            sessionCount: 3,
            firstSessionDate: '2026-09-01',
            lastSessionDate: '2026-09-22'
          }
        }}
      />
    );

    expect(screen.getByRole('button', { name: /2026-09-22 1회기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2026-09-08 4회기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2026-09-01/ })).not.toHaveTextContent('회기');
    expect(screen.getByRole('button', { name: '최근 순' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '회기 순' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('회기 순을 고르면 그 버튼만 눌린다', () => {
    render(
      <ConsultationLogTimelineBlock
        records={[
          record({
            id: 1, sessionDate: '2026-08-13', sessionNumber: 1, clientId: 11, consultantId: 7,
            clientName: '한서윤', consultantName: '박지안'
          })
        ]}
        sort={CONSULTATION_LOG_TIMELINE_SORT.SESSION}
        onSortChange={jest.fn()}
        onOpenRow={jest.fn()}
        grouping={{ clientId: 11, consultantId: null }}
      />
    );

    expect(screen.getByRole('button', { name: '최근 순' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '회기 순' })).toHaveAttribute('aria-pressed', 'true');
  });
});
