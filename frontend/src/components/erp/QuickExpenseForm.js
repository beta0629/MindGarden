import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import { getLucideIcon } from '../../utils/iconUtils';
import UnifiedModal from '../common/modals/UnifiedModal';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import './QuickExpenseForm.css';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { ErpSafeText } from './common';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';

/**
 * 빠른 지출 등록 컴포넌트 (UnifiedModal + 모달 내 금액 입력)
 */
const QuickExpenseForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    loadExpenseCodes();
  }, []);

  const loadExpenseCodes = async () => {
    try {
      setLoadingCodes(true);
      const response = await csrfTokenManager.get('/api/v1/erp/common-codes/financial');
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success) {
        setExpenseCategories(body.data.expenseCategories || []);
        setExpenseSubcategories(body.data.expenseSubcategories || []);
      } else if (!response.ok) {
        setError(body.message || '공통 코드를 불러오는데 실패했습니다.');
        notificationManager.error('공통 코드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('지출 공통 코드 로드 실패:', err);
      setError('공통 코드를 불러오는데 실패했습니다.');
      notificationManager.error('공통 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCodes(false);
    }
  };

  const getQuickExpenses = () => {
    const quickExpenseConfigs = [
      { categoryCode: 'SALARY', subcategoryCode: 'CONSULTANT_SALARY', icon: 'DollarSign', color: 'var(--mg-error-500)' },
      { categoryCode: 'RENT', subcategoryCode: 'OFFICE_RENT', icon: 'Building2', color: 'var(--mg-finance-dark)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'ELECTRICITY', icon: 'Zap', color: 'var(--mg-finance-primary)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'WATER', icon: 'Droplet', color: 'var(--mg-primary-500)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'GAS', icon: 'Flame', color: 'var(--mg-error-500)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'INTERNET', icon: 'Globe', color: 'var(--mg-purple-500)' },
      { categoryCode: 'TAX', subcategoryCode: 'INCOME_TAX', icon: 'ClipboardList', color: 'var(--mg-purple-500)' },
      { categoryCode: 'TAX', subcategoryCode: 'CORPORATE_TAX', icon: 'BarChart3', color: 'var(--mg-purple-600)' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'STATIONERY', icon: 'FileText', color: 'var(--mg-primary-500)' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'EQUIPMENT', icon: 'Monitor', color: 'var(--mg-color-text-main)' },
      { categoryCode: 'MARKETING', subcategoryCode: 'ONLINE_ADS', icon: 'Megaphone', color: 'var(--mg-success-500)' },
      { categoryCode: 'MARKETING', subcategoryCode: 'PROMOTION', icon: 'TrendingUp', color: 'var(--mg-success-600)' }
    ];

    return quickExpenseConfigs.map(config => {
      const category = expenseCategories.find(cat => cat.codeValue === config.categoryCode);
      const subcategory = expenseSubcategories.find(sub => sub.codeValue === config.subcategoryCode);

      return {
        ...config,
        category,
        subcategory,
        displayName: category ? category.codeLabel : config.categoryCode,
        subDisplayName: subcategory ? subcategory.codeLabel : config.subcategoryCode
      };
    }).filter(item => item.category && item.subcategory);
  };

  const submitQuickExpense = async () => {
    if (!selectedExpense) return;
    const category = selectedExpense.category;
    const subcategory = selectedExpense.subcategory;
    const categoryCode = selectedExpense.categoryCode;
    const subcategoryCode = selectedExpense.subcategoryCode;

    const amount = Number.parseFloat(amountInput, 10);
    if (!amountInput.trim() || isNaN(amount) || amount <= 0) {
      setError('올바른 금액을 입력해주세요.');
      notificationManager.warning('올바른 금액을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        category: categoryCode,
        subcategory: subcategoryCode,
        amount: String(amount),
        description: `${category.codeLabel} 지출`,
        transactionDate: formatLocalDateYmd(new Date())
      });
      const response = await csrfTokenManager.fetchWithCsrf(
        `/api/v1/erp/finance/quick-expense?${params.toString()}`,
        { method: 'POST' }
      );
      const responseData = await response.json().catch(() => ({}));

      if (response.ok && responseData.success) {
        const taxInfo = responseData?.data ?? {};
        const isVatApplicable = categoryCode !== 'SALARY';
        let successMessage = `${category.codeLabel} 지출이 등록되었습니다.`;
        if (isVatApplicable && (taxInfo.taxAmount != null || taxInfo.amount != null)) {
          const totalAmount = taxInfo.amount ?? amount;
          successMessage += ` (총 ${Number(totalAmount).toLocaleString()}원)`;
        }
        notificationManager.show(successMessage, 'success', 3000);
        onSuccess?.(responseData.data);
        onClose?.();
      } else {
        const msg = responseData.message || '지출 등록에 실패했습니다.';
        setError(msg);
        notificationManager.show(msg, 'error', 4000);
      }
    } catch (err) {
      const msg = err?.message || '지출 등록 중 오류가 발생했습니다.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  const openAmountForm = (expense) => {
    setSelectedExpense(expense);
    setAmountInput('');
    setError(null);
  };

  const closeAmountForm = () => {
    setSelectedExpense(null);
    setAmountInput('');
    setError(null);
  };

  const isVatApplicable = selectedExpense ? selectedExpense.categoryCode !== 'SALARY' : false;

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      title="빠른 지출 등록"
      size="medium"
      backdropClick={true}
      showCloseButton={true}
      className="mg-v2-ad-b0kla"
    >
      {error && (
        <SafeErrorDisplay error={error} variant="inline" className="quick-expense-error" />
      )}

      {loadingCodes ? (
        <div className="quick-expense-loading">
          <ErpSafeText value="공통 코드 로딩 중..." />
        </div>
      ) : selectedExpense ? (
        <div className="quick-expense-amount-form">
          <p className="quick-expense-selected-label">
            {getLucideIcon(selectedExpense.icon, { size: 20 })}{' '}
            <ErpSafeText value={selectedExpense.displayName} /> &gt;{' '}
            <ErpSafeText value={selectedExpense.subDisplayName} />
          </p>
          <p className="quick-expense-amount-hint">
            {isVatApplicable ? '부가세 포함 금액(원)을 입력하세요.' : '금액(원)을 입력하세요. (급여는 부가세 없음)'}
          </p>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="금액 입력"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="quick-expense-amount-input"
            disabled={loading}
            autoFocus
          />
          <div className="quick-expense-amount-actions">
            <MGButton
              type="button"
              variant="secondary"
              onClick={closeAmountForm}
              disabled={loading}
            >
              취소
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              onClick={submitQuickExpense}
              loading={loading}
              loadingText="등록 중..."
              preventDoubleClick
            >
              등록
            </MGButton>
          </div>
        </div>
      ) : (
        <>
          <div className="quick-expense-categories">
            {getQuickExpenses().map((expense) => (
              <MGButton
                key={`${expense.categoryCode}-${expense.subcategoryCode}`}
                type="button"
                variant="secondary"
                onClick={() => openAmountForm(expense)}
                loading={loading}
                className="quick-expense-category-btn"
              >
                <div className="quick-expense-category-icon">
                  {getLucideIcon(expense.icon, { size: 20 })}
                </div>
                <div className="quick-expense-category-name">
                  <ErpSafeText value={expense.displayName} />
                </div>
                <div className="quick-expense-category-subname">
                  <ErpSafeText value={expense.subDisplayName} />
                </div>
              </MGButton>
            ))}
          </div>
          <div className="quick-expense-info-box">
            <p className="quick-expense-info-text">
              {getLucideIcon('Lightbulb', { size: 16 })} 버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력)
            </p>
          </div>
        </>
      )}
    </UnifiedModal>
  );
};

export default QuickExpenseForm;
