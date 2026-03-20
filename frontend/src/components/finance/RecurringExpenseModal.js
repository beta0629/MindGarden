import React, { useState, useEffect } from 'react';
import { RefreshCw, XCircle, Plus, Edit2, Trash2, DollarSign, Calendar, FileText } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import BadgeSelect from '../common/BadgeSelect';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * 반복 지출 관리 모달 컴포넌트
/**
 * - 반복 지출 설정 및 관리
/**
 * - 반복 지출 내역 조회
/**
 * - 반복 지출 통계
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // loadExpenses, loadStatistics, loadCategories 의존성 제거하여 무한 루프 방지

/**
     * 반복 지출 목록 로드
     */
    const loadExpenses = async () => {
        try {
            setLoading(true);
            console.log('🔄 반복 지출 목록 API 호출 시작');
            const response = await apiGet('/api/v1/admin/recurring-expenses');
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
            const response = await apiGet('/api/v1/admin/statistics/recurring-expenses');
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
            const response = await apiGet('/api/v1/common-codes?codeGroup=FINANCIAL_CATEGORY');
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
                response = await apiPost('/api/v1/admin/recurring-expenses', expenseData);
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

    if (!isOpen) {
        return null;
    }

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title="반복 지출 관리"
            size="large"
            loading={loading}
            backdropClick={!loading}
            showCloseButton={true}
        >
                    {/* 통계 정보 */}
                    {statistics && (
                        <div className="mg-v2-info-box mg-v2-mb-lg">
                            <h4 className="mg-v2-info-box-title">
                                <RefreshCw size={20} className="mg-v2-section-title-icon" />
                                반복 지출 통계
                            </h4>
                            <div className="mg-v2-info-grid">
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">총 반복 지출</span>
                                    <span className="mg-v2-info-value">{toDisplayString(statistics.totalExpenses ?? 0)}개</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSign size={16} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">월 총액</span>
                                    <span className="mg-v2-info-value">
                                        {(statistics.monthlyTotal || 0).toLocaleString()}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <DollarSign size={16} className="mg-v2-icon-inline" />
                                    <span className="mg-v2-info-label">연 총액</span>
                                    <span className="mg-v2-info-value">
                                        {(statistics.yearlyTotal || 0).toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="mg-v2-mb-md">
                        <button 
                            className="mg-v2-button mg-v2-button--primary"
                            onClick={handleAddExpense}
                            disabled={loading}
                        >
                            <Plus size={20} className="mg-v2-icon-inline" />
                            새 반복 지출 추가
                        </button>
                    </div>

                    {/* 반복 지출 목록 */}
                    <div className="mg-v2-form-section">
                        <h4 className="mg-v2-section-title mg-v2-mb-md">반복 지출 목록</h4>
                        {loading ? (
                            <div className="mg-v2-loading-overlay">
                                <div className="mg-loading">로딩중...</div>
                            </div>
                        ) : expenses.length > 0 ? (
                            <div className="mg-v2-list-container">
                                {expenses.map(expense => (
                                    <div key={expense.id} className="mg-v2-list-item">
                                        <div className="mg-v2-list-item-content">
                                            <div className="mg-v2-list-item-title"><SafeText>{expense.name}</SafeText></div>
                                            <div className="mg-v2-list-item-subtitle">
                                                <SafeText>
                                                  {expense.amount != null ? `${expense.amount.toLocaleString()}원` : '—'}
                                                </SafeText>
                                                {' · '}
                                                <SafeText>
                                                  {expense.frequency === 'monthly' ? '월간'
                                                    : expense.frequency === 'quarterly' ? '분기별'
                                                      : expense.frequency === 'yearly' ? '연간' : expense.frequency}
                                                </SafeText>
                                                {' · '}
                                                <SafeText>{expense.category}</SafeText>
                                            </div>
                                            {expense.description && (
                                                <div className="mg-v2-list-item-description"><SafeText>{expense.description}</SafeText></div>
                                            )}
                                        </div>
                                        <div className="mg-v2-list-item-actions">
                                            <button 
                                                className="mg-v2-button mg-v2-button--icon"
                                                onClick={() => handleEditExpense(expense)}
                                                disabled={loading}
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button 
                                                className="mg-v2-button mg-v2-button--icon mg-v2-button--danger"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mg-v2-empty-state">
                                <p>등록된 반복 지출이 없습니다.</p>
                            </div>
                        )}
                    </div>

                    {/* 반복 지출 폼 - 중첩 모달 */}
                    {showForm && (
                        <UnifiedModal
                            isOpen={showForm}
                            onClose={() => setShowForm(false)}
                            title={editingExpense ? '반복 지출 수정' : '새 반복 지출 추가'}
                            size="medium"
                            loading={loading}
                            zIndex={1050}
                            actions={
                                <>
                                    <button
                                        type="button"
                                        className="mg-v2-button mg-v2-button--secondary"
                                        onClick={() => setShowForm(false)}
                                        disabled={loading}
                                    >
                                        <XCircle size={20} className="mg-v2-icon-inline" />
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        className="mg-v2-button mg-v2-button--primary"
                                        onClick={handleSaveExpense}
                                        disabled={loading}
                                    >
                                        {loading ? <div className="mg-loading">로딩중...</div> : (
                                            <>
                                                <Edit2 size={20} className="mg-v2-icon-inline" />
                                                저장
                                            </>
                                        )}
                                    </button>
                                </>
                            }
                        >
                                    <div className="mg-v2-form-group">
                                        <label htmlFor="name" className="mg-v2-form-label">
                                            지출명 <span className="mg-v2-form-label-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="예: 사무실 임대료"
                                            disabled={loading}
                                            className="mg-v2-form-input"
                                        />
                                    </div>

                                    <div className="mg-v2-form-row">
                                        <div className="mg-v2-form-group">
                                            <label htmlFor="amount" className="mg-v2-form-label">
                                                금액 <span className="mg-v2-form-label-required">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                id="amount"
                                                value={formData.amount}
                                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                                placeholder="0"
                                                disabled={loading}
                                                className="mg-v2-form-input"
                                            />
                                        </div>

                                        <div className="mg-v2-form-group">
                                            <label htmlFor="frequency" className="mg-v2-form-label">
                                                주기 <span className="mg-v2-form-label-required">*</span>
                                            </label>
                                            <BadgeSelect
                                                value={formData.frequency}
                                                onChange={(val) => handleInputChange('frequency', val)}
                                                options={[
                                                    { value: 'monthly', label: '월간' },
                                                    { value: 'quarterly', label: '분기별' },
                                                    { value: 'yearly', label: '연간' }
                                                ]}
                                                placeholder="선택하세요"
                                                disabled={loading}
                                                className="mg-v2-form-badge-select"
                                            />
                                        </div>
                                    </div>

                                    <div className="mg-v2-form-group">
                                        <label htmlFor="category" className="mg-v2-form-label">
                                            카테고리 <span className="mg-v2-form-label-required">*</span>
                                        </label>
                                        <BadgeSelect
                                            value={formData.category}
                                            onChange={(val) => handleInputChange('category', val)}
                                            options={[
                                                { value: '', label: '카테고리를 선택하세요' },
                                                ...categories.map(category => ({
                                                    value: category.codeLabel,
                                                    label: category.codeLabel
                                                }))
                                            ]}
                                            placeholder="카테고리를 선택하세요"
                                            disabled={loading}
                                            className="mg-v2-form-badge-select"
                                        />
                                    </div>

                                    <div className="mg-v2-form-row">
                                        <div className="mg-v2-form-group">
                                            <label htmlFor="startDate" className="mg-v2-form-label">
                                                <Calendar size={16} className="mg-v2-form-label-icon" />
                                                시작일
                                            </label>
                                            <input
                                                type="date"
                                                id="startDate"
                                                value={formData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                disabled={loading}
                                                className="mg-v2-form-input"
                                            />
                                        </div>

                                        <div className="mg-v2-form-group">
                                            <label htmlFor="endDate" className="mg-v2-form-label">
                                                <Calendar size={16} className="mg-v2-form-label-icon" />
                                                종료일
                                            </label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                value={formData.endDate}
                                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                                disabled={loading}
                                                className="mg-v2-form-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="mg-v2-form-group">
                                        <label htmlFor="description" className="mg-v2-form-label">
                                            <FileText size={16} className="mg-v2-form-label-icon" />
                                            설명
                                        </label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="반복 지출에 대한 추가 설명"
                                            rows={3}
                                            disabled={loading}
                                            className="mg-v2-form-textarea"
                                        />
                                    </div>
                        </UnifiedModal>
                    )}
        </UnifiedModal>
    );
};

export default RecurringExpenseModal;
