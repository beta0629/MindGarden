/**
 * GuideChapter — CoverGuideDenseRow 공용 dense 행
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GuideChapter from '../GuideChapter';
import {
  CLIENT_COVER_GUIDE_TITLE_HAS,
  CLIENT_COVER_SHEET_MODE
} from '../../constants';

describe('GuideChapter', () => {
  test('uses cover-guide-dense row (not legacy guide grid)', () => {
    const { container } = render(
      <MemoryRouter>
        <GuideChapter sheetMode={CLIENT_COVER_SHEET_MODE.HAS} />
      </MemoryRouter>
    );

    expect(container.querySelector('.cover-guide-dense')).not.toBeNull();
    expect(container.querySelector('.cover-guide-dense__title'))
      .toHaveTextContent(CLIENT_COVER_GUIDE_TITLE_HAS);
    expect(container.querySelector('.cover-guide-dense__go')).not.toBeNull();
    expect(container.querySelector('.client-cover__guide')).toBeNull();
    expect(container.querySelector('.client-cover__guide-go')).toBeNull();
    expect(screen.getByRole('heading', { name: '안내' })).toBeInTheDocument();
  });
});
