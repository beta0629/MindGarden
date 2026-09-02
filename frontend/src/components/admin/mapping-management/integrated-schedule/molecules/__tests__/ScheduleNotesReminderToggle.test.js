/**
 * ScheduleNotesReminderToggle — 스위치 UI 테스트
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleNotesReminderToggle from '../ScheduleNotesReminderToggle';

describe('ScheduleNotesReminderToggle', () => {
  it('renders Korean operator label', () => {
    render(
      <ScheduleNotesReminderToggle enabled={false} onChange={jest.fn()} />
    );
    expect(screen.getByText('시작 전 특이사항 알림')).toBeInTheDocument();
  });

  it('toggles on click', () => {
    const onChange = jest.fn();
    render(
      <ScheduleNotesReminderToggle enabled={false} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reflects enabled state', () => {
    render(
      <ScheduleNotesReminderToggle enabled onChange={jest.fn()} />
    );
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
