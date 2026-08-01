/**
 * ScheduleReminderSmsBadge molecule 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScheduleReminderSmsBadge from '../ScheduleReminderSmsBadge';

describe('ScheduleReminderSmsBadge', () => {
  it('returns null for N/A and missing', () => {
    const { container: empty } = render(<ScheduleReminderSmsBadge sms={null} />);
    expect(empty.firstChild).toBeNull();

    const { container: skipped } = render(
      <ScheduleReminderSmsBadge sms={{ status: 'SKIPPED' }} />
    );
    expect(skipped.firstChild).toBeNull();
  });

  it('renders SENT label', () => {
    render(
      <ScheduleReminderSmsBadge
        sms={{ status: 'SENT', sentAt: '2026-08-01T14:00:00' }}
      />
    );
    expect(screen.getByText('발송됨')).toBeInTheDocument();
    expect(screen.getByLabelText(/예약 문자 발송 상태: 발송됨/)).toBeInTheDocument();
  });

  it('renders compact dot with aria-label', () => {
    render(
      <ScheduleReminderSmsBadge
        compact
        sms={{ status: 'FAILED', failureReason: '발송 실패' }}
      />
    );
    expect(screen.queryByText('실패')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/예약 문자 발송 상태: 실패/)).toBeInTheDocument();
  });

  it('stops click propagation when requested', () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <ScheduleReminderSmsBadge
          stopPropagation
          sms={{ status: 'PENDING', fireAt: '2026-08-02T09:00:00' }}
        />
      </div>
    );
    fireEvent.click(screen.getByLabelText(/예약 문자 발송 상태: 대기/));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
