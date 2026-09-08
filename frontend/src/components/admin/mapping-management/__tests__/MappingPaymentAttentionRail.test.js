/**
 * MappingPaymentAttentionRail — amber one-liner + hide when N=0
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MappingPaymentAttentionRail from '../molecules/MappingPaymentAttentionRail';
import {
  aggregateMappingPaymentAttention,
  isMappingPaymentAttentionItem
} from '../utils/mappingPaymentAttention';

describe('mappingPaymentAttention util', () => {
  it('PENDING_PAYMENT 또는 paymentStatus PENDING만 집계한다', () => {
    const mappings = [
      { id: 1, status: 'PENDING_PAYMENT', packagePrice: 100000 },
      { id: 2, status: 'ACTIVE', paymentStatus: 'PENDING', paymentAmount: 50000 },
      { id: 3, status: 'ACTIVE', packagePrice: 999 },
      { id: 4, status: 'TERMINATED', paymentStatus: 'REFUNDED', packagePrice: 1 }
    ];
    expect(isMappingPaymentAttentionItem(mappings[0])).toBe(true);
    expect(isMappingPaymentAttentionItem(mappings[1])).toBe(true);
    expect(isMappingPaymentAttentionItem(mappings[2])).toBe(false);
    const agg = aggregateMappingPaymentAttention(mappings);
    expect(agg.count).toBe(2);
    expect(agg.totalAmount).toBe(150000);
  });
});

describe('MappingPaymentAttentionRail', () => {
  it('N=0이면 렌더하지 않는다', () => {
    const { container } = render(
      <MappingPaymentAttentionRail mappings={[{ id: 1, status: 'ACTIVE' }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('결제 대기 건수·합계를 표시하고 클릭한다', () => {
    const onClick = jest.fn();
    render(
      <MappingPaymentAttentionRail
        onClick={onClick}
        mappings={[
          { id: 1, status: 'PENDING_PAYMENT', packagePrice: 200000 },
          { id: 2, status: 'PENDING_PAYMENT', paymentAmount: 100000 }
        ]}
      />
    );

    const rail = screen.getByTestId('mapping-payment-attention-rail');
    expect(rail).toHaveTextContent('오늘 손볼 결제 2건');
    expect(rail).toHaveTextContent('300,000원');
    expect(rail.querySelector('.mapping-payment-attention-rail__amount')).toHaveTextContent(
      '300,000원'
    );

    fireEvent.click(rail);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
