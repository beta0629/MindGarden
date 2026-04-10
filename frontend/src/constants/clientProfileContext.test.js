import {
  CLIENT_PROFILE_VISIBILITY_TIER,
  isMemoEditableInContextProfileTier,
  isRestrictedClientProfileTier
} from './clientProfileContext';

describe('clientProfileContext', () => {
  describe('isMemoEditableInContextProfileTier', () => {
    it('FULL·STANDARD에서 메모 편집 허용(백엔드 updateClientContextNotes·상담일지 연계와 정합)', () => {
      expect(isMemoEditableInContextProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.FULL)).toBe(true);
      expect(isMemoEditableInContextProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.STANDARD)).toBe(true);
    });

    it('MINIMAL·null·undefined에서는 메모 편집 비허용', () => {
      expect(isMemoEditableInContextProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.MINIMAL)).toBe(false);
      expect(isMemoEditableInContextProfileTier(null)).toBe(false);
      expect(isMemoEditableInContextProfileTier(undefined)).toBe(false);
    });
  });

  describe('isRestrictedClientProfileTier', () => {
    it('STANDARD·MINIMAL은 제한 등급으로 분류', () => {
      expect(isRestrictedClientProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.STANDARD)).toBe(true);
      expect(isRestrictedClientProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.MINIMAL)).toBe(true);
      expect(isRestrictedClientProfileTier(CLIENT_PROFILE_VISIBILITY_TIER.FULL)).toBe(false);
    });
  });
});
