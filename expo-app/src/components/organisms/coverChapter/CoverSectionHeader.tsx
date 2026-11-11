/**
 * 섹션 제목 행 — 좌 제목 · 우 보조 라벨(선택적으로 탭 가능, 44pt 터치 영역).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

export interface CoverSectionHeaderProps {
  readonly title: string;
  readonly rightLabel?: string | null;
  readonly onPressRight?: () => void;
  readonly rightAccessibilityLabel?: string;
  readonly size?: 'section' | 'compact';
}

export function CoverSectionHeader({
  title,
  rightLabel,
  onPressRight,
  rightAccessibilityLabel,
  size = 'section',
}: CoverSectionHeaderProps) {
  const right = rightLabel ? (
    <Text style={styles.right} numberOfLines={1}>
      {rightLabel}
    </Text>
  ) : null;

  return (
    <View style={styles.root}>
      <Text
        style={size === 'compact' ? styles.titleCompact : styles.title}
        accessibilityRole="header"
        numberOfLines={1}
      >
        {title}
      </Text>
      {right && onPressRight ? (
        <Pressable
          onPress={onPressRight}
          accessibilityRole="button"
          accessibilityLabel={rightAccessibilityLabel ?? rightLabel ?? undefined}
          style={styles.rightTouch}
        >
          {right}
        </Pressable>
      ) : (
        right
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: COVER_METRICS.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.lg,
    color: CLINIC_OS.ink,
  },
  titleCompact: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: CLINIC_OS.ink,
  },
  right: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  rightTouch: {
    minHeight: COVER_METRICS.touchTarget,
    minWidth: COVER_METRICS.touchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
