/**
 * SessionChapter — 결제 완료 N건 칩
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SessionChapter from '../SessionChapter';
import {
  CLIENT_COVER_CHIP_DONE_PREFIX,
  CLIENT_COVER_CHIP_DONE_SUFFIX,
  CLIENT_COVER_SHEET_MODE
} from '../../constants';

describe('SessionChapter payment chip', () => {
  test('zero mode shows 결제 완료 N건', () => {
    const { container } = render(
      <MemoryRouter>
        <SessionChapter
          sheetMode={CLIENT_COVER_SHEET_MODE.ZERO}
          remainingSessions={0}
          packageLabel=""
          pendingPaymentCount={0}
          pendingLabel={null}
          recentPaymentLabel={null}
          thisMonthCompleted={0}
          completedCount={3}
        />
      </MemoryRouter>
    );

    const chip = Array.from(container.querySelectorAll('.client-cover__chip'))
      .find((el) => el.textContent && el.textContent.includes(CLIENT_COVER_CHIP_DONE_PREFIX));
    expect(chip).toBeTruthy();
    expect(chip.textContent.replace(/\s+/g, ' ').trim())
      .toBe(`${CLIENT_COVER_CHIP_DONE_PREFIX} 3${CLIENT_COVER_CHIP_DONE_SUFFIX}`);
  });
});
