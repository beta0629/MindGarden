/**
 * SessionChapter — 잔여(teal) · 미결제(amber) · 결제 완료 칩
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
  CLIENT_COVER_CHIP_REMAIN_PREFIX,
  CLIENT_COVER_CHIP_UNPAID_PREFIX,
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

  test('remain chip uses teal (not amber warning tone)', () => {
    const { container } = render(
      <MemoryRouter>
        <SessionChapter
          sheetMode={CLIENT_COVER_SHEET_MODE.HAS}
          remainingSessions={4}
          packageLabel="10회 패키지"
          pendingPaymentCount={0}
          pendingLabel={null}
          recentPaymentLabel={null}
          thisMonthCompleted={1}
          completedCount={2}
        />
      </MemoryRouter>
    );

    const remainChip = Array.from(container.querySelectorAll('.client-cover__chip'))
      .find((el) => el.textContent && el.textContent.includes(CLIENT_COVER_CHIP_REMAIN_PREFIX));
    expect(remainChip).toBeTruthy();
    expect(remainChip).toHaveClass('client-cover__chip--teal');
    expect(remainChip).not.toHaveClass('client-cover__chip--amber');
    expect(remainChip.textContent.replace(/\s+/g, ' ').trim())
      .toBe(`${CLIENT_COVER_CHIP_REMAIN_PREFIX} 4`);
  });

  test('unpaid chip keeps amber warning tone', () => {
    const { container } = render(
      <MemoryRouter>
        <SessionChapter
          sheetMode={CLIENT_COVER_SHEET_MODE.HAS}
          remainingSessions={4}
          packageLabel="10회 패키지"
          pendingPaymentCount={1}
          pendingLabel="입금 대기"
          recentPaymentLabel={null}
          thisMonthCompleted={0}
          completedCount={0}
        />
      </MemoryRouter>
    );

    const unpaidChip = Array.from(container.querySelectorAll('.client-cover__chip'))
      .find((el) => el.textContent && el.textContent.includes(CLIENT_COVER_CHIP_UNPAID_PREFIX));
    expect(unpaidChip).toBeTruthy();
    expect(unpaidChip).toHaveClass('client-cover__chip--amber');
  });
});
