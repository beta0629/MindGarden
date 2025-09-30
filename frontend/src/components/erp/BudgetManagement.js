import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import './ErpCommon.css';

/**
 * ERP 예산 관리 페이지
 * 예산 계획 및 관리
 */
const BudgetManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('budgets');
  const [budgets, setBudgets] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [hasDataError, setHasDataError] = useState(false);

  // 새 예산 폼 상태
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    plannedAmount: '',
    description: '',
    startDate: '',
    endDate: '',
    department: ''
  });

  // 데이터 로드
  useEffect(() => {
    if (!sessionLoading) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      // 인증이 필요한 경우 빈 배열로 설정 (데이터 없음 상태)
      if (!isLoggedIn || !user?.id) {
        setBudgets([]);
        return;
      }

      const response = await apiGet('/api/erp/budgets');
      if (response.success) {
        setBudgets(response.data || []);
      } else {
        // API 응답은 성공했지만 데이터가 없는 경우
        setBudgets([]);
      }
    } catch (err) {
      console.error('예산 로드 실패:', err);
      // API 호출 실패 시 빈 배열로 설정 (데이터 없음 상태)
      setBudgets([]);
    }
  };

  const loadBudgetCategories = async () => {
    try {
      console.log('예산 카테고리 로드 시작 - 로그인 상태:', isLoggedIn, '사용자:', user?.id);
      
      // 기본 카테고리 정의
      const defaultCategories = [
        { id: 607, codeValue: 'OPERATING', codeLabel: '운영비', codeDescription: '일반적인 운영 비용', sortOrder: 1 },
        { id: 608, codeValue: 'MARKETING', codeLabel: '마케팅', codeDescription: '마케팅 및 홍보 비용', sortOrder: 2 },
        { id: 609, codeValue: 'TRAINING', codeLabel: '교육훈련', codeDescription: '직원 교육 및 훈련 비용', sortOrder: 3 },
        { id: 610, codeValue: 'EQUIPMENT', codeLabel: '장비', codeDescription: '장비 구매 및 유지보수 비용', sortOrder: 4 },
        { id: 611, codeValue: 'TRAVEL', codeLabel: '출장비', codeDescription: '출장 및 교통비', sortOrder: 5 },
        { id: 612, codeValue: 'UTILITIES', codeLabel: '공과금', codeDescription: '전기, 가스, 수도 등 공과금', sortOrder: 6 },
        { id: 613, codeValue: 'RENT', codeLabel: '임대료', codeDescription: '사무실 및 시설 임대료', sortOrder: 7 },
        { id: 614, codeValue: 'OTHER', codeLabel: '기타', codeDescription: '기타 비용', sortOrder: 8 }
      ];

      // 인증이 필요한 경우 기본 카테고리 사용
      if (!isLoggedIn || !user?.id) {
        console.log('로그인 없이 기본 카테고리 사용');
        setBudgetCategories(defaultCategories);
        console.log('기본 카테고리 설정 완료:', defaultCategories.length, '개');
        return;
      }

      console.log('로그인 상태에서 API 호출 시도');
      try {
        const response = await apiGet('/api/common-codes/group/BUDGET_CATEGORY');
        console.log('API 응답:', response);
        
        if (response && response.success && response.data && response.data.length > 0) {
          setBudgetCategories(response.data);
          console.log('API에서 카테고리 로드 완료:', response.data.length, '개');
        } else {
          console.log('API 응답이 비어있거나 실패, 기본 카테고리 사용');
          setBudgetCategories(defaultCategories);
        }
      } catch (apiError) {
        console.error('API 호출 실패:', apiError);
        console.log('API 실패 시 기본 카테고리 사용');
        setBudgetCategories(defaultCategories);
      }
    } catch (err) {
      console.error('예산 카테고리 로드 전체 실패:', err);
      // 전체 실패 시에도 기본 카테고리 사용
      const defaultCategories = [
        { id: 607, codeValue: 'OPERATING', codeLabel: '운영비', codeDescription: '일반적인 운영 비용', sortOrder: 1 },
        { id: 608, codeValue: 'MARKETING', codeLabel: '마케팅', codeDescription: '마케팅 및 홍보 비용', sortOrder: 2 },
        { id: 609, codeValue: 'TRAINING', codeLabel: '교육훈련', codeDescription: '직원 교육 및 훈련 비용', sortOrder: 3 },
        { id: 610, codeValue: 'EQUIPMENT', codeLabel: '장비', codeDescription: '장비 구매 및 유지보수 비용', sortOrder: 4 },
        { id: 611, codeValue: 'TRAVEL', codeLabel: '출장비', codeDescription: '출장 및 교통비', sortOrder: 5 },
        { id: 612, codeValue: 'UTILITIES', codeLabel: '공과금', codeDescription: '전기, 가스, 수도 등 공과금', sortOrder: 6 },
        { id: 613, codeValue: 'RENT', codeLabel: '임대료', codeDescription: '사무실 및 시설 임대료', sortOrder: 7 },
        { id: 614, codeValue: 'OTHER', codeLabel: '기타', codeDescription: '기타 비용', sortOrder: 8 }
      ];
      setBudgetCategories(defaultCategories);
      console.log('전체 실패 시 기본 카테고리 사용:', defaultCategories.length, '개');
    }
  };

  const loadBudgetReports = async () => {
    try {
      // 예산 보고서 데이터 로드 (향후 구현)
      console.log('예산 보고서 데이터 로드');
    } catch (err) {
      console.error('예산 보고서 로드 실패:', err);
      setError('예산 보고서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleCreateBudget = async () => {
    try {
      setLoading(true);
      const response = await apiPost('/api/erp/budgets', newBudget);
      if (response.success) {
        setShowCreateModal(false);
        setNewBudget({
          name: '',
          category: '',
          plannedAmount: '',
          description: '',
          startDate: '',
          endDate: '',
          department: ''
        });
        await loadBudgets();
      } else {
        setError(response.message || '예산 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('예산 생성 실패:', err);
      setError('예산 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBudget = async (budget) => {
    try {
      setLoading(true);
      const response = await apiPut(`/api/erp/budgets/${budget.id}`, budget);
      if (response.success) {
        setEditingBudget(null);
        await loadBudgets();
      } else {
        setError(response.message || '예산 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('예산 수정 실패:', err);
      setError('예산 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('정말로 이 예산을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiDelete(`/api/erp/budgets/${budgetId}`);
      if (response.success) {
        await loadBudgets();
      } else {
        setError(response.message || '예산 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('예산 삭제 실패:', err);
      setError('예산 삭제 중 오류가 발생했습니다.');
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
      case 'ACTIVE': return 'success';
      case 'PENDING': return 'warning';
      case 'COMPLETED': return 'info';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout 
        title="예산 관리"
        loading={true}
        loadingText="세션 정보를 불러오는 중..."
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="예산 관리">
        <div className="erp-system">
          <div className="erp-container">
            <div className="erp-login-required">
              <div className="erp-login-card">
                <div className="erp-login-header">
                  <div className="erp-logo">
                    <i className="bi bi-flower1"></i>
                    <span>마인드가든</span>
                  </div>
                  <div className="erp-login-actions">
                    <button className="btn btn-outline-primary">
                      <i className="bi bi-arrow-clockwise"></i>
                      세션 새로고침
                    </button>
                    <button className="btn btn-primary">
                      <i className="bi bi-box-arrow-in-right"></i>
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
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="예산 관리">
      <div className="erp-system">
        <div className="erp-container">
          {/* 헤더 */}
          <div className="erp-header">
            <h1 className="erp-title">
              <i className="bi bi-piggy-bank"></i>
              예산 관리
            </h1>
            <p className="erp-subtitle">
              예산 계획 및 관리를 할 수 있습니다.
            </p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="erp-tabs">
            <button
              className={`erp-tab ${activeTab === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveTab('budgets')}
            >
              <i className="bi bi-list-ul"></i>
              예산 목록
            </button>
            <button
              className={`erp-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <i className="bi bi-tags"></i>
              카테고리
            </button>
            <button
              className={`erp-tab ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <i className="bi bi-graph-up"></i>
              보고서
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
                variant="pulse"
                inline={true}
              />
            </div>
          )}

            {error && hasDataError && (
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

            {!loading && !(error && hasDataError) && (
              <>
                {activeTab === 'budgets' && (
                  <div className="erp-section">
                    {/* 예산 통계 카드 */}
                    <div className="erp-stats-grid mb-4">
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-piggy-bank"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>총 예산</h3>
                          <div className="erp-stat-value">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.totalBudget || 0), 0))}
                          </div>
                        </div>
                      </div>
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-graph-up"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>사용 금액</h3>
                          <div className="erp-stat-value">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.usedBudget || 0), 0))}
                          </div>
                        </div>
                      </div>
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-wallet2"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>잔여 금액</h3>
                          <div className="erp-stat-value">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.remainingBudget || 0), 0))}
                          </div>
                        </div>
                      </div>
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-list-check"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>예산 개수</h3>
                          <div className="erp-stat-value">{budgets.length}개</div>
                        </div>
                      </div>
                    </div>

                    {/* 예산 목록 헤더 */}
                    <div className="erp-section-header">
                      <div className="erp-section-title">
                        <h2>
                          <i className="bi bi-list-ul"></i>
                          예산 목록
                        </h2>
                        <p>등록된 예산을 관리하고 모니터링할 수 있습니다.</p>
                      </div>
                      <button 
                        className="btn btn-primary erp-btn-primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <i className="bi bi-plus-circle"></i>
                        새 예산 추가
                      </button>
                    </div>
                    
                    {/* 예산 목록 */}
                    <div className="erp-budget-list">
                      {budgets.length > 0 ? (
                        <div className="erp-budget-grid">
                          {budgets.map((budget) => {
                            const usagePercentage = budget.totalBudget > 0 
                              ? ((budget.usedBudget || 0) / budget.totalBudget) * 100 
                              : 0;
                            const isOverBudget = (budget.usedBudget || 0) > budget.totalBudget;
                            
                            return (
                              <div key={budget.id} className="erp-budget-card">
                                <div className="erp-budget-header">
                                  <div className="erp-budget-title">
                                    <h3>{budget.name}</h3>
                                    <span className={`erp-budget-status ${getStatusColor(budget.status)}`}>
                                      {budget.status === 'ACTIVE' ? '활성' : budget.status}
                                    </span>
                                  </div>
                                  <div className="erp-budget-actions">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => setEditingBudget(budget)}
                                      title="수정"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteBudget(budget.id)}
                                      title="삭제"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="erp-budget-body">
                                  <div className="erp-budget-category">
                                    <i className="bi bi-tag"></i>
                                    {budget.category}
                                  </div>
                                  
                                  {budget.description && (
                                    <p className="erp-budget-description">{budget.description}</p>
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
                                      <span className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}>
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
                                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  <div className="erp-budget-period">
                                    <i className="bi bi-calendar"></i>
                                    {budget.year}년 {budget.month}월
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="erp-empty-state">
                          <div className="erp-empty-icon">
                            <i className="bi bi-piggy-bank"></i>
                          </div>
                          <h3>예산이 없습니다</h3>
                          <p>새로운 예산을 추가하여 시작해보세요.</p>
                          <button 
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                          >
                            <i className="bi bi-plus-circle"></i>
                            첫 번째 예산 추가
                          </button>
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
                          <i className="bi bi-tags"></i>
                          예산 카테고리
                        </h2>
                        <p>예산 분류를 위한 카테고리 목록입니다.</p>
                      </div>
                    </div>
                    
                    {budgetCategories.length > 0 ? (
                      <div className="erp-grid">
                        {budgetCategories.map((category) => (
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
                                  <span className="erp-label">정렬:</span>
                                  <span className="erp-value">{category.sortOrder}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="erp-empty-state">
                        <div className="erp-empty-icon">
                          <i className="bi bi-tags"></i>
                        </div>
                        <h3>예산 카테고리가 없습니다</h3>
                        <p>로그인 후 예산 카테고리를 확인할 수 있습니다.</p>
                        {!isLoggedIn && (
                          <button className="btn btn-primary">
                            <i className="bi bi-box-arrow-in-right"></i>
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
                          <i className="bi bi-graph-up"></i>
                          예산 보고서
                        </h2>
                        <p>예산 사용 현황과 통계를 확인할 수 있습니다.</p>
                      </div>
                    </div>
                    
                    {/* 통계 카드 */}
                    <div className="erp-stats-grid">
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-currency-dollar"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>총 예산</h3>
                          <div className="erp-stat-value text-primary">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.totalBudget || 0), 0))}
                          </div>
                          <small className="text-muted">전체 예산</small>
                        </div>
                      </div>
                      
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-graph-up"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>사용된 예산</h3>
                          <div className="erp-stat-value text-warning">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.usedBudget || 0), 0))}
                          </div>
                          <small className="text-muted">사용 금액</small>
                        </div>
                      </div>
                      
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-piggy-bank"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>잔여 예산</h3>
                          <div className="erp-stat-value text-success">
                            {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.remainingBudget || 0), 0))}
                          </div>
                          <small className="text-muted">잔액</small>
                        </div>
                      </div>
                      
                      <div className="erp-stat-card">
                        <div className="erp-stat-icon">
                          <i className="bi bi-percent"></i>
                        </div>
                        <div className="erp-stat-content">
                          <h3>평균 사용률</h3>
                          <div className="erp-stat-value text-info">
                            {(() => {
                              const totalBudget = budgets.reduce((sum, budget) => sum + (budget.totalBudget || 0), 0);
                              const totalUsed = budgets.reduce((sum, budget) => sum + (budget.usedBudget || 0), 0);
                              const usageRate = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;
                              return `${usageRate.toFixed(1)}%`;
                            })()}
                          </div>
                          <small className="text-muted">전체 사용률</small>
                        </div>
                      </div>
                    </div>
                    
                    {/* 카테고리별 통계 */}
                    <div className="erp-section">
                      <div className="erp-section-header">
                        <div className="erp-section-title">
                          <h3>
                            <i className="bi bi-pie-chart"></i>
                            카테고리별 예산 현황
                          </h3>
                          <p>각 카테고리별 예산 사용 현황을 확인할 수 있습니다.</p>
                        </div>
                      </div>
                      
                      {budgets.length > 0 ? (
                        <div className="erp-grid">
                          {(() => {
                            // 카테고리별로 그룹화
                            const categoryStats = {};
                            budgets.forEach(budget => {
                              const category = budget.category || '기타';
                              if (!categoryStats[category]) {
                                categoryStats[category] = {
                                  totalBudget: 0,
                                  usedBudget: 0,
                                  remainingBudget: 0,
                                  count: 0
                                };
                              }
                              categoryStats[category].totalBudget += budget.totalBudget || 0;
                              categoryStats[category].usedBudget += budget.usedBudget || 0;
                              categoryStats[category].remainingBudget += budget.remainingBudget || 0;
                              categoryStats[category].count += 1;
                            });
                            
                            return Object.entries(categoryStats).map(([category, stats]) => {
                              const usageRate = stats.totalBudget > 0 ? (stats.usedBudget / stats.totalBudget) * 100 : 0;
                              const isOverBudget = stats.usedBudget > stats.totalBudget;
                              
                              return (
                                <div key={category} className="erp-card">
                                  <div className="erp-card-header">
                                    <h4>{category}</h4>
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
                                        <span className={`erp-amount-value ${isOverBudget ? 'text-danger' : 'text-success'}`}>
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
                                          style={{ width: `${Math.min(usageRate, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div className="erp-budget-count">
                                      <i className="bi bi-list-ul"></i>
                                      {stats.count}개 예산
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
                            <i className="bi bi-pie-chart"></i>
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

          {/* 예산 생성 모달 */}
          {showCreateModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">새 예산 추가</h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowCreateModal(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">예산명</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newBudget.name}
                        onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">카테고리</label>
                      <select
                        className="form-select"
                        value={newBudget.category}
                        onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                      >
                        <option value="">카테고리 선택</option>
                        {budgetCategories.map(category => (
                          <option key={category.id} value={category.codeValue}>
                            {category.codeLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">계획 금액</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newBudget.plannedAmount}
                        onChange={(e) => setNewBudget({...newBudget, plannedAmount: e.target.value})}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">설명</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newBudget.description}
                        onChange={(e) => setNewBudget({...newBudget, description: e.target.value})}
                      ></textarea>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">시작일</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newBudget.startDate}
                            onChange={(e) => setNewBudget({...newBudget, startDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">종료일</label>
                          <input
                            type="date"
                            className="form-control"
                            value={newBudget.endDate}
                            onChange={(e) => setNewBudget({...newBudget, endDate: e.target.value})}
                          />
                        </div>
                      </div>
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
                      onClick={handleCreateBudget}
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

export default BudgetManagement;
