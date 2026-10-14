/**
 * CurrentTimeChip — Asia/Seoul 포맷·aria·분 경계 갱신
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React from 'react';
import { act, render, screen } from '@testing-library/react';
import CurrentTimeChip, { formatCurrentTimeChipLabels } from '../CurrentTimeChip';

describe('formatCurrentTimeChipLabels', () => {
  it('전체·중간·컴팩트 한국어 라벨과 aria-label을 만든다', () => {
    // 2026-10-14 09:00 KST = 2026-10-14T00:00:00.000Z
    const date = new Date('2026-10-14T00:00:00.000Z');
    const labels = formatCurrentTimeChipLabels(date, 'Asia/Seoul');
    expect(labels.full).toBe('10월 14일 (수) 오전 9:00');
    expect(labels.medium).toBe('10/14 (수) 오전 9:00');
    expect(labels.compact).toBe('오전 9:00');
    expect(labels.ariaLabel).toBe(labels.full);
    expect(labels.dateTime).toMatch(/^2026-10-14T09:00/);
  });

  it('오후 시각을 12시간제로 표시한다', () => {
    // 2026-10-14 15:05 KST
    const date = new Date('2026-10-14T06:05:00.000Z');
    const labels = formatCurrentTimeChipLabels(date, 'Asia/Seoul');
    expect(labels.full).toContain('오후 3:05');
    expect(labels.compact).toBe('오후 3:05');
  });
});

describe('CurrentTimeChip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T00:00:30.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('time 요소에 datetime·aria-label·title(KST)을 붙인다', () => {
    render(<CurrentTimeChip />);
    const timeEl = screen.getByLabelText('10월 14일 (수) 오전 9:00');
    expect(timeEl.tagName).toBe('TIME');
    expect(timeEl).toHaveAttribute('datetime');
    expect(timeEl).toHaveAttribute('title', 'KST');
    expect(timeEl).not.toHaveAttribute('aria-live');
    expect(timeEl).not.toHaveAttribute('role', 'timer');
    expect(timeEl).toHaveClass('mg-v2-current-time-chip');
  });

  it('세 가지 라벨 span을 모두 렌더한다 (CSS로 반응형 표시)', () => {
    const { container } = render(<CurrentTimeChip />);
    expect(container.querySelector('.mg-v2-current-time-chip__label--full')).toHaveTextContent(
      '10월 14일 (수) 오전 9:00'
    );
    expect(container.querySelector('.mg-v2-current-time-chip__label--medium')).toHaveTextContent(
      '10/14 (수) 오전 9:00'
    );
    expect(container.querySelector('.mg-v2-current-time-chip__label--compact')).toHaveTextContent(
      '오전 9:00'
    );
  });

  it('다음 분 경계에 맞춰 갱신한다', () => {
    render(<CurrentTimeChip />);
    expect(screen.getByLabelText('10월 14일 (수) 오전 9:00')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(30 * 1000);
    });
    expect(screen.getByLabelText('10월 14일 (수) 오전 9:01')).toBeInTheDocument();
  });

  it('visibilitychange visible 시 즉시 동기화한다', () => {
    render(<CurrentTimeChip />);
    jest.setSystemTime(new Date('2026-10-14T00:07:00.000Z'));
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByLabelText('10월 14일 (수) 오전 9:07')).toBeInTheDocument();
  });
});
