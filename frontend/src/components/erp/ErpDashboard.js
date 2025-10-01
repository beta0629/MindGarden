import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import LoadingSpinner from '../common/LoadingSpinner';
import ErpHeader from './common/ErpHeader';
import axios from 'axios';
import '../../styles/main.css';
import './ErpDashboard.css';

/**
 * ERP 메인 대시보드 컴포넌트
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

    // OAuth2 콜백 후 세션 확인을 위한 지연 처리
    const checkSessionWithDelay = async () => {
      // 로그인 상태 확인 (propUser 또는 sessionUser 우선, sessionManager는 백업)
      let currentUser = propUser || sessionUser;
      
      // OAuth2 콜백 후 세션이 아직 설정되지 않았을 수 있으므로 API 직접 호출
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
              currentUser = userData; // currentUser 업데이트
            }
          }
        } catch (error) {
          console.log('❌ 세션 API 호출 실패:', error);
        }
        
        // 백업으로 sessionManager 확인
        if (!currentUser || !currentUser.role) {
          currentUser = sessionManager.getUser();
          if (!currentUser || !currentUser.role) {
            console.log('❌ 사용자 정보 없음, 로그인 페이지로 이동');
            console.log('👤 propUser:', propUser);
            console.log('👤 sessionUser:', sessionUser);
            console.log('👤 sessionManager 사용자:', currentUser);
            navigate('/login', { replace: true });
            return;
          }
        }
      }

      console.log('✅ ERP Dashboard 접근 허용:', currentUser?.role);
      
      // 동적 권한 목록 가져오기
      await fetchUserPermissions(setUserPermissions);
    };

    // OAuth2 콜백 후 세션 설정을 위한 지연
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
      
      // 병렬로 여러 API 호출 (axios 사용)
      const [itemsResponse, pendingResponse, ordersResponse, budgetsResponse] = await Promise.all([
        axios.get('/api/erp/items', { withCredentials: true }),
        axios.get('/api/erp/purchase-requests/pending-admin', { withCredentials: true }),
        axios.get('/api/erp/purchase-orders', { withCredentials: true }),
        axios.get('/api/erp/budgets', { withCredentials: true })
      ]);

      const [itemsData, pendingData, ordersData, budgetsData] = [
        itemsResponse.data,
        pendingResponse.data,
        ordersResponse.data,
        budgetsResponse.data
      ];

      // 예산 통계 계산
      const totalBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.totalBudget || 0), 0) || 0;
      const usedBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.usedBudget || 0), 0) || 0;

      setStats({
        totalItems: itemsData.data?.length || 0,
        pendingRequests: pendingData.data?.length || 0,
        approvedRequests: 0, // 승인된 요청 수는 별도 API 없음
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
    return <LoadingSpinner text="대시보드 데이터를 불러오는 중..." size="medium" />;
  }

  return (
    <div className="glass-background">
      <SimpleLayout>
        <div className="erp-dashboard-container">
        <ErpHeader
          title="ERP 관리 시스템"
          subtitle="상담사 비품 구매 및 예산 관리"
          actions={
            <ErpButton
              variant="primary"
              onClick={loadDashboardData}
            >
              새로고침
            </ErpButton>
          }
        />

      {/* 통계 카드들 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <ErpCard title="총 아이템 수">
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', color: '#007bff' }}>
            {stats.totalItems.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginTop: '4px' }}>
            등록된 비품 수
          </div>
        </ErpCard>

        <ErpCard title="승인 대기 요청">
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.pendingRequests.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginTop: '4px' }}>
            관리자 승인 대기
          </div>
        </ErpCard>

        <ErpCard title="총 주문 수">
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', color: '#28a745' }}>
            {stats.totalOrders.toLocaleString()}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginTop: '4px' }}>
            완료된 구매 주문
          </div>
        </ErpCard>

        <ErpCard title="예산 사용률">
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', color: '#dc3545' }}>
            {getBudgetUsagePercentage()}%
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginTop: '4px' }}>
            {formatCurrency(stats.usedBudget)} / {formatCurrency(stats.totalBudget)}
          </div>
        </ErpCard>
      </div>

      {/* 빠른 액션 버튼들 */}
      <ErpCard title="빠른 액션">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          {PermissionChecks.canViewPurchaseRequests(userPermissions) && (
            <ErpButton
              variant="primary"
              size="large"
              onClick={() => window.location.href = '/erp/purchase-requests'}
              style={{ width: '100%' }}
            >
              구매 요청하기
            </ErpButton>
          )}
          
          {PermissionChecks.canManageApprovals(userPermissions) && (
            <ErpButton
              variant="info"
              size="large"
              onClick={() => window.location.href = '/erp/approvals'}
              style={{ width: '100%' }}
            >
              승인 관리
            </ErpButton>
          )}
          
          {PermissionChecks.canManageItems(userPermissions) && (
            <ErpButton
              variant="success"
              size="large"
              onClick={() => window.location.href = '/erp/items'}
              style={{ width: '100%' }}
            >
              아이템 관리
            </ErpButton>
          )}
          
          {PermissionChecks.canManageBudget(userPermissions) && (
            <ErpButton
              variant="warning"
              size="large"
              onClick={() => window.location.href = '/erp/budget'}
              style={{ width: '100%' }}
            >
              예산 관리
            </ErpButton>
          )}
          
          {PermissionChecks.canManageSalary(userPermissions) && (
            <ErpButton
              variant="danger"
              size="large"
              onClick={() => window.location.href = '/erp/salary'}
              style={{ width: '100%' }}
            >
              급여 관리
            </ErpButton>
          )}
          
          {PermissionChecks.canManageTax(userPermissions) && (
            <ErpButton
              variant="secondary"
              size="large"
              onClick={() => window.location.href = '/erp/tax'}
              style={{ width: '100%' }}
            >
              세금 관리
            </ErpButton>
          )}
          
          {PermissionChecks.canViewIntegratedFinance(userPermissions) && (
            <ErpButton
              variant="primary"
              size="large"
              onClick={() => navigate('/admin/erp/financial')}
              style={{ 
                width: '100%', 
                backgroundColor: '#8e44ad', 
                borderColor: '#8e44ad',
                color: 'white'
              }}
            >
              📊 통합 회계 시스템
            </ErpButton>
          )}
          
          {PermissionChecks.canManageRefund(userPermissions) && (
            <ErpButton
              variant="danger"
              size="large"
              onClick={() => navigate('/erp/refund-management')}
              style={{ 
                width: '100%', 
                backgroundColor: '#dc3545', 
                borderColor: '#dc3545',
                color: 'white'
              }}
            >
              💸 환불 관리 시스템
            </ErpButton>
          )}
        </div>
      </ErpCard>

      {/* 최근 활동 */}
      <ErpCard title="최근 활동">
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          최근 활동 내역이 없습니다.
        </div>
      </ErpCard>
        </div>
      </SimpleLayout>
    </div>
  );
};

export default ErpDashboard;
