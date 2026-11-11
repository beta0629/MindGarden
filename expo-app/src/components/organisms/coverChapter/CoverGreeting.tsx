/**
 * 커버 인사 블록 — 이름(긴 이름은 말줄임) · 보조 한 줄 · (선택) 우측 요약.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { CLINIC_OS } from './coverChapterTokens';

export interface CoverGreetingProps {
  readonly title: string;
  readonly subtitle?: string | null;
  readonly trailing?: string | null;
  readonly size?: 'cover' | 'compact';
}

export function CoverGreeting({ title, subtitle, trailing, size = 'cover' }: CoverGreetingProps) {
  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text
          style={size === 'compact' ? styles.titleCompact : styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {trailing ? (
          <Text style={styles.trailing} numberOfLines={1}>
            {trailing}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xl,
    color: CLINIC_OS.ink,
  },
  titleCompact: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: CLINIC_OS.ink,
  },
  trailing: {
    flexShrink: 0,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
  },
});
