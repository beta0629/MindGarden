/**
 * AccountMismatchHint — 데이터 0건일 때 "다른 계정 로그인 가능성" 안내 molecule
 *
 * 웰니스(mood-journal, mind-weather) EmptyState 하단에 노출되어
 * 사용자가 잘못된 계정으로 로그인된 상황을 자가 확인할 수 있도록 한다.
 *
 * 참조:
 *  - docs/standards/COMPONENT_STRUCTURE_STANDARD.md
 *  - docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight, Info } from 'lucide-react-native';
import { useTheme } from '@/theme';

export const ACCOUNT_MISMATCH_HINT_TITLE = '다른 단말에서 보던 데이터가 보이지 않나요?';
export const ACCOUNT_MISMATCH_HINT_BODY =
  '마이페이지에서 현재 로그인 계정을 확인해 주세요.';
export const ACCOUNT_MISMATCH_HINT_ACTION_LABEL = '마이페이지 계정 확인';

interface AccountMismatchHintProps {
  onPressOpenAccount: () => void;
  style?: ViewStyle;
}

export function AccountMismatchHint({ onPressOpenAccount, style }: AccountMismatchHintProps) {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPressOpenAccount();
  }, [onPressOpenAccount]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${ACCOUNT_MISMATCH_HINT_TITLE} ${ACCOUNT_MISMATCH_HINT_BODY}`}
      testID="account-mismatch-hint"
    >
      <View style={styles.headerRow}>
        <Info size={16} color={theme.colors.textSecondary} />
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {ACCOUNT_MISMATCH_HINT_TITLE}
        </Text>
      </View>
      <Text
        style={[
          styles.body,
          {
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          },
        ]}
      >
        {ACCOUNT_MISMATCH_HINT_BODY}
      </Text>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.actionButton,
          {
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={ACCOUNT_MISMATCH_HINT_ACTION_LABEL}
        testID="account-mismatch-hint-action"
      >
        <Text
          style={[
            styles.actionLabel,
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.xs,
            },
          ]}
        >
          {ACCOUNT_MISMATCH_HINT_ACTION_LABEL}
        </Text>
        <ChevronRight size={14} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginTop: 12,
    marginHorizontal: 16,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    lineHeight: 18,
  },
  body: {
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionLabel: {},
});
