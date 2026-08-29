import React, { useState, useEffect } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';
import BadgeSelect from '../common/BadgeSelect';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import { toDisplayString } from '../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: ERP recurring-expenses API (운영자 장부와 동일)
const API_ERP_RECURRING_EXPENSES = '/api/v1/erp/recurring-expenses';
const API_ERP_RECURRING_EXPENSE_BY_ID = (id) => `/api/v1/erp/recurring-expenses/${id}`;
const API_ERP_RECURRING_STATUS = '/api/v1/erp/recurring-expenses/status';
const API_ERP_COMMON_CODES_FINANCIAL = '/api/v1/erp/common-codes/financial';


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
    const { t } = useTranslation(['erp', 'common']);
    const [confirm, ConfirmModal] = useConfirm();
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [formData, setFormData] = useState({
        expenseName: '',
        amount: '',
        category: '',
        recurrenceType: 'MONTHLY',
        recurrenceDay: '1',
        startDate: '',
        endDate: '',
        description: '',
        isActive: true
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
    const loadExpenses = async() => {
        try {
            setLoading(true);
            console.log('🔄 반복 지출 목록 API 호출 시작');
            const response = await apiGet(API_ERP_RECURRING_EXPENSES);
            console.log('📋 반복 지출 목록 API 응답:', response);
            if (response && response.success !== false) {
                const list = response.data?.expenses || response.data || [];
                setExpenses(Array.isArray(list) ? list : []);
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
    const loadStatistics = async() => {
        try {
            const response = await apiGet(API_ERP_RECURRING_STATUS);
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
    const loadCategories = async() => {
        try {
            const response = await apiGet(API_ERP_COMMON_CODES_FINANCIAL);
            if (response && response.success !== false) {
                setCategories(response.data?.expenseCategories || []);
            } else if (response && Array.isArray(response?.expenseCategories)) {
                setCategories(response.expenseCategories);
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
            expenseName: '',
            amount: '',
            category: '',
            recurrenceType: 'MONTHLY',
            recurrenceDay: '1',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            description: '',
            isActive: true
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
            expenseName: expense.expenseName || '',
            amount: expense.amount?.toString() || '',
            category: expense.category || '',
            recurrenceType: expense.recurrenceType || 'MONTHLY',
            recurrenceDay: String(expense.recurrenceDay ?? 1),
            startDate: expense.startDate || '',
            endDate: expense.endDate || '',
            description: expense.description || '',
            isActive: expense.isActive !== false
        });
        setEditingExpense(expense);
        setShowForm(true);
    };

/**
     * 반복 지출 저장
     */
    const handleSaveExpense = async() => {
        if (!formData.expenseName.trim() || !formData.amount || !formData.category) {
            notificationManager.error('필수 항목을 모두 입력해주세요.');
            return;
        }

        try {
            setLoading(true);

            const expenseData = {
                expenseName: formData.expenseName.trim(),
                amount: parseFloat(formData.amount),
                category: formData.category,
                expenseType: formData.category,
                recurrenceType: formData.recurrenceType || 'MONTHLY',
                recurrenceDay: Number(formData.recurrenceDay) || 1,
                startDate: formData.startDate,
                endDate: formData.endDate || null,
                description: formData.description || '',
                autoProcess: true,
                isActive: formData.isActive !== false,
                isVatApplicable: true
            };

            let response;
            if (editingExpense) {
                response = await apiPut(API_ERP_RECURRING_EXPENSE_BY_ID(editingExpense.id), expenseData);
            } else {
                response = await apiPost(API_ERP_RECURRING_EXPENSES, expenseData);
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
    const handleDeleteExpense = async(expenseId) => {
        const confirmed = await confirm({
            messageKey: 'erp:finance.recurringExpense.confirm.delete',
            variant: 'danger'
        });
        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            
            const response = await apiDelete(API_ERP_RECURRING_EXPENSE_BY_ID(expenseId));
            
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
        <>
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
                                반복 지출 통계
                            </h4>
                            <div className="mg-v2-info-grid">
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">총 반복 지출</span>
                                    <span className="mg-v2-info-value">{toDisplayString(statistics.totalExpenses ?? 0)}개</span>
                                </div>
                                <div className="mg-v2-info-item">
                                    <span className="mg-v2-info-label">월 총액</span>
                                    <span className="mg-v2-info-value">
                                        {(statistics.monthlyTotal || 0).toLocaleString()}원
                                    </span>
                                </div>
                                <div className="mg-v2-info-item">
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
                        <MGButton
                            className={buildErpMgButtonClassName({
                                variant: 'primary',
                                size: 'md',
                                loading: false,
                                className: 'mg-v2-button--primary'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={handleAddExpense}
                            disabled={loading}
                            variant="primary"
                        >
                            새 반복 지출 추가
                        </MGButton>
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
                                            <div className="mg-v2-list-item-title"><SafeText>{expense.expenseName}</SafeText></div>
                                            <div className="mg-v2-list-item-subtitle">
                                                <SafeText>
                                                  {expense.amount != null ? `${expense.amount.toLocaleString()}원` : '—'}
                                                </SafeText>
                                                {' · '}
                                                <SafeText>
                                                  {expense.recurrenceType === 'MONTHLY' ? '월간'
                                                    : expense.recurrenceType === 'QUARTERLY' ? '분기별'
                                                      : expense.recurrenceType === 'YEARLY' ? '연간' : expense.recurrenceType}
                                                </SafeText>
                                                {' · '}
                                                <SafeText>{expense.category}</SafeText>
                                            </div>
                                            {expense.description && (
                                                <div className="mg-v2-list-item-description"><SafeText>{expense.description}</SafeText></div>
                                            )}
                                        </div>
                                        <div className="mg-v2-list-item-actions">
                                            <MGButton
                                                className={buildErpMgButtonClassName({
                                                    variant: 'outline',
                                                    size: 'sm',
                                                    loading: false,
                                                    className: 'mg-v2-button--icon'
                                                })}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handleEditExpense(expense)}
                                                disabled={loading}
                                                variant="outline"
                                                size="small"
                                                title={t('common.actions.edit')}
                                                preventDoubleClick={false}
                                            >
                                                {t('common.actions.edit')}
                                            </MGButton>
                                            <MGButton
                                                className={buildErpMgButtonClassName({
                                                    variant: 'danger',
                                                    size: 'sm',
                                                    loading: false,
                                                    className: 'mg-v2-button--icon mg-v2-button--danger'
                                                })}
                                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                disabled={loading}
                                                variant="danger"
                                                size="small"
                                                title={t('common.actions.delete')}
                                                preventDoubleClick={false}
                                            >
                                                 {t('common.actions.delete')}
                                            </MGButton>
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
                                <ActionBar align="end" gap="md">
                                    <ActionBarButton
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                        disabled={loading}
                                    >
                                        {t('common.actions.cancel')}
                                    </ActionBarButton>
                                    <ActionBarButton
                                        variant="primary"
                                        onClick={handleSaveExpense}
                                        loading={loading}
                                    >
                                        {t('common.actions.save')}
                                    </ActionBarButton>
                                </ActionBar>
                            }
                        >
                                    <div className="mg-v2-form-group">
                                        <label htmlFor="expenseName" className="mg-v2-form-label">
                                            지출명 <span className="mg-v2-form-label-required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="expenseName"
                                            value={formData.expenseName}
                                            onChange={(e) => handleInputChange('expenseName', e.target.value)}
                                            placeholder="예: 사무실 임대료"
                                            disabled={loading}
                                            className="mg-v2-form-input"
                                        />
                                    </div>

                                    <div className="mg-v2-form-row">
                                        <div className="mg-v2-form-group">
                                            <label htmlFor="amount" className="mg-v2-form-label">
                                                금액 (부가세 포함) <span className="mg-v2-form-label-required">*</span>
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
                                            <label htmlFor="recurrenceDay" className="mg-v2-form-label">
                                                매월 N일 <span className="mg-v2-form-label-required">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                id="recurrenceDay"
                                                min="1"
                                                max="31"
                                                value={formData.recurrenceDay}
                                                onChange={(e) => handleInputChange('recurrenceDay', e.target.value)}
                                                disabled={loading}
                                                className="mg-v2-form-input"
                                            />
                                        </div>
                                    </div>

                                    <input type="hidden" value={formData.recurrenceType} readOnly />

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
                                                    value: category.codeValue,
                                                    label: category.codeLabel || category.codeValue
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
                                            {t('common.labels.description')}
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
        <ConfirmModal />
        </>
    );
};

export default RecurringExpenseModal;
