/**
 * 내담자 관리 목록
 * 검색, 필터 칩, 내담자 카드 리스트 (무한 스크롤)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Users as UsersIcon } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useConsultantClients, type ClientStatus } from '@/api/hooks/useClients';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ClientCard } from '@/components/molecules/ClientCard';
import { Chip } from '@/components/atoms/Chip';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { EmptyState } from '@/components/atoms/EmptyState';

type FilterTab = 'ALL' | ClientStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ACTIVE', label: '활성' },
  { key: 'AT_RISK', label: '위험' },
  { key: 'INACTIVE', label: '비활성' },
];

export default function ConsultantClients() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('ALL');

  const clientsQuery = useConsultantClients({
    consultantId: user?.id ?? '',
    search: search || undefined,
    status: filter,
  });

  const clients = useMemo(
    () => clientsQuery.data?.pages.flatMap((p) => p.content) ?? [],
    [clientsQuery.data],
  );

  const isLoading = clientsQuery.isLoading;
  const isRefreshing = clientsQuery.isFetching && !isLoading;

  const onRefresh = useCallback(() => {
    clientsQuery.refetch();
  }, [clientsQuery]);

  const onEndReached = () => {
    if (clientsQuery.hasNextPage && !clientsQuery.isFetchingNextPage) {
      clientsQuery.fetchNextPage();
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
          내담자 관리
        </Text>
        <SearchBar value={search} onChangeText={setSearch} placeholder="이름으로 검색" />
        <View style={[styles.chips, { marginTop: theme.spacing.md }]}>
          {FILTER_TABS.map((tab) => (
            <Chip
              key={tab.key}
              label={tab.label}
              selected={filter === tab.key}
              onPress={() => setFilter(tab.key)}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.listPadding, { paddingHorizontal: theme.spacing.lg }]}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={32} color={theme.colors.textTertiary} />}
          title="등록된 내담자가 없습니다"
          description={
            search
              ? `"${search}"에 해당하는 내담자를 찾을 수 없습니다.`
              : '아직 배정된 내담자가 없습니다.'
          }
        />
      ) : (
        <FlashList
          data={clients}
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
            <ClientCard
              name={item.name}
              profileImageUrl={item.profileImageUrl}
              lastSessionDate={item.lastSessionDate}
              status={item.status}
              riskLevel={item.riskLevel}
              totalSessions={item.totalSessions}
              index={index}
              onPress={() => router.push(`/(consultant)/(clients)/${item.id}`)}
            />
          )}
          ListFooterComponent={clientsQuery.isFetchingNextPage ? <SkeletonCard /> : null}
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
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  listPadding: {
    paddingTop: 12,
  },
});
