import { useState, useEffect, useMemo, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API, COMMON_CODE_API } from '../../constants/api';
import { fetchUserPermissions, PermissionChecks } from '../../utils/permissionUtils';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import ErpPageShell from './shell/ErpPageShell';
import UnifiedModal from '../common/modals/UnifiedModal.js';
import ErpButton from './common/ErpButton';
import MGButton from '../common/MGButton';
import { ErpFilterToolbar } from './common';
import { PiggyBank, List, Tag, TrendingUp, Wallet, Percent, DollarSign } from 'lucide-react';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';

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

/**
 * ERP 예산 관리 페이지
 * 예산 계획 및 관리
 */
const BudgetManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [userPermissions, setUserPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
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

  const loadData = async (options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setHasDataError(false);

      switch (activeTab) {
        case 'budgets':
          await loadBudgets();
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
        setSilentRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadBudgets = async () => {
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

  const loadBudgetCategories = async () => {
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

  const loadBudgetReports = async () => {
    try {
      // 보고서 탭: 추후 전용 API 연동
    } catch (err) {
      console.error('예산 보고서 로드 실패:', err);
      setError('예산 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCreateBudget = async (e) => {
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

  const handleSaveEdit = async (e) => {
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

  const handleDeleteBudget = async (budgetId) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('정말로 이 예산을 삭제하시겠습니까?', resolve);
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
      <AdminCommonLayout title="예산 관리">
        <ContentArea className="erp-system mg-v2-content-area mg-v2-ad-b0kla">
          <div className="erp-session-inline-load">
            <ContentHeader
              title="예산 관리"
              subtitle="세션 정보를 확인하는 중입니다."
            />
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
      <AdminCommonLayout title="예산 관리">
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
                    <button type="button" className="btn btn-outline-primary">
                      <i className="bi bi-arrow-clockwise" />
                      세션 새로고침
                    </button>
                    <button type="button" className="btn btn-primary">
                      <i className="bi bi-box-arrow-in-right" />
                      로그인
                    </button>
                  </div>
                </div>
                <div className="erp-login-content">
                  <h3>로그인이 필요합니다.</h3>
                  <p>예산 관리 기능을 사용하려면 로그인해주세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  const showInitialInlineLoad =
    loading && !budgetInitialFetchDone && !(error && hasDataError);

  return (
    <AdminCommonLayout title="예산 관리">
      <ContentArea className="erp-system mg-v2-content-area mg-v2-ad-b0kla">
        <ErpPageShell
          headerSlot={
            <ContentHeader
              title="예산 관리"
              subtitle="예산 계획 및 관리를 할 수 있습니다."
            />
          }
          tabsSlot={
            <div className="erp-tabs">
              <button
                type="button"
                className={`erp-tab ${activeTab === 'budgets' ? 'active' : ''}`}
                onClick={() => setActiveTab('budgets')}
              >
                <List size={18} aria-hidden />
                예산 목록
              </button>
              <button
                type="button"
                className={`erp-tab ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                <Tag size={18} aria-hidden />
                카테고리
              </button>
              <button
                type="button"
                className={`erp-tab ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <TrendingUp size={18} aria-hidden />
                보고서
              </button>
            </div>
          }
          mainAriaLabel="예산 관리 목록 및 본문"
        >
          <div className="erp-container">
            <ErpFilterToolbar
              ariaLabel="예산 목록 도구"
              secondaryRow={
                <div className="budget-management__toolbar-actions">
                  <MGButton
                    variant="secondary"
                    size="small"
                    className="mg-v2-button mg-v2-button--secondary"
                    onClick={() => loadData({ silent: true })}
                    loading={silentRefreshing}
                    loadingText="새로고침 중..."
                    disabled={loading}
                    aria-label="목록 새로고침"
                  >
                    목록 새로고침
                  </MGButton>
                </div>
              }
            />
            <div className="erp-content">
            {showInitialInlineLoad && (
              <div className="erp-initial-fetch-inline" role="status" aria-live="polite">
                <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
              </div>
            )}

            {loading && !showInitialInlineLoad && (
              <div className="budget-management-loading">
                <UnifiedLoading type="inline" text="로딩 중..." />
              </div>
            )}

            {error && hasDataError && (
              <div className="erp-error">
                <SafeErrorDisplay error={error} variant="banner" iconSize={18} />
                <MGButton
                  variant="outline"
                  size="small"
                  className="btn btn-outline-primary"
                  onClick={() => loadData({ silent: true })}
                  loading={silentRefreshing}
                  loadingText="새로고침 중..."
                  disabled={loading}
                  aria-label="다시 시도"
                >
                  다시 시도
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
                          <h3 className="mg-v2-ad-b0kla__chart-title">총 예산</h3>
                          <PiggyBank size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--primary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--primary">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">전체 예산 합계</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">사용 금액</h3>
                          <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--warning">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.usedBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">사용된 금액</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">잔여 금액</h3>
                          <Wallet size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.remainingBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">잔액</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">예산 개수</h3>
                          <List size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--info" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--info">
                            {toDisplayString(budgets.length)}개
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">등록된 예산</span>
                        </div>
                      </div>
                    </div>

                    <div className="erp-section-header">
                      <div className="erp-section-title">
                        <h2>
                          <i className="bi bi-list-ul" />
                          예산 목록
                        </h2>
                        <p>등록된 예산을 관리하고 모니터링할 수 있습니다.</p>
                      </div>
                      {canManageBudget && (
                        <button
                          type="button"
                          className="btn btn-primary erp-btn-primary"
                          onClick={() => setShowCreateModal(true)}
                        >
                          <i className="bi bi-plus-circle" />
                          새 예산 추가
                        </button>
                      )}
                    </div>

                    <div className="erp-budget-list">
                      {budgets.length > 0 ? (
                        <div className="erp-budget-grid">
                          {budgets.map((budget) => {
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
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => openEditModal(budget)}
                                        title="수정"
                                      >
                                        <i className="bi bi-pencil" />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteBudget(budget.id)}
                                        title="삭제"
                                      >
                                        <i className="bi bi-trash" />
                                      </button>
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
                                      <span className="erp-amount-label">총 예산</span>
                                      <span className="erp-amount-value">{formatCurrency(budget.totalBudget)}</span>
                                    </div>
                                    <div className="erp-budget-amount">
                                      <span className="erp-amount-label">사용 금액</span>
                                      <span className="erp-amount-value">{formatCurrency(budget.usedBudget || 0)}</span>
                                    </div>
                                    <div className="erp-budget-amount">
                                      <span className="erp-amount-label">잔여 금액</span>
                                      <span
                                        className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}
                                      >
                                        {formatCurrency(budget.remainingBudget || 0)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="erp-budget-progress">
                                    <div className="erp-progress-header">
                                      <span>사용률</span>
                                      <span className={`fw-bold ${isOverBudget ? 'text-danger' : 'text-primary'}`}>
                                        {usagePercentage.toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="erp-progress-bar">
                                      <div
                                        className={`erp-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                        data-width={Math.min(usagePercentage, 100)}
                                      ></div>
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
                          <h3>예산이 없습니다</h3>
                          <p>새로운 예산을 추가하여 시작해보세요.</p>
                          {canManageBudget && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setShowCreateModal(true)}
                            >
                              <i className="bi bi-plus-circle" />
                              첫 번째 예산 추가
                            </button>
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
                          예산 카테고리
                        </h2>
                        <p>예산 분류를 위한 카테고리 목록입니다.</p>
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
                              <span className="erp-status success">활성</span>
                            </div>
                            <div className="erp-card-body">
                              <p className="erp-description">
                                <SafeText>{category.codeDescription}</SafeText>
                              </p>
                              <div className="erp-details">
                                <div className="erp-detail">
                                  <span className="erp-label">코드:</span>
                                  <span className="erp-value">
                                    <SafeText>{category.codeValue}</SafeText>
                                  </span>
                                </div>
                                <div className="erp-detail">
                                  <span className="erp-label">정렬:</span>
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
                        <h3>예산 카테고리가 없습니다</h3>
                        <p>로그인 후 예산 카테고리를 확인할 수 있습니다.</p>
                        {!isLoggedIn && (
                          <button type="button" className="btn btn-primary">
                            <i className="bi bi-box-arrow-in-right" />
                            로그인하기
                          </button>
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
                          예산 보고서
                        </h2>
                        <p>예산 사용 현황과 통계를 확인할 수 있습니다.</p>
                      </div>
                    </div>

                    <div className="erp-stats-grid mg-v2-erp-dashboard-kpi-grid">
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">총 예산</h3>
                          <DollarSign size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--primary" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--primary">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">전체 예산</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">사용된 예산</h3>
                          <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--warning" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--warning">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.usedBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">사용 금액</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">잔여 예산</h3>
                          <PiggyBank size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">
                            {formatCurrency(budgets.reduce((sum, b) => sum + (b.remainingBudget || 0), 0))}
                          </div>
                          <span className="mg-v2-ad-b0kla__kpi-label">잔액</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue erp-stat-card">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <h3 className="mg-v2-ad-b0kla__chart-title">평균 사용률</h3>
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
                          <span className="mg-v2-ad-b0kla__kpi-label">전체 사용률</span>
                        </div>
                      </div>
                    </div>

                    <div className="erp-section">
                      <div className="erp-section-header">
                        <div className="erp-section-title">
                          <h3>
                            <i className="bi bi-pie-chart" />
                            카테고리별 예산 현황
                          </h3>
                          <p>각 카테고리별 예산 사용 현황을 확인할 수 있습니다.</p>
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
                                        <span className="erp-amount-label">총 예산</span>
                                        <span className="erp-amount-value">{formatCurrency(stats.totalBudget)}</span>
                                      </div>
                                      <div className="erp-budget-amount">
                                        <span className="erp-amount-label">사용 금액</span>
                                        <span className="erp-amount-value">{formatCurrency(stats.usedBudget)}</span>
                                      </div>
                                      <div className="erp-budget-amount">
                                        <span className="erp-amount-label">잔여 금액</span>
                                        <span
                                          className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}
                                        >
                                          {formatCurrency(stats.remainingBudget)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="erp-budget-progress">
                                      <div className="erp-progress-header">
                                        <span>사용률</span>
                                        <span className={`fw-bold ${isOverBudget ? 'text-danger' : 'text-primary'}`}>
                                          {usageRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="erp-progress-bar">
                                        <div
                                          className={`erp-progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                                          data-width={Math.min(usageRate, 100)}
                                        ></div>
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
                          <h3>예산 데이터가 없습니다</h3>
                          <p>예산을 추가하면 카테고리별 통계를 확인할 수 있습니다.</p>
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
        title="새 예산 추가"
        size="medium"
        showCloseButton
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        <form onSubmit={handleCreateBudget}>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-name">
              예산명
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
              카테고리
            </label>
            <select
              id="budget-create-category"
              className="mg-v2-form-input"
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            >
              <option value="">카테고리 선택</option>
              {budgetCategories.map((category) => (
                <option key={category.id} value={category.codeValue}>
                  {toDisplayString(category.codeLabel)}
                </option>
              ))}
            </select>
          </div>
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label" htmlFor="budget-create-planned">
              계획 금액
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
              설명
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
                시작일
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
                종료일
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
              부서
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
            <ErpButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                resetNewBudgetForm();
              }}
            >
              취소
            </ErpButton>
            <ErpButton type="submit" variant="primary" loading={loading}>
              생성
            </ErpButton>
          </div>
        </form>
      </UnifiedModal>

      <UnifiedModal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        title="예산 수정"
        size="medium"
        showCloseButton
        backdropClick
        className="mg-v2-ad-b0kla"
      >
        {editingBudget && (
          <form onSubmit={handleSaveEdit}>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-name">
                예산명
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
                카테고리
              </label>
              <select
                id="budget-edit-category"
                className="mg-v2-form-input"
                value={editingBudget.category || ''}
                onChange={(e) => updateEditingField('category', e.target.value)}
              >
                <option value="">카테고리 선택</option>
                {budgetCategories.map((category) => (
                  <option key={category.id} value={category.codeValue}>
                    {toDisplayString(category.codeLabel)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label" htmlFor="budget-edit-total">
                총 예산
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
                설명
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
                  연도
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
                  월
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
                상태
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
              <ErpButton type="button" variant="secondary" onClick={() => setEditingBudget(null)}>
                취소
              </ErpButton>
              <ErpButton type="submit" variant="primary" loading={loading}>
                저장
              </ErpButton>
            </div>
          </form>
        )}
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default BudgetManagement;
