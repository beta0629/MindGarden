/**
 * 커버 브랜드 헤더 — 「마인드가든」 + CORE 배지 + 우측 지점/역할 라벨, 하단 hairline.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

export interface CoverBrandHeaderProps {
  /** 내담자: 지점(테넌트)명 · 상담사: 역할 라벨. 없으면 생략 */
  readonly rightLabel?: string | null;
}

export function CoverBrandHeader({ rightLabel }: CoverBrandHeaderProps) {
  return (
    <View style={styles.root}>
      <View style={styles.brandRow} accessibilityRole="header">
        <Text style={styles.brand} numberOfLines={1}>
          {COVER_CHAPTER_COPY.BRAND_NAME}
        </Text>
        <Text style={styles.badge}>{COVER_CHAPTER_COPY.BRAND_BADGE}</Text>
      </View>
      {rightLabel ? (
        <Text style={styles.right} numberOfLines={1}>
          {rightLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: COVER_METRICS.brandHeaderHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: COVER_METRICS.hairline,
    borderBottomColor: CLINIC_OS.hairline,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 0,
  },
  brand: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    color: CLINIC_OS.ink,
  },
  badge: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xs'],
    letterSpacing: 0.5,
    color: CLINIC_OS.teal,
  },
  right: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
    textAlign: 'right',
  },
});
