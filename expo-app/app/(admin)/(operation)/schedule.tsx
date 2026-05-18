/**
 * 어드민·스태프 스케줄 라이트 — 오늘 테넌트 일정
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import { useAdminTodaySchedules } from '@/api/hooks/useAdminSchedules';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStaffRole } from '@/utils/adminRole';
import {
  ADMIN_API_QUERY_NOT_READY_COPY,
  ADMIN_MOBILE_OPERATION_COPY,
} from '@/constants/adminMobileScreensCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';

const TODAY_LABEL = format(new Date(), 'M월 d일 (EEEE)', { locale: ko });

export default function AdminScheduleLiteScreen() {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const query = useAdminTodaySchedules();
  const schedules = query.data ?? [];
  const isLoading = isAdminListQueryLoading(query.isLoading, query.data);
  const isRefreshing = query.isFetching && !isLoading && query.ready;

  const handleSessionRetry = useCallback(() => {
    retryAdminApiSession();
    void query.refetch();
  }, [query]);

  const onRefresh = useCallback(() => {
    void query.refetch();
  }, [query]);

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
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.md,
          }}
        >
          {TODAY_LABEL}
        </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
  },
  list: {
    marginTop: 16,
    minHeight: 120,
  },
});
