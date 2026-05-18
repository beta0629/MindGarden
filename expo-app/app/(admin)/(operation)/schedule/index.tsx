/**
 * 어드민·스태프 스케줄 허브 — 일정 | 매칭 세그먼트
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addDays, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Calendar, ChevronLeft, ChevronRight, Link2, Plus } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonCard } from '@/components/atoms/SkeletonLoader';
import { ScheduleCard } from '@/components/molecules/ScheduleCard';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  filterAdminMappingsByView,
  getAdminMappingsErrorMessage,
  useAdminMappings,
  type AdminMappingListItem,
} from '@/api/hooks/useAdminMappings';
import type { AdminMappingViewFilter } from '@/utils/adminMappingNormalize';
import { useAdminSchedulesByDate } from '@/api/hooks/useAdminSchedules';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ADMIN_MAPPING_COPY,
  ADMIN_MAPPING_STATUS_LABELS,
} from '@/constants/adminMappingCopy';
import {
  canManageMappingsOnMobile,
  canViewMappingsOnMobile,
  isStaffRole,
} from '@/utils/adminRole';
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

type HubTab = 'schedule' | 'mappings';

type SearchParams = {
  tab?: string;
  dateYmd?: string;
};

const MAPPING_FILTERS: { key: AdminMappingViewFilter; label: string }[] = [
  { key: 'ongoing', label: ADMIN_MAPPING_COPY.FILTER_ONGOING },
  { key: 'remaining', label: ADMIN_MAPPING_COPY.FILTER_REMAINING },
  { key: 'all', label: ADMIN_MAPPING_COPY.FILTER_ALL },
];

function formatDateLabel(ymd: string): string {
  try {
    const d = parseISO(ymd);
    return format(d, 'yyyy년 M월 d일 (EEEE)', { locale: ko });
  } catch {
    return ymd;
  }
}

function mappingStatusLabel(status: string): string {
  const key = status.trim().toUpperCase();
  return ADMIN_MAPPING_STATUS_LABELS[key] ?? toDisplayString(status, '—');
}

function MappingListCard({
  item,
  index,
  onSchedule,
}: {
  item: AdminMappingListItem;
  index: number;
  onSchedule: (mapping: AdminMappingListItem) => void;
}) {
  const theme = useTheme();
  const status = item.status.trim().toUpperCase();
  const variant =
    status === 'ACTIVE'
      ? 'success'
      : status === 'PENDING_PAYMENT' || status === 'DEPOSIT_PENDING'
        ? 'warning'
        : status === 'TERMINATED' || status === 'SESSIONS_EXHAUSTED'
          ? 'gray'
          : 'info';

  return (
    <View
      style={[
        styles.mappingCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
          marginTop: index === 0 ? 0 : 10,
        },
      ]}
    >
      <View style={styles.mappingCardHeader}>
        <Text
          style={{
            flex: 1,
            color: theme.colors.textMain,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.base,
          }}
        >
          {toDisplayString(item.consultantName, '상담사')} · {toDisplayString(item.clientName, '내담자')}
        </Text>
        <Badge label={mappingStatusLabel(item.status)} variant={variant} />
      </View>
      <Text
        style={{
          marginTop: 6,
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
        }}
      >
        {ADMIN_MAPPING_COPY.REMAINING_SESSIONS(item.remainingSessions)}
        {item.packageName.trim() !== '' ? ` · ${item.packageName}` : ''}
      </Text>
      <Pressable
        onPress={() => onSchedule(item)}
        style={({ pressed }) => [
          styles.mappingAction,
          {
            borderColor: theme.colors.primary,
            opacity: pressed ? 0.9 : 1,
            marginTop: theme.spacing.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING}
      >
        <Link2 size={16} color={theme.colors.primary} />
        <Text
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
            marginLeft: 6,
          }}
        >
          {ADMIN_MAPPING_COPY.ACTION_SCHEDULE_FROM_MAPPING}
        </Text>
      </Pressable>
    </View>
  );
}

export default function AdminScheduleHubScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const canViewMappings = canViewMappingsOnMobile(role, accessToken);
  const canManageMappings = canManageMappingsOnMobile(role, accessToken);

  const initialTab: HubTab =
    params.tab === 'mappings' && canViewMappings ? 'mappings' : 'schedule';
  const [hubTab, setHubTab] = useState<HubTab>(initialTab);
  const [mappingFilter, setMappingFilter] = useState<AdminMappingViewFilter>('ongoing');
  const [fabSheetOpen, setFabSheetOpen] = useState(false);
  const [forbiddenOpen, setForbiddenOpen] = useState(false);

  const [dateYmd, setDateYmd] = useState(() => {
    if (typeof params.dateYmd === 'string' && params.dateYmd.length >= 10) {
      return params.dateYmd.slice(0, 10);
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const scheduleQuery = useAdminSchedulesByDate(dateYmd, {
    enabled: hubTab === 'schedule',
  });
  const mappingsQuery = useAdminMappings({ enabled: hubTab === 'mappings' && canViewMappings });

  const schedules = scheduleQuery.data ?? [];
  const filteredMappings = useMemo(
    () => filterAdminMappingsByView(mappingsQuery.data ?? [], mappingFilter),
    [mappingFilter, mappingsQuery.data],
  );

  const scheduleLoading = isAdminListQueryLoading(scheduleQuery.isLoading, scheduleQuery.data, {
    isError: scheduleQuery.isError,
  });
  const mappingsLoading = isAdminListQueryLoading(mappingsQuery.isLoading, mappingsQuery.data, {
    isError: mappingsQuery.isError,
  });

  const isRefreshing =
    hubTab === 'schedule'
      ? scheduleQuery.isFetching && !scheduleLoading && scheduleQuery.ready
      : mappingsQuery.isFetching && !mappingsLoading && mappingsQuery.ready;

  const dateLabel = useMemo(() => formatDateLabel(dateYmd), [dateYmd]);

  const handleSessionRetry = useCallback(() => {
    void retryAdminApiSession().then(() => {
      if (hubTab === 'schedule') {
        void scheduleQuery.refetch();
      } else {
        void mappingsQuery.refetch();
      }
    });
  }, [hubTab, mappingsQuery, scheduleQuery]);

  const onRefresh = useCallback(() => {
    if (hubTab === 'schedule') {
      void scheduleQuery.refetch();
    } else {
      void mappingsQuery.refetch();
    }
  }, [hubTab, mappingsQuery, scheduleQuery]);

  const shiftDate = useCallback((delta: number) => {
    try {
      const next = format(addDays(parseISO(dateYmd), delta), 'yyyy-MM-dd');
      setDateYmd(next);
    } catch {
      /* keep */
    }
  }, [dateYmd]);

  const openCreateSchedule = useCallback(() => {
    setFabSheetOpen(false);
    router.push({
      pathname: '/(admin)/(operation)/schedule/create',
      params: { dateYmd },
    } as Href);
  }, [dateYmd, router]);

  const openCreateMapping = useCallback(() => {
    setFabSheetOpen(false);
    if (!canManageMappings) {
      setForbiddenOpen(true);
      return;
    }
    router.push('/(admin)/(operation)/schedule/mapping/create' as Href);
  }, [canManageMappings, router]);

  const openScheduleFromMapping = useCallback(
    (mapping: AdminMappingListItem) => {
      router.push({
        pathname: '/(admin)/(operation)/schedule/create',
        params: {
          mappingId: String(mapping.id),
          consultantId: String(mapping.consultantId),
          clientId: String(mapping.clientId),
          step: '3',
          dateYmd,
        },
      } as Href);
    },
    [dateYmd, router],
  );

  const handleHubTabChange = useCallback(
    (tab: HubTab) => {
      if (tab === 'mappings' && !canViewMappings) {
        setForbiddenOpen(true);
        return;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setHubTab(tab);
    },
    [canViewMappings],
  );

  const handleFabPress = useCallback(() => {
    if (hubTab === 'schedule') {
      openCreateSchedule();
      return;
    }
    if (canManageMappings) {
      setFabSheetOpen(true);
    } else {
      openCreateSchedule();
    }
  }, [canManageMappings, hubTab, openCreateSchedule]);

  const mappingsForbidden =
    mappingsQuery.isError &&
    mappingsQuery.error != null &&
    typeof mappingsQuery.error === 'object' &&
    'status' in mappingsQuery.error &&
    (mappingsQuery.error as { status: number }).status === 403;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_MAPPING_COPY.HUB_TITLE} canGoBack />

      <View
        style={[
          styles.segmented,
          {
            marginHorizontal: theme.spacing.lg,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.gray[100],
            borderRadius: theme.borderRadius.lg,
          },
        ]}
      >
        {(
          [
            { key: 'schedule' as const, label: ADMIN_MAPPING_COPY.TAB_SCHEDULE },
            { key: 'mappings' as const, label: ADMIN_MAPPING_COPY.TAB_MAPPINGS },
          ] as const
        ).map((tab) => {
          const active = hubTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleHubTabChange(tab.key)}
              style={[
                styles.segmentedTab,
                {
                  backgroundColor: active ? theme.colors.surface : 'transparent',
                  borderRadius: theme.borderRadius.md,
                  ...(active ? theme.shadows.sm : {}),
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
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
        {hubTab === 'schedule' ? (
          <>
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

            {!scheduleQuery.ready ? (
              <EmptyState
                icon={<Calendar size={32} color={theme.colors.textTertiary} />}
                title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
                description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
                actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
                onAction={handleSessionRetry}
              />
            ) : scheduleLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : scheduleQuery.isError ? (
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
          </>
        ) : (
          <>
            {!canViewMappings ? (
              <EmptyState title={ADMIN_MAPPING_COPY.ACCESS_VIEW_DENIED} />
            ) : !mappingsQuery.ready ? (
              <EmptyState
                icon={<Link2 size={32} color={theme.colors.textTertiary} />}
                title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
                description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
                actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
                onAction={handleSessionRetry}
              />
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.chipRow, { marginTop: theme.spacing.md }]}
                >
                  {MAPPING_FILTERS.map((f) => (
                    <Chip
                      key={f.key}
                      label={f.label}
                      selected={mappingFilter === f.key}
                      onPress={() => setMappingFilter(f.key)}
                    />
                  ))}
                </ScrollView>
                {mappingsLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : mappingsForbidden ? (
                  <EmptyState title={ADMIN_MAPPING_COPY.ACCESS_VIEW_DENIED} />
                ) : mappingsQuery.isError ? (
                  <EmptyState
                    icon={<Link2 size={32} color={theme.colors.textTertiary} />}
                    title={getAdminMappingsErrorMessage(
                      mappingsQuery.error,
                      ADMIN_MAPPING_COPY.MAPPINGS_ERROR,
                    )}
                  />
                ) : filteredMappings.length === 0 ? (
                  <EmptyState
                    icon={<Link2 size={32} color={theme.colors.textTertiary} />}
                    title={ADMIN_MAPPING_COPY.EMPTY_MAPPINGS}
                  />
                ) : (
                  <View style={[styles.list, { marginTop: theme.spacing.md }]}>
                    <FlashList
                      data={filteredMappings}
                      scrollEnabled={false}
                      keyExtractor={(item) => String(item.id)}
                      renderItem={({ item, index }) => (
                        <MappingListCard
                          item={item}
                          index={index}
                          onSchedule={openScheduleFromMapping}
                        />
                      )}
                    />
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={handleFabPress}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
            ...theme.shadows.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          hubTab === 'mappings' && canManageMappings
            ? ADMIN_MAPPING_COPY.FAB_SHEET_TITLE
            : ADMIN_SCHEDULE_REGISTER_COPY.FAB_LABEL
        }
      >
        <Plus size={28} color={theme.colors.textOnPrimary} />
      </Pressable>

      <UnifiedModal
        isOpen={fabSheetOpen}
        onClose={() => setFabSheetOpen(false)}
        title={ADMIN_MAPPING_COPY.FAB_SHEET_TITLE}
        actions={[
          {
            label: ADMIN_SCHEDULE_REGISTER_COPY.CANCEL,
            onPress: () => setFabSheetOpen(false),
            variant: 'secondary',
          },
        ]}
      >
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={openCreateSchedule}
            style={({ pressed }) => [
              styles.sheetRow,
              {
                borderColor: theme.colors.divider,
                backgroundColor: theme.colors.surface,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ color: theme.colors.textMain, fontFamily: theme.fontFamily.medium }}>
              {ADMIN_MAPPING_COPY.FAB_SCHEDULE}
            </Text>
          </Pressable>
          {canManageMappings ? (
            <Pressable
              onPress={openCreateMapping}
              style={({ pressed }) => [
                styles.sheetRow,
                {
                  borderColor: theme.colors.divider,
                  backgroundColor: theme.colors.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={{ color: theme.colors.textMain, fontFamily: theme.fontFamily.medium }}>
                {ADMIN_MAPPING_COPY.FAB_NEW_MAPPING}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </UnifiedModal>

      <UnifiedModal
        isOpen={forbiddenOpen}
        onClose={() => setForbiddenOpen(false)}
        title={ADMIN_MAPPING_COPY.FORBIDDEN_TITLE}
        subtitle={
          hubTab === 'mappings'
            ? ADMIN_MAPPING_COPY.ACCESS_VIEW_DENIED
            : ADMIN_MAPPING_COPY.ACCESS_MANAGE_DENIED
        }
        actions={[
          { label: '확인', onPress: () => setForbiddenOpen(false), variant: 'primary' },
        ]}
      />
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
  segmented: {
    flexDirection: 'row',
    padding: 4,
  },
  segmentedTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  mappingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  mappingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  mappingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  sheetRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
});
