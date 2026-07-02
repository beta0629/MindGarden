/**
 * ContentKpiRow — Dashboard KPI zone pilot 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ContentKpiRow from '../ContentKpiRow';

jest.mock('../../atoms/KpiSparkline', () => {
  return function MockKpiSparkline({ data }) {
    return <div data-testid="mock-kpi-sparkline">{data?.join(',')}</div>;
  };
});

const baseItems = [
  {
    id: 'users',
    label: '총 사용자',
    value: '9',
    badge: '+5%',
    badgeVariant: 'green',
    iconVariant: 'green',
    trendAriaLabel: '5% 상승',
    icon: <span data-testid="kpi-icon">icon</span>
  },
  {
    id: 'booked',
    label: '예약된 상담',
    value: '3',
    badge: '변동 없음',
    badgeVariant: 'orange',
    iconVariant: 'orange',
    sparklineData: [1, 2, 4],
    icon: <span>icon</span>
  },
  {
    id: 'completion',
    label: '완료율',
    value: '45.8%',
    badge: '+2%',
    badgeVariant: 'blue',
    iconVariant: 'blue',
    icon: <span>icon</span>
  }
];

describe('ContentKpiRow', () => {
  test('KPI 카드 3개와 악센트 클래스를 렌더한다', () => {
    render(<ContentKpiRow items={baseItems} />);
    expect(screen.getByTestId('content-kpi-row')).toBeInTheDocument();
    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveClass('mg-v2-content-kpi-card--accent-green');
    expect(cards[0].querySelector('.mg-v2-content-kpi-card__accent')).toBeInTheDocument();
  });

  test('sparklineData가 있는 카드에 스파크라인을 렌더한다', () => {
    render(<ContentKpiRow items={baseItems} />);
    const cards = screen.getAllByRole('listitem');
    expect(within(cards[1]).getByTestId('mock-kpi-sparkline')).toHaveTextContent('1,2,4');
  });

  test('trendAriaLabel을 sr-only로 노출한다', () => {
    render(<ContentKpiRow items={baseItems} />);
    expect(screen.getByText('5% 상승')).toHaveClass('sr-only');
  });

  test('loading 시 값 placeholder와 aria-busy를 표시한다', () => {
    render(<ContentKpiRow items={baseItems} loading />);
    expect(screen.getByTestId('content-kpi-row')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByText('…')).toHaveLength(3);
    expect(screen.queryByTestId('mock-kpi-sparkline')).not.toBeInTheDocument();
  });
});
