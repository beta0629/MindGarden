/**
 * 상담사 홈 커버 모션 v3.2 — 토큰만·transform/opacity만·reduced-motion 정적·탭 숨김 정지
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import ConsultantHomeCover from '../ConsultantHomeCover';

const css = fs.readFileSync(path.join(__dirname, '..', 'ConsultantCoverChapterHome.css'), 'utf8');
const block = css.slice(css.indexOf('커버 모션 v3.2'), css.indexOf('@media (prefers-reduced-motion: reduce)', css.indexOf('커버 모션 v3.2')));

describe('ConsultantHomeCover motion v3.2', () => {
  it('앰비언트 요소(잎 4·먼지 8·창빛·하이라이트) 렌더', () => {
    const { container } = render(<ConsultantHomeCover consultantName="x" />);
    expect(container.querySelectorAll('.consultant-cover-ambient__leaf')).toHaveLength(4);
    expect(container.querySelectorAll('.consultant-cover-ambient__dust circle')).toHaveLength(8);
    expect(container.querySelector('.consultant-cover-ambient__warm')).not.toBeNull();
    expect(container.querySelector('.consultant-cover-ambient__hl')).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/(fill|stop-color)="#/i);
  });
  it('visibilitychange 로 일시정지', () => {
    const { getByTestId } = render(<ConsultantHomeCover consultantName="x" />);
    const el = getByTestId('consultant-home-cover');
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(el.getAttribute('data-motion-paused')).toBe('true');
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(el.getAttribute('data-motion-paused')).toBe('false');
  });
  it('키프레임은 transform·opacity만, hex 없음', () => {
    const frames = block.match(/@keyframes[^{]+\{([^{}]*\{[^}]*\})+\s*\}/g) || [];
    expect(frames.length).toBeGreaterThanOrEqual(8);
    frames.forEach((f) => {
      const props = [...f.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]).filter((p) => !p.startsWith('-'));
      props.forEach((p) => expect(['opacity', 'transform']).toContain(p));
    });
    expect(block).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
  });
  it('reduced-motion: 등장 포함 전부 끔', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\/\* 등장 모션까지[\s\S]*?animation: none;/);
  });
});
