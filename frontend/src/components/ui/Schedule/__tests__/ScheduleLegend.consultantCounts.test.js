/**
 * ScheduleLegend — 월별 상담사 COMPLETED 카운트 배지 회귀 테스트.
 *
 * 검증 매트릭스 (F1~F7):
 *  - F1: consultantCounts Map 전달 시 활성 상담사 전원(0건 포함) 노출 + slice(0, 5) 해제
 *  - F2: count > 99 → "99+" 표시 + title="120회"
 *  - F3: count === 0 → mg-v2-count-badge--zero 클래스 적용
 *  - F4: 카운트 데이터 도착 시 통합 스킨 기본 접힘 무시 + 강제 펼침
 *  - F5: 일반 객체 { 101: 12 } 도 Map 과 동일 동작
 *  - F6: 빈 Map → 기존 동작(slice(0, 5) + "외 N명") 유지
 *  - F7: aria-label `${name}, 이번 달 완료 ${count}회` 검증
 *
 * SSOT: src/main/java/com/coresolution/consultation/dto/MonthlyConsultantCountsResponse.java
 *       frontend/src/components/ui/Schedule/ScheduleLegend.js
 *
 * @author MindGarden core-tester
 * @since 2026-06-09
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, options) => {
      // ScheduleLegend 의 consultantCompletedAria 는 defaultValue 를 사용한다.
      if (options && typeof options === 'object' && options.defaultValue) {
        return options.defaultValue;
      }
      return key;
    }
  })
}));

import ScheduleLegend from '../ScheduleLegend';

const LEGEND_COLLAPSED_STORAGE_KEY = 'mg.integratedSchedule.legendCollapsed';

const buildConsultants = (...specs) =>
  specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    isActive: spec.isActive ?? true
  }));

const buildEvent = (consultantId) => ({
  extendedProps: { consultantId }
});

const baseProps = (overrides = {}) => ({
  consultants: [],
  events: [],
  scheduleStatusOptions: [],
  getConsultantColor: () => 'var(--mg-primary-500)',
  ...overrides
});

beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(LEGEND_COLLAPSED_STORAGE_KEY);
  }
});

describe('ScheduleLegend — 월별 상담사 COMPLETED 카운트 배지', () => {
  // ─── F1 ────────────────────────────────────────────────────────────
  test('F1: consultantCounts Map 전달 시 활성 상담사 전원(0건 포함) 노출 + slice(0, 5) 해제', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' },
      { id: 4, name: 'D' }, { id: 5, name: 'E' }, { id: 6, name: 'F' },
      { id: 7, name: 'G' }
    );
    const consultantCounts = new Map([
      [1, 5], [2, 0], [3, 12], [4, 1], [5, 0], [6, 7], [7, 3]
    ]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    // 7명 모두 노출 (slice(0,5) 해제)
    const items = container.querySelectorAll('.mg-v2-consultant-legend .mg-v2-legend-item');
    expect(items.length).toBe(7);
    // "외 N명" 폴백 미노출
    expect(container.querySelector('.mg-v2-legend-more')).toBeNull();
  });

  // ─── F2 ────────────────────────────────────────────────────────────
  test('F2: count > 99 → "99+" 표시 + title="120회"', () => {
    const consultants = buildConsultants({ id: 1, name: '다건상담사' });
    const consultantCounts = new Map([[1, 120]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('99+');
    expect(badge.getAttribute('title')).toBe('120회');
  });

  // ─── F3 ────────────────────────────────────────────────────────────
  test('F3: count === 0 → mg-v2-count-badge--zero 클래스 적용', () => {
    const consultants = buildConsultants({ id: 1, name: 'Zero' });
    const consultantCounts = new Map([[1, 0]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('mg-v2-count-badge--zero');
    expect(badge.textContent).toBe('0');
  });

  // ─── F4 ────────────────────────────────────────────────────────────
  test('F4: 카운트 데이터 도착 시 통합 스킨 기본 접힘 무시 + 강제 펼침', () => {
    // localStorage 에 stored=null (사용자 선호 없음) → 기본 접힘 상태
    const consultants = buildConsultants({ id: 1, name: 'A' });
    const consultantCounts = new Map([[1, 3]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    expect(toggle).toBeTruthy();
    // 카운트가 있으니 강제 펼침
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const body = container.querySelector('.mg-v2-schedule-legend__body');
    expect(body.hasAttribute('hidden')).toBe(false);
  });

  // ─── F5 ────────────────────────────────────────────────────────────
  test('F5: 일반 객체 { 101: 12 } 도 Map 과 동일 동작', () => {
    const consultants = buildConsultants({ id: 101, name: 'PlainObject' });
    const consultantCounts = { 101: 12 };

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('12');
    // overflow 가 아니므로 title 은 없다
    expect(badge.getAttribute('title')).toBeNull();
    // mg-v2-count-badge 는 SSOT 클래스로 적용됨
    expect(badge.className).toContain('mg-v2-count-badge');
  });

  // ─── F6 ────────────────────────────────────────────────────────────
  test('F6: 빈 Map → 기존 동작(slice(0,5) + "외 N명") 유지', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' },
      { id: 4, name: 'D' }, { id: 5, name: 'E' }, { id: 6, name: 'F' },
      { id: 7, name: 'G' }
    );
    // 모든 상담사에 events 가 있어 비카운트 모드의 필터를 통과시킨다.
    const events = consultants.map((c) => buildEvent(c.id));

    const { container } = render(
      <ScheduleLegend
        {...baseProps({
          consultants,
          events,
          consultantCounts: new Map(),
          calendarSkin: 'integrated'
        })}
      />
    );

    const items = container.querySelectorAll('.mg-v2-consultant-legend .mg-v2-legend-item');
    expect(items.length).toBe(5);
    // "외 N명" 폴백 노출
    const more = container.querySelector('.mg-v2-legend-more');
    expect(more).toBeTruthy();
    expect(more.textContent).toContain('외 2명');
    // 카운트 배지는 미노출
    expect(container.querySelector('.mg-v2-legend-count-badge')).toBeNull();
  });

  // ─── F7 ────────────────────────────────────────────────────────────
  test('F7: aria-label `${name}, 이번 달 완료 ${count}회` 검증', () => {
    const consultants = buildConsultants({ id: 1, name: '홍길동' });
    const consultantCounts = new Map([[1, 7]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge).toBeTruthy();
    expect(badge.getAttribute('aria-label')).toBe('홍길동, 이번 달 완료 7회');
  });
});
