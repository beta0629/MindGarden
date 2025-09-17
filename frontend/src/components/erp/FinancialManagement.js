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

  // 데이터 로드
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab, pagination.currentPage]);

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
      const response = await apiGet(`/api/admin/financial-transactions?page=${pagination.currentPage}&size=${pagination.size}`);
      if (response.success) {
        setTransactions(response.data || []);
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
                              <td>#{transaction.id}</td>
                              <td>
                                <span className="erp-badge">
                                  {transaction.transactionType}
                                </span>
                              </td>
                              <td>{transaction.category}</td>
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
    </SimpleLayout>
  );
};

export default FinancialManagement;
