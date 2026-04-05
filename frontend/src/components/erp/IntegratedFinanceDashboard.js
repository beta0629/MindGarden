import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import { fetchUserPermissions, PermissionChecks, PERMISSIONS } from '../../utils/permissionUtils';
import { AUTH_API, ERP_API } from '../../constants/api';
import { ACCOUNT_API_ENDPOINTS } from '../../constants/account';
import StandardizedApi from '../../utils/standardizedApi';
import { RoleUtils, USER_ROLES } from '../../constants/roles';
import { COMMON_CSS_CLASSES } from '../../constants/css';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import { ERP_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import FinancialTransactionForm from './FinancialTransactionForm';
import QuickExpenseForm from './QuickExpenseForm';
import ErpModal from './common/ErpModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import StatCard from '../ui/Card/StatCard';
import DashboardSection from '../layout/DashboardSection';
import MGButton from '../../components/common/MGButton';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
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
  Calculator,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import './IntegratedFinanceDashboard.css';

const INTEGRATED_FINANCE_TITLE_ID = 'integrated-finance-title';

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

/** 지출 카테고리 코드 → 한글 라벨 (개요 탭 지출 카드 표시용, FinancialCommonCodeInitializer와 동기화) */
const EXPENSE_CATEGORY_LABELS = {
  SALARY: '급여',
  RENT: '임대료',
  UTILITY: '관리비',
  OFFICE_SUPPLIES: '사무용품',
  TAX: '세금',
  MARKETING: '마케팅',
  EQUIPMENT: '장비',
  SOFTWARE: '소프트웨어',
  CONSULTING: '컨설팅',
  OTHER: '기타',
  CONSULTATION: '상담료',
  CONSULTATION_REFUND: '상담료환불',
  CONSULTATION_PARTIAL_REFUND: '상담 부분환불',
  OFFICE_RENT: '사무실임대료',
  STATIONERY: '문구류',
  ONLINE_ADS: '온라인광고',
  INCOME_TAX: '소득세',
  VAT: '부가가치세',
  CORPORATE_TAX: '법인세',
  기타: '기타'
};

/** 수입 카테고리 코드 → 한글 라벨 */
const INCOME_CATEGORY_LABELS = {
  CONSULTATION: '상담료',
  상담료: '상담료',
  PACKAGE: '패키지',
  OTHER: '기타수입',
  기타: '기타수입'
};

const getExpenseCategoryLabel = (code) => EXPENSE_CATEGORY_LABELS[code] || code;
const getIncomeCategoryLabel = (code) => INCOME_CATEGORY_LABELS[code] || code;

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showQuickExpenseForm, setShowQuickExpenseForm] = useState(false);
  
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

  // URL 파라미터에서 탭 읽기
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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
        // PermissionChecks.canViewIntegratedFinance가 이제 user를 받아서 관리자 권한을 자동으로 허용
        const isAdmin = user && RoleUtils.isAdmin(user);
        const hasIntegratedFinancePermission = PermissionChecks.canViewIntegratedFinance(permissions, user) || isAdmin;
        console.log('🔍 통합재무관리 권한 체크:', {
          permissionsCount: permissions.length,
          hasPermission: hasIntegratedFinancePermission,
          isAdmin: isAdmin,
          permissions: permissions
        });
        
        if (!hasIntegratedFinancePermission) {
          console.log('❌ 통합재무관리 접근 권한 없음');
          setError('수입·지출 관리 접근 권한이 없습니다.');
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
  
  const initializeComponent = async () => {
    try {
      await fetchDashboardData();
    } catch (err) {
      console.error('컴포넌트 초기화 실패:', err);
      setError('초기화 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const url = ERP_API.FINANCE_DASHBOARD;
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
      <AdminCommonLayout title="수입·지출 관리" loading={true} loadingText="데이터를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title="수입·지출 관리">
        <div className="mg-dashboard-layout mg-v2-ad-b0kla">
          <div className="mg-v2-ad-b0kla__container">
            <ContentArea ariaLabel="수입·지출 관리 본문">
              <ContentHeader
                title="수입·지출 관리"
                subtitle="거래·손익·정산을 한곳에서"
                titleId={INTEGRATED_FINANCE_TITLE_ID}
              />
              <main aria-labelledby={INTEGRATED_FINANCE_TITLE_ID} className="mg-dashboard-content">
                <div className="error-container">
                  <SafeErrorDisplay error={error} variant="inline" prefix="오류: " />
                </div>
              </main>
            </ContentArea>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="수입·지출 관리">
      <div className="mg-dashboard-layout mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="수입·지출 관리 본문">
            <ContentHeader
              title="수입·지출 관리"
              subtitle="거래·손익·정산을 한곳에서"
              titleId={INTEGRATED_FINANCE_TITLE_ID}
              actions={(
                <div className="mg-dashboard-header-right mg-dashboard-header-right--content-header">
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
                    onClick={() => {
                      navigate('/erp/financial');
                    }}
                    title="상세 내역 보기"
                    className="mg-dashboard-icon-btn"
                  >
                    <FileText size={18} />
                  </MGButton>
                </div>
              )}
            />
            <main aria-labelledby={INTEGRATED_FINANCE_TITLE_ID} className="mg-dashboard-content">
            {/* 탭 메뉴: B0KlA Pill 토큰 */}
            <div className="mg-v2-ad-b0kla__pill-toggle integrated-finance-tabs">
              {[
                { key: 'overview', label: '개요' },
                { key: 'journal-entries', label: '거래 정리' },
                { key: 'ledgers', label: '계정별 내역' },
                { key: 'balance-sheet', label: '자산·부채 현황' },
                { key: 'income-statement', label: '손익 현황' },
                { key: 'cash-flow', label: '현금 흐름' },
                { key: 'settlement', label: '정산' },
                { key: 'daily', label: '일간 리포트' },
                { key: 'monthly', label: '월간 리포트' },
                { key: 'yearly', label: '연간 리포트' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.set('tab', tab.key);
                    setSearchParams(newSearchParams);
                  }}
                  className={`mg-v2-ad-b0kla__pill ${activeTab === tab.key ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
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
              {activeTab === 'balance-sheet' && <BalanceSheetTab />}
              {activeTab === 'income-statement' && <IncomeStatementTab />}
              {activeTab === 'cash-flow' && <CashFlowStatementTab />}
              {activeTab === 'settlement' && <SettlementTab />}
              {activeTab === 'daily' && <DailyReportTab period={selectedPeriod} />}
              {activeTab === 'monthly' && <MonthlyReportTab period={selectedPeriod} />}
              {activeTab === 'yearly' && <YearlyReportTab period={selectedPeriod} />}
            </div>
            </main>
          </ContentArea>
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
    </AdminCommonLayout>
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

  // 카테고리별 수입/지출 설명 생성 (한글 라벨로 표시)
  // API가 CONSULTATION·상담료 등 동의 키를 동시에 내려줄 때 동일 라벨이 중복되지 않도록 정리
  const getIncomeDescription = () => {
    const categories = Object.keys(incomeByCategory);
    if (categories.length === 0) return '상담료, 기타수입';
    const labels = categories.map(getIncomeCategoryLabel);
    return [...new Set(labels)].join(', ');
  };

  const getExpenseDescription = () => {
    const categories = Object.keys(expenseByCategory);
    if (categories.length === 0) return '급여, 임대료, 관리비, 세금';
    const labels = categories.map(getExpenseCategoryLabel);
    return [...new Set(labels)].join(', ');
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
            value={formatCurrency(financialData.incomeByCategory?.CONSULTATION ?? financialData.incomeByCategory?.['상담료'] ?? 0)}
            label="매핑 입금확인 수입"
          />
          <StatCard
            icon={<TrendingDown />}
            value={formatCurrency(financialData.expenseByCategory?.CONSULTATION ?? financialData.expenseByCategory?.['기타'] ?? 0)}
            label="매핑 환불처리 지출"
            changeType="negative"
          />
          <StatCard
            icon={<BarChart3 />}
            value={(financialData.transactionCount || 0).toLocaleString()}
            label="총 연동 거래 건수"
          />
          <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div className="mg-v2-ad-b0kla__chart-title" style={{ marginBottom: '0.25rem' }}>
              실시간 연동
            </div>
            <div className="mg-v2-ad-b0kla__chart-desc">
              매핑 ↔ ERP 자동 동기화
            </div>
            <MGButton
              variant="outline"
              size="small"
              className="mg-v2-mt-sm"
              onClick={() => navigate('/admin/mapping-management')}
            >
              매핑시스템 확인
            </MGButton>
          </div>
        </div>
      </DashboardSection>

      {/* 수입/지출 요약: B0KlA 카드·토큰 — 수입/지출/순이익 3카드 동일 그리드 */}
      <DashboardSection
        title="수입/지출 요약"
        icon={<BarChart3 size={24} />}
      >
        <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--summary">
          <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent">
            <div className="mg-v2-ad-b0kla__chart-header">
              <h3 className="mg-v2-ad-b0kla__chart-title">수입</h3>
              <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">{formatCurrency(totalIncome)}</div>
              <span className="mg-v2-ad-b0kla__kpi-label">{getIncomeDescription()}</span>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange">
            <div className="mg-v2-ad-b0kla__chart-header">
              <h3 className="mg-v2-ad-b0kla__chart-title">지출</h3>
              <TrendingDown size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--danger" />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--danger">{formatCurrency(totalExpense)}</div>
              <span className="mg-v2-ad-b0kla__kpi-label">{getExpenseDescription()}</span>
              <p className="mg-v2-ad-b0kla__kpi-hint">항목별 비용 내역은 <strong>손익 현황</strong> 탭에서 확인할 수 있습니다.</p>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue integrated-finance-net-income-card">
            <div className="mg-v2-ad-b0kla__chart-header">
              <h3 className="mg-v2-ad-b0kla__chart-title">순이익</h3>
              <DollarSign size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--primary" />
            </div>
            <div className="mg-v2-ad-b0kla__chart-body">
              <div className={`mg-v2-ad-b0kla__kpi-value ${netProfit >= 0 ? 'mg-v2-ad-b0kla__kpi-value--primary' : 'mg-v2-ad-b0kla__kpi-value--danger'}`}>
                {formatCurrency(netProfit)}
              </div>
              <span className="mg-v2-ad-b0kla__kpi-label">수입 - 지출</span>
            </div>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};

// 대차대조표 탭: API 응답 구조 assets/liabilities/equity { total, items[] }, isBalanced, balanceCheck
const BalanceSheetTab = () => {
  const [balanceSheetData, setBalanceSheetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchBalanceSheet = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await StandardizedApi.get(ERP_API.FINANCIAL_STATEMENT_BALANCE, { asOfDate });
      // StandardizedApi(apiGet)는 { success, data } 래퍼 시 data만 반환함. 일관성 위해 둘 다 처리.
      const raw = (response && typeof response === 'object' && 'data' in response && response.data != null) ? response.data : response;
      setBalanceSheetData(raw && typeof raw === 'object' ? raw : null);
    } catch (err) {
      console.error('Balance sheet fetch error:', err);
      setError(err);
      notificationManager.show('대차대조표를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const hasData = balanceSheetData && (
    (balanceSheetData.assets?.total != null && Number(balanceSheetData.assets.total) !== 0) ||
    (balanceSheetData.liabilities?.total != null && Number(balanceSheetData.liabilities.total) !== 0) ||
    (balanceSheetData.equity?.total != null && Number(balanceSheetData.equity.total) !== 0)
  );
  const allZero = balanceSheetData && !hasData &&
    (balanceSheetData.assets?.total != null || balanceSheetData.liabilities?.total != null || balanceSheetData.equity?.total != null);
  const emptyState = !loading && !error && balanceSheetData == null;

  if (loading) {
    return (
      <div>
        <DashboardSection title="대차대조표" icon={<PieChart size={24} />}>
          <div className="mg-v2-mb-md">
            <label className="mg-v2-label">기준일자</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="mg-v2-input" />
          </div>
          <div className="finance-statement-block" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)' }}>
            <UnifiedLoading text="데이터를 불러오는 중…" size="medium" type="inline" />
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <DashboardSection title="대차대조표" icon={<PieChart size={24} />}>
          <div className="mg-v2-mb-md">
            <label className="mg-v2-label">기준일자</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="mg-v2-input" />
          </div>
          <div className="finance-statement-block mg-v2-empty-state" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)', textAlign: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mg-color-text-main)' }}>데이터를 불러오지 못했습니다</h4>
            <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>일시적인 오류일 수 있습니다. 아래 버튼으로 다시 시도해 주세요.</p>
            <MGButton variant="primary" onClick={fetchBalanceSheet} className="mg-v2-button-primary" style={{ marginTop: 16 }}>다시 불러오기</MGButton>
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (emptyState) {
    return (
      <div>
        <DashboardSection title="대차대조표" icon={<PieChart size={24} />}>
          <div className="mg-v2-mb-md">
            <label className="mg-v2-label">기준일자</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="mg-v2-input" />
          </div>
          <div className="finance-statement-block mg-v2-empty-state" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)', textAlign: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mg-color-text-main)' }}>해당 기간 데이터가 없습니다</h4>
            <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>선택한 기준일자에 등록된 내역이 없습니다.</p>
          </div>
        </DashboardSection>
      </div>
    );
  }

  const assetsTotal = balanceSheetData?.assets?.total ?? 0;
  const assetsItems = Array.isArray(balanceSheetData?.assets?.items) ? balanceSheetData.assets.items : [];
  const liabilitiesTotal = balanceSheetData?.liabilities?.total ?? 0;
  const liabilitiesItems = Array.isArray(balanceSheetData?.liabilities?.items) ? balanceSheetData.liabilities.items : [];
  const equityTotal = balanceSheetData?.equity?.total ?? 0;
  const equityItems = Array.isArray(balanceSheetData?.equity?.items) ? balanceSheetData.equity.items : [];
  const isBalanced = balanceSheetData?.isBalanced === true;
  const balanceCheck = balanceSheetData?.balanceCheck || {};

  return (
    <div>
      <DashboardSection title="대차대조표" icon={<PieChart size={24} />}>
        <div className="mg-v2-mb-md">
          <label className="mg-v2-label">기준일자</label>
          <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="mg-v2-input" />
        </div>
        <p className="mg-v2-caption integrated-finance-balance-sheet-hint" style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)', marginBottom: 12, padding: '12px 16px', background: 'var(--mg-color-surface-main)', borderRadius: 10, border: '1px solid var(--mg-color-border-main)' }}>
          임대료·비용 내역은 <strong>손익 현황</strong> 탭에서 확인할 수 있습니다. 대차대조표는 자산·부채·자본만 표시됩니다.
        </p>
        {allZero && (
          <p className="mg-v2-caption" style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)', marginBottom: 12, padding: '12px 16px', background: 'var(--mg-color-surface-main)', borderRadius: 10, border: '1px solid var(--mg-color-border-main)' }}>
            기준일자까지 등록된 거래가 없어 금액이 0으로 표시됩니다.
          </p>
        )}
        <div className="balance-sheet-grid">
          <div className="mg-v2-ad-b0kla__card balance-sheet-card balance-sheet-card--assets mg-v2-ad-b0kla__card-accent">
            <h3 className="balance-sheet-card-title">
              <TrendingUp className="balance-sheet-card-icon" size={24} />
              자산
            </h3>
            <div className="balance-sheet-section">
              <div className="balance-sheet-items">
                {assetsItems.length > 0 ? assetsItems.map((item, idx) => (
                  <div key={item.accountId ?? idx} className="balance-sheet-item">
                    {item.accountName || '계정'}: {formatCurrency(item.balance ?? 0)}
                  </div>
                )) : <div className="balance-sheet-item">자산 항목 없음</div>}
              </div>
              <div className="balance-sheet-grand-total">자산 합계: {formatCurrency(assetsTotal)}</div>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card balance-sheet-card balance-sheet-card--liabilities mg-v2-ad-b0kla__card-accent--orange">
            <h3 className="balance-sheet-card-title">
              <TrendingDown className="balance-sheet-card-icon" size={24} />
              부채
            </h3>
            <div className="balance-sheet-section">
              <div className="balance-sheet-items">
                {liabilitiesItems.length > 0 ? liabilitiesItems.map((item, idx) => (
                  <div key={item.accountId ?? idx} className="balance-sheet-item">
                    {item.accountName || '계정'}: {formatCurrency(item.balance ?? 0)}
                  </div>
                )) : <div className="balance-sheet-item">부채 항목 없음</div>}
              </div>
              <div className="balance-sheet-grand-total">부채 합계: {formatCurrency(liabilitiesTotal)}</div>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card balance-sheet-card balance-sheet-card--equity mg-v2-ad-b0kla__card-accent--blue">
            <h3 className="balance-sheet-card-title">
              <PieChart className="balance-sheet-card-icon" size={24} />
              자본
            </h3>
            <div className="balance-sheet-section">
              <div className="balance-sheet-items">
                {equityItems.length > 0 ? equityItems.map((item, idx) => (
                  <div key={item.accountId ?? idx} className="balance-sheet-item">
                    {item.accountName || '계정'}: {formatCurrency(item.balance ?? 0)}
                  </div>
                )) : <div className="balance-sheet-item">자본 항목 없음</div>}
              </div>
              <div className="balance-sheet-grand-total">자본 합계: {formatCurrency(equityTotal)}</div>
            </div>
          </div>
        </div>
        <div className={`mg-v2-ad-b0kla__card balance-sheet-card balance-verification-card ${isBalanced ? 'mg-v2-ad-b0kla__card-accent' : 'mg-v2-ad-b0kla__card-accent--orange'}`}>
          <h4 className="balance-sheet-card-title">{isBalanced ? '대차대조표 균형' : '대차대조표 불균형'}</h4>
          <div className="balance-sheet-items balance-verification-content">
            자산 총계: <strong>{formatCurrency(balanceCheck.assets ?? assetsTotal)}</strong> = 부채 + 자본: <strong>{formatCurrency(balanceCheck.liabilitiesPlusEquity ?? (liabilitiesTotal + equityTotal))}</strong>
            {!isBalanced && balanceCheck.difference != null && (
              <div className="balance-sheet-total">차이: {formatCurrency(balanceCheck.difference)}</div>
            )}
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};

// 손익계산서 탭: API 응답 구조 revenue/expenses { total, items[] }, netIncome
const IncomeStatementTab = () => {
  const [incomeStatementData, setIncomeStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchIncomeStatement = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await StandardizedApi.get(ERP_API.FINANCIAL_STATEMENT_INCOME, { startDate, endDate });
      // StandardizedApi(apiGet)는 { success, data } 래퍼 시 data만 반환함. 일관성 위해 둘 다 처리.
      const raw = (response && typeof response === 'object' && 'data' in response && response.data != null) ? response.data : response;
      setIncomeStatementData(raw && typeof raw === 'object' ? raw : null);
    } catch (err) {
      console.error('Income statement fetch error:', err);
      setError(err);
      notificationManager.show('손익계산서를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeStatement();
  }, [startDate, endDate]);

  const hasData = incomeStatementData && (
    (incomeStatementData.revenue?.total != null && Number(incomeStatementData.revenue.total) !== 0) ||
    (incomeStatementData.expenses?.total != null && Number(incomeStatementData.expenses.total) !== 0) ||
    (incomeStatementData.netIncome != null && Number(incomeStatementData.netIncome) !== 0)
  );
  const allZero = incomeStatementData && !hasData &&
    (incomeStatementData.revenue?.total != null || incomeStatementData.expenses?.total != null || incomeStatementData.netIncome != null);
  const emptyState = !loading && !error && incomeStatementData == null;

  if (loading) {
    return (
      <div>
        <DashboardSection title="손익계산서" icon={<BarChart3 size={24} />}>
          <div className="mg-v2-mb-md">
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">시작일</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mg-v2-input" />
              </div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">종료일</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mg-v2-input" />
              </div>
            </div>
          </div>
          <div className="finance-statement-block" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)' }}>
            <UnifiedLoading text="데이터를 불러오는 중…" size="medium" type="inline" />
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <DashboardSection title="손익계산서" icon={<BarChart3 size={24} />}>
          <div className="mg-v2-mb-md">
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">시작일</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mg-v2-input" />
              </div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">종료일</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mg-v2-input" />
              </div>
            </div>
          </div>
          <div className="finance-statement-block mg-v2-empty-state" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)', textAlign: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mg-color-text-main)' }}>데이터를 불러오지 못했습니다</h4>
            <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>일시적인 오류일 수 있습니다. 아래 버튼으로 다시 시도해 주세요.</p>
            <MGButton variant="primary" onClick={fetchIncomeStatement} className="mg-v2-button-primary" style={{ marginTop: 16 }}>다시 불러오기</MGButton>
          </div>
        </DashboardSection>
      </div>
    );
  }

  if (emptyState) {
    return (
      <div>
        <DashboardSection title="손익계산서" icon={<BarChart3 size={24} />}>
          <div className="mg-v2-mb-md">
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">시작일</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mg-v2-input" />
              </div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-label">종료일</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mg-v2-input" />
              </div>
            </div>
          </div>
          <div className="finance-statement-block mg-v2-empty-state" style={{ background: 'var(--mg-color-surface-main)', border: '1px solid var(--mg-color-border-main)', borderRadius: '16px', padding: 'var(--mg-spacing-24)', textAlign: 'center' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mg-color-text-main)' }}>해당 기간 데이터가 없습니다</h4>
            <p style={{ fontSize: '14px', color: 'var(--mg-color-text-secondary)' }}>선택한 기간에 등록된 내역이 없습니다.</p>
          </div>
        </DashboardSection>
      </div>
    );
  }

  const revenueTotal = incomeStatementData?.revenue?.total ?? 0;
  const revenueItems = Array.isArray(incomeStatementData?.revenue?.items) ? incomeStatementData.revenue.items : [];
  const expensesTotal = incomeStatementData?.expenses?.total ?? 0;
  const expensesItems = Array.isArray(incomeStatementData?.expenses?.items) ? incomeStatementData.expenses.items : [];
  const netIncome = incomeStatementData?.netIncome ?? 0;

  return (
    <div>
      <DashboardSection title="손익계산서" icon={<BarChart3 size={24} />}>
        <p className="mg-v2-caption" style={{ fontSize: 13, color: 'var(--mg-color-text-secondary)', marginBottom: 12 }}>
          비용·수익 항목별 내역은 아래 카드에서 확인할 수 있습니다. (ERP 원장 기준)
        </p>
        <div className="mg-v2-mb-md">
          <div className="mg-v2-form-row">
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mg-v2-input" />
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-label">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mg-v2-input" />
            </div>
          </div>
        </div>
        {allZero && (
          <p className="mg-v2-caption" style={{ fontSize: 12, color: 'var(--mg-color-text-secondary)', marginBottom: 12, padding: '12px 16px', background: 'var(--mg-color-surface-main)', borderRadius: 10, border: '1px solid var(--mg-color-border-main)' }}>
            선택한 기간에 등록된 거래가 없어 금액이 0으로 표시됩니다.
          </p>
        )}
        <div className="income-statement-grid">
          <div className="mg-v2-ad-b0kla__card income-statement-card income-statement-card--revenue mg-v2-ad-b0kla__card-accent">
            <h3 className="income-statement-card-title">
              <TrendingUp className="income-statement-card-icon" size={24} />
              수익
            </h3>
            <div className="income-statement-items">
              {revenueItems.length > 0 ? revenueItems.map((item, idx) => (
                <div key={item.accountId ?? idx} className="income-statement-item">
                  <span>{item.accountName || '계정'}:</span>
                  <span className="income-statement-item-value">{formatCurrency(item.amount ?? 0)}</span>
                </div>
              )) : <div className="income-statement-item">수익 항목 없음</div>}
              <div className="income-statement-total">
                <div className="income-statement-total-row">
                  <span>수익 총계:</span>
                  <span>{formatCurrency(revenueTotal)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mg-v2-ad-b0kla__card income-statement-card income-statement-card--expenses mg-v2-ad-b0kla__card-accent--orange">
            <h3 className="income-statement-card-title">
              <TrendingDown className="income-statement-card-icon" size={24} />
              비용
            </h3>
            <div className="income-statement-items">
              {expensesItems.length > 0 ? expensesItems.map((item, idx) => (
                <div key={item.accountId ?? idx} className="income-statement-item">
                  <span>{item.accountName || '계정'}:</span>
                  <span className="income-statement-item-value">{formatCurrency(item.amount ?? 0)}</span>
                </div>
              )) : <div className="income-statement-item">비용 항목 없음</div>}
              <div className="income-statement-total">
                <div className="income-statement-total-row">
                  <span>비용 총계:</span>
                  <span>{formatCurrency(expensesTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="net-income-card">
          <div className="net-income-decoration-1"></div>
          <div className="net-income-decoration-2"></div>
          <h3 className="net-income-title">
            <DollarSign className="net-income-icon" size={32} />
            당기순이익
          </h3>
          <div className="net-income-value">{formatCurrency(netIncome)}</div>
          <div className="net-income-subtitle">수익 총계 - 비용 총계</div>
        </div>
      </DashboardSection>
    </div>
  );
};

// 현금흐름표 탭 컴포넌트
const CashFlowStatementTab = () => {
  const [cashFlowData, setCashFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // 이번 달 1일
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCashFlowStatement();
  }, [startDate, endDate]);

  const fetchCashFlowStatement = async () => {
    setLoading(true);
    try {
      const response = await StandardizedApi.get(ERP_API.FINANCIAL_STATEMENT_CASHFLOW, {
        startDate,
        endDate
      });
      // StandardizedApi(apiGet)는 { success, data } 래퍼 시 data만 반환함. 일관성 위해 둘 다 처리.
      const raw = (response && typeof response === 'object' && 'data' in response && response.data != null)
        ? response.data
        : response;
      const d = raw && typeof raw === 'object' ? raw : {};
      const operatingCash = d.operatingActivities?.cashFlow ?? 0;
      const investingCash = d.investingActivities?.cashFlow ?? 0;
      const financingCash = d.financingActivities?.cashFlow ?? 0;
      const netCash = d.netCashIncrease ?? 0;
      const toNum = (v) => (v == null ? 0 : Number(v));
      const mapped = {
        operating: {
          netIncome: toNum(d.operating?.netIncome),
          nonCashAdjustments: toNum(d.operating?.nonCashAdjustments),
          workingCapitalChange: toNum(d.operating?.workingCapitalChange),
          total: toNum(operatingCash)
        },
        investing: {
          assetPurchases: toNum(d.investing?.assetPurchases),
          assetSales: toNum(d.investing?.assetSales),
          investmentIncome: toNum(d.investing?.investmentIncome),
          total: toNum(investingCash)
        },
        financing: {
          borrowingIncrease: toNum(d.financing?.borrowingIncrease),
          borrowingRepayment: toNum(d.financing?.borrowingRepayment),
          capitalIncrease: toNum(d.financing?.capitalIncrease),
          dividendPayment: toNum(d.financing?.dividendPayment),
          total: toNum(financingCash)
        },
        netCashIncrease: toNum(netCash)
      };
      setCashFlowData(mapped);
    } catch (err) {
      console.error('Cash flow statement fetch error:', err);
      notificationManager.show('현금흐름표를 불러오는데 실패했습니다.', 'error');
      setCashFlowData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <UnifiedLoading text="현금흐름표를 불러오는 중..." size="medium" type="inline" />;
  }

  return (
    <div>
      <DashboardSection
        title="현금흐름표"
        icon={<TrendingUp size={24} />}
      >
      <div className="mg-v2-mb-md">
        <div className="mg-v2-form-row">
          <div className="mg-v2-form-group">
            <label className="mg-v2-label">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mg-v2-input"
            />
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-label">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mg-v2-input"
            />
          </div>
        </div>
      </div>
      
      <div className="cash-flow-grid">
        {/* 영업 활동 현금흐름 */}
        <div className="balance-sheet-card balance-sheet-card--assets">
          <h3 className="balance-sheet-card-title">
            <TrendingUp className="balance-sheet-card-icon" size={24} />
            영업 활동 현금흐름
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">
              당기순이익: {formatCurrency(cashFlowData?.operating?.netIncome || 0)}
            </div>
            <div className="balance-sheet-item">
              비현금성 항목 조정: {formatCurrency(cashFlowData?.operating?.nonCashAdjustments || 0)}
            </div>
            <div className="balance-sheet-item">
              운전자본 변동: {formatCurrency(cashFlowData?.operating?.workingCapitalChange || 0)}
            </div>
            <div className="balance-sheet-total">
              영업 활동 현금흐름 합계: {formatCurrency(cashFlowData?.operating?.total || 0)}
            </div>
          </div>
        </div>

        {/* 투자 활동 현금흐름 */}
        <div className="balance-sheet-card balance-sheet-card--liabilities">
          <h3 className="balance-sheet-card-title">
            <TrendingDown className="balance-sheet-card-icon" size={24} />
            투자 활동 현금흐름
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">
              자산 매입: {formatCurrency(cashFlowData?.investing?.assetPurchases || 0)}
            </div>
            <div className="balance-sheet-item">
              자산 매각: {formatCurrency(cashFlowData?.investing?.assetSales || 0)}
            </div>
            <div className="balance-sheet-item">
              투자 수익: {formatCurrency(cashFlowData?.investing?.investmentIncome || 0)}
            </div>
            <div className="balance-sheet-total">
              투자 활동 현금흐름 합계: {formatCurrency(cashFlowData?.investing?.total || 0)}
            </div>
          </div>
        </div>

        {/* 재무 활동 현금흐름 */}
        <div className="balance-sheet-card balance-sheet-card--equity">
          <h3 className="balance-sheet-card-title">
            <PieChart className="balance-sheet-card-icon" size={24} />
            재무 활동 현금흐름
          </h3>
          <div className="balance-sheet-items">
            <div className="balance-sheet-item">
              차입금 증가: {formatCurrency(cashFlowData?.financing?.borrowingIncrease || 0)}
            </div>
            <div className="balance-sheet-item">
              차입금 상환: {formatCurrency(cashFlowData?.financing?.borrowingRepayment || 0)}
            </div>
            <div className="balance-sheet-item">
              자본금 증가: {formatCurrency(cashFlowData?.financing?.capitalIncrease || 0)}
            </div>
            <div className="balance-sheet-item">
              배당금 지급: {formatCurrency(cashFlowData?.financing?.dividendPayment || 0)}
            </div>
            <div className="balance-sheet-total">
              재무 활동 현금흐름 합계: {formatCurrency(cashFlowData?.financing?.total || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 현금 및 현금성 자산 증가 */}
      <div className="net-income-card">
        <div className="net-income-decoration-1"></div>
        <div className="net-income-decoration-2"></div>
        <h3 className="net-income-title">
          <DollarSign className="net-income-icon" size={32} />
          현금 및 현금성 자산 증가
        </h3>
        <div className="net-income-value">
          {formatCurrency(cashFlowData?.netCashIncrease || 0)}
        </div>
        <div className="net-income-subtitle">
          영업 + 투자 + 재무 활동 현금흐름 합계
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
        <SafeErrorDisplay error={error} variant="inline" prefix="오류: " />
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
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div className="finance-transaction-label">상담 건수</div>
          </div>
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div className="finance-transaction-label">구매 건수</div>
          </div>
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  useEffect(() => {
    fetchMonthlyReport();
  }, [currentMonth]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const url = `${ERP_API.FINANCE_MONTHLY_REPORT}?year=${currentMonth.year}&month=${currentMonth.month}`;
      const response = await axios.get(url, {
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

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      let newMonth = prev.month - 1;
      let newYear = prev.year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      let newMonth = prev.month + 1;
      let newYear = prev.year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const formatMonthYear = (year, month) => {
    return `${year}년 ${month}월`;
  };

  if (loading) {
    return <UnifiedLoading text="월간 리포트 데이터를 불러오는 중..." size="medium" type="inline" />;
  }

  if (error) {
    return (
      <div className="finance-empty-state">
        <SafeErrorDisplay error={error} variant="inline" prefix="오류: " />
      </div>
    );
  }

  return (
    <div>
      <DashboardSection
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <MGButton
              variant="outline"
              size="small"
              onClick={handlePreviousMonth}
              title="이전 달"
            >
              <ChevronLeft size={18} />
            </MGButton>
            <span>월간 재무 리포트 - {formatMonthYear(currentMonth.year, currentMonth.month)}</span>
            <MGButton
              variant="outline"
              size="small"
              onClick={handleNextMonth}
              title="다음 달"
            >
              <ChevronRight size={18} />
            </MGButton>
          </div>
        }
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
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.consultations || 0}
            </div>
            <div className="finance-transaction-label">상담 건수</div>
          </div>
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
            <div className="finance-transaction-value">
              {reportData?.transactionCount?.purchases || 0}
            </div>
            <div className="finance-transaction-label">구매 건수</div>
          </div>
          <div className="mg-v2-ad-b0kla__card finance-transaction-card">
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
  const [currentYear, setCurrentYear] = useState(() => {
    return new Date().getFullYear();
  });

  useEffect(() => {
    fetchYearlyReport();
  }, [currentYear]);

  const fetchYearlyReport = async () => {
    try {
      setLoading(true);
      const url = `${ERP_API.FINANCE_YEARLY_REPORT}?year=${currentYear}`;
      const response = await axios.get(url, {
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

  const handlePreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  if (loading) {
    return <UnifiedLoading text="년간 리포트 데이터를 불러오는 중..." size="medium" type="inline" />;
  }

  if (error) {
    return (
      <div className="finance-empty-state">
        <SafeErrorDisplay error={error} variant="inline" prefix="오류: " />
      </div>
    );
  }

  return (
    <div>
      <DashboardSection
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <MGButton
              variant="outline"
              size="small"
              onClick={handlePreviousYear}
              title="전년도"
            >
              <ChevronLeft size={18} />
            </MGButton>
            <span>년간 재무 리포트 - {currentYear}년</span>
            <MGButton
              variant="outline"
              size="small"
              onClick={handleNextYear}
              title="다음 년도"
            >
              <ChevronRight size={18} />
            </MGButton>
          </div>
        }
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
  const [showHelp, setShowHelp] = useState(false);

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
      notificationManager.show('거래 목록을 불러오는데 실패했습니다.', 'error');
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
        notificationManager.show('거래가 반영되었습니다.', 'success');
        fetchJournalEntries();
      }
    } catch (err) {
      console.error('Approve error:', err);
      notificationManager.show('거래 반영에 실패했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  const handlePost = async (id) => {
    try {
      const response = await axios.put(ERP_API.JOURNAL_ENTRY_POST(id), {}, {
        withCredentials: true
      });
      if (response.data.success) {
        notificationManager.show('거래가 반영되었습니다.', 'success');
        fetchJournalEntries();
      }
    } catch (err) {
      console.error('Post error:', err);
      notificationManager.show('거래 반영에 실패했습니다. 다시 시도해 주세요.', 'error');
    }
  };

  if (loading) {
    return <UnifiedLoading text="거래 목록을 불러오는 중..." size="medium" type="inline" />;
  }

  return (
    <section className="mg-v2-section">
      <DashboardSection title="거래 정리" icon={<Receipt size={20} />}>
        {/* 분개 설명 섹션 */}
        <div className="mg-v2-mb-md" style={{ 
          backgroundColor: 'var(--color-bg-secondary)', 
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-md)',
          border: '1px solid var(--color-border-light)'
        }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--color-text-primary)',
              fontWeight: 600
            }}
          >
            <Info size={18} />
            <span>거래 정리란?</span>
            {showHelp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showHelp && (
            <div style={{ 
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-md)',
              borderTop: '1px solid var(--color-border-light)',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6
            }}>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>거래(Journal Entry)</strong>는 모든 회계 거래를 기록하는 기본 단위입니다.
              </div>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>차변(Debit):</strong> 자산 증가, 비용 발생, 부채 감소, 자본 감소를 의미합니다.
                </li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>대변(Credit):</strong> 자산 감소, 수익 발생, 부채 증가, 자본 증가를 의미합니다.
                </li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>복식부기 원칙:</strong> 모든 거래는 차변 합계와 대변 합계가 반드시 일치해야 합니다.
                </li>
                <li style={{ marginBottom: 'var(--spacing-xs)' }}>
                  <strong>처리 순서:</strong> 작성 → 승인 → 반영 순서로 진행됩니다.
                </li>
              </ul>
              <div style={{ 
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                backgroundColor: 'var(--color-info-light)',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: 'var(--font-size-sm)'
              }}>
                <strong>예시:</strong> 현금 100만원으로 사무용품을 구매한 경우<br />
                &nbsp;&nbsp;&nbsp;&nbsp;차변: 사무용품비 100만원 / 대변: 현금 100만원
              </div>
            </div>
          )}
        </div>

        <div className="mg-v2-mb-md">
          <MGButton
            variant="primary"
            size="medium"
            onClick={() => setShowCreateModal(true)}
          >
            거래 등록
          </MGButton>
        </div>
        <div className="mg-v2-table-container">
          <table className="mg-table" data-label="거래 목록">
            <thead>
              <tr>
                <th>거래번호</th>
                <th>기준일자</th>
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
                    등록된 거래가 없습니다.
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id}>
                    <td data-label="거래번호">{entry.entryNumber}</td>
                    <td data-label="기준일자">{entry.entryDate}</td>
                    <td data-label="차변합계">{formatCurrency(entry.totalDebit || 0)}</td>
                    <td data-label="대변합계">{formatCurrency(entry.totalCredit || 0)}</td>
                    <td data-label="상태">
                      <span className={`mg-v2-badge mg-v2-badge--${entry.entryStatus?.toLowerCase() || 'default'}`}>
                        {entry.entryStatus === 'DRAFT' ? '초안' : 
                         entry.entryStatus === 'APPROVED' ? '승인됨' : 
                         entry.entryStatus === 'POSTED' ? '반영 완료' : entry.entryStatus}
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
                            반영
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
  const [loading, setLoading] = useState(false);
  const [accountList, setAccountList] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [showLedgerDetailModal, setShowLedgerDetailModal] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await axios.get(ACCOUNT_API_ENDPOINTS.ACTIVE, { withCredentials: true });
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setAccountList(list);
      } catch (err) {
        console.error('계좌 목록 로드 실패:', err);
        notificationManager.show('계좌 목록을 불러오는데 실패했습니다.', 'error');
      }
    };
    loadAccounts();
  }, []);

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
      notificationManager.show('계정별 내역을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mg-v2-section">
      <DashboardSection title="계정별 내역" icon={<BookOpen size={20} />}>
        <div className="mg-v2-form-group mg-v2-mb-md">
          <div className="mg-v2-flex mg-v2-gap-sm" style={{ flexWrap: 'wrap' }}>
            <select
              className="mg-v2-input"
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
              aria-label="계좌 선택"
            >
              <option value="">계좌를 선택하세요</option>
              {accountList.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {[acc.bankName, acc.accountNumber, acc.accountHolder].filter(Boolean).join(' - ')}
                </option>
              ))}
            </select>
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
            <table className="mg-table" data-label="계정별 내역">
              <thead>
                <tr>
                  <th>계정과목</th>
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
                    <td data-label="계정과목">{ledger.accountId}</td>
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
          <p className="mg-v2-text-center mg-v2-text-secondary">내역이 없습니다.</p>
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

  const [settlementPeriod, setSettlementPeriod] = useState('');

  if (loading) {
    return <UnifiedLoading text="데이터를 불러오는 중..." size="medium" type="inline" />;
  }

  return (
    <section className="mg-v2-section">
      <DashboardSection title="정산" icon={<Calculator size={20} />}>
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
      notificationManager.show('거래 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ErpModal isOpen={true} onClose={onClose} title="거래 상세" size="xl">
        {loading ? (
          <UnifiedLoading text="거래 정보를 불러오는 중..." size="medium" type="inline" />
        ) : entryDetail ? (
          <div className="mg-v2-form-group">
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">거래번호</label>
              <div className="mg-v2-text">{entryDetail.entryNumber}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">기준일자</label>
              <div className="mg-v2-text">{entryDetail.entryDate}</div>
            </div>
            <div className="mg-v2-mb-md">
              <label className="mg-v2-label">상태</label>
              <div className="mg-v2-text">
                <span className={`mg-v2-badge mg-v2-badge--${entryDetail.entryStatus?.toLowerCase() || 'default'}`}>
                  {entryDetail.entryStatus === 'DRAFT' ? '초안' :
                   entryDetail.entryStatus === 'APPROVED' ? '승인됨' :
                   entryDetail.entryStatus === 'POSTED' ? '반영 완료' : entryDetail.entryStatus}
                </span>
              </div>
            </div>
            {entryDetail.lines && entryDetail.lines.length > 0 && (
              <div className="mg-v2-mb-md">
                <label className="mg-v2-label">거래 라인</label>
                <div className="mg-v2-table-container">
                  <table className="mg-table" data-label="거래 라인 목록">
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
          <p className="mg-v2-text-center mg-v2-text-secondary">거래 정보를 불러올 수 없습니다.</p>
        )}
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
      </ErpModal>
      {showEditModal && entryDetail && (
        <JournalEntryEditModal
          entry={entryDetail}
          onClose={() => { setShowEditModal(false); fetchEntryDetail(); }}
          onRefresh={() => { onRefresh(); onClose(); }}
        />
      )}
    </>
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
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountTypesLoading, setAccountTypesLoading] = useState(true);
  const [accountTypesError, setAccountTypesError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAccountTypes = async () => {
      setAccountTypesLoading(true);
      setAccountTypesError(null);
      try {
        const response = await StandardizedApi.get(ERP_API.ACCOUNT_TYPES);
        if (cancelled) return;
        const raw = (response && typeof response === 'object' && 'data' in response && response.data != null) ? response.data : response;
        setAccountTypes(Array.isArray(raw) ? raw : []);
      } catch (err) {
        if (!cancelled) {
          setAccountTypesError(err?.message || '계정과목 목록을 불러올 수 없습니다.');
          setAccountTypes([]);
        }
      } finally {
        if (!cancelled) setAccountTypesLoading(false);
      }
    };
    fetchAccountTypes();
    return () => { cancelled = true; };
  }, []);

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
      newErrors.entryDate = '기준일자는 필수입니다.';
    }
    
    if (lines.length < 2) {
      newErrors.lines = '최소 2개의 라인이 필요합니다.';
    }
    
    lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`line_${index}_accountId`] = '계정과목을 선택해주세요.';
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
        notificationManager.show('거래가 등록되었습니다.', 'success');
        onRefresh();
        onClose();
      } else {
        notificationManager.show(response.data.message || '거래 등록에 실패했습니다. 다시 시도해 주세요.', 'error');
      }
    } catch (err) {
      console.error('Create entry error:', err);
      notificationManager.show('거래 등록에 실패했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;

  return (
    <ErpModal isOpen={true} onClose={onClose} title="거래 등록" size="xl">
      {/* 거래 등록 가이드 — B0KlA·디자인 토큰 준수 */}
      <div className="mg-v2-ad-b0kla__card" style={{
        marginBottom: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--ad-b0kla-surface-muted, var(--mg-color-background-muted))',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--ad-b0kla-text-secondary, var(--mg-color-text-secondary))',
        lineHeight: 1.5
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-xs)' }}>
          <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--color-text-primary)' }}>거래 등록 가이드:</strong>
            <ul style={{ margin: 'var(--spacing-xs) 0 0 0', paddingLeft: 'var(--spacing-md)' }}>
              <li>차변과 대변은 한 라인에 동시에 입력할 수 없습니다.</li>
              <li>차변 합계와 대변 합계가 반드시 일치해야 합니다.</li>
              <li>최소 2개 이상의 라인이 필요합니다.</li>
              <li><strong>계정과목</strong>: 아래 목록에서 선택합니다. 목록이 비어 있으면 운영 현황 &gt; 데이터 동기화를 먼저 실행해 주세요.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mg-v2-form-group">
        <div className="mg-v2-mb-md">
          <label className="mg-v2-label">
            기준일자 <span className="mg-v2-text-danger">*</span>
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
            placeholder="거래 내용을 입력하세요"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="mg-v2-mb-md">
          <div className="mg-v2-flex mg-v2-justify-between mg-v2-mb-sm">
            <label className="mg-v2-label">거래 라인</label>
            <MGButton variant="outline" size="small" onClick={handleAddLine}>
              라인 추가
            </MGButton>
          </div>
          {accountTypesError && (
            <div className="mg-v2-text-danger mg-v2-mb-sm" style={{ fontSize: 'var(--font-size-sm)' }}>
              {accountTypesError}
            </div>
          )}
          {!accountTypesError && accountTypes.length === 0 && !accountTypesLoading && (
            <div className="mg-v2-mb-sm" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--mg-color-text-secondary)' }}>
              계정과목이 없습니다. 운영 현황 &gt; 데이터 동기화를 먼저 실행해 주세요.
            </div>
          )}
          <div className="mg-v2-table-container">
            <table className="mg-table" data-label="거래 라인 입력">
              <thead>
                <tr>
                  <th>계정과목</th>
                  <th>차변</th>
                  <th>대변</th>
                  <th>설명</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td data-label="계정과목">
                      <select
                        className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_accountId`] ? 'mg-v2-input-error' : ''}`}
                        value={line.accountId}
                        onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                        disabled={accountTypesLoading || !!accountTypesError || accountTypes.length === 0}
                      >
                        <option value="">계정과목 선택</option>
                        {accountTypes.map((at) => (
                          <option key={at.accountId} value={String(at.accountId)}>
                            {at.label}
                          </option>
                        ))}
                      </select>
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
    </ErpModal>
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
    <ErpModal
      isOpen={true}
      onClose={onClose}
      title={rule ? '정산 규칙 수정' : '정산 규칙 생성'}
      size="md"
    >
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
    </ErpModal>
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
    <ErpModal isOpen={true} onClose={onClose} title="계정별 내역 상세" size="xl">
      <div className="mg-v2-form-group">
        <div className="mg-v2-mb-md">
          <label className="mg-v2-label">계정과목</label>
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
          <label className="mg-v2-label">관련 거래 내역</label>
          {loadingEntries ? (
            <UnifiedLoading text="거래 내역을 불러오는 중..." size="small" type="inline" />
          ) : journalEntries.length > 0 ? (
            <div className="mg-v2-table-container">
              <table className="mg-table" data-label="거래 내역 목록">
                <thead>
                  <tr>
                    <th>거래번호</th>
                    <th>기준일자</th>
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
                        <td data-label="거래번호">{entry.entryNumber}</td>
                        <td data-label="기준일자">{entry.entryDate}</td>
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
            <p className="mg-v2-text-center mg-v2-text-secondary">관련 거래 내역이 없습니다.</p>
          )}
        </div>
      </div>
      <div className="mg-v2-modal-footer">
        <MGButton variant="secondary" onClick={onClose}>닫기</MGButton>
      </div>
    </ErpModal>
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
  const [accountTypes, setAccountTypes] = useState([]);
  const [accountTypesLoading, setAccountTypesLoading] = useState(true);
  const [accountTypesError, setAccountTypesError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAccountTypes = async () => {
      setAccountTypesLoading(true);
      setAccountTypesError(null);
      try {
        const response = await StandardizedApi.get(ERP_API.ACCOUNT_TYPES);
        if (cancelled) return;
        const raw = (response && typeof response === 'object' && 'data' in response && response.data != null) ? response.data : response;
        setAccountTypes(Array.isArray(raw) ? raw : []);
      } catch (err) {
        if (!cancelled) {
          setAccountTypesError(err?.message || '계정과목 목록을 불러올 수 없습니다.');
          setAccountTypes([]);
        }
      } finally {
        if (!cancelled) setAccountTypesLoading(false);
      }
    };
    fetchAccountTypes();
    return () => { cancelled = true; };
  }, []);

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
      newErrors.entryDate = '기준일자는 필수입니다.';
    }
    
    if (lines.length < 2) {
      newErrors.lines = '최소 2개의 라인이 필요합니다.';
    }
    
    lines.forEach((line, index) => {
      if (!line.accountId) {
        newErrors[`line_${index}_accountId`] = '계정과목을 선택해주세요.';
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
        notificationManager.show('거래가 수정되었습니다.', 'success');
        onRefresh();
        onClose();
      } else {
        notificationManager.show(response.data.message || '거래 수정에 실패했습니다. 다시 시도해 주세요.', 'error');
      }
    } catch (err) {
      console.error('Update entry error:', err);
      notificationManager.show('거래 수정에 실패했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit } = calculateTotals();
  const isBalanced = totalDebit === totalCredit;

  return (
    <ErpModal isOpen={true} onClose={onClose} title="거래 수정" size="xl">
      <div className="mg-v2-form-group">
        <div className="mg-v2-mb-md">
          <label className="mg-v2-label">
            거래번호
          </label>
          <div className="mg-v2-text">{entry.entryNumber}</div>
        </div>
        <div className="mg-v2-mb-md">
          <label className="mg-v2-label">
            기준일자 <span className="mg-v2-text-danger">*</span>
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
            placeholder="거래 내용을 입력하세요"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="mg-v2-mb-md">
          <div className="mg-v2-flex mg-v2-justify-between mg-v2-mb-sm">
            <label className="mg-v2-label">거래 라인</label>
            <MGButton variant="outline" size="small" onClick={handleAddLine}>
              라인 추가
            </MGButton>
          </div>
          {accountTypesError && (
            <div className="mg-v2-text-danger mg-v2-mb-sm" style={{ fontSize: 'var(--font-size-sm)' }}>
              {accountTypesError}
            </div>
          )}
          {!accountTypesError && accountTypes.length === 0 && !accountTypesLoading && (
            <div className="mg-v2-mb-sm" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--mg-color-text-secondary)' }}>
              계정과목이 없습니다. 운영 현황 &gt; 데이터 동기화를 먼저 실행해 주세요.
            </div>
          )}
          <div className="mg-v2-table-container">
            <table className="mg-table" data-label="거래 라인 입력">
              <thead>
                <tr>
                  <th>계정과목</th>
                  <th>차변</th>
                  <th>대변</th>
                  <th>설명</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td data-label="계정과목">
                      <select
                        className={`mg-v2-input mg-v2-input-sm ${errors[`line_${index}_accountId`] ? 'mg-v2-input-error' : ''}`}
                        value={line.accountId}
                        onChange={(e) => handleLineChange(index, 'accountId', e.target.value)}
                        disabled={accountTypesLoading || !!accountTypesError || accountTypes.length === 0}
                      >
                        <option value="">계정과목 선택</option>
                        {accountTypes.map((at) => (
                          <option key={at.accountId} value={String(at.accountId)}>
                            {at.label}
                          </option>
                        ))}
                      </select>
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
    </ErpModal>
  );
};

export default IntegratedFinanceDashboard;
