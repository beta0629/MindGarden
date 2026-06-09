/**
 * V2 §B.1 / §I.5 — "이미 가입한 이메일·휴대폰 번호로 로그인 ⌃" 트리거 (atom).
 *
 * <p>탭 시 부모(login.tsx)가 Bottom Sheet 를 연다. 트리거 자체는 표시 상태(`expanded`) 만 받아
 * 아이콘(⌃ ↔ ⌄) 을 토글한다.</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §A.6 트리거 진입 (인라인 상시 노출 폐기)
 *  - §I.5 카피 ("이미 가입한 이메일·휴대폰 번호로 로그인" / 닫힘 hint "닫기")
 *  - §G.1 a11y (`accessibilityState.expanded`)</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamily, fontSize } from '@/theme/typography';

const MAX_FONT_SIZE_MULTIPLIER = 1.6;
const TRIGGER_LABEL_CLOSED = '이미 가입한 이메일·휴대폰 번호로 로그인';
const TRIGGER_LABEL_EXPANDED = '이메일·휴대폰 번호 로그인 닫기';
const ICON_SIZE = 16;

export interface CredentialSheetTriggerProps {
  readonly expanded: boolean;
  readonly onPress: (event: GestureResponderEvent) => void;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function CredentialSheetTrigger({
  expanded,
  onPress,
  disabled = false,
  style,
  testID,
}: CredentialSheetTriggerProps) {
  const theme = useTheme();
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      Haptics.selectionAsync().catch(() => {
        /* noop */
      });
      onPress(event);
    },
    [onPress],
  );

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityLabel={expanded ? TRIGGER_LABEL_EXPANDED : TRIGGER_LABEL_CLOSED}
      accessibilityRole="button"
      accessibilityState={{ expanded, disabled }}
      hitSlop={8}
      testID={testID ?? 'login-credential-sheet-trigger'}
      style={[styles.root, style]}
    >
      <View style={styles.row}>
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.label, { color: theme.colors.textSecondary }]}
        >
          {TRIGGER_LABEL_CLOSED}
        </Text>
        {expanded ? (
          <ChevronDown size={ICON_SIZE} color={theme.colors.textSecondary} />
        ) : (
          <ChevronUp size={ICON_SIZE} color={theme.colors.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
