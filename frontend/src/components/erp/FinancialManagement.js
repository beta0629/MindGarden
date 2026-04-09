import React, { useState, useEffect, Fragment } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import notificationManager from '../../utils/notification';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import FinancialTransactionForm from './FinancialTransactionForm';
import { ERP_API } from '../../constants/api';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection, ContentCard } from '../dashboard-v2/content';
import { ViewModeToggle } from '../common';
import Badge from '../common/Badge';
import {
  DollarSign,
  RefreshCw,
  Search,
  Link2,
  BarChart3,
  Calendar,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  List,
  Download,
  Eye,
  Pencil,
  Trash2,
  Inbox,
  TrendingUp,
  TrendingDown,
  Undo2
} from 'lucide-react';
import { getStatusLabel } from '../../utils/colorUtils';
import FinancialCalendarView from './FinancialCalendarView';
import { FinancialRefundHubTabs } from './financial/FinancialRefundHubLayout';
import ErpPageShell from './shell/ErpPageShell';
import { ErpFilterToolbar } from './common';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../admin/mapping-management/organisms/MappingListBlock.css';
import './ErpCommon.css';
import './FinancialManagement.css';

/** 거래 내역 보기 전환 옵션: 카드 / 테이블 (테이블 뷰는 추후 구현, 현재 동일 카드 뷰) */
const TRANSACTION_VIEW_MODE_OPTIONS = [
  { value: 'card', icon: LayoutGrid, label: '카드' },
  { value: 'table', icon: List, label: '테이블' }
];

/**
 * ERP 재무 관리 페이지
 * 재무 거래 및 회계 관리
 */
const FinancialManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
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
    dateRange: 'MONTH', // ALL, TODAY, WEEK, MONTH, CUSTOM
    startDate: '',
    endDate: '',
    searchText: '' // 상담사명, 내담자명, 설명 검색
  });
  
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
  
  const [dashboardStats, setDashboardStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
    branchCode: '',
    branchName: ''
  });

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab, pagination.currentPage]);

  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id && activeTab === 'transactions') {
      const timeoutId = setTimeout(() => {
        setPagination(prev => ({ ...prev, currentPage: 0 })); // 첫 페이지로 리셋
        loadData();
      }, 300); // 디바운싱
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getDateRangeForFilter = () => {
    const now = new Date();
    const toStr = (d) => d.toISOString().split('T')[0];
    switch (filters.dateRange) {
      case 'TODAY':
        return { startDate: toStr(now), endDate: toStr(now) };
      case 'WEEK': {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        return { startDate: toStr(start), endDate: toStr(now) };
      }
      case 'MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: toStr(start), endDate: toStr(now) };
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

  const loadTransactions = async () => {
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
      console.log('📡 API 응답:', response);
      
      // apiGet이 {success, data} 형태면 data만 반환하므로, 배열인지 객체인지 확인
      if (Array.isArray(response)) {
        // apiGet이 data 배열만 반환한 경우
        let filteredTransactions = response || [];
        console.log('📊 조회된 거래 데이터 (배열):', filteredTransactions.length, '건');
        
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
          console.log('📊 조회된 거래 데이터 (객체):', filteredTransactions.length, '건');
          console.log('📊 첫 번째 거래 샘플:', filteredTransactions[0]);
          
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
          console.error('❌ API 에러:', errorMessage, response);
          setError(errorMessage);
          
          if (response?.redirectToLogin) {
            console.error('🔒 세션 만료 - 로그인 화면으로 이동');
            redirectToLoginPageOnce();
            return;
          }
        }
      } else {
        // 응답이 null이거나 예상치 못한 형태
        console.warn('⚠️ 예상치 못한 응답 형태:', response);
        setError('재무 거래 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('재무 거래 로드 실패:', err);
      
      if (err.response?.status === 401 || err.status === 401) {
        console.error('🔒 인증 오류 - 로그인 화면으로 이동');
        redirectToLoginPageOnce();
        return;
      }
      
      // 네트워크 에러 또는 서버 에러
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          '재무 거래 목록을 불러오는 중 오류가 발생했습니다. 서버 연결을 확인해주세요.';
      console.error('❌ 네트워크/서버 에러:', errorMessage);
      setError(errorMessage);
    }
  };

  const calculateDashboardStats = async (transactionData) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const thisMonthTransactions = transactionData.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      return transactionDate.getFullYear() === currentYear && 
             transactionDate.getMonth() + 1 === currentMonth &&
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
    
    console.log('📊 대시보드 통계 업데이트:', {
      이번달거래수: thisMonthTransactions.length,
      총수입: totalIncome,
      총지출: totalExpense,
      순이익: totalIncome - totalExpense
    });
  };

  const loadDashboard = async () => {
    try {
      console.log('대시보드 데이터 로드');
    } catch (err) {
      console.error('대시보드 로드 실패:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteTransaction = (transaction) => {
    setDeleteModal({ isOpen: true, transaction });
  };

  const confirmDeleteTransaction = async () => {
    const transaction = deleteModal.transaction;
    if (!transaction?.id) {
      setDeleteModal({ isOpen: false, transaction: null });
      return;
    }
    try {
      const result = await StandardizedApi.delete(ERP_API.FINANCE_TRANSACTION_BY_ID(transaction.id));
      if (result?.success === false) {
        notificationManager.error(`거래 삭제에 실패했습니다: ${toErrorMessage(result.message)}`);
        return;
      }
      notificationManager.success('거래가 성공적으로 삭제되었습니다.');
      setDeleteModal({ isOpen: false, transaction: null });
      loadData();
    } catch (error) {
      console.error('거래 삭제 실패:', error);
      notificationManager.error(toErrorMessage(error.message) || '거래 삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };
  
  const handleEditTransaction = async (transaction) => {
    try {
      const data = await StandardizedApi.get(ERP_API.FINANCE_TRANSACTION_BY_ID(transaction.id));
      const resolved =
        data && typeof data === 'object' && data.id != null ? data : transaction;
      setEditModal({ open: true, transaction: resolved });
    } catch (e) {
      console.warn('거래 단건 조회 실패, 목록 행으로 폼을 채웁니다.', e);
      setEditModal({ open: true, transaction });
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getBranchName = async (branchCode) => {
    if (!branchCode) return '';
    try {
      const branchName = await getCodeLabel('BRANCH', branchCode);
      return branchName || branchCode;
    } catch (error) {
      console.error('지점명 조회 실패:', error);
      return branchCode;
    }
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout title="재무 관리">
        <ContentArea className="erp-system">
          <UnifiedLoading type="page" text="세션 정보를 불러오는 중..." />
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
        <ContentArea className="erp-system">
          <div className="erp-error">
            <h3>로그인이 필요합니다.</h3>
            <p>재무 관리 기능을 사용하려면 로그인해주세요.</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
      <Fragment>
        <ContentArea className="erp-system">
            <ContentHeader
              title="재무 관리"
              subtitle="재무 거래 및 회계를 관리할 수 있습니다."
            />
            <ErpPageShell
              tabsSlot={
                <>
                  <FinancialRefundHubTabs />
                  <div className="mg-v2-ad-b0kla__pill-toggle" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'transactions'}
                      className={`mg-v2-ad-b0kla__pill ${activeTab === 'transactions' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('transactions')}
                    >
                      <ClipboardList size={18} aria-hidden /> 거래 내역
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'calendar'}
                      className={`mg-v2-ad-b0kla__pill ${activeTab === 'calendar' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('calendar')}
                    >
                      <Calendar size={18} aria-hidden /> 달력 뷰
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'dashboard'}
                      className={`mg-v2-ad-b0kla__pill ${activeTab === 'dashboard' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                      onClick={() => setActiveTab('dashboard')}
                    >
                      <LayoutDashboard size={18} aria-hidden /> 대시보드
                    </button>
                  </div>
                </>
              }
              filterSlot={
                activeTab === 'transactions' && !loading && !error ? (
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
                            onChange={(e) =>
                              setFilters((prev) => ({ ...prev, dateRange: String(e.target.value) }))
                            }
                            className="mg-v2-form-select mg-v2-erp-filter-toolbar__period-select"
                          >
                            <option value="ALL">전체</option>
                            <option value="TODAY">오늘</option>
                            <option value="WEEK">이번 주</option>
                            <option value="MONTH">이번 달</option>
                            <option value="CUSTOM">직접 입력</option>
                          </select>
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
                              <button
                                key={opt.value}
                                type="button"
                                className={`mg-erp-filter-badge ${filters.transactionType === opt.value ? 'mg-erp-filter-badge--selected' : ''}`}
                                onClick={() =>
                                  setFilters((prev) => ({ ...prev, transactionType: opt.value }))
                                }
                              >
                                {opt.label}
                              </button>
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
                              <button
                                key={opt.value}
                                type="button"
                                className={`mg-erp-filter-badge ${filters.category === opt.value ? 'mg-erp-filter-badge--selected' : ''}`}
                                onClick={() =>
                                  setFilters((prev) => ({ ...prev, category: opt.value }))
                                }
                              >
                                {opt.label}
                              </button>
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
                          <button
                            type="button"
                            onClick={() => setShowAdvancedFilter((v) => !v)}
                            className="mg-v2-button mg-v2-button-secondary"
                          >
                            고급 필터 {showAdvancedFilter ? '접기' : '펼치기'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFilters({
                                transactionType: 'ALL',
                                category: 'ALL',
                                relatedEntityType: 'ALL',
                                dateRange: 'MONTH',
                                startDate: '',
                                endDate: '',
                                searchText: ''
                              })
                            }
                            className="mg-v2-button mg-v2-button-secondary"
                          >
                            <RefreshCw size={16} aria-hidden /> 필터 초기화
                          </button>
                          <button
                            type="button"
                            onClick={() => loadData()}
                            className="mg-v2-button mg-v2-button-primary"
                          >
                            <Search size={16} aria-hidden /> 검색
                          </button>
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
                            <button
                              key={opt.value}
                              type="button"
                              className={`mg-v2-tag ${filters.relatedEntityType === opt.value ? 'mg-v2-tag--selected' : ''}`}
                              onClick={() =>
                                setFilters((prev) => ({ ...prev, relatedEntityType: opt.value }))
                              }
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  />
                ) : null
              }
            >
              <div className="erp-content">
            {loading && (
              <div className="financial-management-loading">
                <UnifiedLoading type="inline" text="로딩 중..." />
              </div>
            )}

            {error && (
              <div className="erp-error">
                <SafeErrorDisplay error={error} variant="banner" />
                <button type="button" className="mg-v2-button mg-v2-button-primary" onClick={loadData}>
                  <RefreshCw size={16} aria-hidden /> 다시 시도
                </button>
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
                <ContentSection noCard className="mg-v2-mapping-list-block">
                  <ContentCard
                    className="mg-v2-mapping-list-block__card mg-financial-management-mapping-card"
                  >
                    <div className="mg-v2-mapping-list-block__header">
                      <div className="mg-v2-mapping-list-block__title">재무 거래 내역</div>
                      <div className="d-flex gap-2 align-items-center">
                        <ViewModeToggle
                          viewMode={transactionViewMode}
                          onViewModeChange={setTransactionViewMode}
                          options={TRANSACTION_VIEW_MODE_OPTIONS}
                          className="mg-v2-mapping-list-block__toggle"
                          ariaLabel="목록 보기 전환"
                        />
                        <button type="button" className="mg-btn mg-btn--outline mg-btn--secondary">
                          <Download size={16} aria-hidden /> 내보내기
                        </button>
                      </div>
                    </div>

                  {/* 거래 목록 카드: 필수만 노출(일자, 유형, 카테고리, 금액, 상태, 매핑). 상세는 모달 — 필터는 ErpPageShell.filterSlot */}
                  <div className="mg-financial-transaction-cards-grid">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="mg-v2-ad-b0kla__card mg-financial-transaction-card"
                        >
                          <div className="mg-financial-transaction-card__header">
                            <div className="mg-financial-transaction-card__id-section">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowDetailModal(true);
                                }}
                                className="mg-financial-transaction-card__id-button"
                              >
                                #{toDisplayString(transaction.id)}
                              </button>
                              {(transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                                transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                transaction.description?.includes('상담료 입금 확인') ||
                                transaction.description?.includes('상담료 환불')) && (
                                <Badge variant="status" statusVariant="info" size="sm" label="매핑" />
                              )}
                            </div>
                            <div className="mg-financial-transaction-card__date">
                              {formatDate(transaction.transactionDate)}
                            </div>
                          </div>
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
                              <span><SafeText fallback="-">{transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}</SafeText></span>
                            </div>
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">금액</span>
                              <span
                                className={
                                  transaction.amount >= 0
                                    ? 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--success'
                                    : 'mg-financial-transaction-card__amount mg-financial-transaction-card__amount--danger'
                                }
                              >
                                {transaction.amount >= 0 ? '+' : ''}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">상태</span>
                              <span className={`erp-status ${toDisplayString(transaction.status, '').toLowerCase()}`}>
                                <SafeText>{getStatusLabel(transaction.status)}</SafeText>
                              </span>
                            </div>
                          </div>
                          <div className="mg-financial-transaction-card__footer">
                            <div className="mg-financial-transaction-card__actions">
                              <button
                                type="button"
                                className="mg-v2-button mg-v2-button-secondary"
                                onClick={() => handleViewTransaction(transaction)}
                              >
                                <Eye size={14} aria-hidden /> 보기
                              </button>
                              <button
                                type="button"
                                className="mg-v2-button mg-v2-button-secondary"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Pencil size={14} aria-hidden /> 수정
                              </button>
                              <button
                                type="button"
                                className="mg-v2-button mg-v2-button-secondary"
                                onClick={() => handleDeleteTransaction(transaction)}
                              >
                                <Trash2 size={14} aria-hidden /> 삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="mg-financial-transaction-empty">
                        <Inbox size={48} className="mg-financial-transaction-empty__icon" aria-hidden />
                        <p className="mg-financial-transaction-empty__text">거래 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 페이지네이션 */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav>
                        <ul className="pagination">
                          <li className={`page-item ${pagination.currentPage === 0 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pagination.currentPage - 1)}
                              disabled={pagination.currentPage === 0}
                            >
                              이전
                            </button>
                          </li>
                          
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const page = i;
                            return (
                              <li key={page} className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page + 1}
                                </button>
                              </li>
                            );
                          })}
                          
                          <li className={`page-item ${pagination.currentPage === pagination.totalPages - 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pagination.currentPage + 1)}
                              disabled={pagination.currentPage === pagination.totalPages - 1}
                            >
                              다음
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                  </ContentCard>
                </ContentSection>
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
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatCurrency(dashboardStats.totalIncome)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                      <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card--accent-error">
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">지출 합계</span>
                          <TrendingDown size={24} aria-hidden className="mg-v2-erp-dashboard-kpi-icon mg-v2-erp-dashboard-kpi-icon--error" />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatCurrency(dashboardStats.totalExpense)}</div>
                          <span className="mg-v2-erp-dashboard-kpi-label">이번 달</span>
                        </div>
                      </div>
                      <div className={`mg-v2-ad-b0kla__card ${dashboardStats.netProfit >= 0 ? 'mg-v2-ad-b0kla__card--accent-primary' : 'mg-v2-ad-b0kla__card--accent-error'}`}>
                        <div className="mg-v2-ad-b0kla__chart-header">
                          <span className="mg-v2-erp-dashboard-kpi-label">순이익</span>
                          <BarChart3 size={24} aria-hidden className={`mg-v2-erp-dashboard-kpi-icon ${dashboardStats.netProfit >= 0 ? 'mg-v2-erp-dashboard-kpi-icon--primary' : 'mg-v2-erp-dashboard-kpi-icon--error'}`} />
                        </div>
                        <div className="mg-v2-ad-b0kla__chart-body">
                          <div className="mg-v2-erp-dashboard-kpi-value">{formatCurrency(Math.abs(dashboardStats.netProfit))}</div>
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
                            {formatCurrency(
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
                            {formatCurrency(
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
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-primary"
                      onClick={() => setActiveTab('transactions')}
                    >
                      <ClipboardList size={16} aria-hidden /> 거래 내역 보기
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-secondary"
                      onClick={() => setActiveTab('calendar')}
                    >
                      <Calendar size={16} aria-hidden /> 달력 뷰 보기
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-secondary"
                      onClick={() => { window.location.href = '/branch_super_admin/mapping-management'; }}
                    >
                      <Link2 size={16} aria-hidden /> 매핑 시스템 확인
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-secondary"
                      onClick={() => { window.location.href = '/erp/finance-dashboard'; }}
                    >
                      <Building2 size={16} aria-hidden /> 통합 재무 대시보드
                    </button>
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
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button-secondary"
                  onClick={() => setDeleteModal({ isOpen: false, transaction: null })}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button--danger"
                  onClick={confirmDeleteTransaction}
                >
                  삭제
                </button>
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
                <SafeText fallback="-">
                  {`${toSafeNumber(deleteModal.transaction.amount).toLocaleString()}원`}
                </SafeText>
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
              loadData();
              setEditModal({ open: false, transaction: null });
            }}
          />
        )}
      </Fragment>
    </AdminCommonLayout>
  );
};

const TransactionDetailModal = ({ transaction, onClose }) => {
  const [mappingDetail, setMappingDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  useEffect(() => {
    if (transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && transaction.relatedEntityId) {
      loadMappingDetail();
    }
  }, [transaction]);

  const loadMappingDetail = async () => {
    try {
      setLoading(true);
      const response = await StandardizedApi.get(
        `/api/v1/admin/amount-management/mappings/${transaction.relatedEntityId}/amount-info`
      );
      if (response.success) {
        setMappingDetail(response.data);
      }
    } catch (err) {
      console.error('매핑 상세 정보 로드 실패:', err);
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

  const modalActions = (
    <>
      <button type="button" onClick={onClose} className="mg-v2-transaction-detail-btn mg-v2-transaction-detail-btn--secondary">
        닫기
      </button>
      {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
        <button
          type="button"
          onClick={() => window.open(`/branch_super_admin/mapping-management?mappingId=${transaction.relatedEntityId}`, '_blank')}
          className="mg-v2-transaction-detail-btn mg-v2-transaction-detail-btn--primary"
        >
          매핑 보기
        </button>
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
            <SafeText fallback="-">{transaction.category === 'CONSULTATION' ? '상담료' : transaction.category}</SafeText>
          </div>
          <div>
            <strong>금액:</strong>
            <span className={`mg-v2-transaction-detail-amount ${transaction.transactionType === 'INCOME' ? 'mg-v2-transaction-detail-amount--income' : 'mg-v2-transaction-detail-amount--expense'}`}>
              {formatCurrency(transaction.amount)}
            </span>
          </div>
          <div>
            <strong>거래일:</strong> {formatDate(transaction.transactionDate)}
          </div>
          <div className="mg-v2-transaction-detail-form-grid__item--span2">
            <strong>설명:</strong> <SafeText fallback="-">{transaction.description}</SafeText>
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
              <div>
                <strong>패키지명:</strong> <SafeText fallback="-">{mappingDetail.packageName}</SafeText>
              </div>
              <div>
                <strong>총 회기수:</strong> {toDisplayString(mappingDetail.totalSessions)}회
              </div>
              <div>
                <strong>회기당 단가:</strong> {formatCurrency(mappingDetail.pricePerSession)}
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>패키지 가격:</strong>
                <span className="mg-v2-transaction-detail-package-price">{formatCurrency(mappingDetail.packagePrice)}</span>
              </div>
              <div className="mg-v2-transaction-detail-form-grid__item--span2">
                <strong>결제 금액:</strong>
                <span className={`mg-v2-transaction-detail-payment-amount ${mappingDetail.packagePrice === mappingDetail.paymentAmount ? 'mg-v2-transaction-detail-payment-amount--match' : 'mg-v2-transaction-detail-payment-amount--mismatch'}`}>
                  {formatCurrency(mappingDetail.paymentAmount)}
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
                    <div className="mg-v2-transaction-detail-consistency-msg"><SafeText>{mappingDetail.consistencyMessage}</SafeText></div>
                  )}
                </div>
              )}
              {mappingDetail.relatedTransactions && mappingDetail.relatedTransactions.length > 0 && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>관련 거래:</strong>
                  <div className="mg-v2-transaction-detail-related-list">
                    {mappingDetail.relatedTransactions.map((relatedTx, index) => (
                      <div key={index} className="mg-v2-transaction-detail-related-item">
                        #{toDisplayString(relatedTx.id)} - <SafeText>{relatedTx.type}</SafeText> - {formatCurrency(relatedTx.amount)} ({formatDate(relatedTx.createdAt)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mg-v2-transaction-detail-message-empty">매핑 정보를 불러올 수 없습니다.</div>
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
              <strong>연동 유형:</strong> <SafeText>{transaction.relatedEntityType}</SafeText>
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
