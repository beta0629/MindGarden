/**
 * ScheduleClientNoteCard — 버튼 행·variant·noteType 한글 라벨
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import ScheduleClientNoteCard from '../ScheduleClientNoteCard';
import { resolveScheduleClientNoteTypeLabel } from '../../../../utils/scheduleClientNoteTypeUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => ({ 'common.actions.edit': '수정', 'common.actions.delete': '삭제' }[k] || k)
  })
}));

const getTypeLabel = (code) => resolveScheduleClientNoteTypeLabel(code, {});

const baseNote = {
  id: 7,
  title: '부부상담 추가 결제',
  body: '다음 회기 전 입금 약속',
  noteType: 'PAYMENT_PROMISE',
  promiseDate: '2099-01-01',
  resolvedAt: null
};

const renderCard = (props = {}) => render(
  <ScheduleClientNoteCard
    note={baseNote}
    getTypeLabel={getTypeLabel}
    onResolve={jest.fn()}
    onReopen={jest.fn()}
    onEdit={jest.fn()}
    onDelete={jest.fn()}
    {...props}
  />
);

describe('ScheduleClientNoteCard', () => {
  it('uses the Clinic-OS CardContainer as the card shell', () => {
    renderCard();
    const card = screen.getByTestId('schedule-client-note-card');
    expect(card).toHaveClass('mg-v2-card-container');
    expect(card).toHaveClass('schedule-client-note-card');
  });

  it('renders 해소·수정·삭제 in one right-aligned action row, none full width', () => {
    renderCard();
    const row = screen.getByTestId('schedule-client-note-card-actions');
    expect(row).toHaveClass('mg-v2-card-actions');
    expect(row).toHaveClass('mg-v2-card-actions--end');

    const buttons = within(row).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['해소', '수정', '삭제']);
    buttons.forEach((button) => {
      expect(button.parentElement).toBe(row);
      expect(button).not.toHaveClass('mg-button--full-width');
      expect(button).toHaveClass('mg-button--small');
    });
  });

  it('maps button variants: 해소 primary, 수정 secondary, 삭제 danger-outline', () => {
    renderCard();
    expect(screen.getByTestId('schedule-client-note-resolve')).toHaveClass('mg-button--primary');
    expect(screen.getByTestId('schedule-client-note-edit')).toHaveClass('mg-button--secondary');
    expect(screen.getByTestId('schedule-client-note-delete')).toHaveClass('mg-button--danger-outline');
  });

  it('calls the passed handlers with the note', () => {
    const onResolve = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderCard({ onResolve, onEdit, onDelete });
    fireEvent.click(screen.getByTestId('schedule-client-note-resolve'));
    fireEvent.click(screen.getByTestId('schedule-client-note-edit'));
    fireEvent.click(screen.getByTestId('schedule-client-note-delete'));
    expect(onResolve).toHaveBeenCalledWith(baseNote);
    expect(onEdit).toHaveBeenCalledWith(baseNote);
    expect(onDelete).toHaveBeenCalledWith(baseNote);
  });

  it('shows the Korean label for PAYMENT_PROMISE, never the raw code', () => {
    renderCard();
    expect(screen.getByText('입금·비용 약속 · 약속일 2099-01-01')).toBeInTheDocument();
    expect(screen.queryByText(/PAYMENT_PROMISE/)).not.toBeInTheDocument();
  });

  it('falls back to 기타 for an unknown code', () => {
    renderCard({ note: { ...baseNote, noteType: 'SOMETHING_NEW', promiseDate: null } });
    expect(screen.getByText('기타')).toBeInTheDocument();
    expect(screen.queryByText(/SOMETHING_NEW/)).not.toBeInTheDocument();
  });

  it('renders 다시 열기 for resolved notes and no action row without handlers', () => {
    const { rerender } = renderCard({ note: { ...baseNote, resolvedAt: '2026-10-01T00:00:00' } });
    expect(screen.getByTestId('schedule-client-note-reopen')).toHaveTextContent('다시 열기');
    expect(screen.getByText('해소됨')).toBeInTheDocument();

    rerender(<ScheduleClientNoteCard note={baseNote} getTypeLabel={getTypeLabel} />);
    expect(screen.queryByTestId('schedule-client-note-card-actions')).not.toBeInTheDocument();
  });

  it('CSS spaces actions with v2 tokens and keeps buttons auto width (no hex, no raw px)', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'ScheduleClientNoteCard.css'), 'utf8');
    expect(css).toMatch(/gap:\s*var\(--mg-v2-space-2\)/);
    expect(css).toMatch(/margin-top:\s*var\(--mg-v2-space-4\)/);
    expect(css).toMatch(/width:\s*auto/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
  });
});
