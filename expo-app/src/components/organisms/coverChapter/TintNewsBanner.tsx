/**
 * 소식/캠페인 배너 슬롯 — tint 배경 · 칩 · 제목 · 보조문 · 셰브론.
 * 실제 활성 공지가 있을 때만 렌더한다(호출부에서 null 전달 시 섹션 자체 숨김).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { borderRadius, fontFamily, fontSize, spacing } from '@/theme';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import type { CoverNewsBannerView } from '@/utils/coverChapterViewModel';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

const CHEVRON_SIZE = 18;

export interface TintNewsBannerProps {
  readonly banner: CoverNewsBannerView | null;
  readonly onPress: () => void;
}

export function TintNewsBanner({ banner, onPress }: TintNewsBannerProps) {
  if (!banner) {
    return null;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={COVER_CHAPTER_COPY.BANNER_A11Y(banner.title)}
      style={({ pressed }) => [styles.root, pressed ? styles.pressed : null]}
    >
      <View style={styles.chip}>
        <Text style={styles.chipText}>{banner.chip}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {banner.title}
        </Text>
        {banner.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {banner.subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={CHEVRON_SIZE} color={CLINIC_OS.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: COVER_METRICS.bannerMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: CLINIC_OS.tint,
    borderWidth: COVER_METRICS.hairline,
    borderColor: CLINIC_OS.hairline,
    borderRadius: borderRadius.md,
  },
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  chip: {
    backgroundColor: CLINIC_OS.sheet,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['2xs'],
    color: CLINIC_OS.muted,
  },
  body: {
    flex: 1,
    gap: spacing['2xs'],
  },
  title: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: CLINIC_OS.ink,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
});
