import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API, COMMON_CODE_API } from '../../constants/api';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import ErpPageShell from './shell/ErpPageShell';
import UnifiedModal from '../common/modals/UnifiedModal.js';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { ErpFilterToolbar, useErpSilentRefresh } from './common';
import { PiggyBank, List, TrendingUp, Wallet, Percent, DollarSign } from 'lucide-react';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import { useTranslation } from 'react-i18next';
import { useSavedViewPreference } from '../../hooks/useSavedViewPreference';
import SavedViewControls from '../admin/ClientComprehensiveManagement/molecules/SavedViewControls';
import {
  BM_SAVED_VIEW_PAGE_ID,
  BM_SAVED_VIEW_PERSIST_DEBOUNCE_MS,
  BM_DEFAULT_ACTIVE_TAB,
  BM_DEFAULT_FILTER_CATEGORY,
  BM_DEFAULT_FILTER_STATUS,
  buildBudgetManagementDefaultSavedView
} from '../../constants/budgetManagementSavedViewConstants';

const INITIAL_NEW_BUDGET = {
  name: '',
  category: '',
  plannedAmount: '',
  description: '',
  startDate: '',
  endDate: '',
  department: ''
};

const DEFAULT_BUDGET_CATEGORIES = [
  { id: 607, codeValue: 'OPERATING', codeLabel: '운영비', codeDescription: '일반적인 운영 비용', sortOrder: 1 },
  { id: 608, codeValue: 'MARKETING', codeLabel: '마케팅', codeDescription: '마케팅 및 홍보 비용', sortOrder: 2 },
  { id: 609, codeValue: 'TRAINING', codeLabel: '교육훈련', codeDescription: '직원 교육 및 훈련 비용', sortOrder: 3 },
  { id: 610, codeValue: 'EQUIPMENT', codeLabel: '장비', codeDescription: '장비 구매 및 유지보수 비용', sortOrder: 4 },
  { id: 611, codeValue: 'TRAVEL', codeLabel: '출장비', codeDescription: '출장 및 교통비', sortOrder: 5 },
  { id: 612, codeValue: 'UTILITIES', codeLabel: '공과금', codeDescription: '전기, 가스, 수도 등 공과금', sortOrder: 6 },
  { id: 613, codeValue: 'RENT', codeLabel: '임대료', codeDescription: '사무실 및 시설 임대료', sortOrder: 7 },
  { id: 614, codeValue: 'OTHER', codeLabel: '기타', codeDescription: '기타 비용', sortOrder: 8 }
];

const BUDGET_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'EXHAUSTED', label: '소진' },
  { value: 'EXPIRED', label: '만료' }
];

const BUDGET_FILTER_ALL_VALUE = 'all';

const BM_DEFAULT_SAVED_VIEW = buildBudgetManagementDefaultSavedView();

/**
 * ERP 예산 관리 페이지
 * 예산 계획 및 관리
 */
