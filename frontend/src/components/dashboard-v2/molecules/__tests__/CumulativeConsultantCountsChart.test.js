/**
 * CumulativeConsultantCountsChart 단위 테스트.
 *
 * P1 (2026-06-06) — 어드민 대시보드 §「상담사 별 통합데이터」 §A 누적 막대 그래프.
 *
 * 검증 매트릭스:
 *  - U1: 활성 상담사 + counts → ranking 순 (DESC) 노출 + 정확한 카운트 텍스트
 *  - U2: 99 초과 카운트 (99+ 축약 없이) → 정확한 카운트 노출
 *  - U3: 모든 카운트 0 → 「누적 데이터가 없습니다」 placeholder
 *  - U4: counts 자체가 비어있음 (Map size=0) → empty placeholder
 *  - U5: 활성 상담사 0명 → null 반환
 *  - U6: progress bar role + aria-valuenow 정확한 카운트 노출
 *  - U7: maskName prop 적용 (PII 마스킹)
 *  - U8: 0건 상담사도 ranking 에 포함 (`--zero` 톤다운 fill 클래스)
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

import CumulativeConsultantCountsChart from '../CumulativeConsultantCountsChart';

const buildConsultants = (...specs) =>
  specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    isActive: spec.isActive ?? true
  }));

const baseProps = (overrides = {}) => ({
  consultants: [],
  getConsultantColor: () => 'var(--ad-b0kla-green)',
  consultantCounts: new Map(),
  ...overrides
});

describe('CumulativeConsultantCountsChart', () => {
  // ─── U1 ──────────────────────────────────────────────────────────
  test('U1: 활성 상담사 + counts → ranking DESC 순 + 정확한 카운트', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' }
    );
    const consultantCounts = new Map([[1, 5], [2, 120], [3, 38]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const rows = container.querySelectorAll('.mg-v2-cumulative-chart__row');
    expect(rows.length).toBe(3);
    const ranks = Array.from(rows).map((r) => r.querySelector('.mg-v2-cumulative-chart__rank').textContent);
    const names = Array.from(rows).map((r) => r.querySelector('.mg-v2-cumulative-chart__name').textContent);
    const values = Array.from(rows).map((r) => r.querySelector('.mg-v2-cumulative-chart__value').textContent);

    expect(ranks).toEqual(['1위', '2위', '3위']);
    expect(names).toEqual(['B', 'C', 'A']);
    expect(values).toEqual(['120회', '38회', '5회']);
  });

  // ─── U2 ──────────────────────────────────────────────────────────
  test('U2: 카운트 > 99 → 정확 카운트 노출 (99+ 축약 없음)', () => {
    const consultants = buildConsultants({ id: 1, name: 'Solo' });
    const consultantCounts = new Map([[1, 999]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const value = container.querySelector('.mg-v2-cumulative-chart__value');
    expect(value.textContent).toBe('999회');
  });

  // ─── U3 ──────────────────────────────────────────────────────────
  test('U3: 모든 카운트 0 → 누적 데이터 없음 placeholder', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    );
    const consultantCounts = new Map([[1, 0], [2, 0]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const empty = container.querySelector('.mg-v2-cumulative-chart__empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toBe('누적 데이터가 없습니다');
    expect(container.querySelectorAll('.mg-v2-cumulative-chart__row').length).toBe(0);
  });

  // ─── U4 ──────────────────────────────────────────────────────────
  test('U4: counts Map 자체가 비어있음 → empty placeholder', () => {
    const consultants = buildConsultants({ id: 1, name: 'A' });

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts: new Map() })}
      />
    );

    const empty = container.querySelector('.mg-v2-cumulative-chart__empty');
    expect(empty).toBeTruthy();
  });

  // ─── U5 ──────────────────────────────────────────────────────────
  test('U5: 활성 상담사 0명 → null 반환 (DOM 미생성)', () => {
    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants: [] })}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  // ─── U6 ──────────────────────────────────────────────────────────
  test('U6: progress bar role 및 aria-valuenow 정확한 카운트', () => {
    const consultants = buildConsultants({ id: 1, name: 'A' });
    const consultantCounts = new Map([[1, 42]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemax')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
  });

  // ─── U7 ──────────────────────────────────────────────────────────
  test('U7: maskName prop 적용 — 표시명 마스킹', () => {
    const consultants = buildConsultants({ id: 1, name: '홍길동' });
    const consultantCounts = new Map([[1, 7]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({
          consultants,
          consultantCounts,
          maskName: (n) => `${n.charAt(0)}**`
        })}
      />
    );

    const name = container.querySelector('.mg-v2-cumulative-chart__name');
    expect(name.textContent).toBe('홍**');
  });

  // ─── U8 ──────────────────────────────────────────────────────────
  test('U8: 0건 상담사도 ranking 에 포함 (--zero fill 클래스)', () => {
    const consultants = buildConsultants(
      { id: 1, name: 'A' },
      { id: 2, name: 'B' }
    );
    const consultantCounts = new Map([[1, 10], [2, 0]]);

    const { container } = render(
      <CumulativeConsultantCountsChart
        {...baseProps({ consultants, consultantCounts })}
      />
    );

    const rows = container.querySelectorAll('.mg-v2-cumulative-chart__row');
    expect(rows.length).toBe(2);
    const fills = container.querySelectorAll('.mg-v2-cumulative-chart__fill');
    expect(fills.length).toBe(2);
    // 2위 (0건) 가 zero 톤다운 클래스
    expect(fills[1].className).toContain('mg-v2-cumulative-chart__fill--zero');
    expect(fills[0].className).not.toContain('mg-v2-cumulative-chart__fill--zero');
  });
});
