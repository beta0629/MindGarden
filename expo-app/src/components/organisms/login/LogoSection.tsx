/**
 * 로그인 화면 헤더 — 그라데이션 나비 로고 + 2단 한글 타이포.
 *
 * 정보 위계(사용자 지적 2026-06-10 — 중복 제거 패턴 A):
 *  - 로고 PNG: 나비 그래픽만 (텍스트 없음, 자산 자체 검증 완료)
 *  - 타이틀: "마인드가든" (Bold, 2xl)
 *  - 서브타이틀: "심리상담센터" (Medium, sm, textSecondary)
 *  - (제거됨) 영문 워드마크 "MIND GARDEN" — 동일 정보 중복
 *  - (제거됨) tenantName "마인드가든 심리상담센터" — 동일 정보 중복
 *
 * 한국 사용자 대상이므로 한글 우선·위계 명확 (제목 > 부제 2레벨).
 *
 * 모션 구성:
 *  - 로고: fade-in (scale 0.96→1.0, 500ms, delay 200ms) → breathing 1.00↔1.02 (5s ∞)
 *  - 타이틀/서브타이틀: fade-in + translateY 6→0 (100ms stagger)
 *
 * 본 컴포넌트는 §6 분기 로직을 자체 가지지 않고 {@link LoginAnimationConfig}만 받아 동작한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §1.1 / §3 / §4.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { fontFamily, fontSize } from '@/theme/typography';
import { BreathingButterflyLogo } from '@/components/molecules/BreathingButterflyLogo';
import {
  LOGIN_EASING,
  LOGO_TO_TITLE_GAP,
  SUBTITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DURATION_MS,
  TITLE_INITIAL_TRANSLATE_Y,
  TITLE_TO_SUBTITLE_GAP,
  resolveLogoSizeForWidth,
  type LoginAnimationConfig,
} from './loginAnimationConstants';

/** Dynamic Type 대응 cap — 타이포가 깨지지 않게 1.4 ~ 1.6 사이 */
const LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER = 1.6;

const TITLE_TEXT = '마인드가든';
const SUBTITLE_TEXT = '심리상담센터';

export interface LogoSectionProps {
  readonly config: LoginAnimationConfig;
  readonly style?: StyleProp<ViewStyle>;
  /** 시뮬레이터 시연/시각 회귀용 testID */
  readonly testID?: string;
}

export function LogoSection({ config, style, testID }: LogoSectionProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const logoSize = useMemo(() => resolveLogoSizeForWidth(windowWidth), [windowWidth]);

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

    const textAnims: Animated.CompositeAnimation[] = [
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
      textAnims.push(
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

    Animated.parallel(textAnims).start();
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
      accessibilityLabel={`${TITLE_TEXT} ${SUBTITLE_TEXT}`}
      testID={testID ?? 'login-logo-section'}
    >
      <BreathingButterflyLogo
        config={config}
        size={logoSize}
        style={{ marginBottom: LOGO_TO_TITLE_GAP }}
        testID="login-butterfly-logo"
      />

      <Animated.Text
        maxFontSizeMultiplier={LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER}
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
        maxFontSizeMultiplier={LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER}
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
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
