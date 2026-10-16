/**
 * 상담사 색 팔레트 — API 목록이 범례·칩의 같은 슬롯이 되는지.
 */

import {
  consultantColorClassName,
  extractConsultantColors,
  resolveConsultantColorSlot,
  syncConsultantColorSlotRules,
  CONSULTANT_COLOR_SLOT_STYLE_ID
} from '../consultantColorPalette';

describe('consultantColorPalette', () => {
  test('래퍼를 푼 colors 와 전체 래퍼 둘 다 읽는다', () => {
    expect(extractConsultantColors({
      colors: [' #3b82f6 ', '', null, '#10b981']
    })).toEqual(['#3b82f6', '#10b981']);
    expect(extractConsultantColors({
      success: true,
      data: { colors: ['#f59e0b'] }
    })).toEqual(['#f59e0b']);
    expect(extractConsultantColors(null)).toEqual([]);
  });

  test('같은 상담사 목록이면 범례와 칩이 같은 슬롯이다', () => {
    const consultants = [
      { id: 22, name: 'later' },
      { id: 3, name: 'earlier' }
    ];
    const size = 10;
    expect(resolveConsultantColorSlot(3, consultants, size)).toBe(1);
    expect(resolveConsultantColorSlot('3', consultants, size)).toBe(1);
    expect(resolveConsultantColorSlot(22, consultants, size)).toBe(2);
    expect(consultantColorClassName(1)).toBe('mg-v2-consultant-color mg-v2-consultant-color--1');
    expect(consultantColorClassName(null)).toContain('mg-v2-consultant-color--fallback');
  });

  test('팔레트가 없으면 슬롯을 만들지 않는다', () => {
    expect(resolveConsultantColorSlot(1, [{ id: 1 }], 0)).toBeNull();
  });

  test('슬롯 규칙은 CSS 변수만 가리키고 요소 인라인 스타일이 아니다', () => {
    syncConsultantColorSlotRules(2);
    const style = document.getElementById(CONSULTANT_COLOR_SLOT_STYLE_ID);
    expect(style.textContent).toContain('.mg-v2-consultant-color--1{--mg-consultant-color:var(--consultant-color-1)}');
    expect(style.textContent).toContain('.mg-v2-consultant-color--2{--mg-consultant-color:var(--consultant-color-2)}');
    expect(style.textContent).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    syncConsultantColorSlotRules(0);
    expect(style.textContent).toBe('');
  });
});
