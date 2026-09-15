import React from 'react';
import { render, screen } from '@testing-library/react';
import EngagementTypeBadge from '../EngagementTypeBadge';
import {
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  MAPPING_ENGAGEMENT_TYPE
} from '../../../constants/mappingEngagementType';

describe('EngagementTypeBadge', () => {
  it('타기관 연계면 기관연동 배지를 그린다', () => {
    render(
      <EngagementTypeBadge
        mapping={{ paymentTiming: MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK, remainingSessions: 0 }}
      />
    );
    const badge = screen.getByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID);
    expect(badge).toHaveTextContent('기관연동');
    expect(badge).toHaveAttribute('data-engagement-type', MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK);
  });

  it('바우처 데이터가 있으면 바우처 배지를 그린다', () => {
    render(
      <EngagementTypeBadge type={MAPPING_ENGAGEMENT_TYPE.VOUCHER} />
    );
    expect(screen.getByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID)).toHaveTextContent('바우처');
  });

  it('회기권·데이터 없음이면 그리지 않는다', () => {
    const { container: empty } = render(<EngagementTypeBadge mapping={{ remainingSessions: 0 }} />);
    expect(empty.querySelector(`[data-testid="${ENGAGEMENT_TYPE_BADGE_TEST_ID}"]`)).toBeNull();

    const { container: ticket } = render(
      <EngagementTypeBadge mapping={{ paymentTiming: 'ADVANCE', remainingSessions: 5 }} />
    );
    expect(ticket.firstChild).toBeNull();
  });
});
