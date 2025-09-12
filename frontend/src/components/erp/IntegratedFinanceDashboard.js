import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SimpleHeader from '../layout/SimpleHeader';
import FinancialTransactionForm from './FinancialTransactionForm';
import QuickExpenseForm from './QuickExpenseForm';

// 공통 유틸리티 함수들
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

/**
 * 통합 재무 대시보드 컴포넌트
 * ERP와 회계 시스템을 통합한 수입/지출 관리 화면
 */
const IntegratedFinanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showQuickExpenseForm, setShowQuickExpenseForm] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/erp/finance/dashboard', {
        withCredentials: true
      });
      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        데이터를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#e74c3c'
      }}>
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <SimpleHeader />
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        padding: '30px',
          background: 'linear-gradient(135deg, #a8d8ea 0%, #c7ceea 100%)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        color: 'white'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            📊 통합 회계 관리 시스템
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.9)',
            fontWeight: '300'
          }}>
            수입/지출 통합 관리 및 대차대조표
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer'
            }}
          >
            <option value="daily">일간</option>
            <option value="monthly">월간</option>
            <option value="yearly">년간</option>
          </select>
          <button
            onClick={() => setShowQuickExpenseForm(true)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(255,179,186,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            ⚡ 빠른 지출
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(0,184,148,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            💰 거래 등록
          </button>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(116,185,255,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            🔄 새로고침
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div style={{
        display: 'flex',
        marginBottom: '30px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: '16px',
        padding: '8px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {[
          { key: 'overview', label: '📈 개요', icon: '📈' },
          { key: 'balance-sheet', label: '⚖️ 대차대조표', icon: '⚖️' },
          { key: 'income-statement', label: '💰 손익계산서', icon: '💰' },
          { key: 'daily', label: '📅 일간 리포트', icon: '📅' },
          { key: 'monthly', label: '📊 월간 리포트', icon: '📊' },
          { key: 'yearly', label: '📈 년간 리포트', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: '14px 18px',
              border: 'none',
              background: activeTab === tab.key 
                ? 'linear-gradient(135deg, #a8d8ea, #c7ceea)' 
                : 'transparent',
              color: activeTab === tab.key ? 'white' : '#2c3e50',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? '600' : '500',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === tab.key 
                ? '0 4px 15px rgba(168,216,234,0.3)' 
                : 'none',
              transform: activeTab === tab.key ? 'translateY(-2px)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
        {activeTab === 'balance-sheet' && <BalanceSheetTab />}
        {activeTab === 'income-statement' && <IncomeStatementTab />}
        {activeTab === 'daily' && <DailyReportTab period={selectedPeriod} />}
        {activeTab === 'monthly' && <MonthlyReportTab period={selectedPeriod} />}
        {activeTab === 'yearly' && <YearlyReportTab period={selectedPeriod} />}
      </div>

      {/* 모달 컴포넌트들 */}
      {showTransactionForm && (
        <FinancialTransactionForm
          onClose={() => setShowTransactionForm(false)}
          onSuccess={() => {
            fetchDashboardData();
            setShowTransactionForm(false);
          }}
        />
      )}

      {showQuickExpenseForm && (
        <QuickExpenseForm
          onClose={() => setShowQuickExpenseForm(false)}
          onSuccess={() => {
            fetchDashboardData();
            setShowQuickExpenseForm(false);
          }}
        />
      )}
      </div>
    </div>
  );
};

// 개요 탭 컴포넌트
const OverviewTab = ({ data }) => {
  if (!data) return <div>데이터가 없습니다.</div>;

  // 실제 재무 데이터 추출
  const financialData = data.financialData || {};
  const totalIncome = financialData.totalIncome || 0;
  const totalExpense = financialData.totalExpense || 0;
  const netProfit = financialData.netProfit || 0;
  const incomeByCategory = financialData.incomeByCategory || {};
  const expenseByCategory = financialData.expenseByCategory || {};

  // 카테고리별 수입/지출 설명 생성
  const getIncomeDescription = () => {
    const categories = Object.keys(incomeByCategory);
    if (categories.length === 0) return '상담료, 기타수입';
    return categories.join(', ');
  };

  const getExpenseDescription = () => {
    const categories = Object.keys(expenseByCategory);
    if (categories.length === 0) return '급여, 임대료, 관리비, 세금';
    return categories.join(', ');
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📊 재무 개요</h2>
      
      {/* KPI 카드들 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <KPICard
          title="총 아이템 수"
          value={data.erpStats?.totalItems || 0}
          subtitle="등록된 비품 수"
          color="#3498db"
          icon="📦"
        />
        <KPICard
          title="승인 대기 요청"
          value={data.erpStats?.pendingRequests || 0}
          subtitle="관리자 승인 대기"
          color="#f39c12"
          icon="⏳"
        />
        <KPICard
          title="총 주문 수"
          value={data.erpStats?.totalOrders || 0}
          subtitle="완료된 구매 주문"
          color="#27ae60"
          icon="📋"
        />
        <KPICard
          title="예산 사용률"
          value={data.erpStats?.budgetUsage || '0%'}
          subtitle={`${formatCurrency(data.erpStats?.budgetUsed || 0)} / ${formatCurrency(data.erpStats?.budgetTotal || 0)}`}
          color="#e74c3c"
          icon="💰"
        />
      </div>

      {/* 수입/지출 요약 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{
          padding: '28px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.3)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }}></div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', position: 'relative', zIndex: 1 }}>💚 수입</h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
            {formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: '15px', opacity: '0.9', position: 'relative', zIndex: 1 }}>
            {getIncomeDescription()}
          </div>
        </div>
        <div style={{
          padding: '28px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.3)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }}></div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', position: 'relative', zIndex: 1 }}>❤️ 지출</h3>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
            {formatCurrency(totalExpense)}
          </div>
          <div style={{ fontSize: '15px', opacity: '0.9', position: 'relative', zIndex: 1 }}>
            {getExpenseDescription()}
          </div>
        </div>
      </div>

      {/* 순이익 */}
      <div style={{
        padding: '32px',
        background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(116,185,255,0.4)',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }}></div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600', position: 'relative', zIndex: 1 }}>💙 순이익</h3>
        <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          {formatCurrency(netProfit)}
        </div>
        <div style={{ fontSize: '16px', opacity: '0.9', position: 'relative', zIndex: 1 }}>
          수입 - 지출
        </div>
      </div>
    </div>
  );
};

// 대차대조표 탭 컴포넌트
const BalanceSheetTab = () => {
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async () => {
    try {
      const response = await axios.get('/api/erp/finance/balance-sheet', {
        withCredentials: true
      });
      if (response.data.success) {
        setBalanceSheetData(response.data.data);
      }
    } catch (err) {
      console.error('Balance sheet fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>대차대조표를 불러오는 중...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>⚖️ 대차대조표</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        {/* 자산 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '20px', fontWeight: '600' }}>💚 자산</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>유동자산</h4>
            <div style={{ fontSize: '13px', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>현금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.cash || 0)}</div>
              <div style={{ marginBottom: '4px' }}>예금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.bankDeposits || 0)}</div>
              <div style={{ marginBottom: '4px' }}>매출채권: {formatCurrency(balanceSheetData?.assets?.currentAssets?.accountsReceivable || 0)}</div>
              <div style={{ marginBottom: '4px' }}>재고자산: {formatCurrency(balanceSheetData?.assets?.currentAssets?.inventory || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: '14px' }}>
              유동자산 합계: {formatCurrency(balanceSheetData?.assets?.currentAssets?.total || 0)}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>고정자산</h4>
            <div style={{ fontSize: '13px', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>사무용품: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.officeEquipment || 0)}</div>
              <div style={{ marginBottom: '4px' }}>컴퓨터 장비: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.computerEquipment || 0)}</div>
              <div style={{ marginBottom: '4px' }}>임대료지불보증금: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.leaseDeposits || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: '14px' }}>
              고정자산 합계: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.netAmount || 0)}
            </div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px', marginTop: '12px' }}>
            자산 총계: {formatCurrency(balanceSheetData?.assets?.total || 0)}
          </div>
        </div>

        {/* 부채 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '20px', fontWeight: '600' }}>❤️ 부채</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>유동부채</h4>
            <div style={{ fontSize: '13px', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>매입채무: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable || 0)}</div>
              <div style={{ marginBottom: '4px' }}>단기차입금: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.shortTermLoans || 0)}</div>
              <div style={{ marginBottom: '4px' }}>미지급비용: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accruedExpenses || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: '14px' }}>
              유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.total || 0)}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>비유동부채</h4>
            <div style={{ fontSize: '13px', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>장기차입금: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.longTermLoans || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: '14px' }}>
              비유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.total || 0)}
            </div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px', marginTop: '12px' }}>
            부채 총계: {formatCurrency(balanceSheetData?.liabilities?.total || 0)}
          </div>
        </div>

        {/* 자본 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(116,185,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '20px', fontWeight: '600' }}>💙 자본</h3>
          
          <div style={{ fontSize: '13px', marginBottom: '18px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>자본금: {formatCurrency(balanceSheetData?.equity?.capital?.total || 0)}</div>
            <div style={{ marginBottom: '6px' }}>이익잉여금: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.total || 0)}</div>
            <div style={{ marginBottom: '6px' }}>당기순이익: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.netIncome || 0)}</div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            자본 총계: {formatCurrency(balanceSheetData?.equity?.total || 0)}
          </div>
        </div>
      </div>

      {/* 대차대조표 검증 */}
      <div style={{
        marginTop: '24px',
        padding: '24px',
        background: balanceSheetData?.summary?.isBalanced 
          ? 'linear-gradient(135deg, #bae7d9, #c7f0db)' 
          : 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        textAlign: 'center',
        color: 'white'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600' }}>
          {balanceSheetData?.summary?.isBalanced ? '✅ 대차대조표 균형' : '❌ 대차대조표 불균형'}
        </h4>
        <div style={{ fontSize: '15px', lineHeight: '1.6', opacity: '0.9' }}>
          자산 총계: <strong>{formatCurrency(340000000)}</strong> = 부채 + 자본: <strong>{formatCurrency(265000000)}</strong>
          {!balanceSheetData?.summary?.isBalanced && (
            <div style={{ marginTop: '8px', fontWeight: '600' }}>
              ⚠️ 차이: {formatCurrency(75000000)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 손익계산서 탭 컴포넌트
const IncomeStatementTab = () => {
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomeStatement();
  }, []);

  const fetchIncomeStatement = async () => {
    try {
      const response = await axios.get('/api/erp/finance/income-statement', {
        withCredentials: true
      });
      if (response.data.success) {
        setIncomeStatementData(response.data.data);
      }
    } catch (err) {
      console.error('Income statement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>손익계산서를 불러오는 중...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>💰 손익계산서</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 수익 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '20px', fontWeight: '600' }}>💚 수익</h3>
          <div style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>상담 수익:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(150000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>기타 수익:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(5000000)}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                <span>수익 총계:</span>
                <span>{formatCurrency(155000000)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 비용 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '20px', fontWeight: '600' }}>❤️ 비용</h3>
          <div style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>급여비용:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(60000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>임대료:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(12000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>관리비:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(3000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>사무용품비:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(8000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>세금:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(15000000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>기타비용:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(2000000)}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                <span>비용 총계:</span>
                <span>{formatCurrency(100000000)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 순이익 */}
      <div style={{
        marginTop: '24px',
        padding: '32px',
        background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(116,185,255,0.4)',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%'
        }}></div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600', position: 'relative', zIndex: 1 }}>💙 당기순이익</h3>
        <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          {formatCurrency(55000000)}
        </div>
        <div style={{ fontSize: '16px', opacity: '0.9', position: 'relative', zIndex: 1 }}>
          수익 총계 - 비용 총계
        </div>
      </div>
    </div>
  );
};

// 일간 리포트 탭 컴포넌트
const DailyReportTab = ({ period }) => {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📅 일간 재무 리포트</h2>
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        일간 리포트 데이터를 불러오는 중...
      </div>
    </div>
  );
};

// 월간 리포트 탭 컴포넌트
const MonthlyReportTab = ({ period }) => {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📊 월간 재무 리포트</h2>
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        월간 리포트 데이터를 불러오는 중...
      </div>
    </div>
  );
};

// 년간 리포트 탭 컴포넌트
const YearlyReportTab = ({ period }) => {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📈 년간 재무 리포트</h2>
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        년간 리포트 데이터를 불러오는 중...
      </div>
    </div>
  );
};

// KPI 카드 컴포넌트
const KPICard = ({ title, value, subtitle, color, icon }) => {
  const getGradientColor = (color) => {
    const colorMap = {
      '#3498db': 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
      '#e67e22': 'linear-gradient(135deg, #ffd3a5, #fd9853)',
      '#27ae60': 'linear-gradient(135deg, #bae7d9, #c7f0db)',
      '#e74c3c': 'linear-gradient(135deg, #ffb3ba, #ffc1cc)'
    };
    return colorMap[color] || `linear-gradient(135deg, ${color}, ${color}dd)`;
  };

  return (
    <div style={{
      padding: '24px',
      background: getGradientColor(color),
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      textAlign: 'center',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%'
      }}></div>
      <div style={{ fontSize: '32px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', position: 'relative', zIndex: 1 }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', opacity: '0.9', position: 'relative', zIndex: 1 }}>
        {subtitle}
      </div>
    </div>
  );
};

export default IntegratedFinanceDashboard;
