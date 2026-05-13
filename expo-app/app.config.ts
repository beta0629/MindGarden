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
      NSCameraUsageDescription: 'QR 코드 스캔을 위해 카메라 접근이 필요합니다.',
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
        cameraPermission: 'QR 코드 스캔을 위해 카메라 접근이 필요합니다.',
      },
    ],
    'expo-font',
    'expo-splash-screen',
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
  },
});
