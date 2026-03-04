import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { RoleUtils } from '../../constants/roles';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import {
  ContentArea,
  ContentHeader,
  ContentKpiRow
} from '../dashboard-v2/content';
import { Package, Clock, ShoppingCart, TrendingUp, DollarSign, Receipt, BookOpen, Calculator, FileText, LayoutDashboard } from 'lucide-react';
import Button from '../ui/Button/Button';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
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
      loadDashboardData();
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
        } else {
          console.log('❌ 권한 조회 실패 및 관리자 역할 아님, 일반 대시보드로 이동');
          navigate('/dashboard', { replace: true });
        }
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [userPermissions, navigate, propUser, sessionUser]);

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

  if (loading) {
    return (
      <AdminCommonLayout title="ERP 대시보드" loading={true} loadingText="대시보드를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  const currentUser = propUser || sessionUser;
  const tenantId = currentUser?.tenantId || sessionManager.getSessionInfo()?.tenantId || '알 수 없음';
  const subtitleWithTenant =
    tenantId && tenantId !== '알 수 없음'
      ? `통합 자원 관리 및 회계 시스템 (터넌트: ${tenantId})`
      : '통합 자원 관리 및 회계 시스템';

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

  return (
    <AdminCommonLayout title="ERP 대시보드">
      <ContentArea className="erp-dashboard__content" ariaLabel="ERP 대시보드">
        <ContentHeader
          subtitle={subtitleWithTenant}
          actions={
            <Button variant="outline" size="small" onClick={loadDashboardData} preventDoubleClick={true}>
              새로고침
            </Button>
          }
        />
        <ContentKpiRow items={kpiItems} />

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
            {hasSalaryManage && (
              <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/erp/salary')}>
                <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                  <DollarSign size={28} />
                </div>
                <span className="mg-v2-ad-b0kla__admin-label">급여 관리</span>
                <span className="mg-v2-ad-b0kla__admin-desc">상담사 급여 계산 및 지급을 관리합니다</span>
              </button>
            )}
            {hasTaxManage && (
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
                <span className="mg-v2-ad-b0kla__admin-label">통합 회계 시스템</span>
                <span className="mg-v2-ad-b0kla__admin-desc">전체 재무 데이터 및 통계를 확인합니다</span>
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
            {hasIntegratedFinanceView && (
              <>
                <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/admin/erp/financial?tab=journal-entries')}>
                  <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                    <Receipt size={28} />
                  </div>
                  <span className="mg-v2-ad-b0kla__admin-label">분개 관리</span>
                  <span className="mg-v2-ad-b0kla__admin-desc">회계 분개를 생성, 승인, 전기합니다</span>
                </button>
                <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/admin/erp/financial?tab=ledgers')}>
                  <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                    <BookOpen size={28} />
                  </div>
                  <span className="mg-v2-ad-b0kla__admin-label">원장 조회</span>
                  <span className="mg-v2-ad-b0kla__admin-desc">계정별 원장을 조회하고 상세 내역을 확인합니다</span>
                </button>
                <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/admin/erp/financial?tab=settlement')}>
                  <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                    <Calculator size={28} />
                  </div>
                  <span className="mg-v2-ad-b0kla__admin-label">정산 관리</span>
                  <span className="mg-v2-ad-b0kla__admin-desc">정산 규칙을 설정하고 정산을 계산 및 승인합니다</span>
                </button>
                <button type="button" className="mg-v2-ad-b0kla__admin-card" onClick={() => navigate('/admin/erp/financial?tab=cash-flow')}>
                  <div className="mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--gray">
                    <FileText size={28} />
                  </div>
                  <span className="mg-v2-ad-b0kla__admin-label">현금흐름표</span>
                  <span className="mg-v2-ad-b0kla__admin-desc">영업, 투자, 재무 활동의 현금흐름을 확인합니다</span>
                </button>
              </>
            )}
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
