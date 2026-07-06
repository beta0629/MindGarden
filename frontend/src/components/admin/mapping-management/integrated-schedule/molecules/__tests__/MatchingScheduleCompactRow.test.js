/**
 * MatchingScheduleCompactRow — Compact Row 표시·React #130 방어 테스트
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchingScheduleCompactRow from '../MatchingScheduleCompactRow';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      if (key === 'admin.labels.client') return '내담자';
      if (key === 'integratedSchedule.sidebar.compactRemainingSessions') {
        return `남은 ${opts?.count}회`;
      }
      return key;
    }
  })
}));

const MOCK_MAPPING = {
  id: 7,
  consultantName: '김상담',
  clientName: '이내담',
  status: 'ACTIVE',
  remainingSessions: 5
};

describe('MatchingScheduleCompactRow', () => {
  it('renders party names via SafeText with title tooltip', () => {
    render(<MatchingScheduleCompactRow mapping={MOCK_MAPPING} />);

    expect(screen.getByText('김상담')).toBeInTheDocument();
    expect(screen.getByText('이내담')).toBeInTheDocument();
    expect(screen.getByText('남은 5회')).toBeInTheDocument();
    expect(screen.getAllByTitle('김상담 → 이내담 내담자').length).toBeGreaterThan(0);
  });

  it('coerces object values to safe display strings (React #130 guard)', () => {
    render(
      <MatchingScheduleCompactRow
        mapping={{
          ...MOCK_MAPPING,
          consultantName: { bad: 'object' },
          clientName: null
        }}
      />
    );

    expect(screen.getByText('{"bad":"object"}')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('invokes onOpenPeek when row is clicked', () => {
    const onOpenPeek = jest.fn();
    render(
      <MatchingScheduleCompactRow
        mapping={MOCK_MAPPING}
        onOpenPeek={onOpenPeek}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '김상담 → 이내담 내담자 상세 보기' }));
    expect(onOpenPeek).toHaveBeenCalledWith(MOCK_MAPPING);
  });

  it('applies active modifier class when isActive', () => {
    const { container } = render(
      <MatchingScheduleCompactRow mapping={MOCK_MAPPING} isActive />
    );

    expect(container.querySelector('.integrated-schedule__compact-row--active')).toBeInTheDocument();
  });
});
