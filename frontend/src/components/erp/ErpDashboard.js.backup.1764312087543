import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import { LayoutDashboard, Package, Clock, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';
import MGButton from '../common/MGButton';
import '../../styles/main.css';
import '../../styles/mindgarden-design-system.css';
import './ErpDashboard.css';

/**
 * ERP 메인 대시보드 컴포넌트 - MindGarden 디자인 시스템 적용
 */
const ErpDashboard = ({ user: propUser }) => {
  const navigate = useNavigate();
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
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
          const response = await fetch('/api/auth/current-user', {
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
      await fetchUserPermissions(setUserPermissions);
    };

    setTimeout(checkSessionWithDelay, 100);
  }, [sessionLoading, isLoggedIn, navigate]); // propUser, sessionUser 의존성 제거

  // 권한이 로드된 후 ERP 접근 권한 확인
  useEffect(() => {
    if (userPermissions.length > 0) {
      if (!PermissionChecks.canAccessERP(userPermissions)) {
        console.log('❌ ERP 접근 권한 없음, 일반 대시보드로 이동');
        navigate('/dashboard', { replace: true });
        return;
      }
      loadDashboardData();
    }
  }, [userPermissions, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [itemsResponse, pendingResponse, ordersResponse, budgetsResponse] = await Promise.all([
        fetch('/api/erp/items', { credentials: 'include' }),
        fetch('/api/erp/purchase-requests/pending-admin', { credentials: 'include' }),
        fetch('/api/erp/purchase-orders', { credentials: 'include' }),
        fetch('/api/erp/budgets', { credentials: 'include' })
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
    return <UnifiedLoading text="대시보드 데이터를 불러오는 중..." size="medium" type="page" />;
  }

  return (
    <SimpleLayout title="ERP 관리 시스템">
      <div className="mg-dashboard-layout">
        {/* 대시보드 헤더 */}
        <div className="mg-dashboard-header">
          <div className="mg-dashboard-header-content">
            <div className="mg-dashboard-header-left">
              <LayoutDashboard />
              <div>
                <h1 className="mg-dashboard-title">ERP 관리 시스템</h1>
                <p className="mg-dashboard-subtitle">통합 자원 관리 및 회계 시스템</p>
              </div>
            </div>
            <div className="mg-dashboard-header-right">
              <MGButton 
                variant="outline" 
                size="small"
                onClick={loadDashboardData}
              >
                새로고침
              </MGButton>
            </div>
          </div>
        </div>

        {/* 통계 카드 그리드 */}
        <div className="mg-dashboard-stats">
          <StatCard
            icon={<Package />}
            value={stats.totalItems.toLocaleString()}
            label="총 아이템 수"
            change="등록된 비품 수"
          />
          <StatCard
            icon={<Clock />}
            value={stats.pendingRequests.toLocaleString()}
            label="승인 대기 요청"
            change="관리자 승인 대기"
            changeType="negative"
          />
          <StatCard
            icon={<ShoppingCart />}
            value={stats.totalOrders.toLocaleString()}
            label="총 주문 수"
            change="완료된 구매 주문"
            changeType="positive"
          />
          <StatCard
            icon={<TrendingUp />}
            value={`${getBudgetUsagePercentage()}%`}
            label="예산 사용률"
            change={`${formatCurrency(stats.usedBudget)} / ${formatCurrency(stats.totalBudget)}`}
          />
        </div>

        {/* 콘텐츠 영역 */}
        <div className="mg-dashboard-content">
          {/* 빠른 액션 섹션 */}
          <DashboardSection
            title="빠른 액션"
            icon={<LayoutDashboard />}
          >
            <div className="mg-management-grid">
              {PermissionChecks.canViewPurchaseRequests(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/purchase-requests')}>
                  <div className="mg-management-icon">
                    <ShoppingCart />
                  </div>
                  <h3>구매 요청하기</h3>
                  <p className="mg-management-description">상품 및 비품 구매 요청을 제출합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageApprovals(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/approvals')}>
                  <div className="mg-management-icon">
                    <Clock />
                  </div>
                  <h3>승인 관리</h3>
                  <p className="mg-management-description">구매 요청 승인 및 거부를 관리합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageItems(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/items')}>
                  <div className="mg-management-icon">
                    <Package />
                  </div>
                  <h3>아이템 관리</h3>
                  <p className="mg-management-description">등록된 비품 및 상품을 관리합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageBudget(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/budget')}>
                  <div className="mg-management-icon">
                    <TrendingUp />
                  </div>
                  <h3>예산 관리</h3>
                  <p className="mg-management-description">지점별 예산을 설정하고 관리합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageSalary(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/salary')}>
                  <div className="mg-management-icon">
                    <DollarSign />
                  </div>
                  <h3>급여 관리</h3>
                  <p className="mg-management-description">상담사 급여 계산 및 지급을 관리합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageTax(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/tax')}>
                  <div className="mg-management-icon">
                    <LayoutDashboard />
                  </div>
                  <h3>세금 관리</h3>
                  <p className="mg-management-description">원천징수 및 세금 관련 업무를 관리합니다</p>
                </div>
              )}
              
              {PermissionChecks.canViewIntegratedFinance(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/admin/erp/financial')}>
                  <div className="mg-management-icon">
                    <TrendingUp />
                  </div>
                  <h3>통합 회계 시스템</h3>
                  <p className="mg-management-description">전체 재무 데이터 및 통계를 확인합니다</p>
                </div>
              )}
              
              {PermissionChecks.canManageRefund(userPermissions) && (
                <div className="mg-management-card" onClick={() => navigate('/erp/refund-management')}>
                  <div className="mg-management-icon">
                    <Clock />
                  </div>
                  <h3>환불 관리 시스템</h3>
                  <p className="mg-management-description">환불 요청 및 처리 내역을 관리합니다</p>
                </div>
              )}
            </div>
          </DashboardSection>

          {/* 최근 활동 섹션 */}
          <DashboardSection
            title="최근 활동"
            icon={<Clock />}
          >
            <div className="mg-empty-state">
              <div className="mg-empty-state__text">최근 활동 내역이 없습니다.</div>
            </div>
          </DashboardSection>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ErpDashboard;
