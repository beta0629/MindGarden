/**
 * KpiFlipCard 단위·접근성·reduced-motion 테스트
 * @see KPI_FLIP_CARD_SPEC.md
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KpiFlipCard from '../molecules/KpiFlipCard';

const defaultProps = {
  id: 'today-schedule',
  label: '오늘 상담 일정',
  value: '12건',
  summary: '예약 8건 · 완료 4건',
  backContent: <p>상세 내용</p>,
  ctaLabel: '일정 보기',
  onCtaClick: jest.fn(),
  isFlipped: false,
  onFlip: jest.fn()
};

describe('KpiFlipCard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard KPI zone pilot', () => {
    it('KpiFlipCard 행 래퍼에 mg-v2-kpi-flip-row 그리드 클래스를 사용한다', () => {
      const { container } = render(
        <div className="mg-v2-kpi-flip-row" role="list" aria-label="핵심 KPI">
          <KpiFlipCard {...defaultProps} />
          <KpiFlipCard {...defaultProps} id="second" label="두 번째 KPI" />
          <KpiFlipCard {...defaultProps} id="third" label="세 번째 KPI" />
        </div>
      );
      const row = container.querySelector('.mg-v2-kpi-flip-row');
      expect(row).toBeInTheDocument();
      expect(row.querySelectorAll('.mg-v2-kpi-flip-card')).toHaveLength(3);
    });

    it('sparklineData와 trendBadge가 앞면에 표시된다', () => {
      render(
        <KpiFlipCard
          {...defaultProps}
          variant="orange"
          sparklineData={[1, 3, 2]}
          trendBadge="+5%"
          trendAriaLabel="5% 상승"
        />
      );
      expect(screen.getByTestId('kpi-sparkline')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
      expect(screen.getByText('5% 상승')).toHaveClass('sr-only');
    });

    it('variant별 accent 클래스가 적용된다', () => {
      const { container } = render(
        <KpiFlipCard {...defaultProps} variant="green" />
      );
      expect(container.querySelector('.mg-v2-kpi-flip-card--accent-green')).toBeInTheDocument();
      expect(container.querySelector('.mg-v2-kpi-flip-card__accent')).toBeInTheDocument();
    });
  });

  describe('렌더링', () => {
    it('라벨, 값, 요약이 앞면에 표시된다', () => {
      render(<KpiFlipCard {...defaultProps} />);
      expect(screen.getAllByText('오늘 상담 일정').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('12건')).toBeInTheDocument();
      expect(screen.getByText('예약 8건 · 완료 4건')).toBeInTheDocument();
    });

    it('flipped 상태에서 뒷면 콘텐츠와 CTA가 표시된다', () => {
      render(<KpiFlipCard {...defaultProps} isFlipped={true} />);
      expect(screen.getByText('상세 내용')).toBeInTheDocument();
      expect(screen.getByText('일정 보기')).toBeInTheDocument();
    });

    it('ctaLabel이 없으면 CTA 버튼이 렌더되지 않는다', () => {
      render(<KpiFlipCard {...defaultProps} ctaLabel={undefined} />);
      expect(screen.queryByText('일정 보기')).not.toBeInTheDocument();
    });
  });

  describe('인터랙션', () => {
    it('클릭 시 onFlip이 id와 함께 호출된다', () => {
      render(<KpiFlipCard {...defaultProps} />);
      const card = screen.getByRole('button', { name: /오늘 상담 일정/ });
      fireEvent.click(card);
      expect(defaultProps.onFlip).toHaveBeenCalledWith('today-schedule');
    });

    it('Enter/Space 키 시 onFlip이 호출된다', () => {
      render(<KpiFlipCard {...defaultProps} />);
      const card = screen.getByRole('button', { name: /오늘 상담 일정/ });
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(defaultProps.onFlip).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(card, { key: ' ' });
      expect(defaultProps.onFlip).toHaveBeenCalledTimes(2);
    });

    it('닫기 버튼 클릭 시 onFlip(null)이 호출된다', () => {
      render(<KpiFlipCard {...defaultProps} isFlipped={true} />);
      const closeBtn = screen.getByLabelText('카드 닫기');
      fireEvent.click(closeBtn);
      expect(defaultProps.onFlip).toHaveBeenCalledWith(null);
    });

    it('CTA 클릭 시 onCtaClick이 호출된다', () => {
      render(<KpiFlipCard {...defaultProps} isFlipped={true} />);
      const ctaBtn = screen.getByText('일정 보기');
      fireEvent.click(ctaBtn);
      expect(defaultProps.onCtaClick).toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('role="button", tabIndex=0, aria-expanded가 설정된다', () => {
      const { rerender } = render(<KpiFlipCard {...defaultProps} />);
      const card = screen.getByRole('button', { name: /오늘 상담 일정/ });
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAttribute('aria-expanded', 'false');

      rerender(<KpiFlipCard {...defaultProps} isFlipped={true} />);
      expect(card).toHaveAttribute('aria-expanded', 'true');
    });

    it('flipped=false일 때 앞면 aria-hidden=false, 뒷면 aria-hidden=true', () => {
      const { container } = render(<KpiFlipCard {...defaultProps} />);
      const front = container.querySelector('.mg-v2-kpi-flip-card__front');
      const back = container.querySelector('.mg-v2-kpi-flip-card__back');
      expect(front).toHaveAttribute('aria-hidden', 'false');
      expect(back).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('reduced motion', () => {
    it('prefers-reduced-motion 환경에서도 flip 토글이 정상 동작한다', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }));

      const { container, rerender } = render(
        <KpiFlipCard {...defaultProps} isFlipped={false} />
      );

      const front = container.querySelector('.mg-v2-kpi-flip-card__front');
      const back = container.querySelector('.mg-v2-kpi-flip-card__back');
      expect(front).toHaveAttribute('aria-hidden', 'false');
      expect(back).toHaveAttribute('aria-hidden', 'true');

      rerender(<KpiFlipCard {...defaultProps} isFlipped={true} />);
      expect(front).toHaveAttribute('aria-hidden', 'true');
      expect(back).toHaveAttribute('aria-hidden', 'false');
      expect(screen.getByText('상세 내용')).toBeInTheDocument();

      window.matchMedia = originalMatchMedia;
    });
  });
});
