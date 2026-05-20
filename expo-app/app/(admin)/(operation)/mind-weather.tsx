/**
 * 어드민 마음날씨 관측 — 읽기 전용 (ADMIN 전용)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CloudSun, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/app-chrome/AppTopBar';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Badge } from '@/components/atoms/Badge';
import {
  getMindWeatherQueryErrorMessage,
  useAdminMindWeatherCards,
  useAdminMindWeatherSummary,
} from '@/api/hooks/useAdminMindWeatherObservability';
import { ADMIN_MIND_WEATHER_COPY } from '@/constants/adminMindWeatherCopy';
import {
  ADMIN_API_QUERY_NOT_READY_COPY,
  ADMIN_MOBILE_OPERATION_COPY,
} from '@/constants/adminMobileScreensCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole, isStaffRole } from '@/utils/adminRole';
import type { AdminMindWeatherCardItem } from '@/utils/adminMindWeatherNormalize';
import { toDisplayString } from '@/utils/safeDisplay';
import { normalizeCommunityListedTimeIso } from '@/utils/dateFormat';
import {
  isAdminListQueryLoading,
  retryAdminApiSession,
} from '@/utils/retryAdminApiSession';

function formatObservedAt(iso: string): string {
  const trimmed = iso.trim();
  if (trimmed === '') {
    return '—';
  }
  try {
    const normalized = normalizeCommunityListedTimeIso(trimmed);
    const d = parseISO(normalized);
    if (Number.isNaN(d.getTime())) {
      return trimmed;
    }
    return format(d, 'yyyy.MM.dd HH:mm', { locale: ko });
  } catch {
    return trimmed;
  }
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.divider,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textTertiary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 4,
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.lg,
          color: theme.colors.textMain,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function AdminMindWeatherObservabilityScreen() {
  const theme = useTheme();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);
  const staffDenied = isStaffRole(role);

  const summaryQuery = useAdminMindWeatherSummary();
  const cardsQuery = useAdminMindWeatherCards(0);
  const [refreshing, setRefreshing] = useState(false);

  const items = cardsQuery.data?.items ?? [];

  const accessDeniedMessage = useMemo(() => {
    if (staffDenied) {
      return ADMIN_MIND_WEATHER_COPY.ACCESS_DENIED_STAFF;
    }
    return ADMIN_MIND_WEATHER_COPY.ACCESS_DENIED_GENERIC;
  }, [staffDenied]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([summaryQuery.refetch(), cardsQuery.refetch()]);
    setRefreshing(false);
  }, [summaryQuery, cardsQuery]);

  const handleSessionRetry = useCallback(() => {
    void retryAdminApiSession().then(() =>
      Promise.all([summaryQuery.refetch(), cardsQuery.refetch()]),
    );
  }, [summaryQuery, cardsQuery]);

  const renderCardRow = useCallback(
    ({ item }: { item: AdminMindWeatherCardItem }) => (
      <View
        style={[
          styles.cardRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.divider,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
            }}
          >
            {ADMIN_MIND_WEATHER_COPY.LABEL_CARD_ID} {toDisplayString(item.id, '—')}
          </Text>
          <Badge
            label={`${ADMIN_MIND_WEATHER_COPY.LABEL_SHARE} ${item.shareSummaryLabel}`}
            variant={item.shareSummaryLabel === 'Y' ? 'success' : 'gray'}
          />
        </View>
        <Text
          style={{
            marginTop: 6,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {ADMIN_MIND_WEATHER_COPY.LABEL_CLIENT_PK} {toDisplayString(item.clientUserId, '—')}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {ADMIN_MIND_WEATHER_COPY.LABEL_TONE} {toDisplayString(item.tone, '—')}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textTertiary,
          }}
        >
          {ADMIN_MIND_WEATHER_COPY.LABEL_CREATED} {formatObservedAt(item.createdAt)}
        </Text>
      </View>
    ),
    [theme],
  );

  const listHeader = useMemo(() => {
    const summary = summaryQuery.data;
    const summaryError = summaryQuery.isError
      ? getMindWeatherQueryErrorMessage(summaryQuery.error, ADMIN_MIND_WEATHER_COPY.SUMMARY_ERROR)
      : null;

    return (
      <View style={styles.headerBlock}>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textSecondary,
          }}
        >
          {ADMIN_MOBILE_OPERATION_COPY.MIND_WEATHER_SUB}
        </Text>
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
          }}
        >
          {ADMIN_MIND_WEATHER_COPY.SECTION_SUMMARY}
        </Text>
        {summaryError ? (
          <Text
            style={{
              marginTop: theme.spacing.xs,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.error,
            }}
          >
            {summaryError}
          </Text>
        ) : summaryQuery.isLoading && summaryQuery.data === undefined ? (
          <ActivityIndicator style={{ marginTop: theme.spacing.md }} color={theme.colors.primary} />
        ) : summary ? (
          <View style={styles.metricsGrid}>
            <SummaryMetric
              label={ADMIN_MIND_WEATHER_COPY.SUMMARY_TOTAL}
              value={toDisplayString(summary.totalCards)}
            />
            <SummaryMetric
              label={ADMIN_MIND_WEATHER_COPY.SUMMARY_SHARE_ON}
              value={toDisplayString(summary.cardsWithShareSummary)}
            />
            <SummaryMetric
              label={ADMIN_MIND_WEATHER_COPY.SUMMARY_LAST_24H}
              value={toDisplayString(summary.cardsCreatedLast24Hours)}
            />
            <SummaryMetric
              label={ADMIN_MIND_WEATHER_COPY.SUMMARY_NEWEST}
              value={
                summary.newestCardCreatedAt.trim() !== ''
                  ? formatObservedAt(summary.newestCardCreatedAt)
                  : '—'
              }
            />
          </View>
        ) : null}
        <Text
          style={{
            marginTop: theme.spacing.lg,
            marginBottom: theme.spacing.sm,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
          }}
        >
          {ADMIN_MIND_WEATHER_COPY.SECTION_CARDS}
        </Text>
      </View>
    );
  }, [summaryQuery, theme]);

  if (!allowed) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'left', 'right']}
      >
        <AppTopBar title={ADMIN_MIND_WEATHER_COPY.PAGE_TITLE} canGoBack />
        <View style={styles.deniedWrap}>
          <ShieldAlert size={40} color={theme.colors.error} />
          <Text
            style={{
              marginTop: theme.spacing.md,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
              color: theme.colors.textMain,
              textAlign: 'center',
            }}
          >
            {ADMIN_MIND_WEATHER_COPY.ACCESS_DENIED_TITLE}
          </Text>
          <Text
            style={{
              marginTop: theme.spacing.sm,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: 24,
            }}
          >
            {accessDeniedMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const listErrorMessage = cardsQuery.isError
    ? getMindWeatherQueryErrorMessage(cardsQuery.error, ADMIN_MIND_WEATHER_COPY.LIST_ERROR)
    : null;

  const showLoading =
    isAdminListQueryLoading(cardsQuery.isLoading, cardsQuery.data?.items, {
      isError: cardsQuery.isError,
    }) ||
    (summaryQuery.isLoading && summaryQuery.data === undefined);

  if (!cardsQuery.ready) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
        edges={['top', 'left', 'right']}
      >
        <AppTopBar title={ADMIN_MIND_WEATHER_COPY.PAGE_TITLE} canGoBack />
        <View style={styles.centered}>
          <EmptyState
            icon={<CloudSun size={36} color={theme.colors.textTertiary} />}
            title={ADMIN_API_QUERY_NOT_READY_COPY.TITLE}
            description={ADMIN_API_QUERY_NOT_READY_COPY.DESCRIPTION}
            actionLabel={ADMIN_API_QUERY_NOT_READY_COPY.RETRY}
            onAction={handleSessionRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'left', 'right']}
    >
      <AppTopBar title={ADMIN_MIND_WEATHER_COPY.PAGE_TITLE} canGoBack />
      {showLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCardRow}
          ListHeaderComponent={listHeader}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            listErrorMessage ? (
              <EmptyState
                icon={<CloudSun size={32} color={theme.colors.textTertiary} />}
                title={ADMIN_MIND_WEATHER_COPY.LIST_ERROR}
                description={listErrorMessage}
                actionLabel={ADMIN_MIND_WEATHER_COPY.RETRY}
                onAction={() => void handleRefresh()}
              />
            ) : (
              <EmptyState
                icon={<CloudSun size={32} color={theme.colors.textTertiary} />}
                title={ADMIN_MIND_WEATHER_COPY.EMPTY_TITLE}
                description={ADMIN_MIND_WEATHER_COPY.EMPTY_DESC}
                actionLabel={ADMIN_MIND_WEATHER_COPY.RETRY}
                onAction={() => void handleRefresh()}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerBlock: {
    paddingBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  metric: {
    width: '47%',
    minWidth: 140,
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  cardRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
