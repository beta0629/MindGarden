/**
 * 카카오·네이버·Google·Apple 공식 로그인 버튼 브랜드 색 (외부 가이드 고정값).
 *
 * <p>MindGarden 디자인 토큰과 별도 — 변경 시 각사 최신 가이드를 따른다.
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §C.4 / §E.2.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

/** 카카오 가이드 — 노란 컨테이너 + 어두운 텍스트/심볼 (#FEE500 / #191919). 변경 금지. */
export const OAUTH_KAKAO_BACKGROUND = '#FEE500';
export const OAUTH_KAKAO_FOREGROUND = '#191919';

/** 네이버 가이드 — 녹색 컨테이너 + 흰색 N (#03C75A / #FFFFFF). 변경 금지. */
export const OAUTH_NAVER_BACKGROUND = '#03C75A';
export const OAUTH_NAVER_FOREGROUND = '#FFFFFF';

/**
 * Google Light Theme (V2 채택, §E.2.3).
 * - Fill `#FFFFFF`, Stroke `#747775` 1px inside, Font `#1F1F1F` Roboto Medium 14/20.
 * - G 로고는 표준 다색 (#4285F4/#34A853/#FBBC05/#EA4335) — `GoogleBrandIcon` 에서 직접 렌더.
 */
export const OAUTH_GOOGLE_BACKGROUND = '#FFFFFF';
export const OAUTH_GOOGLE_FOREGROUND = '#1F1F1F';
export const OAUTH_GOOGLE_BORDER = '#747775';

/** Google G 로고 표준 다색 — 단색 변형 절대 금지 (Google 가이드 강제). */
export const GOOGLE_LOGO_BLUE = '#4285F4';
export const GOOGLE_LOGO_GREEN = '#34A853';
export const GOOGLE_LOGO_YELLOW = '#FBBC05';
export const GOOGLE_LOGO_RED = '#EA4335';

/** Apple HIG — 검정 배경 + 흰색 로고/텍스트 (네이티브 SDK 자동 처리). */
export const OAUTH_APPLE_BACKGROUND = '#000000';
export const OAUTH_APPLE_FOREGROUND = '#FFFFFF';
