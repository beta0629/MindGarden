import React, { useState, useEffect, useMemo } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import csrfTokenManager from '../../utils/csrfTokenManager';
import { getTenantId } from '../../utils/apiHeaders';
import StandardizedApi from '../../utils/standardizedApi';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import { ERP_API } from '../../constants/api';
import { ErpSafeText } from './common';
import { toSafeNumber } from '../../utils/safeDisplay';
import {
  formatKrw,
  formatOptionalKrw,
  getDisplaySupplyAmount,
  getDisplayVatAmount,
  getDisplayWithholdingTaxAmount,
  shouldShowCardSettlementSection,
  shouldShowVatRow,
  shouldShowCardNetDepositRow,
  shouldShowIncomeWithholdingTax,
  FINANCIAL_AMOUNT_STACK_LABEL_TOTAL,
  FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY,
  FINANCIAL_AMOUNT_STACK_LABEL_VAT,
  FINANCIAL_WITHHOLDING_TAX_LABEL,
  FINANCIAL_TAX_INCLUDED_LABEL,
  FINANCIAL_CARD_MERCHANT_FEE_LABEL,
  FINANCIAL_CARD_NET_DEPOSIT_LABEL
} from '../../utils/erpFinancialAmountStack';
import {
  isCardPaymentMethod,
  resolveCardMerchantFeeAmount
} from '../../utils/cardMerchantFeeCalculation';
import { mapPaymentMethodCodesToOptions } from '../../utils/paymentMethodSsot';
import { getTenantCodes } from '../../utils/commonCodeApi';
import { FM_CARD_FEE, FM_MONEY_RECORD } from '../../constants/financialManagementStrings';
import {
  buildFixedCategoryOptions,
  buildSubcategoryPickerOptions,
  parseSubcategoryPickerValue,
  resolvePrimaryCategoryHighlight,
  resolveSubcategoryPickerValue
} from '../../utils/financialTransactionCategoryPicker';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import './FinancialTransactionForm.css';
import './FinancialManagement.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_ERP_COMMON_CODES_FINANCIAL = '/api/v1/erp/common-codes/financial';

const PAYMENT_METHOD_CODE_GROUP = 'PAYMENT_METHOD';


const TRANSACTION_DATE_YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
const resolveDefaultTransactionDate = (value) => {
  if (typeof value === 'string' && TRANSACTION_DATE_YMD_REGEX.test(value)) {
    return value;
  }
  return formatLocalDateYmd(new Date());
};

/**
 * 수입/지출 거래 등록·수정 폼 컴포넌트 (공통 코드 사용)
 *
 * @param {'create'|'edit'} mode 등록 또는 수정
 * @param {object} [initialTransaction] 수정 시 단건 데이터(id·관련 엔티티 등 포함)
 * @param {string} [defaultTransactionDate] create 모드 초기 거래일 (YYYY-MM-DD)
 */
