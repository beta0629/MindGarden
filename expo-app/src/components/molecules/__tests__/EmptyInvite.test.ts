/**
 * EmptyInvite — CTA 라벨·라우트 · 「예약하기」 금지 회귀
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { CLIENT_HOME_ROUTES } from '@/constants/clientHomeCopy';
import {
  EMPTY_INVITE_COPY,
  EMPTY_INVITE_ROUTES,
  emptyInviteHasBookingCta,
} from '@/components/molecules/emptyInviteActions';

describe('EmptyInvite CTAs', () => {
  it('exposes 회기 고르기 + 결제하기 only', () => {
    expect(EMPTY_INVITE_COPY.PRIMARY_CTA).toBe('회기 고르기');
    expect(EMPTY_INVITE_COPY.GHOST_CTA).toBe('결제하기');
    expect(
      emptyInviteHasBookingCta([
        EMPTY_INVITE_COPY.PRIMARY_CTA,
        EMPTY_INVITE_COPY.GHOST_CTA,
      ]),
    ).toBe(false);
  });

  it('routes both CTAs to sessions-payment (no booking create)', () => {
    expect(EMPTY_INVITE_ROUTES.PRIMARY).toBe(CLIENT_HOME_ROUTES.SESSIONS_PAYMENT);
    expect(EMPTY_INVITE_ROUTES.GHOST).toBe(CLIENT_HOME_ROUTES.SESSIONS_PAYMENT);
  });

  it('detects forbidden 예약하기 label', () => {
    expect(emptyInviteHasBookingCta(['예약하기'])).toBe(true);
  });
});
