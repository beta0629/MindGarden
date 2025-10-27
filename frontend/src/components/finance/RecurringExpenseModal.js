import React, { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './RecurringExpenseModal.css';

/**
 * 반복 지출 관리 모달 컴포넌트
 * - 반복 지출 설정 및 관리
 * - 반복 지출 내역 조회
 * - 반복 지출 통계
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-30
 */
const RecurringExpenseModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: '',
        frequency: 'monthly',
        startDate: '',
        endDate: '',
        description: ''
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (isOpen) {
            // 모달이 열릴 때 body에 클래스 추가
            document.body.classList.add('modal-open');
            
            // 현재 날짜로 초기화
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                startDate: today
            }));
            
            // API 호출
            loadExpenses();
            loadStatistics();
            loadCategories();
        } else {
            // 모달이 닫힐 때 body에서 클래스 제거
            document.body.classList.remove('modal-open');
        }
        
        // 컴포넌트 언마운트 시 클래스 제거
        return () => {
            document.body.classList.remove('modal-open');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // loadExpenses, loadStatistics, loadCategories 의존성 제거하여 무한 루프 방지

    /**
     * 반복 지출 목록 로드
     */
    const loadExpenses = async () => {
        try {
            setLoading(true);
            console.log('🔄 반복 지출 목록 API 호출 시작');
            const response = await apiGet('/api/admin/recurring-expenses');
            console.log('📋 반복 지출 목록 API 응답:', response);
            if (response && response.success !== false) {
                setExpenses(response.data || []);
            }
        } catch (error) {
            console.error('❌ 반복 지출 목록 로드 실패:', error);
            notificationManager.error('반복 지출 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 반복 지출 통계 로드
     */
    const loadStatistics = async () => {
        try {
            const response = await apiGet('/api/admin/statistics/recurring-expenses');
            if (response && response.success !== false) {
                setStatistics(response.data);
            }
        } catch (error) {
            console.error('반복 지출 통계 로드 실패:', error);
        }
    };

    /**
     * 카테고리 목록 로드
     */
    const loadCategories = async () => {
        try {
            const response = await apiGet('/api/common-codes/FINANCIAL_CATEGORY');
            if (response && Array.isArray(response)) {
                setCategories(response);
            } else if (response && response.success !== false) {
                setCategories(response.data || []);
            }
        } catch (error) {
            console.error('카테고리 목록 로드 실패:', error);
        }
    };

    /**
     * 폼 데이터 변경 처리
     */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    /**
     * 폼 초기화
     */
    const resetForm = () => {
        setFormData({
            name: '',
            amount: '',
            category: '',
            frequency: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            description: ''
        });
        setEditingExpense(null);
    };

    /**
     * 새 반복 지출 추가
     */
    const handleAddExpense = () => {
        resetForm();
        setShowForm(true);
    };

    /**
     * 반복 지출 수정
     */
    const handleEditExpense = (expense) => {
        setFormData({
            name: expense.name || '',
            amount: expense.amount?.toString() || '',
            category: expense.category || '',
            frequency: expense.frequency || 'monthly',
            startDate: expense.startDate || '',
            endDate: expense.endDate || '',
            description: expense.description || ''
        });
        setEditingExpense(expense);
        setShowForm(true);
    };

    /**
     * 반복 지출 저장
     */
    const handleSaveExpense = async () => {
        if (!formData.name.trim() || !formData.amount || !formData.category) {
            notificationManager.error('필수 항목을 모두 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            let response;
            if (editingExpense) {
                response = await apiPut(`/api/admin/recurring-expenses/${editingExpense.id}`, expenseData);
            } else {
                response = await apiPost('/api/admin/recurring-expenses', expenseData);
            }
            
            if (response && response.success !== false) {
                notificationManager.success(
                    editingExpense ? '반복 지출이 수정되었습니다.' : '반복 지출이 추가되었습니다.'
                );
                loadExpenses();
                loadStatistics();
                setShowForm(false);
                resetForm();
            } else {
                throw new Error(response?.message || '반복 지출 저장에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 반복 지출 저장 실패:', error);
            notificationManager.error(error.message || '반복 지출 저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 반복 지출 삭제
     */
    const handleDeleteExpense = async (expenseId) => {
        const confirmed = await new Promise((resolve) => {
      notificationManager.confirm('정말로 이 반복 지출을 삭제하시겠습니까?', resolve);
    });
    if (!confirmed) {
        return;
    }

        try {
            setLoading(true);
            
            const response = await apiDelete(`/api/admin/recurring-expenses/${expenseId}`);
            
            if (response && response.success !== false) {
                notificationManager.success('반복 지출이 삭제되었습니다.');
                loadExpenses();
                loadStatistics();
            } else {
                throw new Error(response?.message || '반복 지출 삭제에 실패했습니다.');
            }

        } catch (error) {
            console.error('❌ 반복 지출 삭제 실패:', error);
            notificationManager.error(error.message || '반복 지출 삭제 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        if (loading) return;
        setShowForm(false);
        resetForm();
        onClose();
    };

    // 디버깅: isOpen 상태 확인
    console.log('🔍 RecurringExpenseModal 렌더링:', { 
        isOpen, 
        expensesLength: expenses.length,
        loading,
        showForm,
        editingExpense: !!editingExpense
    });
    
    if (!isOpen) return null;
    
    return (
        <div 
            className="recurring-expense-modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    console.log('🖱️ 오버레이 클릭 - 모달 닫기');
                    handleClose();
                }
            }}
        >
            <div className="recurring-expense-modal">
                <div className="recurring-expense-modal-header">
                    <h2 className="recurring-expense-modal-title">🔄 반복 지출 관리</h2>
                    <button 
                        className="recurring-expense-modal-close"
                        onClick={handleClose}
                        disabled={loading}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                <div className="recurring-expense-modal-body">
                    {/* 통계 정보 */}
                    {statistics && (
                        <div className="expense-statistics">
                            <h4>반복 지출 통계</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">총 반복 지출</span>
                                    <span className="stat-value">{statistics.totalExpenses || 0}개</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">월 총액</span>
                                    <span className="stat-value">
                                        {(statistics.monthlyTotal || 0).toLocaleString()}원
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">연 총액</span>
                                    <span className="stat-value">
                                        {(statistics.yearlyTotal || 0).toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="action-buttons">
                        <button 
                            className="btn-add"
                            onClick={handleAddExpense}
                            disabled={loading}
                        >
                            ➕ 새 반복 지출 추가
                        </button>
                    </div>

                    {/* 반복 지출 목록 */}
                    <div className="expenses-section">
                        <h4>반복 지출 목록</h4>
                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>로딩 중...</p>
                            </div>
                        ) : expenses.length > 0 ? (
                            <div className="expenses-list">
                                {expenses.map(expense => (
                                    <div key={expense.id} className="expense-item">
                                        <div className="expense-info">
                                            <div className="expense-name">{expense.name}</div>
                                            <div className="expense-details">
                                                <span className="expense-amount">
                                                    {expense.amount?.toLocaleString()}원
                                                </span>
                                                <span className="expense-frequency">
                                                    {expense.frequency === 'monthly' ? '월간' : 
                                                     expense.frequency === 'quarterly' ? '분기별' : 
                                                     expense.frequency === 'yearly' ? '연간' : expense.frequency}
                                                </span>
                                                <span className="expense-category">{expense.category}</span>
                                            </div>
                                            {expense.description && (
                                                <div className="expense-description">{expense.description}</div>
                                            )}
                                        </div>
                                        <div className="expense-actions">
                                            <button 
                                                className="btn-edit"
                                                onClick={() => handleEditExpense(expense)}
                                                disabled={loading}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="btn-delete"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                disabled={loading}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data">
                                <p>등록된 반복 지출이 없습니다.</p>
                            </div>
                        )}
                    </div>

                    {/* 반복 지출 폼 */}
                    {showForm && (
                        <div className="expense-form-overlay">
                            <div className="expense-form">
                                <div className="form-header">
                                    <h4>{editingExpense ? '반복 지출 수정' : '새 반복 지출 추가'}</h4>
                                    <button 
                                        className="form-close-btn"
                                        onClick={() => setShowForm(false)}
                                        disabled={loading}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="form-content">
                                    <div className="form-group">
                                        <label htmlFor="name">지출명 *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="예: 사무실 임대료"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="amount">금액 *</label>
                                            <input
                                                type="number"
                                                id="amount"
                                                value={formData.amount}
                                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                                placeholder="0"
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="frequency">주기 *</label>
                                            <select
                                                id="frequency"
                                                value={formData.frequency}
                                                onChange={(e) => handleInputChange('frequency', e.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="monthly">월간</option>
                                                <option value="quarterly">분기별</option>
                                                <option value="yearly">연간</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="category">카테고리 *</label>
                                        <select
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="">카테고리를 선택하세요</option>
                                            {categories.map(category => (
                                                <option key={category.codeValue} value={category.codeLabel}>
                                                    {category.codeLabel}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="startDate">시작일</label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                value={formData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="endDate">종료일</label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                value={formData.endDate}
                                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="description">설명</label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="반복 지출에 대한 추가 설명"
                                            rows={3}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button 
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => setShowForm(false)}
                                            disabled={loading}
                                        >
                                            취소
                                        </button>
                                        <button 
                                            type="button"
                                            className="btn-save"
                                            onClick={handleSaveExpense}
                                            disabled={loading}
                                        >
                                            {loading ? '저장 중...' : '저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecurringExpenseModal;
