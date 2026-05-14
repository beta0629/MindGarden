/**
 * ConsultantIncome — 상담사 수입 리포트
 *
 * 월별 네비게이션, 요약 카드 3개(총 수입/상담 건수/평균 평점),
 * 월간 막대 차트, 상담 유형별 분포, 상세 내역 리스트.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Star,
  BarChart3,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatCard } from '@/components/molecules/StatCard';
import { EmptyState } from '@/components/atoms/EmptyState';
import { SkeletonLoader } from '@/components/atoms/SkeletonLoader';
import {
  useIncomeReport,
  useIncomeDetails,
  type IncomeDetailItem,
  type MonthlyIncome,
  type SessionTypeDistribution,
} from '@/api/hooks/useIncome';
import { extractErrorMessage } from '@/api/hooks/useAvailability';
import { useTenantStore } from '@/stores/useTenantStore';

const formatCurrency = (amount: number): string => {
  if (!amount && amount !== 0) return '₩0';
  return `₩${Number(amount).toLocaleString()}`;
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (month: string): string => {
  const [y, m] = month.split('-');
  return `${y}년 ${Number(m)}월`;
};

/** 애니메이션 바 차트 개별 막대 */
function AnimatedBar({
  item,
  maxValue,
  isCurrent,
  index: _index,
  showAmount,
}: {
  readonly item: MonthlyIncome;
  readonly maxValue: number;
  readonly isCurrent: boolean;
  readonly index: number;
  readonly showAmount: boolean;
}) {
  const theme = useTheme();
  const value = showAmount ? item.income : item.sessions;
  const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [heightPct, progress]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    height: `${Math.max(heightPct * progress.value, 3)}%`,
  }));

  const headerLabel = (() => {
    if (value <= 0) return '-';
    if (showAmount) return formatCurrency(item.income);
    return `${item.sessions}건`;
  })();

  return (
    <View style={styles.barWrapper}>
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize['2xs'],
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.xs,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {headerLabel}
      </Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: isCurrent ? theme.colors.primary : theme.colors.primaryLight,
              borderRadius: theme.borderRadius.sm,
            },
            animatedBarStyle,
          ]}
        />
      </View>
      <Text
        style={{
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize['2xs'],
          color: isCurrent ? theme.colors.primary : theme.colors.textTertiary,
          marginTop: theme.spacing.xs,
          textAlign: 'center',
        }}
      >
        {item.label}
      </Text>
    </View>
  );
}

