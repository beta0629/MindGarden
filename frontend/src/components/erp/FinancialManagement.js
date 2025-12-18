import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import Button from '../ui/Button/Button';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getCodeLabel } from '../../utils/commonCodeUtils';
import notificationManager from '../../utils/notification';
import ConfirmModal from '../common/ConfirmModal';
import SimpleLayout from '../layout/SimpleLayout';
import { getStatusLabel } from '../../utils/colorUtils';
import FinancialCalendarView from './FinancialCalendarView';
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
      
      if (response && response.success) {
        let filteredTransactions = response.data || [];
        console.log('📊 조회된 거래 데이터:', filteredTransactions.length, '건');
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
        
        await calculateDashboardStats(filteredTransactions);
      } else {
        setError(response?.message || '재무 거래 목록을 불러올 수 없습니다.');
        
        if (response?.redirectToLogin) {
          console.error('🔒 세션 만료 - 로그인 화면으로 이동');
          window.location.href = '/login';
          return;
        }
      }
    } catch (err) {
      console.error('재무 거래 로드 실패:', err);
      
      if (err.response?.status === 401 || err.status === 401) {
        console.error('🔒 인증 오류 - 로그인 화면으로 이동');
        window.location.href = '/login';
        return;
      }
      
      setError('재무 거래 목록을 불러오는 중 오류가 발생했습니다.');
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
          const response = await fetch(`/api/erp/finance/transactions/${transaction.id}`, {
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
      <SimpleLayout title="재무 관리">
        <UnifiedLoading type="page" text="세션 정보를 불러오는 중..." />
      </SimpleLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>재무 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={`재무 관리${dashboardStats.branchName ? ' - ' + dashboardStats.branchName : ''}`}>
      <div className="erp-system">
        <div className="erp-container">
        {/* 헤더 */}
        <div className="erp-header">
          <h1 className="erp-title">
            <i className="bi bi-graph-up"></i>
            재무 관리
          </h1>
          <p className="erp-subtitle">
            재무 거래 및 회계를 관리할 수 있습니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <i className="bi bi-list-ul"></i>
            거래 내역
          </button>
          <button
            className={`erp-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <i className="bi bi-calendar3"></i>
            달력 뷰
          </button>
          <button
            className={`erp-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="bi bi-speedometer2"></i>
            대시보드
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
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
              <button className="mg-btn mg-btn--outline mg-btn--primary" onClick={loadData}>
                <i className="bi bi-arrow-clockwise"></i>
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'calendar' && (
                <div className="erp-section">
                  <FinancialCalendarView />
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="erp-section">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>재무 거래 내역</h2>
                    <div className="d-flex gap-2">
                      <button className="mg-btn mg-btn--primary">
                        <i className="bi bi-plus"></i>
                        거래 추가
                      </button>
                      <button className="mg-btn mg-btn--outline mg-btn--secondary">
                        <i className="bi bi-download"></i>
                        내보내기
                      </button>
                    </div>
                  </div>

                  {/* 필터 섹션 */}
                  <div className="mg-v2-filter-section">
                    <h3 className="mg-v2-filter-title">
                      🔍 필터 및 검색
                    </h3>
                    
                    <div className="mg-v2-filter-grid">
                      {/* 거래 유형 필터 */}
                      <div>
                        <label className="mg-v2-form-label">
                          거래 유형
                        </label>
                        <select
                          value={filters.transactionType}
                          onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                          className="mg-v2-form-select"
                        >
                          <option value="ALL">전체</option>
                          <option value="INCOME">💰 수입</option>
                          <option value="EXPENSE">💸 지출</option>
                        </select>
                      </div>
                      
                      {/* 카테고리 필터 */}
                      <div>
                        <label className="mg-v2-form-label">
                          카테고리
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="mg-v2-form-select"
                        >
                          <option value="ALL">전체</option>
                          <option value="CONSULTATION">🗣️ 상담료</option>
                          <option value="SALARY">💼 급여</option>
                          <option value="RENT">🏢 임대료</option>
                          <option value="UTILITY">⚡ 관리비</option>
                          <option value="OFFICE_SUPPLIES">📝 사무용품</option>
                          <option value="OTHER">🔧 기타</option>
                        </select>
                      </div>
                      
                      {/* 연동 유형 필터 */}
                      <div>
                        <label className="mg-v2-form-label">
                          연동 유형
                        </label>
                        <select
                          value={filters.relatedEntityType}
                          onChange={(e) => setFilters(prev => ({ ...prev, relatedEntityType: e.target.value }))}
                          className="mg-v2-form-select"
                        >
                          <option value="ALL">전체</option>
                          <option value="CONSULTANT_CLIENT_MAPPING">🔗 매핑연동</option>
                          <option value="CONSULTANT_CLIENT_MAPPING_REFUND">📤 환불처리</option>
                          <option value="PAYMENT">💳 결제</option>
                          <option value="SALARY_CALCULATION">💼 급여</option>
                          <option value="PURCHASE_REQUEST">🛒 구매</option>
                        </select>
                      </div>
                      
                      {/* 검색 */}
                      <div>
                        <label className="mg-v2-form-label">
                          검색
                        </label>
                        <input
                          type="text"
                          placeholder="상담사명, 내담자명, 설명 검색..."
                          value={filters.searchText}
                          onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                          className="mg-v2-form-select"
                        />
                      </div>
                    </div>
                    
                    <div className="mg-v2-form-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button
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
                        🔄 필터 초기화
                      </button>
                      
                      <button
                        onClick={() => loadData()}
                        className="mg-v2-button mg-v2-button-primary"
                      >
                        🔍 검색
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
                                  🔗 매핑연동
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
                                    💰 입금확인 자동생성
                                  </div>
                                )}
                                {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' && (
                                  <div className="mg-financial-transaction-card__auto-generated mg-financial-transaction-card__auto-generated--danger">
                                    📤 환불처리 자동생성
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
                                      👤 {transaction.consultantName || '상담사 정보 없음'}
                                    </div>
                                    <div className="mg-financial-transaction-card__client">
                                      👥 {transaction.clientName || '내담자 정보 없음'}
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
                                <i className="bi bi-eye"></i> 보기
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleEditTransaction(transaction)}
                                preventDoubleClick={true}
                              >
                                <i className="bi bi-pencil"></i> 수정
                              </Button>
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleDeleteTransaction(transaction)}
                                preventDoubleClick={true}
                              >
                                <i className="bi bi-trash"></i> 삭제
                              </Button>
                            </div>
                          </div>
                        </MGCard>
                      ))
                    ) : (
                      <div className="mg-financial-transaction-empty">
                        <i className="bi bi-inbox mg-financial-transaction-empty__icon"></i>
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
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div className="erp-section">
                  <h2>재무 대시보드</h2>
                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <div className="erp-card">
                        <div className="erp-card-header">
                          <h3>총 수입</h3>
                          <i className="bi bi-arrow-up-circle text-success"></i>
                        </div>
                        <div className="erp-card-body">
                          <div className="h4 text-success">{formatCurrency(dashboardStats.totalIncome)}</div>
                          <small className="text-muted">이번 달</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="erp-card">
                        <div className="erp-card-header">
                          <h3>총 지출</h3>
                          <i className="bi bi-arrow-down-circle text-danger"></i>
                        </div>
                        <div className="erp-card-body">
                          <div className="h4 text-danger">{formatCurrency(dashboardStats.totalExpense)}</div>
                          <small className="text-muted">이번 달</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="erp-card">
                        <div className="erp-card-header">
                          <h3>순이익</h3>
                          <i className="bi bi-graph-up text-primary"></i>
                        </div>
                        <div className="erp-card-body">
                          <div className={`h4 ${dashboardStats.netProfit >= 0 ? 'text-primary' : 'text-danger'}`}>
{formatCurrency(Math.abs(dashboardStats.netProfit))}
                          </div>
                          <small className="text-muted">이번 달</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="erp-card">
                        <div className="erp-card-header">
                          <h3>거래 건수</h3>
                          <i className="bi bi-list-ul text-info"></i>
                        </div>
                        <div className="erp-card-body">
                          <div className="h4 text-info">{dashboardStats.transactionCount}건</div>
                          <small className="text-muted">이번 달</small>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 매핑 연동 현황 */}
                  <div className="mt-4">
                    <h3>📊 매핑 연동 현황</h3>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h4>매핑 연동 수입</h4>
                            <i className="bi bi-link-45deg text-success"></i>
                          </div>
                          <div className="erp-card-body">
                            <div className="h5 text-success">
{formatCurrency(
                                transactions
                                  .filter(t => t.transactionType === 'INCOME' && 
                                          (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' || 
                                           t.description?.includes('상담료 입금 확인')))
                                  .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                              )}
                            </div>
                            <small className="text-muted">자동 생성된 상담료 수입</small>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h4>매핑 연동 환불</h4>
                            <i className="bi bi-arrow-left-circle text-warning"></i>
                          </div>
                          <div className="erp-card-body">
                            <div className="h5 text-warning">
{formatCurrency(
                                transactions
                                  .filter(t => t.transactionType === 'EXPENSE' && 
                                          (t.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' || 
                                           t.description?.includes('상담료 환불')))
                                  .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
                              )}
                            </div>
                            <small className="text-muted">자동 생성된 환불 지출</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 빠른 액션 */}
                  <div className="mt-4">
                    <h3>⚡ 빠른 액션</h3>
                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        className="mg-btn mg-btn--primary"
                        onClick={() => setActiveTab('transactions')}
                      >
                        📋 거래 내역 보기
                      </button>
                      <button 
                        className="mg-btn mg-btn--success"
                        onClick={() => setActiveTab('calendar')}
                      >
                        📅 달력 뷰 보기
                      </button>
                      <button 
                        className="mg-btn mg-btn--info"
                        onClick={() => window.location.href = '/branch_super_admin/mapping-management'}
                      >
                        🔗 매핑 시스템 확인
                      </button>
                      <button 
                        className="mg-btn mg-btn--secondary"
                        onClick={() => window.location.href = '/erp/finance-dashboard'}
                      >
                        🏢 통합 재무 대시보드
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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
    </SimpleLayout>
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

  return (
    <div className="mg-v2-modal-overlay--high-z">
      <div className="mg-v2-modal mg-v2-modal-lg mg-v2-modal--scrollable">
        {/* 헤더 */}
        <div className="mg-v2-modal-header">
          <h2 className="mg-v2-modal-title">
            💰 거래 상세 정보 #{transaction.id}
          </h2>
          <button
            onClick={onClose}
            className="mg-v2-modal-close"
          >
            ✕
          </button>
        </div>

        {/* 기본 거래 정보 */}
        <div className="mg-v2-card mg-v2-card--outlined">
          <h3 className="mg-v2-section-header">
            📊 기본 정보
          </h3>
          
          <div className="mg-v2-form-grid">
            <div>
              <strong>거래 유형:</strong>
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: 'var(--font-size-xs)',
                backgroundColor: transaction.transactionType === 'INCOME' ? 'var(--mg-success-100, rgba(40, 167, 69, 0.1))' : 'var(--mg-error-100, rgba(220, 53, 69, 0.1))',
                color: transaction.transactionType === 'INCOME' ? 'var(--mg-success-700, #155724)' : 'var(--mg-error-700, #721c24)'
              }}>
                {transaction.transactionType === 'INCOME' ? '💰 수입' : '💸 지출'}
              </span>
            </div>
            
            <div>
              <strong>카테고리:</strong> {transaction.category}
            </div>
            
            <div>
              <strong>금액:</strong>
              <span style={{
                marginLeft: '8px',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                color: transaction.transactionType === 'INCOME' ? 'var(--mg-success-500)' : 'var(--mg-error-500)'
              }}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            
            <div>
              <strong>거래일:</strong> {formatDate(transaction.transactionDate)}
            </div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <strong>설명:</strong> {transaction.description || '-'}
            </div>
          </div>
        </div>

        {/* 매핑 연동 정보 */}
        {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
          <div style={{
            backgroundColor: 'var(--mg-info-100, rgba(23, 162, 184, 0.1))',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid var(--mg-secondary-600)'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-size-base)', color: 'var(--mg-secondary-600)' }}>
              🔗 매핑 연동 정보
            </h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>로딩 중...</div>
              </div>
            ) : mappingDetail ? (
              <div className="mg-v2-form-grid">
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
                
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>패키지 가격:</strong>
                  <span style={{ marginLeft: '8px', fontSize: 'var(--font-size-base)', fontWeight: 'bold', color: 'var(--mg-success-500)' }}>
                    {formatCurrency(mappingDetail.packagePrice)}
                  </span>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>결제 금액:</strong>
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: 'var(--font-size-sm)', 
                    color: mappingDetail.packagePrice === mappingDetail.paymentAmount ? 'var(--mg-success-500)' : 'var(--mg-error-500)'
                  }}>
                    {formatCurrency(mappingDetail.paymentAmount)}
                    {mappingDetail.packagePrice !== mappingDetail.paymentAmount && (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--mg-error-500)', marginLeft: '4px' }}>
                        (⚠️ 패키지 가격과 다름)
                      </span>
                    )}
                  </span>
                </div>
                
                {mappingDetail.isConsistent !== undefined && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>일관성 검사:</strong>
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: 'var(--font-size-xs)',
                      backgroundColor: mappingDetail.isConsistent ? 'var(--mg-success-100, rgba(40, 167, 69, 0.1))' : 'var(--mg-error-100, rgba(220, 53, 69, 0.1))',
                      color: mappingDetail.isConsistent ? 'var(--mg-success-700, #155724)' : 'var(--mg-error-700, #721c24)'
                    }}>
                      {mappingDetail.isConsistent ? '✅ 정상' : '⚠️ 불일치'}
                    </span>
                    {!mappingDetail.isConsistent && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--mg-error-500)', marginTop: '4px' }}>
                        {mappingDetail.consistencyMessage}
                      </div>
                    )}
                  </div>
                )}
                
                {mappingDetail.relatedTransactions && mappingDetail.relatedTransactions.length > 0 && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>관련 거래:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {mappingDetail.relatedTransactions.map((relatedTx, index) => (
                        <div key={index} style={{
                          fontSize: 'var(--font-size-xs)',
                          padding: '4px 8px',
                          backgroundColor: 'var(--mg-gray-100, #f1f3f4)',
                          borderRadius: '4px',
                          marginBottom: '4px'
                        }}>
                          #{relatedTx.id} - {relatedTx.type} - {formatCurrency(relatedTx.amount)} 
                          ({formatDate(relatedTx.createdAt)})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--mg-gray-500, #666)' }}>
                매핑 정보를 불러올 수 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 기타 연동 정보 */}
        {transaction.relatedEntityType && transaction.relatedEntityType !== 'CONSULTANT_CLIENT_MAPPING' && (
          <div style={{
            backgroundColor: 'var(--mg-warning-100, rgba(255, 193, 7, 0.1))',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid var(--mg-warning-500)'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-size-base)', color: 'var(--mg-warning-700, #856404)' }}>
              🔗 연동 정보
            </h3>
            
            <div className="mg-v2-form-grid">
              <div>
                <strong>연동 유형:</strong> {transaction.relatedEntityType}
              </div>
              
              <div>
                <strong>연동 ID:</strong> #{transaction.relatedEntityId}
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '15px',
          borderTop: '1px solid #dee2e6'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--mg-secondary-500)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            닫기
          </button>
          
          {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
            <button
              onClick={() => {
                window.open(`/branch_super_admin/mapping-management?mappingId=${transaction.relatedEntityId}`, '_blank');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--mg-primary-500)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              📋 매핑 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;
