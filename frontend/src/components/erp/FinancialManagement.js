import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import notificationManager from '../../utils/notification';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import MGButton from '../common/MGButton';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import {
  getDisplayWithholdingTaxAmount,
  shouldShowCardSettlementSection,
  formatKrw,
  formatOptionalKrw,
  shouldShowIncomeWithholdingTax,
  shouldShowIncomeTaxIncludedLabel,
  FINANCIAL_AMOUNT_STACK_LABEL_TOTAL,
  FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY,
  FINANCIAL_AMOUNT_STACK_LABEL_VAT,
  FINANCIAL_WITHHOLDING_TAX_LABEL,
  FINANCIAL_TAX_INCLUDED_LABEL,
  FINANCIAL_CARD_MERCHANT_FEE_LABEL,
  FINANCIAL_CARD_NET_DEPOSIT_LABEL
} from '../../utils/erpFinancialAmountStack';
import UnifiedModal from '../common/modals/UnifiedModal';
import FinancialTransactionForm from './FinancialTransactionForm';
import { ERP_API } from '../../constants/api';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection, ContentCard } from '../dashboard-v2/content';
import { ViewModeToggle, ListTableView } from '../common';
import Badge from '../common/Badge';
import {
  DollarSign,
  Link2,
  BarChart3,
  ClipboardList,
  Inbox,
  TrendingUp,
  TrendingDown,
  Undo2,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Headphones
} from 'lucide-react';
import { getStatusLabel } from '../../utils/colorUtils';
import FinancialCalendarView from './FinancialCalendarView';
import { FinancialRefundHubTabs } from './financial/FinancialRefundHubLayout';
import ErpPageShell from './shell/ErpPageShell';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { ErpFilterToolbar, ErpSafeText, useErpSilentRefresh } from './common';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import '../../styles/unified-design-tokens.css';
import '../../styles/themes/client-theme.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import './ErpCommon.css';
import './FinancialManagement.css';

/** 거래 내역 보기: 일반 카드 / 콤팩트 카드 / 테이블 */
const TRANSACTION_VIEW_MODE_OPTIONS = [
  { value: 'card', label: '카드' },
  { value: 'compact', label: '작은 카드' },
  { value: 'table', label: '테이블' }
];

const FINANCIAL_PAGE_TITLE_ID = 'financial-management-page-title';

/** 재무 거래 행 액션 — Lucide 아이콘 크기(디자인 토큰 --icon-size-sm 20px에 맞춤) */
const FINANCIAL_TX_ICON_SIZE = 20;

/** 재무 거래 목록 테이블 컬럼 (ListTableView) */
const TRANSACTION_TABLE_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'transactionDate', label: '일자' },
  { key: 'transactionType', label: '유형' },
  { key: 'category', label: '카테고리' },
  { key: 'amount', label: FINANCIAL_AMOUNT_STACK_LABEL_TOTAL },
  { key: 'status', label: '상태' },
  { key: 'mapping', label: '매핑' },
  { key: 'actions', label: '작업' }
];

/**
 * 공급가·부가세 행 (값 없으면 —).
 * @param {Object} transaction
 * @param {'compact' | 'card' | 'detail' | 'table'} layout
 * @returns {import('react').ReactNode}
 */
