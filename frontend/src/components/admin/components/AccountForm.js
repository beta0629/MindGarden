import React from 'react';
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
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
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
