/**
 * ConsultantHomeGuideChapter — CoverGuideDenseRow 공용
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConsultantHomeGuideChapter from '../ConsultantHomeGuideChapter';
import { COVER_CHAPTER_GUIDE_TEST_ID } from '../consultantCoverChapterConstants';

describe('ConsultantHomeGuideChapter', () => {
  test('uses cover-guide-dense; no legacy guide-card grid', () => {
    const onOpen = jest.fn();
    const { container } = render(
      <MemoryRouter>
        <ConsultantHomeGuideChapter
          title="센터 공지"
          body="내일 휴무입니다"
          onOpen={onOpen}
        />
      </MemoryRouter>
    );

    expect(container.querySelector(`[data-testid="${COVER_CHAPTER_GUIDE_TEST_ID}"]`)).not.toBeNull();
    expect(container.querySelector('.cover-guide-dense')).not.toBeNull();
    expect(container.querySelector('.cover-guide-dense__title')).toHaveTextContent('센터 공지');
    expect(container.querySelector('.cover-guide-dense__body')).toHaveTextContent('내일 휴무입니다');
    expect(container.querySelector('.consultant-cover-chapter__guide-card')).toBeNull();
    expect(container.querySelector('.consultant-cover-chapter__guide-go')).toBeNull();

    fireEvent.click(container.querySelector('.cover-guide-dense'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
