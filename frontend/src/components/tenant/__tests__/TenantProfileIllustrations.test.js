/**
 * TenantProfileIllustrations — 32px Lucide stroke 빈 상태 아이콘 회귀.
 *
 * Spec: CORE_SOLUTION_PRODUCT_VISUAL_TOKEN_SSOT_SPEC §7.2
 */
import React from 'react';
import { render } from '@testing-library/react';
import {
  TenantSubscriptionEmptyIllustration,
  TenantPaymentEmptyIllustration
} from '../TenantProfileIllustrations';

describe('TenantProfileIllustrations', () => {
  describe('TenantSubscriptionEmptyIllustration', () => {
    it('aria-hidden 과 기본 32px Lucide stroke 를 렌더한다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('width')).toBe('32');
      expect(svg.getAttribute('height')).toBe('32');
    });

    it('size prop 으로 크기를 재정의할 수 있다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration size={64} />);
      const svg = container.querySelector('svg');
      expect(svg.getAttribute('width')).toBe('64');
      expect(svg.getAttribute('height')).toBe('64');
    });
  });

  describe('TenantPaymentEmptyIllustration', () => {
    it('aria-hidden 과 기본 32px Lucide stroke 를 렌더한다', () => {
      const { container } = render(<TenantPaymentEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('width')).toBe('32');
      expect(svg.getAttribute('height')).toBe('32');
    });
  });
});