/** 유형별 분포 수평 바 */
function TypeDistributionBar({
  item,
  maxValue,
  showAmount,
}: {
  readonly item: SessionTypeDistribution;
  readonly maxValue: number;
  readonly showAmount: boolean;
}) {
  const theme = useTheme();
  const value = showAmount ? item.amount : item.count;
  const widthPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [widthPct, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(widthPct * progress.value, 5)}%`,
  }));

  const trailingText = showAmount
    ? `${item.count}건 · ${formatCurrency(item.amount)}`
    : `${item.count}건`;

  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <View style={styles.typeRow}>
        <Text
          style={{
            fontFamily: theme.fontFamily.medium,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
          }}
        >
          {item.type}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
          }}
        >
          {trailingText}
        </Text>
      </View>
      <View
        style={[
          styles.typeBarTrack,
          { backgroundColor: theme.colors.gray[100], borderRadius: theme.borderRadius.sm },
        ]}
      >
        <Animated.View
          style={[
            styles.typeBar,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.borderRadius.sm,
            },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

/** 상세 내역 리스트 아이템 */
function DetailListItem({
  item,
  index,
  showAmount,
}: {
  readonly item: IncomeDetailItem;
  readonly index: number;
  readonly showAmount: boolean;
}) {
  const theme = useTheme();

  const rightLabel = showAmount ? formatCurrency(item.amount) : '완료';

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40).duration(250)}
      style={[
        styles.detailItem,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
          ...theme.shadows.sm,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${item.date} ${item.clientName} ${rightLabel}`}
    >
      <View style={styles.detailLeft}>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textTertiary,
          }}
        >
          {item.date}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
            marginTop: theme.spacing['2xs'],
          }}
          numberOfLines={1}
        >
          {item.clientName}
        </Text>
      </View>
      <View style={styles.detailRight}>
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.base,
            color: theme.colors.primary,
          }}
        >
          {rightLabel}
        </Text>
        <Text
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.xs,
            color: theme.colors.textSecondary,
            marginTop: theme.spacing['2xs'],
          }}
        >
          {item.consultationType}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ConsultantIncome() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const tenantId = useTenantStore((s) => s.tenantId);
  const isConsultant = role === 'consultant';
  const consultantId = isConsultant ? user?.id : undefined;

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);

  const {
    data: report,
    isLoading: loadingReport,
    isError: errorReport,
    error: reportError,
    refetch: refetchReport,
  } = useIncomeReport(consultantId, currentMonth);
  const {
    data: details,
    isLoading: loadingDetails,
    isError: errorDetails,
    error: detailsError,
    refetch: refetchDetails,
  } = useIncomeDetails(consultantId, currentMonth);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const changeMonth = useCallback(
    (delta: number) => {
      triggerHaptic();
      setCurrentMonth((prev) => {
        const [y = 0, m = 1] = prev.split('-').map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      });
    },
    [triggerHaptic],
  );

  const incomeAvailable = report?.incomeAvailable ?? false;

  const maxBarValue = useMemo(() => {
    if (!report?.monthlyTrend?.length) return 1;
    const values = report.monthlyTrend.map((d) => (incomeAvailable ? d.income : d.sessions));
    return Math.max(...values, 1);
  }, [report, incomeAvailable]);

  const maxTypeValue = useMemo(() => {
    if (!report?.sessionTypeDistribution?.length) return 1;
    const values = report.sessionTypeDistribution.map((d) =>
      incomeAvailable ? d.amount : d.count,
    );
    return Math.max(...values, 1);
  }, [report, incomeAvailable]);

  const isLoading = loadingReport || loadingDetails;
  const isError = errorReport || errorDetails;

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.bgMain, padding: theme.spacing.lg },
          ]}
        >
          <EmptyState
            icon={<DollarSign size={32} color={theme.colors.textTertiary} />}
            title="로그인이 필요합니다"
            description="상담사 계정으로 로그인한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (!isConsultant || !consultantId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.bgMain, padding: theme.spacing.lg },
          ]}
        >
          <EmptyState
            icon={<DollarSign size={32} color={theme.colors.textTertiary} />}
            title="상담사만 접근할 수 있습니다"
            description="상담사 계정으로 로그인한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (!tenantId) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.bgMain, padding: theme.spacing.lg },
          ]}
        >
          <EmptyState
            icon={<DollarSign size={32} color={theme.colors.textTertiary} />}
            title="기관 정보가 없습니다"
            description="기관(테넌트)을 선택한 뒤 다시 시도해 주세요"
          />
        </View>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
        <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
          <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
            <SkeletonLoader height={40} width="50%" />
            <View style={styles.summarySkeletonRow}>
              <SkeletonLoader height={100} style={{ flex: 1 }} />
              <SkeletonLoader height={100} style={{ flex: 1 }} />
              <SkeletonLoader height={100} style={{ flex: 1 }} />
            </View>
            <SkeletonLoader height={200} />
            <SkeletonLoader height={60} />
            <SkeletonLoader height={60} />
          </View>
        </View>
      </>
    );
  }

  if (isError || !report) {
    const description = extractErrorMessage(
      reportError ?? detailsError,
      '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
    );
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
        <View
          style={[
            styles.container,
            { backgroundColor: theme.colors.bgMain, padding: theme.spacing.lg },
          ]}
        >
          <EmptyState
            icon={<DollarSign size={32} color={theme.colors.textTertiary} />}
            title="수입 정보를 불러올 수 없습니다"
            description={description}
          />
          <Pressable
            onPress={() => {
              refetchReport();
              refetchDetails();
            }}
            style={[
              styles.retryButton,
              {
                marginTop: theme.spacing.lg,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textOnPrimary,
                textAlign: 'center',
                paddingVertical: theme.spacing.md,
              }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: '수입 리포트' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.bgMain }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: theme.spacing.lg }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 월 선택 네비게이션 */}
          <Animated.View
            entering={FadeInDown.duration(250)}
            style={[
              styles.monthNav,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.md,
                ...theme.shadows.sm,
              },
            ]}
          >
            <Pressable
              onPress={() => changeMonth(-1)}
              hitSlop={12}
              style={styles.monthButton}
              accessibilityLabel="이전 달"
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={theme.colors.textMain} />
            </Pressable>
            <Text
              style={{
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize.lg,
                color: theme.colors.textMain,
              }}
            >
              {formatMonthLabel(currentMonth)}
            </Text>
            <Pressable
              onPress={() => changeMonth(1)}
              hitSlop={12}
              style={styles.monthButton}
              accessibilityLabel="다음 달"
              accessibilityRole="button"
            >
              <ChevronRight size={24} color={theme.colors.textMain} />
            </Pressable>
          </Animated.View>

          {/* 요약 카드 3개 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.summaryRow,
              { gap: theme.spacing.md, marginTop: theme.spacing.xl },
            ]}
          >
            <StatCard
              icon={DollarSign}
              value={incomeAvailable ? formatCurrency(report.totalIncome) : '준비 중'}
              label="총 수입"
              index={0}
              accentColor={theme.colors.primary}
            />
            <StatCard
              icon={FileText}
              value={report.totalSessions}
              label="완료 상담"
              index={1}
              accentColor={theme.colors.accent}
            />
            <StatCard
              icon={Star}
              value={report.avgRating > 0 ? report.avgRating.toFixed(1) : '-'}
              label="평균 평점"
              index={2}
              accentColor={theme.colors.warning}
            />
          </ScrollView>

          {/* 수입 데이터 미제공 안내 (백엔드 결제·정산 API 연동 전) */}
          {!incomeAvailable && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(300)}
              style={[
                styles.infoBanner,
                {
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: theme.borderRadius.lg,
                  marginTop: theme.spacing.lg,
                  padding: theme.spacing.md,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel="수입 금액은 결제·정산 API 연동 후 표시됩니다"
            >
              <Text
                style={{
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                수입 금액은 결제·정산 연동 후 표시됩니다. 현재는 완료된 상담 건수와 평점만
                제공됩니다.
              </Text>
            </Animated.View>
          )}

          {/* 월별 추이 바 차트 (수입 미제공 시 완료 상담 건수 기준) */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(300)}
            style={[
              styles.chartSection,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.xl,
                ...theme.shadows.sm,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <BarChart3 size={18} color={theme.colors.primary} />
              <Text
                style={[
                  theme.textStyles.h3,
                  { color: theme.colors.textMain, marginLeft: theme.spacing.sm },
                ]}
              >
                {incomeAvailable ? '월별 수입 추이' : '월별 상담 건수'}
              </Text>
            </View>
            <View style={styles.chartContainer}>
              {report.monthlyTrend.map((item, idx) => (
                <AnimatedBar
                  key={item.month}
                  item={item}
                  maxValue={maxBarValue}
                  isCurrent={item.month === currentMonth}
                  index={idx}
                  showAmount={incomeAvailable}
                />
              ))}
            </View>
          </Animated.View>

          {/* 상담 유형별 분포 */}
          {report.sessionTypeDistribution.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(300)}
              style={[
                styles.chartSection,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.xl,
                  padding: theme.spacing.lg,
                  marginTop: theme.spacing.lg,
                  ...theme.shadows.sm,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <TrendingUp size={18} color={theme.colors.accent} />
                <Text
                  style={[
                    theme.textStyles.h3,
                    {
                      color: theme.colors.textMain,
                      marginLeft: theme.spacing.sm,
                    },
                  ]}
                >
                  상담 유형별 분포
                </Text>
              </View>
              {report.sessionTypeDistribution.map((item) => (
                <TypeDistributionBar
                  key={item.type}
                  item={item}
                  maxValue={maxTypeValue}
                  showAmount={incomeAvailable}
                />
              ))}
            </Animated.View>
          )}

          {/* 상세 내역 */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(300)}
            style={{ marginTop: theme.spacing.xl }}
          >
            <View style={styles.sectionHeader}>
              <FileText size={18} color={theme.colors.primary} />
              <Text
                style={[
                  theme.textStyles.h3,
                  { color: theme.colors.textMain, marginLeft: theme.spacing.sm },
                ]}
              >
                상세 내역
              </Text>
            </View>

            {details && details.length > 0 ? (
              details.map((item, idx) => (
                <DetailListItem
                  key={item.id}
                  item={item}
                  index={idx}
                  showAmount={incomeAvailable}
                />
              ))
            ) : (
              <EmptyState
                icon={<DollarSign size={32} color={theme.colors.textTertiary} />}
                title="이번 달 상담 내역이 없습니다"
                description={
                  incomeAvailable
                    ? '상담이 완료되면 수입 내역이 표시됩니다'
                    : '상담이 완료되면 상세 내역이 표시됩니다'
                }
              />
            )}
          </Animated.View>

          <View style={{ height: theme.spacing['3xl'] }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    padding: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingRight: 4,
  },
  summarySkeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartSection: {},
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    minHeight: 4,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBarTrack: {
    height: 8,
    width: '100%',
  },
  typeBar: {
    height: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flex: 1,
    marginRight: 12,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  retryButton: {
    overflow: 'hidden',
  },
  infoBanner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
