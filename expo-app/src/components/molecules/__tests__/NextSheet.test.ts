/**
 * NextSheet — kicker/zero-state copy 상수 스모크
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { EMPTY_INVITE_COPY } from '@/components/molecules/emptyInviteActions';
import { colors } from '@/theme/tokens';

describe('NextSheet mint wash tokens', () => {
  it('uses lobby mintWash / mintWashEnd only (NextSheet exclusive fills)', () => {
    expect(colors.lobby.mintWash).toBe('#E3F4EF');
    expect(colors.lobby.mintWashEnd).toBe('#D5EEE7');
  });
});

describe('NextSheet zero-state copy bridge', () => {
  it('EmptyInvite titles align with SSOT zero sheet', () => {
    expect(EMPTY_INVITE_COPY.TITLE).toBe('회기를 확인해 주세요');
    expect(EMPTY_INVITE_COPY.DATETIME).toBe('남은 회기 0');
  });
});
