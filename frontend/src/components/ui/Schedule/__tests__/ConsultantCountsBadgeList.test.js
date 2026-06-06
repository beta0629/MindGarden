/**
 * ConsultantCountsBadgeList — 신규 공통 컴포넌트 단위 테스트.
 *
 * Phase 3-B (R6 2026-06-06) — ScheduleLegend.js 에서 추출된 상담사 칩 + 카운트 배지
 * 공통 리스트가 통합 스케줄·어드민 대시보드 양쪽에서 동일 동작을 보장하는지 검증한다.
 *
 * 검증 매트릭스:
 *  - C1: 활성 상담사 + counts Map → 모든 활성 상담사 노출 + 배지 표시
 *  - C2: 0건 상담사 → mg-v2-count-badge--zero 톤다운 클래스 적용
 *  - C3: count > 99 → **정확한 카운트** 노출 (P1 2026-06-06: 99+ 폐지)
 *  - C4: mode='cumulative' → 라벨 「상담사 · 누적 완료」
 *  - C5: mode='monthly' + consultantCountsMonth=5 → 라벨 「상담사 · 5월 완료」
 *  - C6: mode='monthly' + consultantCountsMonth=null → 「상담사」 fallback
 *  - C7: 비활성(isActive=false) 상담사는 제외
 *  - C8: 빈 배열 → null 반환 (DOM 미생성)
 *  - C9: 일반 객체 카운트 매핑도 정상 lookup
 *  - C10: aria-label cumulative 분기 검증 (`누적 완료 N회`)
 *
 * @author MindGarden core-coder
 * @since 2026-06-06
 */

import React from 'react';
import { render } from '@testing-library/react';

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

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v, fb = '') => (v == null || v === '' ? fb : String(v))
}));

import ConsultantCountsBadgeList from '../ConsultantCountsBadgeList';

const buildConsultants = (...specs) =>
  specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    isActive: spec.isActive ?? true
  }));

const baseProps = (overrides = {}) => ({
  consultants: [],
  getConsultantColor: () => 'var(--mg-primary-500)',
  consultantCounts: new Map(),
  ...overrides
});

describe('ConsultantCountsBadgeList', () => {
  // ─── C1 ──────────────────────────────────────────────────────────
  test('C1: 활성 상담사 + counts Map → 활성 전원 노출 + 배지 표시', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    );
    const consultantCounts = new Map([[1, 5], [2, 0], [3, 12]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts, mode: 'monthly', consultantCountsMonth: 6 })}
      />
    );

    const items = container.querySelectorAll('.mg-v2-legend-item');
    expect(items.length).toBe(3);
    const badges = container.querySelectorAll('.mg-v2-legend-count-badge');
    expect(badges.length).toBe(3);
    expect(Array.from(badges).map((b) => b.textContent)).toEqual(['5', '0', '12']);
  });

  // ─── C2 ──────────────────────────────────────────────────────────
  test('C2: count === 0 → mg-v2-count-badge--zero 톤다운 클래스 적용', () => {
    const consultants = buildConsultants({ id: 1, name: 'Zero' });
    const consultantCounts = new Map([[1, 0]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge).toBeTruthy();
    expect(badge.className).toContain('mg-v2-count-badge--zero');
    expect(badge.textContent).toBe('0');
  });

  // ─── C3 ──────────────────────────────────────────────────────────
  test('C3: count > 99 → 정확한 카운트 그대로 노출 (P1: 99+ 폐지)', () => {
    const consultants = buildConsultants({ id: 1, name: 'Many' });
    const consultantCounts = new Map([[1, 150]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge.textContent).toBe('150');
    // P1: title attribute 노출 없음 (aria-label 이 정확한 카운트 포함).
    expect(badge.hasAttribute('title')).toBe(false);
  });

  // ─── C3-2 ────────────────────────────────────────────────────────
  test('C3-2: count === 99 (경계) → 정확히 「99」 노출', () => {
    const consultants = buildConsultants({ id: 1, name: 'Edge' });
    const consultantCounts = new Map([[1, 99]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge.textContent).toBe('99');
  });

  // ─── C3-3 ────────────────────────────────────────────────────────
  test('C3-3: count === 1234 (4자리) → 정확한 카운트 노출 (시각 깨짐 가드)', () => {
    const consultants = buildConsultants({ id: 1, name: 'Huge' });
    const consultantCounts = new Map([[1, 1234]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge.textContent).toBe('1234');
  });

  // ─── C4 ──────────────────────────────────────────────────────────
  test('C4: mode=\'cumulative\' → 라벨 「상담사 · 누적 완료」', () => {
    const consultants = buildConsultants({ id: 1, name: '홍길동' });
    const consultantCounts = new Map([[1, 7]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts, mode: 'cumulative' })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title')).map((el) => el.textContent);
    expect(titles).toContain('상담사 · 누적 완료');
  });

  // ─── C5 ──────────────────────────────────────────────────────────
  test('C5: mode=\'monthly\' + consultantCountsMonth=5 → 라벨 「상담사 · 5월 완료」', () => {
    const consultants = buildConsultants({ id: 1, name: '홍길동' });
    const consultantCounts = new Map([[1, 3]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({
          consultants,
          consultantCounts,
          mode: 'monthly',
          consultantCountsMonth: 5
        })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title')).map((el) => el.textContent);
    expect(titles).toContain('상담사 · 5월 완료');
  });

  // ─── C6 ──────────────────────────────────────────────────────────
  test('C6: mode=\'monthly\' + consultantCountsMonth=null → 「상담사」 fallback (i18n key 직반환)', () => {
    const consultants = buildConsultants({ id: 1, name: '홍길동' });
    const consultantCounts = new Map([[1, 3]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({
          consultants,
          consultantCounts,
          mode: 'monthly',
          consultantCountsMonth: null
        })}
      />
    );

    const titles = Array.from(container.querySelectorAll('.mg-v2-legend-title')).map((el) => el.textContent);
    // mock t() 가 defaultValue 미사용 시 key 그대로 반환
    expect(titles).toContain('common.labels.consultant');
  });

  // ─── C7 ──────────────────────────────────────────────────────────
  test('C7: 비활성(isActive=false) 상담사는 제외', () => {
    const consultants = [
      { id: 1, name: 'Active', isActive: true },
      { id: 2, name: 'Inactive', isActive: false }
    ];
    const consultantCounts = new Map([[1, 1], [2, 1]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const items = container.querySelectorAll('.mg-v2-legend-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Active');
  });

  // ─── C8 ──────────────────────────────────────────────────────────
  test('C8: 활성 상담사 0명 → null 반환 (DOM 미생성)', () => {
    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants: [] })}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  // ─── C9 ──────────────────────────────────────────────────────────
  test('C9: 일반 객체 카운트 매핑도 정상 lookup (string key 폴백 포함)', () => {
    const consultants = buildConsultants({ id: 101, name: 'PlainObj' });
    const consultantCounts = { 101: 12 };

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge.textContent).toBe('12');
  });

  // ─── C10 ─────────────────────────────────────────────────────────
  test('C10: mode=\'cumulative\' aria-label 분기 — 「누적 완료 N회」', () => {
    const consultants = buildConsultants({ id: 1, name: '김선희' });
    const consultantCounts = new Map([[1, 39]]);

    const { container } = render(
      <ConsultantCountsBadgeList
        {...baseProps({ consultants, consultantCounts, mode: 'cumulative' })}
      />
    );

    const badge = container.querySelector('.mg-v2-legend-count-badge');
    expect(badge.getAttribute('aria-label')).toBe('김선희, 누적 완료 39회');
  });
});
