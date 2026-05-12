/**
 * MindGarden 타이포그래피 스케일
 * Pretendard 폰트 패밀리 + 사전 정의 텍스트 스타일
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import * as Font from 'expo-font';

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const textStyles = {
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.tight,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.tight,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.tight,
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.tight,
  },
} as const;

/**
 * Pretendard 폰트 에셋 로딩
 * App 초기화 시 호출 (expo-font)
 *
 * assets/fonts/ 에 ttf 파일 배치 필요:
 *   Pretendard-Regular.ttf, Pretendard-Medium.ttf,
 *   Pretendard-SemiBold.ttf, Pretendard-Bold.ttf
 */
export async function loadFonts(): Promise<void> {
  await Font.loadAsync({
    [fontFamily.regular]: require('../../assets/fonts/Pretendard-Regular.ttf'),
    [fontFamily.medium]: require('../../assets/fonts/Pretendard-Medium.ttf'),
    [fontFamily.semibold]: require('../../assets/fonts/Pretendard-SemiBold.ttf'),
    [fontFamily.bold]: require('../../assets/fonts/Pretendard-Bold.ttf'),
  });
}
