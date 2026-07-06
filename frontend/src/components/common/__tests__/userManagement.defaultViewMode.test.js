/**
 * PER_PAGE G2-01 — 사용자 관리 3화면 기본 보기 모드 SSOT
 * @see ../ViewModeToggle.js
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ViewModeToggle, { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../ViewModeToggle';

describe('사용자 관리 목록 기본 보기 (G2-01)', () => {
  it('USER_MANAGEMENT_DEFAULT_VIEW_MODE는 smallCard이다', () => {
    expect(USER_MANAGEMENT_DEFAULT_VIEW_MODE).toBe('smallCard');
  });

  it('ViewModeToggle 기본 options에 smallCard·list·largeCard가 포함된다', () => {
    const onChange = jest.fn();
    render(<ViewModeToggle viewMode={USER_MANAGEMENT_DEFAULT_VIEW_MODE} onViewModeChange={onChange} />);

    expect(screen.getByRole('button', { name: '작은 카드' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '리스트' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '큰 카드' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '리스트' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
