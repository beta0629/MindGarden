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

/**
 * 상담일지 등에서 내담자 메모(notes) 편집·표시 허용 여부.
 * STANDARD는 연락처 등은 제한되나, 상담사가 일정·기록으로 연결된 경우 메모는 편집 가능(백엔드 updateClientContextNotes와 정합).
 * @param {string|undefined|null} tier
 * @returns {boolean}
 */
export const isMemoEditableInContextProfileTier = (tier) => (
  tier === CLIENT_PROFILE_VISIBILITY_TIER.FULL
  || tier === CLIENT_PROFILE_VISIBILITY_TIER.STANDARD
);
