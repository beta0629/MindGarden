/**
 * 상담일지 목록
 * 미작성 / 전체 탭, RecordCard 리스트 (무한 스크롤)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
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
} from '@/api/hooks/useRecords';
import { RecordCard } from '@/components/molecules/RecordCard';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

type Tab = 'pending' | 'all';

export default function ConsultantRecords() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('pending');

  const pendingQuery = usePendingRecords(user?.id);
  const recordsQuery = useConsultationRecords({
    consultantId: user?.id ?? '',
    status: 'ALL',
  });

  const pending = pendingQuery.data ?? [];
  const records = useMemo(
    () => recordsQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [recordsQuery.data],
  );

  const isLoading = tab === 'pending' ? pendingQuery.isLoading : recordsQuery.isLoading;
  const isRefreshing = tab === 'pending'
    ? pendingQuery.isFetching && !pendingQuery.isLoading
    : recordsQuery.isFetching && !recordsQuery.isLoading;

  const onRefresh = useCallback(() => {
    if (tab === 'pending') {
      pendingQuery.refetch();
    } else {
      recordsQuery.refetch();
    }
  }, [tab, pendingQuery, recordsQuery]);

  const onEndReached = () => {
    if (
      tab === 'all' &&
      recordsQuery.hasNextPage &&
      !recordsQuery.isFetchingNextPage
    ) {
      recordsQuery.fetchNextPage();
    }
  };

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
          상담일지
        </Text>

        <View style={styles.tabRow}>
          <Chip
            label={`미작성${pending.length > 0 ? ` (${pending.length})` : ''}`}
            selected={tab === 'pending'}
            onPress={() => setTab('pending')}
          />
          <View style={{ width: theme.spacing.sm }} />
          <Chip
            label="전체"
            selected={tab === 'all'}
            onPress={() => setTab('all')}
          />
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { paddingHorizontal: theme.spacing.lg }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title="미작성 일지가 없습니다"
            description="모든 상담일지를 작성하셨습니다."
          />
        ) : (
          <FlashList
            data={pending}
            keyExtractor={(item) => String(item.scheduleId)}
            contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            renderItem={({ item, index }) => (
              <RecordCard
                clientName={`${item.clientName} 님`}
                date={item.scheduledDate}
                time={`${item.startTime} - ${item.endTime}`}
                isPending
                index={index}
                onPress={() =>
                  router.push(
                    `/(consultant)/(records)/create/${item.scheduleId}`,
                  )
                }
              />
            )}
          />
        )
      ) : records.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={theme.colors.textTertiary} />}
          title="작성된 일지가 없습니다"
          description="상담 완료 후 일지를 작성해주세요."
        />
      ) : (
        <FlashList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <RecordCard
              clientName={`${item.clientName} 님`}
              date={item.scheduledDate}
              time={`${item.startTime} - ${item.endTime}`}
              summary={item.summary}
              tags={item.tags}
              isPending={item.status === 'DRAFT'}
              index={index}
              onPress={() =>
                item.status === 'DRAFT'
                  ? router.push(
                      `/(consultant)/(records)/create/${item.scheduleId}`,
                    )
                  : router.push(`/(consultant)/(records)/${item.id}`)
              }
            />
          )}
          ListFooterComponent={
            recordsQuery.isFetchingNextPage ? <SkeletonCard /> : null
          }
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingTop: 12,
  },
});