function renderAmountStackSupplyAndVatRows(transaction, layout) {
  const supply = formatOptionalKrw(transaction.amountBeforeTax);
  const vat = formatOptionalKrw(transaction.taxAmount);
  if (layout === 'compact') {
    return (
      <>
        <div className="mg-financial-transaction-card__compact-line mg-financial-transaction-card__compact-line--amount-stack">
          <span className="mg-financial-transaction-card__withholding-label">{FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY}</span>
          <span className="mg-financial-transaction-card__withholding-amount">{supply}</span>
        </div>
        <div className="mg-financial-transaction-card__compact-line mg-financial-transaction-card__compact-line--amount-stack">
          <span className="mg-financial-transaction-card__withholding-label">{FINANCIAL_AMOUNT_STACK_LABEL_VAT}</span>
          <span className="mg-financial-transaction-card__withholding-amount">{vat}</span>
        </div>
      </>
    );
  }
  if (layout === 'card') {
    return (
      <>
        <div className="mg-financial-transaction-card__field">
          <span className="mg-financial-transaction-card__label">{FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY}</span>
          <span>{supply}</span>
        </div>
        <div className="mg-financial-transaction-card__field">
          <span className="mg-financial-transaction-card__label">{FINANCIAL_AMOUNT_STACK_LABEL_VAT}</span>
          <span>{vat}</span>
        </div>
      </>
    );
  }
  if (layout === 'detail') {
    return (
      <>
        <div>
          <strong>{FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY}:</strong> {supply}
        </div>
        <div>
          <strong>{FINANCIAL_AMOUNT_STACK_LABEL_VAT}:</strong> {vat}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="mg-financial-transaction-table__amount-stack-meta">
        <span className="mg-financial-transaction-table__amount-stack-label">{FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY}</span>
        <span>{supply}</span>
      </div>
      <div className="mg-financial-transaction-table__amount-stack-meta">
        <span className="mg-financial-transaction-table__amount-stack-label">{FINANCIAL_AMOUNT_STACK_LABEL_VAT}</span>
        <span>{vat}</span>
      </div>
    </>
  );
}

/**
 * 원천징수 행 (스택 4번).
 * @param {Object} transaction
 * @param {'compact' | 'card' | 'detail' | 'table'} layout
 * @returns {import('react').ReactNode|null}
 */
function renderAmountStackWithholdingRow(transaction, layout) {
  if (!shouldShowIncomeWithholdingTax(transaction)) {
    return null;
  }
  const amt = formatKrw(getDisplayWithholdingTaxAmount(transaction));
  if (layout === 'compact') {
    return (
      <div className="mg-financial-transaction-card__compact-line mg-financial-transaction-card__withholding-line">
        <span className="mg-financial-transaction-card__withholding-label">{FINANCIAL_WITHHOLDING_TAX_LABEL}</span>
        <span className="mg-financial-transaction-card__withholding-amount">{amt}</span>
      </div>
    );
  }
  if (layout === 'card') {
    return (
      <div className="mg-financial-transaction-card__field mg-financial-transaction-card__field--withholding">
        <span className="mg-financial-transaction-card__label">{FINANCIAL_WITHHOLDING_TAX_LABEL}</span>
        <span className="mg-financial-transaction-card__withholding-amount">{amt}</span>
      </div>
    );
  }
  if (layout === 'detail') {
    return (
      <div className="mg-v2-transaction-detail-form-grid__item--span2 mg-v2-transaction-detail-withholding">
        <strong>{FINANCIAL_WITHHOLDING_TAX_LABEL}:</strong>{' '}
        <span className="mg-v2-transaction-detail-withholding__amount">{amt}</span>
        <span className="mg-v2-transaction-detail-withholding__hint">
          {' '}
          (입금 총액 대비 사업소득 원천징수 예정, 부가세와 별개)
        </span>
      </div>
    );
  }
  return (
    <div className="mg-financial-transaction-table__amount-stack-meta mg-financial-transaction-table__amount-stack-meta--withholding">
      <span>{FINANCIAL_WITHHOLDING_TAX_LABEL}</span>
      <span>{amt}</span>
    </div>
  );
}

/**
 * 카드 정산(가맹점 수수료·실입금) 행 (스택 5번).
 * @param {Object} transaction
 * @param {'compact' | 'card' | 'detail' | 'table'} layout
 * @returns {import('react').ReactNode|null}
 */
function renderAmountStackCardSettlementRows(transaction, layout) {
  if (!shouldShowCardSettlementSection(transaction)) {
    return null;
  }
  const fee = formatOptionalKrw(transaction.cardMerchantFeeAmount);
  const net = formatOptionalKrw(transaction.cardNetDepositAmount);
  if (layout === 'compact') {
    return (
      <>
        <div className="mg-financial-transaction-card__compact-line">
          <span className="mg-financial-transaction-card__withholding-label">{FINANCIAL_CARD_MERCHANT_FEE_LABEL}</span>
          <span className="mg-financial-transaction-card__withholding-amount">{fee}</span>
        </div>
        <div className="mg-financial-transaction-card__compact-line">
          <span className="mg-financial-transaction-card__withholding-label">{FINANCIAL_CARD_NET_DEPOSIT_LABEL}</span>
          <span className="mg-financial-transaction-card__withholding-amount">{net}</span>
        </div>
      </>
    );
  }
  if (layout === 'card') {
    return (
      <>
        <div className="mg-financial-transaction-card__field">
          <span className="mg-financial-transaction-card__label">{FINANCIAL_CARD_MERCHANT_FEE_LABEL}</span>
          <span>{fee}</span>
        </div>
        <div className="mg-financial-transaction-card__field">
          <span className="mg-financial-transaction-card__label">{FINANCIAL_CARD_NET_DEPOSIT_LABEL}</span>
          <span>{net}</span>
        </div>
      </>
    );
  }
  if (layout === 'detail') {
    return (
      <>
        <div>
          <strong>{FINANCIAL_CARD_MERCHANT_FEE_LABEL}:</strong> {fee}
        </div>
        <div>
          <strong>{FINANCIAL_CARD_NET_DEPOSIT_LABEL}:</strong> {net}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="mg-financial-transaction-table__amount-stack-meta">
        <span className="mg-financial-transaction-table__amount-stack-label">{FINANCIAL_CARD_MERCHANT_FEE_LABEL}</span>
        <span>{fee}</span>
      </div>
      <div className="mg-financial-transaction-table__amount-stack-meta">
        <span className="mg-financial-transaction-table__amount-stack-label">{FINANCIAL_CARD_NET_DEPOSIT_LABEL}</span>
        <span>{net}</span>
      </div>
    </>
  );
}

/**
 * ERP MGButton + B0KlA 아이콘 버튼 패턴(재무 거래 행 전용)
 * @param {Object} opts
 * @param {string} [opts.variant]
 * @param {boolean} [opts.loading]
 * @param {string} [opts.extraClass]
 * @returns {string}
 */
function buildFinancialTxIconButtonClassName({ variant = 'outline', loading = false, extraClass = '' }) {
  return buildErpMgButtonClassName({
    variant,
    size: 'md',
    loading,
    className: ['mg-v2-ad-b0kla__icon-btn', 'mg-financial-transaction__icon-action', extraClass].filter(Boolean).join(' ')
  });
}

const ERP_FINANCIAL_ALLOWED_DATE_RANGES = ['MONTH', 'WEEK', 'TODAY', 'ALL', 'CUSTOM'];

/** YYYY-MM (01–12) */
const FINANCIAL_MONTH_YM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** 월별 세금 요약 연도 선택 하한(표시용) */
const FINANCIAL_TAX_SUMMARY_MIN_YEAR = 2018;

/** 세금 안내 외부 링크(국세청·홈택스만) */
const FINANCIAL_TAX_NOTICE_NTS_URL = 'https://www.nts.go.kr';
const FINANCIAL_TAX_NOTICE_HOMETAX_URL = 'https://www.hometax.go.kr';

/**
 * @returns {string} YYYY-MM (로컬 현재 달)
 */
const getCurrentMonthYm = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * @param {string} value
 * @returns {boolean}
 */
const isValidMonthYm = (value) =>
  typeof value === 'string' && FINANCIAL_MONTH_YM_REGEX.test(value);

/**
 * @param {string} search
 * @returns {string|null}
 */
const parseMonthFromSearch = (search) => {
  const raw = new URLSearchParams(search).get('month');
  if (!raw || !isValidMonthYm(raw)) {
    return null;
  }
  return raw;
};

/**
 * @param {string} ym YYYY-MM
 * @param {number} delta -1 이전 달, +1 다음 달
 * @returns {string}
 */
const addMonthsYm = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
};

const parseDateRangeFromSearch = (search) => {
  const params = new URLSearchParams(search);
  const dr = params.get('dateRange');
  return ERP_FINANCIAL_ALLOWED_DATE_RANGES.includes(dr) ? dr : 'MONTH';
};

/**
 * ERP 재무 관리 페이지
 * 재무 거래 및 회계 관리
 */
const FinancialManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isLoading: sessionLoading, isAdmin } = useSession();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });
  
  const [filters, setFilters] = useState({
    transactionType: 'ALL', // ALL, INCOME, EXPENSE
    category: 'ALL', // ALL, CONSULTATION, SALARY, etc.
    relatedEntityType: 'ALL', // ALL, CONSULTANT_CLIENT_MAPPING, PAYMENT, etc.
    dateRange: parseDateRangeFromSearch(location.search), // ALL, TODAY, WEEK, MONTH, CUSTOM
    /** 월간(MONTH) 조회 월 — YYYY-MM */
    monthYm: parseMonthFromSearch(location.search) || getCurrentMonthYm(),
    startDate: '',
    endDate: '',
    searchText: '' // 상담사명, 내담자명, 설명 검색
  });

  const dateRangeQueryStrippedRef = useRef(false);

  useEffect(() => {
    if (dateRangeQueryStrippedRef.current) {
      return;
    }
    const params = new URLSearchParams(location.search);
    if (!params.has('dateRange')) {
      dateRangeQueryStrippedRef.current = true;
      return;
    }
    dateRangeQueryStrippedRef.current = true;
    params.delete('dateRange');
    const qs = params.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  /** MONTH일 때 `?month=YYYY-MM` 동기화(공유·새로고침). `dateRange`는 기존처럼 URL에서 제거됨. */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (filters.dateRange === 'MONTH') {
      const ym = filters.monthYm && isValidMonthYm(filters.monthYm) ? filters.monthYm : getCurrentMonthYm();
      if (params.get('month') === ym) {
        return;
      }
      params.set('month', ym);
      const qs = params.toString();
      navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
      return;
    }
    if (!params.has('month')) {
      return;
    }
    params.delete('month');
    const qs = params.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
  }, [filters.dateRange, filters.monthYm, location.pathname, location.search, navigate]);
  
  const [transactionViewMode, setTransactionViewMode] = useState('card');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transaction: null
  });
  const [editModal, setEditModal] = useState({
    open: false,
    transaction: null
  });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [pendingEditId, setPendingEditId] = useState(null);
  
  const [dashboardStats, setDashboardStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
    branchCode: '',
    branchName: ''
  });

  const [taxSummaryYear, setTaxSummaryYear] = useState(() => new Date().getFullYear());
  const [taxSummaryLoading, setTaxSummaryLoading] = useState(false);
  const [taxSummaryMonths, setTaxSummaryMonths] = useState([]);
  const [taxSummaryError, setTaxSummaryError] = useState(null);

  const taxSummaryTotals = useMemo(() => {
    if (!Array.isArray(taxSummaryMonths)) {
      return { vat: 0, withholding: 0, expenseVat: 0 };
    }
    return taxSummaryMonths.reduce(
      (acc, row) => ({
        vat: acc.vat + toSafeNumber(row?.vatTotal),
        withholding: acc.withholding + toSafeNumber(row?.withholdingTotal),
        expenseVat: acc.expenseVat + toSafeNumber(row?.expenseVatTotal)
      }),
      { vat: 0, withholding: 0, expenseVat: 0 }
    );
  }, [taxSummaryMonths]);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !user?.id || activeTab !== 'transactions') {
      return undefined;
    }
    let cancelled = false;
    const loadTaxSummary = async() => {
      setTaxSummaryLoading(true);
      setTaxSummaryError(null);
      try {
        const raw = await StandardizedApi.get(ERP_API.FINANCE_TAX_MONTHLY_SERIES, {
          year: String(taxSummaryYear)
        });
        const months = raw?.months;
        if (!cancelled) {
          setTaxSummaryMonths(Array.isArray(months) ? months : []);
        }
      } catch (err) {
        if (!cancelled) {
          setTaxSummaryError(toErrorMessage(err));
          setTaxSummaryMonths([]);
        }
      } finally {
        if (!cancelled) {
          setTaxSummaryLoading(false);
        }
      }
    };
    loadTaxSummary();
    return () => {
      cancelled = true;
    };
  }, [sessionLoading, isLoggedIn, user?.id, activeTab, taxSummaryYear]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab, pagination.currentPage]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id && activeTab === 'transactions') {
      const timeoutId = setTimeout(() => {
        setPagination(prev => ({ ...prev, currentPage: 0 })); // 첫 페이지로 리셋
        loadData({ silent: true });
      }, 300); // 디바운싱
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      switch (activeTab) {
        case 'transactions':
          await loadTransactions();
          break;
        case 'dashboard':
          await loadDashboard();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const getDateRangeForFilter = () => {
    const now = new Date();
    const toStr = (d) => formatLocalDateYmd(d);
    switch (filters.dateRange) {
      case 'TODAY':
        return { startDate: toStr(now), endDate: toStr(now) };
      case 'WEEK': {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { startDate: toStr(start), endDate: toStr(now) };
      }
      case 'MONTH': {
        const ym = filters.monthYm && isValidMonthYm(filters.monthYm) ? filters.monthYm : getCurrentMonthYm();
        const [y, m] = ym.split('-').map(Number);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        return { startDate: toStr(start), endDate: toStr(end) };
      }
      case 'CUSTOM':
        return {
          startDate: filters.startDate || toStr(now),
          endDate: filters.endDate || toStr(now)
        };
      default:
        return { startDate: '', endDate: '' };
    }
  };

  const loadTransactions = async() => {
    try {
      const { startDate, endDate } = getDateRangeForFilter();
      const params = {
        page: pagination.currentPage,
        size: pagination.size
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (filters.transactionType !== 'ALL') params.transactionType = filters.transactionType;
      if (filters.category !== 'ALL') params.category = filters.category;
      if (filters.relatedEntityType !== 'ALL') params.relatedEntityType = filters.relatedEntityType;
      if (filters.searchText) params.search = filters.searchText;
      if (user?.branchCode) params.branchCode = user.branchCode;

      const response = await StandardizedApi.get('/api/v1/admin/financial-transactions', params);

      // apiGet이 {success, data} 형태면 data만 반환하므로, 배열인지 객체인지 확인
      if (Array.isArray(response)) {
        // apiGet이 data 배열만 반환한 경우
        let filteredTransactions = response || [];
        
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          filteredTransactions = filteredTransactions.filter(transaction => 
            transaction.description?.toLowerCase().includes(searchLower) ||
            transaction.category?.toLowerCase().includes(searchLower) ||
            transaction.subcategory?.toLowerCase().includes(searchLower)
          );
        }
        
        setTransactions(filteredTransactions);
        setPagination(prev => ({
          ...prev,
          totalPages: 1,
          totalElements: filteredTransactions.length
        }));
        
        setError(null);
        await calculateDashboardStats(filteredTransactions);
      } else if (response && typeof response === 'object') {
        // apiGet이 전체 응답 객체를 반환한 경우
        if (response.success) {
          let filteredTransactions = response.data || [];

          if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filteredTransactions = filteredTransactions.filter(transaction => 
              transaction.description?.toLowerCase().includes(searchLower) ||
              transaction.category?.toLowerCase().includes(searchLower) ||
              transaction.subcategory?.toLowerCase().includes(searchLower)
            );
          }
          
          setTransactions(filteredTransactions);
          setPagination(prev => ({
            ...prev,
            totalPages: response.totalPages || 0,
            totalElements: response.totalCount || 0
          }));
          
          setError(null);
          await calculateDashboardStats(filteredTransactions);
        } else {
          // 실제 API 에러인 경우
          const errorMessage = response?.message || '재무 거래 목록을 불러올 수 없습니다.';
          console.error('API 오류:', errorMessage, response);
          setError(errorMessage);
          
          if (response?.redirectToLogin) {
            console.error('세션 만료 — 로그인 화면으로 이동');
            redirectToLoginPageOnce();
            return;
          }
        }
      } else {
        setError('재무 거래 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('재무 거래 로드 실패:', err);
      
      if (err.response?.status === 401 || err.status === 401) {
        console.error('인증 오류 — 로그인 화면으로 이동');
        redirectToLoginPageOnce();
        return;
      }
      
      // 네트워크 에러 또는 서버 에러
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          '재무 거래 목록을 불러오는 중 오류가 발생했습니다. 서버 연결을 확인해주세요.';
      console.error('네트워크/서버 오류:', errorMessage);
      setError(errorMessage);
    }
  };

  const calculateDashboardStats = async(transactionData) => {
    let statYear;
    let statMonth;
    if (filters.dateRange === 'MONTH') {
      const ym = filters.monthYm && isValidMonthYm(filters.monthYm) ? filters.monthYm : getCurrentMonthYm();
      const [y, m] = ym.split('-').map(Number);
      statYear = y;
      statMonth = m;
    } else {
      const now = new Date();
      statYear = now.getFullYear();
      statMonth = now.getMonth() + 1;
    }

    const thisMonthTransactions = transactionData.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      return transactionDate.getFullYear() === statYear &&
             transactionDate.getMonth() + 1 === statMonth &&
             // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
             transaction.status !== 'REJECTED' && 
             // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
             transaction.status !== 'CANCELLED';
    });
    
    const totalIncome = thisMonthTransactions
      .filter(t => t.transactionType === 'INCOME')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const totalExpense = thisMonthTransactions
      .filter(t => t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const branchName = await getBranchName(user?.branchCode);
    
    setDashboardStats({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: thisMonthTransactions.length,
      branchCode: user?.branchCode || '',
      branchName: branchName
    });
  };

  const loadDashboard = async() => {
    // 대시보드 전용 API 연동 시 이곳에서 로드
  };

  const handleDeleteTransaction = (transaction) => {
    setDeleteModal({ isOpen: true, transaction });
  };

  const confirmDeleteTransaction = async() => {
    const { transaction } = deleteModal;
    if (!transaction?.id) {
      setDeleteModal({ isOpen: false, transaction: null });
      return;
    }
    try {
      setDeleteSubmitting(true);
      const result = await StandardizedApi.delete(ERP_API.FINANCE_TRANSACTION_BY_ID(transaction.id));
      if (result?.success === false) {
        notificationManager.error(`거래 삭제에 실패했습니다: ${toErrorMessage(result.message)}`);
        return;
      }
      notificationManager.success('거래가 성공적으로 삭제되었습니다.');
      setDeleteModal({ isOpen: false, transaction: null });
      loadData({ silent: true });
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      notificationManager.error(toErrorMessage(error.message) || '거래 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteSubmitting(false);
    }
  };
  
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };
  
  const handleEditTransaction = async(transaction) => {
    setPendingEditId(transaction.id);
    try {
      const data = await StandardizedApi.get(ERP_API.FINANCE_TRANSACTION_BY_ID(transaction.id));
      const resolved =
        data && typeof data === 'object' && data.id != null ? data : transaction;
      setEditModal({ open: true, transaction: resolved });
    } catch (e) {
      console.warn('거래 단건 조회 실패, 목록 행으로 폼을 채웁니다.', e);
      setEditModal({ open: true, transaction });
    } finally {
      setPendingEditId(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isMappingTransaction = (transaction) =>
    transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
    transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
    (typeof transaction.description === 'string' && transaction.description.includes('상담료 입금 확인')) ||
    (typeof transaction.description === 'string' && transaction.description.includes('상담료 환불'));

  /**
   * 매핑 연동 거래 — 내담자 대시보드형 인물·메타 블록 (목록 카드)
   * @param {Object} transaction
   * @param {boolean} compact
   */
  const renderTransactionCardPeoplePanel = (transaction, compact) => {
    if (!isMappingTransaction(transaction)) {
      return null;
    }

    if (compact) {
      const metaParts = [
        transaction.mappingPackageName,
        transaction.mappingPaymentStatusDisplay || transaction.mappingStatusDisplay
      ]
        .filter(Boolean)
        .slice(0, 2);
      const ariaLabelParts = [
        '매핑 연결 회원',
        `내담자 ${toDisplayString(transaction.clientName)}`,
        `상담사 ${toDisplayString(transaction.consultantName)}`
      ];
      if (transaction.mappingPackageName) {
        ariaLabelParts.push(`패키지 ${toDisplayString(transaction.mappingPackageName)}`);
      }
      if (transaction.mappingStatusDisplay) {
        ariaLabelParts.push(`매핑 상태 ${toDisplayString(transaction.mappingStatusDisplay)}`);
      }
      if (transaction.mappingPaymentStatusDisplay) {
        ariaLabelParts.push(`결제 상태 ${toDisplayString(transaction.mappingPaymentStatusDisplay)}`);
      }
      if (transaction.mappingRemainingSessions != null && transaction.mappingRemainingSessions !== '') {
        ariaLabelParts.push(`남은 회기 ${toDisplayString(transaction.mappingRemainingSessions)}회`);
      }

      return (
        <div
          className="mg-financial-transaction-card__people-panel mg-financial-transaction-card__people-panel--compact dashboard-client"
          aria-label={ariaLabelParts.join(', ')}
        >
          <div className="mg-financial-transaction-card__people-panel-inner">
            <div className="mg-financial-transaction-card__people-compact-summary">
              <User
                size={14}
                aria-hidden
                className="mg-financial-transaction-card__people-compact-summary-icon"
              />
              <div className="mg-financial-transaction-card__people-compact-names">
                <span className="mg-financial-transaction-card__people-compact-name-part">
                  <ErpSafeText fallback="—">{transaction.clientName}</ErpSafeText>
                </span>
                <span className="mg-financial-transaction-card__people-compact-sep" aria-hidden>
                  {' '}
                  ·{' '}
                </span>
                <span className="mg-financial-transaction-card__people-compact-name-part">
                  <ErpSafeText fallback="—">{transaction.consultantName}</ErpSafeText>
                </span>
              </div>
            </div>
            {metaParts.length > 0 ? (
              <div className="mg-financial-transaction-card__people-compact-meta">
                {metaParts.map((part, idx) => (
                  <span key={String(idx)}>
                    {idx > 0 ? (
                      <span className="mg-financial-transaction-card__people-compact-meta-sep" aria-hidden>
                        {' '}
                        ·{' '}
                      </span>
                    ) : null}
                    <ErpSafeText>{part}</ErpSafeText>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="mg-financial-transaction-card__people-panel dashboard-client" aria-label="매핑 연결 회원">
        <div className="mg-financial-transaction-card__people-panel-inner">
          <div className="mg-financial-transaction-card__people-row mg-financial-transaction-card__people-row--client">
            <User size={20} aria-hidden className="mg-financial-transaction-card__people-icon" />
            <div className="mg-financial-transaction-card__people-text">
              <div className="mg-financial-transaction-card__people-eyebrow">내담자 (결제 회원)</div>
              <div className="mg-financial-transaction-card__people-name">
                <ErpSafeText fallback="—">{transaction.clientName}</ErpSafeText>
              </div>
            </div>
          </div>
          <div className="mg-financial-transaction-card__people-row mg-financial-transaction-card__people-row--consultant">
            <Headphones
              size={16}
              aria-hidden
              className="mg-financial-transaction-card__people-icon mg-financial-transaction-card__people-icon--muted"
            />
            <div className="mg-financial-transaction-card__people-text">
              <div className="mg-financial-transaction-card__people-eyebrow">상담사</div>
              <div className="mg-financial-transaction-card__people-name-secondary">
                <ErpSafeText fallback="—">{transaction.consultantName}</ErpSafeText>
              </div>
            </div>
          </div>
          <div className="mg-financial-transaction-card__people-chips">
            {transaction.mappingPackageName ? (
              <span className="mg-v2-status-badge mg-v2-badge--neutral mg-financial-transaction-card__chip">
                <ErpSafeText>{transaction.mappingPackageName}</ErpSafeText>
              </span>
            ) : null}
            {transaction.mappingStatusDisplay ? (
              <span className="mg-v2-status-badge mg-v2-badge--info mg-financial-transaction-card__chip">
                <ErpSafeText>{transaction.mappingStatusDisplay}</ErpSafeText>
              </span>
            ) : null}
            {transaction.mappingPaymentStatusDisplay ? (
              <span className="mg-v2-status-badge mg-v2-badge--neutral mg-financial-transaction-card__chip">
                <ErpSafeText>{transaction.mappingPaymentStatusDisplay}</ErpSafeText>
              </span>
            ) : null}
            {transaction.mappingRemainingSessions != null && transaction.mappingRemainingSessions !== '' ? (
              <span className="mg-v2-status-badge mg-v2-badge--neutral mg-financial-transaction-card__chip">
                남은 회기 {toDisplayString(transaction.mappingRemainingSessions)}회
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const getBranchName = async(branchCode) => {
    if (!branchCode) return '';
    try {
      const branchName = await getCodeLabel('BRANCH', branchCode);
      return branchName || branchCode;
    } catch (error) {
      console.error('지점명 조회 실패:', error);
      return branchCode;
    }
  };

  /**
   * 보기·수정·삭제 — 아이콘 전용 MGButton (aria-label·title 한글 유지)
   * @param {Object} transaction
   * @param {{ forTable?: boolean }} [opts]
   */
  const renderTransactionIconActions = (transaction, { forTable = false } = {}) => (
    <div
      className={forTable ? 'mg-financial-transaction-table__actions' : 'mg-financial-transaction-card__actions'}
      role="group"
      aria-label="거래 작업"
    >
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildFinancialTxIconButtonClassName({ variant: 'outline' })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => handleViewTransaction(transaction)}
        aria-label="보기"
        title="보기"
        preventDoubleClick={false}
      >
        <Eye size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
      </MGButton>
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildFinancialTxIconButtonClassName({ variant: 'outline' })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => handleEditTransaction(transaction)}
        loading={pendingEditId === transaction.id}
        aria-label="수정"
        title="수정"
        preventDoubleClick={false}
      >
        <Edit size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
      </MGButton>
      {isAdmin() && (
        <MGButton
          type="button"
          variant="danger"
          size="medium"
          className={buildFinancialTxIconButtonClassName({
            variant: 'danger',
            extraClass: 'mg-financial-transaction__icon-action--danger'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => handleDeleteTransaction(transaction)}
          aria-label="삭제"
          title="삭제"
          preventDoubleClick={false}
        >
          <Trash2 size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
        </MGButton>
      )}
    </div>
  );

  const renderTransactionTableCell = (columnKey, transaction) => {
    const amountNum = toSafeNumber(transaction.amount);
    switch (columnKey) {
      case 'id':
        return (
          <MGButton
            type="button"
            variant="outline"
            size="small"
            onClick={() => handleViewTransaction(transaction)}
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-financial-transaction-card__id-button'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
          >
            #{toDisplayString(transaction.id)}
          </MGButton>
        );
      case 'transactionDate':
        return formatDate(transaction.transactionDate);
      case 'transactionType':
        return (
          <Badge
            variant="status"
            statusVariant={transaction.transactionType === 'INCOME' ? 'success' : 'danger'}
            label={transaction.transactionType === 'INCOME' ? '수입' : '지출'}
            size="sm"
          />
        );
      case 'category':
        return (
          <ErpSafeText fallback="-">
            {transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}
          </ErpSafeText>
        );
      case 'amount':
        return (
          <div className="mg-financial-transaction-table__amount-stack">
            <div className="mg-financial-transaction-table__amount-cell">
              <span
                className={
                  amountNum >= 0
                    ? 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--success'
                    : 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--danger'
                }
              >
                {amountNum >= 0 ? '+' : ''}
                {formatKrw(transaction.amount)}
              </span>
              {shouldShowIncomeTaxIncludedLabel(transaction) && (
                <span className="mg-financial-tax-included-badge">
                  <ErpSafeText value={FINANCIAL_TAX_INCLUDED_LABEL} />
                </span>
              )}
            </div>
            {renderAmountStackSupplyAndVatRows(transaction, 'table')}
            {renderAmountStackWithholdingRow(transaction, 'table')}
            {renderAmountStackCardSettlementRows(transaction, 'table')}
          </div>
        );
      case 'status':
        return (
          <span className={`erp-status ${toDisplayString(transaction.status, '').toLowerCase()}`}>
            <ErpSafeText>{getStatusLabel(transaction.status)}</ErpSafeText>
          </span>
        );
      case 'mapping':
        if (!isMappingTransaction(transaction)) {
          return <span className="mg-financial-transaction-table__cell-muted">—</span>;
        }
        return (
          <div className="mg-financial-transaction-table__mapping-cell">
            <Badge variant="status" statusVariant="info" size="sm" label="매핑" />
            {(transaction.clientName || transaction.consultantName) && (
              <div className="mg-financial-transaction-table__mapping-names">
                <ErpSafeText fallback="">{transaction.clientName}</ErpSafeText>
                {transaction.clientName && transaction.consultantName ? (
                  <span aria-hidden className="mg-financial-transaction-table__mapping-sep">
                    {' '}
                    ·{' '}
                  </span>
                ) : null}
                <ErpSafeText fallback="">{transaction.consultantName}</ErpSafeText>
              </div>
            )}
            {transaction.mappingPackageName && (
              <div className="mg-financial-transaction-table__mapping-package">
                <ErpSafeText>{transaction.mappingPackageName}</ErpSafeText>
              </div>
            )}
          </div>
        );
      case 'actions':
        return renderTransactionIconActions(transaction, { forTable: true });
      default:
        return null;
    }
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout>
        <ContentHeader
          title="재무 관리"
          subtitle="세션 정보를 확인하는 중입니다."
          titleId={FINANCIAL_PAGE_TITLE_ID}
        />
        <ContentArea className="erp-system" ariaLabel="재무 관리">
          <div className="erp-session-inline-load">
            <div className="erp-session-inline-load__body">
              <UnifiedLoading type="inline" text="세션 정보를 불러오는 중..." />
            </div>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout>
        <ContentHeader
          title="재무 관리"
          subtitle="재무 거래 및 회계를 관리하려면 로그인해주세요."
          titleId={FINANCIAL_PAGE_TITLE_ID}
        />
        <ContentArea className="erp-system" ariaLabel="재무 관리">
          <div className="erp-error">
            <h3>로그인이 필요합니다.</h3>
            <p>재무 관리 기능을 사용하려면 로그인해주세요.</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  const financialPageSubtitle = dashboardStats.branchName
    ? `재무 거래 및 회계를 관리합니다. (${dashboardStats.branchName})`
    : '재무 거래 및 회계를 관리할 수 있습니다.';

  const pageHeaderActions =
    activeTab === 'transactions' ? (
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => {}}
        aria-label="거래 목록 내보내기"
        preventDoubleClick={false}
      >
        내보내기
      </MGButton>
    ) : null;

  return (
    <AdminCommonLayout>
      <ContentHeader
        title="재무 관리"
        subtitle={financialPageSubtitle}
        actions={pageHeaderActions}
        titleId={FINANCIAL_PAGE_TITLE_ID}
      />
      <ContentArea className="erp-system" ariaLabel="재무 관리">
        <ErpPageShell
              tabsSlot={
                <div className="mg-v2-financial-page-hub-tabs">
                  <FinancialRefundHubTabs />
                  <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist" aria-label="재무 뷰 전환">
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === 'transactions'}
                      className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'transactions' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('transactions')}
                      preventDoubleClick={false}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      거래 내역
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === 'calendar'}
                      className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'calendar' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('calendar')}
                      preventDoubleClick={false}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      달력 뷰
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      role="tab"
                      aria-selected={activeTab === 'dashboard'}
                      className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'dashboard' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('dashboard')}
                      preventDoubleClick={false}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      대시보드
                    </MGButton>
                  </div>
                </div>
              }
              filterSlot={
                activeTab === 'transactions' && !error ? (
                  <div className="mg-w-full mg-mb-md">
                  <ErpFilterToolbar
                    ariaLabel="재무 거래 필터"
                    primaryRow={(
                      <div className="mg-v2-filter-grid mg-v2-filter-grid--row1">
                        <div className="mg-v2-form-group">
                          <label className="mg-v2-form-label" htmlFor="financial-filter-date-range">
                            기간
                          </label>
                          <select
                            id="financial-filter-date-range"
                            value={String(filters.dateRange || 'MONTH')}
                            onChange={(e) => {
                              const nextRange = String(e.target.value);
                              setFilters((prev) => ({
                                ...prev,
                                dateRange: nextRange,
                                ...(nextRange === 'MONTH' && (!prev.monthYm || !isValidMonthYm(prev.monthYm))
                                  ? { monthYm: getCurrentMonthYm() }
                                  : {})
                              }));
                            }}
                            className="mg-v2-form-select mg-v2-erp-filter-toolbar__period-select"
                          >
                            <option value="ALL">전체</option>
                            <option value="TODAY">일간</option>
                            <option value="WEEK">주간</option>
                            <option value="MONTH">월간</option>
                            <option value="CUSTOM">직접 입력</option>
                          </select>
                          {filters.dateRange === 'MONTH' && (
                            <div
                              className="mg-financial-month-picker mg-v2-erp-filter-toolbar__custom-range"
                              role="group"
                              aria-label="조회 월"
                            >
                              <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'sm',
                                  loading: false,
                                  className: 'mg-financial-month-picker__nav'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    monthYm: addMonthsYm(
                                      prev.monthYm && isValidMonthYm(prev.monthYm)
                                        ? prev.monthYm
                                        : getCurrentMonthYm(),
                                      -1
                                    )
                                  }))
                                }
                                aria-label="이전 달"
                                title="이전 달"
                                preventDoubleClick={false}
                              >
                                <ChevronLeft size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
                              </MGButton>
                              <input
                                id="financial-filter-month-ym"
                                type="month"
                                value={
                                  filters.monthYm && isValidMonthYm(filters.monthYm)
                                    ? filters.monthYm
                                    : getCurrentMonthYm()
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (!v || !isValidMonthYm(v)) {
                                    return;
                                  }
                                  setFilters((prev) => ({ ...prev, monthYm: v }));
                                }}
                                className="mg-v2-form-select mg-financial-month-picker__input"
                                aria-label="조회 월"
                              />
                              <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'sm',
                                  loading: false,
                                  className: 'mg-financial-month-picker__nav'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    monthYm: addMonthsYm(
                                      prev.monthYm && isValidMonthYm(prev.monthYm)
                                        ? prev.monthYm
                                        : getCurrentMonthYm(),
                                      1
                                    )
                                  }))
                                }
                                aria-label="다음 달"
                                title="다음 달"
                                preventDoubleClick={false}
                              >
                                <ChevronRight size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
                              </MGButton>
                            </div>
                          )}
                          {filters.dateRange === 'ALL' && (
                            <p className="mg-financial-filter-all-hint" role="status">
                              전체 기간은 데이터가 많을 수 있습니다. 필요할 때만 선택해 주세요.
                            </p>
                          )}
                          {filters.dateRange === 'CUSTOM' && (
                            <div className="mg-v2-form-group mg-v2-form-group--inline mg-v2-erp-filter-toolbar__custom-range">
                              <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) =>
                                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                                }
                                className="mg-v2-form-select mg-v2-erp-filter-toolbar__date-input--start"
                                aria-label="시작일"
                              />
                              <span className="mg-v2-erp-filter-toolbar__date-separator" aria-hidden>
                                ~
                              </span>
                              <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) =>
                                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                                }
                                className="mg-v2-form-select mg-v2-erp-filter-toolbar__date-input--end"
                                aria-label="종료일"
                              />
                            </div>
                          )}
                        </div>
                        <div className="mg-v2-form-group">
                          <span className="mg-v2-form-label">거래 유형</span>
                          <div className="mg-erp-filter-badge-group">
                            {[
                              { value: 'ALL', label: '전체' },
                              { value: 'INCOME', label: '수입' },
                              { value: 'EXPENSE', label: '지출' }
                            ].map((opt) => (
                              <MGButton
                                key={opt.value}
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'sm',
                                  loading: false,
                                  className: `mg-erp-filter-badge ${filters.transactionType === opt.value ? 'mg-erp-filter-badge--selected' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() =>
                                  setFilters((prev) => ({ ...prev, transactionType: opt.value }))
                                }
                                preventDoubleClick={false}
                              >
                                {opt.label}
                              </MGButton>
                            ))}
                          </div>
                        </div>
                        <div className="mg-v2-form-group">
                          <span className="mg-v2-form-label">카테고리</span>
                          <div className="mg-erp-filter-badge-group">
                            {[
                              { value: 'ALL', label: '전체' },
                              { value: 'CONSULTATION', label: '상담료' },
                              { value: 'SALARY', label: '급여' },
                              { value: 'RENT', label: '임대료' },
                              { value: 'UTILITY', label: '관리비' },
                              { value: 'OFFICE_SUPPLIES', label: '사무용품' },
                              { value: 'OTHER', label: '기타' }
                            ].map((opt) => (
                              <MGButton
                                key={opt.value}
                                type="button"
                                variant="outline"
                                size="small"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'sm',
                                  loading: false,
                                  className: `mg-erp-filter-badge ${filters.category === opt.value ? 'mg-erp-filter-badge--selected' : ''}`
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                onClick={() =>
                                  setFilters((prev) => ({ ...prev, category: opt.value }))
                                }
                                preventDoubleClick={false}
                              >
                                {opt.label}
                              </MGButton>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    secondaryRow={(
                      <div className="mg-v2-filter-grid mg-v2-filter-grid--row2">
                        <div className="mg-v2-form-group">
                          <label className="mg-v2-form-label" htmlFor="financial-filter-search">
                            검색
                          </label>
                          <input
                            id="financial-filter-search"
                            type="text"
                            placeholder="상담사명, 내담자명, 설명 검색..."
                            value={filters.searchText}
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, searchText: e.target.value }))
                            }
                            className="mg-v2-form-select"
                          />
                        </div>
                        <div className="mg-v2-form-group mg-financial-filter-actions">
                          <MGButton
                            type="button"
                            variant="secondary"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'secondary',
                              size: 'sm',
                              loading: false
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowAdvancedFilter((v) => !v)}
                            disabled={silentListRefreshing}
                            preventDoubleClick={false}
                          >
                            고급 필터 {showAdvancedFilter ? '접기' : '펼치기'}
                          </MGButton>
                          {/* 필터 상태만 초기화(전역 재조회 트리거 아님) — loading 미부여 */}
                          <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'sm',
                              loading: silentListRefreshing
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() =>
                              setFilters({
                                transactionType: 'ALL',
                                category: 'ALL',
                                relatedEntityType: 'ALL',
                                dateRange: 'MONTH',
                                monthYm: getCurrentMonthYm(),
                                startDate: '',
                                endDate: '',
                                searchText: ''
                              })
                            }
                            disabled={silentListRefreshing}
                            aria-busy={silentListRefreshing}
                            preventDoubleClick={false}
                          >
                            필터 초기화
                          </MGButton>
                          <MGButton
                            variant="primary"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm',
                              loading: silentListRefreshing
                            })}
                            onClick={() => loadData({ silent: true })}
                            loading={silentListRefreshing}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          >
                            검색
                          </MGButton>
                        </div>
                      </div>
                    )}
                    expandedSlot={showAdvancedFilter ? (
                      <div className="mg-v2-form-group">
                        <span className="mg-v2-form-label">연동 유형</span>
                        <div className="mg-v2-tag-group">
                          {[
                            { value: 'ALL', label: '전체' },
                            { value: 'CONSULTANT_CLIENT_MAPPING', label: '매핑연동' },
                            { value: 'CONSULTANT_CLIENT_MAPPING_REFUND', label: '환불처리' },
                            { value: 'PAYMENT', label: '결제' },
                            { value: 'SALARY_CALCULATION', label: '급여' },
                            { value: 'PURCHASE_REQUEST', label: '구매' }
                          ].map((opt) => (
                            <MGButton
                              key={opt.value}
                              type="button"
                              variant="outline"
                              size="small"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: `mg-v2-tag ${filters.relatedEntityType === opt.value ? 'mg-v2-tag--selected' : ''}`
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() =>
                                setFilters((prev) => ({ ...prev, relatedEntityType: opt.value }))
                              }
                              preventDoubleClick={false}
                            >
                              {opt.label}
                            </MGButton>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  />
                  </div>
                ) : null
              }
            >
              <div className="erp-content">
            {loading && (
              <div className="erp-initial-fetch-inline" role="status" aria-live="polite">
                <UnifiedLoading type="inline" text="로딩 중..." />
              </div>
            )}

            {error && (
              <div className="erp-error">
                <SafeErrorDisplay error={error} variant="banner" />
                <MGButton
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: silentListRefreshing
                  })}
                  onClick={() => loadData({ silent: true })}
                  loading={silentListRefreshing}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={loading}
                  aria-label="다시 시도"
                >
                  다시 시도
                </MGButton>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'calendar' && (
                <section
                  className="erp-section mg-v2-erp-section-block mg-financial-management-section-panel"
                >
                  <FinancialCalendarView />
                </section>
              )}

              {activeTab === 'transactions' && (
                <>
                <ContentSection noCard className="mg-v2-mapping-list-block mg-mb-md">
                  <section
                    className="mg-v2-ad-b0kla__card mg-financial-tax-summary"
                    aria-labelledby="financial-tax-summary-heading"
                  >
                    <h2 id="financial-tax-summary-heading" className="mg-v2-ad-b0kla__section-title">
                      월별 세금 요약
                    </h2>
                    <p className="mg-v2-text-secondary mg-mb-md">
                      수입 거래의 부가세·원천징수와 지출 거래의 세액 필드 합계입니다. (저장된 금액 기준)
                      수입 금액이 부가세 포함가인 거래는, 부가세(VAT) 열은 포함가에서 분리한 세액의 합계입니다.
                    </p>
                    <section
                      className="mg-financial-tax-filing-notice"
                      aria-labelledby="financial-tax-filing-notice-title"
                    >
                      <h3
                        id="financial-tax-filing-notice-title"
                        className="mg-financial-tax-filing-notice__title"
                      >
                        세금 신고·납부 안내(참고)
                      </h3>
                      <p className="mg-financial-tax-filing-notice__text">
                        본 화면의 안내는 참고용이며, 실제 신고·납부 기한과 대상은 사업자 등록·과세 유형 등에 따라
                        달라질 수 있습니다. 정확한 사항은{' '}
                        <a
                          className="mg-financial-tax-filing-notice__link"
                          href={FINANCIAL_TAX_NOTICE_HOMETAX_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          홈택스
                        </a>
                        {' · '}
                        <a
                          className="mg-financial-tax-filing-notice__link"
                          href={FINANCIAL_TAX_NOTICE_NTS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          국세청
                        </a>
                        {' '}또는 세무사 등 전문가를 통해 확인하시기 바랍니다.
                      </p>
                      <ul className="mg-financial-tax-filing-notice__list">
                        <li>
                          원천징수: 일반적으로 소득 지급이 속하는 달의 다음 달 10일까지 신고·납부(원천징수이행상황
                          신고 등)인 경우가 많습니다. 반기 납부 승인 시에는 7·10월, 익년 1·10월 등 별도 기한이
                          적용될 수 있습니다.
                        </li>
                        <li>
                          부가가치세: 일반과세자는 반기별 신고·납부가 일반적인 경우가 많으며(과세 유형·규모에 따라
                          다름), 이 화면의 월별 금액과 별개로 매월 10일이 부가가치세 신고·납부 기한이 아닙니다.
                        </li>
                        <li>
                          위 내용은 국세청 안내를 바탕으로 한 요약이며, 법령 개정 등으로 달라질 수 있습니다.
                        </li>
                      </ul>
                    </section>
                    <div className="mg-v2-form-group mg-mb-md">
                      <label className="mg-v2-form-label" htmlFor="financial-tax-summary-year">
                        연도
                      </label>
                      <select
                        id="financial-tax-summary-year"
                        className="mg-v2-form-select"
                        value={String(taxSummaryYear)}
                        onChange={(e) => setTaxSummaryYear(Number(e.target.value))}
                      >
                        {Array.from(
                          {
                            length:
                              new Date().getFullYear() + 1 - FINANCIAL_TAX_SUMMARY_MIN_YEAR + 1
                          },
                          (_, i) => FINANCIAL_TAX_SUMMARY_MIN_YEAR + i
                        ).map((y) => (
                          <option key={y} value={String(y)}>
                            {`${y}년`}
                          </option>
                        ))}
                      </select>
                    </div>
                    {taxSummaryLoading && (
                      <div className="mg-mb-md">
                        <UnifiedLoading type="inline" text="세금 집계를 불러오는 중..." />
                      </div>
                    )}
                    {taxSummaryError && !taxSummaryLoading && (
                      <SafeErrorDisplay error={taxSummaryError} variant="inline" />
                    )}
                    {!taxSummaryLoading && !taxSummaryError && (
                      <div className="erp-table-container">
                        <table className="erp-table" role="table">
                          <thead>
                            <tr>
                              <th scope="col">월</th>
                              <th scope="col">부가세(VAT)</th>
                              <th scope="col">원천징수</th>
                              <th scope="col">지출(세액)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taxSummaryMonths.map((row) => (
                              <tr key={String(row.month)}>
                                <td>
                                  <ErpSafeText>{toDisplayString(row.month)}</ErpSafeText>
                                  월
                                </td>
                                <td>{formatKrw(toSafeNumber(row.vatTotal))}</td>
                                <td>{formatKrw(toSafeNumber(row.withholdingTotal))}</td>
                                <td>{formatKrw(toSafeNumber(row.expenseVatTotal))}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row">합계</th>
                              <td>{formatKrw(taxSummaryTotals.vat)}</td>
                              <td>{formatKrw(taxSummaryTotals.withholding)}</td>
                              <td>{formatKrw(taxSummaryTotals.expenseVat)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </section>
                </ContentSection>
                <ContentSection noCard className="mg-v2-mapping-list-block">
                  <ContentCard
                    className="mg-v2-mapping-list-block__card mg-financial-management-mapping-card"
                  >
                    <div className="mg-v2-mapping-list-block__header">
                      <div className="mg-v2-mapping-list-block__title">재무 거래 내역</div>
                      <div className="mg-v2-flex mg-v2-gap-sm mg-v2-items-center">
                        <ViewModeToggle
                          viewMode={transactionViewMode}
                          onViewModeChange={setTransactionViewMode}
                          options={TRANSACTION_VIEW_MODE_OPTIONS}
                          className="mg-v2-mapping-list-block__toggle"
                          ariaLabel="목록 보기 전환"
                        />
                      </div>
                    </div>

                  {/* 거래 목록: 카드 / 작은 카드 / 테이블 — 필터는 ErpPageShell.filterSlot */}
                  {transactions.length === 0 ? (
                    <div className="mg-financial-transaction-empty">
                      <Inbox size={48} className="mg-financial-transaction-empty__icon" aria-hidden />
                      <p className="mg-financial-transaction-empty__text">거래 내역이 없습니다.</p>
                    </div>
                  ) : transactionViewMode === 'table' ? (
                    <ListTableView
                      columns={TRANSACTION_TABLE_COLUMNS}
                      data={transactions}
                      renderCell={renderTransactionTableCell}
                      className="mg-financial-transaction-list-table"
                    />
                  ) : (
                  <div
                    className={[
                      'mg-financial-transaction-cards-grid',
                      transactionViewMode === 'compact' ? 'mg-financial-transaction-cards-grid--compact' : ''
                    ].filter(Boolean).join(' ')}
                  >
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className={[
                            'mg-v2-ad-b0kla__card',
                            'mg-financial-transaction-card',
                            isMappingTransaction(transaction) ? 'mg-financial-transaction-card--with-people' : '',
                            transactionViewMode === 'compact' ? 'mg-financial-transaction-card--compact' : ''
                          ].filter(Boolean).join(' ')}
                        >
                          <div className="mg-financial-transaction-card__header">
                            <div className="mg-financial-transaction-card__header-row">
                              <div className="mg-financial-transaction-card__id-section">
                                <MGButton
                                  type="button"
                                  variant="outline"
                                  size="small"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowDetailModal(true);
                                  }}
                                  className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'sm',
                                    loading: false,
                                    className: 'mg-financial-transaction-card__id-button'
                                  })}
                                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                  preventDoubleClick={false}
                                >
                                  #{toDisplayString(transaction.id)}
                                </MGButton>
                                {isMappingTransaction(transaction) && (
                                  <Badge variant="status" statusVariant="info" size="sm" label="매핑" />
                                )}
                              </div>
                              {renderTransactionIconActions(transaction)}
                            </div>
                            <div className="mg-financial-transaction-card__date-row">
                              <span className="mg-financial-transaction-card__date">
                                {formatDate(transaction.transactionDate)}
                              </span>
                            </div>
                          </div>
                          {renderTransactionCardPeoplePanel(transaction, transactionViewMode === 'compact')}
                          {transactionViewMode === 'compact' ? (
                            <div className="mg-financial-transaction-card__body mg-financial-transaction-card__body--compact">
                              <div className="mg-financial-transaction-card__compact-line mg-financial-transaction-card__compact-line--primary">
                                <Badge
                                  variant="status"
                                  statusVariant={transaction.transactionType === 'INCOME' ? 'success' : 'danger'}
                                  label={transaction.transactionType === 'INCOME' ? '수입' : '지출'}
                                  size="sm"
                                />
                                <span className="mg-financial-transaction-card__compact-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="mg-financial-transaction-card__compact-category">
                                  <ErpSafeText fallback="-">
                                    {transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}
                                  </ErpSafeText>
                                </span>
                                <span className="mg-financial-transaction-card__compact-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="mg-financial-transaction-card__compact-amount-group">
                                  <span
                                    className={
                                      toSafeNumber(transaction.amount) >= 0
                                        ? 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--success'
                                        : 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--danger'
                                    }
                                  >
                                    {toSafeNumber(transaction.amount) >= 0 ? '+' : ''}
                                    {formatKrw(transaction.amount)}
                                  </span>
                                  {shouldShowIncomeTaxIncludedLabel(transaction) && (
                                    <span className="mg-financial-tax-included-badge">
                                      <ErpSafeText value={FINANCIAL_TAX_INCLUDED_LABEL} />
                                    </span>
                                  )}
                                </span>
                              </div>
                              {renderAmountStackSupplyAndVatRows(transaction, 'compact')}
                              {renderAmountStackWithholdingRow(transaction, 'compact')}
                              {renderAmountStackCardSettlementRows(transaction, 'compact')}
                              <div className="mg-financial-transaction-card__compact-line mg-financial-transaction-card__compact-line--secondary">
                                <span className={`erp-status ${toDisplayString(transaction.status, '').toLowerCase()}`}>
                                  <ErpSafeText>{getStatusLabel(transaction.status)}</ErpSafeText>
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mg-financial-transaction-card__body">
                              <div className="mg-financial-transaction-card__field">
                                <span className="mg-financial-transaction-card__label">유형</span>
                                <Badge
                                  variant="status"
                                  statusVariant={transaction.transactionType === 'INCOME' ? 'success' : 'danger'}
                                  label={transaction.transactionType === 'INCOME' ? '수입' : '지출'}
                                  size="sm"
                                />
                              </div>
                              <div className="mg-financial-transaction-card__field">
                                <span className="mg-financial-transaction-card__label">카테고리</span>
                                <span>
                                  <ErpSafeText fallback="-">
                                    {transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}
                                  </ErpSafeText>
                                </span>
                              </div>
                              <div className="mg-financial-transaction-card__field">
                                <span className="mg-financial-transaction-card__label">{FINANCIAL_AMOUNT_STACK_LABEL_TOTAL}</span>
                                <span className="mg-financial-transaction-card__amount-with-badge">
                                  <span
                                    className={
                                      toSafeNumber(transaction.amount) >= 0
                                        ? 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--success'
                                        : 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--danger'
                                    }
                                  >
                                    {toSafeNumber(transaction.amount) >= 0 ? '+' : ''}
                                    {formatKrw(transaction.amount)}
                                  </span>
                                  {shouldShowIncomeTaxIncludedLabel(transaction) && (
                                    <span className="mg-financial-tax-included-badge">
                                      <ErpSafeText value={FINANCIAL_TAX_INCLUDED_LABEL} />
                                    </span>
                                  )}
                                </span>
                              </div>
                              {renderAmountStackSupplyAndVatRows(transaction, 'card')}
                              {renderAmountStackWithholdingRow(transaction, 'card')}
                              {renderAmountStackCardSettlementRows(transaction, 'card')}
                              <div className="mg-financial-transaction-card__field">
                                <span className="mg-financial-transaction-card__label">상태</span>
                                <span className={`erp-status ${toDisplayString(transaction.status, '').toLowerCase()}`}>
                                  <ErpSafeText>{getStatusLabel(transaction.status)}</ErpSafeText>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                  )}

                  {/* 페이지네이션 */}
                  {pagination.totalPages > 1 && (
                    <div className="mg-financial-pagination-wrap">
                      <nav>
                        <ul className="pagination">
                          <li className={`page-item ${pagination.currentPage === 0 ? 'disabled' : ''}`}>
                            <MGButton
                              type="button"
                              variant="outline"
                              size="small"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'page-link'
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() => handlePageChange(pagination.currentPage - 1)}
                              disabled={pagination.currentPage === 0}
                              preventDoubleClick={false}
                            >
                              이전
                            </MGButton>
                          </li>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const page = i;
                            return (
                              <li key={page} className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}>
                                <MGButton
                                  type="button"
                                  variant="outline"
                                  size="small"
                                  className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'sm',
                                    loading: false,
                                    className: 'page-link'
                                  })}
                                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                  onClick={() => handlePageChange(page)}
                                  preventDoubleClick={false}
                                >
                                  {page + 1}
                                </MGButton>
                              </li>
                            );
                          })}
                          
                          <li className={`page-item ${pagination.currentPage === pagination.totalPages - 1 ? 'disabled' : ''}`}>
                            <MGButton
                              type="button"
                              variant="outline"
                              size="small"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'page-link'
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={() => handlePageChange(pagination.currentPage + 1)}
                              disabled={pagination.currentPage === pagination.totalPages - 1}
                              preventDoubleClick={false}
                            >
                              다음
                            </MGButton>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                  </ContentCard>
                </ContentSection>
                </>
              )}

              {activeTab === 'dashboard' && (
                <section className="erp-section mg-v2-erp-section-block mg-v2-erp-dashboard-block" aria-label="재무 대시보드">
                  <h2 className="mg-v2-ad-b0kla__section-title">재무 대시보드</h2>

                  <div className="mg-v2-erp-dashboard-kpi-area">
                    <div className="mg-v2-erp-dashboard-kpi-grid">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">수입 합계</span>
                          <TrendingUp size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(dashboardStats.totalIncome)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">지출 합계</span>
                          <TrendingDown size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--error" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(dashboardStats.totalExpense)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                      <div className={`mg-v2-ad-b0kla__card ${dashboardStats.netProfit >= 0 ? 'mg-v2-ad-b0kla__card--accent-primary' : 'mg-v2-ad-b0kla__card--accent-error'}`}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">순이익</span>
                          <BarChart3 size={24} aria-hidden className={`mg-v2-erp-dashboard-kpi-icon ${dashboardStats.netProfit >= 0 ? 'mg-v2-erp-dashboard-kpi-icon--primary' : 'mg-v2-erp-dashboard-kpi-icon--error'}`} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(Math.abs(dashboardStats.netProfit))}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-secondary">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">거래 건수</span>
                          <ClipboardList size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--secondary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{toDisplayString(dashboardStats.transactionCount)}건</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mg-v2-ad-b0kla__section-title">매핑 연동 현황</h3>
                  <div className="mg-v2-erp-dashboard-mapping-area">
                    <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--half">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">매핑 연동 수입</span>
                          <Link2 size={22} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">
                            {formatKrw(
                              transactions
                                .filter(t => t.transactionType === 'INCOME' &&
                                  (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                                    t.description?.includes('상담료 입금 확인')))
                                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                            )}
                          </div>
                          <span className="mg-v2-erp-dashboard-kpi-label">자동 생성된 상담료 수입</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-warning">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">매핑 연동 환불</span>
                          <Undo2 size={22} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">
                            {formatKrw(
                              transactions
                                .filter(t => t.transactionType === 'EXPENSE' &&
                                  (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                    t.description?.includes('상담료 환불')))
                                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                            )}
                          </div>
                          <span className="mg-v2-erp-dashboard-kpi-label">자동 생성된 환불 지출</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mg-v2-ad-b0kla__section-title">빠른 액션</h3>
                  <div className="mg-v2-erp-dashboard-actions">
                    <MGButton
                      type="button"
                      variant="primary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => setActiveTab('transactions')}
                      preventDoubleClick={false}
                    >
                      거래 내역 보기
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => setActiveTab('calendar')}
                      preventDoubleClick={false}
                    >
                      달력 뷰 보기
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => navigate(ADMIN_ROUTES.MAPPING_MANAGEMENT)}
                      preventDoubleClick={false}
                    >
                      매핑 시스템 확인
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => navigate(ADMIN_ROUTES.ERP_FINANCIAL)}
                      preventDoubleClick={false}
                    >
                      통합 재무 대시보드
                    </MGButton>
                  </div>
                </section>
              )}
            </>
          )}
              </div>
            </ErpPageShell>
      </ContentArea>

        {/* 거래 상세 정보 모달 */}
        {showDetailModal && selectedTransaction && (
          <TransactionDetailModal
            transaction={selectedTransaction}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedTransaction(null);
            }}
          />
        )}

        {deleteModal.isOpen && deleteModal.transaction && (
          <UnifiedModal
            isOpen
            onClose={() => setDeleteModal({ isOpen: false, transaction: null })}
            title="거래 삭제"
            size="medium"
            variant="confirm"
            showCloseButton
            className="mg-v2-ad-b0kla"
            actions={
              <>
                <MGButton
                  type="button"
                  variant="secondary"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    size: 'sm',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setDeleteModal({ isOpen: false, transaction: null })}
                  disabled={deleteSubmitting}
                  preventDoubleClick={false}
                >
                  취소
                </MGButton>
                <MGButton
                  type="button"
                  variant="danger"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'danger',
                    size: 'sm',
                    loading: deleteSubmitting
                  })}
                  onClick={confirmDeleteTransaction}
                  loading={deleteSubmitting}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  삭제
                </MGButton>
              </>
            }
          >
            <p className="mg-financial-management-delete-modal-text">
              이 작업은 되돌릴 수 없습니다. 아래 거래를 영구 삭제할까요?
            </p>
            <ul className="mg-v2-text-list mg-financial-management-delete-modal-list">
              <li>
                거래 번호: #{toDisplayString(deleteModal.transaction.id)}
              </li>
              <li>
                금액:{' '}
                <ErpSafeText fallback="-">
                  {`${toSafeNumber(deleteModal.transaction.amount).toLocaleString()}원`}
                </ErpSafeText>
              </li>
            </ul>
          </UnifiedModal>
        )}

        {editModal.open && editModal.transaction && (
          <FinancialTransactionForm
            mode="edit"
            initialTransaction={editModal.transaction}
            onClose={() => setEditModal({ open: false, transaction: null })}
            onSuccess={() => {
              loadData({ silent: true });
              setEditModal({ open: false, transaction: null });
            }}
          />
        )}
    </AdminCommonLayout>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  const [mappingDetail, setMappingDetail] = useState(null);
  const [mappingLoadError, setMappingLoadError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && transaction.relatedEntityId) {
      loadMappingDetail();
    }
  }, [transaction]);

  const loadMappingDetail = async() => {
    try {
      setLoading(true);
      setMappingLoadError(null);
      const payload = await StandardizedApi.get(
        `/api/v1/admin/amount-management/mappings/${transaction.relatedEntityId}/amount-info`
      );
      if (payload == null) {
        setMappingDetail(null);
        return;
      }
      if (
        typeof payload === 'object' &&
        payload.error != null &&
        payload.error !== ''
      ) {
        setMappingDetail(null);
        const rawErr =
          typeof payload.error === 'string'
            ? payload.error
            : toDisplayString(payload.error, '');
        setMappingLoadError(
          rawErr
            ? toDisplayString(rawErr, '매핑 정보를 불러올 수 없습니다.')
            : null
        );
        return;
      }
      setMappingDetail(payload);
    } catch (err) {
      console.error('매핑 상세 정보 로드 실패:', err);
      setMappingDetail(null);
      setMappingLoadError(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const modalTitle = (
    <>
      <DollarSign size={20} aria-hidden /> 거래 상세 정보 #{toDisplayString(transaction.id)}
    </>
  );

  const mappingDetailUrl = `${ADMIN_ROUTES.MAPPING_MANAGEMENT}?mappingId=${encodeURIComponent(String(transaction.relatedEntityId ?? ''))}`;

  const modalActions = (
    <>
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        onClick={onClose}
        className={buildErpMgButtonClassName({
          variant: 'secondary',
          size: 'sm',
          loading: false,
          className: 'mg-v2-transaction-detail-btn mg-v2-transaction-detail-btn--secondary'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        preventDoubleClick={false}
      >
        닫기
      </MGButton>
      {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
        <MGButton
          type="button"
          variant="primary"
          size="small"
          onClick={() => window.open(mappingDetailUrl, '_blank')}
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            loading: false,
            className: 'mg-v2-transaction-detail-btn mg-v2-transaction-detail-btn--primary'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick={false}
        >
          매핑 보기
        </MGButton>
      )}
    </>
  );

  return (
    <UnifiedModal
      isOpen
      onClose={onClose}
      title={modalTitle}
      size="large"
      showCloseButton
      actions={modalActions}
      className="mg-v2-ad-b0kla"
    >
      <div className="mg-v2-transaction-detail-card mg-v2-card mg-v2-card--outlined">
        <h3 className="mg-v2-section-header">
          <BarChart3 size={18} aria-hidden /> 기본 정보
        </h3>
        <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
          <div>
            <strong>거래 유형:</strong>
            <span className={`mg-v2-transaction-detail-badge ${transaction.transactionType === 'INCOME' ? 'mg-v2-transaction-detail-badge--income' : 'mg-v2-transaction-detail-badge--expense'}`}>
              {transaction.transactionType === 'INCOME' ? '수입' : '지출'}
            </span>
          </div>
          <div>
            <strong>카테고리:</strong>{' '}
            <ErpSafeText fallback="-">{transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}</ErpSafeText>
          </div>
          <div>
            <strong>{FINANCIAL_AMOUNT_STACK_LABEL_TOTAL}:</strong>{' '}
            <span className={`mg-v2-transaction-detail-amount ${transaction.transactionType === 'INCOME' ? 'mg-v2-transaction-detail-amount--income' : 'mg-v2-transaction-detail-amount--expense'}`}>
              {formatKrw(transaction.amount)}
            </span>
            {shouldShowIncomeTaxIncludedLabel(transaction) && (
              <>
                {' '}
                <span className="mg-financial-tax-included-badge">
                  <ErpSafeText value={FINANCIAL_TAX_INCLUDED_LABEL} />
                </span>
              </>
            )}
          </div>
          {renderAmountStackSupplyAndVatRows(transaction, 'detail')}
          {renderAmountStackWithholdingRow(transaction, 'detail')}
          {renderAmountStackCardSettlementRows(transaction, 'detail')}
          <div>
            <strong>거래일:</strong> {formatDate(transaction.transactionDate)}
          </div>
          <div className="mg-v2-transaction-detail-form-grid__item--span2">
            <strong>설명:</strong> <ErpSafeText fallback="-">{transaction.description}</ErpSafeText>
          </div>
        </div>
      </div>

      {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
        <div className="mg-v2-transaction-detail-mapping-box">
          <h3 className="mg-v2-transaction-detail-mapping-title">
            <Link2 size={18} aria-hidden /> 매핑 연동 정보
          </h3>
          {loading ? (
            <div className="mg-v2-transaction-detail-loading-wrap">
              <UnifiedLoading type="inline" text="매핑 정보를 불러오는 중..." />
            </div>
          ) : mappingDetail ? (
            <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
              <div>
                <strong>매핑 ID:</strong> #{toDisplayString(mappingDetail.mappingId)}
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>내담자 (결제 회원):</strong>{' '}
                <ErpSafeText fallback="-">{mappingDetail.clientName}</ErpSafeText>
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>상담사:</strong> <ErpSafeText fallback="-">{mappingDetail.consultantName}</ErpSafeText>
              </div>
              <div>
                <strong>패키지명:</strong> <ErpSafeText fallback="-">{mappingDetail.packageName}</ErpSafeText>
              </div>
              <div>
                <strong>총 회기수:</strong> {toDisplayString(mappingDetail.totalSessions)}회
              </div>
              {mappingDetail.remainingSessions != null && mappingDetail.remainingSessions !== '' && (
                <div>
                  <strong>남은 회기:</strong> {toDisplayString(mappingDetail.remainingSessions)}회
                </div>
              )}
              {mappingDetail.mappingStatusDisplay && (
                <div>
                  <strong>매핑 상태:</strong> <ErpSafeText>{mappingDetail.mappingStatusDisplay}</ErpSafeText>
                </div>
              )}
              {mappingDetail.mappingPaymentStatusDisplay && (
                <div>
                  <strong>결제 상태:</strong> <ErpSafeText>{mappingDetail.mappingPaymentStatusDisplay}</ErpSafeText>
                </div>
              )}
              <div>
                <strong>회기당 단가:</strong> {formatKrw(mappingDetail.pricePerSession)}
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>패키지 가격:</strong>
                <span className="mg-v2-transaction-detail-package-price">{formatKrw(mappingDetail.packagePrice)}</span>
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>결제 금액:</strong>
                <span className={`mg-v2-transaction-detail-payment-amount ${mappingDetail.packagePrice === mappingDetail.paymentAmount ? 'mg-v2-transaction-detail-payment-amount--match' : 'mg-v2-transaction-detail-payment-amount--mismatch'}`}>
                  {formatKrw(mappingDetail.paymentAmount)}
                  {mappingDetail.packagePrice !== mappingDetail.paymentAmount && (
                    <span className="mg-v2-transaction-detail-message-mismatch">(패키지 가격과 다름)</span>
                  )}
                </span>
              </div>
              {mappingDetail.isConsistent !== undefined && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>일관성 검사:</strong>
                  <span className={`mg-v2-transaction-detail-consistent-badge ${mappingDetail.isConsistent ? 'mg-v2-transaction-detail-consistent-badge--ok' : 'mg-v2-transaction-detail-consistent-badge--error'}`}>
                    {mappingDetail.isConsistent ? '정상' : '불일치'}
                  </span>
                  {!mappingDetail.isConsistent && (
                    <div className="mg-v2-transaction-detail-consistency-msg"><ErpSafeText>{mappingDetail.consistencyMessage}</ErpSafeText></div>
                  )}
                </div>
              )}
              {mappingDetail.relatedTransactions && mappingDetail.relatedTransactions.length > 0 && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>관련 거래:</strong>
                  <div className="mg-v2-transaction-detail-related-list">
                    {mappingDetail.relatedTransactions.map((relatedTx, index) => (
                      <div key={index} className="mg-v2-transaction-detail-related-item">
                        #{toDisplayString(relatedTx.id)} - <ErpSafeText>{relatedTx.type}</ErpSafeText> - {formatKrw(relatedTx.amount)} ({formatDate(relatedTx.createdAt)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mg-v2-transaction-detail-message-empty">
              {mappingLoadError != null && mappingLoadError !== ''
                ? toDisplayString(mappingLoadError)
                : '매핑 정보를 불러올 수 없습니다.'}
            </div>
          )}
        </div>
      )}

      {transaction.relatedEntityType && transaction.relatedEntityType !== 'CONSULTANT_CLIENT_MAPPING' && (
        <div className="mg-v2-transaction-detail-other-box">
          <h3 className="mg-v2-transaction-detail-other-title">
            <Link2 size={18} aria-hidden /> 연동 정보
          </h3>
          <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
            <div>
              <strong>연동 유형:</strong> <ErpSafeText>{transaction.relatedEntityType}</ErpSafeText>
            </div>
            <div>
              <strong>연동 ID:</strong> #{toDisplayString(transaction.relatedEntityId)}
            </div>
          </div>
        </div>
      )}
    </UnifiedModal>
  );
};

export default FinancialManagement;
