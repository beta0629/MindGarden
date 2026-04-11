import { useState, useEffect, useCallback } from 'react';
import { ACCOUNT_CSS_CLASSES } from '../../../constants/css';
import {
  ACCOUNT_FORM_LABELS,
  ACCOUNT_FORM_PLACEHOLDERS,
  ACCOUNT_BUTTON_TEXT
} from '../../../constants/account';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';

const BANK_FALLBACK_OPTIONS = [
  { value: 'KB', label: '국민은행', icon: '', description: '국민은행' },
  { value: 'SHINHAN', label: '신한은행', icon: '', description: '신한은행' },
  { value: 'WOORI', label: '우리은행', icon: '', description: '우리은행' },
  { value: 'HANA', label: '하나은행', icon: '', description: '하나은행' },
  { value: 'NH', label: '농협은행', icon: '', description: '농협은행' }
];

const AccountForm = ({
  showForm,
  editingAccount,
  formData,
  loading,
  onClose,
  onSubmit,
  onBankChange,
  onFormDataChange
}) => {
  const [bankOptions, setBankOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const loadBankCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await fetch('/api/v1/common-codes?codeGroup=BANK');
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
      setBankOptions(BANK_FALLBACK_OPTIONS);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  useEffect(() => {
    if (showForm) {
      loadBankCodes();
    }
  }, [showForm, loadBankCodes]);

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_FORM}>
      <form className="mg-v2-form" onSubmit={onSubmit}>
          <div className="mg-v2-form-group">
            <label htmlFor="account-form-bank" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.BANK}
            </label>
            <select
              id="account-form-bank"
              className="mg-v2-form-select"
              value={formData.bankCode}
              onChange={(e) => onBankChange(e.target.value)}
              required
              disabled={loadingCodes}
            >
              <option value="">{ACCOUNT_FORM_PLACEHOLDERS.BANK_SELECT}</option>
              {bankOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {[toDisplayString(option.icon, ''), toDisplayString(option.label)]
                    .filter((s) => s !== '')
                    .join(' ')
                    .trim() || toDisplayString(option.label)}
                </option>
              ))}
            </select>
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-number" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.ACCOUNT_NUMBER}
            </label>
            <input
              id="account-form-number"
              type="text"
              className="mg-v2-form-input"
              value={formData.accountNumber}
              onChange={(e) => onFormDataChange('accountNumber', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_NUMBER}
              required
            />
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-holder" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.ACCOUNT_HOLDER}
            </label>
            <input
              id="account-form-holder"
              type="text"
              className="mg-v2-form-input"
              value={formData.accountHolder}
              onChange={(e) => onFormDataChange('accountHolder', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_HOLDER}
              required
            />
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-branch" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.BRANCH_ID}
            </label>
            <input
              id="account-form-branch"
              type="number"
              className="mg-v2-form-input"
              value={formData.branchId || ''}
              onChange={(e) =>
                onFormDataChange(
                  'branchId',
                  e.target.value ? Number.parseInt(e.target.value, 10) : null
                )
              }
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.BRANCH_ID}
            />
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-description" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.DESCRIPTION}
            </label>
            <textarea
              id="account-form-description"
              className="mg-v2-form-textarea"
              value={formData.description}
              onChange={(e) => onFormDataChange('description', e.target.value)}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.DESCRIPTION}
              rows={3}
            />
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-checkbox" htmlFor="account-form-primary">
              <input
                id="account-form-primary"
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => onFormDataChange('isPrimary', e.target.checked)}
              />
              <span>{ACCOUNT_FORM_LABELS.IS_PRIMARY}</span>
            </label>
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-checkbox" htmlFor="account-form-active">
              <input
                id="account-form-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => onFormDataChange('isActive', e.target.checked)}
              />
              <span>{ACCOUNT_FORM_LABELS.IS_ACTIVE}</span>
            </label>
          </div>

          <div className="mg-v2-form-actions">
            <MGButton
              type="submit"
              variant="primary"
              loading={loading}
              loadingText={ACCOUNT_BUTTON_TEXT.PROCESSING}
              preventDoubleClick={false}
            >
              {editingAccount ? ACCOUNT_BUTTON_TEXT.EDIT : ACCOUNT_BUTTON_TEXT.SUBMIT}
            </MGButton>
            <MGButton type="button" variant="secondary" onClick={onClose} preventDoubleClick={false}>
              {ACCOUNT_BUTTON_TEXT.CANCEL}
            </MGButton>
          </div>
        </form>
    </div>
  );
};

export default AccountForm;
