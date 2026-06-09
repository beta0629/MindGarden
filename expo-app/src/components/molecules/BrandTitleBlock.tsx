/**
 * 마인드가든 브랜드 타이틀 블록 (1단 제목 + 1줄 부제) — V2 B2 Breathing Circle 안에 위치.
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §A.2 정보 위계 — "한 번만 말하기" (V1 4중 텍스트 폐기)
 *  - §I.5 카피 ("마인드가든" Bold 22dp + "마음을 돌보는 시간" Regular 14dp)
 *  - §M.1.4 모션 타임라인 (400ms 타이틀 / 600ms 부제, Reduce Motion fade only)</p>
 *
 * <p>본 컴포넌트는 Breathing Circle 내부의 정중앙 텍스트만 책임진다. "심리상담센터" /
 * "MIND GARDEN" / TenantName 4중 표시 코드는 V2 에서 절대 제거 (§H1).</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { fontFamily, fontSize } from '@/theme/typography';
import {
  LOGIN_EASING,
  SUBTITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DURATION_MS,
  TITLE_INITIAL_TRANSLATE_Y,
  TITLE_TO_SUBTITLE_GAP,
  type LoginAnimationConfig,
} from '@/components/organisms/login/loginAnimationConstants';

const MAX_FONT_SIZE_MULTIPLIER = 1.6;

/** V2 §I.5 / §A.2 — 1단 제목. 사용자 SSOT 결정으로 변경 금지. */
const TITLE_TEXT = '마인드가든';
/** V2 §I.5 / §N.3 채택 — 부제 1줄. */
const SUBTITLE_TEXT = '마음을 돌보는 시간';

export interface BrandTitleBlockProps {
  readonly config: LoginAnimationConfig;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function BrandTitleBlock({ config, style, testID }: BrandTitleBlockProps) {
  const theme = useTheme();
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;

  useEffect(() => {
    const initialTranslate = config.titleTranslateOnFadeIn ? TITLE_INITIAL_TRANSLATE_Y : 0;
    titleTranslateY.setValue(initialTranslate);
    subtitleTranslateY.setValue(initialTranslate);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);

    const anims: Animated.CompositeAnimation[] = [
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: TITLE_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: TITLE_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: TITLE_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: SUBTITLE_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
    ];

    if (config.titleTranslateOnFadeIn) {
      anims.push(
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: TITLE_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: TITLE_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: TITLE_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: SUBTITLE_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
      );
    }

    const composite = Animated.parallel(anims);
    composite.start();
    return () => {
      composite.stop();
    };
  }, [
    config.titleTranslateOnFadeIn,
    subtitleOpacity,
    subtitleTranslateY,
    titleOpacity,
    titleTranslateY,
  ]);

  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="header"
      accessibilityLabel={`${TITLE_TEXT}, ${SUBTITLE_TEXT}`}
      testID={testID ?? 'brand-title-block'}
    >
      <Animated.Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        allowFontScaling
        style={[
          styles.title,
          {
            color: theme.colors.textMain,
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            marginBottom: TITLE_TO_SUBTITLE_GAP,
          },
        ]}
      >
        {TITLE_TEXT}
      </Animated.Text>
      <Animated.Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        allowFontScaling
        style={[
          styles.subtitle,
          {
            color: theme.colors.textSecondary,
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          },
        ]}
      >
        {SUBTITLE_TEXT}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
