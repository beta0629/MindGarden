import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import ErpModal from './common/ErpModal';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
import './FinancialTransactionForm.css';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { getTenantId } from '../../utils/apiHeaders';
import StandardizedApi from '../../utils/standardizedApi';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import { ERP_API } from '../../constants/api';
import { ErpSafeText } from './common';

/**
 * 수입/지출 거래 등록·수정 폼 컴포넌트 (공통 코드 사용)
 *
 * @param {'create'|'edit'} mode 등록 또는 수정
 * @param {object} [initialTransaction] 수정 시 단건 데이터(id·관련 엔티티 등 포함)
 */
const FinancialTransactionForm = ({
  onClose,
  onSuccess,
  mode = 'create',
  initialTransaction = null
}) => {
  const [formData, setFormData] = useState({
    transactionType: 'EXPENSE',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    transactionDate: formatLocalDateYmd(new Date()),
    taxIncluded: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [commonCodes, setCommonCodes] = useState({
    transactionTypes: [],
    incomeCategories: [],
    expenseCategories: [],
    incomeSubcategories: [],
    expenseSubcategories: [],
    vatCategories: []
  });
  const [loadingCodes, setLoadingCodes] = useState(true);

  // 공통 코드 로드
  useEffect(() => {
    loadCommonCodes();
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !initialTransaction) {
      return;
    }
    const tx = initialTransaction;
    const dateRaw = tx.transactionDate;
    const dateStr = dateRaw
      ? String(dateRaw).slice(0, 10)
      : formatLocalDateYmd(new Date());
    setFormData({
      transactionType: tx.transactionType || 'EXPENSE',
      category: tx.category || '',
      subcategory: tx.subcategory || '',
      amount: tx.amount != null && tx.amount !== '' ? String(tx.amount) : '',
      description: tx.description || '',
      transactionDate: dateStr,
      taxIncluded: !!tx.taxIncluded
    });
  }, [mode, initialTransaction]);

  const isApprovedReadOnly =
    mode === 'edit' && String(initialTransaction?.status || '').toUpperCase() === 'APPROVED';

  const loadCommonCodes = async () => {
    try {
      setLoadingCodes(true);
      const response = await csrfTokenManager.get('/api/v1/erp/common-codes/financial');
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success) {
        setCommonCodes(body.data);
      } else {
        setError(body.message || '공통 코드를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
      setError('공통 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // 카테고리가 변경되면 세부 카테고리 초기화
      ...(name === 'category' && { subcategory: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const transactionType = (formData.transactionType || '').trim();
    const category = (formData.category || '').trim();
    const transactionDate = (formData.transactionDate || '').trim();
    const rawAmount = formData.amount === '' || formData.amount === null || formData.amount === undefined
      ? ''
      : String(formData.amount);
    const normalizedAmount = rawAmount.replace(/,/g, '').trim();

    if (!transactionType) {
      const msg = '거래 유형을 선택해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!category) {
      const msg = '카테고리를 선택해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!normalizedAmount) {
      const msg = '금액을 입력해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    const amount = Number(normalizedAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      const msg = '금액은 0 이상의 유효한 숫자로 입력해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!transactionDate) {
      const msg = '거래일을 입력해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }

    if (isApprovedReadOnly) {
      const msg = '승인된 거래는 수정할 수 없습니다.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }

    const tenantIdResolved = await getTenantId(true);
    if (!tenantIdResolved || !String(tenantIdResolved).trim()) {
      const msg = '테넌트 정보를 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.';
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        transactionType,
        category,
        amount,
        transactionDate,
        taxIncluded: !!formData.taxIncluded
      };
      const subTrim = (formData.subcategory || '').trim();
      if (subTrim) {
        payload.subcategory = subTrim;
      }
      const descTrim = (formData.description || '').trim();
      if (descTrim) {
        payload.description = descTrim;
      }

      if (mode === 'edit' && initialTransaction?.id != null) {
        if (initialTransaction.relatedEntityId != null) {
          payload.relatedEntityId = initialTransaction.relatedEntityId;
        }
        if (initialTransaction.relatedEntityType) {
          payload.relatedEntityType = initialTransaction.relatedEntityType;
        }
        if (initialTransaction.taxAmount != null) {
          payload.taxAmount = initialTransaction.taxAmount;
        }
        if (initialTransaction.amountBeforeTax != null) {
          payload.amountBeforeTax = initialTransaction.amountBeforeTax;
        }
        if (initialTransaction.department) {
          payload.department = initialTransaction.department;
        }
        if (initialTransaction.projectCode) {
          payload.projectCode = initialTransaction.projectCode;
        }
        if (initialTransaction.remarks) {
          payload.remarks = initialTransaction.remarks;
        }

        const data = await StandardizedApi.put(
          ERP_API.FINANCE_TRANSACTION_BY_ID(initialTransaction.id),
          payload
        );
        setSuccessMessage('수정되었습니다.');
        notificationManager.show('거래가 수정되었습니다.', 'success', 3000);
        setTimeout(() => {
          onSuccess?.(data);
          onClose?.();
        }, 800);
      } else {
        const data = await StandardizedApi.post(ERP_API.FINANCE_TRANSACTIONS, payload);
        setSuccessMessage('등록되었습니다. 수입/지출에 자동 반영됩니다.');
        notificationManager.show('수입/지출이 등록되었습니다.', 'success', 3000);
        setTimeout(() => {
          onSuccess?.(data);
          onClose?.();
        }, 1200);
      }
    } catch (err) {
      const msg = err?.message || (mode === 'edit' ? '거래 수정 중 오류가 발생했습니다.' : '거래 등록 중 오류가 발생했습니다.');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  // 현재 거래 유형에 따른 카테고리와 세부 카테고리
  const currentCategories = formData.transactionType === 'INCOME' 
    ? commonCodes.incomeCategories 
    : commonCodes.expenseCategories;
  
  const currentSubcategories = formData.transactionType === 'INCOME' 
    ? commonCodes.incomeSubcategories 
    : commonCodes.expenseSubcategories;

  // 선택된 카테고리에 해당하는 세부 카테고리 필터링
  const filteredSubcategories = currentSubcategories.filter(sub => 
    sub.parentCodeValue === formData.category
  );

  return (
    <ErpModal
      isOpen={true}
      onClose={onClose}
      title={mode === 'edit' ? '거래 수정' : '수입/지출 등록'}
      size="medium"
    >

        {successMessage && (
          <div
            className="financial-transaction-form-alert financial-transaction-form-alert--success"
            role="alert"
          >
            ✓ <ErpSafeText value={successMessage} />
          </div>
        )}
        {isApprovedReadOnly && (
          <div
            className="financial-transaction-form-alert financial-transaction-form-alert--readonly"
            role="alert"
          >
            승인된 거래는 수정할 수 없습니다.
          </div>
        )}
        {error && (
          <div className="financial-transaction-form-alert financial-transaction-form-alert--error">
            <SafeErrorDisplay error={error} variant="inline" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 거래 유형 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              거래 유형
            </label>
            <div className="financial-transaction-form-radio-row">
              <label className="financial-transaction-form-radio-label">
                <input
                  type="radio"
                  name="transactionType"
                  value="INCOME"
                  checked={formData.transactionType === 'INCOME'}
                  onChange={handleInputChange}
                  disabled={isApprovedReadOnly}
                  className="financial-transaction-form-radio-input"
                />
                <span>수입</span>
              </label>
              <label className="financial-transaction-form-radio-label">
                <input
                  type="radio"
                  name="transactionType"
                  value="EXPENSE"
                  checked={formData.transactionType === 'EXPENSE'}
                  onChange={handleInputChange}
                  disabled={isApprovedReadOnly}
                  className="financial-transaction-form-radio-input"
                />
                <span>지출</span>
              </label>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              카테고리
            </label>
            <BadgeSelect
              value={formData.category}
              onChange={(val) => setFormData(prev => ({
                ...prev,
                category: val,
                subcategory: ''
              }))}
              options={[
                { value: '', label: '카테고리를 선택하세요' },
                ...currentCategories.map(category => ({
                  value: category.codeValue,
                  label: category.codeLabel
                }))
              ]}
              placeholder="카테고리를 선택하세요"
              disabled={loadingCodes || isApprovedReadOnly}
              className="mg-v2-form-badge-select"
            />
            {loadingCodes && (
              <div className="mg-v2-text-xs mg-v2-text-secondary financial-transaction-form-field-hint">
                공통 코드 로딩 중...
              </div>
            )}
          </div>

          {/* 세부 카테고리 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              세부 카테고리
            </label>
            <BadgeSelect
              value={formData.subcategory}
              onChange={(val) => setFormData(prev => ({ ...prev, subcategory: val }))}
              options={[
                { value: '', label: '세부 카테고리를 선택하세요' },
                ...filteredSubcategories.map(subcategory => ({
                  value: subcategory.codeValue,
                  label: subcategory.codeLabel
                }))
              ]}
              placeholder="세부 카테고리를 선택하세요"
              disabled={!formData.category || loadingCodes || isApprovedReadOnly}
              className="mg-v2-form-badge-select"
            />
            {!formData.category && (
              <div className="mg-v2-text-xs mg-v2-text-secondary financial-transaction-form-field-hint">
                먼저 카테고리를 선택해주세요
              </div>
            )}
          </div>

          {/* 금액 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              금액 (원)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              placeholder="금액을 입력하세요"
              className="mg-v2-form-input"
              disabled={isApprovedReadOnly}
            />
          </div>

          {/* 거래일 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              거래일
            </label>
            <input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              required
              className="mg-v2-form-input"
              disabled={isApprovedReadOnly}
            />
          </div>

          {/* 설명 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              설명 (선택사항)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="거래에 대한 추가 설명을 입력하세요"
              className="mg-v2-form-textarea"
              disabled={isApprovedReadOnly}
            />
          </div>

          {/* 세금 포함 */}
          <div className="mg-v2-form-group">
            <label className="financial-transaction-form-check-row">
              <input
                type="checkbox"
                name="taxIncluded"
                checked={formData.taxIncluded}
                onChange={handleInputChange}
                disabled={isApprovedReadOnly}
                className="financial-transaction-form-check-input"
              />
              <span>세금 포함</span>
            </label>
          </div>

          {/* 버튼들 */}
          <div className="financial-transaction-form-actions financial-transaction-form-actions--footer">
            <button
              type="button"
              onClick={onClose}
              className="mg-v2-button mg-v2-button--secondary"
            >
              취소
            </button>
            {/* MGButton은 네이티브 submit 전용일 때 중복클릭 방지를 끄지만, 폼 의도를 드러내기 위해 명시 유지 */}
            <MGButton
              type="submit"
              variant="primary"
              loading={loading}
              loadingText={mode === 'edit' ? '저장 중...' : '등록 중...'}
              preventDoubleClick={false}
              disabled={isApprovedReadOnly}
            >
              {mode === 'edit' ? '저장하기' : '등록하기'}
            </MGButton>
          </div>
        </form>
    </ErpModal>
  );
};

export default FinancialTransactionForm;
