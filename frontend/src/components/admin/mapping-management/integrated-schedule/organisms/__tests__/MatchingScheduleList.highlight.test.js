/**
 * MatchingScheduleList — 승계 성공 후 매핑 카드 하이라이트·스크롤.
 */

import React from 'react';
import { render } from '@testing-library/react';
import MatchingScheduleList from '../MatchingScheduleList';

const MOCK_MAPPINGS = [
  {
    id: 10,
    clientName: 'A',
    consultantName: 'C1',
    status: 'ACTIVE',
    remainingSessions: 2
  },
  {
    id: 20,
    clientName: 'B',
    consultantName: 'C2',
    status: 'ACTIVE',
    remainingSessions: 1
  }
];

describe('MatchingScheduleList highlightedMappingId', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('highlightedMappingId와 일치하는 카드에 modifier 클래스를 적용한다', () => {
    const { container } = render(
      <MatchingScheduleList
        mappings={MOCK_MAPPINGS}
        loading={false}
        highlightedMappingId="20"
        onScheduleFromCard={jest.fn()}
      />
    );

    const highlighted = container.querySelector('[data-mapping-id="20"]');
    expect(highlighted).toHaveClass('integrated-schedule__card--highlighted');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
