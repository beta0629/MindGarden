import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MindGarden',
  slug: 'mindgarden',
  version: '1.0.0',
  scheme: 'mindgarden',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FAF9F7',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mindgarden.MindGardenMobile',
    infoPlist: {
      UIBackgroundModes: ['audio'],
      NSCameraUsageDescription:
        'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
      NSMicrophoneUsageDescription: '음성 메시지를 위해 마이크 접근이 필요합니다.',
      NSCalendarsUsageDescription: '상담 일정을 기기 캘린더에 추가하기 위해 접근이 필요합니다.',
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ?? 'vTKNlxYKIfo1uCCXaDfk',
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ?? 'V_b3omW5pu',
      NAVER_APP_NAME: 'MindGardenMobileApp',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FAF9F7',
    },
    package: 'com.mindgardenmobile',
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#3D5246',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          '프로필 사진을 선택하기 위해 사진 보관함 접근이 필요합니다.',
        cameraPermission:
          'QR 코드 스캔과 프로필 사진 촬영을 위해 카메라 접근이 필요합니다.',
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
        kakaoAppKey: process.env.KAKAO_APP_KEY ?? 'KAKAO_APP_KEY_HERE',
      },
    ],
    [
      '@react-native-seoul/naver-login',
      {
        urlScheme: 'naverMindGardenMobileApp',
        consumerKey: process.env.NAVER_CLIENT_ID ?? 'NAVER_CLIENT_ID_HERE',
        consumerSecret: process.env.NAVER_CLIENT_SECRET ?? 'NAVER_CLIENT_SECRET_HERE',
        appName: 'MindGardenMobileApp',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
    /** EAS/로컬 빌드 시 env 주입 — 소스에 PG 키 평문 커밋 금지 */
    tossPaymentsClientKey: process.env.EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY ?? '',
    tossPaymentSuccessUrl: process.env.EXPO_PUBLIC_TOSS_PAYMENT_SUCCESS_URL ?? '',
    tossPaymentFailUrl: process.env.EXPO_PUBLIC_TOSS_PAYMENT_FAIL_URL ?? '',
    /** JSON 배열 문자열. 비우면 데모 카탈로그(`sessionExtensionCatalog.ts`) 사용 */
    sessionExtensionCatalog: process.env.EXPO_PUBLIC_SESSION_EXTENSION_CATALOG_JSON ?? '',
  },
});
