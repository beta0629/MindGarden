/**
 * V2 §A.7 / §I.5 — 화면 최하단 보조 링크 (비밀번호 찾기 · 다른 기관으로 변경).
 *
 * <p>회원가입 링크는 V2 에서 제거 (§A.5 / §H8). 본 컴포넌트는 두 링크만 가로 1줄
 * + `·` 구분자(separator dot 6dp) 로 보여준다.</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §A.7 / §G.1</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontFamily, fontSize } from '@/theme/typography';

const MAX_FONT_SIZE_MULTIPLIER = 1.6;
const FORGOT_PASSWORD_LABEL = '비밀번호 찾기';
const CHANGE_TENANT_LABEL = '다른 기관으로 변경';
const SEPARATOR_DOT = '·';

export interface FooterLinksProps {
  readonly onForgotPasswordPress: () => void;
  readonly onChangeTenantPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function FooterLinks({
  onForgotPasswordPress,
  onChangeTenantPress,
  style,
  testID,
}: FooterLinksProps) {
  const theme = useTheme();

  const handleForgotPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    onForgotPasswordPress();
  }, [onForgotPasswordPress]);

  const handleChangeTenantPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    onChangeTenantPress();
  }, [onChangeTenantPress]);

  return (
    <View style={[styles.root, style]} testID={testID ?? 'login-footer-links'}>
      <Pressable
        onPress={handleForgotPress}
        accessibilityRole="link"
        accessibilityLabel={FORGOT_PASSWORD_LABEL}
        hitSlop={8}
        testID="login-link-forgot-password"
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.linkLabel, { color: theme.colors.textTertiary }]}
        >
          {FORGOT_PASSWORD_LABEL}
        </Text>
      </Pressable>
      <Text
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.separator, { color: theme.colors.textTertiary }]}
      >
        {SEPARATOR_DOT}
      </Text>
      <Pressable
        onPress={handleChangeTenantPress}
        accessibilityRole="link"
        accessibilityLabel={CHANGE_TENANT_LABEL}
        hitSlop={8}
        testID="login-link-change-tenant"
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.linkLabel, { color: theme.colors.textTertiary }]}
        >
          {CHANGE_TENANT_LABEL}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  linkLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  separator: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});
