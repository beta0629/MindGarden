/**
 * RemainingSessionsBadge — generic 모드 확장 회귀 테스트.
 *
 * 검증 매트릭스 (F16~F20):
 *  - F16: legacy 모드 — remainingSessions={5} → "5 회기 남음" 텍스트, mg-v2-count-badge 클래스
 *  - F17: generic 모드 — count={12} → "12" 텍스트만 (회기 접미사 없음)
 *  - F18: generic 모드 className/ariaLabel/title 가 DOM 속성에 정확히 매핑
 *  - F19: remainingSessions={null} && count 미전달 → null 렌더 (DOM 미생성)
 *  - F20: generic 모드 count={0} 도 정상 노출 (null/undefined 와 구분)
 *
 * SSOT: frontend/src/components/common/RemainingSessionsBadge.js
 *
 * @author MindGarden core-tester
 * @since 2026-06-09
 */

import React from 'react';
import { render } from '@testing-library/react';

import RemainingSessionsBadge from '../RemainingSessionsBadge';

describe('RemainingSessionsBadge — generic 모드 확장', () => {
  // ─── F16 ───────────────────────────────────────────────────────────
  test('F16: legacy 모드 — remainingSessions={5} → "5 회기 남음" 텍스트, mg-v2-count-badge 클래스', () => {
    const { container } = render(<RemainingSessionsBadge remainingSessions={5} />);
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('5 회기 남음');
    expect(badge.className).toContain('mg-v2-count-badge');
  });

  // ─── F17 ───────────────────────────────────────────────────────────
  test('F17: generic 모드 — count={12} → "12" 텍스트만 (회기 접미사 없음)', () => {
    const { container } = render(<RemainingSessionsBadge count={12} />);
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('12');
    expect(badge.textContent).not.toMatch(/회기/);
    expect(badge.className).toContain('mg-v2-count-badge');
  });

  // ─── F18 ───────────────────────────────────────────────────────────
  test('F18: generic 모드 className/ariaLabel/title 가 DOM 속성에 정확히 매핑', () => {
    const { container } = render(
      <RemainingSessionsBadge
        count={42}
        className="my-extra-class mg-v2-count-badge--zero"
        ariaLabel="홍길동, 이번 달 완료 42회"
        title="42회"
      />
    );
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('42');
    // 기본 mg-v2-count-badge 와 추가 className 모두 포함
    expect(badge.className).toContain('mg-v2-count-badge');
    expect(badge.className).toContain('my-extra-class');
    expect(badge.className).toContain('mg-v2-count-badge--zero');
    expect(badge.getAttribute('aria-label')).toBe('홍길동, 이번 달 완료 42회');
    expect(badge.getAttribute('title')).toBe('42회');
  });

  // ─── F19 ───────────────────────────────────────────────────────────
  test('F19: remainingSessions={null} && count 미전달 → null 렌더 (DOM 미생성)', () => {
    const { container } = render(<RemainingSessionsBadge remainingSessions={null} />);
    expect(container.querySelector('span')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  // ─── F20 ───────────────────────────────────────────────────────────
  test('F20: generic 모드 count={0} 도 정상 노출 (null/undefined 와 구분)', () => {
    const { container } = render(<RemainingSessionsBadge count={0} />);
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('0');
    // 0 은 generic 모드에서 정상 노출되어야 한다
    expect(badge.className).toContain('mg-v2-count-badge');
  });

  // 추가 보강: '99+' 문자열도 generic 모드에서 그대로 노출 (overflow 가공은 호출자 책임)
  test('보강: generic 모드 count="99+" 문자열도 그대로 노출', () => {
    const { container } = render(<RemainingSessionsBadge count="99+" title="120회" />);
    const badge = container.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('99+');
    expect(badge.getAttribute('title')).toBe('120회');
  });
});
