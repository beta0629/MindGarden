/**
 * 내 상담 목록
 * 상단 탭: 예정 / 완료 (SegmentedControl)
 * FlashList + 무한 스크롤 + Pull-to-refresh
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Calendar, ClipboardCheck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { ConsultationCard } from '@/components/molecules/ConsultationCard';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { useAuthStore } from '@/stores/useAuthStore';
import { matchesClientSessionsTab, useClientConsultations } from '@/api/hooks/useConsultations';
import type { Schedule } from '@/api/hooks/useSchedules';

type TabKey = 'SCHEDULED' | 'COMPLETED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'SCHEDULED', label: '예정' },
  { key: 'COMPLETED', label: '완료' },
];

export default function ClientSessions() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('SCHEDULED');

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useClientConsultations({
      clientId: user?.id ?? '',
      status: activeTab,
    });

  const consultations = useMemo(() => {
    const rows = data?.pages.flatMap((p) => p.items) ?? [];
    return rows.filter((s) => matchesClientSessionsTab(s, activeTab));
  }, [data?.pages, activeTab]);

  const handleTabChange = (tab: TabKey) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: Schedule; index: number }) => (
      <ConsultationCard
        schedule={item}
        index={index}
        onPress={() => router.push(`/(client)/(sessions)/${item.id}`)}
      />
    ),
    [router],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title="내 상담" />

      {/* Segmented Control */}
      <View
        style={[
          styles.segmented,
          {
            backgroundColor: theme.colors.gray[100],
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabChange(tab.key)}
              style={[
                styles.segmentedTab,
                {
                  backgroundColor: active ? theme.colors.surface : 'transparent',
                  borderRadius: theme.borderRadius.md,
                  ...(active ? theme.shadows.sm : {}),
                },
              ]}
              accessibilityLabel={`${tab.label} 탭`}
              accessibilityState={{ selected: active }}
              accessibilityRole="tab"
            >
              <Text
                style={{
                  fontFamily: active ? theme.fontFamily.semibold : theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: active ? theme.colors.textMain : theme.colors.textSecondary,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : consultations.length === 0 ? (
          <EmptyState
            icon={
              activeTab === 'SCHEDULED' ? (
                <Calendar size={32} color={theme.colors.textTertiary} />
              ) : (
                <ClipboardCheck size={32} color={theme.colors.textTertiary} />
              )
            }
            title={activeTab === 'SCHEDULED' ? '예정된 상담이 없어요' : '완료된 상담이 없어요'}
            description={
              activeTab === 'SCHEDULED'
                ? '관리자에게 상담 예약을 문의해주세요'
                : '첫 상담을 시작해보세요'
            }
          />
        ) : (
          <FlashList
            data={consultations}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isFetchingNextPage}
                onRefresh={refetch}
                tintColor={theme.colors.primary}
              />
            }
            ListFooterComponent={isFetchingNextPage ? <SkeletonCard lines={2} /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
  },
  segmentedTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  skeletonWrap: {
    gap: 12,
    paddingTop: 8,
  },
});
