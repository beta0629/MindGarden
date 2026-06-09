/**
 * 카카오·네이버·Apple 정품 브랜드 심볼 SVG.
 *
 * Source: simple-icons (CC0 1.0 Universal). Brand: KakaoTalk, Naver, Apple.
 * Extracted 2026-06-10 from `node_modules/simple-icons/icons/{kakaotalk,naver,apple}.svg`.
 * 원본 자산은 `expo-app/assets/social/{kakaotalk,naver,apple}.svg` 에도 보관.
 *
 * 라이선스 — CC0 1.0:
 *  - 저작권자(simpleicons.org)가 모든 권리를 포기, 상업/재배포 자유.
 *  - 브랜드 가이드라인은 별도이므로 색상은 각 사 정품 hex 그대로 사용.
 *
 * 본 atom 은 색상 정책을 갖지 않는다 — 호출자(`SocialLoginButton`)가 variant 별
 * foreground 색을 명시 전달한다. atom 내부에 디자인 토큰 외 값을 두지 않음으로써
 * `no-restricted-syntax` 색상 하드코딩 경고를 회피하고 단일 책임을 유지.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import Svg, { Path } from 'react-native-svg';

export interface SocialBrandIconProps {
  readonly size: number;
  readonly color: string;
}

/**
 * 카카오 단순 말풍선 (워드마크 제거 — 사용자 결정 2026-06-10 §AU 권장안 옵션 3).
 *
 * Source: simple-icons kakaotalk.svg (CC0 1.0) 의 둥근 사각형 외곽선·TALK 워드마크를 제거하고
 * 말풍선 본체만 추출. 동일 path 가 웹 frontend `frontend/src/components/auth/UnifiedLogin.js`
 * 의 카카오 SVG (18×18) 와 1:1 정합. CC0 1.0 라이선스로 변형·재배포 자유.
 *
 * 노란 배경(#FEE500) 위에서 fill=#3C1E1E 로 그리면 정품 카카오 말풍선 외관 유지.
 * 18dp 사이즈에서도 가독성 확보 (워드마크 제거로 시각 무게가 네이버 N·Apple 사과와 통일).
 */
export function KakaoBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fillRule="evenodd"
        fill={color}
        d="M12 3.375c-5.385 0-9.75 3.442-9.75 7.688 0 2.745 1.825 5.153 4.57 6.514-.15.515-.96 3.313-.992 3.533 0 0 .017.214.088.228.07.014.233-.014.233-.014.307-.043 3.557-2.326 4.12-2.723.562.08 1.14.121 1.732.121 5.385 0 9.75-3.442 9.75-7.688S17.385 3.375 12 3.375z"
      />
    </Svg>
  );
}

/**
 * 네이버 정품 "N" 워드마크.
 * Source: simple-icons naver.svg. CC0 1.0.
 *
 * 녹색 배경(#03C75A) 위에서 fill=#FFFFFF 로 그리면 정품 네이버 로그인 버튼 외관.
 */
export function NaverBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={color}
        d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z"
      />
    </Svg>
  );
}

/**
 * Apple 정품 사과 마크.
 * Source: simple-icons apple.svg. CC0 1.0.
 *
 * 검정 배경(#000000) 위에서 fill=#FFFFFF 로 그리면 정품 Apple 아이콘.
 * 운영 빌드에서는 `expo-apple-authentication.AppleAuthenticationButton` 네이티브 컴포넌트가
 * 사용되므로 본 fallback 은 Expo Go / SIWA 비활성 단말에서만 노출된다.
 */
export function AppleBrandIcon({ size, color }: SocialBrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill={color}
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </Svg>
  );
}
