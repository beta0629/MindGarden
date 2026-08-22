import { useState, useEffect, useCallback } from 'react';
import { ACCOUNT_CSS_CLASSES } from '../../../constants/css';
import {
  ACCOUNT_FORM_LABELS,
  ACCOUNT_FORM_PLACEHOLDERS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_VALIDATION
} from '../../../constants/account';
import MGButton from '../../common/MGButton';
import SettingSwitchRow from '../../common/molecules/SettingSwitchRow';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES = '/api/v1/common-codes?codeGroup=BANK';

const ERR_BANK_REQUIRED = '은행을 선택해주세요.';
const ERR_ACCOUNT_NUMBER_REQUIRED = '계좌번호를 입력해주세요.';
const ERR_ACCOUNT_NUMBER_INVALID = '계좌번호 형식이 올바르지 않습니다.';
const ERR_ACCOUNT_HOLDER_REQUIRED = '예금주명을 입력해주세요.';

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
  const [errors, setErrors] = useState({});

  const loadBankCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await fetch(API_COMMON_CODES);
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
      setErrors({});
    }
  }, [showForm, loadBankCodes]);

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * HTML required에만 의존하지 않고 JS validate.
   * @returns {boolean}
   */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.bankCode) {
      newErrors.bankCode = ERR_BANK_REQUIRED;
    }
    const accountNumber = (formData.accountNumber || '').trim();
    if (!accountNumber) {
      newErrors.accountNumber = ERR_ACCOUNT_NUMBER_REQUIRED;
    } else if (
      !ACCOUNT_VALIDATION.ACCOUNT_NUMBER_PATTERN.test(accountNumber)
      || accountNumber.length < ACCOUNT_VALIDATION.MIN_ACCOUNT_NUMBER_LENGTH
      || accountNumber.length > ACCOUNT_VALIDATION.MAX_ACCOUNT_NUMBER_LENGTH
    ) {
      newErrors.accountNumber = ERR_ACCOUNT_NUMBER_INVALID;
    }
    const accountHolder = (formData.accountHolder || '').trim();
    if (!accountHolder) {
      newErrors.accountHolder = ERR_ACCOUNT_HOLDER_REQUIRED;
    } else if (accountHolder.length > ACCOUNT_VALIDATION.MAX_ACCOUNT_HOLDER_LENGTH) {
      newErrors.accountHolder = ERR_ACCOUNT_HOLDER_REQUIRED;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSubmit(e);
  };

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_FORM}>
      <form className="mg-v2-form" onSubmit={handleSubmit} noValidate>
          <div className="mg-v2-form-group">
            <label htmlFor="account-form-bank" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.BANK}
              <span className="mg-v2-form-label-required">*</span>
            </label>
            <select
              id="account-form-bank"
              className={`mg-v2-form-select${errors.bankCode ? ' mg-v2-form-input-error' : ''}`}
              value={formData.bankCode}
              onChange={(e) => {
                onBankChange(e.target.value);
                clearFieldError('bankCode');
              }}
              disabled={loadingCodes}
              aria-invalid={errors.bankCode ? true : undefined}
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
            {errors.bankCode ? (
              <span className="mg-v2-form-error" role="alert">{errors.bankCode}</span>
            ) : null}
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-number" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.ACCOUNT_NUMBER}
              <span className="mg-v2-form-label-required">*</span>
            </label>
            <input
              id="account-form-number"
              type="text"
              className={`mg-v2-form-input${errors.accountNumber ? ' mg-v2-form-input-error' : ''}`}
              value={formData.accountNumber}
              onChange={(e) => {
                onFormDataChange('accountNumber', e.target.value);
                clearFieldError('accountNumber');
              }}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_NUMBER}
              aria-invalid={errors.accountNumber ? true : undefined}
            />
            {errors.accountNumber ? (
              <span className="mg-v2-form-error" role="alert">{errors.accountNumber}</span>
            ) : null}
          </div>

          <div className="mg-v2-form-group">
            <label htmlFor="account-form-holder" className="mg-v2-form-label">
              {ACCOUNT_FORM_LABELS.ACCOUNT_HOLDER}
              <span className="mg-v2-form-label-required">*</span>
            </label>
            <input
              id="account-form-holder"
              type="text"
              className={`mg-v2-form-input${errors.accountHolder ? ' mg-v2-form-input-error' : ''}`}
              value={formData.accountHolder}
              onChange={(e) => {
                onFormDataChange('accountHolder', e.target.value);
                clearFieldError('accountHolder');
              }}
              placeholder={ACCOUNT_FORM_PLACEHOLDERS.ACCOUNT_HOLDER}
              aria-invalid={errors.accountHolder ? true : undefined}
            />
            {errors.accountHolder ? (
              <span className="mg-v2-form-error" role="alert">{errors.accountHolder}</span>
            ) : null}
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
            <SettingSwitchRow
              id="account-form-primary"
              label={ACCOUNT_FORM_LABELS.IS_PRIMARY}
              checked={!!formData.isPrimary}
              onCheckedChange={(next) => onFormDataChange('isPrimary', next)}
              ariaLabel={ACCOUNT_FORM_LABELS.IS_PRIMARY}
            />
          </div>

          <div className="mg-v2-form-group">
            <SettingSwitchRow
              id="account-form-active"
              label={ACCOUNT_FORM_LABELS.IS_ACTIVE}
              checked={!!formData.isActive}
              onCheckedChange={(next) => onFormDataChange('isActive', next)}
              ariaLabel={ACCOUNT_FORM_LABELS.IS_ACTIVE}
            />
          </div>

          <div className="mg-v2-form-actions">
            <MGButton
              type="submit"
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading
              })}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              {editingAccount ? ACCOUNT_BUTTON_TEXT.EDIT : ACCOUNT_BUTTON_TEXT.SUBMIT}
            </MGButton>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onClose}
              preventDoubleClick={false}
            >
              {ACCOUNT_BUTTON_TEXT.CANCEL}
            </MGButton>
          </div>
        </form>
    </div>
  );
};

export default AccountForm;
