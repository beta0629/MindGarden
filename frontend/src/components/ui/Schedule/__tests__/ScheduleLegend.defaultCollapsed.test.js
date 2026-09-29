/**
 * ScheduleLegend — 통합 스케줄 범례 기본 접힘 (autoExpandOnCounts=false).
 *
 * - 카운트가 있어도 강제 펼침하지 않는다.
 * - 사용자가 펼친 경우에만 펼침 상태를 기억한다.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => {
      if (options && typeof options === 'object' && options.defaultValue) {
        return options.defaultValue;
      }
      return key;
    }
  })
}));

import ScheduleLegend from '../ScheduleLegend';

const LEGEND_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.legendCollapsed';

const baseProps = (overrides = {}) => ({
  consultants: [{ id: 1, name: 'A', isActive: true }],
  events: [],
  scheduleStatusOptions: [],
  getConsultantColor: () => 'var(--mg-primary-500)',
  calendarSkin: 'integrated',
  autoExpandOnCounts: false,
  ...overrides
});

const getToggle = (container) => container.querySelector('.mg-v2-schedule-legend__toggle');
const getBody = (container) => container.querySelector('.mg-v2-schedule-legend__body');

beforeEach(() => {
  window.localStorage.removeItem(LEGEND_COLLAPSED_STORAGE_KEY);
});

describe('ScheduleLegend — 통합 스케줄 기본 접힘', () => {
  test('카운트가 있어도 기본 접힘 유지 (강제 펼침 없음)', () => {
    const { container } = render(
      <ScheduleLegend {...baseProps({ consultantCounts: new Map([[1, 3]]) })} />
    );

    expect(getToggle(container).getAttribute('aria-expanded')).toBe('false');
    expect(getBody(container).hasAttribute('hidden')).toBe(true);
  });

  test('카운트가 나중에 도착해도 접힘 유지', () => {
    const { container, rerender } = render(<ScheduleLegend {...baseProps()} />);
    expect(getToggle(container).getAttribute('aria-expanded')).toBe('false');

    rerender(<ScheduleLegend {...baseProps({ consultantCounts: new Map([[1, 5]]) })} />);

    expect(getToggle(container).getAttribute('aria-expanded')).toBe('false');
    expect(getBody(container).hasAttribute('hidden')).toBe(true);
  });

  test('사용자가 펼치면 펼침 상태가 기억되고 다음 마운트에서도 펼침', () => {
    const counts = new Map([[1, 2]]);
    const first = render(<ScheduleLegend {...baseProps({ consultantCounts: counts })} />);

    fireEvent.click(getToggle(first.container));
    expect(getToggle(first.container).getAttribute('aria-expanded')).toBe('true');
    expect(window.localStorage.getItem(LEGEND_COLLAPSED_STORAGE_KEY)).toBe('false');
    first.unmount();

    const second = render(<ScheduleLegend {...baseProps({ consultantCounts: counts })} />);
    expect(getToggle(second.container).getAttribute('aria-expanded')).toBe('true');
    expect(getBody(second.container).hasAttribute('hidden')).toBe(false);
  });
});
