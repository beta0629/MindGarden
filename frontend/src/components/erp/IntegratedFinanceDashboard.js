import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
// // import SimpleLayout from '../layout/SimpleLayout';
import FinancialTransactionForm from './FinancialTransactionForm';
import QuickExpenseForm from './QuickExpenseForm';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Clock, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Calendar,
  FileText
} from 'lucide-react';
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
    };

    // OAuth2 콜백 후 세션 설정을 위한 지연
    setTimeout(checkSessionWithDelay, 100);
  }, [sessionLoading, isLoggedIn, navigate]); // user 의존성 제거

  // 권한 체크 및 데이터 로드
  useEffect(() => {
    const checkPermissionAndLoad = async () => {
      if (!sessionLoading && user && user.id && !permissionCheckedRef.current) {
        console.log('🔍 통합재무관리 권한 체크 및 로드 시작');
        
        // 권한 조회
        const permissions = await fetchUserPermissions();
        console.log('✅ 권한 조회 완료:', permissions);
        
        // 권한 확인
        const hasIntegratedFinancePermission = permissions.includes('INTEGRATED_FINANCE_VIEW');
        console.log('🔍 통합재무관리 권한 체크:', {
          permissionsCount: permissions.length,
          hasPermission: hasIntegratedFinancePermission,
          permissions: permissions
        });
        
        if (!hasIntegratedFinancePermission) {
          console.log('❌ 통합재무관리 접근 권한 없음');
          setError('통합재무관리 접근 권한이 없습니다.');
          setLoading(false);
          permissionCheckedRef.current = true;
          return;
        }
        
        console.log('✅ 통합재무관리 접근 권한 확인됨');
        setUserPermissions(permissions);
        permissionCheckedRef.current = true;
        
        // 데이터 로드
        await initializeComponent();
      }
    };
    
    checkPermissionAndLoad();
  }, [sessionLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    // selectedBranch가 설정되거나 권한 체크가 완료된 후 데이터 로드
    if (permissionCheckedRef.current && (selectedBranch || !isHQUser)) {
      console.log('📍 대시보드 데이터 로드 시작:', { selectedBranch, isHQUser });
      fetchDashboardData();
    }
  }, [selectedBranch, permissionCheckedRef.current]); // eslint-disable-line react-hooks/exhaustive-deps
  
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
        // 지점 사용자: 자기 지점으로 설정하고 즉시 데이터 로드
        const branchCode = user?.branchCode || '';
        setSelectedBranch(branchCode);
        console.log('📍 지점 사용자 - 지점 코드 설정:', branchCode);
        // fetchDashboardData는 useEffect에서 자동 호출됨
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
    return <div className="mg-loading">로딩중...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        오류: {error}
      </div>
    );
  }

  return (
    <SimpleLayout>
      <div className="mg-dashboard-layout">
        {/* Dashboard Header */}
        <div className="mg-dashboard-header">
          <div className="mg-dashboard-header-content">
            <div className="mg-dashboard-header-left">
              <BarChart3 size={32} />
              <div>
                <h1 className="mg-dashboard-title">통합 회계 관리 시스템</h1>
                <p className="mg-dashboard-subtitle">
                  {isHQUser 
                    ? `${selectedBranch ? (selectedBranch === 'HQ' ? '전체 지점 통합' : `${selectedBranch} 지점`) : '지점을 선택하세요'} - 수입/지출 관리`
                    : `${user?.branchCode || ''} 지점 - 수입/지출 관리`
                  }
                </p>
              </div>
            </div>
            <div className="mg-dashboard-header-right">
              {isHQUser && (
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="mg-v2-select"
                >
                  <option key="branch-default" value="">지점 선택</option>
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
                className="mg-v2-select"
              >
                <option key="daily" value="daily">일간</option>
                <option key="monthly" value="monthly">월간</option>
                <option key="yearly" value="yearly">년간</option>
              </select>
              <button className="mg-button"
                variant="danger"
                size="small"
                onClick={() => setShowQuickExpenseForm(true)}
                title="빠른 지출"
                className="mg-dashboard-icon-btn"
              >
                <TrendingDown size={18} />
              </button>
              <button className="mg-button"
                variant="success"
                size="small"
                onClick={() => setShowTransactionForm(true)}
                title="거래 등록"
                className="mg-dashboard-icon-btn"
              >
                <DollarSign size={18} />
              </button>
              <button className="mg-button"
                variant="primary"
                size="small"
                onClick={() => window.location.href = '/erp/financial'}
                title="상세 내역 보기"
                className="mg-dashboard-icon-btn"
              >
                <FileText size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mg-dashboard-content">
          <div className="mg-v2-card">
            {/* 탭 메뉴 */}
            <div className="integrated-finance-tabs">
              {[
                { key: 'overview', label: '개요' },
                { key: 'balance-sheet', label: '대차대조표' },
                { key: 'income-statement', label: '손익계산서' },
                { key: 'daily', label: '일간 리포트' },
                { key: 'monthly', label: '월간 리포트' },
                { key: 'yearly', label: '년간 리포트' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`integrated-finance-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
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
          </div>
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
    </SimpleLayout>
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
      <DashboardSection
        title="재무 개요"
        icon={<BarChart3 size={24} />}
      >
        {/* KPI 카드들 */}
        <div className="mg-dashboard-stats">
          <StatCard
            icon={<Package />}
            value={(data.erpStats?.totalItems || 0).toLocaleString()}
            label="총 아이템 수"
            change="등록된 비품 수"
          />
          <StatCard
            icon={<Clock />}
            value={(data.erpStats?.pendingRequests || 0).toLocaleString()}
            label="승인 대기 요청"
            change="관리자 승인 대기"
            changeType="negative"
          />
          <StatCard
            icon={<ShoppingCart />}
            value={(data.erpStats?.totalOrders || 0).toLocaleString()}
            label="총 주문 수"
            change="완료된 구매 주문"
            changeType="positive"
          />
          <StatCard
            icon={<DollarSign />}
            value={data.erpStats?.budgetUsage || '0%'}
            label="예산 사용률"
            change={`${formatCurrency(data.erpStats?.budgetUsed || 0)} / ${formatCurrency(data.erpStats?.budgetTotal || 0)}`}
          />
        </div>
      </DashboardSection>
      
      {/* 매핑 연동 상태 섹션 */}
      <DashboardSection
        title="매핑시스템 연동 상태"
        icon={<BarChart3 size={24} />}
      >
        <div className="mg-dashboard-stats">
          <StatCard
            icon={<TrendingUp />}
            value={financialData.incomeByCategory?.CONSULTATION ? 
              formatCurrency(financialData.incomeByCategory.CONSULTATION) : formatCurrency(0)}
            label="매핑 입금확인 수입"
          />
          <StatCard
            icon={<TrendingDown />}
            value={financialData.expenseByCategory?.CONSULTATION ? 
              formatCurrency(financialData.expenseByCategory.CONSULTATION) : formatCurrency(0)}
            label="매핑 환불처리 지출"
            changeType="negative"
          />
          <StatCard
            icon={<BarChart3 />}
            value={(financialData.transactionCount || 0).toLocaleString()}
            label="총 연동 거래 건수"
          />
          <div className="mg-v2-card mg-v2-card--outlined mg-v2-text-center">
            <div className="mg-v2-text-info mg-v2-font-weight-bold">
              실시간 연동
            </div>
            <div className="mg-v2-text-xs mg-v2-text-secondary" style={{ marginTop: '4px' }}>
              ✅ 매핑 ↔ ERP 자동 동기화
            </div>
            <button className="mg-button"
              variant="outline"
              size="small"
              style={{ marginTop: '8px' }}
              onClick={() => window.location.href = '/branch_super_admin/mapping-management'}
            >
              📋 매핑시스템 확인
            </button>
          </div>
        </div>
      </DashboardSection>

      {/* 수입/지출 요약 */}
      <DashboardSection
        title="수입/지출 요약"
        icon={<BarChart3 size={24} />}
      >
        <div className="mg-dashboard-stats">
          <div className="finance-summary-card finance-summary-card--income">
            <div className="net-income-decoration-1"></div>
            <h3 className="finance-summary-card-title">
              <TrendingUp size={24} className="finance-icon-inline" />
              수입
            </h3>
            <div className="net-income-value">
              {formatCurrency(totalIncome)}
            </div>
            <div className="net-income-subtitle">
              {getIncomeDescription()}
            </div>
          </div>
          <div className="finance-summary-card finance-summary-card--expense">
            <div className="net-income-decoration-1"></div>
            <h3 className="finance-summary-card-title">
              <TrendingDown size={24} className="finance-icon-inline" />
              지출
            </h3>
            <div className="net-income-value">
              {formatCurrency(totalExpense)}
            </div>
            <div className="net-income-subtitle">
              {getExpenseDescription()}
            </div>
          </div>
        </div>

        {/* 순이익 */}
        <div className="net-income-card">
          <div className="net-income-decoration-1"></div>
          <div className="net-income-decoration-2"></div>
          <h3 className="net-income-title">
            <DollarSign className="net-income-icon" size={32} />
            순이익
          </h3>
          <div className="net-income-value">
            {formatCurrency(netProfit)}
          </div>
          <div className="net-income-subtitle">
            수입 - 지출
          </div>
        </div>
      </DashboardSection>
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
    return <div className="mg-loading">로딩중...</div>;
  }

  return (
    <div>
      <DashboardSection
        title="대차대조표"
        icon={<PieChart size={24} />}
      >
      
      <div className="balance-sheet-grid">
        {/* 자산 */}
        <div className="balance-sheet-card balance-sheet-card--assets">
          <h3 className="balance-sheet-card-title">
            <TrendingUp className="balance-sheet-card-icon" size={24} />
            자산
          </h3>
          
          <div className="balance-sheet-section">
            <h4 className="balance-sheet-section-title">유동자산</h4>
            <div className="balance-sheet-items">
              <div className="balance-sheet-item">현금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.cash || 0)}</div>
              <div className="balance-sheet-item">예금: {formatCurrency(balanceSheetData?.assets?.currentAssets?.bankDeposits || 0)}</div>
              <div className="balance-sheet-item">매출채권: {formatCurrency(balanceSheetData?.assets?.currentAssets?.accountsReceivable || 0)}</div>
              <div className="balance-sheet-item">재고자산: {formatCurrency(balanceSheetData?.assets?.currentAssets?.inventory || 0)}</div>
            </div>
            <div className="balance-sheet-total">
              유동자산 합계: {formatCurrency(balanceSheetData?.assets?.currentAssets?.total || 0)}
            </div>
          </div>

          <div className="balance-sheet-section">
            <h4 className="balance-sheet-section-title">고정자산</h4>
            <div className="balance-sheet-items">
              <div className="balance-sheet-item">사무용품: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.officeEquipment || 0)}</div>
              <div className="balance-sheet-item">컴퓨터 장비: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.computerEquipment || 0)}</div>
              <div className="balance-sheet-item">임대료지불보증금: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.leaseDeposits || 0)}</div>
            </div>
            <div className="balance-sheet-total">
              고정자산 합계: {formatCurrency(balanceSheetData?.assets?.fixedAssets?.netAmount || 0)}
            </div>
          </div>

          <div className="balance-sheet-grand-total">
            자산 총계: {formatCurrency(balanceSheetData?.assets?.total || 0)}
          </div>
        </div>

        {/* 부채 */}
        <div className="balance-sheet-card balance-sheet-card--liabilities">
          <h3 className="balance-sheet-card-title">
            <TrendingDown className="balance-sheet-card-icon" size={24} />
            부채
          </h3>
          
          <div className="balance-sheet-section">
            <h4 className="balance-sheet-section-title">유동부채</h4>
            <div className="balance-sheet-items">
              <div className="balance-sheet-item">매입채무: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accountsPayable || 0)}</div>
              <div className="balance-sheet-item">단기차입금: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.shortTermLoans || 0)}</div>
              <div className="balance-sheet-item">미지급비용: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.accruedExpenses || 0)}</div>
            </div>
            <div className="balance-sheet-total">
              유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.currentLiabilities?.total || 0)}
            </div>
          </div>

          <div className="balance-sheet-section">
            <h4 className="balance-sheet-section-title">비유동부채</h4>
            <div className="balance-sheet-items">
              <div className="balance-sheet-item">장기차입금: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.longTermLoans || 0)}</div>
            </div>
            <div className="balance-sheet-total">
              비유동부채 합계: {formatCurrency(balanceSheetData?.liabilities?.longTermLiabilities?.total || 0)}
            </div>
          </div>

          <div className="balance-sheet-grand-total">
            부채 총계: {formatCurrency(balanceSheetData?.liabilities?.total || 0)}
          </div>
        </div>

        {/* 자본 */}
        <div className="balance-sheet-card balance-sheet-card--equity">
          <h3 className="balance-sheet-card-title">
            <PieChart className="balance-sheet-card-icon" size={24} />
            자본
          </h3>
          
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">자본금: {formatCurrency(balanceSheetData?.equity?.capital?.total || 0)}</div>
            <div className="balance-sheet-item">이익잉여금: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.total || 0)}</div>
            <div className="balance-sheet-item">당기순이익: {formatCurrency(balanceSheetData?.equity?.retainedEarnings?.netIncome || 0)}</div>
          </div>

          <div className="balance-sheet-grand-total">
            자본 총계: {formatCurrency(balanceSheetData?.equity?.total || 0)}
          </div>
        </div>
      </div>

      {/* 대차대조표 검증 */}
      <div className={`balance-sheet-card balance-verification-card ${balanceSheetData?.summary?.isBalanced ? 'balance-sheet-card--assets' : 'balance-sheet-card--liabilities'}`}>
        <h4 className="balance-sheet-card-title">
          {balanceSheetData?.summary?.isBalanced ? '✅ 대차대조표 균형' : '❌ 대차대조표 불균형'}
        </h4>
        <div className="balance-sheet-items balance-verification-content">
          자산 총계: <strong>{formatCurrency(balanceSheetData?.summary?.totalAssets || 0)}</strong> = 부채 + 자본: <strong>{formatCurrency(balanceSheetData?.summary?.totalLiabilitiesAndEquity || 0)}</strong>
          {!balanceSheetData?.summary?.isBalanced && (
            <div className="balance-sheet-total">
              ⚠️ 차이: {formatCurrency(balanceSheetData?.summary?.difference || 0)}
            </div>
          )}
        </div>
      </div>
      </DashboardSection>
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
    return <div className="mg-loading">로딩중...</div>;
  }

  return (
    <div>
      <DashboardSection
        title="손익계산서"
        icon={<BarChart3 size={24} />}
      >
      
      <div className="income-statement-grid">
        {/* 수익 */}
        <div className="income-statement-card income-statement-card--revenue">
          <h3 className="income-statement-card-title">
            <TrendingUp className="income-statement-card-icon" size={24} />
            수익
          </h3>
          <div className="income-statement-items">
            <div className="income-statement-item">
              <span>상담 수익:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.revenue?.consultationRevenue || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>기타 수익:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.revenue?.otherRevenue || 0)}</span>
            </div>
            <div className="income-statement-total">
              <div className="income-statement-total-row">
                <span>수익 총계:</span>
                <span>{formatCurrency(incomeStatementData?.revenue?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 비용 */}
        <div className="income-statement-card income-statement-card--expenses">
          <h3 className="income-statement-card-title">
            <TrendingDown className="income-statement-card-icon" size={24} />
            비용
          </h3>
          <div className="income-statement-items">
            <div className="income-statement-item">
              <span>급여비용:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.salaryExpense || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>임대료:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.rentExpense || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>관리비:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.utilityExpense || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>사무용품비:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.officeExpense || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>세금:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.taxExpense || 0)}</span>
            </div>
            <div className="income-statement-item">
              <span>기타비용:</span>
              <span className="income-statement-item-value">{formatCurrency(incomeStatementData?.expenses?.otherExpense || 0)}</span>
            </div>
            <div className="income-statement-total">
              <div className="income-statement-total-row">
                <span>비용 총계:</span>
                <span>{formatCurrency(incomeStatementData?.expenses?.total || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 순이익 */}
      <div className="net-income-card">
        <div className="net-income-decoration-1"></div>
        <div className="net-income-decoration-2"></div>
        <h3 className="net-income-title">
          <DollarSign className="net-income-icon" size={32} />
          당기순이익
        </h3>
        <div className="net-income-value">
          {formatCurrency(incomeStatementData?.netIncome || 0)}
        </div>
        <div className="net-income-subtitle">
          수익 총계 - 비용 총계
        </div>
      </div>
      </DashboardSection>
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
    return <div className="mg-loading">로딩중...</div>;
  }

  if (error) {
    return (
      <div className="finance-empty-state">
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <DashboardSection
        title="일간 재무 리포트"
        icon={<Calendar size={24} />}
      >
      
      <div className="finance-kpi-grid">
        {/* 일간 수입 */}
        <div className="balance-sheet-card balance-sheet-card--assets">
          <h3 className="balance-sheet-card-title">
            <TrendingUp className="balance-sheet-card-icon" size={24} />
            일간 수입
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">상담료: {formatCurrency(reportData?.dailyIncome?.consultationFees || 0)}</div>
            <div className="balance-sheet-item">기타수입: {formatCurrency(reportData?.dailyIncome?.otherIncome || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 수입: {formatCurrency(reportData?.dailyIncome?.total || 0)}
          </div>
        </div>

        {/* 일간 지출 */}
        <div className="balance-sheet-card balance-sheet-card--liabilities">
          <h3 className="balance-sheet-card-title">
            <TrendingDown className="balance-sheet-card-icon" size={24} />
            일간 지출
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">급여: {formatCurrency(reportData?.dailyExpenses?.salary || 0)}</div>
            <div className="balance-sheet-item">사무용품: {formatCurrency(reportData?.dailyExpenses?.officeSupplies || 0)}</div>
            <div className="balance-sheet-item">관리비: {formatCurrency(reportData?.dailyExpenses?.utilities || 0)}</div>
            <div className="balance-sheet-item">기타지출: {formatCurrency(reportData?.dailyExpenses?.otherExpenses || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 지출: {formatCurrency(reportData?.dailyExpenses?.total || 0)}
          </div>
        </div>

        {/* 일간 순이익 */}
        <div className="balance-sheet-card balance-sheet-card--equity">
          <h3 className="balance-sheet-card-title">
            <DollarSign className="balance-sheet-card-icon" size={24} />
            일간 순이익
          </h3>
          <div className="net-income-value">
            {formatCurrency(reportData?.dailyNetIncome || 0)}
          </div>
          <div className="net-income-subtitle">
            수입 - 지출
          </div>
        </div>
      </div>

      {/* 거래 건수 */}
      <div className="finance-transactions-section">
        <h3 className="finance-transactions-title">
          <BarChart3 size={24} className="finance-icon-inline" />
          일간 거래 건수
        </h3>
        <div className="finance-transactions-grid">
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div className="finance-transaction-label">상담 건수</div>
          </div>
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div className="finance-transaction-label">구매 건수</div>
          </div>
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.payments || 0}
            </div>
            <div className="finance-transaction-label">결제 건수</div>
          </div>
        </div>
      </div>
      </DashboardSection>
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
    return <div className="mg-loading">로딩중...</div>;
  }

  if (error) {
    return (
      <div className="finance-empty-state">
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <DashboardSection
        title="월간 재무 리포트"
        icon={<BarChart3 size={24} />}
      >
      
      <div className="finance-kpi-grid">
        {/* 월간 수입 */}
        <div className="balance-sheet-card balance-sheet-card--assets">
          <h3 className="balance-sheet-card-title">
            <TrendingUp className="balance-sheet-card-icon" size={24} />
            월간 수입
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">상담수익: {formatCurrency(reportData?.monthlyIncome?.consultationRevenue || 0)}</div>
            <div className="balance-sheet-item">기타수익: {formatCurrency(reportData?.monthlyIncome?.otherRevenue || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 수입: {formatCurrency(reportData?.monthlyIncome?.total || 0)}
          </div>
        </div>

        {/* 월간 지출 */}
        <div className="balance-sheet-card balance-sheet-card--liabilities">
          <h3 className="balance-sheet-card-title">
            <TrendingDown className="balance-sheet-card-icon" size={24} />
            월간 지출
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">급여지출: {formatCurrency(reportData?.monthlyExpenses?.salaryExpense || 0)}</div>
            <div className="balance-sheet-item">임대료: {formatCurrency(reportData?.monthlyExpenses?.rentExpense || 0)}</div>
            <div className="balance-sheet-item">관리비: {formatCurrency(reportData?.monthlyExpenses?.utilityExpense || 0)}</div>
            <div className="balance-sheet-item">사무용품비: {formatCurrency(reportData?.monthlyExpenses?.officeExpense || 0)}</div>
            <div className="balance-sheet-item">세금: {formatCurrency(reportData?.monthlyExpenses?.taxExpense || 0)}</div>
            <div className="balance-sheet-item">구매비용: {formatCurrency(reportData?.monthlyExpenses?.purchaseExpense || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 지출: {formatCurrency(reportData?.monthlyExpenses?.total || 0)}
          </div>
        </div>

        {/* 월간 순이익 */}
        <div className="balance-sheet-card balance-sheet-card--equity">
          <h3 className="balance-sheet-card-title">
            <DollarSign className="balance-sheet-card-icon" size={24} />
            월간 순이익
          </h3>
          <div className="net-income-value">
            {formatCurrency(reportData?.monthlyNetIncome || 0)}
          </div>
          <div className="net-income-subtitle">
            수입 - 지출
          </div>
        </div>
      </div>

      {/* 월간 거래 건수 */}
      <div className="finance-transactions-section">
        <h3 className="finance-transactions-title">
          <BarChart3 size={24} className="finance-icon-inline" />
          월간 거래 건수
        </h3>
        <div className="finance-transactions-grid">
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div className="finance-transaction-label">상담 건수</div>
          </div>
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div className="finance-transaction-label">구매 건수</div>
          </div>
          <div className="finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.payments || 0}
            </div>
            <div className="finance-transaction-label">결제 건수</div>
          </div>
        </div>
      </div>
      </DashboardSection>
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
    return <div className="mg-loading">로딩중...</div>;
  }

  if (error) {
    return (
      <div className="finance-empty-state">
        오류: {error}
      </div>
    );
  }

  return (
    <div>
      <DashboardSection
        title="년간 재무 리포트"
        icon={<TrendingUp size={24} />}
      >
      
      <div className="finance-kpi-grid">
        {/* 년간 수입 */}
        <div className="balance-sheet-card balance-sheet-card--assets">
          <h3 className="balance-sheet-card-title">
            <TrendingUp className="balance-sheet-card-icon" size={24} />
            년간 수입
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">상담수익: {formatCurrency(reportData?.yearlyIncome?.consultationRevenue || 0)}</div>
            <div className="balance-sheet-item">기타수익: {formatCurrency(reportData?.yearlyIncome?.otherRevenue || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 수입: {formatCurrency(reportData?.yearlyIncome?.total || 0)}
          </div>
        </div>

        {/* 년간 지출 */}
        <div className="balance-sheet-card balance-sheet-card--liabilities">
          <h3 className="balance-sheet-card-title">
            <TrendingDown className="balance-sheet-card-icon" size={24} />
            년간 지출
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">급여지출: {formatCurrency(reportData?.yearlyExpenses?.salaryExpense || 0)}</div>
            <div className="balance-sheet-item">임대료: {formatCurrency(reportData?.yearlyExpenses?.rentExpense || 0)}</div>
            <div className="balance-sheet-item">관리비: {formatCurrency(reportData?.yearlyExpenses?.utilityExpense || 0)}</div>
            <div className="balance-sheet-item">사무용품비: {formatCurrency(reportData?.yearlyExpenses?.officeExpense || 0)}</div>
            <div className="balance-sheet-item">세금: {formatCurrency(reportData?.yearlyExpenses?.taxExpense || 0)}</div>
            <div className="balance-sheet-item">구매비용: {formatCurrency(reportData?.yearlyExpenses?.purchaseExpense || 0)}</div>
            <div className="balance-sheet-item">기타지출: {formatCurrency(reportData?.yearlyExpenses?.otherExpense || 0)}</div>
          </div>
          <div className="balance-sheet-grand-total">
            총 지출: {formatCurrency(reportData?.yearlyExpenses?.total || 0)}
          </div>
        </div>

        {/* 년간 순이익 */}
        <div className="balance-sheet-card balance-sheet-card--equity">
          <h3 className="balance-sheet-card-title">
            <DollarSign className="balance-sheet-card-icon" size={24} />
            년간 순이익
          </h3>
          <div className="net-income-value">
            {formatCurrency(reportData?.yearlyNetIncome || 0)}
          </div>
          <div className="net-income-subtitle">
            수입 - 지출
          </div>
        </div>
      </div>
      </DashboardSection>
    </div>
  );
};

export default IntegratedFinanceDashboard;
