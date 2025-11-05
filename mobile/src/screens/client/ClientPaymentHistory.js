/**
 * 내담자 결제 내역 화면
 * 
 * 웹의 frontend/src/components/client/ClientPaymentHistory.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { FINANCIAL_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const ClientPaymentHistory = () => {
  const { user } = useSession();
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 결제 내역 로드 (웹과 동일한 API 사용)
  const loadPayments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      // 웹과 동일: /api/admin/mappings/client?clientId=${userId}
      const mappingsResponse = await apiGet(`/api/admin/mappings/client?clientId=${user.id}`);
      const mappings = mappingsResponse?.data || [];

      // 매핑 데이터를 결제 내역 형식으로 변환
      const paymentsData = mappings.map((mapping) => ({
        id: mapping.id,
        mappingName: mapping.packageName || mapping.title || '상담 패키지',
        description: mapping.description || '',
        transactionDate: mapping.paymentDate || mapping.createdAt,
        amount: mapping.packagePrice || 0,
        status: mapping.paymentStatus || 'PENDING',
        paymentMethod: mapping.paymentMethod || '',
        totalSessions: mapping.totalSessions || 0,
        usedSessions: mapping.usedSessions || 0,
        remainingSessions: mapping.remainingSessions || 0,
      }));

      // 최신순 정렬
      paymentsData.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

      setPayments(paymentsData);
      const total = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('결제 내역 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPayments();
  }, [loadPayments]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 결제 상태 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return COLORS.success;
      case 'PENDING':
        return COLORS.warning;
      case 'CANCELLED':
        return COLORS.error;
      default:
        return COLORS.gray500;
    }
  };

  // 결제 상태 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED':
        return STRINGS.PAYMENT.STATUS.COMPLETED;
      case 'PENDING':
        return STRINGS.PAYMENT.STATUS.PENDING;
      case 'CANCELLED':
        return STRINGS.PAYMENT.STATUS.CANCELLED;
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CLIENT.PAYMENT_TITLE}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CLIENT.PAYMENT_TITLE}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 통계 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<CreditCard size={SIZES.ICON.LG} color={COLORS.primary} />}
            value={payments.length}
            label={STRINGS.CLIENT.ALL_PAYMENTS}
            style={styles.statCard}
          />
          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={COLORS.success} />}
            value={formatAmount(totalAmount)}
            label={STRINGS.CLIENT.TOTAL_PAYMENT_AMOUNT}
            style={styles.statCard}
          />
        </View>

        {/* 결제 내역 목록 */}
        <DashboardSection title={STRINGS.CLIENT.PAYMENT_TITLE} icon={<CreditCard size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {payments.length > 0 ? (
            <View style={styles.paymentList}>
              {payments.map((payment, index) => (
                <View key={payment.id || index} style={styles.paymentItem}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentTitle}>
                        {payment.mappingName || payment.description || STRINGS.PAYMENT.TITLE}
                      </Text>
                      <View style={styles.paymentDateRow}>
                        <Calendar size={SIZES.ICON.SM} color={COLORS.gray500} />
                        <Text style={styles.paymentDate}>{formatDate(payment.transactionDate)}</Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(payment.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.paymentAmountRow}>
                    <Text style={styles.paymentAmount}>{formatAmount(payment.amount)}</Text>
                    {payment.paymentMethod && (
                      <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <CreditCard size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.CLIENT.NO_PAYMENTS}</Text>
            </View>
          )}
        </DashboardSection>
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
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  paymentList: {
    gap: SPACING.md,
  },
  paymentItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  paymentDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: SIZES.BORDER_WIDTH.MEDIUM,
    borderTopColor: COLORS.border,
  },
  paymentAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  paymentMethod: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.mediumGray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});

export default ClientPaymentHistory;

