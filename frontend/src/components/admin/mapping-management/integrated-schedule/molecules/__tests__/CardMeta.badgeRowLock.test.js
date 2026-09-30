/**
 * CardMeta 배지 한 줄 회귀 잠금 — 가예약·문자발송됨 (PR #1289)
 *
 * 기존 CardMeta.test.js / MappingScheduleCard.test.js 에 없는 단언만 둔다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CardMeta, { CARD_BADGE_ROW_TEST_ID } from '../CardMeta';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

const SMS_BADGE_SELECTOR = '.integrated-schedule__reminder-sms-badge';
const SENT_SMS = { status: 'SENT', sentAt: '2026-08-01T14:00:00' };
const CARD_META_CSS = fs.readFileSync(path.join(__dirname, '..', 'CardMeta.css'), 'utf8');

describe('CardMeta badge row lock', () => {
  it('#1289 badge row — 가예약과 함께면 문자발송됨 배지는 행 안에 한 번만 (행 밖 중복 없음)', () => {
    const { container } = render(
      <CardMeta
        status="PENDING_PAYMENT"
        paymentTiming="SAME_DAY_CARD"
        remainingSessions={0}
        clientReminderSms={SENT_SMS}
      />
    );
    const row = screen.getByTestId(CARD_BADGE_ROW_TEST_ID);
    const smsBadges = container.querySelectorAll(SMS_BADGE_SELECTOR);
    expect(smsBadges).toHaveLength(1);
    expect(row.contains(smsBadges[0])).toBe(true);
    expect(container.querySelectorAll(`[data-testid="${CARD_BADGE_ROW_TEST_ID}"]`)).toHaveLength(1);
  });

  it('#1289 badge row — 문자발송됨만 있어도 배지는 행 안에 한 번만', () => {
    const { container } = render(
      <CardMeta status="ACTIVE" remainingSessions={6} clientReminderSms={SENT_SMS} />
    );
    const row = screen.getByTestId(CARD_BADGE_ROW_TEST_ID);
    const smsBadges = container.querySelectorAll(SMS_BADGE_SELECTOR);
    expect(smsBadges).toHaveLength(1);
    expect(row.contains(smsBadges[0])).toBe(true);
  });

  it('#1289 badge row CSS — flex 가로 정렬 · gap 토큰 · 문자 배지 pill 이 가예약 필 규칙을 공유', () => {
    const rowBlock = CARD_META_CSS.match(/\.integrated-schedule__card-badge-row\s*\{[^}]*\}/);
    expect(rowBlock).toBeTruthy();
    expect(rowBlock[0]).toMatch(/display:\s*flex/);
    expect(rowBlock[0]).toMatch(/align-items:\s*center/);
    expect(rowBlock[0]).toMatch(/gap:\s*var\(--mg-/);
    expect(rowBlock[0]).toMatch(/min-width:\s*0/);
    expect(rowBlock[0]).not.toMatch(/flex-direction:\s*column/);
    expect(CARD_META_CSS).toMatch(
      /\.integrated-schedule__card-todo-pill,\s*\.integrated-schedule__card-badge-row \.integrated-schedule__reminder-sms-badge__pill\s*\{/
    );
  });
});
