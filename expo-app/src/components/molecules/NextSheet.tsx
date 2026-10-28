/**
 * NextSheet — 「다음 한 장」mint wash 시트 molecule
 * CTA는 MGButton 슬롯만 사용 (화면별 버튼 스킨 금지).
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';

export interface NextSheetProps {
  readonly title: string;
  readonly datetime?: string;
  readonly meta?: string;
  readonly note?: string;
  readonly zeroState?: boolean;
  readonly cta?: ReactNode;
  readonly style?: ViewStyle;
  readonly accessibilityLabel?: string;
}

export function NextSheet({
  title,
  datetime,
  meta,
  note,
  zeroState = false,
  cta,
  style,
  accessibilityLabel = '다음 한 장',
}: NextSheetProps) {
  const theme = useTheme();
  const gradientColors = zeroState
    ? [theme.colors.surface, theme.colors.mintWash]
    : [theme.colors.mintWash, theme.colors.mintWashEnd];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.sheet,
        {
          borderColor: theme.colors.mintWashEnd,
          borderRadius: theme.borderRadius['2xl'],
          ...theme.shadows.sm,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.kickerRow}>
        <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.xs,
            color: theme.colors.slate,
          }}
        >
          다음 한 장
        </Text>
      </View>

      <Text
        style={{
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize.xl,
          color: theme.colors.textMain,
          letterSpacing: -0.48,
          marginBottom: theme.spacing.md,
        }}
        accessibilityRole="header"
      >
        {title}
      </Text>

      {datetime ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.textMain,
            letterSpacing: -0.32,
            marginBottom: theme.spacing.sm,
          }}
        >
          {datetime}
        </Text>
      ) : null}

      {meta ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.slate,
            lineHeight: 20,
          }}
        >
          {meta}
        </Text>
      ) : null}

      {note ? (
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.mute,
            marginTop: theme.spacing.md,
            paddingTop: theme.spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.colors.mintWashEnd,
          }}
        >
          {note}
        </Text>
      ) : null}

      {cta ? <View style={styles.ctaRow}>{cta}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.55,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
