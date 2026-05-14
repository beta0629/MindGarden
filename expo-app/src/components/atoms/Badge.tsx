/**
 * Badge — 상태·카운트 표시용 배지 atom
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', size = 'sm', style }: BadgeProps) {
  const theme = useTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: theme.colors.primary, text: theme.colors.textOnPrimary },
    success: { bg: theme.colors.success, text: theme.colors.textOnPrimary },
    warning: { bg: theme.colors.warning, text: theme.colors.textMain },
    error: { bg: theme.colors.error, text: theme.colors.textOnPrimary },
    info: { bg: theme.colors.info, text: theme.colors.textOnPrimary },
    gray: { bg: theme.colors.gray[100], text: theme.colors.textSecondary },
  };

  const colors = variantColors[variant];

  return (
    <View
      style={[styles.badge, size === 'md' && styles.badgeMd, { backgroundColor: colors.bg }, style]}
      accessibilityRole="text"
    >
      <Text
        style={[
          styles.text,
          size === 'md' && styles.textMd,
          {
            color: colors.text,
            fontFamily: theme.fontFamily.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontSize: fontSizeTokens['2xs'],
  },
  textMd: {
    fontSize: fontSizeTokens.xs,
  },
});
