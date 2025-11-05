/**
 * 통계 대시보드 화면
 *
 * 웹의 frontend/src/components/admin/StatisticsDashboard.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { BarChart3, TrendingUp, Users, Calendar, FileText, Star, DollarSign, PieChart } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { DASHBOARD_API, RATING_API, FINANCIAL_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const StatisticsDashboard = () => {
  const { user } = useSession();
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalConsultants: 0,
    totalClients: 0,
    totalSessions: 0,
    totalMappings: 0,
    totalRevenue: 0,
    averageRating: 0,
    completionRate: 0,
    monthlyGrowth: {
      users: 0,
      sessions: 0,
      revenue: 0,
    },
    chartData: {
      userGrowth: [],
      sessionTrends: [],
      revenueTrends: [],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // 'week', 'month', 'quarter', 'year'

  // 통계 데이터 로드
  const loadStatistics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 여러 API를 동시에 호출하여 통계 데이터 수집 (일부 실패해도 계속 진행)
      // 각 API 호출을 안전하게 래핑하는 헬퍼 함수
      const safeApiGet = async (url, apiName) => {
        try {
          return await apiGet(url);
        } catch (err) {
          // 에러 발생 시 조용히 기본값 반환 (콘솔에만 로그)
          console.warn(`${apiName} 로드 실패 (기본값 사용):`, err?.message || err?.data?.message || '알 수 없는 오류');
          return { success: false, data: {} };
        }
      };

      // 웹과 동일한 방식: financial-transactions API를 호출하여 클라이언트에서 통계 계산
      const results = await Promise.allSettled([
        safeApiGet(DASHBOARD_API.ADMIN, '대시보드 데이터'),
        safeApiGet('/api/ratings/admin/statistics', '평가 통계'),
        safeApiGet('/api/admin/financial-transactions?page=0&size=1000', '재무 거래 데이터'),
        safeApiGet('/api/admin/sessions/statistics', '세션 통계'),
      ]);

      const [
        dashboardRes,
        ratingStatsRes,
        financialTransactionsRes,
        sessionStatsRes,
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { success: false, data: {} });

      // 데이터 합산 및 가공 (에러가 발생해도 기본값 사용)
      const dashboardData = dashboardRes?.data || {};
      const ratingData = ratingStatsRes?.data || {};
      const transactionsData = financialTransactionsRes?.data || [];
      const sessionData = sessionStatsRes?.data || {};

      // 웹과 동일한 방식: 거래 데이터에서 통계 계산
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // 이번 달 거래만 필터링
      const thisMonthTransactions = Array.isArray(transactionsData) ? transactionsData.filter(transaction => {
        if (!transaction?.transactionDate) return false;
        const transactionDate = new Date(transaction.transactionDate);
        return transactionDate.getFullYear() === currentYear && 
               transactionDate.getMonth() + 1 === currentMonth &&
               transaction.status !== 'REJECTED' && 
               transaction.status !== 'CANCELLED';
      }) : [];
      
      const totalRevenue = thisMonthTransactions
        .filter(t => t.transactionType === 'INCOME')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      const totalExpenses = thisMonthTransactions
        .filter(t => t.transactionType === 'EXPENSE')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      // 평균 평점 계산 (모든 상담사의 평균)
      const avgRating = Array.isArray(ratingData)
        ? (ratingData.length > 0 
        ? ratingData.reduce((sum, consultant) => sum + (consultant.averageRating || 0), 0) / ratingData.length
          : 0)
        : (ratingData?.averageRating || 0);

      // 완료율 계산 (세션 데이터 구조에 맞게 수정)
      const totalSessions = sessionData.totalSessions || sessionData.total || 0;
      const completedSessions = sessionData.completedSessions || sessionData.completed || 0;
      const completionRate = totalSessions > 0
        ? (completedSessions / totalSessions) * 100
        : 0;

      setStatistics({
        totalUsers: dashboardData.totalUsers || 0,
        totalConsultants: dashboardData.totalConsultants || 0,
        totalClients: dashboardData.totalClients || 0,
        totalSessions: totalSessions,
        totalMappings: dashboardData.totalMappings || 0,
        totalRevenue: totalRevenue, // 웹과 동일한 방식으로 계산된 수입
        averageRating: avgRating || 0,
        completionRate: completionRate || 0,
        monthlyGrowth: {
          users: dashboardData.monthlyUserGrowth || 0,
          sessions: sessionData.monthlySessionGrowth || sessionData.monthlyGrowth || 0,
          revenue: 0, // 월별 성장률은 추가 계산 필요
        },
        chartData: {
          userGrowth: dashboardData.userGrowthChart || [],
          sessionTrends: sessionData.sessionTrendsChart || sessionData.trends || [],
          revenueTrends: [], // 거래 데이터에서 차트 데이터 생성 필요 시 추가
        },
      });
    } catch (error) {
      // 전체 통계 로드 실패 시에만 에러 표시 (개별 API 실패는 이미 처리됨)
      console.error('통계 데이터 로드 실패:', error);
      // 일부 API 실패는 정상이므로 에러 메시지 표시하지 않음
      // setError(STRINGS.ERROR.LOAD_FAILED || '통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStatistics();
  }, [loadStatistics]);

  // 성장률 표시
  const formatGrowth = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // 금액 포맷
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 기간 필터 옵션
  const periodOptions = [
    { value: 'week', label: STRINGS.STATISTICS.THIS_WEEK || '이번 주' },
    { value: 'month', label: STRINGS.STATISTICS.THIS_MONTH || '이번 달' },
    { value: 'quarter', label: STRINGS.STATISTICS.THIS_QUARTER || '이번 분기' },
    { value: 'year', label: STRINGS.STATISTICS.THIS_YEAR || '올해' },
  ];

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.STATISTICS_DASHBOARD}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.STATISTICS_DASHBOARD}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 기간 필터 */}
        <DashboardSection title={STRINGS.COMMON.FILTER} icon={<BarChart3 size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.periodFilter}>
            <Text style={styles.filterLabel}>{STRINGS.STATISTICS.PERIOD || '기간'}:</Text>
            <View style={styles.periodButtons}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.periodButton,
                    period === option.value && styles.periodButtonActive,
                  ]}
                  onPress={() => setPeriod(option.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    period === option.value && styles.periodButtonTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </DashboardSection>

        {/* 주요 지표 */}
        <View style={styles.metricsContainer}>
          <StatCard
            icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={statistics.totalUsers.toString()}
            label={STRINGS.ADMIN.TOTAL_USERS}
            style={styles.metricCard}
          >
            <View style={styles.growthIndicator}>
              <TrendingUp size={SIZES.ICON.SM} color={COLORS.success} />
              <Text style={styles.growthText}>{formatGrowth(statistics.monthlyGrowth.users)}</Text>
            </View>
          </StatCard>

          <StatCard
            icon={<Calendar size={SIZES.ICON.LG} color={COLORS.info} />}
            value={statistics.totalSessions.toString()}
            label={STRINGS.SESSION.TOTAL_SESSIONS}
            style={styles.metricCard}
          >
            <View style={styles.growthIndicator}>
              <TrendingUp size={SIZES.ICON.SM} color={COLORS.success} />
              <Text style={styles.growthText}>{formatGrowth(statistics.monthlyGrowth.sessions)}</Text>
            </View>
          </StatCard>

          <StatCard
            icon={<DollarSign size={SIZES.ICON.LG} color={COLORS.success} />}
            value={formatCurrency(statistics.totalRevenue)}
            label={STRINGS.STATISTICS.TOTAL_REVENUE || '총 매출'}
            style={styles.metricCard}
          >
            <View style={styles.growthIndicator}>
              <TrendingUp size={SIZES.ICON.SM} color={COLORS.success} />
              <Text style={styles.growthText}>{formatGrowth(statistics.monthlyGrowth.revenue)}</Text>
            </View>
          </StatCard>

          <StatCard
            icon={<Star size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={statistics.averageRating.toFixed(1)}
            label={STRINGS.CONSULTANT.AVERAGE_RATING}
            style={styles.metricCard}
          />
        </View>

        {/* 상세 통계 */}
        <DashboardSection title={STRINGS.STATISTICS.DETAILED_STATS || '상세 통계'} icon={<PieChart size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.detailedStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Users size={SIZES.ICON.MD} color={COLORS.primary} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{statistics.totalConsultants}</Text>
                  <Text style={styles.statLabel}>{STRINGS.ADMIN.TOTAL_CONSULTANTS}</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <Users size={SIZES.ICON.MD} color={COLORS.info} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{statistics.totalClients}</Text>
                  <Text style={styles.statLabel}>{STRINGS.ADMIN.TOTAL_CLIENTS}</Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <FileText size={SIZES.ICON.MD} color={COLORS.success} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{statistics.completionRate.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>{STRINGS.CONSULTANT.COMPLETION_RATE}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <BarChart3 size={SIZES.ICON.MD} color={COLORS.warning} />
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{statistics.totalMappings}</Text>
                  <Text style={styles.statLabel}>{STRINGS.ADMIN.TOTAL_MAPPINGS}</Text>
                </View>
              </View>
            </View>
          </View>
        </DashboardSection>

        {/* 차트 섹션 (플레이스홀더) */}
        <DashboardSection title={STRINGS.STATISTICS.CHARTS || '차트 분석'} icon={<BarChart3 size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.chartPlaceholder}>
            <BarChart3 size={SIZES.ICON['3XL']} color={COLORS.gray400} />
            <Text style={styles.chartPlaceholderText}>
              {STRINGS.STATISTICS.CHART_PLACEHOLDER || '차트 기능은 추후 구현 예정입니다.'}
            </Text>
            <Text style={styles.chartPlaceholderSubText}>
              {STRINGS.STATISTICS.CHART_DESCRIPTION || '사용자 성장, 세션 트렌드, 매출 추이 등의 시각적 분석을 제공합니다.'}
            </Text>
          </View>
        </DashboardSection>

        {/* 액션 버튼 */}
        <View style={styles.actionsContainer}>
          <MGButton
            variant="primary"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 상세 보고서 생성
              // navigation.navigate(ADMIN_SCREENS.STATISTICS_REPORT);
            }}
            style={styles.actionButton}
          >
            <View style={styles.actionButtonContent}>
              <FileText size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{STRINGS.STATISTICS.GENERATE_REPORT || '보고서 생성'}</Text>
            </View>
          </MGButton>

          <MGButton
            variant="secondary"
            size="medium"
            fullWidth
            onPress={onRefresh}
            style={styles.actionButton}
          >
            <View style={styles.actionButtonContent}>
              <TrendingUp size={SIZES.ICON.MD} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>{STRINGS.STATISTICS.REFRESH_DATA || '데이터 새로고침'}</Text>
            </View>
          </MGButton>
        </View>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  periodFilter: {
    gap: SPACING.sm,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  periodButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  periodButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  periodButtonTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  metricsContainer: {
    marginBottom: SPACING.lg,
  },
  metricCard: {
    marginBottom: SPACING.sm,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  growthText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  detailedStats: {
    gap: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  chartPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  chartPlaceholderSubText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  actionButton: {
    marginBottom: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default StatisticsDashboard;

