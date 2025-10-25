import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import './ErpCommon.css';
import notificationManager from '../../utils/notification';

/**
 * 개선된 ERP 세무 관리 페이지
 * 세금 계산, 신고, 납부 관리
 */
const ImprovedTaxManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [taxData, setTaxData] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTax, setEditingTax] = useState(null);

  // 새 세금 항목 폼 상태
  const [newTaxItem, setNewTaxItem] = useState({
    name: '',
    category: '',
    amount: '',
    taxRate: '',
    dueDate: '',
    status: 'PENDING',
    description: ''
  });

  // 데이터 로드
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'overview':
          await loadTaxOverview();
          break;
        case 'calculations':
          await loadTaxCalculations();
          break;
        case 'reports':
          await loadTaxReports();
          break;
        case 'settings':
          await loadTaxSettings();
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

  const loadTaxOverview = async () => {
    try {
      // 세금 개요 데이터 로드 (향후 구현)
      console.log('세금 개요 데이터 로드');
    } catch (err) {
      console.error('세금 개요 로드 실패:', err);
      setError('세금 개요를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxCalculations = async () => {
    try {
      const response = await apiGet('/api/admin/tax/calculations');
      if (response.success) {
        setTaxData(response.data || []);
      } else {
        setError(response.message || '세금 계산 내역을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('세금 계산 로드 실패:', err);
      setError('세금 계산 내역을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxReports = async () => {
    try {
      // 세금 보고서 데이터 로드 (향후 구현)
      console.log('세금 보고서 데이터 로드');
    } catch (err) {
      console.error('세금 보고서 로드 실패:', err);
      setError('세금 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadTaxSettings = async () => {
    try {
      const response = await apiGet('/api/common-codes/TAX_CATEGORY');
      if (response.success) {
        setTaxCategories(response.data || []);
      } else {
        setError(response.message || '세금 카테고리를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('세금 카테고리 로드 실패:', err);
      setError('세금 카테고리를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCreateTaxItem = async () => {
    try {
      setLoading(true);
      const response = await apiPost('/api/admin/tax/calculations', newTaxItem);
      if (response.success) {
        setShowCreateModal(false);
        setNewTaxItem({
          name: '',
          category: '',
          amount: '',
          taxRate: '',
          dueDate: '',
          status: 'PENDING',
          description: ''
        });
        await loadTaxCalculations();
      } else {
        setError(response.message || '세금 항목 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('세금 항목 생성 실패:', err);
      setError('세금 항목 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTaxItem = async (taxItem) => {
    try {
      setLoading(true);
      const response = await apiPut(`/api/admin/tax/calculations/${taxItem.id}`, taxItem);
      if (response.success) {
        setEditingTax(null);
        await loadTaxCalculations();
      } else {
        setError(response.message || '세금 항목 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('세금 항목 수정 실패:', err);
      setError('세금 항목 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTaxItem = async (taxItemId) => {
    const confirmed = await new Promise((resolve) => { 
      notificationManager.confirm('정말로 이 세금 항목을 삭제하시겠습니까?', resolve); 
    });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiDelete(`/api/admin/tax/calculations/${taxItemId}`);
      if (response.success) {
        await loadTaxCalculations();
      } else {
        setError(response.message || '세금 항목 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('세금 항목 삭제 실패:', err);
      setError('세금 항목 삭제 중 오류가 발생했습니다.');
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
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'CALCULATED': return 'info';
      case 'PAID': return 'success';
      case 'OVERDUE': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return '대기';
      case 'CALCULATED': return '계산완료';
      case 'PAID': return '납부완료';
      case 'OVERDUE': return '연체';
      default: return status;
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout 
        title="세무 관리"
        loading={true}
        loadingText="세션 정보를 불러오는 중..."
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="세무 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>세무 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="세무 관리">
      <div className="erp-system">
        <div className="erp-container">
          {/* 헤더 */}
          <div className="erp-header">
            <h1 className="erp-title">
              <i className="bi bi-calculator"></i>
              세무 관리
            </h1>
            <p className="erp-subtitle">
              세금 계산, 신고, 납부를 체계적으로 관리할 수 있습니다.
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="erp-tabs">
            <button
              className={`erp-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-speedometer2"></i>
              개요
            </button>
            <button
              className={`erp-tab ${activeTab === 'calculations' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculations')}
            >
              <i className="bi bi-calculator"></i>
              세금 계산
            </button>
            <button
              className={`erp-tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <i className="bi bi-file-earmark-text"></i>
              신고서
            </button>
            <button
              className={`erp-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="bi bi-gear"></i>
              설정
            </button>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="erp-content">
          {loading && (
            <div className="tax-management-loading">
              <UnifiedLoading 
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
                {activeTab === 'overview' && (
                  <div className="erp-section">
                    <h2>세무 개요</h2>
                    <div className="row">
                      <div className="col-md-3 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h3>총 세금액</h3>
                            <i className="bi bi-currency-dollar text-primary"></i>
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
                            <h3>납부 완료</h3>
                            <i className="bi bi-check-circle text-success"></i>
                          </div>
                          <div className="erp-card-body">
                            <div className="h4 text-success">0건</div>
                            <small className="text-muted">완료된 납부</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h3>대기 중</h3>
                            <i className="bi bi-clock text-warning"></i>
                          </div>
                          <div className="erp-card-body">
                            <div className="h4 text-warning">0건</div>
                            <small className="text-muted">처리 대기</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h3>연체</h3>
                            <i className="bi bi-exclamation-triangle text-danger"></i>
                          </div>
                          <div className="erp-card-body">
                            <div className="h4 text-danger">0건</div>
                            <small className="text-muted">연체된 항목</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'calculations' && (
                  <div className="erp-section">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2>세금 계산</h2>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <i className="bi bi-plus"></i>
                        세금 항목 추가
                      </button>
                    </div>
                    
                    <div className="erp-table-container">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            <th>세금명</th>
                            <th>카테고리</th>
                            <th>금액</th>
                            <th>세율</th>
                            <th>세금액</th>
                            <th>납부일</th>
                            <th>상태</th>
                            <th>액션</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taxData.length > 0 ? (
                            taxData.map((tax) => (
                              <tr key={tax.id}>
                                <td>
                                  <div>
                                    <strong>{tax.name}</strong>
                                    {tax.description && (
                                      <div className="text-muted small">{tax.description}</div>
                                    )}
                                  </div>
                                </td>
                                <td>{tax.category}</td>
                                <td className="text-end">{formatCurrency(tax.amount)}</td>
                                <td className="text-end">{tax.taxRate}%</td>
                                <td className="text-end fw-bold text-primary">
                                  {formatCurrency(tax.amount * (tax.taxRate / 100))}
                                </td>
                                <td>{formatDate(tax.dueDate)}</td>
                                <td>
                                  <span className={`erp-status ${getStatusColor(tax.status)}`}>
                                    {getStatusLabel(tax.status)}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => setEditingTax(tax)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteTaxItem(tax.id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8" className="text-center py-4">
                                <div className="text-muted">
                                  <i className="bi bi-calculator tax-management-empty-icon"></i>
                                  <p className="mt-2 mb-0">세금 항목이 없습니다.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'reports' && (
                  <div className="erp-section">
                    <h2>세금 신고서</h2>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h3>부가가치세 신고</h3>
                            <i className="bi bi-file-earmark-text text-primary"></i>
                          </div>
                          <div className="erp-card-body">
                            <p className="erp-description">분기별 부가가치세 신고서 작성 및 제출</p>
                            <div className="erp-details">
                              <div className="erp-detail">
                                <span className="erp-label">다음 신고일:</span>
                                <span className="erp-value">2025-01-25</span>
                              </div>
                              <div className="erp-detail">
                                <span className="erp-label">상태:</span>
                                <span className="erp-value">준비 중</span>
                              </div>
                            </div>
                          </div>
                          <div className="erp-card-footer">
                            <button className="btn btn-primary btn-sm">
                              <i className="bi bi-file-earmark-plus"></i>
                              신고서 작성
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="erp-card">
                          <div className="erp-card-header">
                            <h3>소득세 신고</h3>
                            <i className="bi bi-file-earmark-text text-success"></i>
                          </div>
                          <div className="erp-card-body">
                            <p className="erp-description">연말정산 및 소득세 신고서 작성</p>
                            <div className="erp-details">
                              <div className="erp-detail">
                                <span className="erp-label">신고 기간:</span>
                                <span className="erp-value">2025-01-01 ~ 2025-12-31</span>
                              </div>
                              <div className="erp-detail">
                                <span className="erp-label">상태:</span>
                                <span className="erp-value">진행 중</span>
                              </div>
                            </div>
                          </div>
                          <div className="erp-card-footer">
                            <button className="btn btn-success btn-sm">
                              <i className="bi bi-file-earmark-check"></i>
                              신고서 확인
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="erp-section">
                    <h2>세무 설정</h2>
                    <div className="erp-grid">
                      {taxCategories.map((category) => (
                        <div key={category.id} className="erp-card">
                          <div className="erp-card-header">
                            <h3>{category.codeLabel}</h3>
                            <span className="erp-status success">활성</span>
                          </div>
                          <div className="erp-card-body">
                            <p className="erp-description">{category.codeDescription}</p>
                            <div className="erp-details">
                              <div className="erp-detail">
                                <span className="erp-label">코드:</span>
                                <span className="erp-value">{category.codeValue}</span>
                              </div>
                              <div className="erp-detail">
                                <span className="erp-label">세율:</span>
                                <span className="erp-value">
                                  {(() => {
                                    try {
                                      if (category.extraData) {
                                        const extraData = JSON.parse(category.extraData);
                                        return extraData.taxRate || 'N/A';
                                      }
                                      return 'N/A';
                                    } catch (e) {
                                      return 'N/A';
                                    }
                                  })()}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 세금 항목 생성 모달 */}
          {showCreateModal && (
            <div className="modal show d-block tax-management-modal-backdrop">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">새 세금 항목 추가</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowCreateModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">세금명</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTaxItem.name}
                        onChange={(e) => setNewTaxItem({...newTaxItem, name: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">카테고리</label>
                      <select
                        className="form-select"
                        value={newTaxItem.category}
                        onChange={(e) => setNewTaxItem({...newTaxItem, category: e.target.value})}
                      >
                        <option value="">카테고리 선택</option>
                        {taxCategories.map(category => (
                          <option key={category.id} value={category.codeValue}>
                            {category.codeLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">금액</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newTaxItem.amount}
                            onChange={(e) => setNewTaxItem({...newTaxItem, amount: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">세율 (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={newTaxItem.taxRate}
                            onChange={(e) => setNewTaxItem({...newTaxItem, taxRate: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">납부일</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newTaxItem.dueDate}
                        onChange={(e) => setNewTaxItem({...newTaxItem, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">설명</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newTaxItem.description}
                        onChange={(e) => setNewTaxItem({...newTaxItem, description: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowCreateModal(false)}
                    >
                      취소
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleCreateTaxItem}
                      disabled={loading}
                    >
                      {loading ? '생성 중...' : '생성'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ImprovedTaxManagement;
