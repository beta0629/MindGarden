/**
 * 일정 목록 섹션(예정·지난·이후 일정·진행 중) — 날짜 열 · 제목/보조 · 기관연계 배지 · 이니셜/셰브론.
 * 빈 목록은 사실 그대로의 한 줄 + (선택) 비예약 보조 행동.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { borderRadius, fontFamily, fontSize, spacing } from '@/theme';
import { CoverSectionHeader } from './CoverSectionHeader';
import { InstitutionBadge } from './CoverMarks';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

const CHEVRON_SIZE = 16;

export type ScheduleListTrailing =
  { readonly kind: 'chevron' } | { readonly kind: 'initial'; readonly initial: string };

export interface ScheduleListRowProps {
  readonly leadPrimary: string;
  readonly leadSecondary?: string;
  readonly leadMuted?: boolean;
  readonly title: string;
  readonly detail?: string;
  readonly badgeLabel?: string | null;
  readonly trailing?: ScheduleListTrailing;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
}

export function ScheduleListRow({
  leadPrimary,
  leadSecondary,
  leadMuted = false,
  title,
  detail,
  badgeLabel = null,
  trailing = { kind: 'chevron' },
  onPress,
  accessibilityLabel,
}: ScheduleListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ??
        [leadPrimary, leadSecondary, title, detail, badgeLabel].filter(Boolean).join(', ')
      }
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.lead}>
        <Text style={[styles.leadPrimary, leadMuted ? styles.muted : null]} numberOfLines={1}>
          {leadPrimary}
        </Text>
        {leadSecondary ? (
          <Text style={styles.leadSecondary} numberOfLines={1}>
            {leadSecondary}
          </Text>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <InstitutionBadge label={badgeLabel} />
        </View>
        {detail ? (
          <Text style={styles.detail} numberOfLines={1} ellipsizeMode="tail">
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing.kind === 'initial' && trailing.initial ? (
        <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
          <Text style={styles.avatarText}>{trailing.initial}</Text>
        </View>
      ) : (
        <ChevronRight size={CHEVRON_SIZE} color={CLINIC_OS.ink} />
      )}
    </Pressable>
  );
}

export interface ScheduleListSectionProps {
  readonly title: string;
  readonly rightLabel?: string | null;
  readonly onPressRight?: () => void;
  readonly emptyLabel: string;
  readonly emptyActionLabel?: string;
  readonly onEmptyAction?: () => void;
  readonly isEmpty: boolean;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
}

export function ScheduleListSection({
  title,
  rightLabel,
  onPressRight,
  emptyLabel,
  emptyActionLabel,
  onEmptyAction,
  isEmpty,
  children,
  footer,
}: ScheduleListSectionProps) {
  return (
    <View style={styles.section}>
      <CoverSectionHeader title={title} rightLabel={rightLabel} onPressRight={onPressRight} />
      {isEmpty ? (
        <CoverInlineEmpty
          label={emptyLabel}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      ) : (
        children
      )}
      {footer}
    </View>
  );
}

export interface CoverInlineEmptyProps {
  readonly label: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function CoverInlineEmpty({ label, actionLabel, onAction }: CoverInlineEmptyProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{label}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.emptyAction}
        >
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  row: {
    minHeight: COVER_METRICS.listRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  lead: {
    width: COVER_METRICS.listDateColumnWidth,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  leadPrimary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: CLINIC_OS.ink,
  },
  muted: {
    color: CLINIC_OS.muted,
  },
  leadSecondary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing['2xs'],
    borderBottomWidth: COVER_METRICS.hairline,
    borderBottomColor: CLINIC_OS.hairline,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    color: CLINIC_OS.ink,
  },
  detail: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: CLINIC_OS.muted,
  },
  avatar: {
    width: COVER_METRICS.avatarSize,
    height: COVER_METRICS.avatarSize,
    borderRadius: borderRadius.full,
    backgroundColor: CLINIC_OS.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: CLINIC_OS.ink,
  },
  empty: {
    minHeight: COVER_METRICS.listRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: COVER_METRICS.hairline,
    borderBottomColor: CLINIC_OS.hairline,
  },
  emptyText: {
    flexShrink: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
  },
  emptyAction: {
    minHeight: COVER_METRICS.touchTarget,
    minWidth: COVER_METRICS.touchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  emptyActionText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: CLINIC_OS.teal,
  },
});
