/**
 * 커버+챕터 v4 소형 표식(atom) — 기관연계 배지 · 미결제 칩 · 읽지 않음 점 · 경고 느낌표.
 * 이모지 대신 텍스트·기하 도형만 사용한다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, fontFamily, fontSize, spacing } from '@/theme';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

/** 「기관연계」 리터럴 배지 — 라벨이 null 이면 그리지 않는다. */
export function InstitutionBadge({ label }: Readonly<{ label: string | null }>) {
  if (!label) {
    return null;
  }
  return (
    <View style={styles.institution} accessibilityLabel={label}>
      <Text style={styles.institutionText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** 내담자 미결제 칩 — 「내 상담 회기」 블록에서만 사용한다. */
export function UnpaidChip({ label }: Readonly<{ label: string }>) {
  return (
    <View style={styles.unpaid} accessibilityLabel={label}>
      <Text style={styles.unpaidText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function UnreadDot({ unread }: Readonly<{ unread: boolean }>) {
  return (
    <View
      style={[styles.dot, { backgroundColor: unread ? CLINIC_OS.teal : CLINIC_OS.muted }]}
      accessibilityLabel={unread ? COVER_CHAPTER_COPY.NOTIF_UNREAD_A11Y : undefined}
    />
  );
}

/** 기하 느낌표(막대+점) — 상담사 일지 미작성 경고 행 전용 */
export function WarnBangMark() {
  return (
    <View style={styles.bang} importantForAccessibility="no-hide-descendants">
      <View style={styles.bangBar} />
      <View style={styles.bangDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  institution: {
    borderWidth: COVER_METRICS.hairline,
    borderColor: CLINIC_OS.teal,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs + spacing['2xs'],
    paddingVertical: spacing['2xs'],
    alignSelf: 'center',
    flexShrink: 0,
  },
  institutionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: CLINIC_OS.teal,
  },
  unpaid: {
    backgroundColor: CLINIC_OS.clientAmberSoft,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexShrink: 0,
  },
  unpaidText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: CLINIC_OS.clientAmber,
  },
  dot: {
    width: COVER_METRICS.unreadDotSize,
    height: COVER_METRICS.unreadDotSize,
    borderRadius: COVER_METRICS.unreadDotSize / 2,
  },
  bang: {
    width: COVER_METRICS.unreadDotSize,
    alignItems: 'center',
    gap: spacing['2xs'],
  },
  bangBar: {
    width: COVER_METRICS.bangBarWidth,
    height: COVER_METRICS.bangBarHeight,
    borderRadius: COVER_METRICS.bangBarWidth / 2,
    backgroundColor: CLINIC_OS.counselorWarnBang,
  },
  bangDot: {
    width: COVER_METRICS.bangDotSize,
    height: COVER_METRICS.bangDotSize,
    borderRadius: COVER_METRICS.bangDotSize / 2,
    backgroundColor: CLINIC_OS.counselorWarnBang,
  },
});
