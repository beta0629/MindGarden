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

/**
 * 수입/지출 거래 등록 폼 컴포넌트 (공통 코드 사용)
 */
const FinancialTransactionForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    transactionType: 'EXPENSE',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
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

      const response = await csrfTokenManager.post('/api/v1/erp/finance/transactions', payload);
      const body = await response.json().catch(() => ({}));
      const ok = response.ok && (body.success === true || (body.success === undefined && response.status === 200));

      if (ok) {
        setSuccessMessage('등록되었습니다. 수입/지출에 자동 반영됩니다.');
        notificationManager.show('수입/지출이 등록되었습니다.', 'success', 3000);
        setTimeout(() => {
          onSuccess?.(body?.data ?? body);
          onClose?.();
        }, 1200);
      } else {
        const normalizeDetails = (raw) => {
          if (raw == null || raw === '') return '';
          if (typeof raw === 'string') return raw.trim();
          if (typeof raw === 'object') {
            if (Array.isArray(raw)) return raw.filter(Boolean).map(String).join(', ');
            try {
              return Object.entries(raw)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
            } catch {
              return '';
            }
          }
          return String(raw).trim();
        };

        const baseMessage = typeof body.message === 'string' ? body.message.trim() : '';
        const detailsText = normalizeDetails(body.details);
        const errorCode = body.errorCode;

        let msg;
        if (errorCode === 'TENANT_ID_REQUIRED' || /tenant\s*id/i.test(baseMessage)) {
          msg = '테넌트 정보가 없습니다. 다시 로그인 후 시도해 주세요.';
        } else if (response.status === 403 && !baseMessage) {
          msg = '요청이 거부되었습니다. 로그인 상태와 보안(CSRF) 설정을 확인해 주세요.';
        } else {
          const head = baseMessage || '등록에 실패했습니다.';
          if (!detailsText) {
            msg = head;
          } else {
            const withParens = `${head} (${detailsText})`;
            msg = withParens.length > 200 ? `${head} · ${detailsText}` : withParens;
          }
        }

        setError(msg);
        notificationManager.show(msg, 'error', 4000);
      }
    } catch (err) {
      const msg = err?.message || '거래 등록 중 오류가 발생했습니다.';
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
      title="수입/지출 등록"
      size="medium"
    >

        {successMessage && (
          <div className="mg-v2-form-success" role="alert" style={{
            padding: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            backgroundColor: 'var(--mg-success-100, #dcfce7)',
            color: 'var(--mg-success-800, #166534)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 500
          }}>
            ✓ {successMessage}
          </div>
        )}
        {error && (
          <div
            className="mg-v2-form-error"
            style={{
              padding: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)',
              backgroundColor: 'var(--status-error-border)',
              color: 'var(--status-error-dark)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <SafeErrorDisplay error={error} variant="inline" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 거래 유형 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              거래 유형
            </label>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="transactionType"
                  value="INCOME"
                  checked={formData.transactionType === 'INCOME'}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                <span>수입</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="transactionType"
                  value="EXPENSE"
                  checked={formData.transactionType === 'EXPENSE'}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
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
              disabled={loadingCodes}
              className="mg-v2-form-badge-select"
            />
            {loadingCodes && (
              <div className="mg-v2-text-xs mg-v2-text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
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
              disabled={!formData.category || loadingCodes}
              className="mg-v2-form-badge-select"
            />
            {!formData.category && (
              <div className="mg-v2-text-xs mg-v2-text-secondary" style={{ marginTop: 'var(--spacing-xs)' }}>
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
            />
          </div>

          {/* 세금 포함 */}
          <div className="mg-v2-form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="taxIncluded"
                checked={formData.taxIncluded}
                onChange={handleInputChange}
                style={{ cursor: 'pointer' }}
              />
              <span>세금 포함</span>
            </label>
          </div>

          {/* 버튼들 */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-sm)', 
            justifyContent: 'flex-end',
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border-light)'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="mg-v2-button mg-v2-button--secondary"
            >
              취소
            </button>
            {/* type="submit" 에서 preventDoubleClick 기본값(true)이면 클릭 직후 버튼이 비활성화되어
                브라우저가 form submit 을 막는 경우가 있음 → onSubmit(handleSubmit) 미실행·요청 없음 */}
            <MGButton
              type="submit"
              variant="primary"
              loading={loading}
              loadingText="등록 중..."
              preventDoubleClick={false}
            >
              등록하기
            </MGButton>
          </div>
        </form>
    </ErpModal>
  );
};

export default FinancialTransactionForm;
