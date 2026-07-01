/**
 * SidePeekShell — R-PEEK 레이아웃 organism 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidePeekShell from '../SidePeekShell';
import {
  SIDE_PEEK_SHELL_CSS_CLASS,
  SIDE_PEEK_SHELL_OPEN_CLASS,
  SIDE_PEEK_SHELL_REGION_PEEK
} from '../../../../constants/sidePeekShellConstants';

describe('SidePeekShell', () => {
  test('닫힘 상태 — hidden·aria-hidden', () => {
    const { container } = render(
      <SidePeekShell isOpen={false} onClose={jest.fn()} title="상세">
        <p>stub</p>
      </SidePeekShell>
    );

    const panel = container.querySelector(`[data-region="${SIDE_PEEK_SHELL_REGION_PEEK}"]`);
    expect(panel).toHaveAttribute('hidden');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    expect(panel.className).not.toContain(SIDE_PEEK_SHELL_OPEN_CLASS);
  });

  test('열림 상태 — R-PEEK region·본문·닫기', () => {
    const onClose = jest.fn();
    render(
      <SidePeekShell isOpen onClose={onClose} title="상세">
        <p>peek body</p>
      </SidePeekShell>
    );

    const panel = screen.getByRole('complementary', { name: '상세' });
    expect(panel).toHaveAttribute('data-region', SIDE_PEEK_SHELL_REGION_PEEK);
    expect(panel.className).toContain(SIDE_PEEK_SHELL_CSS_CLASS);
    expect(panel.className).toContain(SIDE_PEEK_SHELL_OPEN_CLASS);
    expect(screen.getByText('peek body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '패널 닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('Escape 키 — onClose 호출', () => {
    const onClose = jest.fn();
    render(
      <SidePeekShell isOpen onClose={onClose} title="상세">
        <p>body</p>
      </SidePeekShell>
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
