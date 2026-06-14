import type { ExpoConfig, ConfigContext } from 'expo/config';

// Node(app.config 평가)는 .ts 모듈을 직접 require하지 못함 → CJS 미러 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appCfgColors = require('./src/theme/tokensAppConfig.cjs') as {
  clientBgMain: string;
  consultantPrimary: string;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withAndroidKakaoMaven = require('./plugins/withAndroidKakaoMaven');

const pkg = require('./package.json') as { version: string };

const releaseManifest = require('./releases/manifest.json') as {
  androidVersionCode: number;
};

/**
 * 카카오 네이티브 앱 키 — `mobile/ios/MindGardenMobile/Info.plist` 의 KAKAO_APP_KEY 와 동일 폴백.
 * 릴리스 APK에서 env 미주입 시 Android 플러그인이 `KAKAO_APP_KEY_HERE` 로 들어가 로그인 실패하는 것을 막는다.
 */
const KAKAO_DEV_NATIVE_APP_KEY = 'dc936dc99531bf6085bdfab781ad2096';

function resolveKakaoAppKeyForNative(): string {
  const k = process.env.KAKAO_APP_KEY?.trim();
  if (k && k !== 'KAKAO_APP_KEY_HERE') {
    return k;
  }
  return KAKAO_DEV_NATIVE_APP_KEY;
}

/**
 * 네이버 네이티브 플러그인·iOS Plist·`extra`·JS 초기화가 동일 값을 쓰도록 단일 해석.
 * EXPO_PUBLIC_* → NAVER_* 순, 없으면 iOS와 동일한 개발 폴백(저장소에 이미 노출된 값).
 */
const NAVER_DEV_CLIENT_ID = 'vTKNlxYKIfo1uCCXaDfk';
const NAVER_DEV_CLIENT_SECRET = 'V_b3omW5pu';

function resolveNaverClientIdForNative(): string {
  return (
    process.env.EXPO_PUBLIC_NAVER_CLIENT_ID?.trim() ||
    process.env.NAVER_CLIENT_ID?.trim() ||
    NAVER_DEV_CLIENT_ID
  );
}

function resolveNaverClientSecretForNative(): string {
  return (
    process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET?.trim() ||
    process.env.NAVER_CLIENT_SECRET?.trim() ||
    NAVER_DEV_CLIENT_SECRET
  );
}

/** EAS 빌드 로그에서 카카오·네이버 키 누락을 한 번에 알림 (빌드는 계속 진행) */
function warnIfSocialLoginEnvMissingForEasBuild(): void {
  if (process.env.EAS_BUILD !== 'true') {
    return;
  }
  const issues: string[] = [];
  const kakaoEnv = process.env.KAKAO_APP_KEY?.trim();
  if (kakaoEnv === 'KAKAO_APP_KEY_HERE') {
    issues.push('KAKAO_APP_KEY');
  }
  const naverId = process.env.NAVER_CLIENT_ID?.trim();
  const naverSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!naverId || naverId === 'NAVER_CLIENT_ID_HERE') {
    issues.push('NAVER_CLIENT_ID');
  }
  if (!naverSecret || naverSecret === 'NAVER_CLIENT_SECRET_HERE') {
    issues.push('NAVER_CLIENT_SECRET');
  }
  const pubId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID?.trim();
  const pubSecret = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET?.trim();
  if (!pubId) {
    issues.push('EXPO_PUBLIC_NAVER_CLIENT_ID');
  }
  if (!pubSecret) {
    issues.push('EXPO_PUBLIC_NAVER_CLIENT_SECRET');
  }
  if (issues.length > 0) {
    console.warn(
      `[app.config] EAS 빌드: 카카오·네이버 소셜 로그인용 env 누락 또는 플레이스홀더 → ${issues.join(', ')}. README "소셜 로그인·네이티브 키"의 EAS 시크릿 목록·로컬 .env 항목을 모두 채우세요.`,
    );
  }
}

