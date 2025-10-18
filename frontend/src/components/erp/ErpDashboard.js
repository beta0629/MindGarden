import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpHeader from './common/ErpHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import { LayoutDashboard, Package, Clock, ShoppingCart, TrendingUp } from 'lucide-react';
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
  }, [sessionLoading, propUser, sessionUser, isLoggedIn, navigate]);

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
    <SimpleLayout>
      <div className="erp-dashboard-container">
        {/* 대시보드 헤더 */}
        <ErpHeader
          title="ERP 관리 시스템"
          subtitle="통합 자원 관리 및 회계 시스템"
          icon={<LayoutDashboard size={28} />}
          actions={
            <ErpButton variant="primary" size="sm" onClick={loadDashboardData}>
              새로고침
            </ErpButton>
          }
        />

        {/* 통계 카드 그리드 */}
        <div className="erp-stats-grid">
          <div className="erp-stat-card">
            <div className="erp-stat-icon">
              <Package size={20} />
            </div>
            <div className="erp-stat-content">
              <div className="erp-stat-value">{stats.totalItems.toLocaleString()}</div>
              <div className="erp-stat-label">총 아이템 수</div>
              <div className="erp-stat-description">등록된 비품 수</div>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-icon erp-stat-icon-warning">
              <Clock size={20} />
            </div>
            <div className="erp-stat-content">
              <div className="erp-stat-value">{stats.pendingRequests.toLocaleString()}</div>
              <div className="erp-stat-label">승인 대기 요청</div>
              <div className="erp-stat-description">관리자 승인 대기</div>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-icon erp-stat-icon-success">
              <ShoppingCart size={20} />
            </div>
            <div className="erp-stat-content">
              <div className="erp-stat-value">{stats.totalOrders.toLocaleString()}</div>
              <div className="erp-stat-label">총 주문 수</div>
              <div className="erp-stat-description">완료된 구매 주문</div>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="erp-stat-icon erp-stat-icon-danger">
              <TrendingUp size={20} />
            </div>
            <div className="erp-stat-content">
              <div className="erp-stat-value">{getBudgetUsagePercentage()}%</div>
              <div className="erp-stat-label">예산 사용률</div>
              <div className="erp-stat-description">
                {formatCurrency(stats.usedBudget)} / {formatCurrency(stats.totalBudget)}
              </div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 영역 - 완전히 새로운 클래스 */}
        <div className="erp-content-wrapper">
          {/* 빠른 액션 섹션 */}
          <div className="erp-section">
            <div className="erp-section-header">
              <h3 className="erp-section-title">빠른 액션</h3>
            </div>
            <div className="erp-section-content">
              <div className="erp-action-grid">
                {PermissionChecks.canViewPurchaseRequests(userPermissions) && (
                  <ErpButton
                    variant="primary"
                    onClick={() => window.location.href = '/erp/purchase-requests'}
                  >
                    구매 요청하기
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageApprovals(userPermissions) && (
                  <ErpButton
                    variant="info"
                    onClick={() => window.location.href = '/erp/approvals'}
                  >
                    승인 관리
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageItems(userPermissions) && (
                  <ErpButton
                    variant="success"
                    onClick={() => window.location.href = '/erp/items'}
                  >
                    아이템 관리
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageBudget(userPermissions) && (
                  <ErpButton
                    variant="warning"
                    onClick={() => window.location.href = '/erp/budget'}
                  >
                    예산 관리
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageSalary(userPermissions) && (
                  <ErpButton
                    variant="danger"
                    onClick={() => window.location.href = '/erp/salary'}
                  >
                    급여 관리
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageTax(userPermissions) && (
                  <ErpButton
                    variant="secondary"
                    onClick={() => window.location.href = '/erp/tax'}
                  >
                    세금 관리
                  </ErpButton>
                )}
                
                {PermissionChecks.canViewIntegratedFinance(userPermissions) && (
                  <ErpButton
                    variant="primary"
                    onClick={() => navigate('/admin/erp/financial')}
                  >
                    📊 통합 회계 시스템
                  </ErpButton>
                )}
                
                {PermissionChecks.canManageRefund(userPermissions) && (
                  <ErpButton
                    variant="danger"
                    onClick={() => navigate('/erp/refund-management')}
                  >
                    💸 환불 관리 시스템
                  </ErpButton>
                )}
              </div>
            </div>
          </div>

          {/* 최근 활동 섹션 */}
          <div className="erp-section">
            <div className="erp-section-header">
              <h3 className="erp-section-title">최근 활동</h3>
            </div>
            <div className="erp-section-content">
              <div className="erp-empty-state">
                최근 활동 내역이 없습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ErpDashboard;
