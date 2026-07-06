/**
 * BrandSymbol 단위 테스트 (Phase C-Refine v2)
 *
 * SPEC §8: variant props 로 light/dark 색상 반전.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

const BrandSymbol = require('../BrandSymbol').default;

describe('BrandSymbol', () => {
  it('renders an SVG with role="img"', () => {
    render(<BrandSymbol />);
    const svg = screen.getByRole('img');
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('applies default dark variant class', () => {
    const { container } = render(<BrandSymbol />);
    expect(container.querySelector('.mg-v2-brand-symbol--dark')).toBeInTheDocument();
  });

  it('applies light variant class when specified', () => {
    const { container } = render(<BrandSymbol variant="light" />);
    expect(container.querySelector('.mg-v2-brand-symbol--light')).toBeInTheDocument();
  });

  it('respects custom size prop', () => {
    const { container } = render(<BrandSymbol size={64} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '64');
    expect(svg).toHaveAttribute('height', '64');
  });

  it('uses Core Solution aria-label by default', () => {
    const svg = render(<BrandSymbol />).container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', 'Core Solution');
  });

  it('uses custom title as aria-label when provided', () => {
    const svg = render(<BrandSymbol title="Custom Brand" />).container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-label', 'Custom Brand');
  });

  it('renders a gradient definition for ring stroke', () => {
    const { container } = render(<BrandSymbol />);
    expect(container.querySelector('linearGradient')).toBeInTheDocument();
  });
});
