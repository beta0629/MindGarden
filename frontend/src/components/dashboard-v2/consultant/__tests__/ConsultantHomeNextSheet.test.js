/**
 * ConsultantHomeNextSheet — has vs zero CTA 분기
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsultantHomeNextSheet from '../ConsultantHomeNextSheet';
import {
  COVER_CHAPTER_CTA_OPEN_CONSULTATION,
  COVER_CHAPTER_CTA_SCHEDULE,
  COVER_CHAPTER_CTA_OPEN_SCHEDULE,
  COVER_CHAPTER_NEXT_SHEET_TEST_ID,
  COVER_CHAPTER_BADGE_NONE,
  COVER_CHAPTER_BADGE_CONFIRMED,
  COVER_CHAPTER_BADGE_IN_PROGRESS,
  COVER_CHAPTER_ZERO_BODY,
  COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY,
  COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY,
  COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY,
  COVER_CHAPTER_SHEET_KIND_IN_PROGRESS
} from '../consultantCoverChapterConstants';

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, className }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  )
}));

describe('ConsultantHomeNextSheet', () => {
  test('zero true-empty: Primary 일정 열기 only — body 비어 있어요', () => {
    const onOpenConsultation = jest.fn();
    const onOpenSchedule = jest.fn();

    render(
      <ConsultantHomeNextSheet
        nextConsultation={null}
        sheetKind={COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY}
        todayCount={0}
        onOpenConsultation={onOpenConsultation}
        onOpenSchedule={onOpenSchedule}
      />
    );

    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'zero');
    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID))
      .toHaveAttribute('data-sheet-kind', COVER_CHAPTER_SHEET_KIND_TRUE_EMPTY);
    expect(screen.getByText(COVER_CHAPTER_BADGE_NONE)).toBeInTheDocument();
    expect(screen.getByText(COVER_CHAPTER_ZERO_BODY)).toBeInTheDocument();
    expect(screen.queryByText(COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_SCHEDULE })).not.toBeInTheDocument();
    expect(screen.queryByText('직접예약')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE }));
    expect(onOpenSchedule).toHaveBeenCalledTimes(1);
    expect(onOpenConsultation).not.toHaveBeenCalled();
  });

  test('zero remaining-empty: today>0 → body 남은 상담 없음', () => {
    render(
      <ConsultantHomeNextSheet
        nextConsultation={null}
        sheetKind={COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY}
        todayCount={3}
        onOpenConsultation={jest.fn()}
        onOpenSchedule={jest.fn()}
      />
    );

    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID))
      .toHaveAttribute('data-sheet-kind', COVER_CHAPTER_SHEET_KIND_REMAINING_EMPTY);
    expect(screen.getByText(COVER_CHAPTER_ZERO_BODY_REMAINING_EMPTY)).toBeInTheDocument();
    expect(screen.queryByText(COVER_CHAPTER_ZERO_BODY)).not.toBeInTheDocument();
  });

  test('has: 상담 열기 + 일정 — long name truncate class present', () => {
    const onOpenConsultation = jest.fn();
    const onOpenSchedule = jest.fn();
    const longName = '남궁민서윤아림정한솔예린';

    render(
      <ConsultantHomeNextSheet
        nextConsultation={{
          timeLabel: '오늘 14:30',
          bodyLabel: `${longName} · 대면 50분`,
          metaLabel: '3층 상담실 B · 개인상담',
          badgeLabel: COVER_CHAPTER_BADGE_CONFIRMED,
          scheduleId: 501
        }}
        onOpenConsultation={onOpenConsultation}
        onOpenSchedule={onOpenSchedule}
      />
    );

    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'has');
    expect(screen.getByText(COVER_CHAPTER_BADGE_CONFIRMED)).toBeInTheDocument();
    expect(screen.getByText('오늘 14:30')).toBeInTheDocument();
    expect(screen.getByText(`${longName} · 대면 50분`)).toBeInTheDocument();
    expect(document.querySelector('.consultant-cover-chapter__sheet-body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION }));
    expect(onOpenConsultation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_SCHEDULE }));
    expect(onOpenSchedule).toHaveBeenCalledTimes(1);

    expect(screen.queryByText('직접예약')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE })).not.toBeInTheDocument();
  });

  test('has model scheduleId is retained for CTA wiring', () => {
    render(
      <ConsultantHomeNextSheet
        nextConsultation={{
          timeLabel: '오늘 14:00',
          bodyLabel: '홍길동 · 대면 50분',
          metaLabel: '상담실',
          badgeLabel: COVER_CHAPTER_BADGE_CONFIRMED,
          scheduleId: 777
        }}
        onOpenConsultation={jest.fn()}
        onOpenSchedule={jest.fn()}
      />
    );
    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'has');
    expect(screen.getByText('오늘 14:00')).toBeInTheDocument();
  });

  test('has: empty body/meta/whitespace/— rows are not rendered', () => {
    render(
      <ConsultantHomeNextSheet
        nextConsultation={{
          timeLabel: '오늘 15:00',
          bodyLabel: '   ',
          metaLabel: '—',
          badgeLabel: COVER_CHAPTER_BADGE_CONFIRMED,
          scheduleId: 88
        }}
        onOpenConsultation={jest.fn()}
        onOpenSchedule={jest.fn()}
      />
    );

    expect(screen.getByText('오늘 15:00')).toBeInTheDocument();
    expect(document.querySelector('.consultant-cover-chapter__sheet-body')).not.toBeInTheDocument();
    expect(document.querySelector('.consultant-cover-chapter__sheet-meta')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    // meta 미렌더여도 CTA 행은 독립 유지
    expect(document.querySelector('.consultant-cover-chapter__cta-row')).toBeInTheDocument();
  });

  test('has: empty timeLabel omits sheet-dom row', () => {
    render(
      <ConsultantHomeNextSheet
        nextConsultation={{
          timeLabel: '',
          bodyLabel: '홍길동 · 대면',
          metaLabel: '',
          badgeLabel: COVER_CHAPTER_BADGE_CONFIRMED,
          scheduleId: 89
        }}
        onOpenConsultation={jest.fn()}
        onOpenSchedule={jest.fn()}
      />
    );

    expect(document.querySelector('.consultant-cover-chapter__sheet-dom')).not.toBeInTheDocument();
    expect(document.querySelector('.consultant-cover-chapter__sheet-body')).toBeInTheDocument();
    expect(document.querySelector('.consultant-cover-chapter__sheet-meta')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  test('has in-progress: badge 진행 중', () => {
    render(
      <ConsultantHomeNextSheet
        nextConsultation={{
          timeLabel: '오늘 19:00',
          bodyLabel: '홍길동 · 대면 50분',
          metaLabel: '상담실',
          badgeLabel: COVER_CHAPTER_BADGE_IN_PROGRESS,
          scheduleId: 19,
          sheetKind: COVER_CHAPTER_SHEET_KIND_IN_PROGRESS
        }}
        sheetKind={COVER_CHAPTER_SHEET_KIND_IN_PROGRESS}
        onOpenConsultation={jest.fn()}
        onOpenSchedule={jest.fn()}
      />
    );

    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'has');
    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID))
      .toHaveAttribute('data-sheet-kind', COVER_CHAPTER_SHEET_KIND_IN_PROGRESS);
    expect(screen.getByText(COVER_CHAPTER_BADGE_IN_PROGRESS)).toBeInTheDocument();
  });
});
