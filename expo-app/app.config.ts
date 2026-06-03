import type { ExpoConfig, ConfigContext } from 'expo/config';

// Node(app.config 평가)는 .ts 모듈을 직접 require하지 못함 → CJS 미러 사용
// eslint-disable-next-line @typescript-eslint/no-require-imports
const appCfgColors = require('./src/theme/tokensAppConfig.cjs') as {
  clientBgMain: string;
  consultantPrimary: string;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withAndroidKakaoMaven = require('./plugins/withAndroidKakaoMaven');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('./package.json') as { version: string };
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

export default ({ config }: ConfigContext): ExpoConfig => {
  warnIfSocialLoginEnvMissingForEasBuild();
  const apiBaseUrl = resolveApiBaseUrlExtra();
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
    ios: {
      icon: './assets/images/icon.png',
      supportsTablet: false,
      bundleIdentifier: 'com.mindgarden.MindGardenMobile',
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
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        /** 나비 로고와 동일한 검정 배경(Adaptive Icon 마스크 외곽) */
        backgroundColor: '#000000',
      },
      package: 'com.mindgardenmobile',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
      edgeToEdgeEnabled: true,
      versionCode: releaseManifest.androidVersionCode,
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
         */
        projectId:
          process.env.EAS_PROJECT_ID ??
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
          'YOUR_EAS_PROJECT_ID',
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
    },
  };
};
