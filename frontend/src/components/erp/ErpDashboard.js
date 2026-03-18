import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { RoleUtils } from '../../constants/roles';
import { ERP_API } from '../../constants/api';
import StandardizedApi from '../../utils/standardizedApi';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import {
  ContentArea,
  ContentHeader,
  ContentKpiRow
} from '../dashboard-v2/content';
import { Package, Clock, ShoppingCart, TrendingUp, TrendingDown, BarChart3, DollarSign, LayoutDashboard, RefreshCw, Settings2, HelpCircle } from 'lucide-react';
import Button from '../ui/Button/Button';
import MGChart from '../common/MGChart';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import './ErpDashboard.css';

/**
 * 권한 조회 실패 시 사용자 역할 기반 기본 권한 설정
 */
const setDefaultPermissionsForRole = (user, setUserPermissions) => {
  if (!user || !user.role) {
    console.warn('⚠️ 사용자 정보 없음, 기본 권한 설정 불가');
    setUserPermissions([]);
    return;
  }

  const role = user.role;
  const defaultPermissions = [];

  // 관리자 역할이면 모든 ERP 권한 부여
  if (role === 'ADMIN' || role === 'TENANT_ADMIN' || role === 'PRINCIPAL' || role === 'OWNER') {
    defaultPermissions.push(
      PERMISSIONS.ERP_ACCESS,
      PERMISSIONS.ERP_DASHBOARD_VIEW,
      PERMISSIONS.PURCHASE_REQUEST_VIEW,
      PERMISSIONS.PURCHASE_REQUEST_MANAGE,
      PERMISSIONS.APPROVAL_MANAGE,
      PERMISSIONS.ITEM_MANAGE,
      PERMISSIONS.BUDGET_MANAGE,
      PERMISSIONS.SALARY_MANAGE,
      PERMISSIONS.TAX_MANAGE,
      PERMISSIONS.REFUND_MANAGE,
      PERMISSIONS.INTEGRATED_FINANCE_VIEW
    );
    console.log('✅ 관리자 역할 기본 권한 설정:', defaultPermissions);
  }

  setUserPermissions(defaultPermissions);
};

/**
 * ERP 메인 대시보드 컴포넌트 - Core Solution 디자인 시스템 적용
 */
const ErpDashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionChecks, setPermissionChecks] = useState({});
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalOrders: 0,
    totalBudget: 0,
    usedBudget: 0
  });
  const [initLoading, setInitLoading] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  // 수입·지출 대시보드 (GET /api/v1/erp/finance/dashboard)
  const [financialData, setFinancialData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState(null);

  // 세션 체크 및 권한 확인
  useEffect(() => {
    if (sessionLoading) {
      console.log('⏳ 세션 로딩 중...');
      return;
    }

    const checkSessionWithDelay = async () => {
      let currentUser = propUser || sessionUser;
      
      if (!currentUser || !currentUser.role) {
        try {
          console.log('🔄 세션 API 직접 호출 시도...');
          const response = await fetch('/api/v1/auth/current-user', {
            credentials: 'include',
            method: 'GET'
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData && userData.role) {
              console.log('✅ API에서 사용자 정보 확인됨:', userData.role);
              currentUser = userData;
            }
          }
        } catch (error) {
          console.log('❌ 세션 API 호출 실패:', error);
        }
        
        if (!currentUser || !currentUser.role) {
          currentUser = sessionManager.getUser();
          if (!currentUser || !currentUser.role) {
            console.log('❌ 사용자 정보 없음, 로그인 페이지로 이동');
            navigate('/login', { replace: true });
            return;
          }
        }
      }

      console.log('✅ ERP Dashboard 접근 허용:', currentUser?.role);
      
      // 권한 조회 시도 (실패해도 계속 진행)
      try {
        const permissions = await fetchUserPermissions(setUserPermissions);
        if (permissions && permissions.length > 0) {
          console.log('✅ 권한 조회 성공:', permissions);
        } else {
          // 권한 조회 결과가 비어있으면 기본 권한 설정
          console.warn('⚠️ 권한 조회 결과가 비어있음, 기본 권한 설정');
          setDefaultPermissionsForRole(currentUser, setUserPermissions);
        }
      } catch (error) {
        console.warn('⚠️ 권한 조회 실패 (기본 권한 설정):', error);
        setDefaultPermissionsForRole(currentUser, setUserPermissions);
      }
      
      // 동적 권한 체크 (백엔드 API 호출)
      if (hasPermission) {
        const permissionCodes = [
          PERMISSIONS.PURCHASE_REQUEST_VIEW,
          PERMISSIONS.PURCHASE_REQUEST_MANAGE,
          PERMISSIONS.APPROVAL_MANAGE,
          PERMISSIONS.ITEM_MANAGE,
          PERMISSIONS.BUDGET_MANAGE,
          PERMISSIONS.SALARY_MANAGE,
          PERMISSIONS.TAX_MANAGE,
          PERMISSIONS.INTEGRATED_FINANCE_VIEW,
          PERMISSIONS.REFUND_MANAGE
        ];
        
        const checks = {};
        for (const code of permissionCodes) {
          try {
            checks[code] = await hasPermission(code);
          } catch (error) {
            console.warn(`⚠️ 권한 체크 실패 (${code}):`, error);
            checks[code] = false;
          }
        }
        setPermissionChecks(checks);
        console.log('✅ 동적 권한 체크 완료:', checks);
      }
    };

    setTimeout(checkSessionWithDelay, 100);
  }, [sessionLoading, isLoggedIn, navigate, hasPermission]); // propUser, sessionUser 의존성 제거

  // 권한이 로드된 후 또는 타임아웃 후 ERP 접근 권한 확인 (동적 권한 시스템)
  useEffect(() => {
    // 권한 조회 성공 시 즉시 체크
    if (userPermissions.length > 0) {
      const currentUser = propUser || sessionUser;
      // 관리자 역할 체크 (PermissionGroupGuard와 동일한 로직)
      const isAdmin = currentUser && RoleUtils.isAdmin(currentUser);
      
      // 표준화 2025-12-08: 하드코딩 제거, 데이터베이스 기반 동적 권한 체크만 사용
      // PermissionChecks.canAccessERP가 이제 user를 받아서 관리자 권한을 자동으로 허용
      const hasErpPermission = PermissionChecks.canAccessERP(userPermissions, currentUser) || isAdmin;
      
      if (!hasErpPermission) {
        console.log('❌ ERP 접근 권한 없음 (동적 권한 체크), 일반 대시보드로 이동');
        navigate('/dashboard', { replace: true });
        return;
      }
      console.log('✅ ERP 접근 권한 확인됨 (동적 권한 시스템)', isAdmin ? '(관리자 특권)' : '');
      const hasIntegratedFinanceView = PermissionChecks.canViewIntegratedFinance(userPermissions, currentUser) || isAdmin;
      loadDashboardData();
      if (hasIntegratedFinanceView) loadIncomeExpenseSummary();
      return;
    }

    // 권한 조회 실패 시 타임아웃 후 기본 권한 체크 (3초 후)
    const timeoutId = setTimeout(() => {
      const currentUser = propUser || sessionUser;
      if (currentUser && currentUser.role) {
        // 권한 조회 실패 시에도 사용자 역할 기반으로 기본 권한 설정
        setDefaultPermissionsForRole(currentUser, setUserPermissions);
        
        // 관리자 역할이면 일단 대시보드 로드 (백엔드에서 최종 권한 체크)
        const isAdmin = currentUser.role === 'ADMIN' || 
                       currentUser.role === 'TENANT_ADMIN' || 
                       currentUser.role === 'PRINCIPAL' || 
                       currentUser.role === 'OWNER';
        
        if (isAdmin) {
          console.log('⚠️ 권한 조회 실패했으나 관리자 역할이므로 대시보드 로드 시도');
          loadDashboardData();
          loadIncomeExpenseSummary();
        } else {
          console.log('❌ 권한 조회 실패 및 관리자 역할 아님, 일반 대시보드로 이동');
          navigate('/dashboard', { replace: true });
        }
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [userPermissions, navigate, propUser, sessionUser, loadIncomeExpenseSummary]);

  /** 이번 달 1일~말일 기준 수입·지출 대시보드 조회 (권한 있을 때만 호출) */
  const loadIncomeExpenseSummary = useCallback(async () => {
    setFinanceError(null);
    setFinanceLoading(true);
    try {
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const raw = await StandardizedApi.get(ERP_API.FINANCE_DASHBOARD, { startDate, endDate });
      const data = raw?.data ?? raw;
      setFinancialData(data?.financialData ?? null);
      setRecentTransactions(Array.isArray(data?.recentTransactions) ? data.recentTransactions : []);
    } catch (err) {
      console.error('수입·지출 대시보드 로드 실패:', err);
      setFinanceError(err?.message || '수입·지출 데이터를 불러올 수 없습니다.');
      setFinancialData(null);
      setRecentTransactions([]);
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [itemsResponse, pendingResponse, ordersResponse, budgetsResponse] = await Promise.all([
        fetch('/api/v1/erp/items', { credentials: 'include' }),
        fetch('/api/v1/erp/purchase-requests/pending-admin', { credentials: 'include' }),
        fetch('/api/v1/erp/purchase-orders', { credentials: 'include' }),
        fetch('/api/v1/erp/budgets', { credentials: 'include' })
      ]);

      const [itemsData, pendingData, ordersData, budgetsData] = await Promise.all([
        itemsResponse.json(),
        pendingResponse.json(),
        ordersResponse.json(),
        budgetsResponse.json()
      ]);

      const totalBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.totalBudget || 0), 0) || 0;
      const usedBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.usedBudget || 0), 0) || 0;

      setStats({
        totalItems: itemsData.data?.length || 0,
        pendingRequests: pendingData.data?.length || 0,
        approvedRequests: 0,
        totalOrders: ordersData.data?.length || 0,
        totalBudget: totalBudget,
        usedBudget: usedBudget
      });
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitTenantErp = async () => {
    setInitResult(null);
    setInitLoading(true);
    try {
      const res = await fetch('/api/v1/erp/accounting/init-tenant-erp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      const data = json.data ?? json;
      const ok = res.ok && (json.success !== false);
      setInitResult(ok ? { ok: true, message: data?.message || '완료' } : { ok: false, message: json.message || data?.message || '실패' });
    } catch (e) {
      setInitResult({ ok: false, message: e.message || '네트워크 오류' });
    } finally {
      setInitLoading(false);
    }
  };

  const handleBackfillJournalEntries = async () => {
    setBackfillResult(null);
    setBackfillLoading(true);
    try {
      const res = await fetch('/api/v1/erp/accounting/backfill-journal-entries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      const data = json.data ?? json;
      const ok = res.ok && (json.success !== false);
      const processed = data.processedCount ?? 0;
      const failed = data.failedCount ?? 0;
      const skipped = data.skippedCount ?? 0;
      setBackfillResult(ok
        ? { ok: true, message: `처리 ${processed}건, 스킵 ${skipped}건, 실패 ${failed}건` }
        : { ok: false, message: json.message || '실패' });
    } catch (e) {
      setBackfillResult({ ok: false, message: e.message || '네트워크 오류' });
    } finally {
      setBackfillLoading(false);
    }
  };

  const getBudgetUsagePercentage = () => {
    if (stats.totalBudget === 0) return 0;
    return Math.round((stats.usedBudget / stats.totalBudget) * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  /** 차트용 수입·지출 데이터 (막대 2개) */
  const incomeExpenseChartData = useMemo(() => {
    const income = financialData?.totalIncome ?? 0;
    const expense = financialData?.totalExpense ?? 0;
    return {
      labels: ['수입', '지출'],
      datasets: [
        {
          label: '금액',
          data: [income, expense],
          backgroundColor: ['var(--mg-success-500)', 'var(--mg-error-500)'],
          borderColor: ['var(--mg-success-600)', 'var(--mg-error-600)'],
          borderWidth: 1
        }
      ]
    };
  }, [financialData?.totalIncome, financialData?.totalExpense]);

  if (loading) {
    return (
      <AdminCommonLayout title="운영 현황" loading={true} loadingText="불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  const currentUser = propUser || sessionUser;
  const tenantId = currentUser?.tenantId || sessionManager.getSessionInfo()?.tenantId || '알 수 없음';
  const subtitleWithTenant =
    tenantId && tenantId !== '알 수 없음'
      ? `수입·지출·구매를 한눈에 (터넌트: ${tenantId})`
      : '수입·지출·구매를 한눈에';

  const kpiItems = [
    {
      id: 'totalItems',
      icon: <Package size={28} />,
      label: '총 아이템 수',
      value: stats.totalItems.toLocaleString(),
      subtitle: '등록된 비품 수',
      iconVariant: 'green',
      onClick: () => navigate('/erp/items')
    },
    {
      id: 'pendingRequests',
      icon: <Clock size={28} />,
      label: '승인 대기 요청',
      value: stats.pendingRequests.toLocaleString(),
      subtitle: '관리자 승인 대기',
      iconVariant: 'orange',
      onClick: () => navigate('/erp/approvals')
    },
    {
      id: 'totalOrders',
      icon: <ShoppingCart size={28} />,
      label: '총 주문 수',
      value: stats.totalOrders.toLocaleString(),
      subtitle: '완료된 구매 주문',
      iconVariant: 'blue',
      onClick: () => navigate('/erp/purchase-orders')
    },
    {
      id: 'budgetUsage',
      icon: <TrendingUp size={28} />,
      label: '예산 사용률',
      value: `${getBudgetUsagePercentage()}%`,
      subtitle: `${formatCurrency(stats.usedBudget)} / ${formatCurrency(stats.totalBudget)}`,
      iconVariant: 'gray',
      onClick: () => navigate('/erp/budget')
    }
  ];

  const isAdmin = currentUser && RoleUtils.isAdmin(currentUser);
  const hasPurchaseRequestView =
    (permissionChecks[PERMISSIONS.PURCHASE_REQUEST_VIEW] ??
      permissionChecks[PERMISSIONS.PURCHASE_REQUEST_MANAGE] ??
      (PermissionChecks.canViewPurchaseRequests(userPermissions, currentUser) ||
        PermissionChecks.canManagePurchaseRequests(userPermissions, currentUser))) || isAdmin;
  const hasApprovalManage =
    (permissionChecks[PERMISSIONS.APPROVAL_MANAGE] ?? PermissionChecks.canManageApprovals(userPermissions, currentUser)) || isAdmin;
  const hasItemManage =
    (permissionChecks[PERMISSIONS.ITEM_MANAGE] ?? PermissionChecks.canManageItems(userPermissions, currentUser)) || isAdmin;
  const hasBudgetManage =
    (permissionChecks[PERMISSIONS.BUDGET_MANAGE] ?? PermissionChecks.canManageBudget(userPermissions, currentUser)) || isAdmin;
  const hasSalaryManage =
    (permissionChecks[PERMISSIONS.SALARY_MANAGE] ?? PermissionChecks.canManageSalary(userPermissions, currentUser)) || isAdmin;
  const hasTaxManage =
    (permissionChecks[PERMISSIONS.TAX_MANAGE] ?? PermissionChecks.canManageTax(userPermissions, currentUser)) || isAdmin;
  const hasIntegratedFinanceView =
    (permissionChecks[PERMISSIONS.INTEGRATED_FINANCE_VIEW] ?? PermissionChecks.canViewIntegratedFinance(userPermissions, currentUser)) || isAdmin;
  const hasRefundManage =
    (permissionChecks[PERMISSIONS.REFUND_MANAGE] ?? PermissionChecks.canManageRefund(userPermissions, currentUser)) || isAdmin;

  const isNetProfitNegative = financialData != null && (financialData.netProfit ?? 0) < 0;

  return (
    <AdminCommonLayout title="운영 현황">
      <ContentArea className="erp-dashboard__content mg-v2-erp-dashboard-block" ariaLabel="운영 현황">
        <ContentHeader
          subtitle={subtitleWithTenant}
          actions={
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                loadDashboardData();
                if (hasIntegratedFinanceView) loadIncomeExpenseSummary();
              }}
              preventDoubleClick={true}
            >
              새로고침
            </Button>
          }
        />

        {/* 수입·지출 요약 (통합 재무 보기 권한 있을 때만) */}
        {hasIntegratedFinanceView && (
          <section className="erp-dashboard__summary" aria-labelledby="erp-dashboard-summary-heading" aria-label="수입·지출 요약">
            <h2 id="erp-dashboard-summary-heading" className="erp-dashboard__section-title">수입·지출 요약</h2>
            {financeError && (
              <div className="erp-dashboard__finance-error" role="alert">
                {financeError}
              </div>
            )}
            {!financeError && (
              <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--summary">
                <article className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                  <div className="mg-v2-ad-b0kla__chart-header">
                    <span className="mg-v2-erp-dashboard-kpi-label">수입</span>
                    <TrendingUp size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success" />
                  </div>
                  <div className="mg-v2-ad-b0kla__chart-body">
                    <div className="mg-v2-erp-dashboard-kpi-value">
                      {financeLoading ? '—' : (financialData != null ? formatCurrency(financialData.totalIncome ?? 0) : '0원')}
                    </div>
                    <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                  </div>
                </article>
                <article className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
                  <div className="mg-v2-ad-b0kla__chart-header">
                    <span className="mg-v2-erp-dashboard-kpi-label">지출</span>
                    <TrendingDown size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--error" />
                  </div>
                  <div className="mg-v2-ad-b0kla__chart-body">
                    <div className="mg-v2-erp-dashboard-kpi-value">
                      {financeLoading ? '—' : (financialData != null ? formatCurrency(financialData.totalExpense ?? 0) : '0원')}
                    </div>
                    <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                  </div>
                </article>
                <article className={`mg-v2-ad-b0kla__card ${isNetProfitNegative ? 'mg-v2-ad-b0kla__card--accent-error' : 'mg-v2-ad-b0kla__card--accent-primary'}`}>
                  <div className="mg-v2-ad-b0kla__chart-header">
                    <span className="mg-v2-erp-dashboard-kpi-label">순이익</span>
                    <BarChart3 size={24} aria-hidden className={`mg-v2-erp-dashboard-kpi-icon ${isNetProfitNegative ? 'mg-v2-erp-dashboard-kpi-icon--error' : 'mg-v2-erp-dashboard-kpi-icon--primary'}`} />
                  </div>
                  <div className="mg-v2-ad-b0kla__chart-body">
                    <div className="mg-v2-erp-dashboard-kpi-value">
                      {financeLoading ? '—' : (financialData != null ? formatCurrency(Math.abs(financialData.netProfit ?? 0)) : '0원')}
                    </div>
                    <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                  </div>
                </article>
              </div>
            )}
          </section>
        )}

        <ContentKpiRow items={kpiItems} />

        {/* 차트: 수입·지출 비교 (권한 있을 때) */}
        {hasIntegratedFinanceView && !financeError && (
          <section className="erp-dashboard__charts" aria-labelledby="erp-dashboard-charts-heading" aria-label="수입·지출 차트">
            <h3 id="erp-dashboard-charts-heading" className="erp-dashboard__section-title">수입·지출 비교</h3>
            <div className="erp-dashboard__chart-grid">
              <figure className="erp-dashboard__chart-item">
                {financeLoading ? (
                  <div className="erp-dashboard__chart-placeholder">차트를 불러오는 중...</div>
                ) : (
                  <MGChart
                    type="bar"
                    height={280}
                    loading={false}
                    error={null}
                    data={incomeExpenseChartData}
                    options={{
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v) }
                        }
                      }
                    }}
                  />
                )}
                <figcaption className="erp-dashboard__chart-caption">이번 달 수입·지출</figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* 최근 거래 목록 (권한 있을 때) */}
        {hasIntegratedFinanceView && (
          <section className="erp-dashboard__recent" aria-labelledby="erp-dashboard-recent-heading" aria-label="최근 거래 목록">
            <h3 id="erp-dashboard-recent-heading" className="erp-dashboard__section-title">최근 거래</h3>
            <div className="erp-dashboard__table-wrapper">
              {financeLoading ? (
                <p className="erp-dashboard__recent-empty">불러오는 중...</p>
              ) : recentTransactions.length === 0 ? (
                <p className="erp-dashboard__recent-empty">최근 거래 내역이 없습니다.</p>
              ) : (
                <table className="erp-dashboard__transactions-table" aria-label="최근 거래 목록">
                  <thead>
                    <tr>
                      <th scope="col">날짜</th>
                      <th scope="col">구분</th>
                      <th scope="col">금액</th>
                      <th scope="col">적요</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME' || tx.type === 'income';
                      return (
                        <tr key={tx.id || `${tx.transactionDate}-${tx.amount}-${tx.type}`}>
                          <td>{tx.transactionDate ? String(tx.transactionDate).slice(0, 10) : '—'}</td>
                          <td>{isIncome ? '수입' : '지출'}</td>
                          <td className={isIncome ? 'erp-dashboard__amount--income' : 'erp-dashboard__amount--expense'}>
                            {formatCurrency(tx.amount ?? 0)}
                          </td>
                          <td>{tx.description ?? tx.memo ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {/* 데이터 동기화 (관리자 전용) */}
        {hasIntegratedFinanceView && (
          <div className="mg-v2-ad-b0kla__card erp-sync-card">
            <h2 className="mg-v2-ad-b0kla__section-title">
              <Settings2 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              데이터 동기화
            </h2>
            <div className="erp-sync__usage">
              <p><strong>사용 방법</strong></p>
              <ol>
                <li><strong>init-tenant-erp</strong>: 신규 테넌트 또는 재무 데이터가 보이지 않을 때 먼저 실행. 계정 매핑(REVENUE/EXPENSE/CASH)을 생성합니다.</li>
                <li><strong>backfill-journal-entries</strong>: 미반영 수입 거래를 자동으로 반영합니다. init 이후 실행 권장.</li>
              </ol>
              <p className="erp-sync__auto">
                <RefreshCw size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                <strong>자동 동기화</strong>: 매일 00:08에 init·백필이 자동 실행됩니다. (scheduler.erp-automation.enabled=true)
              </p>
            </div>
            <div className="erp-sync__urls">
              <div className="erp-sync__url-item">
                <code>POST /api/v1/erp/accounting/init-tenant-erp</code>
                <Button variant="primary" size="small" onClick={handleInitTenantErp} disabled={initLoading} preventDoubleClick={true}>
                  {initLoading ? '실행 중...' : '실행'}
                </Button>
              </div>
              <div className="erp-sync__url-item">
                <code>POST /api/v1/erp/accounting/backfill-journal-entries</code>
                <Button variant="primary" size="small" onClick={handleBackfillJournalEntries} disabled={backfillLoading} preventDoubleClick={true}>
                  {backfillLoading ? '실행 중...' : '실행'}
                </Button>
              </div>
            </div>
            {(initResult || backfillResult) && (
              <div className="erp-sync__results">
                {initResult && (
                  <div className={`erp-sync__result ${initResult.ok ? 'success' : 'error'}`}>
                    init: {initResult.message}
                  </div>
                )}
                {backfillResult && (
                  <div className={`erp-sync__result ${backfillResult.ok ? 'success' : 'error'}`}>
                    backfill: {backfillResult.message}
                  </div>
                )}
              </div>
            )}
            <p className="erp-sync__help">
              <HelpCircle size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              curl/Postman: 관리자 로그인 후 세션 쿠키와 함께 POST 호출. X-Tenant-Id는 현재 테넌트에 맞게 설정.
            </p>
          </div>
        )}

        {/* 빠른 액션 섹션 */}
        <div className="mg-v2-ad-b0kla__card">
          <h2 className="mg-v2-ad-b0kla__section-title">빠른 액션</h2>
          <div className="mg-v2-ad-b0kla__admin-grid">
            {hasPurchaseRequestView && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/purchase-requests')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green">
                  <ShoppingCart size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">구매 요청하기</span>
                <span className="mg-v2-ad-b0kla__admin-desc">상품 및 비품 구매 요청을 제출합니다</span>
              </button>
            )}
            {hasApprovalManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/approvals')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
                  <Clock size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">승인 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">구매 요청 승인 및 거부를 관리합니다</span>
              </button>
            )}
            {hasItemManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/items')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
                  <Package size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">아이템 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">등록된 비품 및 상품을 관리합니다</span>
              </button>
            )}
            {hasBudgetManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/budget')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
                  <TrendingUp size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">예산 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">지점별 예산을 설정하고 관리합니다</span>
              </button>
            )}
            {/* 급여·세금: 권한별 1개만 노출 (기획 정리) */}
            {hasSalaryManage && hasTaxManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/salary')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                  <DollarSign size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">급여 세금 통합관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">급여 계산·세금 통계를 한 화면에서 관리합니다</span>
              </button>
            )}
            {hasSalaryManage && !hasTaxManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/salary')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                  <DollarSign size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">급여 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">상담사 급여 계산 및 지급을 관리합니다</span>
              </button>
            )}
            {!hasSalaryManage && hasTaxManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/tax')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                  <LayoutDashboard size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">세금 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">원천징수 및 세금 관련 업무를 관리합니다</span>
              </button>
            )}
            {hasIntegratedFinanceView && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/admin/erp/financial')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--blue">
                  <TrendingUp size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">수입·지출 한눈에</span>
                <span className="mg-v2-ad-b0kla__admin-desc">거래·손익·정산을 한곳에서 확인합니다</span>
              </button>
            )}
            {hasRefundManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/refund-management')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--orange">
                  <Clock size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">환불 관리 시스템</span>
                <span className="mg-v2-ad-b0kla__admin-desc">환불 요청 및 처리 내역을 관리합니다</span>
              </button>
            )}
            {/* 재무: 수입·지출 한눈에 1개만 유지, 탭별 카드 4개 제거 (기획 정리) */}
          </div>
        </div>

        {/* 최근 활동 섹션 */}
        <div className="mg-v2-ad-b0kla__card">
          <h2 className="mg-v2-ad-b0kla__section-title">최근 활동</h2>
          <div className="mg-empty-state">
            <div className="mg-empty-state__text">최근 활동 내역이 없습니다.</div>
          </div>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ErpDashboard;
