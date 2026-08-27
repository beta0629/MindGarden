/**
 * Operator Ledger — `/erp/financial`
 * Quiet header → Summary strip → Filter+Table/Calendar → 세무사용 자료 disclosure
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import MGButton from '../common/MGButton';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import { formatKrw } from '../../utils/erpFinancialAmountStack';
import UnifiedModal from '../common/modals/UnifiedModal';
import FinancialTransactionForm from './FinancialTransactionForm';
import { ERP_API } from '../../constants/api';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea } from '../dashboard-v2/content';
import ErpPageShell from './shell/ErpPageShell';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { ErpSafeText, useErpSilentRefresh } from './common';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import {
  FM_PAGE_TITLE,
  FM_PAGE_TITLE_ID,
  FM_MAIN_ARIA_LABEL,
  FM_SESSION,
  FM_LOGIN,
  FM_PERIOD,
  FM_LEDGER_VIEW,
  FM_ERRORS,
  FM_TOAST,
  fmToastDeleteFailed,
  FM_DELETE_MODAL,
  FM_CURRENCY_SUFFIX,
  FM_DETAIL_MODAL,
  FM_TX_TYPE,
  FM_PAGINATION,
  FM_RETRY,
  getCategoryDisplayLabel
} from '../../constants/financialManagementStrings';
import {
  LedgerQuietHeader,
  LedgerSummaryStrip,
  LedgerInlineFilter,
  LedgerTable,
  LedgerCalendar,
  TaxDisclosureSection,
  MoneyRecordModal
} from './financial/ledger';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import './FinancialManagement.css';
import './financial/ledger/OperatorLedger.css';

const API_ADMIN_FINANCIAL_TRANSACTIONS = '/api/v1/admin/financial-transactions';

const FINANCIAL_MONTH_YM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const getCurrentMonthYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const isValidMonthYm = (value) =>
  typeof value === 'string' && FINANCIAL_MONTH_YM_REGEX.test(value);

const addMonthsYm = (ym, delta) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * @param {string} period
 * @returns {{ dateRange: string, monthYm: string, startDate: string, endDate: string }}
 */
