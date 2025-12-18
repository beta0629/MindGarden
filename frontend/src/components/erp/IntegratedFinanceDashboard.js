import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { AUTH_API, ERP_API } from '../../constants/api';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { COMMON_CSS_CLASSES } from '../../constants/css';
import SimpleLayout from '../layout/SimpleLayout';
import FinancialTransactionForm from './FinancialTransactionForm';
import QuickExpenseForm from './QuickExpenseForm';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import MGButton from '../../components/common/MGButton';
import notificationManager from '../../utils/notification';
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
  FileText,
  BookOpen,
  Receipt,
  Calculator
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
 * 권한 조회 실패 시 사용자 역할 기반 기본 권한 설정
 * 표준화: ErpDashboard와 동일한 로직 사용
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
 * 사용자 역할 기반 기본 권한 반환 (동기 함수)
 */
const getDefaultPermissionsForRole = (user) => {
  if (!user || !user.role) {
    return [];
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
  }

  return defaultPermissions;
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
          const response = await fetch(AUTH_API.GET_CURRENT_USER, {
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
        
        // 권한 조회 (실패해도 계속 진행)
        let permissions = [];
        try {
          permissions = await fetchUserPermissions();
          console.log('✅ 권한 조회 완료:', permissions);
          
          // 권한 조회 결과가 비어있으면 기본 권한 설정
          if (!permissions || permissions.length === 0) {
            console.warn('⚠️ 권한 조회 결과가 비어있음, 기본 권한 설정');
            setDefaultPermissionsForRole(user, setUserPermissions);
            permissions = await new Promise((resolve) => {
              setTimeout(() => {
                const defaultPerms = getDefaultPermissionsForRole(user);
                resolve(defaultPerms);
              }, 100);
            });
          }
        } catch (error) {
          console.warn('⚠️ 권한 조회 실패 (기본 권한 설정):', error);
          setDefaultPermissionsForRole(user, setUserPermissions);
          permissions = getDefaultPermissionsForRole(user);
        }
        
        // 권한 확인 (표준화: 상수 사용)
        const hasIntegratedFinancePermission = PermissionChecks.canViewIntegratedFinance(permissions);
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
      // 사용자 권한 확인 (표준화: RoleUtils 사용)
      const isHQ = RoleUtils.isHqMaster(user) || RoleUtils.isSuperHqAdmin(user) || user?.branchCode === 'HQ';
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
      const response = await axios.get(ERP_API.HQ_BRANCHES, {
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
      let url = ERP_API.FINANCE_DASHBOARD;
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
          navigate('/login', { replace: true });
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
    return (
      <SimpleLayout>
        <UnifiedLoading type="page" text="데이터를 불러오는 중..." />
      </SimpleLayout>
    );
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
              <MGButton
                variant="danger"
                size="small"
                onClick={() => setShowQuickExpenseForm(true)}
                title="빠른 지출"
                className="mg-dashboard-icon-btn"
              >
                <TrendingDown size={18} />
              </MGButton>
              <MGButton
                variant="success"
                size="small"
                onClick={() => setShowTransactionForm(true)}
                title="거래 등록"
                className="mg-dashboard-icon-btn"
              >
                <DollarSign size={18} />
              </MGButton>
              <MGButton
                variant="primary"
                size="small"
                onClick={() => navigate('/admin/erp/financial')}
                title="상세 내역 보기"
                className="mg-dashboard-icon-btn"
              >
                <FileText size={18} />
              </MGButton>
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
                { key: 'journal-entries', label: '분개 관리' },
                { key: 'ledgers', label: '원장 조회' },
                { key: 'balance-sheet', label: '대차대조표' },
                { key: 'income-statement', label: '손익계산서' },
                { key: 'settlement', label: '정산 관리' },
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
              {activeTab === 'journal-entries' && <JournalEntriesTab />}
              {activeTab === 'ledgers' && <LedgersTab />}
              {activeTab === 'balance-sheet' && <BalanceSheetTab selectedBranch={selectedBranch} isHQUser={isHQUser} />}
              {activeTab === 'income-statement' && <IncomeStatementTab selectedBranch={selectedBranch} isHQUser={isHQUser} />}
              {activeTab === 'settlement' && <SettlementTab />}
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
  const navigate = useNavigate();
  
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
            <div className="mg-v2-text-xs mg-v2-text-secondary mg-v2-mt-xs">
              ✅ 매핑 ↔ ERP 자동 동기화
            </div>
            <MGButton
              variant="outline"
              size="small"
              className="mg-v2-mt-sm"
              onClick={() => navigate('/admin/mapping-management')}
            >
              📋 매핑시스템 확인
            </MGButton>
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
      let url = ERP_API.FINANCE_BALANCE_SHEET;
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
    return <UnifiedLoading text="대차대조표를 불러오는 중..." size="medium" type="inline" />;
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
      let url = ERP_API.FINANCE_INCOME_STATEMENT;
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
    return <UnifiedLoading text="손익계산서를 불러오는 중..." size="medium" type="inline" />;
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
      const response = await axios.get(ERP_API.FINANCE_DAILY_REPORT, {
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
    return <UnifiedLoading text="일간 리포트 데이터를 불러오는 중..." size="medium" type="inline" />;
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
      const response = await axios.get(ERP_API.FINANCE_MONTHLY_REPORT, {
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
    return <UnifiedLoading text="월간 리포트 데이터를 불러오는 중..." size="medium" type="inline" />;
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
      const response = await axios.get(ERP_API.FINANCE_YEARLY_REPORT, {
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
    return <UnifiedLoading text="년간 리포트 데이터를 불러오는 중..." size="medium" type="inline" />;
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

// 분개 관리 탭 컴포넌트
const JournalEntriesTab = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      const response = await axios.get(ERP_API.JOURNAL_ENTRIES, {
        withCredentials: true
      });
      if (response.data.success) {
        setEntries(response.data.data || []);
      }
    } catch (err) {
      console.error('Journal entries fetch error:', err);
      notificationManager.show('분개 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await axios.put(ERP_API.JOURNAL_ENTRY_APPROVE(id), {}, {
        withCredentials: true
      });
      if (response.data.success) {
        notificationManager.show('분개가 승인되었습니다.', 'success');
        fetchJournalEntries();
      }
    } catch (err) {
      console.error('Approve error:', err);
      notificationManager.show('분개 승인에 실패했습니다.', 'error');
    }
  };

  const handlePost = async (id) => {
    try {
      const response = await axios.put(ERP_API.JOURNAL_ENTRY_POST(id), {}, {
        withCredentials: true
      });
      if (response.data.success) {
        notificationManager.show('분개가 전기되었습니다.', 'success');
        fetchJournalEntries();
      }
    } catch (err) {
      console.error('Post error:', err);
      notificationManager.show('분개 전기에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return <UnifiedLoading text="분개 목록을 불러오는 중..." size="medium" type="inline" />;
  }

  return (
    <section className="mg-v2-section">
      <DashboardSection title="분개 관리" icon={<Receipt size={20} />}>
        <div className="mg-v2-mb-md">
          <MGButton
            variant="primary"
            size="medium"
            onClick={() => setShowCreateModal(true)}
          >
            분개 생성
          </MGButton>
        </div>
        <div className="mg-v2-table-container">
          <table className="mg-table" data-label="분개 목록">
            <thead>
              <tr>
                <th>분개번호</th>
                <th>분개일자</th>
                <th>차변합계</th>
                <th>대변합계</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="mg-v2-text-center mg-v2-text-secondary">
                    분개가 없습니다.
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id}>
                    <td data-label="분개번호">{entry.entryNumber}</td>
                    <td data-label="분개일자">{entry.entryDate}</td>
                    <td data-label="차변합계">{formatCurrency(entry.totalDebit || 0)}</td>
                    <td data-label="대변합계">{formatCurrency(entry.totalCredit || 0)}</td>
                    <td data-label="상태">
                      <span className={`mg-v2-badge mg-v2-badge--${entry.entryStatus?.toLowerCase() || 'default'}`}>
                        {entry.entryStatus === 'DRAFT' ? '초안' : 
                         entry.entryStatus === 'APPROVED' ? '승인됨' : 
                         entry.entryStatus === 'POSTED' ? '전기됨' : entry.entryStatus}
                      </span>
                    </td>
                    <td data-label="작업">
                      <div className={COMMON_CSS_CLASSES.ACTION_BUTTONS}>
                        <MGButton
                          variant="outline"
                          size="small"
                          onClick={() => { setSelectedEntry(entry); setShowDetailModal(true); }}
                        >
                          상세
                        </MGButton>
                        {entry.entryStatus === 'DRAFT' && (
                          <MGButton
                            variant="success"
                            size="small"
                            onClick={() => handleApprove(entry.id)}
                          >
                            승인
                          </MGButton>
                        )}
                        {entry.entryStatus === 'APPROVED' && (
                          <MGButton
                            variant="primary"
                            size="small"
                            onClick={() => handlePost(entry.id)}
                          >
                            전기
                          </MGButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>

      {/* 분개 상세 모달 */}
      {showDetailModal && selectedEntry && (
        <JournalEntryDetailModal
          entry={selectedEntry}
          onClose={() => { setShowDetailModal(false); setSelectedEntry(null); }}
          onRefresh={fetchJournalEntries}
        />
      )}

      {/* 분개 생성 모달 */}
      {showCreateModal && (
        <JournalEntryCreateModal
          onClose={() => setShowCreateModal(false)}
          onRefresh={fetchJournalEntries}
        />
      )}
    </section>
  );
};

// 원장 조회 탭 컴포넌트
const LedgersTab = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [showLedgerDetailModal, setShowLedgerDetailModal] = useState(false);

  useEffect(() => {
    if (selectedAccountId) {
      fetchLedger();
    }
  }, [selectedAccountId, periodStart, periodEnd]);

  const fetchLedger = async () => {
    if (!selectedAccountId) return;
    
    setLoading(true);
    try {
      let url = ERP_API.LEDGERS_ACCOUNT(selectedAccountId);
      if (periodStart && periodEnd) {
        url = `${ERP_API.LEDGERS_PERIOD}?accountId=${selectedAccountId}&startDate=${periodStart}&endDate=${periodEnd}`;
      }
      
      const response = await axios.get(url, {
        withCredentials: true
      });
      if (response.data.success) {
        setLedgers(Array.isArray(response.data.data) ? response.data.data : [response.data.data]);
      }
    } catch (err) {
      console.error('Ledger fetch error:', err);
      notificationManager.show('원장을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !selectedAccountId) {
    return (
      <div>
        <DashboardSection title="원장 조회" icon={<BookOpen size={20} />}>
          <p>계정을 선택해주세요.</p>
        </DashboardSection>
      </div>
    );
  }

  return (
    <section className="mg-v2-section">
      <DashboardSection title="원장 조회" icon={<BookOpen size={20} />}>
        <div className="mg-v2-form-group mg-v2-mb-md">
          <div className="mg-v2-flex mg-v2-gap-sm" style={{ flexWrap: 'wrap' }}>
            <input
              type="number"
              className="mg-v2-input"
              placeholder="계정 ID"
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value ? parseInt(e.target.value) : null)}
            />
            <input
              type="date"
              className="mg-v2-input"
              placeholder="시작일"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
            <input
              type="date"
              className="mg-v2-input"
              placeholder="종료일"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
            <MGButton
              variant="primary"
              size="medium"
              onClick={fetchLedger}
              disabled={!selectedAccountId}
            >
              조회
            </MGButton>
          </div>
        </div>
        
        {ledgers.length > 0 ? (
          <div className="mg-v2-table-container">
            <table className="mg-table" data-label="원장 목록">
              <thead>
                <tr>
                  <th>계정 ID</th>
                  <th>기간 시작</th>
                  <th>기간 종료</th>
                  <th>기초잔액</th>
                  <th>차변합계</th>
                  <th>대변합계</th>
                  <th>기말잔액</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((ledger, idx) => (
                  <tr 
                    key={idx}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSelectedLedger(ledger); setShowLedgerDetailModal(true); }}
                  >
                    <td data-label="계정 ID">{ledger.accountId}</td>
                    <td data-label="기간 시작">{ledger.periodStart}</td>
                    <td data-label="기간 종료">{ledger.periodEnd}</td>
                    <td data-label="기초잔액">{formatCurrency(ledger.openingBalance || 0)}</td>
                    <td data-label="차변합계">{formatCurrency(ledger.totalDebit || 0)}</td>
                    <td data-label="대변합계">{formatCurrency(ledger.totalCredit || 0)}</td>
                    <td data-label="기말잔액">{formatCurrency(ledger.closingBalance || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedAccountId ? (
          <p className="mg-v2-text-center mg-v2-text-secondary">원장 데이터가 없습니다.</p>
        ) : (
          <p className="mg-v2-text-center mg-v2-text-secondary">계정을 선택해주세요.</p>
        )}

        {/* 원장 상세 모달 */}
        {showLedgerDetailModal && selectedLedger && (
          <LedgerDetailModal
            ledger={selectedLedger}
            onClose={() => { setShowLedgerDetailModal(false); setSelectedLedger(null); }}
          />
        )}
      </DashboardSection>
    </section>
  );
};

// 정산 관리 탭 컴포넌트
const SettlementTab = () => {
  const [rules, setRules] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('rules');
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    if (activeSubTab === 'rules') {
      fetchRules();
    } else {
      fetchSettlements();
    }
  }, [activeSubTab]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(ERP_API.SETTLEMENT_RULES, {
        withCredentials: true
      });
      if (response.data.success) {
        setRules(response.data.data || []);
      }
    } catch (err) {
      console.error('Settlement rules fetch error:', err);
      notificationManager.show('정산 규칙을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(ERP_API.SETTLEMENT_RESULTS, {
        withCredentials: true
      });
      if (response.data.success) {
        setSettlements(response.data.data || []);
      }
    } catch (err) {
      console.error('Settlements fetch error:', err);
      notificationManager.show('정산 결과를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (period) => {
    try {
      const response = await axios.post(`${ERP_API.SETTLEMENT_CALCULATE}?period=${period}`, {}, {
        withCredentials: true
      });
      if (response.data.success) {
        notificationManager.show('정산이 계산되었습니다.', 'success');
        fetchSettlements();
      }
    } catch (err) {
      console.error('Calculate error:', err);
      notificationManager.show('정산 계산에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return <UnifiedLoading text="데이터를 불러오는 중..." size="medium" type="inline" />;
  }

  const [settlementPeriod, setSettlementPeriod] = useState('');

  return (
    <section className="mg-v2-section">
      <DashboardSection title="정산 관리" icon={<Calculator size={20} />}>
        <div className="mg-v2-tabs">
          <button 
            className={`mg-v2-tab ${activeSubTab === 'rules' ? COMMON_CSS_CLASSES.ACTIVE : ''}`}
            onClick={() => setActiveSubTab('rules')}
          >
            정산 규칙
          </button>
          <button 
            className={`mg-v2-tab ${activeSubTab === 'results' ? COMMON_CSS_CLASSES.ACTIVE : ''}`}
            onClick={() => setActiveSubTab('results')}
          >
            정산 결과
          </button>
        </div>

        {activeSubTab === 'rules' && (
          <div className="mg-v2-mt-md">
            <div className="mg-v2-mb-md">
              <MGButton
                variant="primary"
                size="medium"
                onClick={() => { setEditingRule(null); setShowCreateRuleModal(true); }}
              >
                규칙 생성
              </MGButton>
            </div>
            <div className="mg-v2-table-container">
              <table className="mg-table" data-label="정산 규칙 목록">
              <thead>
                <tr>
                  <th>규칙명</th>
                  <th>업종 유형</th>
                  <th>정산 유형</th>
                  <th>계산 방법</th>
                  <th>활성화</th>
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="mg-v2-text-center mg-v2-text-secondary">
                      정산 규칙이 없습니다.
                    </td>
                  </tr>
                ) : (
                  rules.map(rule => (
                    <tr key={rule.id}>
                      <td data-label="규칙명">{rule.ruleName}</td>
                      <td data-label="업종 유형">{rule.businessType}</td>
                      <td data-label="정산 유형">{rule.settlementType}</td>
                      <td data-label="계산 방법">{rule.calculationMethod}</td>
                      <td data-label="활성화">
                        <span className={`mg-v2-badge ${rule.isActive ? 'mg-v2-badge--success' : 'mg-v2-badge--secondary'}`}>
                          {rule.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td data-label="작업">
                        <MGButton
                          variant="outline"
                          size="small"
                          onClick={() => { setEditingRule(rule); setShowCreateRuleModal(true); }}
                        >
                          수정
                        </MGButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {activeSubTab === 'results' && (
          <div className="mg-v2-mt-md">
            <div className="mg-v2-form-group mg-v2-mb-md">
              <div className="mg-v2-flex mg-v2-gap-sm">
                <input
                  type="text"
                  className="mg-v2-input"
                  placeholder="정산 기간 (예: 202512)"
                  value={settlementPeriod}
                  onChange={(e) => setSettlementPeriod(e.target.value)}
                />
                <MGButton
                  variant="primary"
                  size="medium"
                  onClick={() => {
                    if (settlementPeriod) handleCalculate(settlementPeriod);
                  }}
                  disabled={!settlementPeriod}
                >
                  정산 계산
                </MGButton>
              </div>
            </div>
            
            <div className="mg-v2-table-container">
              <table className="mg-table" data-label="정산 결과 목록">
                <thead>
                  <tr>
                    <th>정산번호</th>
                    <th>정산기간</th>
                    <th>총매출</th>
                    <th>수수료</th>
                    <th>로열티</th>
                    <th>순정산액</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="mg-v2-text-center mg-v2-text-secondary">
                        정산 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    settlements.map(settlement => (
                      <tr key={settlement.id}>
                        <td data-label="정산번호">{settlement.settlementNumber}</td>
                        <td data-label="정산기간">{settlement.settlementPeriod}</td>
                        <td data-label="총매출">{formatCurrency(settlement.totalRevenue || 0)}</td>
                        <td data-label="수수료">{formatCurrency(settlement.commissionAmount || 0)}</td>
                        <td data-label="로열티">{formatCurrency(settlement.royaltyAmount || 0)}</td>
                        <td data-label="순정산액">{formatCurrency(settlement.netSettlementAmount || 0)}</td>
                        <td data-label="상태">
                          <span className={`mg-v2-badge mg-v2-badge--${settlement.status?.toLowerCase() || 'default'}`}>
                            {settlement.status === 'PENDING' ? '대기중' : 
                             settlement.status === 'APPROVED' ? '승인됨' : 
                             settlement.status === 'PAID' ? '지급완료' : settlement.status}
                          </span>
                        </td>
                        <td data-label="작업">
                          {settlement.status === 'PENDING' && (
                            <MGButton
                              variant="success"
                              size="small"
                              onClick={async () => {
                                try {
                                  const response = await axios.post(ERP_API.SETTLEMENT_APPROVE(settlement.id), {}, {
                                    withCredentials: true
                                  });
                                  if (response.data.success) {
                                    notificationManager.show('정산이 승인되었습니다.', 'success');
                                    fetchSettlements();
                                  }
                                } catch (err) {
                                  notificationManager.show('정산 승인에 실패했습니다.', 'error');
                                }
                              }}
                            >
                              승인
                            </MGButton>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 정산 규칙 생성/수정 모달 */}
        {showCreateRuleModal && (
          <SettlementRuleModal
            rule={editingRule}
            onClose={() => { setShowCreateRuleModal(false); setEditingRule(null); }}
            onRefresh={fetchRules}
          />
        )}
      </DashboardSection>
    </section>
  );
};

// 분개 상세 모달 컴포넌트
const JournalEntryDetailModal = ({ entry, onClose, onRefresh }) => {
  const [entryDetail, setEntryDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchEntryDetail();
  }, [entry.id]);

  const fetchEntryDetail = async () => {
    try {
      const response = await axios.get(ERP_API.JOURNAL_ENTRY_DETAIL(entry.id), {
        withCredentials: true
      });
      if (response.data.success) {
        setEntryDetail(response.data.data);
      }
    } catch (err) {
      console.error('Entry detail fetch error:', err);
      notificationManager.show('분개 상세를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">분개 상세</h3>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-v2-modal-body">
          {loading ? (
            <UnifiedLoading text="분개 상세를 불러오는 중..." size="medium" type="inline" />
          ) : entryDetail ? (
            <div className="mg-v2-form-group">
              <div className="mg-v2-mb-md">
                <label className="mg-v2-label">분개번호</label>
                <div className="mg-v2-text">{entryDetail.entryNumber}</div>
              </div>
              <div className="mg-v2-mb-md">
                <label className="mg-v2-label">분개일자</label>
                <div className="mg-v2-text">{entryDetail.entryDate}</div>
              </div>
              <div className="mg-v2-mb-md">
                <label className="mg-v2-label">상태</label>
                <div className="mg-v2-text">
                  <span className={`mg-v2-badge mg-v2-badge--${entryDetail.entryStatus?.toLowerCase() || 'default'}`}>
                    {entryDetail.entryStatus === 'DRAFT' ? '초안' : 
                     entryDetail.entryStatus === 'APPROVED' ? '승인됨' : 
                     entryDetail.entryStatus === 'POSTED' ? '전기됨' : entryDetail.entryStatus}
                  </span>
                </div>
              </div>
              {entryDetail.lines && entryDetail.lines.length > 0 && (
                <div className="mg-v2-mb-md">
                  <label className="mg-v2-label">분개 라인</label>
                  <div className="mg-v2-table-container">
                    <table className="mg-table" data-label="분개 라인 목록">
                      <thead>
                        <tr>
                          <th>계정</th>
                          <th>차변</th>
                          <th>대변</th>
                          <th>설명</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entryDetail.lines.map((line, idx) => (
                          <tr key={idx}>
                            <td data-label="계정">{line.accountName || line.accountId}</td>
                            <td data-label="차변">{formatCurrency(line.debitAmount || 0)}</td>
                            <td data-label="대변">{formatCurrency(line.creditAmount || 0)}</td>
                            <td data-label="설명">{line.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mg-v2-text-center mg-v2-text-secondary">분개 상세를 불러올 수 없습니다.</p>
          )}
        </div>
        <div className="mg-v2-modal-footer">
          <MGButton variant="secondary" onClick={onClose}>닫기</MGButton>
          {entryDetail && entryDetail.entryStatus === 'DRAFT' && (
            <MGButton 
              variant="primary" 
              onClick={() => { setShowEditModal(true); }}
            >
              수정
            </MGButton>
          )}
        </div>
      </div>

      {/* 분개 수정 모달 */}
      {showEditModal && entryDetail && (
        <JournalEntryEditModal
          entry={entryDetail}
          onClose={() => { setShowEditModal(false); fetchEntryDetail(); }}
          onRefresh={() => { onRefresh(); onClose(); }}
        />
      )}
    </div>
  );
};

// 분개 생성 모달 컴포넌트
const JournalEntryCreateModal = ({ onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [lines, setLines] = useState([
    { accountId: '', debitAmount: '', creditAmount: '', description: '' },
    { accountId: '', debitAmount: '', creditAmount: '', description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => {
      const amount = parseFloat(line.debitAmount) || 0;
      return sum + amount;
    }, 0);
    const totalCredit = lines.reduce((sum, line) => {
      const amount = parseFloat(line.creditAmount) || 0;
      return sum + amount;
    }, 0);
    return { totalDebit, totalCredit };
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debitAmount: '', creditAmount: '', description: '' }]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    } else {
      notificationManager.show('최소 2개의 라인이 필요합니다.', 'warning');
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    // 차변과 대변은 동시에 입력 불가
    if (field === 'debitAmount' && value) {
      newLines[index].creditAmount = '';
    } else if (field === 'creditAmount' && value) {
      newLines[index].debitAmount = '';
    }
    setLines(newLines);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.entryDate) {
      newErrors.entryDate = '분개일자는 필수입니다.';
    }
    
    if (lines.length < 2) {
      newErrors.lines = '최소 2개의 라인이 필요합니다.';
    }
    
    lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`line_${index}_accountId`] = '계정 ID는 필수입니다.';
      }
      if (!line.debitAmount && !line.creditAmount) {
        newErrors[`line_${index}_amount`] = '차변 또는 대변 금액을 입력해주세요.';
      }
      if (line.debitAmount && line.creditAmount) {
        newErrors[`line_${index}_amount`] = '차변과 대변을 동시에 입력할 수 없습니다.';
      }
    });
    
    const { totalDebit, totalCredit } = calculateTotals();
    if (totalDebit !== totalCredit) {
      newErrors.balance = `차변/대변 불균형: 차변 ${formatCurrency(totalDebit)}, 대변 ${formatCurrency(totalCredit)}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notificationManager.show('입력 정보를 확인해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { totalDebit, totalCredit } = calculateTotals();
      
      const requestData = {
        entryDate: formData.entryDate,
        description: formData.description,
        lines: lines.map(line => ({
          accountId: parseInt(line.accountId),
          debitAmount: parseFloat(line.debitAmount) || 0,
          creditAmount: parseFloat(line.creditAmount) || 0,
          description: line.description || ''
        }))
      };

      const response = await axios.post(ERP_API.JOURNAL_ENTRIES, requestData, {
        withCredentials: true
      });

      if (response.data.success) {
        notificationManager.show('분개가 생성되었습니다.', 'success');
        onRefresh();
        onClose();
      } else {
        notificationManager.show(response.data.message || '분개 생성에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('Create entry error:', err);
      notificationManager.show('분개 생성에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">분개 생성</h3>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-v2-modal-body">
          <div className="mg-v2-form-group">
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                분개일자 <span className="mg-v2-text-danger">*</span>
              </label>
              <input
                type="date"
                className={`mg-v2-input ${errors.entryDate ? 'mg-v2-input-error' : ''}`}
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              />
              {errors.entryDate && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.entryDate}</div>}
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">설명</label>
              <input
                type="text"
                className="mg-v2-input"
                placeholder="분개 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="mg-v2-mb-md">
              <div className="mg-v2-flex mg-v2-justify-between mg-v2-mb-sm">
                <label className="mg-v2-label">분개 라인</label>
                <MGButton variant="outline" size="small" onClick={handleAddLine}>
                  라인 추가
                </MGButton>
              </div>
              
              <div className="mg-v2-table-container">
                <table className="mg-table" data-label="분개 라인 입력">
                  <thead>
                    <tr>
                      <th>계정 ID</th>
                      <th>차변</th>
                      <th>대변</th>
                      <th>설명</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td data-label="계정 ID">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_accountId`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="계정 ID"
                            value={line.accountId}
                            onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                          />
                          {errors[`line_${index}_accountId`] && (
                            <div className="mg-v2-text-danger mg-v2-text-xs">{errors[`line_${index}_accountId`]}</div>
                          )}
                        </td>
                        <td data-label="차변">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_amount`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="0"
                            value={line.debitAmount}
                            onChange={(e) => handleLineChange(index, 'debitAmount', e.target.value)}
                          />
                        </td>
                        <td data-label="대변">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_amount`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="0"
                            value={line.creditAmount}
                            onChange={(e) => handleLineChange(index, 'creditAmount', e.target.value)}
                          />
                          {errors[`line_${index}_amount`] && (
                            <div className="mg-v2-text-danger mg-v2-text-xs">{errors[`line_${index}_amount`]}</div>
                          )}
                        </td>
                        <td data-label="설명">
                          <input
                            type="text"
                            className="mg-v2-input mg-v2-input-sm"
                            placeholder="설명"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          />
                        </td>
                        <td data-label="작업">
                          {lines.length > 2 && (
                            <MGButton
                              variant="danger"
                              size="small"
                              onClick={() => handleRemoveLine(index)}
                            >
                              삭제
                            </MGButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="mg-v2-font-weight-bold">합계</td>
                      <td className={`mg-v2-font-weight-bold ${isBalanced ? 'mg-v2-text-success' : 'mg-v2-text-danger'}`}>
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className={`mg-v2-font-weight-bold ${isBalanced ? 'mg-v2-text-success' : 'mg-v2-text-danger'}`}>
                        {formatCurrency(totalCredit)}
                      </td>
                      <td colSpan="2">
                        {errors.balance && (
                          <div className="mg-v2-text-danger mg-v2-text-xs">{errors.balance}</div>
                        )}
                        {isBalanced && !errors.balance && (
                          <div className="mg-v2-text-success mg-v2-text-xs">✓ 차변/대변 균형</div>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="mg-v2-modal-footer">
          <MGButton variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </MGButton>
          <MGButton 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading || !isBalanced}
            loading={loading}
          >
            저장
          </MGButton>
        </div>
      </div>
    </div>
  );
};

// 정산 규칙 생성/수정 모달 컴포넌트
const SettlementRuleModal = ({ rule, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    ruleName: rule?.ruleName || '',
    businessType: rule?.businessType || '',
    settlementType: rule?.settlementType || '',
    calculationMethod: rule?.calculationMethod || 'PERCENTAGE',
    calculationParams: rule?.calculationParams ? JSON.stringify(JSON.parse(rule.calculationParams), null, 2) : '{}',
    isActive: rule?.isActive !== undefined ? rule.isActive : true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.ruleName.trim()) {
      newErrors.ruleName = '규칙명은 필수입니다.';
    }
    
    if (!formData.settlementType) {
      newErrors.settlementType = '정산 유형은 필수입니다.';
    }
    
    if (!formData.calculationMethod) {
      newErrors.calculationMethod = '계산 방법은 필수입니다.';
    }
    
    // calculationParams JSON 검증
    try {
      const params = JSON.parse(formData.calculationParams);
      if (formData.calculationMethod === 'PERCENTAGE' && !params.percentage) {
        newErrors.calculationParams = 'PERCENTAGE 방법은 percentage 파라미터가 필요합니다.';
      } else if (formData.calculationMethod === 'FIXED' && !params.amount) {
        newErrors.calculationParams = 'FIXED 방법은 amount 파라미터가 필요합니다.';
      } else if (formData.calculationMethod === 'TIERED' && !params.tiers) {
        newErrors.calculationParams = 'TIERED 방법은 tiers 파라미터가 필요합니다.';
      }
    } catch (e) {
      newErrors.calculationParams = '유효한 JSON 형식이 아닙니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notificationManager.show('입력 정보를 확인해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        ruleName: formData.ruleName,
        businessType: formData.businessType || null,
        settlementType: formData.settlementType,
        calculationMethod: formData.calculationMethod,
        calculationParams: formData.calculationParams,
        isActive: formData.isActive
      };

      const response = await axios.post(ERP_API.SETTLEMENT_RULES, requestData, {
        withCredentials: true
      });

      if (response.data.success) {
        notificationManager.show(rule ? '정산 규칙이 수정되었습니다.' : '정산 규칙이 생성되었습니다.', 'success');
        onRefresh();
        onClose();
      } else {
        notificationManager.show(response.data.message || '정산 규칙 저장에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('Settlement rule save error:', err);
      notificationManager.show('정산 규칙 저장에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">{rule ? '정산 규칙 수정' : '정산 규칙 생성'}</h3>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-v2-modal-body">
          <div className="mg-v2-form-group">
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                규칙명 <span className="mg-v2-text-danger">*</span>
              </label>
              <input
                type="text"
                className={`mg-v2-input ${errors.ruleName ? 'mg-v2-input-error' : ''}`}
                placeholder="정산 규칙명을 입력하세요"
                value={formData.ruleName}
                onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
              />
              {errors.ruleName && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.ruleName}</div>}
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">업종 유형</label>
              <select
                className="mg-v2-select"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              >
                <option value="">선택 안함</option>
                <option value="CONSULTATION">상담</option>
                <option value="EDUCATION">교육</option>
                <option value="HEALTHCARE">의료</option>
              </select>
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                정산 유형 <span className="mg-v2-text-danger">*</span>
              </label>
              <select
                className={`mg-v2-select ${errors.settlementType ? 'mg-v2-input-error' : ''}`}
                value={formData.settlementType}
                onChange={(e) => setFormData({ ...formData, settlementType: e.target.value })}
              >
                <option value="">선택하세요</option>
                <option value="COMMISSION">수수료</option>
                <option value="ROYALTY">로열티</option>
                <option value="REVENUE_SHARE">매출 분배</option>
              </select>
              {errors.settlementType && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.settlementType}</div>}
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                계산 방법 <span className="mg-v2-text-danger">*</span>
              </label>
              <select
                className={`mg-v2-select ${errors.calculationMethod ? 'mg-v2-input-error' : ''}`}
                value={formData.calculationMethod}
                onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
              >
                <option value="PERCENTAGE">비율 (PERCENTAGE)</option>
                <option value="FIXED">고정액 (FIXED)</option>
                <option value="TIERED">구간별 (TIERED)</option>
              </select>
              {errors.calculationMethod && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.calculationMethod}</div>}
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                계산 파라미터 (JSON) <span className="mg-v2-text-danger">*</span>
              </label>
              <textarea
                className={`mg-v2-input ${errors.calculationParams ? 'mg-v2-input-error' : ''}`}
                rows="6"
                placeholder={
                  formData.calculationMethod === 'PERCENTAGE' ? '{"percentage": 10.0}' :
                  formData.calculationMethod === 'FIXED' ? '{"amount": 10000}' :
                  '{"tiers": [{"min": 0, "max": 1000000, "percentage": 5}, {"min": 1000000, "max": null, "percentage": 10}]}'
                }
                value={formData.calculationParams}
                onChange={(e) => setFormData({ ...formData, calculationParams: e.target.value })}
              />
              {errors.calculationParams && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.calculationParams}</div>}
              <div className="mg-v2-text-xs mg-v2-text-secondary mg-v2-mt-xs">
                {formData.calculationMethod === 'PERCENTAGE' && '예: {"percentage": 10.0}'}
                {formData.calculationMethod === 'FIXED' && '예: {"amount": 10000}'}
                {formData.calculationMethod === 'TIERED' && '예: {"tiers": [{"min": 0, "max": 1000000, "percentage": 5}]}'}
              </div>
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                <input
                  type="checkbox"
                  className="mg-v2-checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                활성화
              </label>
            </div>
          </div>
        </div>
        <div className="mg-v2-modal-footer">
          <MGButton variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </MGButton>
          <MGButton 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading}
            loading={loading}
          >
            저장
          </MGButton>
        </div>
      </div>
    </div>
  );
};

// 원장 상세 모달 컴포넌트
const LedgerDetailModal = ({ ledger, onClose }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, [ledger]);

  const fetchJournalEntries = async () => {
    if (!ledger.accountId || !ledger.periodStart || !ledger.periodEnd) return;
    
    setLoadingEntries(true);
    try {
      // 해당 기간의 분개 목록 조회 (계정 ID 필터링은 백엔드에서 처리)
      const response = await axios.get(ERP_API.JOURNAL_ENTRIES, {
        withCredentials: true
      });
      if (response.data.success) {
        // 프론트엔드에서 기간 및 계정 필터링
        const entries = (response.data.data || []).filter(entry => {
          const entryDate = new Date(entry.entryDate);
          const periodStart = new Date(ledger.periodStart);
          const periodEnd = new Date(ledger.periodEnd);
          return entryDate >= periodStart && entryDate <= periodEnd && 
                 entry.entryStatus === 'POSTED' &&
                 entry.lines?.some(line => line.accountId === ledger.accountId);
        });
        setJournalEntries(entries);
      }
    } catch (err) {
      console.error('Journal entries fetch error:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  return (
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">원장 상세</h3>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-v2-modal-body">
          <div className="mg-v2-form-group">
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">계정 ID</label>
              <div className="mg-v2-text">{ledger.accountId}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">기간</label>
              <div className="mg-v2-text">{ledger.periodStart} ~ {ledger.periodEnd}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">기초잔액</label>
              <div className="mg-v2-text">{formatCurrency(ledger.openingBalance || 0)}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">차변합계</label>
              <div className="mg-v2-text">{formatCurrency(ledger.totalDebit || 0)}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">대변합계</label>
              <div className="mg-v2-text">{formatCurrency(ledger.totalCredit || 0)}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">기말잔액</label>
              <div className="mg-v2-text mg-v2-font-weight-bold">{formatCurrency(ledger.closingBalance || 0)}</div>
            </div>

            {/* 분개 내역 */}
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">분개 내역</label>
              {loadingEntries ? (
                <UnifiedLoading text="분개 내역을 불러오는 중..." size="small" type="inline" />
              ) : journalEntries.length > 0 ? (
                <div className="mg-v2-table-container">
                  <table className="mg-table" data-label="분개 내역 목록">
                    <thead>
                      <tr>
                        <th>분개번호</th>
                        <th>분개일자</th>
                        <th>차변</th>
                        <th>대변</th>
                        <th>설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.map(entry => {
                        const line = entry.lines?.find(l => l.accountId === ledger.accountId);
                        return line ? (
                          <tr key={entry.id}>
                            <td data-label="분개번호">{entry.entryNumber}</td>
                            <td data-label="분개일자">{entry.entryDate}</td>
                            <td data-label="차변">{formatCurrency(line.debitAmount || 0)}</td>
                            <td data-label="대변">{formatCurrency(line.creditAmount || 0)}</td>
                            <td data-label="설명">{line.description || entry.description || '-'}</td>
                          </tr>
                        ) : null;
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mg-v2-text-center mg-v2-text-secondary">분개 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mg-v2-modal-footer">
          <MGButton variant="secondary" onClick={onClose}>닫기</MGButton>
        </div>
      </div>
    </div>
  );
};

// 분개 수정 모달 컴포넌트
const JournalEntryEditModal = ({ entry, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
    description: entry.description || ''
  });
  const [lines, setLines] = useState(
    entry.lines?.map(line => ({
      accountId: line.accountId?.toString() || '',
      debitAmount: line.debitAmount?.toString() || '',
      creditAmount: line.creditAmount?.toString() || '',
      description: line.description || ''
    })) || [
      { accountId: '', debitAmount: '', creditAmount: '', description: '' },
      { accountId: '', debitAmount: '', creditAmount: '', description: '' }
    ]
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => {
      const amount = parseFloat(line.debitAmount) || 0;
      return sum + amount;
    }, 0);
    const totalCredit = lines.reduce((sum, line) => {
      const amount = parseFloat(line.creditAmount) || 0;
      return sum + amount;
    }, 0);
    return { totalDebit, totalCredit };
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debitAmount: '', creditAmount: '', description: '' }]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    } else {
      notificationManager.show('최소 2개의 라인이 필요합니다.', 'warning');
    }
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    // 차변과 대변은 동시에 입력 불가
    if (field === 'debitAmount' && value) {
      newLines[index].creditAmount = '';
    } else if (field === 'creditAmount' && value) {
      newLines[index].debitAmount = '';
    }
    setLines(newLines);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.entryDate) {
      newErrors.entryDate = '분개일자는 필수입니다.';
    }
    
    if (lines.length < 2) {
      newErrors.lines = '최소 2개의 라인이 필요합니다.';
    }
    
    lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`line_${index}_accountId`] = '계정 ID는 필수입니다.';
      }
      if (!line.debitAmount && !line.creditAmount) {
        newErrors[`line_${index}_amount`] = '차변 또는 대변 금액을 입력해주세요.';
      }
      if (line.debitAmount && line.creditAmount) {
        newErrors[`line_${index}_amount`] = '차변과 대변을 동시에 입력할 수 없습니다.';
      }
    });
    
    const { totalDebit, totalCredit } = calculateTotals();
    if (totalDebit !== totalCredit) {
      newErrors.balance = `차변/대변 불균형: 차변 ${formatCurrency(totalDebit)}, 대변 ${formatCurrency(totalCredit)}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notificationManager.show('입력 정보를 확인해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { totalDebit, totalCredit } = calculateTotals();
      
      const requestData = {
        entryDate: formData.entryDate,
        description: formData.description,
        lines: lines.map(line => ({
          accountId: parseInt(line.accountId),
          debitAmount: parseFloat(line.debitAmount) || 0,
          creditAmount: parseFloat(line.creditAmount) || 0,
          description: line.description || ''
        }))
      };

      const response = await axios.put(ERP_API.JOURNAL_ENTRY_UPDATE(entry.id), requestData, {
        withCredentials: true
      });

      if (response.data.success) {
        notificationManager.show('분개가 수정되었습니다.', 'success');
        onRefresh();
        onClose();
      } else {
        notificationManager.show(response.data.message || '분개 수정에 실패했습니다.', 'error');
      }
    } catch (err) {
      console.error('Update entry error:', err);
      notificationManager.show('분개 수정에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal-content" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <h3 className="mg-v2-modal-title">분개 수정</h3>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-v2-modal-body">
          <div className="mg-v2-form-group">
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                분개번호
              </label>
              <div className="mg-v2-text">{entry.entryNumber}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">
                분개일자 <span className="mg-v2-text-danger">*</span>
              </label>
              <input
                type="date"
                className={`mg-v2-input ${errors.entryDate ? 'mg-v2-input-error' : ''}`}
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              />
              {errors.entryDate && <div className="mg-v2-text-danger mg-v2-text-xs">{errors.entryDate}</div>}
            </div>

            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">설명</label>
              <input
                type="text"
                className="mg-v2-input"
                placeholder="분개 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="mg-v2-mb-md">
              <div className="mg-v2-flex mg-v2-justify-between mg-v2-mb-sm">
                <label className="mg-v2-label">분개 라인</label>
                <MGButton variant="outline" size="small" onClick={handleAddLine}>
                  라인 추가
                </MGButton>
              </div>
              
              <div className="mg-v2-table-container">
                <table className="mg-table" data-label="분개 라인 입력">
                  <thead>
                    <tr>
                      <th>계정 ID</th>
                      <th>차변</th>
                      <th>대변</th>
                      <th>설명</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, index) => (
                      <tr key={index}>
                        <td data-label="계정 ID">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_accountId`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="계정 ID"
                            value={line.accountId}
                            onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                          />
                          {errors[`line_${index}_accountId`] && (
                            <div className="mg-v2-text-danger mg-v2-text-xs">{errors[`line_${index}_accountId`]}</div>
                          )}
                        </td>
                        <td data-label="차변">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_amount`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="0"
                            value={line.debitAmount}
                            onChange={(e) => handleLineChange(index, 'debitAmount', e.target.value)}
                          />
                        </td>
                        <td data-label="대변">
                          <input
                            type="number"
                            className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_amount`] ? 'mg-v2-input-error' : ''}`}
                            placeholder="0"
                            value={line.creditAmount}
                            onChange={(e) => handleLineChange(index, 'creditAmount', e.target.value)}
                          />
                          {errors[`line_${index}_amount`] && (
                            <div className="mg-v2-text-danger mg-v2-text-xs">{errors[`line_${index}_amount`]}</div>
                          )}
                        </td>
                        <td data-label="설명">
                          <input
                            type="text"
                            className="mg-v2-input mg-v2-input-sm"
                            placeholder="설명"
                            value={line.description}
                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          />
                        </td>
                        <td data-label="작업">
                          {lines.length > 2 && (
                            <MGButton
                              variant="danger"
                              size="small"
                              onClick={() => handleRemoveLine(index)}
                            >
                              삭제
                            </MGButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="mg-v2-font-weight-bold">합계</td>
                      <td className={`mg-v2-font-weight-bold ${isBalanced ? 'mg-v2-text-success' : 'mg-v2-text-danger'}`}>
                        {formatCurrency(totalDebit)}
                      </td>
                      <td className={`mg-v2-font-weight-bold ${isBalanced ? 'mg-v2-text-success' : 'mg-v2-text-danger'}`}>
                        {formatCurrency(totalCredit)}
                      </td>
                      <td colSpan="2">
                        {errors.balance && (
                          <div className="mg-v2-text-danger mg-v2-text-xs">{errors.balance}</div>
                        )}
                        {isBalanced && !errors.balance && (
                          <div className="mg-v2-text-success mg-v2-text-xs">✓ 차변/대변 균형</div>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="mg-v2-modal-footer">
          <MGButton variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </MGButton>
          <MGButton 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading || !isBalanced}
            loading={loading}
          >
            저장
          </MGButton>
        </div>
      </div>
    </div>
  );
};

export default IntegratedFinanceDashboard;
