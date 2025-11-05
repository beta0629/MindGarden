/**
 * 급여 관리 화면
 *
 * 웹의 frontend/src/components/admin/SalaryManagement.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { DollarSign, Users, Calendar, FileText, TrendingUp, CheckCircle, AlertTriangle, Calculator } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../api/client';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const SalaryManagement = () => {
  const { user } = useSession();
  const [salaryData, setSalaryData] = useState({
    totalEmployees: 0,
    totalSalaryBudget: 0,
    averageSalary: 0,
    pendingSalaries: 0,
    paidSalaries: 0,
    salaryHistory: [],
    upcomingPayments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // 'current', 'last_month', 'next_month'

  // 급여 데이터 로드
  const loadSalaryData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 급여 데이터 조회 (API가 없으므로 기본값 사용)
      const mockData = {
        totalEmployees: 45,
        totalSalaryBudget: 450000000,
        averageSalary: 10000000,
        pendingSalaries: 3,
        paidSalaries: 42,
        salaryHistory: [
          { id: 1, employeeName: '김상담', amount: 9500000, status: 'PAID', payDate: '2024-01-25' },
          { id: 2, employeeName: '이상담', amount: 8800000, status: 'PAID', payDate: '2024-01-25' },
          { id: 3, employeeName: '박상담', amount: 10500000, status: 'PENDING', payDate: '2024-02-25' },
        ],
        upcomingPayments: [
          { id: 1, employeeName: '최상담', amount: 9200000, dueDate: '2024-02-10' },
          { id: 2, employeeName: '정상담', amount: 9800000, dueDate: '2024-02-10' },
        ],
      };

      setSalaryData(mockData);
    } catch (error) {
      console.error('급여 데이터 로드 실패:', error);
      setError(STRINGS.ERROR.LOAD_FAILED || '급여 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSalaryData();
  }, [loadSalaryData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSalaryData();
  }, [loadSalaryData]);

  // 금액 포맷
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 급여 지급 처리
  const processSalaryPayment = async (salaryId) => {
    try {
      // 실제로는 API 호출
      // const response = await apiPost('/api/admin/salaries/pay', { salaryId });

      // 로컬 상태 업데이트 (모의)
      setSalaryData(prev => ({
        ...prev,
        salaryHistory: prev.salaryHistory.map(salary =>
          salary.id === salaryId ? { ...salary, status: 'PAID' } : salary
        ),
        pendingSalaries: prev.pendingSalaries - 1,
        paidSalaries: prev.paidSalaries + 1,
      }));

      // 성공 알림
      console.log('급여 지급 완료');
    } catch (error) {
      console.error('급여 지급 실패:', error);
    }
  };

  // 기간 옵션
  const periodOptions = [
    { value: 'current', label: STRINGS.SALARY.CURRENT_MONTH || '이번 달' },
    { value: 'last_month', label: STRINGS.SALARY.LAST_MONTH || '지난 달' },
    { value: 'next_month', label: STRINGS.SALARY.NEXT_MONTH || '다음 달' },
  ];

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.SALARY_MANAGEMENT}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.ADMIN.SALARY_MANAGEMENT}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 기간 선택 */}
        <DashboardSection title={STRINGS.COMMON.FILTER} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.periodSelector}>
            <Text style={styles.selectorLabel}>{STRINGS.SALARY.PERIOD || '기간'}:</Text>
            <View style={styles.periodButtons}>
              {periodOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.periodButton,
                    selectedPeriod === option.value && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(option.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === option.value && styles.periodButtonTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </DashboardSection>

        {/* 급여 통계 */}
        <View style={styles.salaryStats}>
          <StatCard
            icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={salaryData.totalEmployees.toString()}
            label={STRINGS.SALARY.TOTAL_EMPLOYEES || '총 직원 수'}
            style={styles.statCard}
          />
          <StatCard
            icon={<DollarSign size={SIZES.ICON.LG} color={COLORS.success} />}
            value={formatCurrency(salaryData.totalSalaryBudget)}
            label={STRINGS.SALARY.TOTAL_BUDGET || '총 급여 예산'}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.info} />}
            value={formatCurrency(salaryData.averageSalary)}
            label={STRINGS.SALARY.AVERAGE_SALARY || '평균 급여'}
            style={styles.statCard}
          />
          <StatCard
            icon={<AlertTriangle size={SIZES.ICON.LG} color={COLORS.warning} />}
            value={salaryData.pendingSalaries.toString()}
            label={STRINGS.SALARY.PENDING_PAYMENTS || '대기 급여'}
            style={styles.statCard}
          />
        </View>

        {/* 예정된 급여 지급 */}
        {salaryData.upcomingPayments.length > 0 && (
          <DashboardSection title={STRINGS.SALARY.UPCOMING_PAYMENTS || '예정된 급여 지급'} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
            <View style={styles.upcomingPayments}>
              {salaryData.upcomingPayments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.employeeName}>{payment.employeeName}</Text>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.dueDate}>
                      {STRINGS.SALARY.DUE_DATE || '지급 예정일'}: {payment.dueDate}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => processSalaryPayment(payment.id)}
                  >
                    <CheckCircle size={SIZES.ICON.SM} color={COLORS.success} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </DashboardSection>
        )}

        {/* 급여 내역 */}
        <DashboardSection title={STRINGS.SALARY.SALARY_HISTORY || '급여 내역'} icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {salaryData.salaryHistory.length > 0 ? (
            <View style={styles.salaryHistory}>
              {salaryData.salaryHistory.map((salary) => (
                <View key={salary.id} style={styles.salaryItem}>
                  <View style={styles.salaryInfo}>
                    <Text style={styles.employeeName}>{salary.employeeName}</Text>
                    <Text style={styles.salaryAmount}>{formatCurrency(salary.amount)}</Text>
                    <Text style={styles.payDate}>
                      {STRINGS.SALARY.PAY_DATE || '지급일'}: {salary.payDate}
                    </Text>
                  </View>
                  <View style={styles.salaryStatus}>
                    <Text style={[
                      styles.statusText,
                      salary.status === 'PAID' ? styles.statusPaid : styles.statusPending,
                    ]}>
                      {salary.status === 'PAID' ? STRINGS.SALARY.PAID : STRINGS.SALARY.PENDING}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FileText size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.SALARY.NO_SALARY_HISTORY || '급여 내역이 없습니다.'}</Text>
            </View>
          )}
        </DashboardSection>

        {/* 액션 버튼들 */}
        <View style={styles.actionsContainer}>
          <MGButton
            variant="primary"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 급여 계산
              // navigation.navigate(ADMIN_SCREENS.CALCULATE_SALARY);
            }}
            style={styles.actionButton}
          >
            <View style={styles.actionButtonContent}>
              <Calculator size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{STRINGS.SALARY.CALCULATE_SALARY || '급여 계산'}</Text>
            </View>
          </MGButton>

          <MGButton
            variant="success"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 급여 일괄 지급
              // navigation.navigate(ADMIN_SCREENS.BATCH_PAYMENT);
            }}
            style={styles.actionButton}
          >
            <View style={styles.actionButtonContent}>
              <DollarSign size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{STRINGS.SALARY.BATCH_PAYMENT || '일괄 지급'}</Text>
            </View>
          </MGButton>

          <MGButton
            variant="info"
            size="medium"
            fullWidth
            onPress={() => {
              // TODO: 급여 보고서
              // navigation.navigate(ADMIN_SCREENS.SALARY_REPORT);
            }}
            style={styles.actionButton}
          >
            <View style={styles.actionButtonContent}>
              <FileText size={SIZES.ICON.MD} color={COLORS.white} />
              <Text style={styles.actionButtonText}>{STRINGS.SALARY.SALARY_REPORT || '급여 보고서'}</Text>
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
  periodSelector: {
    gap: SPACING.sm,
  },
  selectorLabel: {
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
  salaryStats: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  upcomingPayments: {
    gap: SPACING.sm,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  dueDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  payButton: {
    padding: SPACING.sm,
  },
  salaryHistory: {
    gap: SPACING.sm,
  },
  salaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  salaryInfo: {
    flex: 1,
  },
  salaryAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  payDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  salaryStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusPaid: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  statusPending: {
    backgroundColor: COLORS.warningLight,
    color: COLORS.warning,
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

export default SalaryManagement;

