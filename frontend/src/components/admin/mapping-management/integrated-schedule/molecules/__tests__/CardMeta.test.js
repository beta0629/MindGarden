/**
 * CardMeta molecule 테스트 — 빈 메타 미렌더 · 배지 한 줄 유지
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CardMeta, { CARD_BADGE_ROW_TEST_ID } from '../CardMeta';
import { MAPPING_ENGAGEMENT_TYPE } from '../../../../../../constants/mappingEngagementType';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

const SENT_SMS = { status: 'SENT', sentAt: '2026-08-01T14:00:00' };

describe('CardMeta', () => {
  it('renders nothing when there is no badge or meta to show', () => {
    const { container } = render(<CardMeta status="ACTIVE" remainingSessions={6} />);
    expect(container.firstChild).toBeNull();
    expect(container.querySelector('.integrated-schedule__card-meta')).toBeNull();
  });

  it('renders nothing when reminder SMS is hidden and no todo pill applies', () => {
    const { container } = render(
      <CardMeta status="ACTIVE" remainingSessions={6} clientReminderSms={{ status: 'SKIPPED' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('keeps 가예약 → 문자발송됨 in one badge row', () => {
    const { container } = render(
      <CardMeta
        status="PENDING_PAYMENT"
        paymentTiming="SAME_DAY_CARD"
        remainingSessions={0}
        clientReminderSms={SENT_SMS}
      />
    );
    expect(container.querySelector('.integrated-schedule__card-meta')).toBeTruthy();
    const row = screen.getByTestId(CARD_BADGE_ROW_TEST_ID);
    expect(row).toHaveClass('integrated-schedule__card-badge-row');
    expect(row.children).toHaveLength(2);
    expect(row.children[0]).toHaveTextContent('가예약');
    expect(row.children[1]).toHaveTextContent('문자발송됨');
  });

  it('renders meta for engagement badge alone (no badge row)', () => {
    const { container } = render(
      <CardMeta
        status="ACTIVE"
        remainingSessions={6}
        engagementType={MAPPING_ENGAGEMENT_TYPE.VOUCHER}
      />
    );
    expect(container.querySelector('.integrated-schedule__card-meta')).toBeTruthy();
    expect(screen.queryByTestId(CARD_BADGE_ROW_TEST_ID)).not.toBeInTheDocument();
  });
});
