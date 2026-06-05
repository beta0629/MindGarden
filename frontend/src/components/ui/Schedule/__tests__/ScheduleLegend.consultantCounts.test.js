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

  // ─── F5d (R5) ──────────────────────────────────────────────────────
  test('F5d (R5): consultantCountsMonth + hasCounts → 「상담사 · N월 완료」 라벨 노출', () => {
    const consultants = buildConsultants({ id: 1, name: '김선희' });
    const consultantCounts = new Map([[1, 39]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({
          consultants,
          consultantCounts,
          consultantCountsMonth: 5,
          calendarSkin: 'integrated'
        })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title'))
      .map((el) => el.textContent);
    expect(titles).toContain('상담사 · 5월 완료');
    expect(titles).not.toContain('common.labels.consultant');
  });

  // ─── F5e (R5) ──────────────────────────────────────────────────────
  test('F5e (R5): consultantCountsMonth=null + hasCounts=true → 기존 「상담사」 라벨 fallback', () => {
    const consultants = buildConsultants({ id: 1, name: '김선희' });
    const consultantCounts = new Map([[1, 39]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({
          consultants,
          consultantCounts,
          consultantCountsMonth: null,
          calendarSkin: 'integrated'
        })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title'))
      .map((el) => el.textContent);
    // 모의 t() 가 defaultValue 미사용 시 key 그대로 반환 → 「common.labels.consultant」
    expect(titles).toContain('common.labels.consultant');
    expect(titles.some((t) => t.includes('월 완료'))).toBe(false);
  });

  // ─── F5f (R5) ──────────────────────────────────────────────────────
  test('F5f (R5): consultantCountsMonth 만 있고 hasCounts=false → 「상담사」 라벨 유지 (회귀 0)', () => {
    // events 기반 fallback 모드 — 카운트 데이터 없음
    const consultants = buildConsultants({ id: 1, name: '김선희' });
    const events = [buildEvent(1)];

    const { container } = render(
      <ScheduleLegend
        {...baseProps({
          consultants,
          events,
          consultantCountsMonth: 5,
          calendarSkin: 'integrated'
        })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title'))
      .map((el) => el.textContent);
    expect(titles).toContain('common.labels.consultant');
    expect(titles.some((t) => t.includes('월 완료'))).toBe(false);
  });

  // ─── F4b (R1) ──────────────────────────────────────────────────────
  test('F4b (R1): 사용자가 명시적으로 접은 적이 있으면 카운트가 도착해도 강제 펼침이 발동하지 않는다', () => {
    // 사용자가 이전 세션에서 접음 → localStorage = 'true'
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LEGEND_COLLAPSED_STORAGE_KEY, 'true');
    }
    const consultants = buildConsultants({ id: 1, name: 'A' });
    const consultantCounts = new Map([[1, 3]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    expect(toggle).toBeTruthy();
    // 사용자 선호 존중 — 접힘 유지
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const body = container.querySelector('.mg-v2-schedule-legend__body');
    expect(body.hasAttribute('hidden')).toBe(true);
  });

  // ─── F4c (R1) ──────────────────────────────────────────────────────
  test('F4c (R1): 사용자가 명시적으로 펼친 적이 있으면 (localStorage=false) 그대로 펼침 유지 + 강제 펼침 idempotent', () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LEGEND_COLLAPSED_STORAGE_KEY, 'false');
    }
    const consultants = buildConsultants({ id: 1, name: 'A' });
    const consultantCounts = new Map([[1, 0]]);

    const { container } = render(
      <ScheduleLegend
        {...baseProps({ consultants, consultantCounts, calendarSkin: 'integrated' })}
      />
    );

    const toggle = container.querySelector('.mg-v2-schedule-legend__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  // ====================================================================
  // R4 (2026-06-09) — 상담일지 미작성 섹션 회귀 테스트 (M1~M5)
  // ====================================================================
  describe('R4 — missingConsultationLogs prop', () => {
    // ─── M1 ──────────────────────────────────────────────────────────
    test('M1: missingConsultationLogs 미전달(null) → 섹션 자체 미노출 (다른 라우트 회귀 0)', () => {
      const consultants = buildConsultants({ id: 1, name: 'A' });
      const { container } = render(
        <ScheduleLegend
          {...baseProps({ consultants, calendarSkin: 'integrated' })}
        />
      );
      expect(container.querySelector('.mg-v2-legend-missing-logs')).toBeNull();
    });

    // ─── M2 ──────────────────────────────────────────────────────────
    test('M2: missingConsultationLogs 빈 배열 → «모두 작성됨» placeholder 노출', () => {
      const consultants = buildConsultants({ id: 1, name: 'A' });
      const { container } = render(
        <ScheduleLegend
          {...baseProps({
            consultants,
            calendarSkin: 'integrated',
            missingConsultationLogs: []
          })}
        />
      );
      const section = container.querySelector('.mg-v2-legend-missing-logs');
      expect(section).toBeTruthy();
      const empty = container.querySelector('.mg-v2-legend-missing-logs__empty');
      expect(empty).toBeTruthy();
      expect(container.querySelectorAll('.mg-v2-legend-missing-date-chip').length).toBe(0);
    });

    // ─── M3 ──────────────────────────────────────────────────────────
    test('M3: 다중 항목 + 다중 날짜 → 상담사별 행 + 칩 M/D 포맷 + count 표시', () => {
      const consultants = buildConsultants({ id: 1, name: 'A' });
      const missingConsultationLogs = [
        {
          consultantId: 3,
          consultantName: '이혁진',
          missingDates: ['2026-04-15', '2026-04-22']
        },
        {
          consultantId: 4,
          consultantName: '김상담',
          missingDates: ['2026-04-30']
        }
      ];
      const { container } = render(
        <ScheduleLegend
          {...baseProps({
            consultants,
            calendarSkin: 'integrated',
            missingConsultationLogs
          })}
        />
      );

      const items = container.querySelectorAll('.mg-v2-legend-missing-logs__item');
      expect(items.length).toBe(2);
      const firstName = items[0].querySelector('.mg-v2-legend-missing-logs__name').textContent;
      expect(firstName).toBe('이혁진');
      const firstCount = items[0].querySelector('.mg-v2-legend-missing-logs__count').textContent;
      expect(firstCount).toBe('(2)');

      const chips = container.querySelectorAll('.mg-v2-legend-missing-date-chip');
      expect(chips.length).toBe(3);
      // 4/15 → 4/15, 4/22 → 4/22, 4/30 → 4/30
      const chipTexts = Array.from(chips).map((c) => c.textContent);
      expect(chipTexts).toEqual(['4/15', '4/22', '4/30']);
      // title 은 원본 yyyy-mm-dd
      expect(chips[0].getAttribute('title')).toBe('2026-04-15');
    });

    // ─── M4 ──────────────────────────────────────────────────────────
    test('M4: 칩 aria-label 에 "상담일지 미작성" 안내 포함', () => {
      const consultants = buildConsultants({ id: 1, name: 'A' });
      const missingConsultationLogs = [
        { consultantId: 9, consultantName: '미작성상담사', missingDates: ['2026-04-15'] }
      ];
      const { container } = render(
        <ScheduleLegend
          {...baseProps({
            consultants,
            calendarSkin: 'integrated',
            missingConsultationLogs
          })}
        />
      );
      const chip = container.querySelector('.mg-v2-legend-missing-date-chip');
      expect(chip).toBeTruthy();
      // 모의 t() 가 defaultValue 를 반환 — `${date} 상담일지 미작성` 포함 확인
      expect(chip.getAttribute('aria-label')).toContain('2026-04-15');
      expect(chip.getAttribute('aria-label')).toContain('상담일지 미작성');
    });

    // ─── M5 ──────────────────────────────────────────────────────────
    test('M5: 통합 스킨이 아니면 missingConsultationLogs 가 있어도 섹션 미노출 (회귀 0)', () => {
      const consultants = buildConsultants({ id: 1, name: 'A' });
      const missingConsultationLogs = [
        { consultantId: 3, consultantName: '상담사', missingDates: ['2026-04-15'] }
      ];
      const { container } = render(
        <ScheduleLegend
          {...baseProps({
            consultants,
            // calendarSkin 미지정 (비통합)
            missingConsultationLogs
          })}
        />
      );
      expect(container.querySelector('.mg-v2-legend-missing-logs')).toBeNull();
    });
  });
});
