/**
 * EngagementTypeBadge — 배정 기관연동 배지. rem 으로 추정하지 않음.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import EngagementTypeBadge from '../EngagementTypeBadge';

describe('EngagementTypeBadge', () => {
  it('타기관 배정이면 기관연동 배지를 그린다', () => {
    render(<EngagementTypeBadge mapping={{ paymentTiming: 'INSTITUTION_LINK', remainingSessions: 0 }} />);
    expect(screen.getByTestId('engagement-type-badge')).toHaveTextContent('기관연동');
  });

  it('내담자 유형만 있어도 배지를 그린다', () => {
    render(<EngagementTypeBadge mapping={{ clientEngagementType: 'INSTITUTION_LINK', remainingSessions: 12 }} />);
    expect(screen.getByTestId('engagement-type-badge')).toHaveTextContent('기관연동');
  });

  it('rem=0 만으로는 그리지 않는다', () => {
    render(<EngagementTypeBadge mapping={{ remainingSessions: 0 }} />);
    expect(screen.queryByTestId('engagement-type-badge')).not.toBeInTheDocument();
  });
});
