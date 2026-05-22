/**
 * 상담일지 목록 — 미작성 일지만 표시 (작성 완료 일지는 웹에서 확인)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePendingRecords } from '@/api/hooks/useRecords';
import { RecordCard } from '@/components/molecules/RecordCard';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { CONSULTANT_RECORDS_COPY } from '@/constants/consultantRecordsCopy';

export default function ConsultantRecords() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const pendingQuery = usePendingRecords(user?.id);
  const pending = pendingQuery.data ?? [];

  const isLoading = pendingQuery.isLoading;
  const isRefreshing = pendingQuery.isFetching && !pendingQuery.isLoading;

  const onRefresh = useCallback(() => {
    pendingQuery.refetch();
  }, [pendingQuery]);

  const pendingLabel =
    pending.length > 0
      ? `${CONSULTANT_RECORDS_COPY.PENDING_SECTION_LABEL} (${pending.length})`
      : CONSULTANT_RECORDS_COPY.PENDING_SECTION_LABEL;

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

        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
            marginBottom: theme.spacing.md,
          }}
        >
          {pendingLabel}
        </Text>
      </View>

      {isLoading ? (
        <View style={[styles.loadingContainer, { paddingHorizontal: theme.spacing.lg }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={theme.colors.textTertiary} />}
          title={CONSULTANT_RECORDS_COPY.EMPTY_PENDING_TITLE}
          description={CONSULTANT_RECORDS_COPY.EMPTY_PENDING_DESCRIPTION}
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
              date={item.date}
              time={`${item.startTime} - ${item.endTime}`}
              isPending
              index={index}
              onPress={() => router.push(`/(consultant)/(records)/create/${item.scheduleId}`)}
            />
          )}
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
