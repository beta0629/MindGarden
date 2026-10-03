/**
 * MypageAccountCard — 내 계정 (구 MypageIdentityBand 흡수)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MypageAccountCard from '../MypageAccountCard';

describe('MypageAccountCard', () => {
  test('renders name, center and display-only role chip', () => {
    render(
      <MypageAccountCard displayName="김운영" centerName="마음센터" roleLabel="운영 · 상담" />
    );

    expect(screen.getByTestId('mypage-account-card')).toBeInTheDocument();
    expect(screen.getByTestId('mypage-account-name')).toHaveTextContent('김운영');
    expect(screen.getByTestId('mypage-account-center')).toHaveTextContent('마음센터');
    const chip = screen.getByTestId('mypage-account-role');
    expect(chip).toHaveTextContent('운영 · 상담');
    expect(chip.tagName).toBe('SPAN');
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('SafeText fallback when displayName empty; center row omitted when empty', () => {
    render(<MypageAccountCard displayName="" roleLabel="운영 · 상담" />);
    expect(screen.getByTestId('mypage-account-name')).toHaveTextContent('—');
    expect(screen.queryByTestId('mypage-account-center')).toBeNull();
  });

  test('avatar is rendered once', () => {
    const { container } = render(<MypageAccountCard displayName="홍길동" roleLabel="내담자" />);
    expect(container.querySelectorAll('.mg-v2-avatar')).toHaveLength(1);
  });
});
