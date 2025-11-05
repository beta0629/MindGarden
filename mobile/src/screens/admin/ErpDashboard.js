/**
 * ERP 대시보드 화면
 *
 * 웹의 frontend/src/components/admin/ErpDashboard.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Settings, FileText, DollarSign, Users, Building, TrendingUp, Calendar, AlertTriangle, Package, Clock, ShoppingCart } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { ERP_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ErpDashboard = () => {
  const { user } = useSession();
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalOrders: 0,
    totalBudget: 0,
    usedBudget: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ERP 데이터 로드 (웹과 동일한 방식)
  const loadErpData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 웹과 동일: 4개의 API를 병렬로 호출
      const [itemsResponse, pendingResponse, ordersResponse, budgetsResponse] = await Promise.all([
        apiGet(ERP_API.ITEMS),
        apiGet(ERP_API.PURCHASE_REQUESTS_PENDING_ADMIN),
        apiGet(ERP_API.PURCHASE_ORDERS),
        apiGet(ERP_API.BUDGETS),
      ]);

      // 데이터 추출
      const itemsData = itemsResponse?.data || [];
      const pendingData = pendingResponse?.data || [];
      const ordersData = ordersResponse?.data || [];
      const budgetsData = budgetsResponse?.data || [];

      // 예산 계산 (웹과 동일)
      const totalBudget = Array.isArray(budgetsData) 
        ? budgetsData.reduce((sum, budget) => sum + parseFloat(budget.totalBudget || 0), 0) 
        : 0;
      const usedBudget = Array.isArray(budgetsData)
        ? budgetsData.reduce((sum, budget) => sum + parseFloat(budget.usedBudget || 0), 0)
        : 0;

      // 통계 설정 (웹과 동일)
      setStats({
        totalItems: Array.isArray(itemsData) ? itemsData.length : 0,
        pendingRequests: Array.isArray(pendingData) ? pendingData.length : 0,
        approvedRequests: 0,
        totalOrders: Array.isArray(ordersData) ? ordersData.length : 0,
        totalBudget: totalBudget,
        usedBudget: usedBudget,
      });
    } catch (error) {
      console.error('ERP 데이터 로드 실패:', error);
      // 에러 발생 시 기본값 설정
      setStats({
        totalItems: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        totalOrders: 0,
        totalBudget: 0,
        usedBudget: 0,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadErpData();
  }, [loadErpData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadErpData();
  }, [loadErpData]);

  // 금액 포맷
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 퍼센트 포맷
  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // 예산 사용률 계산 (웹과 동일)
  const getBudgetUsagePercentage = () => {
    if (stats.totalBudget === 0) return 0;
    return Math.round((stats.usedBudget / stats.totalBudget) * 100);
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.ERP_DASHBOARD}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.ERP_DASHBOARD}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 통계 카드 (웹과 동일) */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<FileText size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={stats.totalItems.toLocaleString()}
            label="총 아이템 수"
            style={styles.statCard}
          />
          <StatCard
            icon={<Calendar size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={stats.pendingRequests.toLocaleString()}
            label="승인 대기 요청"
            style={styles.statCard}
          />
          <StatCard
            icon={<Settings size={SIZES.ICON.LG} color={COLORS.success} />}
            value={stats.totalOrders.toLocaleString()}
            label="총 주문 수"
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.info} />}
            value={`${getBudgetUsagePercentage()}%`}
            label="예산 사용률"
            style={styles.statCard}
          >
            <Text style={styles.budgetDetail}>
              {formatCurrency(stats.usedBudget)} / {formatCurrency(stats.totalBudget)}
            </Text>
          </StatCard>
        </View>

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <MGButton
            variant="primary"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 재무 관리 화면으로 이동
              // navigation.navigate(ADMIN_SCREENS.FINANCIAL);
            }}
            style={styles.quickActionButton}
          >
            <View style={styles.quickActionContent}>
              <DollarSign size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.quickActionText}>{STRINGS.ADMIN.FINANCIAL_MANAGEMENT}</Text>
            </View>
          </MGButton>

          <MGButton
            variant="success"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 급여 관리 화면으로 이동
              // navigation.navigate(ADMIN_SCREENS.SALARY);
            }}
            style={styles.quickActionButton}
          >
            <View style={styles.quickActionContent}>
              <Users size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.quickActionText}>{STRINGS.ADMIN.SALARY_MANAGEMENT}</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 0,
  },
  budgetDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginTop: SPACING.xs,
  },
  financialStats: {
    gap: SPACING.md,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  financialItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  financialContent: {
    flex: 1,
  },
  financialValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  financialLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  alertsContainer: {
    gap: SPACING.sm,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: SIZES.BORDER_WIDTH.THIN,
    borderColor: COLORS.warning,
  },
  alertText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  alertTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
  activitiesContainer: {
    gap: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  activityDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  pendingTasks: {
    gap: SPACING.md,
  },
  pendingTaskCard: {
    marginBottom: 0,
  },
  taskActions: {
    gap: SPACING.sm,
  },
  taskButton: {
    marginBottom: 0,
  },
  taskButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  taskButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  quickActions: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  quickActionButton: {
    marginBottom: 0,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  quickActionText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default ErpDashboard;

