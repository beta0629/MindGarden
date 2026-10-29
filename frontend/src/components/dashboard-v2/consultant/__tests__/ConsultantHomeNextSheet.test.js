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
  COVER_CHAPTER_BADGE_CONFIRMED
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
  test('zero: Primary 일정 열기 only — no 상담 열기 / 직접예약', () => {
    const onOpenConsultation = jest.fn();
    const onOpenSchedule = jest.fn();

    render(
      <ConsultantHomeNextSheet
        nextConsultation={null}
        onOpenConsultation={onOpenConsultation}
        onOpenSchedule={onOpenSchedule}
      />
    );

    expect(screen.getByTestId(COVER_CHAPTER_NEXT_SHEET_TEST_ID)).toHaveAttribute('data-state', 'zero');
    expect(screen.getByText(COVER_CHAPTER_BADGE_NONE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_OPEN_CONSULTATION })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COVER_CHAPTER_CTA_SCHEDULE })).not.toBeInTheDocument();
    expect(screen.queryByText('직접예약')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: COVER_CHAPTER_CTA_OPEN_SCHEDULE }));
    expect(onOpenSchedule).toHaveBeenCalledTimes(1);
    expect(onOpenConsultation).not.toHaveBeenCalled();
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
});
