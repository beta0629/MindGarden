import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import './QuickExpenseForm.css';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { ErpSafeText } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import {
  QEF_MODAL_TITLE,
  QEF_MODAL_SUBTITLE,
  QEF_AMOUNT,
  QEF_ACTIONS,
  QEF_STAGE1_INFO,
  QEF_LOADING,
  QEF_ERRORS,
  QEF_VAT_EXEMPT_CATEGORY_CODE
} from '../../constants/quickExpenseFormStrings';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ERP_COMMON_CODES_FINANCIAL = '/api/v1/erp/common-codes/financial';
const API_ERP_FINANCE_QUICK_EXPENSE = '/api/v1/erp/finance/quick-expense';

/**
 * 나간 돈 기록 (UnifiedModal + 공통코드 칩 → 금액 → 등록)
 * SSOT: docs/design-system/QUICK_EXPENSE_CLINIC_OS_CRITIC_PASS.md
 *
 * @author CoreSolution
 * @since 2026-09-08
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

  const loadExpenseCodes = async() => {
    try {
      setLoadingCodes(true);
      const response = await csrfTokenManager.get(API_ERP_COMMON_CODES_FINANCIAL);
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success) {
        setExpenseCategories(body.data.expenseCategories || []);
        setExpenseSubcategories(body.data.expenseSubcategories || []);
      } else if (!response.ok) {
        setError(body.message || QEF_ERRORS.CODES_LOAD_FAILED);
        notificationManager.error(QEF_ERRORS.CODES_LOAD_FAILED);
      }
    } catch (err) {
      console.error('지출 공통 코드 로드 실패:', err);
      setError(QEF_ERRORS.CODES_LOAD_FAILED);
      notificationManager.error(QEF_ERRORS.CODES_LOAD_FAILED);
    } finally {
      setLoadingCodes(false);
    }
  };

  /**
   * Stage1 칩: API 공통코드(expenseCategories × expenseSubcategories)만 사용.
   * 카테고리 codeValue 매직 목록 금지 — COMMON_CODE_EXPENSE_SSOT.
   */
  const getQuickExpenses = () => {
    return (expenseSubcategories || [])
      .filter((sub) => sub && sub.isActive !== false && sub.parentCodeValue && sub.codeValue)
      .map((sub) => {
        const category = (expenseCategories || []).find(
          (cat) => cat && cat.codeValue === sub.parentCodeValue && cat.isActive !== false
        );
        if (!category) {
          return null;
        }
        return {
          categoryCode: category.codeValue,
          subcategoryCode: sub.codeValue,
          category,
          subcategory: sub,
          displayName: category.codeLabel || category.codeValue,
          subDisplayName: sub.codeLabel || sub.codeValue
        };
      })
      .filter(Boolean);
  };

  const submitQuickExpense = async() => {
    if (!selectedExpense) return;
    const { category } = selectedExpense;
    const { categoryCode } = selectedExpense;
    const { subcategoryCode } = selectedExpense;

    const amount = Number.parseFloat(amountInput, 10);
    if (!amountInput.trim() || isNaN(amount) || amount <= 0) {
      setError(QEF_AMOUNT.INVALID);
      notificationManager.warning(QEF_AMOUNT.INVALID);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 결제수단 파라미터 미전송 — Critic §8 (BE quick-expense 미지원)
      const params = new URLSearchParams({
        category: categoryCode,
        subcategory: subcategoryCode,
        amount: String(amount),
        description: `${category.codeLabel} 지출`,
        transactionDate: formatLocalDateYmd(new Date())
      });
      const response = await csrfTokenManager.fetchWithCsrf(
        `${API_ERP_FINANCE_QUICK_EXPENSE}?${params.toString()}`,
        { method: 'POST' }
      );
      const responseData = await response.json().catch(() => ({}));

      if (response.ok && responseData.success) {
        const taxInfo = responseData?.data ?? {};
        const isVatApplicable = categoryCode !== QEF_VAT_EXEMPT_CATEGORY_CODE;
        let successMessage = `${category.codeLabel} 지출이 등록되었습니다.`;
        if (isVatApplicable && (taxInfo.taxAmount != null || taxInfo.amount != null)) {
          const totalAmount = taxInfo.amount ?? amount;
          successMessage += ` (총 ${Number(totalAmount).toLocaleString()}원)`;
        }
        notificationManager.show(successMessage, 'success', 3000);
        onSuccess?.(responseData.data);
        onClose?.();
      } else {
        const msg = responseData.message || QEF_ERRORS.SUBMIT_FAILED;
        setError(msg);
        notificationManager.show(msg, 'error', 4000);
      }
    } catch (err) {
      const msg = err?.message || QEF_ERRORS.SUBMIT_ERROR;
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

  const isVatApplicable = selectedExpense
    ? selectedExpense.categoryCode !== QEF_VAT_EXEMPT_CATEGORY_CODE
    : false;

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      title={QEF_MODAL_TITLE}
      subtitle={QEF_MODAL_SUBTITLE}
      size="medium"
      backdropClick={true}
      showCloseButton={true}
      className="mg-v2-clinic-os"
    >
      {error && (
        <SafeErrorDisplay error={error} variant="inline" className="quick-expense-error" />
      )}

      <div className="quick-expense-modal-body" aria-busy={loadingCodes || loading}>
        {loadingCodes ? (
          <UnifiedLoading
            type="inline"
            size="small"
            text={QEF_LOADING.CODES}
            className="quick-expense-loading"
          />
        ) : selectedExpense ? (
          <div className="quick-expense-amount-form">
            <p className="quick-expense-selected-label">
              <ErpSafeText value={selectedExpense.displayName} /> &gt;{' '}
              <ErpSafeText value={selectedExpense.subDisplayName} />
            </p>
            <p className="quick-expense-amount-hint">
              {isVatApplicable ? QEF_AMOUNT.HINT_VAT : QEF_AMOUNT.HINT_SALARY}
            </p>
            <input
              type="number"
              min="1"
              step="1"
              placeholder={QEF_AMOUNT.PLACEHOLDER}
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
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                onClick={closeAmountForm}
                disabled={loading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {QEF_ACTIONS.CANCEL}
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                className={buildErpMgButtonClassName({
                  variant: 'primary',
                  loading,
                  className: 'quick-expense-submit-btn'
                })}
                onClick={submitQuickExpense}
                loading={loading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick
              >
                {QEF_ACTIONS.SUBMIT}
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
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    loading: false,
                    className: 'quick-expense-category-btn'
                  })}
                >
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
                {QEF_STAGE1_INFO}
              </p>
            </div>
          </>
        )}
      </div>
    </UnifiedModal>
  );
};

export default QuickExpenseForm;
