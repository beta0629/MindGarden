/**
 * 로그인 화면 헤더 — 그라데이션 나비 로고 + 타이포 4종 + (조건부) 기관명.
 *
 * 모션 구성:
 *  - 로고: fade-in (scale 0.96→1.0, 500ms, delay 200ms) → breathing 1.00↔1.02 (5s ∞)
 *  - 타이틀/서브타이틀/워드마크/기관명: fade-in + translateY 6→0 (각각 100ms stagger)
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
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { fontFamily, fontSize } from '@/theme/typography';
import {
  LOGIN_EASING,
  LOGO_BREATHING_DELAY_MS,
  LOGO_BREATHING_MAX_SCALE,
  LOGO_BREATHING_MIN_SCALE,
  LOGO_BREATHING_PERIOD_MS,
  LOGO_FADE_IN_DELAY_MS,
  LOGO_FADE_IN_DURATION_MS,
  LOGO_FINAL_SCALE,
  LOGO_INITIAL_SCALE,
  LOGO_TO_TITLE_GAP,
  SUBTITLE_FADE_IN_DELAY_MS,
  SUBTITLE_TO_WORDMARK_GAP,
  TENANT_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DELAY_MS,
  TITLE_FADE_IN_DURATION_MS,
  TITLE_INITIAL_TRANSLATE_Y,
  TITLE_TO_SUBTITLE_GAP,
  WORDMARK_FADE_IN_DELAY_MS,
  WORDMARK_LETTER_SPACING,
  WORDMARK_TO_TENANT_GAP,
  resolveLogoSizeForWidth,
  type LoginAnimationConfig,
} from './loginAnimationConstants';

const BUTTERFLY_LOGO_SOURCE = require('../../../../assets/brand/mindgarden-butterfly-logo.png');

/** Dynamic Type 대응 cap — 타이포가 깨지지 않게 1.4 ~ 1.6 사이 */
const LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER = 1.6;

const TITLE_TEXT = '마인드가든';
const SUBTITLE_TEXT = '심리상담센터';
const WORDMARK_TEXT = 'MIND GARDEN';

export interface LogoSectionProps {
  readonly config: LoginAnimationConfig;
  /** 기관명 — 비어 있으면 렌더 안 함 (스펙 §3.1 단계 8 조건부) */
  readonly tenantName?: string;
  readonly style?: StyleProp<ViewStyle>;
  /** 시뮬레이터 시연/시각 회귀용 testID */
  readonly testID?: string;
}

export function LogoSection({ config, tenantName, style, testID }: LogoSectionProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const logoSize = useMemo(() => resolveLogoSizeForWidth(windowWidth), [windowWidth]);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(LOGO_INITIAL_SCALE)).current;
  const breathing = useRef(new Animated.Value(LOGO_BREATHING_MIN_SCALE)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;
  const tenantOpacity = useRef(new Animated.Value(0)).current;
  const tenantTranslateY = useRef(new Animated.Value(TITLE_INITIAL_TRANSLATE_Y)).current;

  useEffect(() => {
    const initialLogoScale = config.logoScaleOnFadeIn ? LOGO_INITIAL_SCALE : LOGO_FINAL_SCALE;
    logoScale.setValue(initialLogoScale);
    logoOpacity.setValue(0);

    const initialTranslate = config.titleTranslateOnFadeIn ? TITLE_INITIAL_TRANSLATE_Y : 0;
    titleTranslateY.setValue(initialTranslate);
    subtitleTranslateY.setValue(initialTranslate);
    wordmarkTranslateY.setValue(initialTranslate);
    tenantTranslateY.setValue(initialTranslate);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    wordmarkOpacity.setValue(0);
    tenantOpacity.setValue(0);

    const logoFadeAnims: Animated.CompositeAnimation[] = [
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: LOGO_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
    ];
    if (config.logoScaleOnFadeIn) {
      logoFadeAnims.push(
        Animated.timing(logoScale, {
          toValue: LOGO_FINAL_SCALE,
          duration: LOGO_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: LOGO_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
      );
    }

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
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: TITLE_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: WORDMARK_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
      Animated.timing(tenantOpacity, {
        toValue: 1,
        duration: TITLE_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: TENANT_FADE_IN_DELAY_MS,
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
        Animated.timing(wordmarkTranslateY, {
          toValue: 0,
          duration: TITLE_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: WORDMARK_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(tenantTranslateY, {
          toValue: 0,
          duration: TITLE_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: TENANT_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
      );
    }

    Animated.parallel([...logoFadeAnims, ...textAnims]).start();
  }, [
    config.logoScaleOnFadeIn,
    config.titleTranslateOnFadeIn,
    logoOpacity,
    logoScale,
    subtitleOpacity,
    subtitleTranslateY,
    tenantOpacity,
    tenantTranslateY,
    titleOpacity,
    titleTranslateY,
    wordmarkOpacity,
    wordmarkTranslateY,
  ]);

  useEffect(() => {
    if (!config.logoBreathingEnabled) {
      breathing.setValue(LOGO_BREATHING_MIN_SCALE);
      return undefined;
    }
    const halfPeriod = LOGO_BREATHING_PERIOD_MS / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathing, {
          toValue: LOGO_BREATHING_MAX_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          delay: LOGO_BREATHING_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(breathing, {
          toValue: LOGO_BREATHING_MIN_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      breathing.setValue(LOGO_BREATHING_MIN_SCALE);
    };
  }, [breathing, config.logoBreathingEnabled]);

  const combinedLogoScale = Animated.multiply(logoScale, breathing);

  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="header"
      accessibilityLabel={`${TITLE_TEXT} ${SUBTITLE_TEXT}`}
      testID={testID ?? 'login-logo-section'}
    >
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: combinedLogoScale }],
          marginBottom: LOGO_TO_TITLE_GAP,
        }}
      >
        <Image
          source={BUTTERFLY_LOGO_SOURCE}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </Animated.View>

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
            marginBottom: SUBTITLE_TO_WORDMARK_GAP,
          },
        ]}
      >
        {SUBTITLE_TEXT}
      </Animated.Text>

      <Animated.Text
        maxFontSizeMultiplier={LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER}
        allowFontScaling
        style={[
          styles.wordmark,
          {
            color: theme.colors.textSecondary,
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslateY }],
            marginBottom: tenantName ? WORDMARK_TO_TENANT_GAP : 0,
          },
        ]}
      >
        {WORDMARK_TEXT}
      </Animated.Text>

      {Boolean(tenantName) && (
        <Animated.Text
          maxFontSizeMultiplier={LOGO_SECTION_MAX_FONT_SIZE_MULTIPLIER}
          allowFontScaling
          style={[
            styles.tenantName,
            {
              color: theme.colors.textSecondary,
              opacity: tenantOpacity,
              transform: [{ translateY: tenantTranslateY }],
            },
          ]}
          testID="login-tenant-name"
        >
          {tenantName}
        </Animated.Text>
      )}
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
  wordmark: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: WORDMARK_LETTER_SPACING,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tenantName: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
