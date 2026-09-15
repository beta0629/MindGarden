/**
 * MatchingScheduleList — Draggable 재초기화 회귀 가드
 *
 * loadMappings() 후 loading 토글·목록 remount 시 stale Draggable 방지.
 * 사이드바 드래그는 FC `.fc-event` 가 아닌 `--draggable` 전용 클래스 사용.
 *
 * @author CoreSolution
 * @since 2026-06-30
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Draggable } from '@fullcalendar/interaction';
import MatchingScheduleList from '../MatchingScheduleList';
import {
  SIDEBAR_CARD_DRAGGABLE_CLASS,
  SIDEBAR_CARD_DRAGGABLE_SELECTOR
} from '../../../constants/integratedScheduleSidebarFilterConstants';

jest.mock('@fullcalendar/interaction', () => {
  const mockDestroy = jest.fn();
  class MockDraggable {
    constructor(el, opts) {
      MockDraggable.initCount += 1;
      MockDraggable.lastOpts = opts;
      this.el = el;
      this.opts = opts;
    }

    destroy() {
      mockDestroy();
    }
  }
  MockDraggable.initCount = 0;
  MockDraggable.lastOpts = null;
  MockDraggable.mockDestroy = mockDestroy;
  MockDraggable.reset = () => {
    MockDraggable.initCount = 0;
    MockDraggable.lastOpts = null;
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

const CANCELLED_MAPPING = {
  id: 2,
  clientId: 11,
  consultantId: 21,
  clientName: '내담자B',
  consultantName: '상담사B',
  status: 'CANCELLED',
  remainingSessions: 0
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

  it('uses --draggable itemSelector (not .fc-event)', () => {
    render(<MatchingScheduleList {...defaultProps} />);

    expect(Draggable.lastOpts).toEqual(
      expect.objectContaining({
        itemSelector: SIDEBAR_CARD_DRAGGABLE_SELECTOR
      })
    );
    expect(Draggable.lastOpts.itemSelector).not.toMatch(/fc-event/);
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

  it('data-event JSON seals externalMappingDrop at top-level and extendedProps', () => {
    const { container } = render(<MatchingScheduleList {...defaultProps} />);
    const el = container.querySelector('[data-event]');
    expect(el).toBeTruthy();
    const parsed = JSON.parse(el.getAttribute('data-event'));
    expect(parsed.create).toBe(true);
    expect(parsed.externalMappingDrop).toBe(true);
    expect(parsed.mappingId).toBe(SCHEDULEABLE_MAPPING.id);
    expect(parsed.consultantId).toBe(SCHEDULEABLE_MAPPING.consultantId);
    expect(parsed.clientId).toBe(SCHEDULEABLE_MAPPING.clientId);
    expect(parsed.remainingSessions).toBe(SCHEDULEABLE_MAPPING.remainingSessions);
    expect(parsed.extendedProps).toEqual(
      expect.objectContaining({
        externalMappingDrop: true,
        mappingId: SCHEDULEABLE_MAPPING.id,
        consultantId: SCHEDULEABLE_MAPPING.consultantId,
        clientId: SCHEDULEABLE_MAPPING.clientId,
        hasConsultationSchedule: false,
        nextConsultationDate: null
      })
    );
    expect(parsed.nextConsultationDate).toBeNull();
  });

  it('data-event dual-seals nextConsultationDate and coerces hasConsultationSchedule string', () => {
    const mappingWithNext = {
      ...SCHEDULEABLE_MAPPING,
      hasConsultationSchedule: 'true',
      nextConsultationDate: '2026-07-20'
    };
    const { container } = render(
      <MatchingScheduleList {...defaultProps} mappings={[mappingWithNext]} />
    );
    const el = container.querySelector('[data-event]');
    expect(el).toBeTruthy();
    const parsed = JSON.parse(el.getAttribute('data-event'));
    expect(parsed.hasConsultationSchedule).toBe(true);
    expect(parsed.nextConsultationDate).toBe('2026-07-20');
    expect(parsed.extendedProps.hasConsultationSchedule).toBe(true);
    expect(parsed.extendedProps.nextConsultationDate).toBe('2026-07-20');
  });

  it('ACTIVE scheduleable card uses --draggable and never fc-event', () => {
    const { container } = render(<MatchingScheduleList {...defaultProps} />);
    const card = container.querySelector(`[data-mapping-id="${SCHEDULEABLE_MAPPING.id}"]`);

    expect(card).toHaveClass(SIDEBAR_CARD_DRAGGABLE_CLASS);
    expect(card).not.toHaveClass('fc-event');
    expect(card).toHaveAttribute('data-event');
  });

  it('CANCELLED card has no --draggable, no fc-event, no data-event', () => {
    const { container } = render(
      <MatchingScheduleList
        {...defaultProps}
        mappings={[CANCELLED_MAPPING]}
      />
    );
    const card = container.querySelector(`[data-mapping-id="${CANCELLED_MAPPING.id}"]`);

    expect(card).toBeTruthy();
    expect(card).not.toHaveClass(SIDEBAR_CARD_DRAGGABLE_CLASS);
    expect(card).not.toHaveClass('fc-event');
    expect(card).not.toHaveAttribute('data-event');
  });

  it('mixed ACTIVE + CANCELLED: only ACTIVE is Draggable target', () => {
    const { container } = render(
      <MatchingScheduleList
        {...defaultProps}
        mappings={[SCHEDULEABLE_MAPPING, CANCELLED_MAPPING]}
      />
    );

    const active = container.querySelector(`[data-mapping-id="${SCHEDULEABLE_MAPPING.id}"]`);
    const cancelled = container.querySelector(`[data-mapping-id="${CANCELLED_MAPPING.id}"]`);

    expect(active).toHaveClass(SIDEBAR_CARD_DRAGGABLE_CLASS);
    expect(cancelled).not.toHaveClass(SIDEBAR_CARD_DRAGGABLE_CLASS);
    expect(container.querySelectorAll(SIDEBAR_CARD_DRAGGABLE_SELECTOR)).toHaveLength(1);
    expect(container.querySelectorAll('.fc-event')).toHaveLength(0);
    expect(Draggable.lastOpts.itemSelector).toBe(SIDEBAR_CARD_DRAGGABLE_SELECTOR);
  });
});

describe('MatchingScheduleList CSS fc-event isolation', () => {
  const fs = require('fs');
  const path = require('path');

  it('list-scroll has min-height safety net (not zero collapse)', () => {
    const css = fs.readFileSync(
      path.join(__dirname, '../MatchingScheduleList.css'),
      'utf8'
    );
    expect(css).toMatch(
      /\.integrated-schedule__list-scroll\s*\{[\s\S]*?min-height:\s*var\(--mg-spacing-2xl\)/
    );
  });

  it('sidebar CSS blocks FC .fc-event focus/::before/::after/opacity on cards', () => {
    const css = fs.readFileSync(
      path.join(__dirname, '../MatchingScheduleList.css'),
      'utf8'
    );
    expect(css).toMatch(/integrated-schedule__card--draggable/);
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/::after/);
    expect(css).toMatch(/content:\s*none/);
    expect(css).toMatch(/opacity:\s*1/);
    expect(css).toMatch(/:focus/);
  });
});
