/**
 * MGPagination — Clinic-OS small 버튼 계약(h32·r8)·접근성·동작
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { fireEvent, render, screen } from '@testing-library/react';
import MGPagination from '../MGPagination';

const cssSource = fs.readFileSync(path.resolve(__dirname, '..', 'MGPagination.css'), 'utf8');

const renderPagination = (props = {}) => {
  const onPageChange = jest.fn();
  render(
    <MGPagination
      currentPage={3}
      totalPages={10}
      totalItems={200}
      itemsPerPage={20}
      onPageChange={onPageChange}
      showInfo={false}
      showItemsPerPage={false}
      variant="compact"
      {...props}
    />
  );
  return onPageChange;
};

describe('MGPagination Clinic-OS', () => {
  test('모든 버튼이 MGButton small(h32) 계약을 쓴다 — 예전 medium(h40) 아님', () => {
    renderPagination();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(2);
    buttons.forEach((button) => {
      expect(button).toHaveClass('mg-button--small');
      expect(button).toHaveClass('mg-v2-button-sm');
      expect(button).not.toHaveClass('mg-button--medium');
    });
  });

  test('현재 페이지는 primary + aria-current="page"', () => {
    renderPagination();
    const current = screen.getByRole('button', { name: '3' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('mg-button--primary');
    expect(current).not.toHaveClass('mg-pagination__button--current-neutral');
    expect(screen.getByRole('button', { name: '4' })).toHaveClass('mg-button--outline');
    expect(screen.getByRole('button', { name: '4' })).not.toHaveAttribute('aria-current');
  });

  test('중립 톤은 현재 쪽만 aria-current=page 이고 primary가 아니다', () => {
    renderPagination({ activePageTone: 'neutral', currentPage: 2, totalPages: 3 });
    const current = screen.getByRole('button', { current: 'page' });
    expect(current).toHaveTextContent('2');
    expect(current).toHaveClass('mg-pagination__button--current-neutral');
    expect(current).toHaveClass('mg-button--outline');
    expect(current).not.toHaveClass('mg-button--primary');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: '3' })).not.toHaveAttribute('aria-current');
  });

  test('이전·다음은 아이콘 + aria-label, 클릭 시 onPageChange', () => {
    const onPageChange = renderPagination();
    const prev = screen.getByRole('button', { name: '이전 페이지' });
    const next = screen.getByRole('button', { name: '다음 페이지' });
    expect(prev.querySelector('svg')).not.toBeNull();
    expect(prev.textContent).not.toContain('←');
    fireEvent.click(next);
    expect(onPageChange).toHaveBeenCalledWith(4);
    fireEvent.click(prev);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('첫 페이지에서 이전 비활성', () => {
    renderPagination({ currentPage: 1 });
    expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
  });

  test('CSS: r8 토큰·좁은 화면 전폭 차단·하드코딩 색/px 없음', () => {
    expect(cssSource).toMatch(/\.mg-pagination \.mg-pagination__button\.mg-button\s*\{[^}]*border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(cssSource).toMatch(/min-width:\s*var\(--button-height-sm\)/);
    expect(cssSource).toMatch(/width:\s*auto;/);
    expect(cssSource).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(cssSource).not.toMatch(/rgba?\(/);
    const declarations = cssSource.split('\n').filter((line) => !line.includes('@media')).join('\n');
    expect(declarations).not.toMatch(/\b\d+px\b/);
    expect(cssSource).not.toMatch(/!important/);
    expect(cssSource).toMatch(
      /\.mg-pagination \.mg-pagination__button\.mg-button\[aria-current='page'\]\.mg-pagination__button--current-neutral[\s\S]*background-color:\s*var\(--mg-v2-color-surface-stone\)/
    );
    expect(cssSource).toMatch(
      /\.mg-pagination \.mg-pagination__button\.mg-button\[aria-current='page'\]\.mg-pagination__button--current-neutral[\s\S]*border-color:\s*var\(--mg-v2-color-border-strong\)/
    );
    expect(cssSource).toMatch(
      /\.mg-pagination \.mg-pagination__button\.mg-button\[aria-current='page'\]\.mg-pagination__button--current-neutral[\s\S]*font-weight:\s*var\(--mg-v2-font-weight-bold\)/
    );
    expect(cssSource).not.toMatch(/\.mg-pagination__button--current-neutral\.mg-v2-button-outline\s*\{/);
  });
});
