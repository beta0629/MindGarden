/**
 * 「알림」 섹션 — 흰 시트 · hairline 행 · 읽지 않음 점 · 시각 · 얇은 셰브론.
 * `warn` 변형(상담사 일지 미작성)만 rose 배경 + 기하 느낌표를 쓴다. 배너 스킨과 섞지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { COVER_CHAPTER_COPY } from '@/constants/coverChapterCopy';
import type { CoverNotificationRow } from '@/utils/coverChapterViewModel';
import { CoverSectionHeader } from './CoverSectionHeader';
import { UnreadDot, WarnBangMark } from './CoverMarks';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

const CHEVRON_SIZE = 14;

export interface NotificationRowsProps {
  readonly rows: readonly CoverNotificationRow[];
  readonly unreadCount: number;
  readonly onPressRow: (row: CoverNotificationRow) => void;
  readonly onPressAll: () => void;
  /** 화면 좌우 여백 — 행 배경을 가장자리까지 채우고 내용은 여백 안쪽에 둔다 */
  readonly gutter: number;
}

export function NotificationRows({
  rows,
  unreadCount,
  onPressRow,
  onPressAll,
  gutter,
}: NotificationRowsProps) {
  const rightLabel =
    unreadCount > 0 ? COVER_CHAPTER_COPY.notifCount(unreadCount) : COVER_CHAPTER_COPY.NOTIF_VIEW_ALL;

  return (
    <View>
      <CoverSectionHeader
        title={COVER_CHAPTER_COPY.NOTIF_TITLE}
        size="compact"
        rightLabel={rightLabel}
        onPressRight={onPressAll}
        rightAccessibilityLabel={COVER_CHAPTER_COPY.NOTIF_VIEW_ALL}
      />
      <View style={[styles.sheet, { marginHorizontal: -gutter }]}>
        {rows.length === 0 ? (
          <Pressable
            onPress={onPressAll}
            accessibilityRole="button"
            accessibilityLabel={COVER_CHAPTER_COPY.NOTIF_EMPTY}
            style={[styles.row, { paddingHorizontal: gutter }]}
          >
            <Text style={styles.emptyText}>{COVER_CHAPTER_COPY.NOTIF_EMPTY}</Text>
            <ChevronRight size={CHEVRON_SIZE} color={CLINIC_OS.muted} />
          </Pressable>
        ) : (
          rows.map((row) => (
            <Pressable
              key={row.key}
              onPress={() => onPressRow(row)}
              accessibilityRole="button"
              accessibilityLabel={[row.title, row.timeLabel].filter(Boolean).join(', ')}
              style={({ pressed }) => [
                styles.row,
                { paddingHorizontal: gutter },
                row.variant === 'warn' ? styles.warnRow : null,
                pressed ? styles.pressed : null,
              ]}
            >
              {row.variant === 'warn' ? <WarnBangMark /> : <UnreadDot unread={row.unread} />}
              <Text
                style={[styles.title, row.variant === 'warn' ? styles.warnTitle : null]}
                numberOfLines={1}
              >
                {row.title}
              </Text>
              {row.timeLabel ? <Text style={styles.time}>{row.timeLabel}</Text> : null}
              <ChevronRight size={CHEVRON_SIZE} color={CLINIC_OS.ink} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: CLINIC_OS.sheet,
    borderTopWidth: COVER_METRICS.hairline,
    borderTopColor: CLINIC_OS.hairline,
  },
  row: {
    minHeight: COVER_METRICS.notificationRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: COVER_METRICS.hairline,
    borderBottomColor: CLINIC_OS.hairline,
  },
  warnRow: {
    backgroundColor: CLINIC_OS.counselorWarnBg,
  },
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.ink,
  },
  warnTitle: {
    fontFamily: fontFamily.medium,
  },
  time: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  emptyText: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
  },
});
