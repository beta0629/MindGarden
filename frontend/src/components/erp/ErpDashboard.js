import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { RoleUtils } from '../../constants/roles';
import { AUTH_API, ERP_API } from '../../constants/api';
import StandardizedApi from '../../utils/standardizedApi';
import { formatCurrency } from '../../utils/formatUtils';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import {
  ContentArea,
  ContentHeader,
  ContentKpiRow
} from '../dashboard-v2/content';
import { Package, Clock, ShoppingCart, TrendingUp } from 'lucide-react';
import Button from '../ui/Button/Button';
import {
  ErpIncomeExpenseSummarySection,
  ErpIncomeExpenseBarChartSection,
  ErpRecentTransactionsTable,
  ErpFinanceAdminSyncCard,
  ErpQuickActionsPanel
} from './organisms';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import './ErpDashboard.css';
import './organisms/ErpDashboardFinanceOrganisms.css';
import ErpPageShell from './shell/ErpPageShell';

const ERP_DASHBOARD_PAGE_TITLE_ID = 'erp-dashboard-page-title';

const isDevEnv = process.env.NODE_ENV === 'development';

/**
 * 권한 조회 실패 시 사용자 역할 기반 기본 권한 설정
 */
const setDefaultPermissionsForRole = (user, setUserPermissions) => {
  if (!user || !user.role) {
    console.warn('사용자 정보 없음, 기본 권한 설정 불가');
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
    if (isDevEnv) {
      console.log('관리자 역할 기본 권한 설정:', defaultPermissions);
    }
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
      const financialData = data?.financialData ?? data;
      const totalIncome = financialData?.totalIncome ?? financialData?.summary?.totalRevenue ?? 0;
      const totalExpense = financialData?.totalExpense ?? financialData?.summary?.totalExpenses ?? 0;
      const netProfit = financialData?.netProfit ?? financialData?.summary?.netProfit ?? 0;
      setFinancialData({
        totalIncome,
        totalExpense,
        netProfit,
        ...(financialData?.summary ? { summary: financialData.summary } : {}),
        ...(financialData?.transactions ? { transactions: financialData.transactions } : {})
      });
      const rawRecent = data?.financialData?.transactions ?? data?.recentTransactions ?? [];
      setRecentTransactions(Array.isArray(rawRecent) ? rawRecent : []);
    } catch (err) {
      console.error('수입·지출 대시보드 로드 실패:', err);
      setFinanceError(err?.message || '수입·지출 데이터를 불러올 수 없습니다.');
      setFinancialData(null);
      setRecentTransactions([]);
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  // 세션 체크 및 권한 확인
  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    const checkSessionWithDelay = async () => {
      let currentUser = propUser || sessionUser;

      if (!currentUser || !currentUser.role) {
        try {
          const userData = await StandardizedApi.get(AUTH_API.GET_CURRENT_USER);
          if (userData && userData.role) {
            currentUser = userData;
          }
        } catch (error) {
          if (isDevEnv) {
            console.warn('세션 API 호출 실패:', error);
          }
        }

        if (!currentUser || !currentUser.role) {
          currentUser = sessionManager.getUser();
          if (!currentUser || !currentUser.role) {
            navigate('/login', { replace: true });
            return;
          }
        }
      }

      // 권한 조회 시도 (실패해도 계속 진행)
      try {
        const permissions = await fetchUserPermissions(setUserPermissions);
        if (!permissions || permissions.length === 0) {
          console.warn('권한 조회 결과가 비어있음, 기본 권한 설정');
          setDefaultPermissionsForRole(currentUser, setUserPermissions);
        }
      } catch (error) {
        console.warn('권한 조회 실패 (기본 권한 설정):', error);
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
            console.warn(`권한 체크 실패 (${code}):`, error);
            checks[code] = false;
          }
        }
        setPermissionChecks(checks);
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
        navigate('/dashboard', { replace: true });
        return;
      }
      const hasIntegratedFinanceView =
        PermissionChecks.canViewIntegratedFinance(userPermissions, currentUser) || isAdmin;
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
        const isAdmin =
          currentUser.role === 'ADMIN' ||
          currentUser.role === 'TENANT_ADMIN' ||
          currentUser.role === 'PRINCIPAL' ||
          currentUser.role === 'OWNER';

        if (isAdmin) {
          loadDashboardData();
          loadIncomeExpenseSummary();
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [userPermissions, navigate, propUser, sessionUser, loadIncomeExpenseSummary]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        StandardizedApi.get('/api/v1/erp/items'),
        StandardizedApi.get('/api/v1/erp/purchase-requests/pending-admin'),
        StandardizedApi.get('/api/v1/erp/purchase-orders'),
        StandardizedApi.get('/api/v1/erp/budgets')
      ]);

      const toListAndCount = (value) => {
        if (value == null) return { list: [], count: 0 };
        if (Array.isArray(value)) return { list: value, count: value.length };
        const count = value?.count ?? value?.totalItems ?? value?.totalElements ?? value?.size ?? 0;
        const listRaw = value?.data ?? value?.content ?? [];
        const list = Array.isArray(listRaw) ? listRaw : [];
        return { list, count };
      };

      const items = results[0].status === 'fulfilled' ? toListAndCount(results[0].value) : { list: [], count: 0 };
      const pending = results[1].status === 'fulfilled' ? toListAndCount(results[1].value) : { list: [], count: 0 };
      const orders = results[2].status === 'fulfilled' ? toListAndCount(results[2].value) : { list: [], count: 0 };
      const budgets = results[3].status === 'fulfilled' ? toListAndCount(results[3].value) : { list: [], count: 0 };
      const budgetsList = budgets.list;

      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn(`대시보드 API ${i + 1}/4 실패:`, r.reason);
        }
      });

      const totalBudget = budgetsList.reduce((sum, budget) => sum + parseFloat(budget.totalBudget || 0), 0);
      const usedBudget = budgetsList.reduce((sum, budget) => sum + parseFloat(budget.usedBudget || 0), 0);

      setStats({
        totalItems: items.count,
        pendingRequests: pending.count,
        approvedRequests: 0,
        totalOrders: orders.count,
        totalBudget,
        usedBudget
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
      const json = await StandardizedApi.post('/api/v1/erp/accounting/init-tenant-erp', {});
      const data = json?.data ?? json;
      const ok = json?.success !== false;
      setInitResult(
        ok
          ? { ok: true, message: data?.message || '완료' }
          : { ok: false, message: json?.message || data?.message || '실패' }
      );
    } catch (e) {
      setInitResult({ ok: false, message: e?.message || '네트워크 오류' });
    } finally {
      setInitLoading(false);
    }
  };

  const handleBackfillJournalEntries = async () => {
    setBackfillResult(null);
    setBackfillLoading(true);
    try {
      const json = await StandardizedApi.post('/api/v1/erp/accounting/backfill-journal-entries', {});
      const data = json?.data ?? json;
      const ok = json?.success !== false;
      const processed = data?.processedCount ?? 0;
      const failed = data?.failedCount ?? 0;
      const skipped = data?.skippedCount ?? 0;
      setBackfillResult(
        ok
          ? { ok: true, message: `처리 ${processed}건, 스킵 ${skipped}건, 실패 ${failed}건` }
          : { ok: false, message: json?.message || '실패' }
      );
    } catch (e) {
      setBackfillResult({ ok: false, message: e?.message || '네트워크 오류' });
    } finally {
      setBackfillLoading(false);
    }
  };

  const getBudgetUsagePercentage = () => {
    if (stats.totalBudget === 0) return 0;
    return Math.round((stats.usedBudget / stats.totalBudget) * 100);
  };

  const layoutContentClassName = 'erp-dashboard__content mg-v2-erp-dashboard-block';

  if (sessionLoading) {
    return (
      <AdminCommonLayout>
        <ContentHeader
          title="운영 현황"
          subtitle="세션 정보를 확인하는 중입니다."
          titleId={ERP_DASHBOARD_PAGE_TITLE_ID}
        />
        <ContentArea className={layoutContentClassName} ariaLabel="운영 현황">
          <UnifiedLoading type="page" text="세션 정보를 불러오는 중..." />
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (loading) {
    return (
      <AdminCommonLayout>
        <ContentHeader
          title="운영 현황"
          subtitle="운영 지표와 재무 요약을 불러오는 중입니다."
          titleId={ERP_DASHBOARD_PAGE_TITLE_ID}
        />
        <ContentArea className={layoutContentClassName} ariaLabel="운영 현황">
          <UnifiedLoading type="page" text="불러오는 중..." />
        </ContentArea>
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
        PermissionChecks.canManagePurchaseRequests(userPermissions, currentUser))) ||
    isAdmin;
  const hasApprovalManage =
    (permissionChecks[PERMISSIONS.APPROVAL_MANAGE] ??
      PermissionChecks.canManageApprovals(userPermissions, currentUser)) || isAdmin;
  const hasItemManage =
    (permissionChecks[PERMISSIONS.ITEM_MANAGE] ?? PermissionChecks.canManageItems(userPermissions, currentUser)) ||
    isAdmin;
  const hasBudgetManage =
    (permissionChecks[PERMISSIONS.BUDGET_MANAGE] ?? PermissionChecks.canManageBudget(userPermissions, currentUser)) ||
    isAdmin;
  const hasSalaryManage =
    (permissionChecks[PERMISSIONS.SALARY_MANAGE] ?? PermissionChecks.canManageSalary(userPermissions, currentUser)) ||
    isAdmin;
  const hasTaxManage =
    (permissionChecks[PERMISSIONS.TAX_MANAGE] ?? PermissionChecks.canManageTax(userPermissions, currentUser)) ||
    isAdmin;
  const hasIntegratedFinanceView =
    (permissionChecks[PERMISSIONS.INTEGRATED_FINANCE_VIEW] ??
      PermissionChecks.canViewIntegratedFinance(userPermissions, currentUser)) || isAdmin;
  const hasRefundManage =
    (permissionChecks[PERMISSIONS.REFUND_MANAGE] ?? PermissionChecks.canManageRefund(userPermissions, currentUser)) ||
    isAdmin;

  return (
    <AdminCommonLayout>
      <ContentHeader
        title="운영 현황"
        subtitle={subtitleWithTenant}
        titleId={ERP_DASHBOARD_PAGE_TITLE_ID}
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
      <ContentArea className={layoutContentClassName} ariaLabel="운영 현황">
        <ErpPageShell mainAriaLabel="운영 현황 본문">
          {hasIntegratedFinanceView && (
            <ErpIncomeExpenseSummarySection
              financeError={financeError}
              financeLoading={financeLoading}
              financialData={financialData}
            />
          )}

          <ContentKpiRow items={kpiItems} />

          {hasIntegratedFinanceView && !financeError && (
            <ErpIncomeExpenseBarChartSection
              financeLoading={financeLoading}
              financialData={financialData}
            />
          )}

          {hasIntegratedFinanceView && (
            <ErpRecentTransactionsTable
              financeLoading={financeLoading}
              recentTransactions={recentTransactions}
            />
          )}

          {hasIntegratedFinanceView && (
            <ErpFinanceAdminSyncCard
              initLoading={initLoading}
              initResult={initResult}
              backfillLoading={backfillLoading}
              backfillResult={backfillResult}
              onInitTenantErp={handleInitTenantErp}
              onBackfillJournalEntries={handleBackfillJournalEntries}
            />
          )}

          <ErpQuickActionsPanel
            hasPurchaseRequestView={hasPurchaseRequestView}
            hasApprovalManage={hasApprovalManage}
            hasItemManage={hasItemManage}
            hasBudgetManage={hasBudgetManage}
            hasSalaryManage={hasSalaryManage}
            hasTaxManage={hasTaxManage}
            hasIntegratedFinanceView={hasIntegratedFinanceView}
            hasRefundManage={hasRefundManage}
          />

          <div className="mg-v2-ad-b0kla__card">
            <h2 className="mg-v2-ad-b0kla__section-title">최근 활동</h2>
            <div className="mg-empty-state">
              <div className="mg-empty-state__text">최근 활동 내역이 없습니다.</div>
            </div>
          </div>
        </ErpPageShell>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ErpDashboard;
