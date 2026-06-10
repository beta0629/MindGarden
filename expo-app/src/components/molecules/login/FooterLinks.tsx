/**
 * V2 §A.7 / §I.5 — 화면 최하단 보조 링크.
 *
 * <p>2026-06-10 정책 정정 — 비밀번호 찾기 링크 제거:
 *  - expo-app 에는 비밀번호 찾기 화면이 없다 → 링크 미표시.
 *  - 비밀번호 재설정은 웹에서만 진행한다 (BE / 웹 라우트 가용).
 *  - 향후 베타 안정 후 별도 PR 로 앱 내 신규 구현 검토.</p>
 *
 * <p>회원가입 링크는 V2 에서 제거 (§A.5 / §H8). 본 컴포넌트는 "다른 기관으로 변경" 단일 링크만
 * 가운데 정렬로 보여준다.</p>
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
const CHANGE_TENANT_LABEL = '다른 기관으로 변경';

export interface FooterLinksProps {
  readonly onChangeTenantPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function FooterLinks({ onChangeTenantPress, style, testID }: FooterLinksProps) {
  const theme = useTheme();

  const handleChangeTenantPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    onChangeTenantPress();
  }, [onChangeTenantPress]);

  return (
    <View style={[styles.root, style]} testID={testID ?? 'login-footer-links'}>
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
  },
  linkLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});
