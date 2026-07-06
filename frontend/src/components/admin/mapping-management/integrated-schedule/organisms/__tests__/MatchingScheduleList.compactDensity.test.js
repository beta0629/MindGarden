/**
 * MatchingScheduleList — Compact 밀도 렌더 분기 테스트
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Draggable } from '@fullcalendar/interaction';
import MatchingScheduleList from '../MatchingScheduleList';
import { SIDEBAR_DENSITY_COMPACT } from '../../../constants/integratedScheduleSidebarDensityConstants';

jest.mock('@fullcalendar/interaction', () => {
  const mockDestroy = jest.fn();
  class MockDraggable {
    constructor(el) {
      MockDraggable.initCount += 1;
      this.el = el;
    }

    destroy() {
      mockDestroy();
    }
  }
  MockDraggable.initCount = 0;
  MockDraggable.mockDestroy = mockDestroy;
  MockDraggable.reset = () => {
    MockDraggable.initCount = 0;
    mockDestroy.mockClear();
  };
  return { __esModule: true, Draggable: MockDraggable };
});

jest.mock('../../../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../MappingScheduleCard', () => ({
  __esModule: true,
  default: ({ mapping }) => (
    <div data-testid={`mapping-card-${mapping.id}`}>{mapping.clientName}</div>
  )
}));

jest.mock('../../molecules/MatchingScheduleCompactRow', () => ({
  __esModule: true,
  default: ({ mapping }) => (
    <div data-testid={`compact-row-${mapping.id}`}>{mapping.clientName}</div>
  )
}));

jest.mock('../../../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

const SCHEDULEABLE_MAPPING = {
  id: 1,
  clientId: 10,
  consultantId: 20,
  clientName: '내담자A',
  consultantName: '상담사A',
  status: 'ACTIVE',
  remainingSessions: 3
};

const defaultProps = {
  mappings: [SCHEDULEABLE_MAPPING],
  loading: false,
  viewFilter: '',
  statusFilter: '',
  onScheduleFromCard: jest.fn()
};

describe('MatchingScheduleList compact density', () => {
  beforeEach(() => {
    Draggable.reset();
  });

  it('renders MappingScheduleCard in comfortable (default) density', () => {
    render(<MatchingScheduleList {...defaultProps} />);

    expect(screen.getByTestId('mapping-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('compact-row-1')).not.toBeInTheDocument();
  });

  it('renders MatchingScheduleCompactRow when density is compact', () => {
    render(
      <MatchingScheduleList
        {...defaultProps}
        density={SIDEBAR_DENSITY_COMPACT}
      />
    );

    expect(screen.getByTestId('compact-row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('mapping-card-1')).not.toBeInTheDocument();
    expect(document.querySelector('.integrated-schedule__list--compact')).toBeInTheDocument();
  });
});
