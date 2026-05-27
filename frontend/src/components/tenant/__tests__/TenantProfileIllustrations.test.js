/**
 * TenantProfileIllustrations — B0KlA 빈 상태 일러스트 회귀 테스트.
 *
 * - 핸드오프 §C: 100 x 100 viewBox, aria-hidden="true" 정책 검증.
 * - 토큰 기반 색상 (인라인 fill/stroke 하드코딩 없음) 검증.
 *
 * @see docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_DESIGN_HANDOFF.md
 */
import React from 'react';
import { render } from '@testing-library/react';
import {
  TenantSubscriptionEmptyIllustration,
  TenantPaymentEmptyIllustration
} from '../TenantProfileIllustrations';

describe('TenantProfileIllustrations', () => {
  describe('TenantSubscriptionEmptyIllustration', () => {
    it('viewBox 가 100x100 이고 aria-hidden="true" 가 설정된다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    });

    it('기본 크기 100px 로 렌더된다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg.getAttribute('width')).toBe('100');
      expect(svg.getAttribute('height')).toBe('100');
    });

    it('size prop 으로 크기를 재정의할 수 있다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration size={64} />);
      const svg = container.querySelector('svg');
      expect(svg.getAttribute('width')).toBe('64');
      expect(svg.getAttribute('height')).toBe('64');
    });

    it('인라인 fill/stroke 하드코딩 없이 클래스 기반 토큰을 사용한다', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration />);
      const allShapes = container.querySelectorAll('rect, line, polyline, circle');
      allShapes.forEach((node) => {
        expect(node.getAttribute('fill')).toBeNull();
        expect(node.getAttribute('stroke')).toBeNull();
      });
    });

    it('체크마크 등 SVG 도형이 렌더된다 (스냅샷)', () => {
      const { container } = render(<TenantSubscriptionEmptyIllustration />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('TenantPaymentEmptyIllustration', () => {
    it('viewBox 가 100x100 이고 aria-hidden="true" 가 설정된다', () => {
      const { container } = render(<TenantPaymentEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    });

    it('기본 크기 100px 로 렌더된다', () => {
      const { container } = render(<TenantPaymentEmptyIllustration />);
      const svg = container.querySelector('svg');
      expect(svg.getAttribute('width')).toBe('100');
      expect(svg.getAttribute('height')).toBe('100');
    });

    it('인라인 fill/stroke 하드코딩 없이 클래스 기반 토큰을 사용한다', () => {
      const { container } = render(<TenantPaymentEmptyIllustration />);
      const allShapes = container.querySelectorAll('rect, line, polyline, circle');
      allShapes.forEach((node) => {
        expect(node.getAttribute('fill')).toBeNull();
        expect(node.getAttribute('stroke')).toBeNull();
      });
    });

    it('지갑+카드 SVG 도형이 렌더된다 (스냅샷)', () => {
      const { container } = render(<TenantPaymentEmptyIllustration />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
