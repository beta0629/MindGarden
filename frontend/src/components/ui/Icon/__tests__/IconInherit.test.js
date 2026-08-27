/**
 * Icon INHERIT — LNB 용 inline color 미설정
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import React from 'react';
import { render } from '@testing-library/react';
import Icon from '../Icon';

describe('Icon INHERIT (LNB on-fill)', () => {
  it('INHERIT 는 inline color 를 넣지 않고 inherit 클래스를 쓴다', () => {
    const { container } = render(<Icon name="CALENDAR_DAYS" size="MD" color="INHERIT" />);
    const el = container.querySelector('.mg-v2-icon');
    expect(el).not.toBeNull();
    expect(el.className).toContain('mg-v2-icon--inherit');
    const style = el.getAttribute('style') || '';
    expect(style).not.toMatch(/(?:^|;)\s*color\s*:/i);
    expect(style).not.toMatch(/#0[Ff]172[Aa]|rgb\(\s*15\s*,\s*23\s*,\s*42\s*\)/);
    const svg = el.querySelector('svg');
    if (svg) {
      const stroke = svg.getAttribute('stroke') || '';
      expect(stroke === '' || stroke === 'currentColor').toBe(true);
    }
  });

  it('PRIMARY 는 primary 클래스 경로를 유지한다', () => {
    const { container } = render(<Icon name="CALENDAR_DAYS" size="MD" color="PRIMARY" />);
    const el = container.querySelector('.mg-v2-icon');
    expect(el.className).toContain('mg-v2-icon--primary');
    expect(el.className).not.toContain('mg-v2-icon--inherit');
  });
});
