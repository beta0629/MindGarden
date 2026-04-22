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
  getDisplaySupplyAmount,
  getDisplayVatAmount,
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
import {
  FM_PAGE_TITLE,
  FM_SESSION,
  FM_LOGIN,
  fmFinancialPageSubtitleWithBranch,
  FM_FINANCIAL_PAGE_SUBTITLE_DEFAULT,
  FM_EXPORT,
  FM_VIEW_TABS,
  FM_TRANSACTION_VIEW_MODE_OPTIONS,
  FM_TX_TABLE_LABELS,
  FM_TX_TYPE,
  FM_CATEGORY_DISPLAY,
  FM_ERRORS,
  FM_TOAST,
  fmToastDeleteFailed,
  FM_TX_DESCRIPTION_MATCH,
  FM_MAPPING_ARIA,
  fmMappingAriaClient,
  fmMappingAriaConsultant,
  fmMappingAriaPackage,
  fmMappingAriaMappingStatus,
  fmMappingAriaPaymentStatus,
  fmMappingAriaRemainingSessions,
  FM_ROW_ACTIONS,
  FM_FILTER,
  FM_FILTER_TX_TYPE_OPTIONS,
  FM_FILTER_CATEGORY_OPTIONS,
  FM_LOADING,
  FM_RETRY,
  FM_TAX_SUMMARY,
  FM_TX_LIST_SECTION,
  FM_CARD_LABELS,
  FM_PAGINATION,
  FM_DASHBOARD,
  FM_DELETE_MODAL,
  FM_DETAIL_MODAL,
  FM_WITHHOLDING_DETAIL_HINT,
  FM_CURRENCY_SUFFIX
} from '../../constants/financialManagementStrings';
import '../../styles/unified-design-tokens.css';
import '../../styles/themes/client-theme.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import './ErpCommon.css';
import './FinancialManagement.css';

/** 거래 내역 보기: 일반 카드 / 콤팩트 카드 / 테이블 */
const TRANSACTION_VIEW_MODE_OPTIONS = FM_TRANSACTION_VIEW_MODE_OPTIONS;

const FINANCIAL_PAGE_TITLE_ID = 'financial-management-page-title';

/** 재무 거래 행 액션 — Lucide 아이콘 크기(디자인 토큰 --icon-size-sm 20px에 맞춤) */
const FINANCIAL_TX_ICON_SIZE = 20;

/** 재무 거래 목록 테이블 컬럼 (ListTableView) */
const TRANSACTION_TABLE_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'transactionDate', label: FM_TX_TABLE_LABELS.TRANSACTION_DATE },
  { key: 'transactionType', label: FM_TX_TABLE_LABELS.TRANSACTION_TYPE },
  { key: 'category', label: FM_TX_TABLE_LABELS.CATEGORY },
  { key: 'amount', label: FINANCIAL_AMOUNT_STACK_LABEL_TOTAL },
  { key: 'status', label: FM_TX_TABLE_LABELS.STATUS },
  { key: 'mapping', label: FM_TX_TABLE_LABELS.MAPPING },
  { key: 'actions', label: FM_TX_TABLE_LABELS.ACTIONS }
];

/**
 * 공급가·부가세 행 (값 없으면 —).
 * @param {Object} transaction
 * @param {'compact' | 'card' | 'detail' | 'table'} layout
 * @returns {import('react').ReactNode}
 */
