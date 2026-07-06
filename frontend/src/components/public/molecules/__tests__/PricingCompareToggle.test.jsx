/**
 * PricingCompareToggle 단위 테스트 (Refine v2 W2)
 *
 * @author MindGarden
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

const PricingCompareToggle = require('../PricingCompareToggle').default;

describe('PricingCompareToggle', () => {
  it('자세한 비교 보기 라벨을 노출한다', () => {
    render(<PricingCompareToggle expanded={false} onToggle={() => {}} />);
    expect(screen.getByText('자세한 비교 보기')).toBeInTheDocument();
  });

  it('기본은 expanded=false → aria-expanded="false"', () => {
    render(<PricingCompareToggle expanded={false} onToggle={() => {}} />);
    expect(
      screen.getByTestId('pricing-compare-toggle').getAttribute('aria-expanded')
    ).toBe('false');
  });

  it('expanded=true → aria-expanded="true" 및 expanded 클래스', () => {
    render(<PricingCompareToggle expanded onToggle={() => {}} />);
    const btn = screen.getByTestId('pricing-compare-toggle');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.className).toContain('mg-v2-compare-toggle--expanded');
  });

  it('controlsId 가 aria-controls 속성으로 적용된다', () => {
    render(
      <PricingCompareToggle
        expanded={false}
        onToggle={() => {}}
        controlsId="my-region"
      />
    );
    expect(
      screen.getByTestId('pricing-compare-toggle').getAttribute('aria-controls')
    ).toBe('my-region');
  });

  it('클릭 시 onToggle 이 호출된다', () => {
    const onToggle = jest.fn();
    render(<PricingCompareToggle expanded={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('pricing-compare-toggle'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
