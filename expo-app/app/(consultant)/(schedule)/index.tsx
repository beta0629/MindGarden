/**
 * 상담사 스케줄 캘린더
 * 주간/일간 뷰 토글, 날짜 선택, 상담 카드 리스트
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_SCREEN_WIREFRAMES.md §1
 */
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FlashList } from '@shopify/flash-list';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConsultantSchedules } from '@/api/hooks/useSchedules';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import {
  getConsultantScheduleCardFooterHint,
  getConsultantScheduleCardVisualTone,
  getConsultantScheduleListRowActions,
} from '@/utils/consultantScheduleCardUi';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

type ViewMode = 'daily' | 'weekly';

function getWeekDays(baseDate: Date): Date[] {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function ConsultantSchedule() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const schedulesQuery = useConsultantSchedules({
    consultantId: user?.id ?? '',
    date: dateStr,
    view: viewMode,
  });

  const schedules = schedulesQuery.data ?? [];
  const isLoading = schedulesQuery.isLoading;
  const isRefreshing = schedulesQuery.isFetching && !isLoading;

  const onRefresh = useCallback(() => {
    schedulesQuery.refetch();
  }, [schedulesQuery]);

  const handleDateSelect = (date: Date) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.xl,
          }}
          accessibilityRole="header"
        >
          스케줄
        </Text>

        {/* 뷰 토글 */}
        <View style={[styles.toggleRow, { marginTop: theme.spacing.md }]}>
          <Chip label="일간" selected={viewMode === 'daily'} onPress={() => setViewMode('daily')} />
          <View style={{ width: theme.spacing.sm }} />
          <Chip
            label="주간"
            selected={viewMode === 'weekly'}
            onPress={() => setViewMode('weekly')}
          />
        </View>

        {/* 날짜 선택 — 주간 스와이프 */}
        <FlatList
          horizontal
          data={weekDays}
          keyExtractor={(item) => item.toISOString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.weekList, { marginTop: theme.spacing.md }]}
          renderItem={({ item }) => {
            const isSelected = isSameDay(item, selectedDate);
            const isToday = isSameDay(item, new Date());
            return (
              <Pressable
                onPress={() => handleDateSelect(item)}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    borderRadius: theme.borderRadius.lg,
                    paddingVertical: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.md,
                    marginRight: theme.spacing.xs,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={format(item, 'M월 d일 EEEE', { locale: ko })}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={{
                    color: isSelected ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.xs,
                    textAlign: 'center',
                  }}
                >
                  {format(item, 'EEE', { locale: ko })}
                </Text>
                <Text
                  style={{
                    color: isSelected
                      ? theme.colors.textOnPrimary
                      : isToday
                        ? theme.colors.primary
                        : theme.colors.textMain,
                    fontFamily: isToday ? theme.fontFamily.bold : theme.fontFamily.semibold,
                    fontSize: theme.fontSize.lg,
                    textAlign: 'center',
                    marginTop: theme.spacing['2xs'],
                  }}
                >
                  {format(item, 'd')}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* 상담 카드 리스트 */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          {format(selectedDate, 'M월 d일 (EEEE)', { locale: ko })} ·{' '}
          {isLoading ? '...' : `${schedules.length}건`}
        </Text>

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon size={32} color={theme.colors.textTertiary} />}
            title="예정된 상담이 없습니다"
            description="선택한 날짜에 상담 일정이 없습니다."
          />
        ) : (
          <View style={styles.flashWrapper}>
            <FlashList
              data={schedules}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item, index }) => {
                const nav = () => router.push(`/(consultant)/(schedule)/${item.id}`);
                const row = getConsultantScheduleListRowActions(item, nav);
                const hint = getConsultantScheduleCardFooterHint(item);
                const tone = getConsultantScheduleCardVisualTone(item);
                return (
                  <ScheduleCard
                    time={`${item.startTime} - ${item.endTime}`}
                    clientName={`${item.clientName} 님`}
                    sessionType={item.consultationType}
                    status={item.status}
                    index={index}
                    containerOpacity={tone.containerOpacity}
                    footerHint={hint.text}
                    onPress={nav}
                    actionLabel={row.primaryActionLabel}
                    onActionPress={row.onPrimaryAction}
                  />
                );
              }}
            />
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {},
  toggleRow: {
    flexDirection: 'row',
  },
  weekList: {
    paddingVertical: 4,
  },
  dayCell: {
    alignItems: 'center',
    minWidth: 44,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  flashWrapper: {
    minHeight: 100,
  },
});
