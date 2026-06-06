/**
 * MissingConsultationLogsList — 신규 공통 컴포넌트 단위 테스트.
 *
 * Phase 3-B (R6 2026-06-06) — ScheduleLegend.js 에서 추출된 상담일지 누락 일자 리스트가
 * 통합 스케줄(variant='integrated') · 어드민 대시보드(variant='dashboard') 양쪽에서
 * 일관된 sentinel(null)/placeholder([])/리스트 동작을 보장하는지 검증한다.
 *
 * 검증 매트릭스:
 *  - L1: items === null → null 반환 (다른 라우트 회귀 0)
 *  - L2: items === [] + variant='integrated' → 「이번 달 모든 일정의…」 placeholder
 *  - L3: items === [] + variant='dashboard'  → 「지난 일정의 모든 상담일지…」 placeholder
 *  - L4: items 채워짐 → 상담사별 행 + 칩 노출 + count 표시
 *  - L5: 칩 라벨이 'YYYY-MM-DD' → 'M/D' 로 포맷되고 title 은 원본 유지
 *  - L6: showTitle=false → 타이틀 미노출
 *  - L7: 칩 aria-label 에 「상담일지 미작성」 + 날짜 포함
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

import MissingConsultationLogsList, { formatToMonthDay } from '../MissingConsultationLogsList';

describe('MissingConsultationLogsList', () => {
  // ─── L1 ──────────────────────────────────────────────────────────
  test('L1: items === null → null 반환 (sentinel — 첫 응답 미수신)', () => {
    const { container } = render(<MissingConsultationLogsList items={null} />);
    expect(container.firstChild).toBeNull();
  });

  // ─── L2 ──────────────────────────────────────────────────────────
  test('L2: items === [] + variant=\'integrated\' → 「이번 달 모든 일정의…」 placeholder', () => {
    const { container } = render(
      <MissingConsultationLogsList items={[]} variant="integrated" />
    );
    const empty = container.querySelector('.mg-v2-legend-missing-logs__empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('이번 달 모든 일정의 상담일지가 작성되었습니다');
    expect(container.querySelectorAll('.mg-v2-legend-missing-logs__item').length).toBe(0);
  });

  // ─── L3 ──────────────────────────────────────────────────────────
  test('L3: items === [] + variant=\'dashboard\' → 「지난 일정의 모든 상담일지…」 placeholder', () => {
    const { container } = render(
      <MissingConsultationLogsList items={[]} variant="dashboard" />
    );
    const empty = container.querySelector('.mg-v2-legend-missing-logs__empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toContain('지난 일정의 모든 상담일지가 작성되었습니다');
  });

  // ─── L4 ──────────────────────────────────────────────────────────
  test('L4: items 채워짐 → 상담사별 행 + 칩 + count 표시', () => {
    const items = [
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
    const { container } = render(<MissingConsultationLogsList items={items} />);

    const rows = container.querySelectorAll('.mg-v2-legend-missing-logs__item');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.mg-v2-legend-missing-logs__name').textContent).toBe('이혁진');
    expect(rows[0].querySelector('.mg-v2-legend-missing-logs__count').textContent).toBe('(2)');

    const chips = container.querySelectorAll('.mg-v2-legend-missing-date-chip');
    expect(chips.length).toBe(3);
    expect(Array.from(chips).map((c) => c.textContent)).toEqual(['4/15', '4/22', '4/30']);
  });

  // ─── L5 ──────────────────────────────────────────────────────────
  test('L5: formatToMonthDay 헬퍼 — 「YYYY-MM-DD」 → 「M/D」 (파싱 실패 시 원본)', () => {
    expect(formatToMonthDay('2026-04-15')).toBe('4/15');
    expect(formatToMonthDay('2026-12-01')).toBe('12/1');
    expect(formatToMonthDay('not-a-date')).toBe('not-a-date');
    expect(formatToMonthDay(null)).toBe('');
    expect(formatToMonthDay(undefined)).toBe('');
  });

  // ─── L6 ──────────────────────────────────────────────────────────
  test('L6: showTitle=false → 타이틀 미노출 (대시보드 외부 헤더 사용 케이스)', () => {
    const items = [
      { consultantId: 1, consultantName: 'A', missingDates: ['2026-04-15'] }
    ];
    const { container } = render(
      <MissingConsultationLogsList items={items} variant="dashboard" showTitle={false} />
    );
    expect(container.querySelector('.mg-v2-legend-title')).toBeNull();
    expect(container.querySelectorAll('.mg-v2-legend-missing-logs__item').length).toBe(1);
  });

  // ─── L7 ──────────────────────────────────────────────────────────
  test('L7: 칩 aria-label 에 날짜 + 「상담일지 미작성」 포함', () => {
    const items = [
      { consultantId: 9, consultantName: '미작성상담사', missingDates: ['2026-04-15'] }
    ];
    const { container } = render(<MissingConsultationLogsList items={items} />);
    const chip = container.querySelector('.mg-v2-legend-missing-date-chip');
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('aria-label')).toContain('2026-04-15');
    expect(chip.getAttribute('aria-label')).toContain('상담일지 미작성');
    expect(chip.getAttribute('title')).toBe('2026-04-15');
  });
});