function renderAmountStackSupplyAndVatRows(transaction, layout) {
  const supply = formatOptionalKrw(getDisplaySupplyAmount(transaction));
  const vat = formatOptionalKrw(getDisplayVatAmount(transaction));
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
          {FM_WITHHOLDING_DETAIL_HINT}
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
 * 거래 검색(플레이스홀더: 상담사명·내담자명·설명 등).
 * Admin 재무 목록 API는 search 파라미터를 사용하지 않으므로 클라이언트에서만 필터한다.
 *
 * @param {Record<string, unknown>} transaction
 * @param {string} searchLower trim·toLowerCase 된 검색어; 빈 문자열이면 항상 true
 * @returns {boolean}
 */
const financialTransactionMatchesSearchText = (transaction, searchLower) => {
  if (!searchLower) {
    return true;
  }
  const vals = [
    transaction?.description,
    transaction?.category,
    transaction?.subcategory,
    transaction?.consultantName,
    transaction?.clientName,
    transaction?.mappingPackageName,
    transaction?.mappingStatusDisplay,
    transaction?.mappingPaymentStatusDisplay,
    transaction?.remarks,
    transaction?.transactionTypeDisplayName,
    transaction?.statusDisplayName
  ];
  return vals.some((v) => v != null && String(v).toLowerCase().includes(searchLower));
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
      setError(FM_ERRORS.DATA_LOAD);
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
      if (filters.searchText) params.search = filters.searchText;
      if (user?.branchCode) params.branchCode = user.branchCode;

      const response = await StandardizedApi.get('/api/v1/admin/financial-transactions', params);

      // apiGet이 {success, data} 형태면 data만 반환하므로, 배열인지 객체인지 확인
      if (Array.isArray(response)) {
        // apiGet이 data 배열만 반환한 경우
        let filteredTransactions = response || [];
        
        if (filters.searchText) {
          const searchLower = filters.searchText.trim().toLowerCase();
          filteredTransactions = filteredTransactions.filter((transaction) =>
            financialTransactionMatchesSearchText(transaction, searchLower)
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
            const searchLower = filters.searchText.trim().toLowerCase();
            filteredTransactions = filteredTransactions.filter((transaction) =>
              financialTransactionMatchesSearchText(transaction, searchLower)
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
          const errorMessage = response?.message || FM_ERRORS.TX_LIST;
          console.error('API 오류:', errorMessage, response);
          setError(errorMessage);
          
          if (response?.redirectToLogin) {
            console.error('세션 만료 — 로그인 화면으로 이동');
            redirectToLoginPageOnce();
            return;
          }
        }
      } else {
        setError(FM_ERRORS.TX_LIST);
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
                          FM_ERRORS.TX_LIST_NETWORK;
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
        notificationManager.error(fmToastDeleteFailed(toErrorMessage(result.message)));
        return;
      }
      notificationManager.success(FM_TOAST.DELETE_SUCCESS);
      setDeleteModal({ isOpen: false, transaction: null });
      loadData({ silent: true });
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      notificationManager.error(toErrorMessage(error.message) || FM_TOAST.DELETE_GENERIC);
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
    (typeof transaction.description === 'string' && transaction.description.includes(FM_TX_DESCRIPTION_MATCH.CONSULTATION_DEPOSIT)) ||
    (typeof transaction.description === 'string' && transaction.description.includes(FM_TX_DESCRIPTION_MATCH.CONSULTATION_REFUND));

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
        FM_MAPPING_ARIA.CONNECTED_MEMBERS,
        fmMappingAriaClient(toDisplayString(transaction.clientName)),
        fmMappingAriaConsultant(toDisplayString(transaction.consultantName))
      ];
      if (transaction.mappingPackageName) {
        ariaLabelParts.push(fmMappingAriaPackage(toDisplayString(transaction.mappingPackageName)));
      }
      if (transaction.mappingStatusDisplay) {
        ariaLabelParts.push(fmMappingAriaMappingStatus(toDisplayString(transaction.mappingStatusDisplay)));
      }
      if (transaction.mappingPaymentStatusDisplay) {
        ariaLabelParts.push(fmMappingAriaPaymentStatus(toDisplayString(transaction.mappingPaymentStatusDisplay)));
      }
      if (transaction.mappingRemainingSessions != null && transaction.mappingRemainingSessions !== '') {
        ariaLabelParts.push(fmMappingAriaRemainingSessions(toDisplayString(transaction.mappingRemainingSessions)));
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
      <div className="mg-financial-transaction-card__people-panel dashboard-client" aria-label={FM_MAPPING_ARIA.CONNECTED_MEMBERS}>
        <div className="mg-financial-transaction-card__people-panel-inner">
          <div className="mg-financial-transaction-card__people-row mg-financial-transaction-card__people-row--client">
            <User size={20} aria-hidden className="mg-financial-transaction-card__people-icon" />
            <div className="mg-financial-transaction-card__people-text">
              <div className="mg-financial-transaction-card__people-eyebrow">{FM_MAPPING_ARIA.CLIENT_EYEBROW}</div>
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
              <div className="mg-financial-transaction-card__people-eyebrow">{FM_MAPPING_ARIA.CONSULTANT_EYEBROW}</div>
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
                {FM_MAPPING_ARIA.REMAINING_SESSIONS_PREFIX} {toDisplayString(transaction.mappingRemainingSessions)}{FM_MAPPING_ARIA.REMAINING_SESSIONS_SUFFIX}
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
      aria-label={FM_ROW_ACTIONS.GROUP}
    >
      <MGButton
        type="button"
        variant="outline"
        size="medium"
        className={buildFinancialTxIconButtonClassName({ variant: 'outline' })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => handleViewTransaction(transaction)}
        aria-label={FM_ROW_ACTIONS.VIEW}
        title={FM_ROW_ACTIONS.VIEW}
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
        aria-label={FM_ROW_ACTIONS.EDIT}
        title={FM_ROW_ACTIONS.EDIT}
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
          aria-label={FM_ROW_ACTIONS.DELETE}
          title={FM_ROW_ACTIONS.DELETE}
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
            label={transaction.transactionType === 'INCOME' ? FM_TX_TYPE.INCOME : FM_TX_TYPE.EXPENSE}
            size="sm"
          />
        );
      case 'category':
        return (
          <ErpSafeText fallback="-">
            {transaction.category === 'CONSULTATION' ? FM_CATEGORY_DISPLAY.CONSULTATION : transaction.category}
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
            <Badge variant="status" statusVariant="info" size="sm" label={FM_TX_TABLE_LABELS.MAPPING} />
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
          title={FM_PAGE_TITLE}
          subtitle={FM_SESSION.SUBTITLE_CHECKING}
          titleId={FINANCIAL_PAGE_TITLE_ID}
        />
        <ContentArea className="erp-system" ariaLabel={FM_PAGE_TITLE}>
          <div className="erp-session-inline-load">
            <div
              className="erp-session-inline-load__body"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <UnifiedLoading type="inline" text={FM_SESSION.LOADING} />
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
          title={FM_PAGE_TITLE}
          subtitle={FM_LOGIN.SUBTITLE}
          titleId={FINANCIAL_PAGE_TITLE_ID}
        />
        <ContentArea className="erp-system" ariaLabel={FM_PAGE_TITLE}>
          <div className="erp-error">
            <h3>{FM_LOGIN.HEADING}</h3>
            <p>{FM_LOGIN.BODY}</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  const financialPageSubtitle = dashboardStats.branchName
    ? fmFinancialPageSubtitleWithBranch(dashboardStats.branchName)
    : FM_FINANCIAL_PAGE_SUBTITLE_DEFAULT;

  const pageHeaderActions =
    activeTab === 'transactions' ? (
      <MGButton
        type="button"
        variant="secondary"
        size="small"
        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={() => {}}
        aria-label={FM_EXPORT.ARIA_LABEL}
        preventDoubleClick={false}
      >
        {FM_EXPORT.BUTTON}
      </MGButton>
    ) : null;

  return (
    <AdminCommonLayout>
      <ContentHeader
        title={FM_PAGE_TITLE}
        subtitle={financialPageSubtitle}
        actions={pageHeaderActions}
        titleId={FINANCIAL_PAGE_TITLE_ID}
      />
      <ContentArea className="erp-system" ariaLabel={FM_PAGE_TITLE}>
        <ErpPageShell
              tabsSlot={
                <div className="mg-v2-financial-page-hub-tabs">
                  <FinancialRefundHubTabs />
                  <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist" aria-label={FM_VIEW_TABS.ARIA_LABEL}>
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
                      {FM_VIEW_TABS.TRANSACTIONS}
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
                      {FM_VIEW_TABS.CALENDAR}
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
                      {FM_VIEW_TABS.DASHBOARD}
                    </MGButton>
                  </div>
                </div>
              }
              filterSlot={
                activeTab === 'transactions' && !error ? (
                  <div className="mg-w-full mg-mb-md">
                  <ErpFilterToolbar
                    ariaLabel={FM_FILTER.ARIA_TOOLBAR}
                    primaryRow={(
                      <div className="mg-v2-filter-grid mg-v2-filter-grid--row1">
                        <div className="mg-v2-form-group">
                          <label className="mg-v2-form-label" htmlFor="financial-filter-date-range">
                            {FM_FILTER.PERIOD}
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
                            <option value="ALL">{FM_FILTER.DATE_RANGE_ALL}</option>
                            <option value="TODAY">{FM_FILTER.DATE_RANGE_TODAY}</option>
                            <option value="WEEK">{FM_FILTER.DATE_RANGE_WEEK}</option>
                            <option value="MONTH">{FM_FILTER.DATE_RANGE_MONTH}</option>
                            <option value="CUSTOM">{FM_FILTER.DATE_RANGE_CUSTOM}</option>
                          </select>
                          {filters.dateRange === 'MONTH' && (
                            <div
                              className="mg-financial-month-picker mg-v2-erp-filter-toolbar__custom-range"
                              role="group"
                              aria-label={FM_FILTER.MONTH_QUERY}
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
                                aria-label={FM_FILTER.PREV_MONTH}
                                title={FM_FILTER.PREV_MONTH}
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
                                aria-label={FM_FILTER.MONTH_QUERY}
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
                                aria-label={FM_FILTER.NEXT_MONTH}
                                title={FM_FILTER.NEXT_MONTH}
                                preventDoubleClick={false}
                              >
                                <ChevronRight size={FINANCIAL_TX_ICON_SIZE} aria-hidden />
                              </MGButton>
                            </div>
                          )}
                          {filters.dateRange === 'ALL' && (
                            <p className="mg-financial-filter-all-hint" role="status">
                              {FM_FILTER.ALL_PERIOD_HINT}
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
                                aria-label={FM_FILTER.START_DATE}
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
                                aria-label={FM_FILTER.END_DATE}
                              />
                            </div>
                          )}
                        </div>
                        <div className="mg-v2-form-group">
                          <span className="mg-v2-form-label">{FM_FILTER.TRANSACTION_TYPE}</span>
                          <div className="mg-erp-filter-badge-group">
                            {FM_FILTER_TX_TYPE_OPTIONS.map((opt) => (
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
                          <span className="mg-v2-form-label">{FM_FILTER.CATEGORY}</span>
                          <div className="mg-erp-filter-badge-group">
                            {FM_FILTER_CATEGORY_OPTIONS.map((opt) => (
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
                      <div className="mg-v2-filter-grid mg-v2-filter-grid--row2 mg-financial-filter-secondary">
                        <div className="mg-v2-form-group mg-financial-filter-search">
                          <label className="mg-v2-form-label" htmlFor="financial-filter-search">
                            {FM_FILTER.SEARCH}
                          </label>
                          <input
                            id="financial-filter-search"
                            type="text"
                            placeholder={FM_FILTER.SEARCH_PLACEHOLDER}
                            value={filters.searchText}
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, searchText: e.target.value }))
                            }
                            className="mg-v2-form-select"
                          />
                        </div>
                        <div className="mg-v2-form-group mg-financial-filter-actions">
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
                            {FM_FILTER.SUBMIT}
                          </MGButton>
                        </div>
                      </div>
                    )}
                  />
                  </div>
                ) : null
              }
            >
              <div className="erp-content" aria-busy={loading || silentListRefreshing}>
            {loading && (
              <div className="erp-initial-fetch-inline" role="status" aria-live="polite" aria-busy="true">
                <UnifiedLoading type="inline" text={FM_LOADING.INLINE} />
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
                  aria-label={FM_RETRY.ARIA_LABEL}
                >
                  {FM_RETRY.LABEL}
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
                      {FM_TAX_SUMMARY.SECTION_TITLE}
                    </h2>
                    <p className="mg-v2-text-secondary mg-mb-md">
                      {FM_TAX_SUMMARY.INTRO_P1}{' '}
                      {FM_TAX_SUMMARY.INTRO_P2}
                    </p>
                    <section
                      className="mg-financial-tax-filing-notice"
                      aria-labelledby="financial-tax-filing-notice-title"
                    >
                      <h3
                        id="financial-tax-filing-notice-title"
                        className="mg-financial-tax-filing-notice__title"
                      >
                        {FM_TAX_SUMMARY.NOTICE_TITLE}
                      </h3>
                      <p className="mg-financial-tax-filing-notice__text">
                        {FM_TAX_SUMMARY.NOTICE_P1}{' '}
                        {FM_TAX_SUMMARY.NOTICE_P2}{' '}
                        <a
                          className="mg-financial-tax-filing-notice__link"
                          href={FINANCIAL_TAX_NOTICE_HOMETAX_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {FM_TAX_SUMMARY.HOMETAX}
                        </a>
                        {' · '}
                        <a
                          className="mg-financial-tax-filing-notice__link"
                          href={FINANCIAL_TAX_NOTICE_NTS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {FM_TAX_SUMMARY.NTS}
                        </a>
                        {' '}{FM_TAX_SUMMARY.NOTICE_P3}
                      </p>
                      <ul className="mg-financial-tax-filing-notice__list">
                        <li>
                          {FM_TAX_SUMMARY.BULLET_WITHHOLDING}
                        </li>
                        <li>
                          {FM_TAX_SUMMARY.BULLET_VAT}
                        </li>
                        <li>
                          {FM_TAX_SUMMARY.BULLET_DISCLAIMER}
                        </li>
                      </ul>
                    </section>
                    <div className="mg-v2-form-group mg-mb-md">
                      <label className="mg-v2-form-label" htmlFor="financial-tax-summary-year">
                        {FM_TAX_SUMMARY.YEAR_LABEL}
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
                            {`${y}${FM_TAX_SUMMARY.YEAR_OPTION_SUFFIX}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    {taxSummaryLoading && (
                      <div className="mg-mb-md" role="status" aria-live="polite" aria-busy="true">
                        <UnifiedLoading type="inline" text={FM_LOADING.TAX_SUMMARY} />
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
                              <th scope="col">{FM_TAX_SUMMARY.TH_MONTH}</th>
                              <th scope="col">{FM_TAX_SUMMARY.TH_VAT}</th>
                              <th scope="col">{FM_TAX_SUMMARY.TH_WITHHOLDING}</th>
                              <th scope="col">{FM_TAX_SUMMARY.TH_EXPENSE_VAT}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taxSummaryMonths.map((row) => (
                              <tr key={String(row.month)}>
                                <td>
                                  <ErpSafeText>{toDisplayString(row.month)}</ErpSafeText>
                                  {FM_TAX_SUMMARY.TH_MONTH}
                                </td>
                                <td>{formatKrw(toSafeNumber(row.vatTotal))}</td>
                                <td>{formatKrw(toSafeNumber(row.withholdingTotal))}</td>
                                <td>{formatKrw(toSafeNumber(row.expenseVatTotal))}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <th scope="row">{FM_TAX_SUMMARY.FOOT_SUM}</th>
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
                      <div className="mg-v2-mapping-list-block__title">{FM_TX_LIST_SECTION.TITLE}</div>
                      <div className="mg-v2-flex mg-v2-gap-sm mg-v2-items-center">
                        <ViewModeToggle
                          viewMode={transactionViewMode}
                          onViewModeChange={setTransactionViewMode}
                          options={TRANSACTION_VIEW_MODE_OPTIONS}
                          className="mg-v2-mapping-list-block__toggle"
                          ariaLabel={FM_TX_LIST_SECTION.VIEW_TOGGLE_ARIA}
                        />
                      </div>
                    </div>

                  {/* 거래 목록: 카드 / 작은 카드 / 테이블 — 필터는 ErpPageShell.filterSlot */}
                  {transactions.length === 0 ? (
                    <div className="mg-financial-transaction-empty">
                      <Inbox size={48} className="mg-financial-transaction-empty__icon" aria-hidden />
                      <p className="mg-financial-transaction-empty__text">{FM_TX_LIST_SECTION.EMPTY}</p>
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
                                  <Badge variant="status" statusVariant="info" size="sm" label={FM_TX_TABLE_LABELS.MAPPING} />
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
                                  label={transaction.transactionType === 'INCOME' ? FM_TX_TYPE.INCOME : FM_TX_TYPE.EXPENSE}
                                  size="sm"
                                />
                                <span className="mg-financial-transaction-card__compact-sep" aria-hidden>
                                  ·
                                </span>
                                <span className="mg-financial-transaction-card__compact-category">
                                  <ErpSafeText fallback="-">
                                    {transaction.category === 'CONSULTATION' ? FM_CATEGORY_DISPLAY.CONSULTATION : transaction.category}
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
                                <span className="mg-financial-transaction-card__label">{FM_CARD_LABELS.TYPE}</span>
                                <Badge
                                  variant="status"
                                  statusVariant={transaction.transactionType === 'INCOME' ? 'success' : 'danger'}
                                  label={transaction.transactionType === 'INCOME' ? FM_TX_TYPE.INCOME : FM_TX_TYPE.EXPENSE}
                                  size="sm"
                                />
                              </div>
                              <div className="mg-financial-transaction-card__field">
                                <span className="mg-financial-transaction-card__label">{FM_CARD_LABELS.CATEGORY}</span>
                                <span>
                                  <ErpSafeText fallback="-">
                                    {transaction.category === 'CONSULTATION' ? FM_CATEGORY_DISPLAY.CONSULTATION : transaction.category}
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
                                <span className="mg-financial-transaction-card__label">{FM_CARD_LABELS.STATUS}</span>
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
                              {FM_PAGINATION.PREV}
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
                              {FM_PAGINATION.NEXT}
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
                <section className="erp-section mg-v2-erp-section-block mg-v2-erp-dashboard-block" aria-label={FM_DASHBOARD.SECTION_ARIA}>
                  <h2 className="mg-v2-ad-b0kla__section-title">{FM_DASHBOARD.SECTION_TITLE}</h2>

                  <div className="mg-v2-erp-dashboard-kpi-area">
                    <div className="mg-v2-erp-dashboard-kpi-grid">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_INCOME}</span>
                          <TrendingUp size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(dashboardStats.totalIncome)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_THIS_MONTH}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_EXPENSE}</span>
                          <TrendingDown size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--error" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(dashboardStats.totalExpense)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_THIS_MONTH}</span>
                        </div>
                      </div>
                      <div className={`mg-v2-ad-b0kla__card ${dashboardStats.netProfit >= 0 ? 'mg-v2-ad-b0kla__card--accent-primary' : 'mg-v2-ad-b0kla__card--accent-error'}`}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_NET}</span>
                          <BarChart3 size={24} aria-hidden className={`mg-v2-erp-dashboard-kpi-icon ${dashboardStats.netProfit >= 0 ? 'mg-v2-erp-dashboard-kpi-icon--primary' : 'mg-v2-erp-dashboard-kpi-icon--error'}`} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatKrw(Math.abs(dashboardStats.netProfit))}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_THIS_MONTH}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-secondary">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_TX_COUNT}</span>
                          <ClipboardList size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--secondary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{toDisplayString(dashboardStats.transactionCount)}{FM_DASHBOARD.TX_COUNT_SUFFIX}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_THIS_MONTH}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mg-v2-ad-b0kla__section-title">{FM_DASHBOARD.MAPPING_STATUS_TITLE}</h3>
                  <div className="mg-v2-erp-dashboard-mapping-area">
                    <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--half">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-success">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_MAPPING_INCOME}</span>
                          <Link2 size={22} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">
                            {formatKrw(
                              transactions
                                .filter(t => t.transactionType === 'INCOME' &&
                                  (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                                    t.description?.includes(FM_TX_DESCRIPTION_MATCH.CONSULTATION_DEPOSIT)))
                                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                            )}
                          </div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_MAPPING_INCOME_SUB}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-warning">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_MAPPING_REFUND}</span>
                          <Undo2 size={22} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">
                            {formatKrw(
                              transactions
                                .filter(t => t.transactionType === 'EXPENSE' &&
                                  (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                    t.description?.includes(FM_TX_DESCRIPTION_MATCH.CONSULTATION_REFUND)))
                                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                            )}
                          </div>
                          <span className="mg-v2-erp-dashboard-kpi-label">{FM_DASHBOARD.KPI_MAPPING_REFUND_SUB}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mg-v2-ad-b0kla__section-title">{FM_DASHBOARD.QUICK_ACTIONS}</h3>
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
                      {FM_DASHBOARD.GO_TRANSACTIONS}
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
                      {FM_DASHBOARD.GO_CALENDAR}
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
                      {FM_DASHBOARD.GO_MAPPING}
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
                      {FM_DASHBOARD.GO_INTEGRATED_FINANCE}
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
            title={FM_DELETE_MODAL.TITLE}
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
                  {FM_DELETE_MODAL.CANCEL}
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
                  {FM_DELETE_MODAL.CONFIRM}
                </MGButton>
              </>
            }
          >
            <p className="mg-financial-management-delete-modal-text">
              {FM_DELETE_MODAL.WARNING}
            </p>
            <ul className="mg-v2-text-list mg-financial-management-delete-modal-list">
              <li>
                {FM_DELETE_MODAL.FIELD_TX_ID} #{toDisplayString(deleteModal.transaction.id)}
              </li>
              <li>
                {FM_DELETE_MODAL.FIELD_AMOUNT}{' '}
                <ErpSafeText fallback="-">
                  {`${toSafeNumber(deleteModal.transaction.amount).toLocaleString()}${FM_CURRENCY_SUFFIX}`}
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
            ? toDisplayString(rawErr, FM_ERRORS.MAPPING_DETAIL_FALLBACK)
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
      <DollarSign size={20} aria-hidden /> {FM_DETAIL_MODAL.TITLE_PREFIX} #{toDisplayString(transaction.id)}
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
        {FM_DETAIL_MODAL.CLOSE}
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
          {FM_DETAIL_MODAL.VIEW_MAPPING}
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
          <BarChart3 size={18} aria-hidden /> {FM_DETAIL_MODAL.BASIC_INFO}
        </h3>
        <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
          <div>
            <strong>{FM_DETAIL_MODAL.LABEL_TX_TYPE}</strong>
            <span className={`mg-v2-transaction-detail-badge ${transaction.transactionType === 'INCOME' ? 'mg-v2-transaction-detail-badge--income' : 'mg-v2-transaction-detail-badge--expense'}`}>
              {transaction.transactionType === 'INCOME' ? FM_TX_TYPE.INCOME : FM_TX_TYPE.EXPENSE}
            </span>
          </div>
          <div>
            <strong>{FM_DETAIL_MODAL.LABEL_CATEGORY}</strong>{' '}
            <ErpSafeText fallback="-">{transaction.category === 'CONSULTATION' ? FM_CATEGORY_DISPLAY.CONSULTATION : transaction.category}</ErpSafeText>
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
            <strong>{FM_DETAIL_MODAL.LABEL_TX_DATE}</strong> {formatDate(transaction.transactionDate)}
          </div>
          <div className="mg-v2-transaction-detail-form-grid__item--span2">
            <strong>{FM_DETAIL_MODAL.LABEL_DESCRIPTION}</strong> <ErpSafeText fallback="-">{transaction.description}</ErpSafeText>
          </div>
        </div>
      </div>

      {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
        <div className="mg-v2-transaction-detail-mapping-box">
          <h3 className="mg-v2-transaction-detail-mapping-title">
            <Link2 size={18} aria-hidden /> {FM_DETAIL_MODAL.MAPPING_SECTION}
          </h3>
          {loading ? (
            <div className="mg-v2-transaction-detail-loading-wrap" role="status" aria-live="polite" aria-busy="true">
              <UnifiedLoading type="inline" text={FM_DETAIL_MODAL.LOADING_MAPPING} />
            </div>
          ) : mappingDetail ? (
            <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
              <div>
                <strong>{FM_DETAIL_MODAL.LABEL_MAPPING_ID}</strong> #{toDisplayString(mappingDetail.mappingId)}
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>{FM_DETAIL_MODAL.LABEL_CLIENT}</strong>{' '}
                <ErpSafeText fallback="-">{mappingDetail.clientName}</ErpSafeText>
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>{FM_DETAIL_MODAL.LABEL_CONSULTANT}</strong> <ErpSafeText fallback="-">{mappingDetail.consultantName}</ErpSafeText>
              </div>
              <div>
                <strong>{FM_DETAIL_MODAL.LABEL_PACKAGE_NAME}</strong> <ErpSafeText fallback="-">{mappingDetail.packageName}</ErpSafeText>
              </div>
              <div>
                <strong>{FM_DETAIL_MODAL.LABEL_TOTAL_SESSIONS}</strong> {toDisplayString(mappingDetail.totalSessions)}{FM_DETAIL_MODAL.SESSION_SUFFIX}
              </div>
              {mappingDetail.remainingSessions != null && mappingDetail.remainingSessions !== '' && (
                <div>
                  <strong>{FM_DETAIL_MODAL.LABEL_REMAINING_SESSIONS}</strong> {toDisplayString(mappingDetail.remainingSessions)}{FM_DETAIL_MODAL.SESSION_SUFFIX}
                </div>
              )}
              {mappingDetail.mappingStatusDisplay && (
                <div>
                  <strong>{FM_DETAIL_MODAL.LABEL_MAPPING_STATUS}</strong> <ErpSafeText>{mappingDetail.mappingStatusDisplay}</ErpSafeText>
                </div>
              )}
              {mappingDetail.mappingPaymentStatusDisplay && (
                <div>
                  <strong>{FM_DETAIL_MODAL.LABEL_PAYMENT_STATUS}</strong> <ErpSafeText>{mappingDetail.mappingPaymentStatusDisplay}</ErpSafeText>
                </div>
              )}
              <div>
                <strong>{FM_DETAIL_MODAL.LABEL_PRICE_PER_SESSION}</strong> {formatKrw(mappingDetail.pricePerSession)}
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>{FM_DETAIL_MODAL.LABEL_PACKAGE_PRICE}</strong>
                <span className="mg-v2-transaction-detail-package-price">{formatKrw(mappingDetail.packagePrice)}</span>
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>{FM_DETAIL_MODAL.LABEL_PAYMENT_AMOUNT}</strong>
                <span className={`mg-v2-transaction-detail-payment-amount ${mappingDetail.packagePrice === mappingDetail.paymentAmount ? 'mg-v2-transaction-detail-payment-amount--match' : 'mg-v2-transaction-detail-payment-amount--mismatch'}`}>
                  {formatKrw(mappingDetail.paymentAmount)}
                  {mappingDetail.packagePrice !== mappingDetail.paymentAmount && (
                    <span className="mg-v2-transaction-detail-message-mismatch">{FM_DETAIL_MODAL.PACKAGE_PRICE_MISMATCH}</span>
                  )}
                </span>
              </div>
              {mappingDetail.isConsistent !== undefined && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>{FM_DETAIL_MODAL.LABEL_CONSISTENCY}</strong>
                  <span className={`mg-v2-transaction-detail-consistent-badge ${mappingDetail.isConsistent ? 'mg-v2-transaction-detail-consistent-badge--ok' : 'mg-v2-transaction-detail-consistent-badge--error'}`}>
                    {mappingDetail.isConsistent ? FM_DETAIL_MODAL.CONSISTENCY_OK : FM_DETAIL_MODAL.CONSISTENCY_ERROR}
                  </span>
                  {!mappingDetail.isConsistent && (
                    <div className="mg-v2-transaction-detail-consistency-msg"><ErpSafeText>{mappingDetail.consistencyMessage}</ErpSafeText></div>
                  )}
                </div>
              )}
              {mappingDetail.relatedTransactions && mappingDetail.relatedTransactions.length > 0 && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>{FM_DETAIL_MODAL.LABEL_RELATED_TX}</strong>
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
                : FM_ERRORS.MAPPING_DETAIL_FALLBACK}
            </div>
          )}
        </div>
      )}

      {transaction.relatedEntityType && transaction.relatedEntityType !== 'CONSULTANT_CLIENT_MAPPING' && (
        <div className="mg-v2-transaction-detail-other-box">
          <h3 className="mg-v2-transaction-detail-other-title">
            <Link2 size={18} aria-hidden /> {FM_DETAIL_MODAL.OTHER_LINK_SECTION}
          </h3>
          <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_RELATED_TYPE}</strong> <ErpSafeText>{transaction.relatedEntityType}</ErpSafeText>
            </div>
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_RELATED_ID}</strong> #{toDisplayString(transaction.relatedEntityId)}
            </div>
          </div>
        </div>
      )}
    </UnifiedModal>
  );
};

export default FinancialManagement;
