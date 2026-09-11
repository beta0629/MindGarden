/**
 * App Store 심사 모드 — UGC/커뮤니티 메뉴·라우트 게이트
 *
 * <p>EXPO_PUBLIC_APP_STORE_REVIEW_MODE=1|true|on 이면 커뮤니티(익명 UGC)를 숨긴다.
 * EAS production 제출 빌드에 1 을 넣고, 승인 후 OTA 로 0 전환 가능.</p>
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import Constants from 'expo-constants';

function parseTruthyFlag(raw: unknown): boolean {
  if (raw === true || raw === 1) {
    return true;
  }
  if (typeof raw !== 'string') {
    return false;
  }
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/**
 * 심사 모드 여부. env(메트로 인라인) → expoConfig.extra 순.
 */
export function isAppStoreReviewMode(): boolean {
  if (parseTruthyFlag(process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE)) {
    return true;
  }
  const extra = Constants.expoConfig?.extra as
    | { appStoreReviewMode?: unknown }
    | undefined;
  return parseTruthyFlag(extra?.appStoreReviewMode);
}

/** Review Mode 에서 숨길 UGC 관련 기능 */
export function isCommunityFeatureVisible(): boolean {
  return !isAppStoreReviewMode();
}
