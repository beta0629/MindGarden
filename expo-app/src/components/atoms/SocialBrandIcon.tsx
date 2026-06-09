/**
 * 카카오·네이버·Apple 브랜드 심볼 SVG (인라인 — 자체 모방 path).
 *
 * 각 사 디자인 가이드 기준 단순화한 path 로, button 배경 위에 24×24dp 로 렌더된다.
 *  - Kakao: 노란 배경(#FEE500) 위 어두운 말풍선(#3C1E1E)
 *  - Naver: 녹색 배경(#03C75A) 위 흰색 "N" 글자 마크
 *  - Apple: 검정 배경(#000000) 위 흰색 사과 마크 (Apple 네이티브 버튼 fallback 용)
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §5.2 / §10.5.
 *
 * TODO(2026-06-10): 카카오/네이버 공식 SDK 자산으로 교체 필요.
 *  - 현재 본 컴포넌트의 path 는 각 사 가이드의 형상을 단순화한 **자체 모방 SVG** 이며,
 *    공식 브랜드 SDK 의 정품 자산이 아니다.
 *  - 라이선스/심사 안전(특히 카카오/네이버 마켓 가이드라인 검수) 기준 미달성.
 *  - 사용자가 `expo-app/assets/social/kakao-symbol.svg` / `naver-symbol.svg` 위치에
 *    각 사 공식 자산(또는 SDK 패키지가 제공하는 정품 자산)을 배치해 주시면,
 *    본 컴포넌트의 `<Path>` 를 `<Image source={require(...)} />` 또는
 *    `<SvgUri uri={...} />` 로 교체한다.
 *  - Apple 의 경우 운영 빌드에서는 `expo-apple-authentication.AppleAuthenticationButton`
 *    네이티브 컴포넌트가 사용되므로 본 fallback path 가 실제 노출되는 빈도는 매우 낮다
 *    (Expo Go / SIWA 비활성 단말 한정).
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import Svg, { Path } from 'react-native-svg';

/**
 * 본 atom 은 색상 정책을 갖지 않는다 — 호출자(예: `SocialLoginButton`)가 theme/variant
 * 토큰으로부터 결정한 색을 명시적으로 전달한다. 디자인 토큰 외 값을 atom 내부에 두지
 * 않음으로써 `no-restricted-syntax` 색상 하드코딩 경고를 회피하고 atom 의 단일 책임을 유지.
 */
export interface SocialBrandIconProps {
  readonly size: number;
  readonly color: string;
}

/** 카카오 말풍선 — 가이드: 둥근 사각 + 좌하단 꼬리. */
export function KakaoBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M12 3C6.477 3 2 6.477 2 10.78c0 2.77 1.83 5.197 4.595 6.585L5.43 21l4.054-2.642c.825.114 1.668.172 2.516.172 5.523 0 10-3.477 10-7.75S17.523 3 12 3z"
        fill={color}
      />
    </Svg>
  );
}

/** 네이버 "N" 마크 — 가이드: 사각 안 좌상→우하 대각선. */
export function NaverBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M16.273 12.845 7.376 0H0v24h7.726V11.155L16.624 24H24V0h-7.727v12.845z"
        fill={color}
      />
    </Svg>
  );
}

/** Apple 마크 — Apple HIG 표준 형태(단순화). 정식 SIWA 는 네이티브 컴포넌트 사용. */
export function AppleBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M17.05 12.04c.03 3.16 2.78 4.21 2.81 4.22-.02.07-.44 1.5-1.45 2.97-.87 1.27-1.78 2.54-3.21 2.57-1.41.03-1.86-.83-3.46-.83-1.61 0-2.11.81-3.44.86-1.39.05-2.45-1.37-3.32-2.64-1.79-2.59-3.16-7.32-1.32-10.51.91-1.59 2.55-2.59 4.32-2.62 1.36-.03 2.65.92 3.48.92.84 0 2.4-1.14 4.05-.97.69.03 2.62.28 3.86 2.11-.1.07-2.31 1.35-2.28 4.02zM14.4 4.27c.74-.9 1.24-2.15 1.1-3.39-1.06.04-2.35.71-3.12 1.6-.68.79-1.29 2.06-1.13 3.27 1.19.09 2.4-.6 3.15-1.48z"
        fill={color}
      />
    </Svg>
  );
}