const FinancialTransactionForm = ({
  onClose,
  onSuccess,
  mode = 'create',
  initialTransaction = null,
  modalTitle = null,
  defaultTransactionType = 'INCOME',
  defaultTransactionDate = null,
  clinicTypeLabels = false
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    transactionType: defaultTransactionType === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    transactionDate: resolveDefaultTransactionDate(defaultTransactionDate),
    taxIncluded: false,
    paymentMethod: '',
    cardIssuer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [cardFeeSettings, setCardFeeSettings] = useState(null);
  const [paymentMethodCodes, setPaymentMethodCodes] = useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
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
    loadCardFeeSettings();
    loadPaymentMethodCodes();
  }, []);

  const loadPaymentMethodCodes = async () => {
    try {
      const codes = await getTenantCodes(PAYMENT_METHOD_CODE_GROUP);
      const list = Array.isArray(codes) ? codes : [];
      setPaymentMethodCodes(list);
      const options = mapPaymentMethodCodesToOptions(list);
      setPaymentMethodOptions(options.length > 0 ? options : [
        { value: 'CASH', label: FM_CARD_FEE.PAYMENT_METHOD_CASH },
        { value: 'CREDIT_CARD', label: FM_CARD_FEE.PAYMENT_METHOD_CARD },
        { value: 'BANK_TRANSFER', label: FM_CARD_FEE.PAYMENT_METHOD_TRANSFER }
      ]);
    } catch {
      setPaymentMethodCodes([]);
      setPaymentMethodOptions([
        { value: 'CASH', label: FM_CARD_FEE.PAYMENT_METHOD_CASH },
        { value: 'CREDIT_CARD', label: FM_CARD_FEE.PAYMENT_METHOD_CARD },
        { value: 'BANK_TRANSFER', label: FM_CARD_FEE.PAYMENT_METHOD_TRANSFER }
      ]);
    }
  };

  const loadCardFeeSettings = async () => {
    try {
      const envelope = await StandardizedApi.get(
        ERP_API.CARD_MERCHANT_FEE_SETTINGS,
        {},
        { unwrapApiEnvelope: false }
      );
      const data = envelope?.data ?? envelope;
      setCardFeeSettings(data?.success === false ? null : data);
    } catch {
      setCardFeeSettings(null);
    }
  };

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
      taxIncluded: !!tx.taxIncluded,
      paymentMethod: tx.paymentMethod
        || (toSafeNumber(tx.cardMerchantFeeAmount) > 0 ? 'CREDIT_CARD' : ''),
      cardIssuer: tx.cardIssuer || ''
    });
  }, [mode, initialTransaction]);

  const isApprovedReadOnly =
    mode === 'edit' && String(initialTransaction?.status || '').toUpperCase() === 'APPROVED';

  const loadCommonCodes = async() => {
    try {
      setLoadingCodes(true);
      const response = await csrfTokenManager.get(API_ERP_COMMON_CODES_FINANCIAL);
      const body = await response.json().catch(() => ({}));

      if (response.ok && body.success) {
        setCommonCodes(body.data);
      } else {
        setError(body.message || t('erp:FinancialTransactionForm.t_1c08ebb9'));
      }
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
      setError(t('erp:FinancialTransactionForm.t_1c08ebb9'));
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'category') {
        next.subcategory = '';
      }
      if (name === 'transactionType') {
        next.category = '';
        next.subcategory = '';
      }
      return next;
    });
  };

  const handleSubmit = async(e) => {
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
      const msg = t('erp:FinancialTransactionForm.t_f108b48b');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!category) {
      const msg = t('erp:FinancialTransactionForm.t_f0820885');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!normalizedAmount) {
      const msg = t('erp:FinancialTransactionForm.t_81281005');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    const amount = Number(normalizedAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      const msg = t('erp:FinancialTransactionForm.t_75c74865');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }
    if (!transactionDate) {
      const msg = t('erp:FinancialTransactionForm.t_d01ebea8');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }

    if (isApprovedReadOnly) {
      const msg = t('erp:FinancialTransactionForm.t_3f717d2e');
      setError(msg);
      notificationManager.show(msg, 'error', 4000);
      return;
    }

    const tenantIdResolved = await getTenantId(true);
    if (!tenantIdResolved || !String(tenantIdResolved).trim()) {
      const msg = t('erp:FinancialTransactionForm.t_1092fe69');
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

      if (formData.transactionType === 'INCOME') {
        const paymentTrim = (formData.paymentMethod || '').trim();
        if (paymentTrim) {
          payload.paymentMethod = paymentTrim;
        }
        if (isCardPaymentMethod(paymentTrim, paymentMethodCodes)) {
          const issuerTrim = (formData.cardIssuer || '').trim();
          if (issuerTrim) {
            payload.cardIssuer = issuerTrim;
          }
          const previewFee = resolveCardMerchantFeeAmount(
            cardFeeSettings,
            amount,
            paymentTrim,
            issuerTrim,
            formData.transactionDate
          );
          if (previewFee > 0) {
            payload.cardMerchantFeeAmount = previewFee;
          }
        }
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
        if (initialTransaction.withholdingTaxAmount != null) {
          payload.withholdingTaxAmount = initialTransaction.withholdingTaxAmount;
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
        setSuccessMessage(t('erp:FinancialTransactionForm.t_9b968290'));
        notificationManager.show(t('erp:FinancialTransactionForm.t_c9b9eb43'), 'success', 3000);
        onSuccess?.(data);
        onClose?.();
      } else {
        const data = await StandardizedApi.post(ERP_API.FINANCE_TRANSACTIONS, payload);
        setSuccessMessage(t('erp:FinancialTransactionForm.t_b1a934f2'));
        notificationManager.show(t('erp:FinancialTransactionForm.t_7ac94417'), 'success', 3000);
        onSuccess?.(data);
        onClose?.();
      }
    } catch (err) {
      const msg = err?.message || (mode === 'edit' ? '거래 수정 중 오류가 발생했습니다.' : t('erp:FinancialTransactionForm.t_fd91d864'));
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

  const useClinicCategoryPicker = clinicTypeLabels;

  const clinicFixedCategoryOptions = useMemo(() => {
    if (!useClinicCategoryPicker) {
      return [];
    }
    return buildFixedCategoryOptions(formData.transactionType, currentCategories);
  }, [useClinicCategoryPicker, formData.transactionType, currentCategories]);

  const clinicSubcategoryOptions = useMemo(() => {
    if (!useClinicCategoryPicker || !formData.category) {
      return [];
    }
    return buildSubcategoryPickerOptions(
      formData.transactionType,
      formData.category,
      currentCategories,
      currentSubcategories
    );
  }, [
    useClinicCategoryPicker,
    formData.transactionType,
    formData.category,
    currentCategories,
    currentSubcategories
  ]);

  const clinicShowSubcategoryRow = useClinicCategoryPicker && clinicSubcategoryOptions.length > 0;

  const clinicPrimaryCategoryValue = useMemo(() => {
    if (!useClinicCategoryPicker) {
      return formData.category;
    }
    return resolvePrimaryCategoryHighlight(formData.transactionType, formData.category);
  }, [useClinicCategoryPicker, formData.transactionType, formData.category]);

  const clinicSubcategoryPickerValue = useMemo(() => {
    if (!useClinicCategoryPicker) {
      return formData.subcategory;
    }
    return resolveSubcategoryPickerValue(
      formData.transactionType,
      formData.category,
      formData.subcategory
    );
  }, [
    useClinicCategoryPicker,
    formData.transactionType,
    formData.category,
    formData.subcategory
  ]);

  const legacyCategoryOptions = useMemo(() => (
    currentCategories.map((category) => ({
      value: category.codeValue,
      label: category.codeLabel
    }))
  ), [currentCategories]);

  const legacyFilteredSubcategories = useMemo(() => (
    currentSubcategories.filter((sub) => sub.parentCodeValue === formData.category)
  ), [currentSubcategories, formData.category]);

  const legacySubcategoryOptions = useMemo(() => (
    legacyFilteredSubcategories.map((subcategory) => ({
      value: subcategory.codeValue,
      label: subcategory.codeLabel
    }))
  ), [legacyFilteredSubcategories]);

  const handleClinicCategoryChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      category: val,
      subcategory: ''
    }));
  };

  const handleClinicSubcategoryChange = (val) => {
    const parsed = parseSubcategoryPickerValue(val, formData.category);
    setFormData((prev) => {
      const next = { ...prev };
      if (parsed.category) {
        next.category = parsed.category;
      }
      if (parsed.subcategory !== undefined) {
        next.subcategory = parsed.subcategory;
      }
      return next;
    });
  };

  const handleLegacyCategoryChange = (val) => {
    setFormData((prev) => ({
      ...prev,
      category: val,
      subcategory: ''
    }));
  };

  const handleLegacySubcategoryChange = (val) => {
    setFormData((prev) => ({ ...prev, subcategory: val }));
  };

  const showSystemAmountsBlock =
    mode === 'edit' &&
    !!initialTransaction &&
    (() => {
      const tx = initialTransaction;
      return (
        tx.amountBeforeTax != null ||
        tx.taxAmount != null ||
        shouldShowIncomeWithholdingTax(tx) ||
        shouldShowCardSettlementSection(tx)
      );
    })();

  const cardIssuerOptions = useMemo(() => {
    const rows = Array.isArray(cardFeeSettings?.issuerRates) ? cardFeeSettings.issuerRates : [];
    return [
      { value: '', label: FM_CARD_FEE.CARD_ISSUER_PLACEHOLDER },
      ...rows
        .filter((row) => row?.issuerLabel)
        .map((row) => ({ value: row.issuerLabel, label: row.issuerLabel }))
    ];
  }, [cardFeeSettings]);

  const cardFeePreviewAmount = useMemo(() => {
    if (formData.transactionType !== 'INCOME' || !isCardPaymentMethod(formData.paymentMethod, paymentMethodCodes)) {
      return 0;
    }
    const amountNum = Number(String(formData.amount || '').replace(/,/g, ''));
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return 0;
    }
    return resolveCardMerchantFeeAmount(
      cardFeeSettings,
      amountNum,
      formData.paymentMethod,
      formData.cardIssuer,
      formData.transactionDate,
      paymentMethodCodes
    );
  }, [
    formData.transactionType,
    formData.paymentMethod,
    formData.amount,
    formData.cardIssuer,
    formData.transactionDate,
    cardFeeSettings,
    paymentMethodCodes
  ]);

  const showIncomePaymentMethod = formData.transactionType === 'INCOME';
  const showCardIssuerSelect = showIncomePaymentMethod
    && isCardPaymentMethod(formData.paymentMethod, paymentMethodCodes);

  return (
    <UnifiedModal
      isOpen={true}
      onClose={onClose}
      title={
        modalTitle
          || (mode === 'edit' ? '거래 수정' : t('erp:FinancialTransactionForm.t_84c4996a'))
      }
      size="medium"
      backdropClick={true}
      showCloseButton={true}
      className="mg-v2-ad-b0kla"
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

        <form onSubmit={handleSubmit} aria-busy={loading || loadingCodes}>
          {/* 거래 유형 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              {clinicTypeLabels ? '유형' : '거래 유형'}
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
                <span>{clinicTypeLabels ? '들어온 돈 (+)' : '수입'}</span>
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
                <span>{clinicTypeLabels ? '나간 돈 (-)' : '지출'}</span>
              </label>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="mg-v2-form-group financial-transaction-form-category-group">
            <label className="mg-v2-form-label">
              {useClinicCategoryPicker ? FM_MONEY_RECORD.CATEGORY_LABEL : '카테고리'}
            </label>
            {useClinicCategoryPicker && !formData.category && (
              <p className="financial-transaction-form-category-hint mg-v2-text-xs mg-v2-text-secondary">
                {FM_MONEY_RECORD.CATEGORY_PLACEHOLDER}
              </p>
            )}
            {!useClinicCategoryPicker && !formData.category && (
              <p className="financial-transaction-form-category-hint mg-v2-text-xs mg-v2-text-secondary">
                {t('erp:FinancialTransactionForm.t_8289d31e')}
              </p>
            )}
            <BadgeSelect
              value={useClinicCategoryPicker ? clinicPrimaryCategoryValue : formData.category}
              onChange={useClinicCategoryPicker ? handleClinicCategoryChange : handleLegacyCategoryChange}
              options={useClinicCategoryPicker ? clinicFixedCategoryOptions : legacyCategoryOptions}
              disabled={loadingCodes || isApprovedReadOnly}
              className="mg-v2-form-badge-select financial-transaction-form-category-chips"
              aria-label={useClinicCategoryPicker
                ? FM_MONEY_RECORD.CATEGORY_LABEL
                : '카테고리'}
            />
            {loadingCodes && (
              <UnifiedLoading
                type="inline"
                size="small"
                centered={false}
                text="공통 코드를 불러오는 중..."
                className="financial-transaction-form-field-hint"
              />
            )}
          </div>

          {/* 세부 카테고리 — Clinic: 고정 카테고리 선택 후, 세부가 있을 때만 */}
          {(useClinicCategoryPicker && clinicShowSubcategoryRow) && (
            <div className="mg-v2-form-group financial-transaction-form-subcategory-group">
              <label className="mg-v2-form-label">
                {FM_MONEY_RECORD.SUBCATEGORY_LABEL}
              </label>
              {!clinicSubcategoryPickerValue && (
                <p className="financial-transaction-form-category-hint mg-v2-text-xs mg-v2-text-secondary">
                  {FM_MONEY_RECORD.SUBCATEGORY_PLACEHOLDER}
                </p>
              )}
              <BadgeSelect
                value={clinicSubcategoryPickerValue}
                onChange={handleClinicSubcategoryChange}
                options={clinicSubcategoryOptions}
                disabled={loadingCodes || isApprovedReadOnly}
                className="mg-v2-form-badge-select financial-transaction-form-subcategory-chips"
                aria-label={FM_MONEY_RECORD.SUBCATEGORY_LABEL}
              />
            </div>
          )}

          {!useClinicCategoryPicker && (
            <div className="mg-v2-form-group financial-transaction-form-subcategory-group">
              <label className="mg-v2-form-label">
                세부 카테고리
              </label>
              {!formData.category && (
                <p className="financial-transaction-form-category-hint mg-v2-text-xs mg-v2-text-secondary">
                  먼저 카테고리를 선택해주세요
                </p>
              )}
              {formData.category && !formData.subcategory && legacySubcategoryOptions.length > 0 && (
                <p className="financial-transaction-form-category-hint mg-v2-text-xs mg-v2-text-secondary">
                  {t('erp:FinancialTransactionForm.t_ae1beb82')}
                </p>
              )}
              <BadgeSelect
                value={formData.subcategory}
                onChange={handleLegacySubcategoryChange}
                options={legacySubcategoryOptions}
                disabled={!formData.category || loadingCodes || isApprovedReadOnly}
                className="mg-v2-form-badge-select financial-transaction-form-subcategory-chips"
                aria-label="세부 카테고리"
              />
            </div>
          )}

          {/* 금액 (목록·상세와 동일 SSOT 라벨) */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              <ErpSafeText value={FINANCIAL_AMOUNT_STACK_LABEL_TOTAL} />
              {isApprovedReadOnly &&
                formData.transactionType === 'INCOME' &&
                formData.taxIncluded && (
                  <span className="mg-financial-tax-included-badge mg-financial-tax-included-badge--form-label">
                    <ErpSafeText value={FINANCIAL_TAX_INCLUDED_LABEL} />
                  </span>
                )}
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

          {showIncomePaymentMethod ? (
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                {FM_CARD_FEE.PAYMENT_METHOD_LABEL}
              </label>
              <BadgeSelect
                value={formData.paymentMethod}
                onChange={(val) => setFormData((prev) => ({
                  ...prev,
                  paymentMethod: val,
                  cardIssuer: isCardPaymentMethod(val, paymentMethodCodes) ? prev.cardIssuer : ''
                }))}
                options={[
                  { value: '', label: '선택 (선택 사항)' },
                  ...paymentMethodOptions
                ]}
                placeholder={FM_CARD_FEE.PAYMENT_METHOD_LABEL}
                disabled={isApprovedReadOnly}
                className="mg-v2-form-badge-select"
              />
            </div>
          ) : null}

          {showCardIssuerSelect ? (
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                {FM_CARD_FEE.CARD_ISSUER_LABEL}
              </label>
              <BadgeSelect
                value={formData.cardIssuer}
                onChange={(val) => setFormData((prev) => ({ ...prev, cardIssuer: val }))}
                options={cardIssuerOptions}
                placeholder={FM_CARD_FEE.CARD_ISSUER_PLACEHOLDER}
                disabled={isApprovedReadOnly}
                className="mg-v2-form-badge-select"
              />
              {cardFeePreviewAmount > 0 ? (
                <p className="mg-v2-text-xs mg-v2-text-secondary financial-transaction-form-field-hint">
                  {FM_CARD_FEE.FEE_PREVIEW(formatKrw(cardFeePreviewAmount))}
                </p>
              ) : null}
            </div>
          ) : null}

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

          {showSystemAmountsBlock && initialTransaction && (
            <div
              className="mg-v2-form-group financial-transaction-form-system-amounts"
              role="region"
              aria-label="시스템 산출 금액"
            >
              <span className="mg-v2-form-label">시스템 산출 금액</span>
              <p className="mg-v2-text-xs mg-v2-text-secondary financial-transaction-form-field-hint">
                결제·연동으로 채워진 값입니다. 수정 시에도 서버 값을 유지하기 위해 함께 전송됩니다.
              </p>
              <div className="financial-transaction-form-readonly-row">
                <span className="financial-transaction-form-readonly-label">
                  <ErpSafeText value={FINANCIAL_AMOUNT_STACK_LABEL_SUPPLY} />
                </span>
                <span className="financial-transaction-form-readonly-value">
                  <ErpSafeText value={formatOptionalKrw(getDisplaySupplyAmount(initialTransaction))} />
                </span>
              </div>
              {shouldShowVatRow(initialTransaction) && (
                <div className="financial-transaction-form-readonly-row">
                  <span className="financial-transaction-form-readonly-label">
                    <ErpSafeText value={FINANCIAL_AMOUNT_STACK_LABEL_VAT} />
                  </span>
                  <span className="financial-transaction-form-readonly-value">
                    <ErpSafeText value={formatOptionalKrw(getDisplayVatAmount(initialTransaction))} />
                  </span>
                </div>
              )}
              {shouldShowIncomeWithholdingTax(initialTransaction) && (
                <div className="financial-transaction-form-readonly-row">
                  <span className="financial-transaction-form-readonly-label">
                    <ErpSafeText value={FINANCIAL_WITHHOLDING_TAX_LABEL} />
                  </span>
                  <span className="financial-transaction-form-readonly-value">
                    <ErpSafeText
                      value={formatKrw(getDisplayWithholdingTaxAmount(initialTransaction))}
                    />
                  </span>
                </div>
              )}
              {initialTransaction.cardMerchantFeeAmount != null && (
                <div className="financial-transaction-form-readonly-row">
                  <span className="financial-transaction-form-readonly-label">
                    <ErpSafeText value={FINANCIAL_CARD_MERCHANT_FEE_LABEL} />
                  </span>
                  <span className="financial-transaction-form-readonly-value">
                    <ErpSafeText
                      value={formatKrw(toSafeNumber(initialTransaction.cardMerchantFeeAmount))}
                    />
                  </span>
                </div>
              )}
              {initialTransaction.cardNetDepositAmount != null && shouldShowCardNetDepositRow(initialTransaction) && (
                <div className="financial-transaction-form-readonly-row">
                  <span className="financial-transaction-form-readonly-label">
                    <ErpSafeText value={FINANCIAL_CARD_NET_DEPOSIT_LABEL} />
                  </span>
                  <span className="financial-transaction-form-readonly-value">
                    <ErpSafeText
                      value={formatKrw(toSafeNumber(initialTransaction.cardNetDepositAmount))}
                    />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 버튼들 */}
          <div className="financial-transaction-form-actions financial-transaction-form-actions--footer">
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
              onClick={onClose}
              preventDoubleClick={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              {t('common.actions.cancel')}
            </MGButton>
            {/* MGButton은 네이티브 submit 전용일 때 중복클릭 방지를 끄지만, 폼 의도를 드러내기 위해 명시 유지 */}
            <MGButton
              type="submit"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', loading })}
              loading={loading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
              disabled={isApprovedReadOnly}
            >
              {mode === 'edit' ? '저장하기' : t('erp:FinancialTransactionForm.t_8c04ab88')}
            </MGButton>
          </div>
        </form>
    </UnifiedModal>
  );
};

export default FinancialTransactionForm;
