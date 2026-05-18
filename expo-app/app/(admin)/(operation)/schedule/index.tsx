/**
 * 어드민·스태프 스케줄 라이트 — 선택일 테넌트 일정 + 등록 FAB
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter, type Href } from 'expo-router';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import { useAdminSchedulesByDate } from '@/api/hooks/useAdminSchedules';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStaffRole } from '@/utils/adminRole';
import {
  ADMIN_API_QUERY_NOT_READY_COPY,
  ADMIN_MOBILE_OPERATION_COPY,
} from '@/constants/adminMobileScreensCopy';
import { ADMIN_SCHEDULE_REGISTER_COPY } from '@/constants/adminScheduleRegisterCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';

function formatDateLabel(ymd: string): string {
  try {
    const d = parseISO(ymd);
    return format(d, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
  } catch {
    return ymd;
  }
}

export default function AdminScheduleLiteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [dateYmd, setDateYmd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const query = useAdminSchedulesByDate(dateYmd);
  const schedules = query.data ?? [];
  const isLoading = isAdminListQueryLoading(query.isLoading, query.data, {
    isError: query.isError,
  });
  const isRefreshing = query.isFetching && !isLoading && query.ready;

  const dateLabel = useMemo(() => formatDateLabel(dateYmd), [dateYmd]);

  const handleSessionRetry = useCallback(() => {
    void retryAdminApiSession().then(() => query.refetch());
  }, [query]);

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  const shiftDate = useCallback((delta: number) => {
    try {
      const next = format(addDays(parseISO(dateYmd), delta), 'yyyy-MM-dd');
      setDateYmd(next);
    } catch {
      /* keep */
    }
  }, [dateYmd]);

  const openCreate = useCallback(() => {
    router.push({
      pathname: '/(admin)/(operation)/schedule/create',
      params: { dateYmd },
    } as Href);
  }, [dateYmd, router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_LITE} canGoBack />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={[styles.dateRow, { marginTop: theme.spacing.md }]}>
          <Pressable
            onPress={() => shiftDate(-1)}
            accessibilityRole="button"
            accessibilityLabel="이전 날짜"
            style={({ pressed }) => [styles.dateNavBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ChevronLeft size={22} color={theme.colors.textSecondary} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
          >
            {dateLabel}
          </Text>
          <Pressable
            onPress={() => shiftDate(1)}
            accessibilityRole="button"
            accessibilityLabel="다음 날짜"
            style={({ pressed }) => [styles.dateNavBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ChevronRight size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        {isStaffRole(role) ? (
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing.xs,
            }}
          >
            {ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_STAFF_HINT}
          </Text>
        ) : null}

        {!query.ready ? (
          <EmptyState
            icon={<Calendar size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
            description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
            actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
            onAction={handleSessionRetry}
          />
        ) : isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : query.isError ? (
          <EmptyState
            icon={<Calendar size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_ERROR}
          />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={<Calendar size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_MOBILE_OPERATION_COPY.SCHEDULE_EMPTY}
          />
        ) : (
          <View style={styles.list}>
            <FlashList
              data={schedules}
              scrollEnabled={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => (
                <ScheduleCard
                  time={`${item.startTime} - ${item.endTime}`}
                  clientName={`${toDisplayString(item.clientName, '내담자')} · ${toDisplayString(item.consultantName, '상담사')}`}
                  sessionType={item.consultationType}
                  status={item.status}
                  index={index}
                />
              )}
            />
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={openCreate}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
            ...theme.shadows.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={ADMIN_SCHEDULE_REGISTER_COPY.FAB_LABEL}
      >
        <Plus size={28} color={theme.colors.textOnPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 96,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateNavBtn: {
    padding: 8,
  },
  list: {
    marginTop: 16,
    minHeight: 120,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
