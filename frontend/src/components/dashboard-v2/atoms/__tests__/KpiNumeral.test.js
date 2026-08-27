/**
 * KpiNumeral digit-roll 단위 테스트
 * @author CoreSolution
 * @since 2026-08-27
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import KpiNumeral from '../KpiNumeral';

const mockMatchMedia = (matchesReduce) => {
  window.matchMedia = jest.fn((query) => ({
    matches: matchesReduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
};

describe('KpiNumeral', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.clearAllMocks();
  });

  describe('formatting', () => {
    it('천 단위 구분자를 유지한 채 표시한다', () => {
      mockMatchMedia(false);
      render(<KpiNumeral value="1,204" unit="명" data-testid="kpi-value" />);
      expect(screen.getByTestId('kpi-value')).toHaveTextContent('1,204');
      expect(screen.getByLabelText('1,204명')).toBeInTheDocument();
      expect(screen.getByText('명', { selector: '.mg-v2-kpi-numeral__unit' })).toBeInTheDocument();
    });

    it('unit은 롤하지 않고 정적 span으로 둔다', () => {
      mockMatchMedia(false);
      const { container } = render(<KpiNumeral value={12} unit="건" />);
      expect(container.querySelector('.mg-v2-kpi-numeral__unit')).toHaveTextContent('건');
      expect(container.querySelector('.mg-v2-kpi-numeral__unit')
        .closest('.mg-v2-kpi-numeral__digit')).toBeNull();
    });

    it('숫자 없는 폴백은 롤 없이 plaintext만 표시한다', () => {
      mockMatchMedia(false);
      const { container } = render(<KpiNumeral value={null} unit="" />);
      expect(container.querySelector('.mg-v2-kpi-numeral__roll')).toBeNull();
      expect(container.querySelector('.mg-v2-kpi-numeral__plaintext')).toHaveTextContent('—');
    });
  });

  describe('digit-roll', () => {
    it('마운트 시 digit-roll 리본을 렌더한다', () => {
      mockMatchMedia(false);
      const { container } = render(<KpiNumeral value={42} unit="건" />);
      expect(container.querySelector('.mg-v2-kpi-numeral__value--rolling')).toBeInTheDocument();
      expect(container.querySelectorAll('.mg-v2-kpi-numeral__digit-ribbon--rolling')).toHaveLength(2);
    });

    it('value 변경 시 롤 레이어를 다시 마운트한다', () => {
      mockMatchMedia(false);
      const { container, rerender } = render(<KpiNumeral value={10} unit="" />);
      const firstRoll = container.querySelector('.mg-v2-kpi-numeral__roll');
      expect(firstRoll).toBeInTheDocument();

      rerender(<KpiNumeral value={99} unit="" />);
      const secondRoll = container.querySelector('.mg-v2-kpi-numeral__roll');
      expect(secondRoll).toBeInTheDocument();
      expect(secondRoll).not.toBe(firstRoll);
      expect(container.querySelector('.mg-v2-kpi-numeral__plaintext')).toHaveTextContent('99');
    });

    it('구분자 문자는 정적 컬럼으로 유지한다', () => {
      mockMatchMedia(false);
      const { container } = render(<KpiNumeral value="1,204" unit="" />);
      const statics = container.querySelectorAll('.mg-v2-kpi-numeral__static');
      expect(statics).toHaveLength(1);
      expect(statics[0]).toHaveTextContent(',');
      expect(container.querySelectorAll('.mg-v2-kpi-numeral__digit')).toHaveLength(4);
    });
  });

  describe('prefers-reduced-motion', () => {
    it('reduce일 때 롤 없이 최종 숫자만 표시한다', () => {
      mockMatchMedia(true);
      const { container } = render(<KpiNumeral value="1,204" unit="명" />);
      expect(container.querySelector('.mg-v2-kpi-numeral__roll')).toBeNull();
      expect(container.querySelector('.mg-v2-kpi-numeral__value--rolling')).toBeNull();
      expect(container.querySelector('.mg-v2-kpi-numeral__plaintext')).toHaveTextContent('1,204');
      expect(screen.getByLabelText('1,204명')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('aria-label에 최종 값만 노출한다', () => {
      mockMatchMedia(false);
      render(<KpiNumeral value={7} unit="건" />);
      expect(screen.getByLabelText('7건')).toBeInTheDocument();
    });
  });
});
