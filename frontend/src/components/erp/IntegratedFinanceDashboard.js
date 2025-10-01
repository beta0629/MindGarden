import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import SimpleHeader from '../layout/SimpleHeader';
import FinancialTransactionForm from './FinancialTransactionForm';
import QuickExpenseForm from './QuickExpenseForm';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/main.css';
import './IntegratedFinanceDashboard.css';

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
const IntegratedFinanceDashboard = ({ user: propUser }) => {
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showQuickExpenseForm, setShowQuickExpenseForm] = useState(false);
  
  // 본사 사용자를 위한 지점 선택
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [isHQUser, setIsHQUser] = useState(false);
  
  // 권한 체크 중복 실행 방지
  const permissionCheckedRef = useRef(false);

  // 현재 사용자 결정
  const user = propUser || sessionUser;

  // 세션 체크 및 권한 확인
  useEffect(() => {
    if (sessionLoading) {
      console.log('⏳ 세션 로딩 중...');
      return;
    }

    // OAuth2 콜백 후 세션 확인을 위한 지연 처리
    const checkSessionWithDelay = async () => {
      // 로그인 상태 확인 (propUser 또는 sessionUser 우선, sessionManager는 백업)
      let currentUser = user;
      
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

      console.log('✅ IntegratedFinanceDashboard 접근 허용:', currentUser?.role);
      
      // 동적 권한 목록 가져오기
      await fetchUserPermissions(setUserPermissions);
    };

    // OAuth2 콜백 후 세션 설정을 위한 지연
    setTimeout(checkSessionWithDelay, 100);
  }, [sessionLoading, user, isLoggedIn, navigate]);

  useEffect(() => {
    if (user) {
      // 사용자 권한 조회
      fetchUserPermissions(setUserPermissions);
    }
  }, [user]);

  // 권한이 로드된 후 통합재무관리 접근 권한 확인
  useEffect(() => {
    if (userPermissions && userPermissions.length > 0 && !permissionCheckedRef.current) {
      // 권한이 안정적으로 로드되었는지 확인
      const hasIntegratedFinancePermission = userPermissions.includes('INTEGRATED_FINANCE_VIEW');
      
      console.log('🔍 통합재무관리 권한 체크:', {
        userPermissions,
        hasPermission: hasIntegratedFinancePermission,
        permissionCount: userPermissions.length
      });
      
      if (!hasIntegratedFinancePermission) {
        console.log('❌ 통합재무관리 접근 권한 없음, ERP 대시보드로 이동');
        navigate('/erp/dashboard', { replace: true });
        return;
      }
      
      console.log('✅ 통합재무관리 접근 권한 확인됨');
      permissionCheckedRef.current = true;
      initializeComponent();
    }
  }, [userPermissions, navigate]);
  
  useEffect(() => {
    if (selectedBranch) {
      fetchDashboardData();
    }
  }, [selectedBranch]);
  
  const initializeComponent = async () => {
    try {
      // 사용자 권한 확인
      const userRole = user?.role;
      const isHQ = userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN' || user?.branchCode === 'HQ';
      setIsHQUser(isHQ);
      
      if (isHQ) {
        // 본사 사용자: 지점 목록 로드
        await loadBranches();
      } else {
        // 지점 사용자: 자기 지점으로 설정
        setSelectedBranch(user?.branchCode || '');
      }
    } catch (err) {
      console.error('컴포넌트 초기화 실패:', err);
      setError('초기화 중 오류가 발생했습니다.');
    }
  };
  
  const loadBranches = async () => {
    try {
      const response = await axios.get('/api/hq/branches', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setBranches(response.data.data || []);
        // 기본값으로 첫 번째 지점 선택
        if (response.data.data && response.data.data.length > 0) {
          setSelectedBranch(response.data.data[0].branchCode);
        }
      }
    } catch (err) {
      console.error('지점 목록 로드 실패:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 지점 선택에 따른 API 호출
      let url = '/api/erp/finance/dashboard';
      let targetBranch = selectedBranch;
      
      if (isHQUser) {
        // 본사 사용자: 선택된 지점의 데이터 조회
        if (selectedBranch === 'HQ' || !selectedBranch) {
          // HQ 선택 또는 미선택 시 통합 데이터 조회
          console.log('📍 본사 - 통합 데이터 조회');
          // 파라미터 없이 호출하면 통합 데이터
        } else {
          // 특정 지점 선택 시 해당 지점 데이터 조회
          url += `?branchCode=${selectedBranch}`;
          console.log('📍 본사 - 지점별 데이터 조회:', selectedBranch);
        }
      } else {
        // 지점 사용자: 자기 지점 데이터만 조회 (파라미터 전달하지 않음)
        targetBranch = user?.branchCode;
        console.log('📍 지점 사용자 - 자기 지점 데이터 조회:', targetBranch);
      }
      
      const response = await axios.get(url, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('✅ ERP 대시보드 데이터 로드 완료:', response.data.data);
      } else {
        setError(response.data.message);
        
        // 재로그인 필요한 경우 로그인 화면으로 이동
        if (response.data.redirectToLogin) {
          console.error('🔒 세션 만료 - 로그인 화면으로 이동');
          window.location.href = '/login';
          return;
        }
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      // 401 오류인 경우 로그인 화면으로 이동
      if (err.response?.status === 401 || err.status === 401) {
        console.error('🔒 인증 오류 - 로그인 화면으로 이동');
        window.location.href = '/login';
        return;
      }
      
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <LoadingSpinner text="데이터를 불러오는 중..." size="medium" />;
  }

  if (error) {
    return (
      <div className="error-container">
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <SimpleHeader />
      <div className="integrated-finance-container">
        {/* 헤더 */}
      <div className="integrated-finance-header">
        <div className="header-content">
          <h1 className="header-title">
            📊 통합 회계 관리 시스템
          </h1>
          <p className="header-subtitle">
            {isHQUser 
              ? `${selectedBranch ? (selectedBranch === 'HQ' ? '전체 지점 통합' : `${selectedBranch} 지점`) : '지점을 선택하세요'} - 수입/지출 관리`
              : `${user?.branchCode || ''} 지점 - 수입/지출 관리`
            }
          </p>
        </div>
        <div className="integrated-finance-dropdown-container">
          {isHQUser && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="integrated-finance-select integrated-finance-select--branch"
            >
              <option value="">지점 선택</option>
              {branches.map(branch => (
                <option key={branch.codeValue} value={branch.codeValue}>
                  {branch.codeLabel}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="integrated-finance-select integrated-finance-select--period"
          >
            <option value="daily">일간</option>
            <option value="monthly">월간</option>
            <option value="yearly">년간</option>
          </select>
          <button
            onClick={() => setShowQuickExpenseForm(true)}
            className="mg-btn mg-btn--danger mg-btn--sm"
          >
            ⚡ 빠른 지출
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="mg-btn mg-btn--success mg-btn--sm"
          >
            💰 거래 등록
          </button>
          <button
            onClick={() => window.location.href = '/erp/financial'}
            className="mg-btn mg-btn--primary mg-btn--sm"
          >
            📋 상세 내역 보기
          </button>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="integrated-finance-tabs">
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
            className="integrated-finance-tab-btn"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="integrated-finance-content">
        {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
        {activeTab === 'balance-sheet' && <BalanceSheetTab selectedBranch={selectedBranch} isHQUser={isHQUser} />}
        {activeTab === 'income-statement' && <IncomeStatementTab selectedBranch={selectedBranch} isHQUser={isHQUser} />}
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
      <h2 className="finance-overview-title">📊 재무 개요</h2>
      
      {/* KPI 카드들 */}
      <div className="finance-kpi-grid"
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
      
      {/* 매핑 연동 상태 섹션 */}
      <div className="finance-mapping-section">
        <h3 className="finance-mapping-title"
          gap: '8px'
        }}>
          <i className="bi bi-link-45deg" style={{ color: '#007bff' }}></i>
          매핑시스템 연동 상태
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#28a745' }}>
              {financialData.incomeByCategory?.CONSULTATION ? 
                `₩${formatNumber(financialData.incomeByCategory.CONSULTATION)}` : '₩0'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#6c757d', marginTop: '4px' }}>
              💰 매핑 입금확인 수입
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#dc3545' }}>
              {financialData.expenseByCategory?.CONSULTATION ? 
                `₩${formatNumber(financialData.expenseByCategory.CONSULTATION)}` : '₩0'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#6c757d', marginTop: '4px' }}>
              📤 매핑 환불처리 지출
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#007bff' }}>
              {financialData.transactionCount || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#6c757d', marginTop: '4px' }}>
              🔄 총 연동 거래 건수
            </div>
          </div>
          
          <div style={{
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: '#17a2b8' }}>
              실시간 연동
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: '#6c757d', marginTop: '4px' }}>
              ✅ 매핑 ↔ ERP 자동 동기화
            </div>
            <button
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: 'var(--font-size-xs)',
                border: '1px solid #17a2b8',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: '#17a2b8',
                cursor: 'pointer'
              }}
              onClick={() => window.location.href = '/branch_super_admin/mapping-management'}
            >
              📋 매핑시스템 확인
            </button>
          </div>
        </div>
      </div>

      {/* 수입/지출 요약 */}
      <div className="finance-kpi-grid"
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-xl)', fontWeight: '600', position: 'relative', zIndex: 1 }}>💚 수입</h3>
          <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
            {formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', opacity: '0.9', position: 'relative', zIndex: 1 }}>
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-xl)', fontWeight: '600', position: 'relative', zIndex: 1 }}>❤️ 지출</h3>
          <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
            {formatCurrency(totalExpense)}
          </div>
          <div style={{ fontSize: 'var(--font-size-md)', opacity: '0.9', position: 'relative', zIndex: 1 }}>
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
        <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-xxl)', fontWeight: '600', position: 'relative', zIndex: 1 }}>💙 순이익</h3>
        <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          {formatCurrency(netProfit)}
        </div>
        <div style={{ fontSize: 'var(--font-size-base)', opacity: '0.9', position: 'relative', zIndex: 1 }}>
          수입 - 지출
        </div>
      </div>
    </div>
  );
};

// 대차대조표 탭 컴포넌트
const BalanceSheetTab = ({ selectedBranch, isHQUser }) => {
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, [selectedBranch]);

  const fetchBalanceSheet = async () => {
    try {
      let url = '/api/erp/finance/balance-sheet';
      if (isHQUser && selectedBranch && selectedBranch !== 'HQ') {
        url += `?branchCode=${selectedBranch}`;
      }
      
      const response = await axios.get(url, {
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
    return <LoadingSpinner text="대차대조표를 불러오는 중..." size="medium" />;
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
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💚 자산</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: 'var(--font-size-md)', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>유동자산</h4>
            <div style={{ fontSize: 'var(--font-size-sm)', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>현금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.cash || 0)}</div>
              <div style={{ marginBottom: '4px' }}>예금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.bankDeposits || 0)}</div>
              <div style={{ marginBottom: '4px' }}>매출채권: {formatCurrency(balanceSheetData?.assets?.currentAssets?.accountsReceivable || 0)}</div>
              <div style={{ marginBottom: '4px' }}>재고자산: {formatCurrency(balanceSheetData?.assets?.currentAssets?.inventory || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>
              유동자산 합계: {formatCurrency(balanceSheetData?.assets?.currentAssets?.total || 0)}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--font-size-md)', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>고정자산</h4>
            <div style={{ fontSize: 'var(--font-size-sm)', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>사무용품: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.officeEquipment || 0)}</div>
              <div style={{ marginBottom: '4px' }}>컴퓨터 장비: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.computerEquipment || 0)}</div>
              <div style={{ marginBottom: '4px' }}>임대료지불보증금: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.leaseDeposits || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>
              고정자산 합계: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.netAmount || 0)}
            </div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px', marginTop: '12px' }}>
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
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>❤️ 부채</h3>
          
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: 'var(--font-size-md)', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>유동부채</h4>
            <div style={{ fontSize: 'var(--font-size-sm)', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>매입채무: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable || 0)}</div>
              <div style={{ marginBottom: '4px' }}>단기차입금: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.shortTermLoans || 0)}</div>
              <div style={{ marginBottom: '4px' }}>미지급비용: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accruedExpenses || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>
              유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.total || 0)}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: 'var(--font-size-md)', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0', fontWeight: '500' }}>비유동부채</h4>
            <div style={{ fontSize: 'var(--font-size-sm)', marginLeft: '12px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '4px' }}>장기차입금: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.longTermLoans || 0)}</div>
            </div>
            <div style={{ fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px', marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>
              비유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.total || 0)}
            </div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px', marginTop: '12px' }}>
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
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💙 자본</h3>
          
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '18px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>자본금: {formatCurrency(balanceSheetData?.equity?.capital?.total || 0)}</div>
            <div style={{ marginBottom: '6px' }}>이익잉여금: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.total || 0)}</div>
            <div style={{ marginBottom: '6px' }}>당기순이익: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.netIncome || 0)}</div>
          </div>

          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
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
        <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
          {balanceSheetData?.summary?.isBalanced ? '✅ 대차대조표 균형' : '❌ 대차대조표 불균형'}
        </h4>
        <div style={{ fontSize: 'var(--font-size-md)', lineHeight: '1.6', opacity: '0.9' }}>
          자산 총계: <strong>{formatCurrency(balanceSheetData?.summary?.totalAssets || 0)}</strong> = 부채 + 자본: <strong>{formatCurrency(balanceSheetData?.summary?.totalLiabilitiesAndEquity || 0)}</strong>
          {!balanceSheetData?.summary?.isBalanced && (
            <div style={{ marginTop: '8px', fontWeight: '600' }}>
              ⚠️ 차이: {formatCurrency(balanceSheetData?.summary?.difference || 0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 손익계산서 탭 컴포넌트
const IncomeStatementTab = ({ selectedBranch, isHQUser }) => {
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomeStatement();
  }, [selectedBranch]);

  const fetchIncomeStatement = async () => {
    try {
      let url = '/api/erp/finance/income-statement';
      if (isHQUser && selectedBranch && selectedBranch !== 'HQ') {
        url += `?branchCode=${selectedBranch}`;
      }
      
      const response = await axios.get(url, {
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
    return <LoadingSpinner text="손익계산서를 불러오는 중..." size="medium" />;
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
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💚 수익</h3>
          <div style={{ fontSize: 'var(--font-size-md)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>상담 수익:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.revenue?.consultationRevenue || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>기타 수익:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.revenue?.otherRevenue || 0)}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'var(--font-size-base)' }}>
                <span>수익 총계:</span>
                <span>{formatCurrency(incomeStatementData?.revenue?.total || 0)}</span>
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
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>❤️ 비용</h3>
          <div style={{ fontSize: 'var(--font-size-md)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>급여비용:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.salaryExpense || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>임대료:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.rentExpense || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>관리비:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.utilityExpense || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>사무용품비:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.officeExpense || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>세금:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.taxExpense || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>기타비용:</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(incomeStatementData?.expenses?.otherExpense || 0)}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '12px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 'var(--font-size-base)' }}>
                <span>비용 총계:</span>
                <span>{formatCurrency(incomeStatementData?.expenses?.total || 0)}</span>
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
        <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--font-size-xxl)', fontWeight: '600', position: 'relative', zIndex: 1 }}>💙 당기순이익</h3>
        <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          {formatCurrency(incomeStatementData?.netIncome || 0)}
        </div>
        <div style={{ fontSize: 'var(--font-size-base)', opacity: '0.9', position: 'relative', zIndex: 1 }}>
          수익 총계 - 비용 총계
        </div>
      </div>
    </div>
  );
};

// 일간 리포트 탭 컴포넌트
const DailyReportTab = ({ period }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDailyReport();
  }, []);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/erp/finance/daily-report', {
        withCredentials: true
      });
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('일간 리포트를 불러오는 중 오류가 발생했습니다.');
      console.error('Daily report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="일간 리포트 데이터를 불러오는 중..." size="medium" />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📅 일간 재무 리포트</h2>
      
      <div className="finance-kpi-grid"
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 일간 수입 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💚 일간 수입</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>상담료: {formatCurrency(reportData?.dailyIncome?.consultationFees || 0)}</div>
            <div style={{ marginBottom: '6px' }}>기타수입: {formatCurrency(reportData?.dailyIncome?.otherIncome || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 수입: {formatCurrency(reportData?.dailyIncome?.total || 0)}
          </div>
        </div>

        {/* 일간 지출 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>❤️ 일간 지출</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>급여: {formatCurrency(reportData?.dailyExpenses?.salary || 0)}</div>
            <div style={{ marginBottom: '6px' }}>사무용품: {formatCurrency(reportData?.dailyExpenses?.officeSupplies || 0)}</div>
            <div style={{ marginBottom: '6px' }}>관리비: {formatCurrency(reportData?.dailyExpenses?.utilities || 0)}</div>
            <div style={{ marginBottom: '6px' }}>기타지출: {formatCurrency(reportData?.dailyExpenses?.otherExpenses || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 지출: {formatCurrency(reportData?.dailyExpenses?.total || 0)}
          </div>
        </div>

        {/* 일간 순이익 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(116,185,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💙 일간 순이익</h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px' }}>
            {formatCurrency(reportData?.dailyNetIncome || 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>
            수입 - 지출
          </div>
        </div>
      </div>

      {/* 거래 건수 */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600', color: '#2c3e50' }}>📊 일간 거래 건수</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#3498db', marginBottom: '8px' }}>
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>상담 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#27ae60', marginBottom: '8px' }}>
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>구매 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#f39c12', marginBottom: '8px' }}>
              {reportData?.transactionCount?.payments || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>결제 건수</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 월간 리포트 탭 컴포넌트
const MonthlyReportTab = ({ period }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMonthlyReport();
  }, []);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/erp/finance/monthly-report', {
        withCredentials: true
      });
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('월간 리포트를 불러오는 중 오류가 발생했습니다.');
      console.error('Monthly report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="월간 리포트 데이터를 불러오는 중..." size="medium" />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📊 월간 재무 리포트</h2>
      
      <div className="finance-kpi-grid"
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 월간 수입 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💚 월간 수입</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>상담수익: {formatCurrency(reportData?.monthlyIncome?.consultationRevenue || 0)}</div>
            <div style={{ marginBottom: '6px' }}>기타수익: {formatCurrency(reportData?.monthlyIncome?.otherRevenue || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 수입: {formatCurrency(reportData?.monthlyIncome?.total || 0)}
          </div>
        </div>

        {/* 월간 지출 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>❤️ 월간 지출</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>급여지출: {formatCurrency(reportData?.monthlyExpenses?.salaryExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>임대료: {formatCurrency(reportData?.monthlyExpenses?.rentExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>관리비: {formatCurrency(reportData?.monthlyExpenses?.utilityExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>사무용품비: {formatCurrency(reportData?.monthlyExpenses?.officeExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>세금: {formatCurrency(reportData?.monthlyExpenses?.taxExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>구매비용: {formatCurrency(reportData?.monthlyExpenses?.purchaseExpense || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 지출: {formatCurrency(reportData?.monthlyExpenses?.total || 0)}
          </div>
        </div>

        {/* 월간 순이익 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(116,185,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💙 월간 순이익</h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px' }}>
            {formatCurrency(reportData?.monthlyNetIncome || 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>
            수입 - 지출
          </div>
        </div>
      </div>

      {/* 월간 거래 건수 */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600', color: '#2c3e50' }}>📊 월간 거래 건수</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#3498db', marginBottom: '8px' }}>
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>상담 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#27ae60', marginBottom: '8px' }}>
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>구매 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#f39c12', marginBottom: '8px' }}>
              {reportData?.transactionCount?.payments || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>결제 건수</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 년간 리포트 탭 컴포넌트
const YearlyReportTab = ({ period }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchYearlyReport();
  }, []);

  const fetchYearlyReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/erp/finance/yearly-report', {
        withCredentials: true
      });
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('년간 리포트를 불러오는 중 오류가 발생했습니다.');
      console.error('Yearly report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="년간 리포트 데이터를 불러오는 중..." size="medium" />;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>📈 년간 재무 리포트</h2>
      
      <div className="finance-kpi-grid"
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* 년간 수입 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #bae7d9, #c7f0db)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,184,148,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💚 년간 수입</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>상담수익: {formatCurrency(reportData?.yearlyIncome?.consultationRevenue || 0)}</div>
            <div style={{ marginBottom: '6px' }}>기타수익: {formatCurrency(reportData?.yearlyIncome?.otherRevenue || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 수입: {formatCurrency(reportData?.yearlyIncome?.total || 0)}
          </div>
        </div>

        {/* 년간 지출 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #ffb3ba, #ffc1cc)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255,118,117,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>❤️ 년간 지출</h3>
          <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '6px' }}>급여지출: {formatCurrency(reportData?.yearlyExpenses?.salaryExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>임대료: {formatCurrency(reportData?.yearlyExpenses?.rentExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>관리비: {formatCurrency(reportData?.yearlyExpenses?.utilityExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>사무용품비: {formatCurrency(reportData?.yearlyExpenses?.officeExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>세금: {formatCurrency(reportData?.yearlyExpenses?.taxExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>구매비용: {formatCurrency(reportData?.yearlyExpenses?.purchaseExpense || 0)}</div>
            <div style={{ marginBottom: '6px' }}>기타지출: {formatCurrency(reportData?.yearlyExpenses?.otherExpense || 0)}</div>
          </div>
          <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', borderTop: '2px solid rgba(255,255,255,0.5)', paddingTop: '12px' }}>
            총 지출: {formatCurrency(reportData?.yearlyExpenses?.total || 0)}
          </div>
        </div>

        {/* 년간 순이익 */}
        <div style={{
          padding: '24px',
          background: 'linear-gradient(135deg, #a8d8ea, #c7ceea)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(116,185,255,0.2)',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>💙 년간 순이익</h3>
          <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px' }}>
            {formatCurrency(reportData?.yearlyNetIncome || 0)}
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>
            수입 - 지출
          </div>
        </div>
      </div>

      {/* 년간 거래 건수 */}
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '18px', fontSize: 'var(--font-size-xl)', fontWeight: '600', color: '#2c3e50' }}>📊 년간 거래 건수</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#3498db', marginBottom: '8px' }}>
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>상담 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#27ae60', marginBottom: '8px' }}>
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>구매 건수</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 'var(--font-size-xxl)', fontWeight: 'bold', color: '#f39c12', marginBottom: '8px' }}>
              {reportData?.transactionCount?.payments || 0}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: '#666' }}>결제 건수</div>
          </div>
        </div>
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
      <div style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '12px', position: 'relative', zIndex: 1 }}>{icon}</div>
      <div style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 'bold', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '6px', position: 'relative', zIndex: 1 }}>
        {title}
      </div>
      <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9', position: 'relative', zIndex: 1 }}>
        {subtitle}
      </div>
    </div>
  );
};

export default IntegratedFinanceDashboard;
