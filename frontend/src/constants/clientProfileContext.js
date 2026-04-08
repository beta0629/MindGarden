/**
 * 내담자 맥락 프로필 API — 표시 등급 (백엔드 ClientProfileContextFields 와 동일 값).
 */

export const CLIENT_PROFILE_VISIBILITY_TIER = {
  FULL: 'FULL',
  STANDARD: 'STANDARD',
  MINIMAL: 'MINIMAL'
};

/**
 * @param {string|undefined|null} tier
 * @returns {boolean}
 */
export const isRestrictedClientProfileTier = (tier) => (
  tier === CLIENT_PROFILE_VISIBILITY_TIER.STANDARD
  || tier === CLIENT_PROFILE_VISIBILITY_TIER.MINIMAL
);