const BudgetManagement = () => {
  const { t } = useTranslation(['erp', 'common']);
  const [confirm, ConfirmModal] = useConfirm();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState(BM_DEFAULT_ACTIVE_TAB);
  const [filterCategory, setFilterCategory] = useState(BM_DEFAULT_FILTER_CATEGORY);
  const [filterStatus, setFilterStatus] = useState(BM_DEFAULT_FILTER_STATUS);
  const [budgets, setBudgets] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [error, setError] = useState(null);
  const [budgetInitialFetchDone, setBudgetInitialFetchDone] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [hasDataError, setHasDataError] = useState(false);

  const [newBudget, setNewBudget] = useState({ ...INITIAL_NEW_BUDGET });

  const canManageBudget = useMemo(
    () => PermissionChecks.canManageBudget(userPermissions, user),
    [userPermissions, user]
  );

  const {
    savedView,
    setSavedView,
    views,
    activeViewId,
    saveNamedView,
    loadNamedView,
    resetToDefaultView,
    deleteNamedView
  } = useSavedViewPreference({
    pageId: BM_SAVED_VIEW_PAGE_ID,
    defaultView: BM_DEFAULT_SAVED_VIEW,
    namedViews: true
  });
  const savedViewFiltersRestoredRef = useRef(false);
  const savedViewPersistReadyRef = useRef(false);
  const savedViewPersistTimerRef = useRef(null);
  const savedViewMetaRef = useRef({
    sort: BM_DEFAULT_SAVED_VIEW.sort,
    density: BM_DEFAULT_SAVED_VIEW.density
  });

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const matchesCategory =
        filterCategory === BUDGET_FILTER_ALL_VALUE
        || budget.category === filterCategory;
      const matchesStatus =
        filterStatus === BUDGET_FILTER_ALL_VALUE
        || budget.status === filterStatus;
      return matchesCategory && matchesStatus;
    });
  }, [budgets, filterCategory, filterStatus]);

  const buildCurrentSavedViewPayload = useCallback(() => ({
    viewMode: BM_DEFAULT_SAVED_VIEW.viewMode,
    filters: {
      activeTab,
      category: filterCategory,
      status: filterStatus
    },
    sort: savedViewMetaRef.current.sort,
    density: savedViewMetaRef.current.density
  }), [activeTab, filterCategory, filterStatus]);

  const applySavedViewPayload = useCallback((payload) => {
    const storedFilters = payload?.filters ?? {};
    if (storedFilters.activeTab != null) {
      setActiveTab(storedFilters.activeTab);
    }
    if (storedFilters.category != null) {
      setFilterCategory(storedFilters.category);
    }
    if (storedFilters.status != null) {
      setFilterStatus(storedFilters.status);
    }
    savedViewMetaRef.current = {
      sort: payload?.sort ?? BM_DEFAULT_SAVED_VIEW.sort,
      density: payload?.density ?? BM_DEFAULT_SAVED_VIEW.density
    };
  }, []);

  const handleSelectSavedView = useCallback((viewId) => {
    const payload = loadNamedView(viewId);
    applySavedViewPayload(payload);
  }, [loadNamedView, applySavedViewPayload]);

  const handleResetSavedView = useCallback(() => {
    const payload = resetToDefaultView();
    applySavedViewPayload(payload);
  }, [resetToDefaultView, applySavedViewPayload]);

  const handleSaveNamedView = useCallback((label) => {
    saveNamedView(label, buildCurrentSavedViewPayload());
  }, [saveNamedView, buildCurrentSavedViewPayload]);

  const handleDeleteSavedView = useCallback((viewId) => {
    const fallbackPayload = deleteNamedView(viewId);
    if (fallbackPayload) {
      applySavedViewPayload(fallbackPayload);
    }
  }, [deleteNamedView, applySavedViewPayload]);

  useEffect(() => {
    if (savedViewFiltersRestoredRef.current) {
      return;
    }
    savedViewFiltersRestoredRef.current = true;
    savedViewMetaRef.current = {
      sort: savedView.sort ?? BM_DEFAULT_SAVED_VIEW.sort,
      density: savedView.density ?? BM_DEFAULT_SAVED_VIEW.density
    };
    applySavedViewPayload(savedView);
    savedViewPersistReadyRef.current = true;
  }, [savedView, applySavedViewPayload]);

  useEffect(() => {
    if (!savedViewPersistReadyRef.current) {
      return undefined;
    }

    if (savedViewPersistTimerRef.current) {
      clearTimeout(savedViewPersistTimerRef.current);
    }

    savedViewPersistTimerRef.current = setTimeout(() => {
      savedViewPersistTimerRef.current = null;
      setSavedView(buildCurrentSavedViewPayload());
    }, BM_SAVED_VIEW_PERSIST_DEBOUNCE_MS);

    return () => {
      if (savedViewPersistTimerRef.current) {
        clearTimeout(savedViewPersistTimerRef.current);
        savedViewPersistTimerRef.current = null;
      }
    };
  }, [activeTab, filterCategory, filterStatus, setSavedView, buildCurrentSavedViewPayload]);

  const resetNewBudgetForm = useCallback(() => {
    setNewBudget({ ...INITIAL_NEW_BUDGET });
  }, []);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      fetchUserPermissions(setUserPermissions);
    } else if (!isLoggedIn) {
      setUserPermissions([]);
    }
  }, [sessionLoading, isLoggedIn, user?.id]);

  useEffect(() => {
    if (!sessionLoading) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 탭·세션 변경 시에만 목록 재조회
  }, [sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setHasDataError(false);

      switch (activeTab) {
        case 'budgets':
          await Promise.all([loadBudgets(), loadBudgetCategories()]);
          break;
        case 'categories':
          await loadBudgetCategories();
          break;
        case 'reports':
          await loadBudgetReports();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setHasDataError(true);
    } finally {
      setBudgetInitialFetchDone(true);
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadBudgets = async() => {
    try {
      if (!isLoggedIn || !user?.id) {
        setBudgets([]);
        return;
      }

      const response = await StandardizedApi.get(ERP_API.BUDGETS);
      if (response?.success) {
        setBudgets(response.data || []);
      } else {
        setBudgets([]);
      }
    } catch (err) {
      console.error('예산 로드 실패:', err);
      setBudgets([]);
    }
  };

  const loadBudgetCategories = async() => {
    try {
      if (!isLoggedIn || !user?.id) {
        setBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
        return;
      }

      try {
        const response = await StandardizedApi.get(COMMON_CODE_API.BASE, { codeGroup: 'BUDGET_CATEGORY' });
        if (response?.success && response.data?.length > 0) {
          setBudgetCategories(response.data);
        } else {
          setBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
        }
      } catch (apiError) {
        console.error('예산 카테고리 API 실패:', apiError);
        setBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
      }
    } catch (err) {
      console.error('예산 카테고리 로드 전체 실패:', err);
      setBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
    }
  };

  const loadBudgetReports = async() => {
    try {
      // 보고서 탭: 추후 전용 API 연동
    } catch (err) {
      console.error('예산 보고서 로드 실패:', err);
      setError('예산 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCreateBudget = async(e) => {
    e?.preventDefault?.();
    try {
      setLoading(true);
      const response = await StandardizedApi.post(ERP_API.BUDGETS, newBudget);
      if (response?.success) {
        setShowCreateModal(false);
        resetNewBudgetForm();
        await loadBudgets();
      } else {
        const msg = response?.message || '예산 생성에 실패했습니다.';
        setError(msg);
        notificationManager.error(msg);
      }
    } catch (err) {
      console.error('예산 생성 실패:', err);
      const msg = toErrorMessage(err, '예산 생성 중 오류가 발생했습니다.');
      setError(msg);
      notificationManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async(e) => {
    e?.preventDefault?.();
    if (!editingBudget?.id) {
      return;
    }
    try {
      setLoading(true);
      const response = await StandardizedApi.put(
        ERP_API.BUDGET_BY_ID(editingBudget.id),
        editingBudget
      );
      if (response?.success) {
        setEditingBudget(null);
        await loadBudgets();
      } else {
        const msg = response?.message || '예산 수정에 실패했습니다.';
        setError(msg);
        notificationManager.error(msg);
      }
    } catch (err) {
      console.error('예산 수정 실패:', err);
      const msg = toErrorMessage(err, '예산 수정 중 오류가 발생했습니다.');
      setError(msg);
      notificationManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async(budgetId) => {
    const confirmed = await confirm({
      messageKey: 'erp:budget.confirm.delete',
      variant: 'danger'
    });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await StandardizedApi.delete(ERP_API.BUDGET_BY_ID(budgetId));
      if (response?.success) {
        await loadBudgets();
      } else {
        const msg = response?.message || '예산 삭제에 실패했습니다.';
        setError(msg);
        notificationManager.error(msg);
      }
    } catch (err) {
      console.error('예산 삭제 실패:', err);
      const msg = toErrorMessage(err, '예산 삭제 중 오류가 발생했습니다.');
      setError(msg);
      notificationManager.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      case 'INACTIVE':
        return 'secondary';
      case 'EXHAUSTED':
      case 'EXPIRED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const openEditModal = (budget) => {
    setEditingBudget({ ...budget });
  };

  const updateEditingField = (field, value) => {
    setEditingBudget((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout title={t('erp:BudgetManagement.t_caa5739a')}>
        <ContentArea className="erp-system mg-v2-content-area mg-v2-ad-b0kla">
          <div className="erp-session-inline-load">
            <ContentHeader
              title={t('erp:BudgetManagement.t_caa5739a')}
              subtitle="세션 정보를 확인하는 중입니다."
            />
            <UnifiedLoading type="inline" text={t('erp:BudgetManagement.t_85173dd2')} />
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title={t('erp:BudgetManagement.t_caa5739a')}>
        <div className="erp-system">
          <div className="erp-container">
            <div className="erp-login-required">
              <div className="erp-login-card">
                <div className="erp-login-header">
                  <div className="erp-logo">
                    <i className="bi bi-flower1" />
                    <span>Core Solution</span>
                  </div>
                  <div className="erp-login-actions">
                    <MGButton
                      variant="outline"
                      size="medium"
                      type="button"
                      className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      {t('erp:BudgetManagement.t_b0b6bb07')}
                    </MGButton>
                    <MGButton
                      variant="primary"
                      size="medium"
                      type="button"
                      className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                      {t('erp:BudgetManagement.t_e225a6fd')}
                    </MGButton>
                  </div>
                </div>
                <div className="erp-login-content">
                  <h3>{t('erp:BudgetManagement.t_5271ee34')}</h3>
                  <p>{t('erp:BudgetManagement.t_4d4c741f')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  const isInitialDataLoad =
    loading && !budgetInitialFetchDone && !(error && hasDataError);

  return (
    <AdminCommonLayout title={t('erp:BudgetManagement.t_caa5739a')}>
      <ContentArea className="erp-system mg-v2-content-area mg-v2-ad-b0kla">
        <ErpPageShell
          headerSlot={
            <ContentHeader
              title={t('erp:BudgetManagement.t_caa5739a')}
              subtitle="예산 계획 및 관리를 할 수 있습니다."
            />
          }
          tabsSlot={
            <div className="erp-tabs">
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'budgets' ? 'active' : ''}`}
                onClick={() => setActiveTab('budgets')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {t('erp:BudgetManagement.t_0631bf34')}
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {t('erp:BudgetManagement.t_31125b29')}
              </MGButton>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} erp-tab ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                preventDoubleClick={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {t('erp:BudgetManagement.t_c9883f78')}
              </MGButton>
            </div>
          }
          mainAriaLabel="예산 관리 목록 및 본문"
        >
          <div className="erp-container">
            <div className="mg-w-full mg-mb-md">
              <SavedViewControls
                views={views}
                activeViewId={activeViewId}
                onSelectView={handleSelectSavedView}
                onSaveView={handleSaveNamedView}
                onResetToDefault={handleResetSavedView}
                onDeleteView={handleDeleteSavedView}
              />
              <ErpFilterToolbar
                ariaLabel="예산 목록 도구"
                primaryRow={
                  activeTab === 'budgets' ? (
                    <div className="mg-v2-filter-grid mg-v2-filter-grid--row1">
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label" htmlFor="budget-filter-category">
                          {t('erp:BudgetManagement.t_31125b29')}
                        </label>
                        <select
                          id="budget-filter-category"
                          className="mg-v2-form-select"
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                        >
                          <option value={BUDGET_FILTER_ALL_VALUE}>{t('common.labels.all')}</option>
                          {budgetCategories.map((category) => (
                            <option key={category.id} value={category.codeValue}>
                              {toDisplayString(category.codeLabel)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label" htmlFor="budget-filter-status">
                          {t('common.labels.status')}
                        </label>
                        <select
                          id="budget-filter-status"
                          className="mg-v2-form-select"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value={BUDGET_FILTER_ALL_VALUE}>{t('common.labels.all')}</option>
                          {BUDGET_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null
                }
                secondaryRow={
                  <div className="budget-management__toolbar-actions">
                    <MGButton
                      variant="secondary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: silentListRefreshing })}
                      onClick={() => loadData({ silent: true })}
                      loading={silentListRefreshing}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      disabled={loading}
                      aria-label={t('erp:BudgetManagement.t_bf198903')}
                    >
                      {t('erp:BudgetManagement.t_bf198903')}
                    </MGButton>
                  </div>
                }
              />
            </div>
            <div className="erp-content" aria-busy={loading || silentListRefreshing}>
            {loading && (
              <div
                className={isInitialDataLoad ? 'erp-initial-fetch-inline' : 'budget-management-loading'}
                role={isInitialDataLoad ? 'status' : undefined}
                aria-live={isInitialDataLoad ? 'polite' : undefined}
              >
                <UnifiedLoading
                  type="inline"
                  text={isInitialDataLoad ? '데이터를 불러오는 중...' : '로딩 중...'}
                />
              </div>
            )}

            {error && hasDataError && (
              <div className="erp-error">
                <SafeErrorDisplay error={error} variant="banner" iconSize={18} />
                <MGButton
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: silentListRefreshing })}
                  onClick={() => loadData({ silent: true })}
                  loading={silentListRefreshing}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={loading}
                  aria-label={t('common.labels.retry')}
                >
                  {t('common.labels.retry')}
                </MGButton>
              </div>
            )}

            {budgetInitialFetchDone && !loading && !(error && hasDataError) && (
              <>
                {activeTab === 'budgets' && (
                  <div className="erp-section">
                    <div className="erp-stats-grid mb-4 mg-v2-erp-dashboard-kpi-grid">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_b8a443b3')}</h3>
                          <PiggyBank size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--primary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--primary">
                            {formatCurrency(filteredBudgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_f41a7f05')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_8dacd326')}</h3>
                          <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--warning">
                            {formatCurrency(filteredBudgets.reduce((sum, b) => sum + (b.usedBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_d1af9444')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_cc5d8b16')}</h3>
                          <Wallet size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">
                            {formatCurrency(filteredBudgets.reduce((sum, b) => sum + (b.remainingBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_b025a34c')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_76a9ae4e')}</h3>
                          <List size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--info" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--info">
                            {toDisplayString(filteredBudgets.length)}개
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_6cd25c68')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="erp-section-header">
                      <div className="erp-section-title">
                        <h2>
                          <i className="bi bi-list-ul" />
                          {t('erp:BudgetManagement.t_0631bf34')}
                        </h2>
                        <p>{t('erp:BudgetManagement.t_344cfb55')}</p>
                      </div>
                      {canManageBudget && (
                        <MGButton
                          variant="primary"
                          size="medium"
                          type="button"
                          className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} erp-btn-primary`}
                          onClick={() => setShowCreateModal(true)}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        >
                          {t('erp:BudgetManagement.t_68d316e7')}
                        </MGButton>
                      )}
                    </div>

                    <div className="erp-budget-list">
                      {filteredBudgets.length > 0 ? (
                        <div className="erp-budget-grid">
                          {filteredBudgets.map((budget) => {
                            const usagePercentage =
                              budget.totalBudget > 0
                                ? ((budget.usedBudget || 0) / budget.totalBudget) * 100
                                : 0;
                            const isOverBudget = (budget.usedBudget || 0) > budget.totalBudget;

                            return (
                              <div key={budget.id} className="mg-v2-ad-b0kla__card erp-budget-card">
                                <div className="erp-budget-header">
                                  <div className="erp-budget-title">
                                    <h3>{toDisplayString(budget.name)}</h3>
                                    <span className={`erp-budget-status ${getStatusColor(budget.status)}`}>
                                      {budget.status === 'ACTIVE' ? '활성' : toDisplayString(budget.status)}
                                    </span>
                                  </div>
                                  {canManageBudget && (
                                    <div className="erp-budget-actions">
                                      <MGButton
                                        variant="outline"
                                        size="small"
                                        type="button"
                                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                                        onClick={() => openEditModal(budget)}
                                        title={t('common.actions.edit')}
                                        aria-label={t('erp:BudgetManagement.t_82fa5b68')}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                      >
                                        {t('common.actions.edit')}
                                      </MGButton>
                                      <MGButton
                                        variant="danger"
                                        size="small"
                                        type="button"
                                        className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                                        onClick={() => handleDeleteBudget(budget.id)}
                                        title={t('common.actions.delete')}
                                        aria-label={t('erp:BudgetManagement.t_112efb89')}
                                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                      >
                                        {t('common.actions.delete')}
                                      </MGButton>
                                    </div>
                                  )}
                                </div>

                                <div className="erp-budget-body">
                                  <div className="erp-budget-category">
                                    <i className="bi bi-tag" />
                                    {toDisplayString(budget.category)}
                                  </div>

                                  {budget.description && (
                                    <p className="erp-budget-description">{toDisplayString(budget.description)}</p>
                                  )}

                                  <div className="erp-budget-amounts">
                                    <div className="erp-budget-amount">
                                      <span className="erp-amount-label">{t('erp:BudgetManagement.t_b8a443b3')}</span>
                                      <span className="erp-amount-value">{formatCurrency(budget.totalBudget)}</span>
                                    </div>
                                    <div className="erp-budget-amount">
                                      <span className="erp-amount-label">{t('erp:BudgetManagement.t_8dacd326')}</span>
                                      <span className="erp-amount-value">{formatCurrency(budget.usedBudget || 0)}</span>
                                    </div>
                                    <div className="erp-budget-amount">
                                      <span className="erp-amount-label">{t('erp:BudgetManagement.t_cc5d8b16')}</span>
                                      <span
                                        className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}
                                      >
                                        {formatCurrency(budget.remainingBudget || 0)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="erp-budget-progress">
                                    <div className="erp-progress-header">
                                      <span>{t('erp:BudgetManagement.t_897659ea')}</span>
                                      <span className={`fw-bold ${isOverBudget ? 'text-danger' : 'text-primary'}`}>
                                        {usagePercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="erp-progress-bar">
                                      <div
                                        className={`erp-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                        data-width={Math.min(usagePercentage, 100)}
                                       />
                                    </div>
                                  </div>

                                  <div className="erp-budget-period">
                                    <i className="bi bi-calendar" />
                                    {toSafeNumber(budget.year)}년 {toSafeNumber(budget.month)}월
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="erp-empty-state">
                          <div className="erp-empty-icon">
                            <PiggyBank size={24} aria-hidden />
                          </div>
                          <h3>{t('erp:BudgetManagement.t_269c245f')}</h3>
                          <p>{t('erp:BudgetManagement.t_6bed278b')}</p>
                          {canManageBudget && (
                            <MGButton
                              variant="primary"
                              size="medium"
                              type="button"
                              className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                              onClick={() => setShowCreateModal(true)}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                              {t('erp:BudgetManagement.t_c58ced33')}
                            </MGButton>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="erp-section">
                    <div className="erp-section-header">
                      <div className="erp-section-title">
                        <h2>
                          <i className="bi bi-tags" />
                          {t('erp:BudgetManagement.t_8c78d195')}
                        </h2>
                        <p>{t('erp:BudgetManagement.t_9a81db87')}</p>
                      </div>
                    </div>

                    {budgetCategories.length > 0 ? (
                      <div className="erp-grid">
                        {budgetCategories.map((category) => (
                          <div key={category.id} className="mg-v2-ad-b0kla__card erp-card">
                            <div className="erp-card-header">
                              <h3>
                                <SafeText>{category.codeLabel}</SafeText>
                              </h3>
                              <span className="erp-status success">{t('common.labels.active')}</span>
                            </div>
                            <div className="erp-card-body">
                              <p className="erp-description">
                                <SafeText>{category.codeDescription}</SafeText>
                              </p>
                              <div className="erp-details">
                                <div className="erp-detail">
                                  <span className="erp-label">{t('erp:BudgetManagement.t_3c6d4b7d')}</span>
                                  <span className="erp-value">
                                    <SafeText>{category.codeValue}</SafeText>
                                  </span>
                                </div>
                                <div className="erp-detail">
                                  <span className="erp-label">{t('erp:BudgetManagement.t_d98008e6')}</span>
                                  <span className="erp-value">
                                    <SafeText>{category.sortOrder}</SafeText>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="erp-empty-state">
                        <div className="erp-empty-icon">
                          <i className="bi bi-tags" />
                        </div>
                        <h3>{t('erp:BudgetManagement.t_3053c77f')}</h3>
                        <p>{t('erp:BudgetManagement.t_e6dde6df')}</p>
                        {!isLoggedIn && (
                          <MGButton
                            variant="primary"
                            size="medium"
                            type="button"
                            className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          >
                            {t('erp:BudgetManagement.t_3ddd853b')}
                          </MGButton>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="erp-section">
                    <div className="erp-section-header">
                      <div className="erp-section-title">
                        <h2>
                          <i className="bi bi-graph-up" />
                          {t('erp:BudgetManagement.t_a2c1e850')}
                        </h2>
                        <p>{t('erp:BudgetManagement.t_61334e66')}</p>
                      </div>
                    </div>

                    <div className="erp-stats-grid mg-v2-erp-dashboard-kpi-grid">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_b8a443b3')}</h3>
                          <DollarSign size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--primary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--primary">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_802b3641')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_20a7e171')}</h3>
                          <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--warning">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.usedBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_8dacd326')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_9215d601')}</h3>
                          <PiggyBank size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.remainingBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_b025a34c')}</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">{t('erp:BudgetManagement.t_2b80b7a9')}</h3>
                          <Percent size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--info" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--info">
                            {(() => {
                              const totalB = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
                              const totalU = budgets.reduce((sum, b) => sum + (b.usedBudget || 0), 0);
                              const usageRate = totalB > 0 ? (totalU / totalB) * 100 : 0;
                              return `${usageRate.toFixed(1)}%`;
                            })()}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">{t('erp:BudgetManagement.t_b097d9c4')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="erp-section">
                      <div className="erp-section-header">
                        <div className="erp-section-title">
                          <h3>
                            <i className="bi bi-pie-chart" />
                            {t('erp:BudgetManagement.t_73719010')}
                          </h3>
                          <p>{t('erp:BudgetManagement.t_fc8663a3')}</p>
                        </div>
                      </div>

                      {budgets.length > 0 ? (
                        <div className="erp-grid">
                          {(() => {
                            const categoryStats = {};
                            budgets.forEach((budget) => {
                              const cat = budget.category || '기타';
                              if (!categoryStats[cat]) {
                                categoryStats[cat] = {
                                  totalBudget: 0,
                                  usedBudget: 0,
                                  remainingBudget: 0,
                                  count: 0
                                };
                              }
                              categoryStats[cat].totalBudget += budget.totalBudget || 0;
                              categoryStats[cat].usedBudget += budget.usedBudget || 0;
                              categoryStats[cat].remainingBudget += budget.remainingBudget || 0;
                              categoryStats[cat].count += 1;
                            });

                            return Object.entries(categoryStats).map(([category, stats]) => {
                              const usageRate =
                                stats.totalBudget > 0 ? (stats.usedBudget / stats.totalBudget) * 100 : 0;
                              const isOverBudget = stats.usedBudget > stats.totalBudget;

                              return (
                                <div key={category} className="mg-v2-ad-b0kla__card erp-card">
                                  <div className="erp-card-header">
                                    <h4>
                                      <SafeText>{category}</SafeText>
                                    </h4>
                                    <span className={`erp-status ${isOverBudget ? 'danger' : 'success'}`}>
                                      {isOverBudget ? '예산 초과' : '정상'}
                                    </span>
                                  </div>
                                  <div className="erp-card-body">
                                    <div className="erp-budget-amounts">
                                      <div className="erp-budget-amount">
                                        <span className="erp-amount-label">{t('erp:BudgetManagement.t_b8a443b3')}</span>
                                        <span className="erp-amount-value">{formatCurrency(stats.totalBudget)}</span>
                                      </div>
                                      <div className="erp-budget-amount">
                                        <span className="erp-amount-label">{t('erp:BudgetManagement.t_8dacd326')}</span>
                                        <span className="erp-amount-value">{formatCurrency(stats.usedBudget)}</span>
                                      </div>
                                      <div className="erp-budget-amount">
                                        <span className="erp-amount-label">{t('erp:BudgetManagement.t_cc5d8b16')}</span>
                                        <span
                                          className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}
                                        >
                                          {formatCurrency(stats.remainingBudget)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="erp-budget-progress">
                                      <div className="erp-progress-header">
                                        <span>{t('erp:BudgetManagement.t_897659ea')}</span>
                                        <span className={`fw-bold ${isOverBudget ? 'text-danger' : 'text-primary'}`}>
                                          {usageRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="erp-progress-bar">
                                        <div
                                          className={`erp-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                          data-width={Math.min(usageRate, 100)}
                                         />
                                      </div>
                                    </div>

                                    <div className="erp-budget-count">
                                      <i className="bi bi-list-ul" />
                                      {toDisplayString(stats.count)}개 예산
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        <div className="erp-empty-state">
                          <div className="erp-empty-icon">
                            <i className="bi bi-pie-chart" />
                          </div>
                          <h3>{t('erp:BudgetManagement.t_de94235d')}</h3>
                          <p>{t('erp:BudgetManagement.t_4f467e91')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </ErpPageShell>
      </ContentArea>

      <UnifiedModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetNewBudgetForm();
        }}
        title={t('erp:BudgetManagement.t_68d316e7')}
        size="medium"
        showCloseButton
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        <form onSubmit={handleCreateBudget}>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-name">
              {t('erp:BudgetManagement.t_b67f8470')}
            </label>
            <input
              id="budget-create-name"
              type="text"
              className="mg-v2-form-input"
              value={newBudget.name}
              onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
            />
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-category">
              {t('erp:BudgetManagement.t_31125b29')}
            </label>
            <select
              id="budget-create-category"
              className="mg-v2-form-input"
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            >
              <option value="">{t('erp:BudgetManagement.t_afd8cf39')}</option>
              {budgetCategories.map((category) => (
                <option key={category.id} value={category.codeValue}>
                  {toDisplayString(category.codeLabel)}
                </option>
              ))}
            </select>
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-planned">
              {t('erp:BudgetManagement.t_f6a306d3')}
            </label>
            <input
              id="budget-create-planned"
              type="number"
              className="mg-v2-form-input"
              value={newBudget.plannedAmount}
              onChange={(e) => setNewBudget({ ...newBudget, plannedAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-desc">
              {t('common.labels.description')}
            </label>
            <textarea
              id="budget-create-desc"
              className="mg-v2-form-input"
              rows={3}
              value={newBudget.description}
              onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
            />
          </div>
          <div className="mg-v2-form-grid">
            <div>
              <label className="mg-v2-form-label" htmlFor="budget-create-start">
                {t('erp:BudgetManagement.t_453c56f5')}
              </label>
              <input
                id="budget-create-start"
                type="date"
                className="mg-v2-form-input"
                value={newBudget.startDate}
                onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mg-v2-form-label" htmlFor="budget-create-end">
                {t('erp:BudgetManagement.t_cad7c84c')}
              </label>
              <input
                id="budget-create-end"
                type="date"
                className="mg-v2-form-input"
                value={newBudget.endDate}
                onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-dept">
              {t('erp:BudgetManagement.t_e5b530d6')}
            </label>
            <input
              id="budget-create-dept"
              type="text"
              className="mg-v2-form-input"
              value={newBudget.department}
              onChange={(e) => setNewBudget({ ...newBudget, department: e.target.value })}
            />
          </div>
          <div className="mg-v2-form-actions">
            <MGButton
              type="button"
              variant="secondary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              onClick={() => {
                setShowCreateModal(false);
                resetNewBudgetForm();
              }}
            >
              {t('common.actions.cancel')}
            </MGButton>
            <MGButton
              type="submit"
              variant="primary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'primary', loading })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              loading={loading}
            >
              {t('erp:BudgetManagement.t_d1a2d3a2')}
            </MGButton>
          </div>
        </form>
      </UnifiedModal>

      <UnifiedModal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        title={t('erp:BudgetManagement.t_82fa5b68')}
        size="medium"
        showCloseButton
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {editingBudget && (
          <form onSubmit={handleSaveEdit}>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-name">
                {t('erp:BudgetManagement.t_b67f8470')}
              </label>
              <input
                id="budget-edit-name"
                type="text"
                className="mg-v2-form-input"
                value={editingBudget.name ?? ''}
                onChange={(e) => updateEditingField('name', e.target.value)}
              />
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-category">
                {t('erp:BudgetManagement.t_31125b29')}
              </label>
              <select
                id="budget-edit-category"
                className="mg-v2-form-input"
                value={editingBudget.category || ''}
                onChange={(e) => updateEditingField('category', e.target.value)}
              >
                <option value="">{t('erp:BudgetManagement.t_afd8cf39')}</option>
                {budgetCategories.map((category) => (
                  <option key={category.id} value={category.codeValue}>
                    {toDisplayString(category.codeLabel)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-total">
                {t('erp:BudgetManagement.t_b8a443b3')}
              </label>
              <input
                id="budget-edit-total"
                type="number"
                className="mg-v2-form-input"
                value={editingBudget.totalBudget ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  updateEditingField('totalBudget', raw === '' ? '' : Number(raw));
                }}
                min="0"
                step="0.01"
              />
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-desc">
                {t('common.labels.description')}
              </label>
              <textarea
                id="budget-edit-desc"
                className="mg-v2-form-input"
                rows={3}
                value={editingBudget.description ?? ''}
                onChange={(e) => updateEditingField('description', e.target.value)}
              />
            </div>
            <div className="mg-v2-form-grid">
              <div>
                <label className="mg-v2-form-label" htmlFor="budget-edit-year">
                  {t('erp:BudgetManagement.t_d5bc99dd')}
                </label>
                <input
                  id="budget-edit-year"
                  type="text"
                  className="mg-v2-form-input"
                  value={editingBudget.year ?? ''}
                  onChange={(e) => updateEditingField('year', e.target.value)}
                />
              </div>
              <div>
                <label className="mg-v2-form-label" htmlFor="budget-edit-month">
                  {t('erp:BudgetManagement.t_75448692')}
                </label>
                <input
                  id="budget-edit-month"
                  type="text"
                  className="mg-v2-form-input"
                  value={editingBudget.month ?? ''}
                  onChange={(e) => updateEditingField('month', e.target.value)}
                />
              </div>
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-status">
                {t('common.labels.status')}
              </label>
              <select
                id="budget-edit-status"
                className="mg-v2-form-input"
                value={editingBudget.status || 'ACTIVE'}
                onChange={(e) => updateEditingField('status', e.target.value)}
              >
                {BUDGET_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mg-v2-form-actions">
              <MGButton
                type="button"
                variant="secondary"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={() => setEditingBudget(null)}
              >
                {t('common.actions.cancel')}
              </MGButton>
              <MGButton
                type="submit"
                variant="primary"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'primary', loading })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                loading={loading}
              >
                {t('common.actions.save')}
              </MGButton>
            </div>
          </form>
        )}
      </UnifiedModal>
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default BudgetManagement;
