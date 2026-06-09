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
  /**
   * SNS 로그인·CTA 버튼 텍스트 — 카카오/네이버/Apple 통일 (사용자 결정 2026-06-10).
   * fontSize 16 / semibold / lineHeight 22 / letterSpacing -0.2 (한글 자간).
   */
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  /**
   * SNS 영역 구분선 가운데 라벨 ("또는 다음으로 로그인") — 웹 톤 정합.
   * 폰트 사이즈 13 (sm 14 와 caption xs 12 의 중간 — 시각 위계 유지)·옅은 회색은 컴포넌트가 결정.
   */
  dividerCaption: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  /**
   * 인증 화면 하단 링크 ("회원가입" / "비밀번호 찾기") — 웹 톤 정합.
   * fontSize 14 / medium / lineHeight 20.
   */
  authLink: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: 20,
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
    [fontFamily.regular]: require('../../assets/fonts/Pretendard-Regular.otf'),
    [fontFamily.medium]: require('../../assets/fonts/Pretendard-Medium.otf'),
    [fontFamily.semibold]: require('../../assets/fonts/Pretendard-SemiBold.otf'),
    [fontFamily.bold]: require('../../assets/fonts/Pretendard-Bold.otf'),
  });
}
