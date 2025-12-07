import React, { useState, useEffect, useCallback } from 'react';
import { 
  ACCOUNT_CSS_CLASSES 
} from '../../../constants/css';
import { 
  ACCOUNT_FORM_LABELS,
  ACCOUNT_FORM_PLACEHOLDERS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_PAGE_TITLES
} from '../../../constants/account';

const AccountForm = ({
  showForm,
  editingAccount,
  formData,
  banks,
  loading,
  onClose,
  onSubmit,
  onBankChange,
  onFormDataChange
}) => {
  const [bankOptions, setBankOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 은행 코드 로드
  const loadBankCodes = useCallback(async () => {
    try {
      setLoadingCodes(true);
      const response = await fetch('/api/v1/common-codes/BANK');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setBankOptions(data.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.description
          })));
        }
      }
    } catch (error) {
      console.error('은행 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setBankOptions([
        { value: 'KB', label: '국민은행', icon: '🏦', color: 'var(--mg-primary-500)', description: '국민은행' },
        { value: 'SHINHAN', label: '신한은행', icon: '🏦', color: 'var(--mg-success-500)', description: '신한은행' },
        { value: 'WOORI', label: '우리은행', icon: '🏦', color: 'var(--mg-warning-500)', description: '우리은행' },
        { value: 'HANA', label: '하나은행', icon: '🏦', color: 'var(--mg-purple-500)', description: '하나은행' },
        { value: 'NH', label: '농협은행', icon: '🏦', color: 'var(--mg-error-500)', description: '농협은행' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (showForm) {
      loadBankCodes();
    }
  }, [showForm, loadBankCodes]);

  if (!showForm) return null;

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_FORM_OVERLAY}>
      <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_FORM}>
        <h3>{editingAccount ? ACCOUNT_PAGE_TITLES.EDIT : ACCOUNT_PAGE_TITLES.CREATE}</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>{ACCOUNT_FORM_LABELS.BANK}</label>
            <select
              value={formData.bankCode}
              onChange={(e) => onBankChange(e.target.value)}
              required
            >
              <option value="">{ACCOUNT_FORM_PLACEHOLDERS.BANK_SELECT}</option>
              {bankOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{ACCOUNT_FORM_LABELS.ACCOUNT_NUMBER}</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => onFormDataChange('accountNumber', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_NUMBER}
              required
            />
          </div>

          <div className="form-group">
            <label>{ACCOUNT_FORM_LABELS.ACCOUNT_HOLDER}</label>
            <input
              type="text"
              value={formData.accountHolder}
              onChange={(e) => onFormDataChange('accountHolder', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_HOLDER}
              required
            />
          </div>

          <div className="form-group">
            <label>{ACCOUNT_FORM_LABELS.BRANCH_ID}</label>
            <input
              type="number"
              value={formData.branchId || ''}
              onChange={(e) => onFormDataChange('branchId', e.target.value ? parseInt(e.target.value) : null)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.BRANCH_ID}
            />
          </div>

          <div className="form-group">
            <label>{ACCOUNT_FORM_LABELS.DESCRIPTION}</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange('description', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.DESCRIPTION}
              rows="3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => onFormDataChange('isPrimary', e.target.checked)}
              />
              {ACCOUNT_FORM_LABELS.IS_PRIMARY}
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => onFormDataChange('isActive', e.target.checked)}
              />
              {ACCOUNT_FORM_LABELS.IS_ACTIVE}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? ACCOUNT_BUTTON_TEXT.PROCESSING : (editingAccount ? ACCOUNT_BUTTON_TEXT.EDIT : ACCOUNT_BUTTON_TEXT.SUBMIT)}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {ACCOUNT_BUTTON_TEXT.CANCEL}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountForm;
