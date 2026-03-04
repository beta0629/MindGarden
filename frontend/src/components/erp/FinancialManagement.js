import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import Button from '../ui/Button/Button';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import notificationManager from '../../utils/notification';
import ConfirmModal from '../common/ConfirmModal';
import UnifiedModal from '../common/modals/UnifiedModal';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import {
  DollarSign,
  Wallet,
  RefreshCw,
  Search,
  Link2,
  User,
  Users,
  BarChart3,
  Calendar,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Inbox,
  TrendingUp,
  TrendingDown,
  Undo2
} from 'lucide-react';
import { getStatusLabel } from '../../utils/colorUtils';
import FinancialCalendarView from './FinancialCalendarView';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';

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
    dateRange: 'ALL', // ALL, TODAY, WEEK, MONTH, CUSTOM
    startDate: '',
    endDate: '',
    searchText: '' // 상담사명, 내담자명, 설명 검색
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: null
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

  const loadTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        size: pagination.size
      });
      
      if (filters.transactionType !== 'ALL') {
        params.append('transactionType', filters.transactionType);
      }
      if (filters.category !== 'ALL') {
        params.append('category', filters.category);
      }
      if (filters.relatedEntityType !== 'ALL') {
        params.append('relatedEntityType', filters.relatedEntityType);
      }
      if (filters.searchText) {
        params.append('search', filters.searchText);
      }
      
      if (user?.branchCode) {
        params.append('branchCode', user.branchCode);
        console.log('📍 지점 관리자 - 자기 지점 데이터 조회:', user.branchCode);
      } else {
        console.log('📍 ERP 중앙화 - 전체 회사 데이터 조회');
        console.log('📍 사용자 정보:', user);
      }
      
      const response = await apiGet(`/api/v1/admin/financial-transactions?${params.toString()}`);
      console.log('📡 API 응답:', response);
      console.log('📡 API URL:', `/api/v1/admin/financial-transactions?${params.toString()}`);
      
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
            window.location.href = '/login';
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
        window.location.href = '/login';
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

  const handleDeleteTransaction = async (transaction) => {
    setConfirmModal({
      isOpen: true,
      title: '거래 삭제 확인',
      message: `정말 이 거래를 삭제하시겠습니까?\n거래 번호: #${transaction.id}\n금액: ${transaction.amount.toLocaleString()}원`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/v1/erp/finance/transactions/${transaction.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          const result = await response.json();
          
          if (result.success) {
            notificationManager.success('거래가 성공적으로 삭제되었습니다.');
            loadData(); // 데이터 새로고침
          } else {
            notificationManager.error('거래 삭제에 실패했습니다: ' + result.message);
          }
        } catch (error) {
          console.error('거래 삭제 실패:', error);
          notificationManager.error('거래 삭제 중 오류가 발생했습니다.');
        }
      }
    });
  };
  
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };
  
  const handleEditTransaction = (transaction) => {
    notificationManager.info('거래 수정 기능은 준비중입니다.');
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
        <div className="mg-v2-ad-b0kla mg-v2-erp-financial erp-system">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="세션 정보를 불러오는 중..." />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
        <div className="mg-v2-ad-b0kla mg-v2-erp-financial erp-system">
          <div className="mg-v2-ad-b0kla__container">
            <div className="erp-error">
              <h3>로그인이 필요합니다.</h3>
              <p>재무 관리 기능을 사용하려면 로그인해주세요.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
      <div className="mg-v2-ad-b0kla mg-v2-erp-financial erp-system">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea className="mg-v2-content-area">
            <ContentHeader
              title="재무 관리"
              subtitle="재무 거래 및 회계를 관리할 수 있습니다."
            />
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

          {/* 콘텐츠 영역 */}
          <div className="erp-content">
            {loading && (
              <div className="financial-management-loading">
                <UnifiedLoading type="inline" text="로딩 중..." />
              </div>
            )}

            {error && (
              <div className="erp-error">
                <div className="alert alert-danger" role="alert">
                  <AlertTriangle size={20} aria-hidden /> {error}
                </div>
                <button type="button" className="mg-btn mg-btn--outline mg-btn--primary" onClick={loadData}>
                  <RefreshCw size={16} aria-hidden /> 다시 시도
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {activeTab === 'calendar' && (
                <section
                  className="erp-section mg-v2-erp-section-block"
                  style={{
                    background: 'var(--mg-layout-section-bg, var(--mg-color-surface-main))',
                    border: '1px solid var(--mg-layout-section-border, var(--mg-color-border-main))',
                    borderRadius: '16px',
                    padding: 'var(--mg-layout-section-padding, 1.5rem)'
                  }}
                >
                  <FinancialCalendarView />
                </section>
              )}

              {activeTab === 'transactions' && (
                <section
                  className="erp-section mg-v2-erp-section-block"
                  style={{
                    background: 'var(--mg-layout-section-bg, var(--mg-color-surface-main))',
                    border: '1px solid var(--mg-layout-section-border, var(--mg-color-border-main))',
                    borderRadius: '16px',
                    padding: 'var(--mg-layout-section-padding, 1.5rem)'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>재무 거래 내역</h2>
                    <div className="d-flex gap-2">
                      <button type="button" className="mg-btn mg-btn--primary">
                        <Plus size={16} aria-hidden /> 거래 추가
                      </button>
                      <button type="button" className="mg-btn mg-btn--outline mg-btn--secondary">
                        <Download size={16} aria-hidden /> 내보내기
                      </button>
                    </div>
                  </div>

                  {/* 필터 섹션: 태그 그룹 */}
                  <div className="mg-v2-filter-section">
                    <h3 className="mg-v2-filter-title">필터 및 검색</h3>

                    <div className="mg-v2-filter-grid">
                      {/* 거래 유형: 태그 */}
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">거래 유형</label>
                        <div className="mg-v2-tag-group">
                          {[
                            { value: 'ALL', label: '전체' },
                            { value: 'INCOME', label: '수입' },
                            { value: 'EXPENSE', label: '지출' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`mg-v2-tag ${filters.transactionType === opt.value ? 'mg-v2-tag--selected' : ''}`}
                              onClick={() => setFilters(prev => ({ ...prev, transactionType: opt.value }))}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 카테고리: 태그 */}
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">카테고리</label>
                        <div className="mg-v2-tag-group">
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
                              className={`mg-v2-tag ${filters.category === opt.value ? 'mg-v2-tag--selected' : ''}`}
                              onClick={() => setFilters(prev => ({ ...prev, category: opt.value }))}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 연동 유형: 태그 */}
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">연동 유형</label>
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
                              onClick={() => setFilters(prev => ({ ...prev, relatedEntityType: opt.value }))}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 검색 */}
                      <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">검색</label>
                        <input
                          type="text"
                          placeholder="상담사명, 내담자명, 설명 검색..."
                          value={filters.searchText}
                          onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                          className="mg-v2-form-select"
                        />
                      </div>
                    </div>

                    <div className="mg-v2-form-group mg-financial-filter-actions">
                      <button
                        type="button"
                        onClick={() => setFilters({
                          transactionType: 'ALL',
                          category: 'ALL',
                          relatedEntityType: 'ALL',
                          dateRange: 'ALL',
                          startDate: '',
                          endDate: '',
                          searchText: ''
                        })}
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
                  
                  {/* 거래 내역 카드 그리드 (표준화 원칙: 테이블 → 카드 전환, 인라인 스타일 제거) */}
                  <div className="mg-financial-transaction-cards-grid">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <MGCard 
                          key={transaction.id}
                          variant="default"
                          className="mg-financial-transaction-card"
                        >
                          <div className="mg-financial-transaction-card__header">
                            <div className="mg-financial-transaction-card__id-section">
                              <Button
                                variant="link"
                                size="small"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowDetailModal(true);
                                }}
                                preventDoubleClick={true}
                                className="mg-financial-transaction-card__id-button"
                              >
                                #{transaction.id}
                              </Button>
                              {/* 매핑 연동 거래 표시 */}
                              {(transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' || 
                                transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                transaction.description?.includes('상담료 입금 확인') ||
                                transaction.description?.includes('상담료 환불')) && (
                                <span className="mg-v2-badge mg-v2-badge--primary">
                                  <Link2 size={12} aria-hidden /> 매핑연동
                                </span>
                              )}
                            </div>
                            <div className="mg-financial-transaction-card__date">
                              {formatDate(transaction.transactionDate)}
                            </div>
                          </div>
                          
                          <div className="mg-financial-transaction-card__body">
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">거래 유형</span>
                              <span className="erp-badge">
                                {transaction.transactionType}
                              </span>
                            </div>
                            
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">카테고리</span>
                              <div className="mg-financial-transaction-card__category">
                                <span>{transaction.category}</span>
                                {/* 매핑 연동 거래 세부 정보 */}
                                {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
                                  <div className="mg-financial-transaction-card__auto-generated mg-financial-transaction-card__auto-generated--success">
                                    <DollarSign size={12} aria-hidden /> 입금확인 자동생성
                                  </div>
                                )}
                                {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' && (
                                  <div className="mg-financial-transaction-card__auto-generated mg-financial-transaction-card__auto-generated--danger">
                                    <Wallet size={12} aria-hidden /> 환불처리 자동생성
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">매칭 정보</span>
                              <div className="mg-financial-transaction-card__matching-info">
                                {transaction.consultantName || transaction.clientName ? (
                                  <>
                                    <div className="mg-financial-transaction-card__consultant">
                                      <User size={14} aria-hidden /> {transaction.consultantName || '상담사 정보 없음'}
                                    </div>
                                    <div className="mg-financial-transaction-card__client">
                                      <Users size={14} aria-hidden /> {transaction.clientName || '내담자 정보 없음'}
                                    </div>
                                  </>
                                ) : (
                                  <span className="mg-financial-transaction-card__no-info">-</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">금액</span>
                              <span className={`mg-financial-transaction-card__amount ${transaction.amount >= 0 ? 'mg-financial-transaction-card__amount--success' : 'mg-financial-transaction-card__amount--danger'}`}>
                                {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            
                            <div className="mg-financial-transaction-card__field">
                              <span className="mg-financial-transaction-card__label">상태</span>
                              <span className={`erp-status ${transaction.status?.toLowerCase()}`}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mg-financial-transaction-card__footer">
                            <div className="mg-financial-transaction-card__actions">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleViewTransaction(transaction)}
                                preventDoubleClick={true}
                              >
                                <Eye size={14} aria-hidden /> 보기
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleEditTransaction(transaction)}
                                preventDoubleClick={true}
                              >
                                <Pencil size={14} aria-hidden /> 수정
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleDeleteTransaction(transaction)}
                                preventDoubleClick={true}
                              >
                                <Trash2 size={14} aria-hidden /> 삭제
                              </Button>
                            </div>
                          </div>
                        </MGCard>
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
                </section>
              )}

              {activeTab === 'dashboard' && (
                <section
                  className="erp-section mg-v2-erp-section-block"
                  style={{
                    background: 'var(--mg-layout-section-bg, var(--mg-color-surface-main))',
                    border: '1px solid var(--mg-layout-section-border, var(--mg-color-border-main))',
                    borderRadius: '16px',
                    padding: 'var(--mg-layout-section-padding, 1.5rem)'
                  }}
                >
                  <h2 className="mg-v2-ad-b0kla__section-title">재무 대시보드</h2>
                  <div className="mg-v2-erp-dashboard-kpi-grid">
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h3 className="mg-v2-ad-b0kla__chart-title">총 수입</h3>
                        <TrendingUp size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">{formatCurrency(dashboardStats.totalIncome)}</div>
                        <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                      </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h3 className="mg-v2-ad-b0kla__chart-title">총 지출</h3>
                        <TrendingDown size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--danger" />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--danger">{formatCurrency(dashboardStats.totalExpense)}</div>
                        <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                      </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h3 className="mg-v2-ad-b0kla__chart-title">순이익</h3>
                        <BarChart3 size={24} aria-hidden className={dashboardStats.netProfit >= 0 ? 'mg-v2-ad-b0kla__kpi-value--primary' : 'mg-v2-ad-b0kla__kpi-value--danger'} />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className={`mg-v2-ad-b0kla__kpi-value ${dashboardStats.netProfit >= 0 ? 'mg-v2-ad-b0kla__kpi-value--primary' : 'mg-v2-ad-b0kla__kpi-value--danger'}`}>
                          {formatCurrency(Math.abs(dashboardStats.netProfit))}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                      </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--blue">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h3 className="mg-v2-ad-b0kla__chart-title">거래 건수</h3>
                        <ClipboardList size={24} aria-hidden className="mg-v2-ad-b0kla__kpi-value--info" />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--info">{dashboardStats.transactionCount}건</div>
                        <span className="mg-v2-ad-b0kla__kpi-label">이번 달</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="mg-v2-ad-b0kla__section-title"><BarChart3 size={20} aria-hidden /> 매핑 연동 현황</h3>
                  <div className="mg-v2-erp-dashboard-kpi-grid mg-v2-erp-dashboard-kpi-grid--half">
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h4 className="mg-v2-ad-b0kla__chart-title">매핑 연동 수입</h4>
                        <Link2 size={22} aria-hidden className="mg-v2-ad-b0kla__kpi-value--success" />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--success">
                          {formatCurrency(
                            transactions
                              .filter(t => t.transactionType === 'INCOME' &&
                                (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' ||
                                  t.description?.includes('상담료 입금 확인')))
                              .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                          )}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-label">자동 생성된 상담료 수입</span>
                      </div>
                    </div>
                    <div className="mg-v2-ad-b0kla__card mg-v2-ad-b0kla__card-accent--orange">
                      <div className="mg-v2-ad-b0kla__chart-header">
                        <h4 className="mg-v2-ad-b0kla__chart-title">매핑 연동 환불</h4>
                        <Undo2 size={22} aria-hidden className="mg-v2-ad-b0kla__kpi-value--warning" />
                      </div>
                      <div className="mg-v2-ad-b0kla__chart-body">
                        <div className="mg-v2-ad-b0kla__kpi-value mg-v2-ad-b0kla__kpi-value--warning">
                          {formatCurrency(
                            transactions
                              .filter(t => t.transactionType === 'EXPENSE' &&
                                (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                  t.description?.includes('상담료 환불')))
                              .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                          )}
                        </div>
                        <span className="mg-v2-ad-b0kla__kpi-label">자동 생성된 환불 지출</span>
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
                      className="mg-v2-button mg-v2-button-success"
                      onClick={() => setActiveTab('calendar')}
                    >
                      <Calendar size={16} aria-hidden /> 달력 뷰 보기
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-secondary"
                      onClick={() => window.location.href = '/branch_super_admin/mapping-management'}
                    >
                      <Link2 size={16} aria-hidden /> 매핑 시스템 확인
                    </button>
                    <button
                      type="button"
                      className="mg-v2-button mg-v2-button-secondary"
                      onClick={() => window.location.href = '/erp/finance-dashboard'}
                    >
                      <Building2 size={16} aria-hidden /> 통합 재무 대시보드
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
          </div>
          </ContentArea>
        </div>
      </div>

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

      {/* 컨펌 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
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
      const response = await apiGet(`/api/admin/amount-management/mappings/${transaction.relatedEntityId}/amount-info`);
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
      <DollarSign size={20} aria-hidden /> 거래 상세 정보 #{transaction.id}
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
            <strong>카테고리:</strong> {transaction.category}
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
            <strong>설명:</strong> {transaction.description || '-'}
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
                <strong>매핑 ID:</strong> #{mappingDetail.mappingId}
              </div>
              <div>
                <strong>패키지명:</strong> {mappingDetail.packageName || '-'}
              </div>
              <div>
                <strong>총 회기수:</strong> {mappingDetail.totalSessions}회
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
                    <div className="mg-v2-transaction-detail-consistency-msg">{mappingDetail.consistencyMessage}</div>
                  )}
                </div>
              )}
              {mappingDetail.relatedTransactions && mappingDetail.relatedTransactions.length > 0 && (
                <div className="mg-v2-transaction-detail-form-grid__item--span2">
                  <strong>관련 거래:</strong>
                  <div className="mg-v2-transaction-detail-related-list">
                    {mappingDetail.relatedTransactions.map((relatedTx, index) => (
                      <div key={index} className="mg-v2-transaction-detail-related-item">
                        #{relatedTx.id} - {relatedTx.type} - {formatCurrency(relatedTx.amount)} ({formatDate(relatedTx.createdAt)})
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
              <strong>연동 유형:</strong> {transaction.relatedEntityType}
            </div>
            <div>
              <strong>연동 ID:</strong> #{transaction.relatedEntityId}
            </div>
          </div>
        </div>
      )}
    </UnifiedModal>
  );
};

export default FinancialManagement;
