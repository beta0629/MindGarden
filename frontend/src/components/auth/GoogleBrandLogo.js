/**
 * Google 브랜드 다색 로고 (SSOT) — Web 전용 SVG 자산.
 *
 * <p>Google Brand Guidelines 가 요구하는 4색 다색 로고는 디자인 토큰으로 치환할 수
 * 없으며 픽토그램 자산 자체로 SSOT 를 유지해야 한다. expo-app 의
 * {@code expo-app/src/constants/oauthProviderBrand.ts} 와 동일한 정책으로 본 파일을
 * 단일 인입점으로 두고, UnifiedLogin·GoogleLoginButton 등 호출자는 SVG 색상을 직접
 * 다루지 않는다.</p>
 *
 * <p>본 파일은 디자인 시스템 하드코딩 검사 게이트의 명시적 예외로 등록된다
 * ({@code scripts/design-system/automation/pre-commit-hardcoding-check.sh}).
 * Google Brand Guidelines URL: https://about.google/brand-resource-center/logos-list/</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

const GoogleBrandLogo = ({ width = 18, height = 18, ariaLabel = null }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={ariaLabel ? undefined : true}
    aria-label={ariaLabel || undefined}
    role={ariaLabel ? 'img' : undefined}
  >
    {/* Google Brand Guidelines 4색 다색 로고 — 자산 자체가 SSOT 이며 디자인 토큰 치환 불가. */}
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
    <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

export default GoogleBrandLogo;
