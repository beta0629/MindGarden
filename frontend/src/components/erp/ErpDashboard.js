import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpLoading from './common/ErpLoading';
import ErpHeader from './common/ErpHeader';

/**
 * ERP 메인 대시보드 컴포넌트
 */
const ErpDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalOrders: 0,
    totalBudget: 0,
    usedBudget: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 여러 API 호출
      const [itemsRes, pendingRes, ordersRes, budgetsRes] = await Promise.all([
        fetch('/api/erp/items'),
        fetch('/api/erp/purchase-requests/pending-admin'),
        fetch('/api/erp/purchase-orders'),
        fetch('/api/erp/budgets')
      ]);

      const [itemsData, pendingData, ordersData, budgetsData] = await Promise.all([
        itemsRes.json(),
        pendingRes.json(),
        ordersRes.json(),
        budgetsRes.json()
      ]);

      // 예산 통계 계산
      const totalBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.totalBudget || 0), 0) || 0;
      const usedBudget = budgetsData.data?.reduce((sum, budget) => 
        sum + parseFloat(budget.usedBudget || 0), 0) || 0;

      setStats({
        totalItems: itemsData.data?.length || 0,
        pendingRequests: pendingData.data?.length || 0,
        approvedRequests: 0, // TODO: 승인된 요청 수 조회
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
    return <ErpLoading message="대시보드 데이터를 불러오는 중..." />;
  }

  return (
    <SimpleLayout>
      <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
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
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
            {stats.totalItems.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            등록된 비품 수
          </div>
        </ErpCard>

        <ErpCard title="승인 대기 요청">
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.pendingRequests.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            관리자 승인 대기
          </div>
        </ErpCard>

        <ErpCard title="총 주문 수">
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
            {stats.totalOrders.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            완료된 구매 주문
          </div>
        </ErpCard>

        <ErpCard title="예산 사용률">
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
            {getBudgetUsagePercentage()}%
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
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
          <ErpButton
            variant="primary"
            size="large"
            onClick={() => window.location.href = '/erp/purchase-requests'}
            style={{ width: '100%' }}
          >
            구매 요청하기
          </ErpButton>
          
          <ErpButton
            variant="info"
            size="large"
            onClick={() => window.location.href = '/erp/approvals'}
            style={{ width: '100%' }}
          >
            승인 관리
          </ErpButton>
          
          <ErpButton
            variant="success"
            size="large"
            onClick={() => window.location.href = '/erp/items'}
            style={{ width: '100%' }}
          >
            아이템 관리
          </ErpButton>
          
          <ErpButton
            variant="warning"
            size="large"
            onClick={() => window.location.href = '/erp/budgets'}
            style={{ width: '100%' }}
          >
            예산 관리
          </ErpButton>
          
          <ErpButton
            variant="danger"
            size="large"
            onClick={() => window.location.href = '/erp/salary'}
            style={{ width: '100%' }}
          >
            급여 관리
          </ErpButton>
          
          <ErpButton
            variant="secondary"
            size="large"
            onClick={() => window.location.href = '/erp/tax'}
            style={{ width: '100%' }}
          >
            세금 관리
          </ErpButton>
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
  );
};

export default ErpDashboard;
