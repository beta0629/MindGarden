/**
 * 어드민 일정 등록 — 상담사·일자별 기존 일정 목록
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { Badge } from '@/components/atoms/Badge';
import { ADMIN_SCHEDULE_REGISTER_COPY } from '@/constants/adminScheduleRegisterCopy';
import type { ConsultantDaySchedule } from '@/utils/adminConsultantDayScheduleNormalize';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminConsultantDayScheduleListProps = {
  readonly schedules: readonly ConsultantDaySchedule[];
  readonly isLoading: boolean;
  readonly isError?: boolean;
  readonly onRetry?: () => void;
};

export function AdminConsultantDayScheduleList({
  schedules,
  isLoading,
  isError = false,
  onRetry,
}: AdminConsultantDayScheduleListProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <Text
        style={{
          marginBottom: theme.spacing.sm,
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.sm,
        }}
      >
        {ADMIN_SCHEDULE_REGISTER_COPY.EXISTING_SCHEDULES_TITLE}
      </Text>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
          <Text
            style={{
              marginTop: theme.spacing.sm,
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_SCHEDULE_REGISTER_COPY.EXISTING_SCHEDULES_LOADING}
          </Text>
        </View>
      ) : null}
      {!isLoading && isError ? (
        <View style={styles.centered}>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              textAlign: 'center',
            }}
          >
            {ADMIN_SCHEDULE_REGISTER_COPY.EXISTING_SCHEDULES_ERROR}
          </Text>
          {onRetry ? (
            <Pressable
              onPress={onRetry}
              style={[styles.retryBtn, { borderColor: theme.colors.primary }]}
            >
              <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
                {ADMIN_SCHEDULE_REGISTER_COPY.EXISTING_SCHEDULES_RETRY}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {!isLoading && !isError && schedules.length === 0 ? (
        <Text
          style={{
            color: theme.colors.textTertiary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_SCHEDULE_REGISTER_COPY.EXISTING_SCHEDULES_EMPTY}
        </Text>
      ) : null}
      {!isLoading && schedules.length > 0
        ? schedules.map((item) => (
            <View
              key={String(item.id)}
              style={[
                styles.row,
                {
                  borderColor: theme.colors.divider,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel={`${item.timeRangeLabel} ${toDisplayString(item.clientName, '내담자')} ${item.statusLabel}`}
            >
              <View style={styles.rowMain}>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                  }}
                >
                  {toDisplayString(item.timeRangeLabel, '—')}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.regular,
                    fontSize: theme.fontSize.sm,
                  }}
                  numberOfLines={1}
                >
                  {toDisplayString(item.clientName, '내담자')}
                </Text>
              </View>
              <Badge label={item.statusLabel} variant={item.statusBadgeVariant} />
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  centered: { alignItems: 'center', paddingVertical: 12 },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowMain: { flex: 1, marginRight: 8 },
});