const buildFiltersFromPeriod = (period) => {
  const now = new Date();
  const y = now.getFullYear();
  if (period === FM_PERIOD.LAST_MONTH) {
    return {
      dateRange: 'MONTH',
      monthYm: addMonthsYm(getCurrentMonthYm(), -1),
      startDate: '',
      endDate: ''
    };
  }
  if (period === FM_PERIOD.THIS_YEAR) {
    return {
      dateRange: 'CUSTOM',
      monthYm: getCurrentMonthYm(),
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`
    };
  }
  if (period === FM_PERIOD.CUSTOM) {
    return {
      dateRange: 'CUSTOM',
      monthYm: getCurrentMonthYm(),
      startDate: formatLocalDateYmd(now),
      endDate: formatLocalDateYmd(now)
    };
  }
  return {
    dateRange: 'MONTH',
    monthYm: getCurrentMonthYm(),
    startDate: '',
    endDate: ''
  };
};

/**
 * @param {Record<string, unknown>} transaction
 * @param {string} searchLower
 * @returns {boolean}
 */
const financialTransactionMatchesSearchText = (transaction, searchLower) => {
  if (!searchLower) {
    return true;
  }
  const vals = [
    transaction.description,
    transaction.clientName,
    transaction.consultantName,
    transaction.category,
    transaction.remarks
  ];
  return vals.some((v) => v != null && String(v).toLowerCase().includes(searchLower));
};

/**
 * ERP 운영자 장부 페이지
 */
const FinancialManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [period, setPeriod] = useState(FM_PERIOD.THIS_MONTH);
  const [mainView, setMainView] = useState(FM_LEDGER_VIEW.TABLE);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [showMoneyRecord, setShowMoneyRecord] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });

  const periodFilters = buildFiltersFromPeriod(FM_PERIOD.THIS_MONTH);
  const [filters, setFilters] = useState({
    transactionType: 'ALL',
    category: 'ALL',
    dateRange: periodFilters.dateRange,
    monthYm: periodFilters.monthYm,
    startDate: periodFilters.startDate,
    endDate: periodFilters.endDate,
    searchText: ''
  });

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, transaction: null });
  const [editModal, setEditModal] = useState({ open: false, transaction: null });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    remaining: 0
  });

  const getDateRangeForFilter = useCallback(() => {
    const now = new Date();
    const toStr = (d) => formatLocalDateYmd(d);
    switch (filters.dateRange) {
      case 'MONTH': {
        const ym = filters.monthYm && isValidMonthYm(filters.monthYm) ? filters.monthYm : getCurrentMonthYm();
        const [y, m] = ym.split('-').map(Number);
        return {
          startDate: toStr(new Date(y, m - 1, 1)),
          endDate: toStr(new Date(y, m, 0))
        };
      }
      case 'CUSTOM':
        return {
          startDate: filters.startDate || toStr(now),
          endDate: filters.endDate || toStr(now)
        };
      default:
        return { startDate: '', endDate: '' };
    }
  }, [filters.dateRange, filters.monthYm, filters.startDate, filters.endDate]);

  const calculateSummary = useCallback((transactionData) => {
    const active = (transactionData || []).filter((tx) => {
      const status = String(tx.status || '').toUpperCase();
      return status !== 'REJECTED' && status !== 'CANCELLED';
    });
    const totalIncome = active
      .filter((t) => String(t.transactionType).toUpperCase() === 'INCOME')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalExpense = active
      .filter((t) => String(t.transactionType).toUpperCase() === 'EXPENSE')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    setSummary({
      totalIncome,
      totalExpense,
      remaining: totalIncome - totalExpense
    });
  }, []);

  const loadTransactions = useCallback(async(txOptions = {}) => {
    const pageForRequest = typeof txOptions.page === 'number' ? txOptions.page : pagination.currentPage;
    const { startDate, endDate } = getDateRangeForFilter();
    const params = {
      page: pageForRequest,
      size: pagination.size
    };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.transactionType !== 'ALL') params.transactionType = filters.transactionType;
    if (filters.category !== 'ALL') params.category = filters.category;

    const envelope = await StandardizedApi.get(
      API_ADMIN_FINANCIAL_TRANSACTIONS,
      params,
      { unwrapApiEnvelope: false }
    );

    if (!envelope || typeof envelope !== 'object') {
      setError(FM_ERRORS.TX_LIST);
      return;
    }

    if (envelope.success === false) {
      const errorMessage = envelope?.message || FM_ERRORS.TX_LIST;
      setError(errorMessage);
      if (envelope?.redirectToLogin) {
        redirectToLoginPageOnce();
      }
      return;
    }

    const rows = Array.isArray(envelope.data) ? envelope.data : [];
    let filteredTransactions = rows;
    if (filters.searchText) {
      const searchLower = filters.searchText.trim().toLowerCase();
      if (searchLower) {
        filteredTransactions = filteredTransactions.filter((transaction) =>
          financialTransactionMatchesSearchText(transaction, searchLower)
        );
      }
    }

    setTransactions(filteredTransactions);
    setPagination((prev) => ({
      ...prev,
      currentPage: typeof envelope.currentPage === 'number' ? envelope.currentPage : pageForRequest,
      totalPages: typeof envelope.totalPages === 'number' ? envelope.totalPages : prev.totalPages,
      totalElements: typeof envelope.totalCount === 'number' ? envelope.totalCount : prev.totalElements,
      size: typeof envelope.size === 'number' ? envelope.size : prev.size
    }));
    setError(null);
    calculateSummary(filteredTransactions);
  }, [
    pagination.currentPage,
    pagination.size,
    filters.transactionType,
    filters.category,
    filters.searchText,
    getDateRangeForFilter,
    calculateSummary
  ]);

  const loadData = useCallback(async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      await loadTransactions(
        typeof options.transactionPage === 'number' ? { page: options.transactionPage } : {}
      );
    } catch (err) {
      if (err?.response?.status === 401 || err?.status === 401) {
        redirectToLoginPageOnce();
        return;
      }
      setError(err?.response?.data?.message || err?.message || FM_ERRORS.TX_LIST_NETWORK);
    } finally {
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [loadTransactions, setSilentListRefreshing]);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        transactionType: filters.transactionType,
        category: filters.category,
        dateRange: filters.dateRange,
        monthYm: filters.monthYm,
        startDate: filters.startDate,
        endDate: filters.endDate,
        searchText: filters.searchText
      }),
    [filters]
  );

  useEffect(() => {
    if (sessionLoading || !isLoggedIn || !user?.id) {
      return undefined;
    }
    let cancelled = false;
    const run = async() => {
      setLoading(true);
      setError(null);
      try {
        const pageForRequest = pagination.currentPage;
        const now = new Date();
        const toStr = (d) => formatLocalDateYmd(d);
        let startDate = '';
        let endDate = '';
        if (filters.dateRange === 'MONTH') {
          const ym = filters.monthYm && isValidMonthYm(filters.monthYm) ? filters.monthYm : getCurrentMonthYm();
          const [y, m] = ym.split('-').map(Number);
          startDate = toStr(new Date(y, m - 1, 1));
          endDate = toStr(new Date(y, m, 0));
        } else if (filters.dateRange === 'CUSTOM') {
          startDate = filters.startDate || toStr(now);
          endDate = filters.endDate || toStr(now);
        }
        const params = {
          page: pageForRequest,
          size: pagination.size
        };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (filters.transactionType !== 'ALL') params.transactionType = filters.transactionType;
        if (filters.category !== 'ALL') params.category = filters.category;

        const envelope = await StandardizedApi.get(
          API_ADMIN_FINANCIAL_TRANSACTIONS,
          params,
          { unwrapApiEnvelope: false }
        );
        if (cancelled) {
          return;
        }
        if (!envelope || typeof envelope !== 'object') {
          setError(FM_ERRORS.TX_LIST);
          return;
        }
        if (envelope.success === false) {
          setError(envelope?.message || FM_ERRORS.TX_LIST);
          if (envelope?.redirectToLogin) {
            redirectToLoginPageOnce();
          }
          return;
        }
        const rows = Array.isArray(envelope.data) ? envelope.data : [];
        let filteredTransactions = rows;
        if (filters.searchText) {
          const searchLower = filters.searchText.trim().toLowerCase();
          if (searchLower) {
            filteredTransactions = filteredTransactions.filter((transaction) =>
              financialTransactionMatchesSearchText(transaction, searchLower)
            );
          }
        }
        setTransactions(filteredTransactions);
        setPagination((prev) => {
          const nextPage = typeof envelope.currentPage === 'number' ? envelope.currentPage : pageForRequest;
          const nextPages = typeof envelope.totalPages === 'number' ? envelope.totalPages : prev.totalPages;
          const nextTotal = typeof envelope.totalCount === 'number' ? envelope.totalCount : prev.totalElements;
          const nextSize = typeof envelope.size === 'number' ? envelope.size : prev.size;
          if (
            prev.currentPage === nextPage
            && prev.totalPages === nextPages
            && prev.totalElements === nextTotal
            && prev.size === nextSize
          ) {
            return prev;
          }
          return {
            ...prev,
            currentPage: nextPage,
            totalPages: nextPages,
            totalElements: nextTotal,
            size: nextSize
          };
        });
        calculateSummary(filteredTransactions);
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err?.response?.status === 401 || err?.status === 401) {
          redirectToLoginPageOnce();
          return;
        }
        setError(err?.response?.data?.message || err?.message || FM_ERRORS.TX_LIST_NETWORK);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtersKey encapsulates filter fields
  }, [
    sessionLoading,
    isLoggedIn,
    user?.id,
    pagination.currentPage,
    pagination.size,
    filtersKey,
    calculateSummary
  ]);

  /** MONTH → sync ?month= */
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

  const handlePeriodChange = (nextPeriod) => {
    setPeriod(nextPeriod);
    const next = buildFiltersFromPeriod(nextPeriod);
    setFilters((prev) => ({
      ...prev,
      dateRange: next.dateRange,
      monthYm: next.monthYm,
      startDate: next.startDate || prev.startDate,
      endDate: next.endDate || prev.endDate
    }));
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  const handleCustomDateChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, dateRange: 'CUSTOM' }));
    setPeriod(FM_PERIOD.CUSTOM);
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  const handleFiltersPatch = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  const handlePageChange = (page) => {
    if (page < 0 || page >= pagination.totalPages) {
      return;
    }
    setPagination((prev) => ({ ...prev, currentPage: page }));
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
      } else {
        notificationManager.success(FM_TOAST.DELETE_SUCCESS);
        setDeleteModal({ isOpen: false, transaction: null });
        setCalendarRefreshKey((n) => n + 1);
        loadData({ silent: true });
      }
    } catch (err) {
      notificationManager.error(FM_TOAST.DELETE_GENERIC);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const hasSearch = Boolean(filters.searchText && filters.searchText.trim());

  const refreshLedgerViews = useCallback(() => {
    setCalendarRefreshKey((n) => n + 1);
    loadData({ silent: true });
  }, [loadData]);

  const forbiddenEqualTabsVisible = useMemo(() => {
    // Guard for tests: default view must not surface accountant equal tabs
    return false;
  }, []);

  if (sessionLoading) {
    return (
      <AdminCommonLayout>
        <ContentArea className="erp-system" ariaLabel={FM_PAGE_TITLE}>
          <UnifiedLoading type="page" text={FM_SESSION.LOADING} />
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout>
        <ContentArea className="erp-system" ariaLabel={FM_PAGE_TITLE}>
          <div className="erp-error">
            <h3>{FM_LOGIN.HEADING}</h3>
            <p>{FM_LOGIN.BODY}</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout>
      <ContentArea className="erp-system" ariaLabel={FM_MAIN_ARIA_LABEL}>
        <ErpPageShell mainAriaLabel={FM_MAIN_ARIA_LABEL}>
          <div className="operator-ledger" data-testid="operator-ledger">
            <LedgerQuietHeader
              period={period}
              onPeriodChange={handlePeriodChange}
              startDate={filters.startDate}
              endDate={filters.endDate}
              onCustomDateChange={handleCustomDateChange}
              onRecordClick={() => setShowMoneyRecord(true)}
            />

            <LedgerSummaryStrip
              loading={loading && !silentListRefreshing}
              totalIncome={summary.totalIncome}
              totalExpense={summary.totalExpense}
              remaining={summary.remaining}
            />

            <LedgerInlineFilter
              filters={filters}
              onFiltersChange={handleFiltersPatch}
              viewMode={mainView}
              onViewModeChange={setMainView}
            />

            {error ? (
              <div className="erp-error" role="alert">
                <SafeErrorDisplay error={error} variant="inline" />
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => loadData({ silent: true })}
                  aria-label={FM_RETRY.ARIA_LABEL}
                  preventDoubleClick={false}
                >
                  {FM_RETRY.LABEL}
                </MGButton>
              </div>
            ) : null}

            {/* Explicit: no 차변/대변/대차대조표 equal tabs in default view */}
            {!forbiddenEqualTabsVisible && mainView === FM_LEDGER_VIEW.TABLE && (
              <>
                <div className="operator-ledger-stage" data-testid="operator-ledger-stage">
                  {loading && !silentListRefreshing ? (
                    <UnifiedLoading type="inline" text={FM_SESSION.LOADING} />
                  ) : (
                    <LedgerTable
                      transactions={transactions}
                      loading={loading}
                      hasSearch={hasSearch}
                      onRecordClick={() => setShowMoneyRecord(true)}
                      onView={(tx) => {
                        setSelectedTransaction(tx);
                        setShowDetailModal(true);
                      }}
                      onEdit={(tx) => setEditModal({ open: true, transaction: tx })}
                      onDelete={(tx) => setDeleteModal({ isOpen: true, transaction: tx })}
                    />
                  )}
                </div>
                {pagination.totalPages > 1 && (
                  <nav className="operator-ledger-pagination" aria-label={FM_PAGINATION.NEXT}>
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
                      <li className={`page-item ${pagination.currentPage >= pagination.totalPages - 1 ? 'disabled' : ''}`}>
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
                          disabled={pagination.currentPage >= pagination.totalPages - 1}
                          preventDoubleClick={false}
                        >
                          {FM_PAGINATION.NEXT}
                        </MGButton>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            )}

            {mainView === FM_LEDGER_VIEW.CALENDAR && (
              <div className="operator-ledger-stage" data-testid="operator-ledger-stage">
                <LedgerCalendar
                  monthYm={filters.monthYm}
                  transactionType={filters.transactionType}
                  category={filters.category}
                  searchText={filters.searchText}
                  refreshKey={calendarRefreshKey}
                  onView={(tx) => {
                    setSelectedTransaction(tx);
                    setShowDetailModal(true);
                  }}
                  onEdit={(tx) => setEditModal({ open: true, transaction: tx })}
                  onDelete={(tx) => setDeleteModal({ isOpen: true, transaction: tx })}
                />
              </div>
            )}

            <TaxDisclosureSection />
          </div>
        </ErpPageShell>
      </ContentArea>

      <MoneyRecordModal
        isOpen={showMoneyRecord}
        onClose={() => setShowMoneyRecord(false)}
        onSuccess={refreshLedgerViews}
      />

      {showDetailModal && selectedTransaction && (
        <UnifiedModal
          isOpen
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
          title={`${FM_DETAIL_MODAL.TITLE_PREFIX} #${toDisplayString(selectedTransaction.id)}`}
          size="medium"
          showCloseButton
          className="mg-v2-ad-b0kla"
          actions={(
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => {
                setShowDetailModal(false);
                setSelectedTransaction(null);
              }}
              preventDoubleClick={false}
            >
              {FM_DETAIL_MODAL.CLOSE}
            </MGButton>
          )}
        >
          <div className="mg-v2-transaction-detail-form-grid mg-v2-form-grid">
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_TX_TYPE}</strong>{' '}
              {String(selectedTransaction.transactionType).toUpperCase() === 'INCOME'
                ? FM_TX_TYPE.INCOME
                : FM_TX_TYPE.EXPENSE}
            </div>
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_CATEGORY}</strong>{' '}
              <ErpSafeText fallback="-">
                {getCategoryDisplayLabel(selectedTransaction.category)}
              </ErpSafeText>
            </div>
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_TX_DATE}</strong>{' '}
              {String(selectedTransaction.transactionDate || '').slice(0, 10)}
            </div>
            <div>
              <strong>{FM_DETAIL_MODAL.LABEL_DESCRIPTION}</strong>{' '}
              <ErpSafeText fallback="-">{selectedTransaction.description}</ErpSafeText>
            </div>
            <div>
              <strong>{FM_DELETE_MODAL.FIELD_AMOUNT}</strong> {formatKrw(selectedTransaction.amount)}
            </div>
          </div>
        </UnifiedModal>
      )}

      {deleteModal.isOpen && deleteModal.transaction && (
        <UnifiedModal
          isOpen
          onClose={() => setDeleteModal({ isOpen: false, transaction: null })}
          title={FM_DELETE_MODAL.TITLE}
          size="small"
          showCloseButton
          className="mg-v2-ad-b0kla"
          actions={(
            <>
              <MGButton
                type="button"
                variant="secondary"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setDeleteModal({ isOpen: false, transaction: null })}
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
          )}
        >
          <p>{FM_DELETE_MODAL.WARNING}</p>
          <ul className="mg-v2-text-list">
            <li>
              {FM_DELETE_MODAL.FIELD_TX_ID} #{toDisplayString(deleteModal.transaction.id)}
            </li>
            <li>
              {FM_DELETE_MODAL.FIELD_AMOUNT}{' '}
              {`${toSafeNumber(deleteModal.transaction.amount).toLocaleString()}${FM_CURRENCY_SUFFIX}`}
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
            setCalendarRefreshKey((n) => n + 1);
            loadData({ silent: true });
            setEditModal({ open: false, transaction: null });
          }}
        />
      )}
    </AdminCommonLayout>
  );
};

export default FinancialManagement;
