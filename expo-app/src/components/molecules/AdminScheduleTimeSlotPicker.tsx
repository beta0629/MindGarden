/**
 * 어드민 일정 등록 — 가용 시간 슬롯 그리드 (웹 TimeSlotGrid parity)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { TimeSlotChip } from '@/components/molecules/TimeSlotChip';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  occupiedRangesFromConsultantSchedules,
  useConsultantSchedulesByDate,
} from '@/api/hooks/useConsultantSchedulesByDate';
import { ADMIN_SCHEDULE_REGISTER_COPY } from '@/constants/adminScheduleRegisterCopy';
import { computeEndTimeFromDuration } from '@/utils/adminScheduleCreateBody';
import {
  buildAdminScheduleSlotAvailabilities,
  validateAdminScheduleTimeSelection,
} from '@/utils/scheduleTimeSlotConflict';
import { toDisplayString } from '@/utils/safeDisplay';

export type AdminScheduleTimeSlotPickerProps = {
  readonly consultantId: number | null;
  readonly dateYmd: string;
  readonly durationMinutes: number;
  readonly selectedStartTime: string | null;
  readonly onSelectStartTime: (startTime: string, endTime: string) => void;
};

export function AdminScheduleTimeSlotPicker({
  consultantId,
  dateYmd,
  durationMinutes,
  selectedStartTime,
  onSelectStartTime,
}: AdminScheduleTimeSlotPickerProps) {
  const theme = useTheme();
  const schedulesQuery = useConsultantSchedulesByDate(consultantId, dateYmd);

  const occupiedRanges = useMemo(
    () => occupiedRangesFromConsultantSchedules(schedulesQuery.data ?? []),
    [schedulesQuery.data],
  );

  const slotAvailabilities = useMemo(
    () => buildAdminScheduleSlotAvailabilities(dateYmd, durationMinutes, occupiedRanges),
    [dateYmd, durationMinutes, occupiedRanges],
  );

  const computedEndTime = useMemo(() => {
    if (!selectedStartTime) {
      return null;
    }
    return computeEndTimeFromDuration(selectedStartTime, durationMinutes);
  }, [durationMinutes, selectedStartTime]);

  const availableCount = slotAvailabilities.filter((s) => s.isAvailable).length;

  const handleSelect = (startTime: string) => {
    const endTime = computeEndTimeFromDuration(startTime, durationMinutes);
    if (!endTime) {
      return;
    }
    const check = validateAdminScheduleTimeSelection(dateYmd, startTime, endTime, occupiedRanges);
    if (!check.ok) {
      return;
    }
    onSelectStartTime(startTime, endTime);
  };

  if (consultantId == null || consultantId <= 0) {
    return (
      <EmptyState
        title={ADMIN_SCHEDULE_REGISTER_COPY.VALIDATION_PICK_CONSULTANT}
        description=""
      />
    );
  }

  if (schedulesQuery.isLoading) {
    return (
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
          {ADMIN_SCHEDULE_REGISTER_COPY.SLOTS_LOADING}
        </Text>
      </View>
    );
  }

  if (schedulesQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            textAlign: 'center',
          }}
        >
          {ADMIN_SCHEDULE_REGISTER_COPY.SLOTS_ERROR}
        </Text>
        <Pressable
          onPress={() => void schedulesQuery.refetch()}
          style={[styles.retryBtn, { borderColor: theme.colors.primary }]}
        >
          <Text style={{ color: theme.colors.primary, fontFamily: theme.fontFamily.medium }}>
            {ADMIN_SCHEDULE_REGISTER_COPY.SLOTS_RETRY}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (availableCount === 0) {
    return (
      <EmptyState
        title={ADMIN_SCHEDULE_REGISTER_COPY.SLOTS_EMPTY}
        description={ADMIN_SCHEDULE_REGISTER_COPY.SLOT_BOOKED}
      />
    );
  }

  return (
    <View>
      <View style={styles.legendRow}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
          }}
        >
          {ADMIN_SCHEDULE_REGISTER_COPY.SLOT_AVAILABLE} · {ADMIN_SCHEDULE_REGISTER_COPY.SLOT_BOOKED}
          {' · '}
          {ADMIN_SCHEDULE_REGISTER_COPY.SLOT_PAST}
        </Text>
      </View>
      <View style={styles.slotGrid}>
        {slotAvailabilities.map((slot) => (
          <View key={slot.startTime} style={styles.slotCell}>
            <TimeSlotChip
              time={slot.startTime}
              isAvailable={slot.isAvailable}
              isSelected={selectedStartTime === slot.startTime}
              onPress={() => handleSelect(slot.startTime)}
            />
          </View>
        ))}
      </View>
      {selectedStartTime && computedEndTime ? (
        <Text
          style={{
            marginTop: theme.spacing.md,
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
          }}
        >
          {ADMIN_SCHEDULE_REGISTER_COPY.LABEL_SELECTED_END}:{' '}
          {toDisplayString(computedEndTime, '—')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', paddingVertical: 24 },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  legendRow: { marginBottom: 8 },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCell: {
    width: '30%',
    minWidth: 96,
  },
});
