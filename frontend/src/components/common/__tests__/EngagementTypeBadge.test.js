import React from 'react';
import { render, screen } from '@testing-library/react';
import EngagementTypeBadge from '../EngagementTypeBadge';
import {
  ENGAGEMENT_TYPE_BADGE_SEG_CLASS,
  ENGAGEMENT_TYPE_BADGE_TEST_ID,
  MAPPING_ENGAGEMENT_TYPE,
  MAPPING_ENGAGEMENT_TYPE_LABELS,
  getEngagementTypeLabelSegments
} from '../../../constants/mappingEngagementType';

describe('EngagementTypeBadge', () => {
  it('타기관 연계면 기관연계 배지를 그린다', () => {
    render(
      <EngagementTypeBadge
        mapping={{ paymentTiming: MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK, remainingSessions: 0 }}
      />
    );
    const badge = screen.getByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID);
    const label = MAPPING_ENGAGEMENT_TYPE_LABELS[MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK];
    expect(badge).toHaveTextContent(label);
    expect(badge).toHaveAttribute('data-engagement-type', MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK);
  });

  it('기관연계는 의도된 2+2 분리점(__seg + wbr)이고 aria-label·textContent 는 전체 라벨이다', () => {
    render(
      <EngagementTypeBadge type={MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK} />
    );
    const badge = screen.getByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID);
    const label = MAPPING_ENGAGEMENT_TYPE_LABELS[MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK];
    const segments = getEngagementTypeLabelSegments(MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK);

    expect(badge).toHaveAttribute('aria-label', label);
    expect(badge.textContent).toBe(label);

    const segNodes = badge.querySelectorAll(`.${ENGAGEMENT_TYPE_BADGE_SEG_CLASS}`);
    expect(segNodes).toHaveLength(segments.length);
    expect(Array.from(segNodes).map((node) => node.textContent)).toEqual(segments);
    expect(Array.from(segNodes).every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(badge.querySelectorAll('wbr')).toHaveLength(segments.length - 1);
    expect(segments).toHaveLength(2);
  });

  it('바우처 데이터가 있으면 바우처 배지를 그린다', () => {
    render(
      <EngagementTypeBadge type={MAPPING_ENGAGEMENT_TYPE.VOUCHER} />
    );
    const badge = screen.getByTestId(ENGAGEMENT_TYPE_BADGE_TEST_ID);
    const label = MAPPING_ENGAGEMENT_TYPE_LABELS[MAPPING_ENGAGEMENT_TYPE.VOUCHER];
    expect(badge).toHaveTextContent(label);
    expect(badge.querySelectorAll(`.${ENGAGEMENT_TYPE_BADGE_SEG_CLASS}`)).toHaveLength(0);
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
