/**
 * 재무 관리 화면
 *
 * 웹의 frontend/src/components/admin/FinancialManagement.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, Calendar, FileText, AlertTriangle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import StatCard from '../../components/StatCard';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { FINANCIAL_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const FinancialManagement = () => {
  const { user } = useSession();
  const [financialData, setFinancialData] = useState({
    summary: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
    },
    monthlyData: [], // 월별 데이터 배열로 변경
    transactions: [],
    pendingPayments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'transactions', 'report'
  const [reportPeriod, setReportPeriod] = useState('monthly'); // 'daily', 'monthly', 'yearly'
  const [transactionFilters, setTransactionFilters] = useState({
    transactionType: 'ALL',
    category: 'ALL',
    searchText: '',
  });
  const [displayTransactions, setDisplayTransactions] = useState([]);

  // 재무 데이터 로드
  const loadFinancialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 웹과 동일한 방식: financial-transactions API를 호출하여 클라이언트에서 통계 계산
      try {
        // 웹과 동일: 거래 데이터를 받아서 클라이언트에서 통계 계산
        const response = await apiGet(`${FINANCIAL_API.GET_ADMIN_TRANSACTIONS}?page=0&size=1000`);
        
        console.log('📡 재무 거래 API 응답:', {
          success: response?.success,
          dataType: typeof response?.data,
          isArray: Array.isArray(response?.data),
          dataLength: Array.isArray(response?.data) ? response.data.length : 'N/A',
          sample: response?.data?.[0],
        });
        
        if (response?.success && response?.data) {
          // API 응답 구조 확인: 배열이 직접 올 수도 있고, content 안에 있을 수도 있음
          let transactions = [];
          if (Array.isArray(response.data)) {
            transactions = response.data;
          } else if (Array.isArray(response.data.content)) {
            transactions = response.data.content;
          } else if (Array.isArray(response.data.data)) {
            transactions = response.data.data;
          }
          
          console.log('✅ 거래 데이터 추출:', transactions.length, '개');
          
          // 유효한 거래만 필터링
          const validTransactions = transactions.filter(transaction => {
            if (!transaction?.transactionDate) return false;
            return transaction.status !== 'REJECTED' && 
                   transaction.status !== 'CANCELLED';
          });
          
          // 월별로 그룹화
          const monthlyGrouped = {};
          validTransactions.forEach(transaction => {
            const transactionDate = new Date(transaction.transactionDate);
            const year = transactionDate.getFullYear();
            const month = transactionDate.getMonth() + 1;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            
            if (!monthlyGrouped[monthKey]) {
              monthlyGrouped[monthKey] = {
                year,
                month,
                revenue: 0,
                expenses: 0,
                profit: 0,
              };
            }
            
            const amount = parseFloat(transaction.amount) || 0;
            if (transaction.transactionType === 'INCOME') {
              monthlyGrouped[monthKey].revenue += amount;
            } else if (transaction.transactionType === 'EXPENSE') {
              monthlyGrouped[monthKey].expenses += amount;
            }
          });
          
          // 각 월의 순이익 계산
          Object.keys(monthlyGrouped).forEach(key => {
            monthlyGrouped[key].profit = monthlyGrouped[key].revenue - monthlyGrouped[key].expenses;
          });
          
          // 월별 데이터를 배열로 변환하고 최신순으로 정렬
          const monthlyDataArray = Object.values(monthlyGrouped)
            .sort((a, b) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            })
            .slice(0, 6); // 최근 6개월만 표시
          
          // 전체 요약 (모든 월 합계)
          const totalRevenue = monthlyDataArray.reduce((sum, m) => sum + m.revenue, 0);
          const totalExpenses = monthlyDataArray.reduce((sum, m) => sum + m.expenses, 0);
          const netProfit = totalRevenue - totalExpenses;
          const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
          
          // 웹과 동일한 구조로 데이터 설정
          setFinancialData({
            summary: {
              totalRevenue,
              totalExpenses,
              netProfit,
              profitMargin,
            },
            monthlyData: monthlyDataArray, // 월별 데이터 배열
            transactions: transactions, // 모든 거래 데이터 저장 (필터링 전)
            pendingPayments: [],
          });
          
          // 거래 내역 필터링 및 표시용 데이터 설정 (모든 거래 포함, 필터는 UI에서만 적용)
          // 통계에는 validTransactions를 사용하지만, 거래 내역 표시에는 모든 거래를 보여줌
          console.log('📊 거래 내역 설정 - 전체 거래:', transactions.length, '개');
          filterAndSetTransactions(transactions);
        } else {
          // API 응답이 없거나 실패한 경우 기본값 사용
          setFinancialData({
            summary: {
              totalRevenue: 0,
              totalExpenses: 0,
              netProfit: 0,
              profitMargin: 0,
            },
            monthlyData: [],
            transactions: [],
            pendingPayments: [],
          });
        }
      } catch (apiError) {
        // API가 존재하지 않거나 에러가 발생한 경우 기본값 사용 (에러 메시지 표시 안 함)
        console.warn('재무 거래 데이터 로드 실패 (기본값 사용):', apiError?.message || 'API 엔드포인트가 없습니다.');
        setFinancialData({
          summary: {
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            profitMargin: 0,
          },
          monthlyData: [],
          transactions: [],
          pendingPayments: [],
        });
      }
    } catch (error) {
      // 예상치 못한 에러만 로그에 남기고 기본값 사용
      console.warn('재무 데이터 로드 실패 (기본값 사용):', error?.message || error);
      // 사용자에게 에러 메시지 표시하지 않음 (기본값으로 계속 진행)
      setFinancialData({
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
        },
        monthlyData: {
          revenue: 0,
          expenses: 0,
          profit: 0,
        },
        transactions: [],
        pendingPayments: [],
        recentInvoices: [],
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // 거래 내역 필터링 함수
  const filterAndSetTransactions = useCallback((transactions) => {
    console.log('📊 거래 내역 필터링 시작:', transactions?.length || 0, '개');
    console.log('📊 첫 번째 거래 샘플:', transactions?.[0]);
    
    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log('⚠️ 거래 데이터가 없거나 배열이 아님');
      setDisplayTransactions([]);
      return;
    }
    
    let filtered = [...transactions]; // 원본 배열 복사
    
    // 거래 유형 필터
    if (transactionFilters.transactionType !== 'ALL') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => t.transactionType === transactionFilters.transactionType);
      console.log('🔍 거래 유형 필터 적용:', transactionFilters.transactionType, `${beforeCount}개 -> ${filtered.length}개`);
    }
    
    // 카테고리 필터
    if (transactionFilters.category !== 'ALL') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(t => t.category === transactionFilters.category);
      console.log('🔍 카테고리 필터 적용:', transactionFilters.category, `${beforeCount}개 -> ${filtered.length}개`);
    }
    
    // 검색 필터
    if (transactionFilters.searchText) {
      const beforeCount = filtered.length;
      const searchLower = transactionFilters.searchText.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      );
      console.log('🔍 검색 필터 적용:', transactionFilters.searchText, `${beforeCount}개 -> ${filtered.length}개`);
    }
    
    // 최신순 정렬 (날짜가 없는 경우도 처리)
    filtered.sort((a, b) => {
      const dateA = a.transactionDate ? new Date(a.transactionDate) : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.transactionDate ? new Date(b.transactionDate) : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
    
    const finalTransactions = filtered.slice(0, 50); // 최대 50개만 표시
    console.log('✅ 필터링 완료:', finalTransactions.length, '개 거래 표시');
    console.log('📊 표시할 거래 샘플:', finalTransactions[0]);
    setDisplayTransactions(finalTransactions);
  }, [transactionFilters]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  useEffect(() => {
    console.log('📊 거래 내역 useEffect 실행:', {
      transactionsCount: financialData.transactions.length,
      filters: transactionFilters,
    });
    
    if (financialData.transactions && financialData.transactions.length > 0) {
      filterAndSetTransactions(financialData.transactions);
    } else {
      console.log('⚠️ 거래 데이터가 비어있음');
      setDisplayTransactions([]);
    }
  }, [transactionFilters, financialData.transactions, filterAndSetTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFinancialData();
  }, [loadFinancialData]);

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

  // 기간 옵션
  const periodOptions = [
    { value: 'week', label: STRINGS.STATISTICS.THIS_WEEK },
    { value: 'month', label: STRINGS.STATISTICS.THIS_MONTH },
    { value: 'quarter', label: STRINGS.STATISTICS.THIS_QUARTER },
    { value: 'year', label: STRINGS.STATISTICS.THIS_YEAR },
  ];

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.ADMIN.FINANCIAL_MANAGEMENT}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getTransactionTypeLabel = (type) => {
    return type === 'INCOME' ? '수입' : '지출';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'PENDING': '대기',
      'APPROVED': '승인',
      'COMPLETED': '완료',
      'REJECTED': '거절',
      'CANCELLED': '취소',
    };
    return statusMap[status] || status;
  };

  return (
    <SimpleLayout title={STRINGS.ADMIN.FINANCIAL_MANAGEMENT}>
      {/* 탭 선택 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => {
            console.log('📑 요약 탭 클릭');
            setActiveTab('summary');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            요약
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => {
            console.log('📑 거래 내역 탭 클릭, 현재 activeTab:', activeTab);
            setActiveTab('transactions');
            console.log('📑 거래 내역 탭 설정 완료');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            거래 내역
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.tabActive]}
          onPress={() => {
            console.log('📑 재무 보고서 탭 클릭');
            setActiveTab('report');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>
            재무 보고서
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {(() => {
          console.log('📊 현재 activeTab:', activeTab);
          return null;
        })()}
        {activeTab === 'summary' ? (
          <>
            {/* 기간 필터 */}
            <DashboardSection title={STRINGS.COMMON.FILTER} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.periodFilter}>
            <Text style={styles.filterLabel}>{STRINGS.STATISTICS.PERIOD}:</Text>
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

        {/* 재무 요약 */}
        <View style={styles.financialSummary}>
          <StatCard
            icon={<DollarSign size={SIZES.ICON.LG} color={COLORS.success} />}
            value={formatCurrency(financialData.summary.totalRevenue)}
            label={STRINGS.FINANCIAL?.TOTAL_REVENUE || '총 매출'}
            style={styles.summaryCard}
          >
            <View style={styles.growthIndicator}>
              <TrendingUp size={SIZES.ICON.SM} color={COLORS.success} />
              <Text style={styles.growthText}>+12.5%</Text>
            </View>
          </StatCard>

          <StatCard
            icon={<Receipt size={SIZES.ICON.LG} color={COLORS.error} />}
            value={formatCurrency(financialData.summary.totalExpenses)}
            label={STRINGS.FINANCIAL?.TOTAL_EXPENSES || '총 지출'}
            style={styles.summaryCard}
          />

          <StatCard
            icon={<TrendingUp size={SIZES.ICON.LG} color={financialData.summary.netProfit >= 0 ? COLORS.success : COLORS.error} />}
            value={formatCurrency(financialData.summary.netProfit)}
            label={STRINGS.FINANCIAL?.NET_PROFIT || '순이익'}
            style={styles.summaryCard}
            iconColor={financialData.summary.netProfit >= 0 ? COLORS.success : COLORS.error}
          />

          <StatCard
            icon={<FileText size={SIZES.ICON.LG} color={COLORS.info} />}
            value={formatPercent(financialData.summary.profitMargin)}
            label={STRINGS.FINANCIAL?.PROFIT_MARGIN || '수익률'}
            style={styles.summaryCard}
          />
        </View>

        {/* 월간 데이터 */}
        <DashboardSection title={STRINGS.FINANCIAL?.MONTHLY_DATA || '월간 데이터'} icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.monthlyData}>
            {financialData.monthlyData.length > 0 ? (
              financialData.monthlyData.map((monthData, index) => (
                <View key={`${monthData.year}-${monthData.month}`} style={styles.monthCard}>
                  <Text style={styles.monthTitle}>{monthData.year}년 {monthData.month}월</Text>
                  <View style={styles.monthDataRow}>
                    <View style={styles.monthDataItem}>
                      <TrendingUp size={SIZES.ICON.XS} color={COLORS.success} />
                      <View style={styles.monthDataContent}>
                        <Text style={styles.monthDataValue}>{formatCurrency(monthData.revenue)}</Text>
                        <Text style={styles.monthDataLabel}>매출</Text>
                      </View>
                    </View>

                    <View style={styles.monthDataItem}>
                      <TrendingDown size={SIZES.ICON.XS} color={COLORS.error} />
                      <View style={styles.monthDataContent}>
                        <Text style={styles.monthDataValue}>{formatCurrency(monthData.expenses)}</Text>
                        <Text style={styles.monthDataLabel}>지출</Text>
                      </View>
                    </View>

                    <View style={styles.monthDataItem}>
                      <DollarSign size={SIZES.ICON.XS} color={COLORS.primary} />
                      <View style={styles.monthDataContent}>
                        <Text style={[
                          styles.monthDataValue,
                          monthData.profit >= 0 ? styles.monthDataValueProfit : styles.monthDataValueLoss
                        ]}>
                          {formatCurrency(monthData.profit)}
                        </Text>
                        <Text style={styles.monthDataLabel}>이익</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyMonthData}>
                <Text style={styles.emptyMonthDataText}>월별 데이터가 없습니다.</Text>
              </View>
            )}
          </View>
        </DashboardSection>

        {/* 대기 결제 */}
        {financialData.pendingPayments.length > 0 && (
          <DashboardSection title={STRINGS.FINANCIAL?.PENDING_PAYMENTS || '대기 결제'} icon={<AlertTriangle size={SIZES.ICON.MD} color={COLORS.warning} />}>
            <View style={styles.pendingPayments}>
              {financialData.pendingPayments.map((payment, index) => (
                <View key={index} style={styles.paymentItem}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                    <Text style={styles.paymentDescription}>{payment.description}</Text>
                    <Text style={styles.paymentDueDate}>{STRINGS.FINANCIAL?.DUE_DATE || '마감일'}: {payment.dueDate}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.processButton}
                    onPress={() => {
                      // TODO: 결제 처리
                      // handleProcessPayment(payment.id);
                    }}
                  >
                    <CreditCard size={SIZES.ICON.SM} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </DashboardSection>
        )}

          </>
        ) : activeTab === 'transactions' ? (
          <>
            {/* 거래 내역 필터 */}
            <DashboardSection title="필터" icon={<Receipt size={SIZES.ICON.MD} color={COLORS.primary} />}>
              <View style={styles.filterSection}>
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>거래 유형</Text>
                  <View style={styles.filterButtons}>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        transactionFilters.transactionType === 'ALL' && styles.filterButtonActive,
                      ]}
                      onPress={() => setTransactionFilters(prev => ({ ...prev, transactionType: 'ALL' }))}
                    >
                      <Text style={[styles.filterButtonText, transactionFilters.transactionType === 'ALL' && styles.filterButtonTextActive]}>
                        전체
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        transactionFilters.transactionType === 'INCOME' && styles.filterButtonActive,
                      ]}
                      onPress={() => setTransactionFilters(prev => ({ ...prev, transactionType: 'INCOME' }))}
                    >
                      <Text style={[styles.filterButtonText, transactionFilters.transactionType === 'INCOME' && styles.filterButtonTextActive]}>
                        수입
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        transactionFilters.transactionType === 'EXPENSE' && styles.filterButtonActive,
                      ]}
                      onPress={() => setTransactionFilters(prev => ({ ...prev, transactionType: 'EXPENSE' }))}
                    >
                      <Text style={[styles.filterButtonText, transactionFilters.transactionType === 'EXPENSE' && styles.filterButtonTextActive]}>
                        지출
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </DashboardSection>

            {/* 거래 내역 목록 */}
            <DashboardSection title="거래 내역" icon={<Receipt size={SIZES.ICON.MD} color={COLORS.primary} />}>
              {financialData.transactions.length === 0 ? (
                <View style={styles.emptyTransactions}>
                  <Receipt size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                  <Text style={styles.emptyTransactionsText}>거래 데이터를 불러오는 중입니다...</Text>
                </View>
              ) : displayTransactions.length > 0 ? (
                <View style={styles.transactionsList}>
                  {displayTransactions.map((transaction) => (
                    <TouchableOpacity
                      key={transaction.id}
                      style={styles.transactionItem}
                      onPress={() => {
                        console.log('💰 거래 클릭:', transaction.id);
                        // TODO: 거래 상세 모달 표시
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionId}>#{transaction.id}</Text>
                          <Text style={[
                            styles.transactionType,
                            transaction.transactionType === 'INCOME' ? styles.transactionTypeIncome : styles.transactionTypeExpense
                          ]}>
                            {getTransactionTypeLabel(transaction.transactionType)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.transactionAmount,
                          transaction.transactionType === 'INCOME' ? styles.transactionAmountIncome : styles.transactionAmountExpense
                        ]}>
                          {transaction.transactionType === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </Text>
                      </View>
                      {transaction.description && (
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      )}
                      <View style={styles.transactionFooter}>
                        <Text style={styles.transactionCategory}>{transaction.category || '기타'}</Text>
                        <Text style={styles.transactionDate}>{formatDate(transaction.transactionDate)}</Text>
                        <Text style={[
                          styles.transactionStatus,
                          transaction.status === 'COMPLETED' ? styles.transactionStatusCompleted :
                          transaction.status === 'PENDING' ? styles.transactionStatusPending :
                          styles.transactionStatusOther
                        ]}>
                          {getStatusLabel(transaction.status)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyTransactions}>
                  <Receipt size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                  <Text style={styles.emptyTransactionsText}>거래 내역이 없습니다.</Text>
                </View>
              )}
            </DashboardSection>
          </>
        ) : (
          <>
            {/* 재무 보고서 탭 */}
            <DashboardSection title="보고서 기간" icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
              <View style={styles.periodFilter}>
                <View style={styles.periodButtons}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      reportPeriod === 'daily' && styles.periodButtonActive,
                    ]}
                    onPress={() => setReportPeriod('daily')}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      reportPeriod === 'daily' && styles.periodButtonTextActive,
                    ]}>
                      일간
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      reportPeriod === 'monthly' && styles.periodButtonActive,
                    ]}
                    onPress={() => setReportPeriod('monthly')}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      reportPeriod === 'monthly' && styles.periodButtonTextActive,
                    ]}>
                      월간
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      reportPeriod === 'yearly' && styles.periodButtonActive,
                    ]}
                    onPress={() => setReportPeriod('yearly')}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      reportPeriod === 'yearly' && styles.periodButtonTextActive,
                    ]}>
                      년간
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </DashboardSection>

            {/* 보고서 통계 */}
            <DashboardSection title="보고서 요약" icon={<TrendingUp size={SIZES.ICON.MD} color={COLORS.primary} />}>
              {(() => {
                // 기간별 데이터 계산
                const now = new Date();
                let filteredTransactions = financialData.transactions.filter(t => {
                  if (!t.transactionDate) return false;
                  const txDate = new Date(t.transactionDate);
                  
                  if (reportPeriod === 'daily') {
                    return txDate.toDateString() === now.toDateString();
                  } else if (reportPeriod === 'monthly') {
                    return txDate.getFullYear() === now.getFullYear() && 
                           txDate.getMonth() === now.getMonth();
                  } else if (reportPeriod === 'yearly') {
                    return txDate.getFullYear() === now.getFullYear();
                  }
                  return true;
                });

                const revenue = filteredTransactions
                  .filter(t => t.transactionType === 'INCOME')
                  .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
                const expenses = filteredTransactions
                  .filter(t => t.transactionType === 'EXPENSE')
                  .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
                const profit = revenue - expenses;
                const transactionCount = filteredTransactions.length;

                return (
                  <View style={styles.reportSummary}>
                    <View style={styles.reportCard}>
                      <Text style={styles.reportCardLabel}>총 거래 건수</Text>
                      <Text style={styles.reportCardValue}>{transactionCount}건</Text>
                    </View>
                    <View style={styles.reportCard}>
                      <Text style={styles.reportCardLabel}>수입</Text>
                      <Text style={[styles.reportCardValue, styles.reportCardValueIncome]}>
                        {formatCurrency(revenue)}
                      </Text>
                    </View>
                    <View style={styles.reportCard}>
                      <Text style={styles.reportCardLabel}>지출</Text>
                      <Text style={[styles.reportCardValue, styles.reportCardValueExpense]}>
                        {formatCurrency(expenses)}
                      </Text>
                    </View>
                    <View style={styles.reportCard}>
                      <Text style={styles.reportCardLabel}>순이익</Text>
                      <Text style={[
                        styles.reportCardValue,
                        profit >= 0 ? styles.reportCardValueProfit : styles.reportCardValueLoss
                      ]}>
                        {formatCurrency(profit)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </DashboardSection>

            {/* 보고서 상세 */}
            <DashboardSection title="상세 내역" icon={<Receipt size={SIZES.ICON.MD} color={COLORS.primary} />}>
              {(() => {
                const now = new Date();
                let filteredTransactions = financialData.transactions.filter(t => {
                  if (!t.transactionDate) return false;
                  const txDate = new Date(t.transactionDate);
                  
                  if (reportPeriod === 'daily') {
                    return txDate.toDateString() === now.toDateString();
                  } else if (reportPeriod === 'monthly') {
                    return txDate.getFullYear() === now.getFullYear() && 
                           txDate.getMonth() === now.getMonth();
                  } else if (reportPeriod === 'yearly') {
                    return txDate.getFullYear() === now.getFullYear();
                  }
                  return true;
                }).sort((a, b) => {
                  const dateA = new Date(a.transactionDate);
                  const dateB = new Date(b.transactionDate);
                  return dateB.getTime() - dateA.getTime();
                });

                if (filteredTransactions.length === 0) {
                  return (
                    <View style={styles.emptyTransactions}>
                      <FileText size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                      <Text style={styles.emptyTransactionsText}>
                        {reportPeriod === 'daily' ? '일간' : reportPeriod === 'monthly' ? '월간' : '년간'} 보고서 데이터가 없습니다.
                      </Text>
                    </View>
                  );
                }

                return (
                  <View style={styles.transactionsList}>
                    {filteredTransactions.slice(0, 20).map((transaction) => (
                      <View key={transaction.id} style={styles.transactionItem}>
                        <View style={styles.transactionHeader}>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionId}>#{transaction.id}</Text>
                            <Text style={[
                              styles.transactionType,
                              transaction.transactionType === 'INCOME' 
                                ? styles.transactionTypeIncome 
                                : styles.transactionTypeExpense
                            ]}>
                              {getTransactionTypeLabel(transaction.transactionType)}
                            </Text>
                          </View>
                          <Text style={[
                            styles.transactionAmount,
                            transaction.transactionType === 'INCOME' 
                              ? styles.transactionAmountIncome 
                              : styles.transactionAmountExpense
                          ]}>
                            {transaction.transactionType === 'INCOME' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </Text>
                        </View>
                        <Text style={styles.transactionDescription}>
                          {transaction.description || '-'}
                        </Text>
                        <View style={styles.transactionFooter}>
                          <Text style={styles.transactionCategory}>
                            {transaction.category || '-'}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {formatDate(transaction.transactionDate)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </DashboardSection>
          </>
        )}
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
  financialSummary: {
    flexDirection: 'column',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    width: '100%',
    margin: 0,
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
  monthlyData: {
    gap: SPACING.md,
  },
  monthCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.sm,
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  monthDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  monthDataItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  monthDataContent: {
    flex: 1,
  },
  monthDataValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  monthDataValueProfit: {
    color: COLORS.success,
  },
  monthDataValueLoss: {
    color: COLORS.error,
  },
  monthDataLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  emptyMonthData: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMonthDataText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  dataItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
    minWidth: 80,
  },
  dataContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  dataValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  dataLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
    textAlign: 'center',
  },
  pendingPayments: {
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
  paymentAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  paymentDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  paymentDueDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  processButton: {
    padding: SPACING.sm,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray600,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  filterSection: {
    gap: SPACING.md,
  },
  filterRow: {
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  transactionsList: {
    gap: SPACING.sm,
  },
  transactionItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    marginBottom: SPACING.sm,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  transactionId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.gray600,
  },
  transactionType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  transactionTypeIncome: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  transactionTypeExpense: {
    backgroundColor: COLORS.errorLight,
    color: COLORS.error,
  },
  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  transactionAmountIncome: {
    color: COLORS.success,
  },
  transactionAmountExpense: {
    color: COLORS.error,
  },
  transactionDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  transactionCategory: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  transactionDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  transactionStatus: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  transactionStatusCompleted: {
    backgroundColor: COLORS.successLight,
    color: COLORS.success,
  },
  transactionStatusPending: {
    backgroundColor: COLORS.warningLight,
    color: COLORS.warning,
  },
  transactionStatusOther: {
    backgroundColor: COLORS.gray100,
    color: COLORS.gray600,
  },
  emptyTransactions: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTransactionsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
  reportSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  reportCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    alignItems: 'center',
  },
  reportCardLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  reportCardValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  reportCardValueIncome: {
    color: COLORS.success,
  },
  reportCardValueExpense: {
    color: COLORS.error,
  },
  reportCardValueProfit: {
    color: COLORS.success,
  },
  reportCardValueLoss: {
    color: COLORS.error,
  },
});

export default FinancialManagement;