/**
 * `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` 가 EAS Build / Update 시점에 모두 비어 있으면 경고한다.
 *
 * <p>**P0 (2026-06-10)** — TestFlight `1.0.7 (16)` + OTA group `608da58e` 에서
 * `extra.googleClientId = { ios:"", web:"", android:"" }` 로 publish 되어 Google 로그인 버튼이
 * Disabled 상태가 됨. Root cause: `eas update` 명령에 `--environment production` 플래그가 빠져
 * EAS Project Environment Variables 가 inject 되지 않은 채로 `app.config.ts` 가 평가됨.</p>
 *
 * <p>본 함수는 EAS Build / Update 시점에 한해 누락 키 목록을 stderr 에 명시한다. CI 로그를
 * 보고 사용자가 즉시 인지할 수 있도록 한 줄 안내(`--environment production` 사용)을 함께 출력.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
function warnIfGoogleClientIdMissingForEasContext(): void {
  const isEasBuild = process.env.EAS_BUILD === 'true';
  const isEasUpdate = process.env.EAS_UPDATE === 'true' || process.env.EAS_NO_VCS === '1';
  if (!isEasBuild && !isEasUpdate) {
    return;
  }
  const missing: string[] = [];
  if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim()) {
    missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  }
  if (!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim()) {
    missing.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  }
  if (!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim()) {
    missing.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  }
  if (missing.length === 0) {
    return;
  }
  const ctx = isEasBuild ? 'EAS Build' : 'EAS Update';
  console.warn(
    `[app.config] ${ctx}: Google OAuth env 누락 → ${missing.join(', ')}. ` +
      'EAS env (production environment) 에 등록되어 있어도 OTA(eas update) 명령에 ' +
      '`--environment production` 가 없으면 inject 되지 않아 manifest 가 빈 값으로 publish 됩니다. ' +
      '`npx eas update --environment production --branch production --channel production ...` 로 발행하세요.',
  );
}

/**
 * `extra.googleClientId` 객체를 생성한다. 빈 값일 때는 키를 omit 하여 manifest 가
 * `{ web:"", ios:"", android:"" }` 로 publish 되는 사고를 막는다.
 *
 * <p>OTA 발행 시점에 EAS env 가 inject 되지 않아도, 키 자체가 manifest 에 없으면
 * `Constants.expoConfig.extra.googleClientId` 는 `undefined` 가 되어
 * `googleSignIn.resolveGoogleClientIdConfig()` 가 `process.env` (metro 가 빌드 시점에 inline)
 * 만 보는 분기로 안전하게 폴백한다.</p>
 *
 * <p>**P0 (2026-06-10)** — TestFlight `1.0.7 (16)` 에서 `isGoogleConfigured=false` 회복 핵심 fix.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
function resolveExtraGoogleClientId():
  | { web?: string; ios?: string; android?: string }
  | undefined {
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
  const entry: { web?: string; ios?: string; android?: string } = {};
  if (web) {
    entry.web = web;
  }
  if (ios) {
    entry.ios = ios;
  }
  if (android) {
    entry.android = android;
  }
  return Object.keys(entry).length > 0 ? entry : undefined;
}

/**
 * EAS project UUID 단일 해석. `extra.eas.projectId` 와 `updates.url` 양쪽이 같은 값을 사용한다.
 * 우선순위: `EAS_PROJECT_ID` → `EXPO_PUBLIC_EAS_PROJECT_ID` → 빈 문자열.
 * 빈 문자열이면 `updates.url` 은 미설정으로 처리해 EAS 가 빌드 시 에러로 알리도록 한다.
 */
function resolveEasProjectId(): string {
  return (process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '').trim();
}

/**
 * Metro가 아닌 릴리스/프리뷰 APK·AAB에서 `getApiBaseUrl()`이 개발(또는 스테이징) API를 쓰도록 주입.
 * 우선순위: `EXPO_PUBLIC_API_BASE_URL` → `APP_ENV === development` 이면 dev 기본 호스트.
 */
function resolveApiBaseUrlExtra(): string | undefined {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, '');
  }
  if ((process.env.APP_ENV ?? '').trim() === 'development') {
    return 'https://dev.core-solution.co.kr';
  }
  return undefined;
}

