/**
 * 어드민 일정 등록 — 선택된 시작·종료 시간 요약 카드
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { ADMIN_SCHEDULE_REGISTER_COPY } from '@/constants/adminScheduleRegisterCopy';
import { formatConsultantDayScheduleTimeRange } from '@/utils/adminConsultantDayScheduleNormalize';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminScheduleSelectionSummaryProps = {
  readonly startTime: string | null;
  readonly endTime: string | null;
};

export function AdminScheduleSelectionSummary({
  startTime,
  endTime,
}: AdminScheduleSelectionSummaryProps) {
  const theme = useTheme();

  if (!startTime || !endTime) {
    return (
      <View
        style={[
          styles.card,
          {
            marginTop: theme.spacing.md,
            borderColor: theme.colors.divider,
            backgroundColor: theme.colors.surfaceAlt,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_SCHEDULE_REGISTER_COPY.SELECTED_TIME_HINT}
        </Text>
      </View>
    );
  }

  const rangeLabel = formatConsultantDayScheduleTimeRange(startTime, endTime);

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: theme.spacing.md,
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.surface,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${ADMIN_SCHEDULE_REGISTER_COPY.SELECTED_TIME_TITLE} ${rangeLabel}`}
    >
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.xs,
        }}
      >
        {ADMIN_SCHEDULE_REGISTER_COPY.SELECTED_TIME_TITLE}
      </Text>
      <Text
        style={{
          marginTop: theme.spacing.xs,
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.lg,
        }}
      >
        {toDisplayString(rangeLabel, '—')}
      </Text>
      <Text
        style={{
          marginTop: 4,
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
        }}
      >
        {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_START_TIME}: {toDisplayString(startTime, '—')} ·{' '}
        {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_END_TIME}: {toDisplayString(endTime, '—')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
