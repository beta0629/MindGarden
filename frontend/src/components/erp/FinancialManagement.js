import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
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
  
  // 필터 상태 추가
  const [filters, setFilters] = useState({
    transactionType: 'ALL', // ALL, INCOME, EXPENSE
    category: 'ALL', // ALL, CONSULTATION, SALARY, etc.
    relatedEntityType: 'ALL', // ALL, CONSULTANT_CLIENT_MAPPING, PAYMENT, etc.
    dateRange: 'ALL', // ALL, TODAY, WEEK, MONTH, CUSTOM
    startDate: '',
    endDate: '',
    searchText: '' // 상담사명, 내담자명, 설명 검색
  });
  
  // 선택된 거래 상세 정보 모달
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab, pagination.currentPage]);

  // 필터 변경 시 데이터 다시 로드
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
      // 필터 파라미터 구성
      const params = new URLSearchParams({
        page: pagination.currentPage,
        size: pagination.size
      });
      
      // 필터 적용
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
      
      const response = await apiGet(`/api/admin/financial-transactions?${params.toString()}`);
      if (response.success) {
        // 클라이언트 사이드 필터링 (서버 사이드 필터링이 완전하지 않은 경우 백업)
        let filteredTransactions = response.data || [];
        
        // 검색 텍스트 필터링
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
      } else {
        setError(response.message || '재무 거래 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('재무 거래 로드 실패:', err);
      setError('재무 거래 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadDashboard = async () => {
    try {
      // 대시보드 데이터 로드 (향후 구현)
      console.log('대시보드 데이터 로드');
    } catch (err) {
      console.error('대시보드 로드 실패:', err);
      setError('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
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

  if (sessionLoading) {
    return (
      <SimpleLayout 
        title="재무 관리"
        loading={true}
        loadingText="세션 정보를 불러오는 중..."
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="재무 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>재무 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="재무 관리">
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
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '40px'
            }}>
              <LoadingSpinner 
                text="데이터를 불러오는 중..."
                size="medium"
                variant="default"
                inline={true}
              />
            </div>
          )}

          {error && (
            <div className="erp-error">
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
              <button className="btn btn-outline-primary" onClick={loadData}>
                <i className="bi bi-arrow-clockwise"></i>
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'transactions' && (
                <div className="erp-section">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>재무 거래 내역</h2>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary">
                        <i className="bi bi-plus"></i>
                        거래 추가
                      </button>
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-download"></i>
                        내보내기
                      </button>
                    </div>
                  </div>

                  {/* 필터 섹션 */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #dee2e6'
                  }}>
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#495057' }}>
                      🔍 필터 및 검색
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      {/* 거래 유형 필터 */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                          거래 유형
                        </label>
                        <select
                          value={filters.transactionType}
                          onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="ALL">전체</option>
                          <option value="INCOME">💰 수입</option>
                          <option value="EXPENSE">💸 지출</option>
                        </select>
                      </div>
                      
                      {/* 카테고리 필터 */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                          카테고리
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
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
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                          연동 유형
                        </label>
                        <select
                          value={filters.relatedEntityType}
                          onChange={(e) => setFilters(prev => ({ ...prev, relatedEntityType: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
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
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                          검색
                        </label>
                        <input
                          type="text"
                          placeholder="상담사명, 내담자명, 설명 검색..."
                          value={filters.searchText}
                          onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
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
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔄 필터 초기화
                      </button>
                      
                      <button
                        onClick={() => loadData()}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        🔍 검색
                      </button>
                    </div>
                  </div>
                  
                  <div className="erp-table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>거래 번호</th>
                          <th>거래 유형</th>
                          <th>카테고리</th>
                          <th>금액</th>
                          <th>상태</th>
                          <th>거래일</th>
                          <th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length > 0 ? (
                          transactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setSelectedTransaction(transaction);
                                      setShowDetailModal(true);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#007bff',
                                      textDecoration: 'underline',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    #{transaction.id}
                                  </button>
                                  {/* 매핑 연동 거래 표시 */}
                                  {(transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' || 
                                    transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' ||
                                    transaction.description?.includes('상담료 입금 확인') ||
                                    transaction.description?.includes('상담료 환불')) && (
                                    <span style={{
                                      fontSize: '10px',
                                      padding: '2px 6px',
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      borderRadius: '10px',
                                      fontWeight: '600'
                                    }}>
                                      🔗 매핑연동
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className="erp-badge">
                                  {transaction.transactionType}
                                </span>
                              </td>
                              <td>
                                <div>
                                  {transaction.category}
                                  {/* 매핑 연동 거래 세부 정보 */}
                                  {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING' && (
                                    <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
                                      💰 입금확인 자동생성
                                    </div>
                                  )}
                                  {transaction.relatedEntityType === 'CONSULTANT_CLIENT_MAPPING_REFUND' && (
                                    <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '2px' }}>
                                      📤 환불처리 자동생성
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="text-end">
                                <span className={`fw-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                                </span>
                              </td>
                              <td>
                                <span className={`erp-status ${transaction.status?.toLowerCase()}`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td>{formatDate(transaction.transactionDate)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-outline-primary">
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-secondary">
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center py-4">
                              <div className="text-muted">
                                <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                                <p className="mt-2 mb-0">거래 내역이 없습니다.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                          <div className="h4 text-success">₩0</div>
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
                          <div className="h4 text-danger">₩0</div>
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
                          <div className="h4 text-primary">₩0</div>
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
                          <div className="h4 text-info">{pagination.totalElements}</div>
                          <small className="text-muted">전체</small>
                        </div>
                      </div>
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
    </SimpleLayout>
  );
};

// 거래 상세 정보 모달 컴포넌트
const TransactionDetailModal = ({ transaction, onClose }) => {
  const [mappingDetail, setMappingDetail] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const formatCurrency = (amount) => {
    if (!amount) return '0원';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '15px',
          borderBottom: '2px solid #f1f3f4'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            💰 거래 상세 정보 #{transaction.id}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {/* 기본 거래 정보 */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#495057' }}>
            📊 기본 정보
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <strong>거래 유형:</strong>
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: transaction.transactionType === 'INCOME' ? '#d4edda' : '#f8d7da',
                color: transaction.transactionType === 'INCOME' ? '#155724' : '#721c24'
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
                fontSize: '16px',
                fontWeight: 'bold',
                color: transaction.transactionType === 'INCOME' ? '#28a745' : '#dc3545'
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
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #1976d2'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#1976d2' }}>
              🔗 매핑 연동 정보
            </h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>로딩 중...</div>
              </div>
            ) : mappingDetail ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <span style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                    {formatCurrency(mappingDetail.packagePrice)}
                  </span>
                </div>
                
                <div style={{ gridColumn: 'span 2' }}>
                  <strong>결제 금액:</strong>
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '14px', 
                    color: mappingDetail.packagePrice === mappingDetail.paymentAmount ? '#28a745' : '#dc3545'
                  }}>
                    {formatCurrency(mappingDetail.paymentAmount)}
                    {mappingDetail.packagePrice !== mappingDetail.paymentAmount && (
                      <span style={{ fontSize: '12px', color: '#dc3545', marginLeft: '4px' }}>
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
                      fontSize: '12px',
                      backgroundColor: mappingDetail.isConsistent ? '#d4edda' : '#f8d7da',
                      color: mappingDetail.isConsistent ? '#155724' : '#721c24'
                    }}>
                      {mappingDetail.isConsistent ? '✅ 정상' : '⚠️ 불일치'}
                    </span>
                    {!mappingDetail.isConsistent && (
                      <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
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
                          fontSize: '12px',
                          padding: '4px 8px',
                          backgroundColor: '#f1f3f4',
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
              <div style={{ textAlign: 'center', color: '#666' }}>
                매핑 정보를 불러올 수 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 기타 연동 정보 */}
        {transaction.relatedEntityType && transaction.relatedEntityType !== 'CONSULTANT_CLIENT_MAPPING' && (
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '2px solid #ffc107'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#856404' }}>
              🔗 연동 정보
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              backgroundColor: '#6c757d',
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
                backgroundColor: '#007bff',
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
