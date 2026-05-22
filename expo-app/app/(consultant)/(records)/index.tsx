/**
 * 상담일지 목록 — 미작성·작성 완료 일지 표시 (완료 일지는 읽기 전용 조회)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  useConsultationRecords,
  usePendingRecords,
  type ConsultationRecord,
  type PendingRecord,
} from '@/api/hooks/useRecords';
import { RecordCard } from '@/components/molecules/RecordCard';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { CONSULTANT_RECORDS_COPY } from '@/constants/consultantRecordsCopy';

type RecordsListItem =
  | { kind: 'section'; key: string; label: string }
  | { kind: 'pending'; key: string; data: PendingRecord }
  | { kind: 'completed'; key: string; data: ConsultationRecord };

export default function ConsultantRecords() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const pendingQuery = usePendingRecords(user?.id);
  const completedQuery = useConsultationRecords({
    consultantId: user?.id ?? 0,
    status: 'COMPLETED',
  });

  const pending = pendingQuery.data ?? [];
  const completed = useMemo(
    () => completedQuery.data?.pages.flatMap((page) => page.content) ?? [],
    [completedQuery.data?.pages],
  );

  const isLoading = pendingQuery.isLoading || completedQuery.isLoading;
  const isRefreshing =
    (pendingQuery.isFetching && !pendingQuery.isLoading) ||
    (completedQuery.isFetching && !completedQuery.isLoading);

  const onRefresh = useCallback(() => {
    pendingQuery.refetch();
    completedQuery.refetch();
  }, [pendingQuery, completedQuery]);

  const pendingLabel =
    pending.length > 0
      ? `${CONSULTANT_RECORDS_COPY.PENDING_SECTION_LABEL} (${pending.length})`
      : CONSULTANT_RECORDS_COPY.PENDING_SECTION_LABEL;

  const completedLabel =
    completed.length > 0
      ? `${CONSULTANT_RECORDS_COPY.COMPLETED_SECTION_LABEL} (${completed.length})`
      : CONSULTANT_RECORDS_COPY.COMPLETED_SECTION_LABEL;

  const listData = useMemo(() => {
    const items: RecordsListItem[] = [];
    if (pending.length > 0) {
      items.push({ kind: 'section', key: 'pending-header', label: pendingLabel });
      pending.forEach((item) => {
        items.push({ kind: 'pending', key: `pending-${item.scheduleId}`, data: item });
      });
    }
    if (completed.length > 0) {
      items.push({ kind: 'section', key: 'completed-header', label: completedLabel });
      completed.forEach((item) => {
        items.push({ kind: 'completed', key: `completed-${item.id}`, data: item });
      });
    }
    return items;
  }, [pending, completed, pendingLabel, completedLabel]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.bgMain }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.xl,
            marginBottom: theme.spacing.md,
          }}
          accessibilityRole="header"
        >
          {CONSULTANT_RECORDS_COPY.PAGE_TITLE}
        </Text>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { paddingHorizontal: theme.spacing.lg }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : listData.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={theme.colors.textTertiary} />}
          title={CONSULTANT_RECORDS_COPY.EMPTY_LIST_TITLE}
          description={CONSULTANT_RECORDS_COPY.EMPTY_LIST_DESCRIPTION}
        />
      ) : (
        <FlashList
          data={listData}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item, index }) => {
            if (item.kind === 'section') {
              return (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.fontFamily.medium,
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.md,
                    marginTop: item.key === 'completed-header' ? theme.spacing.lg : 0,
                  }}
                >
                  {item.label}
                </Text>
              );
            }
            if (item.kind === 'pending') {
              const row = item.data;
              return (
                <RecordCard
                  clientName={`${row.clientName} 님`}
                  date={row.date}
                  time={`${row.startTime} - ${row.endTime}`}
                  isPending
                  index={index}
                  onPress={() => router.push(`/(consultant)/(records)/create/${row.scheduleId}`)}
                />
              );
            }
            const row = item.data;
            return (
              <RecordCard
                clientName={`${row.clientName} 님`}
                date={row.date}
                time={`${row.startTime} - ${row.endTime}`}
                summary={row.summary}
                index={index}
                onPress={() => router.push(`/(consultant)/(records)/${row.id}`)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {},
  loadingContainer: {
    paddingTop: 12,
  },
});
