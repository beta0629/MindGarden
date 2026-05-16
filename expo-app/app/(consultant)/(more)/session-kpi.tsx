/**
 * 상담사 완료 회기 KPI — 일·주·월 단위 총계·추이·전 기간 대비
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Stack } from 'expo-router';
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Chip } from '@/components/atoms/Chip';
import { EmptyState } from '@/components/atoms/EmptyState';
import { LineTrendChart } from '@/components/molecules/LineTrendChart';
import { StatCard } from '@/components/molecules/StatCard';
import {
  useConsultantSessionStatistics,
  type SessionStatisticsGranularity,
} from '@/api/hooks/useConsultantSessionStatistics';
import { CONSULTANT_SESSION_KPI_COPY } from '@/constants/consultantSessionKpiCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

const WEEK_OPTS = { weekStartsOn: 1 as const };
const CHART_HEIGHT = 168;
const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = Math.max(200, screenWidth - 48);

function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return toDisplayString(error.message, fallback);
  }
  if (error != null && typeof error === 'object' && 'message' in error) {
    return toDisplayString((error as { message: unknown }).message, fallback);
  }
  return fallback;
}

function getRangeForAnchor(
  anchor: Date,
  granularity: SessionStatisticsGranularity,
): { startDate: string; endDate: string; header: string } {
  if (granularity === 'DAY') {
    const d = format(anchor, 'yyyy-MM-dd');
    return {
      startDate: d,
      endDate: d,
      header: format(anchor, 'yyyy년 M월 d일 (EEE)', { locale: ko }),
    };
  }
  if (granularity === 'WEEK') {
    const start = startOfWeek(anchor, WEEK_OPTS);
    const end = endOfWeek(anchor, WEEK_OPTS);
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      header: `${format(start, 'M/d', { locale: ko })} ~ ${format(end, 'M/d', { locale: ko })}`,
    };
  }
  const start = startOfMonth(anchor);
  const end = endOfMonth(anchor);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
    header: format(start, 'yyyy년 M월', { locale: ko }),
  };
}

function shiftAnchor(anchor: Date, granularity: SessionStatisticsGranularity, dir: -1 | 1): Date {
  if (granularity === 'DAY') {
    return dir === 1 ? addDays(anchor, 1) : subDays(anchor, 1);
  }
  if (granularity === 'WEEK') {
    return dir === 1 ? addWeeks(anchor, 1) : subWeeks(anchor, 1);
  }
  return dir === 1 ? addMonths(anchor, 1) : subMonths(anchor, 1);
}

function chartLabelForBucket(label: string, granularity: SessionStatisticsGranularity): string {
  if (granularity === 'DAY') {
    return label;
  }
  const isoPrefix = label.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoPrefix)) {
    const parsed = parseISO(isoPrefix);
    if (!Number.isNaN(parsed.getTime())) {
      return format(parsed, 'M/d', { locale: ko });
    }
  }
  return label.length > 8 ? label.slice(0, 8) : label;
}

function formatCount(value: number): string {
  const n = toSafeNumber(value, Number.NaN);
  if (!Number.isFinite(n)) {
    return '—';
  }
  return new Intl.NumberFormat('ko-KR').format(n);
}

function formatDelta(total: number, prev: number | null): string {
  if (prev == null || !Number.isFinite(prev)) {
    return CONSULTANT_SESSION_KPI_COPY.DELTA_UNAVAILABLE;
  }
  const d = total - prev;
  const sign = d > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('ko-KR').format(d)}`;
}

export default function ConsultantSessionKpiScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const hasUser = Boolean(user?.id);
  const [granularity, setGranularity] = useState<SessionStatisticsGranularity>('WEEK');
  const [anchor, setAnchor] = useState(() => new Date());

  const { startDate, endDate, header } = useMemo(
    () => getRangeForAnchor(anchor, granularity),
    [anchor, granularity],
  );

  const { data, isLoading, isError, error, refetch, isFetching, isSuccess } =
    useConsultantSessionStatistics({ startDate, endDate, granularity }, { enabled: hasUser });

  const didFocusOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasUser) {
        return;
      }
      if (!didFocusOnceRef.current) {
        didFocusOnceRef.current = true;
        return;
      }
      void refetch();
    }, [hasUser, refetch]),
  );

  const totalCompleted = data?.totalCompleted ?? 0;
  const previousPeriodTotal = data?.previousPeriodTotal ?? null;
  const buckets = useMemo(
    () => (Array.isArray(data?.buckets) ? data.buckets : []),
    [data?.buckets],
  );

  const chartValues = useMemo(() => buckets.map((b) => toSafeNumber(b.count, 0)), [buckets]);
  const chartLabels = useMemo(
    () => buckets.map((b) => chartLabelForBucket(b.label, granularity)),
    [buckets, granularity],
  );
  const chartMax = useMemo(() => {
    const m = Math.max(1, ...chartValues);
    return Number.isFinite(m) ? m : 1;
  }, [chartValues]);

  const onPrev = () => {
    setAnchor((a) => shiftAnchor(a, granularity, -1));
  };
  const onNext = () => {
    setAnchor((a) => shiftAnchor(a, granularity, 1));
  };

  const onGranularityChange = (g: SessionStatisticsGranularity) => {
    setGranularity(g);
    setAnchor(new Date());
  };

  const showChart = chartValues.length > 0;
  const isEmptySuccess = isSuccess && totalCompleted === 0 && buckets.length === 0;
  const isMissingBucketsSuccess = isSuccess && totalCompleted > 0 && buckets.length === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <Stack.Screen
        options={{ headerShown: true, title: CONSULTANT_SESSION_KPI_COPY.SCREEN_TITLE }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={() => refetch()}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text
          style={[
            styles.intro,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {CONSULTANT_SESSION_KPI_COPY.INTRO}
        </Text>

        <View style={[styles.tabRow, { paddingHorizontal: theme.spacing.lg }]}>
          <Chip
            label={CONSULTANT_SESSION_KPI_COPY.GRANULARITY_DAY}
            selected={granularity === 'DAY'}
            onPress={() => onGranularityChange('DAY')}
          />
          <View style={{ width: theme.spacing.sm }} />
          <Chip
            label={CONSULTANT_SESSION_KPI_COPY.GRANULARITY_WEEK}
            selected={granularity === 'WEEK'}
            onPress={() => onGranularityChange('WEEK')}
          />
          <View style={{ width: theme.spacing.sm }} />
          <Chip
            label={CONSULTANT_SESSION_KPI_COPY.GRANULARITY_MONTH}
            selected={granularity === 'MONTH'}
            onPress={() => onGranularityChange('MONTH')}
          />
        </View>

        <View
          style={[
            styles.periodNav,
            {
              marginHorizontal: theme.spacing.lg,
              marginTop: theme.spacing.md,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}
        >
          <Pressable
            onPress={onPrev}
            hitSlop={12}
            style={styles.periodBtn}
            accessibilityRole="button"
            accessibilityLabel={CONSULTANT_SESSION_KPI_COPY.PREV_PERIOD}
          >
            <ChevronLeft size={22} color={theme.colors.textMain} />
          </Pressable>
          <View style={styles.periodLabelWrap}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.xs,
                textAlign: 'center',
              }}
            >
              {startDate === endDate ? startDate : `${startDate} ~ ${endDate}`}
            </Text>
            <Text
              style={{
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                textAlign: 'center',
                marginTop: 4,
              }}
              accessibilityRole="header"
            >
              {header}
            </Text>
          </View>
          <Pressable
            onPress={onNext}
            hitSlop={12}
            style={styles.periodBtn}
            accessibilityRole="button"
            accessibilityLabel={CONSULTANT_SESSION_KPI_COPY.NEXT_PERIOD}
          >
            <ChevronRight size={22} color={theme.colors.textMain} />
          </Pressable>
        </View>

        {!hasUser ? (
          <EmptyState
            icon={<BarChart3 size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_SESSION_KPI_COPY.NO_USER_TITLE}
            description={CONSULTANT_SESSION_KPI_COPY.NO_USER_HINT}
          />
        ) : isLoading ? (
          <View style={styles.center} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : isError ? (
          <View style={styles.center} accessibilityRole="alert">
            <Text style={{ color: theme.colors.error, fontFamily: theme.fontFamily.medium }}>
              {getQueryErrorMessage(error, CONSULTANT_SESSION_KPI_COPY.LOAD_ERROR)}
            </Text>
            <Text
              style={{
                marginTop: 8,
                paddingHorizontal: 8,
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                textAlign: 'center',
              }}
            >
              {CONSULTANT_SESSION_KPI_COPY.LOAD_ERROR_HINT}
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [{ marginTop: 12, opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={CONSULTANT_SESSION_KPI_COPY.RETRY}
            >
              <Text
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.base,
                }}
              >
                {CONSULTANT_SESSION_KPI_COPY.RETRY}
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.statsRow,
                { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
              ]}
            >
              <StatCard
                icon={CalendarCheck}
                value={formatCount(totalCompleted)}
                label={CONSULTANT_SESSION_KPI_COPY.HEADER_TOTAL}
                index={0}
              />
              <StatCard
                icon={TrendingUp}
                value={formatDelta(totalCompleted, previousPeriodTotal)}
                label={CONSULTANT_SESSION_KPI_COPY.HEADER_DELTA}
                index={1}
                accentColor={theme.colors.accent}
              />
            </View>

            {isEmptySuccess ? (
              <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
                <EmptyState
                  icon={<BarChart3 size={32} color={theme.colors.textTertiary} />}
                  title={CONSULTANT_SESSION_KPI_COPY.EMPTY_ALL}
                  description={CONSULTANT_SESSION_KPI_COPY.EMPTY_ALL_HINT}
                />
              </View>
            ) : null}

            <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
              <Text
                style={{
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {CONSULTANT_SESSION_KPI_COPY.SECTION_TREND}
              </Text>
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.lg,
                  },
                ]}
              >
                {!showChart ? (
                  <Text
                    style={{
                      fontFamily: theme.fontFamily.regular,
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.textSecondary,
                      textAlign: 'center',
                      paddingVertical: 24,
                    }}
                  >
                    {isMissingBucketsSuccess
                      ? CONSULTANT_SESSION_KPI_COPY.NO_BUCKET_DETAIL
                      : CONSULTANT_SESSION_KPI_COPY.CHART_EMPTY}
                  </Text>
                ) : (
                  <LineTrendChart
                    values={chartValues}
                    labels={chartLabels}
                    maxValue={chartMax}
                    width={CHART_WIDTH}
                    height={CHART_HEIGHT}
                  />
                )}
              </View>
            </View>

            {buckets.length > 0 ? (
              <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
                <Text
                  style={{
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  {CONSULTANT_SESSION_KPI_COPY.LIST_TITLE}
                </Text>
                <View
                  style={[
                    styles.listCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.lg,
                    },
                  ]}
                >
                  {buckets.map((b, i) => (
                    <View
                      key={`${b.label}-${String(i)}`}
                      style={[
                        styles.listRow,
                        i < buckets.length - 1
                          ? {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: theme.colors.border,
                            }
                          : null,
                      ]}
                    >
                      <Text
                        style={{
                          flex: 1,
                          color: theme.colors.textMain,
                          fontFamily: theme.fontFamily.medium,
                          fontSize: theme.fontSize.sm,
                        }}
                        numberOfLines={1}
                      >
                        {toDisplayString(b.label, '—')}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontFamily: theme.fontFamily.semibold,
                          fontSize: theme.fontSize.sm,
                        }}
                      >
                        {formatCount(b.count)}회
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {previousPeriodTotal != null && Number.isFinite(previousPeriodTotal) ? (
              <Text
                style={{
                  marginTop: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  color: theme.colors.textTertiary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                }}
              >
                {CONSULTANT_SESSION_KPI_COPY.HEADER_PREVIOUS}: {formatCount(previousPeriodTotal)}회
              </Text>
            ) : null}
          </>
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
  intro: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  periodLabelWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  chartCard: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  listCard: {
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  center: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});
