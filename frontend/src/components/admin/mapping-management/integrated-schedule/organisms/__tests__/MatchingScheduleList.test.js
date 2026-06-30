/**
 * MatchingScheduleList — Draggable 재초기화 회귀 가드
 *
 * loadMappings() 후 loading 토글·목록 remount 시 stale Draggable 방지.
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Draggable } from '@fullcalendar/interaction';
import MatchingScheduleList from '../MatchingScheduleList';

jest.mock('@fullcalendar/interaction', () => {
  const mockDestroy = jest.fn();
  class MockDraggable {
    constructor(el, opts) {
      MockDraggable.initCount += 1;
      this.el = el;
      this.opts = opts;
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
  return {
    __esModule: true,
    Draggable: MockDraggable
  };
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

describe('MatchingScheduleList Draggable lifecycle', () => {
  beforeEach(() => {
    Draggable.reset();
  });

  it('creates Draggable when loaded with scheduleable mappings', () => {
    render(<MatchingScheduleList {...defaultProps} />);

    expect(Draggable.initCount).toBe(1);
  });

  it('does not create Draggable while loading', () => {
    render(<MatchingScheduleList {...defaultProps} loading />);

    expect(Draggable.initCount).toBe(0);
  });

  it('destroys and recreates Draggable after loading remounts list (same length/count)', () => {
    const { rerender } = render(<MatchingScheduleList {...defaultProps} />);

    expect(Draggable.initCount).toBe(1);

    rerender(<MatchingScheduleList {...defaultProps} loading />);
    expect(Draggable.mockDestroy).toHaveBeenCalledTimes(1);
    expect(Draggable.initCount).toBe(1);

    rerender(
      <MatchingScheduleList
        {...defaultProps}
        loading={false}
        mappings={[{ ...SCHEDULEABLE_MAPPING, remainingSessions: 2 }]}
      />
    );
    expect(Draggable.initCount).toBe(2);
    expect(Draggable.mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('recreates Draggable when mappings reference changes after reload', () => {
    const { rerender } = render(<MatchingScheduleList {...defaultProps} />);

    rerender(
      <MatchingScheduleList
        {...defaultProps}
        mappings={[{ ...SCHEDULEABLE_MAPPING }]}
      />
    );

    expect(Draggable.initCount).toBe(2);
    expect(Draggable.mockDestroy).toHaveBeenCalledTimes(1);
  });
});
