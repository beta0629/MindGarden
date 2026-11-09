/**
 * 「내 상담 회기」 — 잔여 N/M · 진행 바 · (내담자만) 미결제 칩.
 * 미결제 칩은 이 블록에서만 렌더한다. 상담사 화면에서는 사용하지 않는다.
 *
 * - `block`   : 홈(폰·세로 태블릿·가로 커버) — 큰 숫자 + 진행 바
 * - `summary` : 일정 챕터 — 「잔여 06 / 10회」 한 줄 요약
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { CLIENT_COVER_COPY, CLIENT_SCHEDULE_CHAPTER_COPY } from '@/constants/clientHomeCopy';
import type { SessionProgressView } from '@/utils/coverChapterViewModel';
import { UnpaidChip } from './CoverMarks';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

export interface SessionProgressBlockProps {
  readonly progress: SessionProgressView;
  readonly unpaidCount: number;
  readonly variant?: 'block' | 'summary';
  readonly detail?: string;
  /** summary 우측 — 예: 「예정 2건」 */
  readonly trailingLabel?: string;
  readonly onPress?: () => void;
}

export function SessionProgressBlock({
  progress,
  unpaidCount,
  variant = 'block',
  detail,
  trailingLabel,
  onPress,
}: SessionProgressBlockProps) {
  const content =
    variant === 'summary' ? (
      <SummaryRow progress={progress} unpaidCount={unpaidCount} trailingLabel={trailingLabel} />
    ) : (
      <BlockBody progress={progress} unpaidCount={unpaidCount} detail={detail} />
    );

  if (!onPress) {
    return content;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={CLIENT_COVER_COPY.PROGRESS_A11Y}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      {content}
    </Pressable>
  );
}

function BlockBody({
  progress,
  unpaidCount,
  detail,
}: Readonly<{ progress: SessionProgressView; unpaidCount: number; detail?: string }>) {
  return (
    <View style={styles.block}>
      <Text style={styles.caption}>{CLIENT_COVER_COPY.PROGRESS_TITLE}</Text>
      <View style={styles.blockRow}>
        {progress.hasBalance ? (
          <View style={styles.numbers}>
            <Text style={styles.remaining}>{progress.remainingLabel}</Text>
            <Text style={styles.unit}>
              {CLIENT_COVER_COPY.progressRemainingUnit(progress.totalLabel)}
            </Text>
            {detail ? (
              <Text style={styles.detail} numberOfLines={1}>
                {detail}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={[styles.detail, styles.numbers]} numberOfLines={1}>
            {CLIENT_COVER_COPY.PROGRESS_EMPTY}
          </Text>
        )}
        {unpaidCount > 0 ? <UnpaidChip label={CLIENT_COVER_COPY.unpaidChip(unpaidCount)} /> : null}
      </View>
      {progress.hasBalance ? (
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: progress.total, now: progress.used }}
        >
          <View style={[styles.fill, { width: `${progress.usedRatio * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

function SummaryRow({
  progress,
  unpaidCount,
  trailingLabel,
}: Readonly<{ progress: SessionProgressView; unpaidCount: number; trailingLabel?: string }>) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryText} numberOfLines={1}>
        {progress.hasBalance
          ? CLIENT_SCHEDULE_CHAPTER_COPY.remainingSummary(
              progress.remainingLabel,
              progress.totalLabel,
            )
          : CLIENT_COVER_COPY.PROGRESS_EMPTY}
      </Text>
      <View style={styles.summaryRight}>
        {unpaidCount > 0 ? <UnpaidChip label={CLIENT_SCHEDULE_CHAPTER_COPY.UNPAID_CHIP} /> : null}
        {trailingLabel ? <Text style={styles.detail}>{trailingLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  block: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  numbers: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  remaining: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['2xl'],
    color: CLINIC_OS.ink,
  },
  unit: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.ink,
  },
  detail: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  track: {
    height: COVER_METRICS.progressTrackHeight,
    backgroundColor: CLINIC_OS.hairline,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: CLINIC_OS.teal,
  },
  summary: {
    minHeight: COVER_METRICS.touchTarget + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: COVER_METRICS.hairline,
    borderBottomColor: CLINIC_OS.hairline,
  },
  summaryText: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: CLINIC_OS.ink,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
