/**
 * 어드민 폼 섹션 카드 — 좌측 악센트 바 + 타이틀 + 필드 영역
 * DESIGN_SPEC_EXPO_ADMIN_CLIENT_CONSULTANT_CREATE §3.2
 *
 * @author MindGarden
 * @since 2026-08-20
 */
import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';

export type FormSectionCardProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly style?: ViewStyle;
};

export function FormSectionCard({ title, children, style }: FormSectionCardProps) {
  const theme = useTheme();
  const titleText = toDisplayString(title, '');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.borderRadius.xl,
          padding: theme.spacing.xl,
          ...theme.shadows.sm,
        },
        style,
      ]}
    >
      <View style={[styles.titleRow, { gap: theme.spacing.sm }]}>
        <View
          style={{
            width: theme.spacing.xs,
            height: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.sm / 2,
          }}
        />
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          {titleText}
        </Text>
      </View>
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
