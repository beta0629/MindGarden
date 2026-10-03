/**
 * _notifications.css 정적 계약 — 토스트 닫기 버튼이 MGButton 규칙과 분리, 진행바는 실제 duration 변수
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import fs from 'fs';
import path from 'path';

const css = fs.readFileSync(
  path.resolve(__dirname, '../../../styles/06-components/_notifications.css'),
  'utf8'
);

const ruleBody = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return match ? match[1] : '';
};

describe('_notifications.css toast close / progress', () => {
  test('닫기 버튼은 데스크톱에서도 우상단 absolute, 크기는 --notification-close-size', () => {
    const body = ruleBody('.mg-notification .mg-notification-close');
    expect(body).toMatch(/position:\s*absolute/);
    expect(body).toMatch(/top:\s*var\(--spacing-sm\)/);
    expect(body).toMatch(/right:\s*var\(--spacing-sm\)/);
    expect(body).toMatch(/width:\s*var\(--notification-close-size\)/);
    expect(body).toMatch(/border:\s*0/);
    expect(body).not.toMatch(/!important/);
  });

  test('MGButton 병합용 .mg-notification-close.mg-button 규칙이 남아 있지 않다', () => {
    expect(css).not.toMatch(/\.mg-notification-close\.mg-button/);
    expect(css).not.toMatch(/\.mg-notification-banner-close\.mg-button/);
  });

  test('토스트는 position: relative 로 닫기 버튼 기준이 된다', () => {
    expect(ruleBody('.mg-notification')).toMatch(/position:\s*relative/);
  });

  test('진행바는 고정 0.5s 가 아니라 --notification-progress-duration, paused 면 멈춘다', () => {
    const bar = ruleBody('.mg-notification-progress-bar');
    expect(bar).toMatch(/animation-duration:\s*var\(--notification-progress-duration\)/);
    expect(bar).not.toMatch(/0\.5s/);
    expect(ruleBody('.mg-notification--paused .mg-notification-progress-bar'))
      .toMatch(/animation-play-state:\s*paused/);
  });
});
