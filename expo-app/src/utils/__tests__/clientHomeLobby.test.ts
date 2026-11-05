/**
 * clientHomeLobby — P1 「다음 한 장」presentation helpers
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import {
  buildLobbySoftChips,
  formatLobbyGreetingSubtitle,
  formatLobbyMeta,
  isLobbyTabletLandscape,
  truncateLobbyTip,
} from '@/utils/clientHomeLobby';
import { CLIENT_HOME_COPY } from '@/constants/clientHomeCopy';

describe('formatLobbyGreetingSubtitle', () => {
  it('shows 예정된 상담 없음 when no upcoming', () => {
    expect(
      formatLobbyGreetingSubtitle({ todayLabel: '10월 28일 수요일', upcoming: null }),
    ).toContain(CLIENT_HOME_COPY.NO_UPCOMING_META);
  });

  it('includes daysUntil meta when upcoming exists', () => {
    expect(
      formatLobbyGreetingSubtitle({
        todayLabel: '10월 28일 수요일',
        upcoming: { daysUntil: 3 },
      }),
    ).toContain('다음 상담까지 3일');
  });
});

describe('buildLobbySoftChips', () => {
  it('builds asymmetric chip set with unpaid when remaining is 0', () => {
    const chips = buildLobbySoftChips({ remainingSessions: 0, upcoming: null });
    expect(chips).toHaveLength(4);
    expect(chips.map((c) => c.tone)).toEqual(['peach', 'mint', 'lavender', 'unpaid']);
    expect(chips[3]!.value).toBe('미결제');
    expect(chips[0]!.value).toBe(CLIENT_HOME_COPY.CHIP_NEXT_NONE);
  });

  it('uses cream payment + counselor name when sessions remain', () => {
    const chips = buildLobbySoftChips({
      remainingSessions: 6,
      upcoming: {
        consultantName: '황민서윤아린',
        consultationType: '대면',
        status: 'CONFIRMED',
      },
    });
    expect(chips[2]!.value).toBe('황민서윤아린');
    expect(chips[3]!.tone).toBe('cream');
    expect(chips[3]!.value).toBe('최근 완료');
    expect(chips[1]!.badge).toBe(CLIENT_HOME_COPY.CHIP_PACKAGE_BADGE);
  });
});

describe('formatLobbyMeta', () => {
  it('joins counselor · duration · mode', () => {
    expect(
      formatLobbyMeta({
        consultantName: '김선희',
        startTime: '14:00',
        endTime: '14:50',
        consultationType: '대면',
      }),
    ).toBe('김선희 상담사 · 50분 · 대면');
  });
});

describe('truncateLobbyTip / landscape', () => {
  it('falls back to secondary tip copy', () => {
    expect(truncateLobbyTip(undefined)).toBe(CLIENT_HOME_COPY.TIP_FALLBACK);
  });

  it('detects tablet landscape at ≥744 and width > height', () => {
    expect(isLobbyTabletLandscape(960, 620)).toBe(true);
    expect(isLobbyTabletLandscape(744, 1024)).toBe(false);
    expect(isLobbyTabletLandscape(430, 932)).toBe(false);
  });
});