/**
 * Google iOS OAuth Client ID 를 reversed URL scheme 형태로 변환.
 *
 * <p>**P0 (2026-06-10 — Native SDK 마이그레이션)**: `@react-native-google-signin/google-signin`
 * Expo plugin 의 `iosUrlScheme` 옵션 (Native SDK 가 iOS 콜백에 사용) 으로 전달한다. Plugin 이
 * Info.plist 의 `CFBundleURLTypes` 에 자동 등록하므로 본 파일에서는 별도로 등록하지 않는다.</p>
 *
 * <p>우선순위:
 *  1. `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` env (사용자 직접 지정)
 *  2. `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` 에서 reversed scheme 파생 (`<id>.apps.googleusercontent.com` → `com.googleusercontent.apps.<id>`).</p>
 *
 * <p>둘 다 비면 `undefined` 반환 → plugin 미설정 (Native SDK iOS 콜백 미동작).</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
function resolveGoogleIosReversedClientId(): string | undefined {
  const explicit = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
  if (explicit) {
    return explicit;
  }
  const candidate = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (!candidate) {
    return undefined;
  }
  const SUFFIX = '.apps.googleusercontent.com';
  if (!candidate.toLowerCase().endsWith(SUFFIX)) {
    return undefined;
  }
  const id = candidate.slice(0, candidate.length - SUFFIX.length).trim();
  if (!id) {
    return undefined;
  }
  return `com.googleusercontent.apps.${id}`;
}

/**
 * Android applicationId (= `android.package`).
 *
 * <p>iOS 의 `bundleIdentifier`(`com.mindgarden.MindGardenMobile`) 와 의도적으로 다른 값
 * (`com.mindgardenmobile`) 을 유지한다 — Google Play 등록명·Maestro flow·install 스크립트
 * (scripts/install-android-release-apk.js, .maestro/flows/*.yaml) 가 모두 이 패키지명에 묶여
 * 있어 변경 시 마이그레이션 비용이 크다. Google Cloud Console Android OAuth Client 의
 * Package name 도 이 값과 일치해야 한다 (사용자 액션).</p>
 *
 * <p>**Build #16 (2026-06-10)**: Native SDK 마이그레이션 후에도 SHA-1 + Package name 정합이
 * 필요하므로 본 값이 Google Cloud Console Android Client 와 동일해야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
const ANDROID_PACKAGE_ID = 'com.mindgardenmobile';

export default ({ config }: ConfigContext): ExpoConfig => {
  warnIfSocialLoginEnvMissingForEasBuild();
  warnIfGoogleClientIdMissingForEasContext();
  const apiBaseUrl = resolveApiBaseUrlExtra();
  const easProjectId = resolveEasProjectId();
  const extraGoogleClientId = resolveExtraGoogleClientId();
  /**
   * Google OAuth (iOS standalone) 콜백 URL scheme — env 누락 시 항목 미추가.
   * P0 (2026-06-10): TestFlight 1.0.7 (#15) 에서 토큰 미수신 → Info.plist 미등록이 원인.
   */
  const googleIosReversedClientId = resolveGoogleIosReversedClientId();
  /**
   * OTA(`eas update`) endpoint — projectId 미주입 시 url 자체를 빼야 expo-updates 가
   * 정상적으로 비활성화 폴백(빌드 단계에서 경고)을 한다. 하드코딩 금지.
   */
  const updatesUrl = easProjectId ? `https://u.expo.dev/${easProjectId}` : undefined;
  /**
   * 실제 안드로이드 폰에 올리는 릴리스 APK는 Metro 없이 내장 번들로만 기동해야 한다.
   * `expo-dev-client`가 있으면 개발 서버 URL 입력 화면에서 멈추는 경우가 많아,
   * `EXPO_USE_DEV_CLIENT=0` 또는 `false`이면 플러그인에서 제외한다. 로컬 `expo start`는 env 미설정(포함) 유지.
   */
  const includeExpoDevClient = !['0', 'false'].includes(
    (process.env.EXPO_USE_DEV_CLIENT ?? '').trim().toLowerCase(),
  );

  const appPlugins: ExpoConfig['plugins'] = [
    ...(includeExpoDevClient ? (['expo-dev-client'] as const) : []),
    'expo-router',
    [
      'expo-build-properties',
      {
        android: {
          /** RN 0.81 libs.versions.toml 과 맞춤 — 구형 1.5.10 시 KSP·expo-root-project 실패 방지 */
          kotlinVersion: '2.1.20',
        },
      },
    ],
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: appCfgColors.consultantPrimary,
        /** iOS UIBackgroundModes `remote-notification` — EAS가 APNs entitlements 관리(aps-environment 수동 하드코딩 금지) */
        enableBackgroundRemoteNotifications: true,
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: '프로필 사진을 선택하기 위해 사진 보관함 접근이 필요합니다.',
        cameraPermission: 'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
      },
    ],
    'expo-font',
    'expo-splash-screen',
    /**
     * expo-localization — 디바이스 로케일·타임존 감지를 위한 네이티브 모듈.
     *
     * <p>i18n SSOT(`src/i18n/index.ts`) 의 `getLocales()` / `getCalendars()` 호출 대상.
     * Build native module 등록만 담당 (런타임 권한 없음).</p>
     *
     * @since 2026-06-14 (A8 — expo-app i18n 정책 P0)
     */
    'expo-localization',
    [
      'expo-calendar',
      {
        calendarPermission:
          '상담 예약 일정을 기기 캘린더에 저장하기 위해 캘린더 접근이 필요합니다.',
      },
    ],
    [
      '@react-native-seoul/kakao-login',
      {
        kakaoAppKey: resolveKakaoAppKeyForNative(),
        /** 기본 1.5.10이면 KSP/RN 0.81과 충돌 — expo-build-properties·RN과 동일 버전 */
        kotlinVersion: '2.1.20',
      },
    ],
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: 'naverMindGardenMobileApp',
        consumerKey: resolveNaverClientIdForNative(),
        consumerSecret: resolveNaverClientSecretForNative(),
        appName: 'MindGardenMobileApp',
      },
    ],
    /**
     * Sign in with Apple (App Store 4.8 T1) — iOS 13+ 네이티브 시트.
     * Apple Developer Console 의 capability 와 entitlement 는 Expo Apple Authentication 플러그인이
     * EAS 빌드 시점에 자동 주입한다 (`com.apple.developer.applesignin` = ["Default"]).
     */
    'expo-apple-authentication',
    /**
     * Google Sign-In Native SDK — `@react-native-google-signin/google-signin` (Build #16, 2026-06-10).
     *
     * <p>**P0 마이그레이션**: 기존 `expo-auth-session/providers/google` 의 Custom URI scheme redirect
     * 가 Google Android Client 정책상 차단(`400 invalid_request: Custom URI scheme is not enabled
     * for your Android client`)되어 Native SDK 로 전면 교체. Native SDK 는:</p>
     *
     *  - iOS: iosClientId + URL scheme (plugin 이 Info.plist 자동 주입) 으로 SDK 직접 호출
     *  - Android: SHA-1 + Package name + Web Client ID 검증 (Custom URI scheme 미사용)
     *  - 토큰: `signIn()` → `idToken/serverAuthCode` 직접 반환, `getTokens()` 로 accessToken 취득
     *
     * <p>Plugin 의 `iosUrlScheme` 은 iOS reversed client ID 형식 (`com.googleusercontent.apps.<id>`)
     * 이며 Info.plist 의 `CFBundleURLTypes` 에 자동 등록된다. 본 파일에서는 별도로 추가하지 않는다.
     * env 미주입 시 plugin 자체를 omit 해 빌드 실패를 막는다.</p>
     *
     * <p>SHA-1 등록은 사용자 액션 — `docs/project-management/2026-06-10/GOOGLE_ANDROID_OAUTH_SETUP.md`</p>
     */
    ...(googleIosReversedClientId
      ? ([
          [
            '@react-native-google-signin/google-signin',
            {
              iosUrlScheme: googleIosReversedClientId,
            },
          ],
        ] as const)
      : []),
    withAndroidKakaoMaven,
  ];

  return {
    ...config,
    name: 'MindGarden',
    slug: 'mindgarden',
    version: pkg.version,
    scheme: 'mindgarden',
    orientation: 'portrait',
    /** Android adaptive foreground·iOS·글로벌 아이콘 공통 소스 */
    icon: './assets/images/adaptive-icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      /** 스플래시도 아이콘과 동일 톤 */
      backgroundColor: '#000000',
    },
    /**
     * OTA 호환 단위 — 같은 `appVersion`(`package.json` `version`)을 가진 빌드끼리만 업데이트 공유.
     * native 변경 시 `version` 을 올리면 자동으로 OTA 호환 cut 이 생긴다.
     */
    runtimeVersion: {
      policy: 'appVersion',
    },
    ...(updatesUrl
      ? {
          updates: {
            /** EAS Update endpoint — `extra.eas.projectId` 와 동일 UUID 사용 */
            url: updatesUrl,
            enabled: true,
            /** cold start 시 자동 체크. 추가 UI 없이도 다음 부팅에 반영 */
            checkAutomatically: 'ON_LOAD',
            /** 첫 부팅 지연 방지 — 캐시된 번들 즉시 실행, 새 번들은 백그라운드 다운로드 */
            fallbackToCacheTimeout: 0,
          },
        }
      : {}),
    ios: {
      icon: './assets/images/icon.png',
      supportsTablet: false,
      bundleIdentifier: 'com.mindgarden.MindGardenMobile',
      /** Apple App Store Guideline 4.8 — Sign in with Apple 활성화 (capability + entitlement). */
      usesAppleSignIn: true,
      entitlements: {
        'com.apple.developer.applesignin': ['Default'],
      },
      infoPlist: {
        /** EAS export compliance 프롬프트 생략 — 표준 면제 암호화만 사용 */
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ['audio', 'remote-notification'],
        NSCameraUsageDescription:
          'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
        NSCalendarsUsageDescription: '상담 일정을 기기 캘린더에 추가하기 위해 접근이 필요합니다.',
        KAKAO_APP_KEY: resolveKakaoAppKeyForNative(),
        NAVER_CLIENT_ID: resolveNaverClientIdForNative(),
        NAVER_CLIENT_SECRET: resolveNaverClientSecretForNative(),
        NAVER_APP_NAME: 'MindGardenMobileApp',
        /**
         * Google OAuth iOS URL scheme 은 `@react-native-google-signin/google-signin` Expo plugin
         * 이 `CFBundleURLTypes` 에 자동 주입한다 (build #16 — 2026-06-10 Native SDK 마이그레이션).
         * 본 파일에서는 별도 등록하지 않으며, plugin 의 `iosUrlScheme` 옵션이 단일 진입점이다.
         */
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        /** 나비 로고와 동일한 검정 배경(Adaptive Icon 마스크 외곽) */
        backgroundColor: '#000000',
      },
      package: ANDROID_PACKAGE_ID,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      edgeToEdgeEnabled: true,
      versionCode: releaseManifest.androidVersionCode,
      /**
       * Google Android OAuth callback intent-filter — Native SDK 마이그레이션(2026-06-10) 후 미사용.
       *
       * <p>**Build #16 (2026-06-10)**: `@react-native-google-signin/google-signin` Native SDK 는
       * Custom URI scheme deep-link 콜백을 사용하지 않고 SDK 가 직접 토큰을 반환한다. Google
       * Android Client 가 2022 년 이후 `400 invalid_request: Custom URI scheme is not enabled
       * for your Android client` 로 차단해 `expo-auth-session/providers/google` 흐름이 실패한
       * 것이 마이그레이션의 root cause.</p>
       *
       * <p>본 intent-filter 는 의도적으로 유지한다 — 다른 deep-link 진입점이 본 scheme
       * (`com.mindgardenmobile://`) 을 사용 중일 가능성이 있고, 빈 intent 등록은 부작용이 없다.
       * Native SDK 자체는 본 항목을 참조하지 않는다.</p>
       *
       * <p>SHA-1 fingerprint·Package name 등록은 Google Cloud Console 사용자 액션 — 본 파일과 무관.
       * 가이드: docs/project-management/2026-06-10/GOOGLE_ANDROID_OAUTH_SETUP.md</p>
       */
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: false,
          data: [
            {
              scheme: ANDROID_PACKAGE_ID,
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: appPlugins,
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        /**
         * EAS project UUID — 저장소에 실제 ID를 커밋하지 않는다.
         * 로컬·CI: `EAS_PROJECT_ID` 또는 `EXPO_PUBLIC_EAS_PROJECT_ID` env 로 주입.
         * `updates.url` 과 동일 UUID 를 사용해 OTA endpoint 와 일치시킨다.
         */
        projectId: easProjectId || 'YOUR_EAS_PROJECT_ID',
      },
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      /** EAS/로컬 빌드 시 env 주입 — 소스에 PG 키 평문 커밋 금지 */
      tossPaymentsClientKey: process.env.EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY ?? '',
      tossPaymentSuccessUrl: process.env.EXPO_PUBLIC_TOSS_PAYMENT_SUCCESS_URL ?? '',
      tossPaymentFailUrl: process.env.EXPO_PUBLIC_TOSS_PAYMENT_FAIL_URL ?? '',
      /** JSON 배열 문자열. 비우면 데모 카탈로그(`sessionExtensionCatalog.ts`) 사용 */
      sessionExtensionCatalog: process.env.EXPO_PUBLIC_SESSION_EXTENSION_CATALOG_JSON ?? '',
      /** 릴리스 번들에서 `process.env.EXPO_PUBLIC_*` 가 비어도 네이버 SDK JS 초기화가 되도록 */
      naverClientId: resolveNaverClientIdForNative(),
      naverClientSecret: resolveNaverClientSecretForNative(),
      /** 카카오 네이티브 키(디버깅·원격 설정용) — SDK는 플러그인 주입 값 사용 */
      kakaoNativeAppKey: resolveKakaoAppKeyForNative(),
      /** EXPO_PUBLIC_SOCIAL_LOGIN_DEBUG=1 이면 릴리스·프리뷰에서도 AuthService 소셜 로그인 구조화 진단 로그가 켜집니다(adb logcat / Metro에서 `[AuthService][social-login]` 필터). */
      socialLoginDebug: process.env.EXPO_PUBLIC_SOCIAL_LOGIN_DEBUG === '1',
      /**
       * Google OAuth 2.0 Client IDs — `@react-native-google-signin/google-signin` Native SDK
       * (Build #16, 2026-06-10) 가 다음을 사용:
       *  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`     : OAuth 2.0 Web Client (idToken `aud` 검증 + BE allowedAudiences)
       *  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`     : OAuth 2.0 iOS Client (Bundle ID `com.mindgarden.MindGardenMobile`)
       *  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` : OAuth 2.0 Android Client (Package `com.mindgardenmobile` + SHA-1)
       *
       * <p>저장소에 평문 커밋 금지. EAS 시크릿 또는 로컬 `.env` 로 주입한다.</p>
       *
       * <p>Native SDK 는 webClientId 가 필수 (idToken audience). iosClientId 는 plugin 의
       * `iosUrlScheme` 이 함께 등록되어야 iOS Safari View Controller 콜백이 동작한다. Android 는
       * Google Cloud Console 의 SHA-1 + Package name 정합 (Cloud Console 사용자 액션) 만으로 동작 —
       * `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` 자체는 SDK 가 직접 사용하지 않지만 BE
       * `allowedAudiences` 에 포함되어 idToken `aud` 검증에 사용된다.</p>
       *
       * <p>**Build #16 (2026-06-10)** — Native SDK 마이그레이션. 기존 OTA 빈 값 회귀 보호 그대로
       * 유지: 빈 값이면 항목 자체를 omit 하여 `Constants.expoConfig.extra.googleClientId` 가
       * `undefined` 가 되고, `googleSignIn.resolveGoogleClientIdConfig()` 가
       * `process.env` (metro inline) 로 폴백한다.</p>
       */
      ...(extraGoogleClientId ? { googleClientId: extraGoogleClientId } : {}),
    },
  };
};
