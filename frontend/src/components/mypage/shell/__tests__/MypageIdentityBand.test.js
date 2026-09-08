/**
 * MypageIdentityBand — dual-role identity band presence
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MypageIdentityBand from '../MypageIdentityBand';

describe('MypageIdentityBand', () => {
  test('renders identity band with name and dual-role label (data-testid)', () => {
    render(
      <MypageIdentityBand displayName="김운영" roleLabel="운영 · 상담" />
    );

    expect(screen.getByTestId('mypage-identity-band')).toBeInTheDocument();
    expect(screen.getByTestId('mypage-identity-name')).toHaveTextContent('김운영');
    expect(screen.getByTestId('mypage-identity-role')).toHaveTextContent('운영 · 상담');
  });

  test('SafeText fallback when displayName empty', () => {
    render(<MypageIdentityBand displayName="" roleLabel="운영 · 상담" />);
    expect(screen.getByTestId('mypage-identity-name')).toHaveTextContent('—');
  });
});
