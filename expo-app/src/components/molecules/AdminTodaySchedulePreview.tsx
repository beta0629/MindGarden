/**
 * 어드민·스태프 홈 — 오늘 일정 미리보기 (1~3건, read-only)
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '@/theme';
import type { Schedule } from '@/api/hooks/useSchedules';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import { ADMIN_HOME_ROUTES, ADMIN_MOBILE_HOME_COPY } from '@/constants/adminHomeCopy';
import {
  formatAdminScheduleParticipantLabel,
  formatAdminScheduleTimeRange,
  formatAdminTodayScheduleSectionTitle,
} from '@/utils/adminHomeKpi';
import { toDisplayString } from '@/utils/safeDisplay';

interface AdminTodaySchedulePreviewProps {
  readonly schedules: Schedule[];
  readonly totalCount: number;
  readonly isLoading: boolean;
}

export function AdminTodaySchedulePreview({
  schedules,
  totalCount,
  isLoading,
}: AdminTodaySchedulePreviewProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text
          style={{
            flex: 1,
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          {formatAdminTodayScheduleSectionTitle(totalCount)}
        </Text>
        <Pressable
          onPress={() => router.push(ADMIN_HOME_ROUTES.SCHEDULE)}
          accessibilityRole="button"
          accessibilityLabel={ADMIN_MOBILE_HOME_COPY.VIEW_ALL}
          hitSlop={8}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            }}
          >
            {ADMIN_MOBILE_HOME_COPY.VIEW_ALL}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={<Calendar size={32} color={theme.colors.textTertiary} />}
          title={ADMIN_MOBILE_HOME_COPY.EMPTY_TODAY_SCHEDULE}
        />
      ) : (
        schedules.map((item, index) => {
          const sessionTypeDisplay = toDisplayString(item.consultationType, '');
          return (
            <ScheduleCard
              key={item.id}
              time={formatAdminScheduleTimeRange(item.startTime, item.endTime)}
              clientName={formatAdminScheduleParticipantLabel(item.clientName, item.consultantName)}
              sessionType={sessionTypeDisplay !== '' ? sessionTypeDisplay : undefined}
              status={item.status}
              index={index}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
