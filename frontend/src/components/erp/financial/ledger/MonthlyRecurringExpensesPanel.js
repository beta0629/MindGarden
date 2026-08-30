/**
 * Operator ledger — 매월 나가는 돈 (고정·변동 반복 지출) quiet panel
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../../common/MGButton';
import UnifiedModal from '../../../common/modals/UnifiedModal';
import BadgeSelect from '../../../common/BadgeSelect';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { formatKrw } from '../../../../utils/erpFinancialAmountStack';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { ERP_API } from '../../../../constants/api';
import {
  FM_RECURRING,
  getCategoryDisplayLabel
} from '../../../../constants/financialManagementStrings';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../common/erpMgButtonProps';

const AMOUNT_MODE_FIXED = 'fixed';
const AMOUNT_MODE_VARIABLE = 'variable';

const getCurrentMonthYm = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const emptyForm = () => ({
  amountMode: AMOUNT_MODE_FIXED,
  expenseName: '',
  amount: '',
  category: '',
  recurrenceDay: '1',
  startMonthYm: getCurrentMonthYm(),
  isActive: true
});

const toStartDate = (ym) => `${ym}-01`;

const parseExpenseList = (envelope) => {
  if (!envelope || envelope.success === false) {
    return [];
  }
  const data = envelope.data;
  if (Array.isArray(data?.expenses)) {
    return data.expenses;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

const isVariableRule = (rule) => rule?.autoProcess === false;

const parseAmountInput = (value) => Number(String(value).replace(/,/g, ''));

const MonthlyRecurringExpensesPanel = ({ onRulesChanged, panelRef }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordingKey, setRecordingKey] = useState(null);
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [pendingAmounts, setPendingAmounts] = useState({});

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({
      value: cat.codeValue || cat.value || cat.code,
      label: cat.codeName || cat.label || getCategoryDisplayLabel(cat.codeValue)
    })),
    [categories]
  );

  const missingEntries = useMemo(() => {
    const entries = [];
    rules.forEach((rule) => {
      if (!isVariableRule(rule) || rule.isActive === false) {
        return;
      }
      const months = Array.isArray(rule.missingMonths) ? rule.missingMonths : [];
      months.forEach((yearMonth) => {
        entries.push({
          key: `${rule.id}-${yearMonth}`,
          rule,
          yearMonth
        });
      });
    });
    return entries.sort((a, b) => {
      const monthCmp = String(a.yearMonth).localeCompare(String(b.yearMonth));
      if (monthCmp !== 0) {
        return monthCmp;
      }
      return String(a.rule.expenseName).localeCompare(String(b.rule.expenseName));
    });
  }, [rules]);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const envelope = await StandardizedApi.get(
        ERP_API.RECURRING_EXPENSES,
        {},
        { unwrapApiEnvelope: false }
      );
      setRules(parseExpenseList(envelope));
      setPendingAmounts({});
    } catch {
      notificationManager.error(FM_RECURRING.LOAD_FAIL);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const envelope = await StandardizedApi.get(ERP_API.COMMON_CODES_FINANCIAL);
      const list = envelope?.expenseCategories || envelope?.data?.expenseCategories || [];
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadRules();
    loadCategories();
  }, [loadRules, loadCategories]);

  const runCatchUp = useCallback(async () => {
    try {
      await StandardizedApi.post(ERP_API.RECURRING_EXPENSES_CATCH_UP, {});
    } catch {
      // catch-up 실패는 목록 로드로도 재시도 가능 — 조용히 무시
    }
  }, []);

  const refreshAfterChange = useCallback(async () => {
    await runCatchUp();
    await loadRules();
    onRulesChanged?.();
  }, [loadRules, onRulesChanged, runCatchUp]);

  const openAdd = () => {
    setEditingRule(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (rule) => {
    const startYm = rule.startDate ? String(rule.startDate).slice(0, 7) : getCurrentMonthYm();
    const variable = isVariableRule(rule);
    setEditingRule(rule);
    setForm({
      amountMode: variable ? AMOUNT_MODE_VARIABLE : AMOUNT_MODE_FIXED,
      expenseName: rule.expenseName || '',
      amount: variable || rule.amount == null ? '' : String(rule.amount),
      category: rule.category || '',
      recurrenceDay: String(rule.recurrenceDay ?? 1),
      startMonthYm: startYm,
      isActive: rule.isActive !== false
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setFormOpen(false);
    setEditingRule(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    const name = form.expenseName.trim();
    const dayNum = Number(form.recurrenceDay);
    const isVariable = form.amountMode === AMOUNT_MODE_VARIABLE;
    const amountNum = parseAmountInput(form.amount);

    if (!name || !form.category) {
      notificationManager.error(FM_RECURRING.REQUIRED);
      return;
    }
    if (!isVariable && (!Number.isFinite(amountNum) || amountNum <= 0)) {
      notificationManager.error(FM_RECURRING.REQUIRED);
      return;
    }
    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 31) {
      notificationManager.error(FM_RECURRING.REQUIRED);
      return;
    }

    const payload = {
      expenseName: name,
      amount: isVariable ? 0 : amountNum,
      category: form.category,
      expenseType: form.category,
      recurrenceType: 'MONTHLY',
      recurrenceDay: dayNum,
      startDate: toStartDate(form.startMonthYm),
      autoProcess: !isVariable,
      isActive: form.isActive,
      isVatApplicable: true,
      paymentMethod: isVariable ? 'CARD' : undefined
    };

    setSaving(true);
    try {
      if (editingRule?.id) {
        await StandardizedApi.put(ERP_API.RECURRING_EXPENSE_BY_ID(editingRule.id), payload);
      } else {
        await StandardizedApi.post(ERP_API.RECURRING_EXPENSES, payload);
      }
      notificationManager.success(FM_RECURRING.SAVE_OK);
      closeForm();
      await refreshAfterChange();
    } catch (err) {
      notificationManager.error(err?.message || FM_RECURRING.SAVE_FAIL);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    if (!window.confirm(FM_RECURRING.DELETE_CONFIRM)) {
      return;
    }
    setSaving(true);
    try {
      await StandardizedApi.delete(ERP_API.RECURRING_EXPENSE_BY_ID(rule.id));
      notificationManager.success(FM_RECURRING.DELETE_OK);
      await refreshAfterChange();
    } catch (err) {
      notificationManager.error(err?.message || FM_RECURRING.DELETE_FAIL);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (rule) => {
    setSaving(true);
    try {
      await StandardizedApi.put(ERP_API.RECURRING_EXPENSE_BY_ID(rule.id), {
        ...rule,
        isActive: !rule.isActive,
        autoProcess: !isVariableRule(rule)
      });
      await refreshAfterChange();
    } catch (err) {
      notificationManager.error(err?.message || FM_RECURRING.SAVE_FAIL);
    } finally {
      setSaving(false);
    }
  };

  const handleRecordMonth = async (entry) => {
    const { key, rule, yearMonth } = entry;
    const amountNum = parseAmountInput(pendingAmounts[key] ?? '');
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      notificationManager.error(FM_RECURRING.AMOUNT_POSITIVE);
      return;
    }

    setRecordingKey(key);
    try {
      await StandardizedApi.post(ERP_API.RECURRING_EXPENSE_RECORD_MONTH(rule.id), {
        yearMonth,
        amount: amountNum
      });
      notificationManager.success(FM_RECURRING.RECORD_OK);
      await refreshAfterChange();
    } catch (err) {
      notificationManager.error(err?.message || FM_RECURRING.RECORD_FAIL);
    } finally {
      setRecordingKey(null);
    }
  };

  const renderRuleMeta = (rule) => {
    const parts = [
      getCategoryDisplayLabel(rule.category),
      `매월 ${rule.recurrenceDay}${FM_RECURRING.DAY_SUFFIX}`,
      `${String(rule.startDate || '').slice(0, 7)}~`
    ];
    if (isVariableRule(rule)) {
      return parts.join(' · ');
    }
    return [formatKrw(rule.amount), ...parts].join(' · ');
  };

  return (
    <section
      ref={panelRef}
      className="operator-ledger-recurring"
      data-testid="operator-ledger-recurring"
      aria-labelledby="operator-ledger-recurring-title"
    >
      <div className="operator-ledger-recurring__head">
        <div>
          <h2 id="operator-ledger-recurring-title" className="operator-ledger-recurring__title">
            {FM_RECURRING.TITLE}
          </h2>
          <p className="operator-ledger-recurring__caption">{FM_RECURRING.CAPTION}</p>
        </div>
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={openAdd}
          disabled={loading || saving}
          preventDoubleClick={false}
        >
          {FM_RECURRING.ADD}
        </MGButton>
      </div>

      {!loading && missingEntries.length > 0 ? (
        <div className="operator-ledger-recurring__missing">
          <h3 className="operator-ledger-recurring__missing-title">
            {FM_RECURRING.MISSING_SECTION_TITLE}
          </h3>
          <ul className="operator-ledger-recurring__missing-list">
            {missingEntries.map((entry) => (
              <li key={entry.key} className="operator-ledger-recurring__missing-item">
                <span className="operator-ledger-recurring__missing-label">
                  {FM_RECURRING.missingMonthLabel(
                    toDisplayString(entry.rule.expenseName),
                    FM_RECURRING.formatMonthLabel(entry.yearMonth),
                    entry.rule.recurrenceDay
                  )}
                </span>
                <div className="operator-ledger-recurring__missing-actions">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="operator-ledger-recurring__missing-input"
                    value={pendingAmounts[entry.key] ?? ''}
                    onChange={(e) => setPendingAmounts((prev) => ({
                      ...prev,
                      [entry.key]: e.target.value
                    }))}
                    placeholder={FM_RECURRING.LABEL_AMOUNT}
                    aria-label={`${entry.rule.expenseName} ${entry.yearMonth} 금액`}
                    disabled={recordingKey === entry.key || saving}
                  />
                  <MGButton
                    type="button"
                    variant="primary"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'sm',
                      loading: recordingKey === entry.key
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => handleRecordMonth(entry)}
                    loading={recordingKey === entry.key}
                    disabled={saving}
                    preventDoubleClick
                  >
                    {FM_RECURRING.RECORD}
                  </MGButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="operator-ledger-recurring__muted">불러오는 중...</p>
      ) : rules.length === 0 ? (
        <p className="operator-ledger-recurring__empty">{FM_RECURRING.EMPTY}</p>
      ) : (
        <ul className="operator-ledger-recurring__list">
          {rules.map((rule) => (
            <li key={rule.id} className="operator-ledger-recurring__item">
              <div className="operator-ledger-recurring__item-main">
                <span className="operator-ledger-recurring__item-name">
                  {toDisplayString(rule.expenseName)}
                </span>
                <span className="operator-ledger-recurring__item-meta">
                  {renderRuleMeta(rule)}
                </span>
                {isVariableRule(rule) ? (
                  <span className="operator-ledger-recurring__item-badge">
                    {FM_RECURRING.VARIABLE_AMOUNT_LABEL}
                  </span>
                ) : null}
              </div>
              <div className="operator-ledger-recurring__item-actions">
                <button
                  type="button"
                  className={`operator-ledger-recurring__toggle${rule.isActive ? ' is-active' : ''}`}
                  onClick={() => handleToggleActive(rule)}
                  disabled={saving}
                  aria-pressed={rule.isActive !== false}
                >
                  {rule.isActive !== false ? FM_RECURRING.ACTIVE : FM_RECURRING.INACTIVE}
                </button>
                <MGButton
                  type="button"
                  variant="ghost"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => openEdit(rule)}
                  disabled={saving}
                  preventDoubleClick={false}
                >
                  {FM_RECURRING.EDIT}
                </MGButton>
                <MGButton
                  type="button"
                  variant="danger"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => handleDelete(rule)}
                  disabled={saving}
                  preventDoubleClick={false}
                >
                  {FM_RECURRING.DELETE}
                </MGButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <UnifiedModal
        isOpen={formOpen}
        onClose={closeForm}
        title={editingRule ? FM_RECURRING.FORM_TITLE_EDIT : FM_RECURRING.FORM_TITLE_ADD}
        size="medium"
        showCloseButton
        className="mg-v2-ad-b0kla"
        actions={(
          <>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: saving })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeForm}
              disabled={saving}
              preventDoubleClick={false}
            >
              {FM_RECURRING.CANCEL}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: saving })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSave}
              loading={saving}
              preventDoubleClick
            >
              {FM_RECURRING.SAVE}
            </MGButton>
          </>
        )}
      >
        <div className="operator-ledger-recurring__form">
          {!editingRule ? (
            <fieldset className="operator-ledger-recurring__mode">
              <legend className="operator-ledger-recurring__mode-legend">지출 유형</legend>
              <label className="operator-ledger-recurring__mode-option">
                <input
                  type="radio"
                  name="amountMode"
                  value={AMOUNT_MODE_FIXED}
                  checked={form.amountMode === AMOUNT_MODE_FIXED}
                  onChange={() => setForm((prev) => ({ ...prev, amountMode: AMOUNT_MODE_FIXED }))}
                />
                <span>
                  <strong>{FM_RECURRING.MODE_FIXED}</strong>
                  <small>{FM_RECURRING.MODE_FIXED_HINT}</small>
                </span>
              </label>
              <label className="operator-ledger-recurring__mode-option">
                <input
                  type="radio"
                  name="amountMode"
                  value={AMOUNT_MODE_VARIABLE}
                  checked={form.amountMode === AMOUNT_MODE_VARIABLE}
                  onChange={() => setForm((prev) => ({
                    ...prev,
                    amountMode: AMOUNT_MODE_VARIABLE,
                    expenseName: prev.expenseName || FM_RECURRING.PLACEHOLDER_NAME_VARIABLE.replace('예: ', '')
                  }))}
                />
                <span>
                  <strong>{FM_RECURRING.MODE_VARIABLE}</strong>
                  <small>{FM_RECURRING.MODE_VARIABLE_HINT}</small>
                </span>
              </label>
            </fieldset>
          ) : null}
          <label className="operator-ledger-recurring__field">
            <span>{FM_RECURRING.LABEL_NAME}</span>
            <input
              type="text"
              value={form.expenseName}
              onChange={(e) => setForm((prev) => ({ ...prev, expenseName: e.target.value }))}
              placeholder={
                form.amountMode === AMOUNT_MODE_VARIABLE
                  ? FM_RECURRING.PLACEHOLDER_NAME_VARIABLE
                  : FM_RECURRING.PLACEHOLDER_NAME
              }
            />
          </label>
          {form.amountMode === AMOUNT_MODE_FIXED ? (
            <label className="operator-ledger-recurring__field">
              <span>{FM_RECURRING.LABEL_AMOUNT}</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </label>
          ) : null}
          {editingRule && form.amountMode === AMOUNT_MODE_FIXED ? (
            <p className="operator-ledger-recurring__hint">{FM_RECURRING.AMOUNT_EDIT_CAPTION}</p>
          ) : null}
          {form.amountMode === AMOUNT_MODE_VARIABLE && !editingRule ? (
            <p className="operator-ledger-recurring__hint">{FM_RECURRING.MODE_VARIABLE_HINT}</p>
          ) : null}
          <label className="operator-ledger-recurring__field">
            <span>{FM_RECURRING.LABEL_CATEGORY}</span>
            <BadgeSelect
              options={categoryOptions}
              value={form.category}
              onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
              size="small"
            />
          </label>
          <label className="operator-ledger-recurring__field">
            <span>{FM_RECURRING.LABEL_DAY}</span>
            <input
              type="number"
              min="1"
              max="31"
              value={form.recurrenceDay}
              onChange={(e) => setForm((prev) => ({ ...prev, recurrenceDay: e.target.value }))}
            />
          </label>
          <label className="operator-ledger-recurring__field">
            <span>{FM_RECURRING.LABEL_START_MONTH}</span>
            <input
              type="month"
              value={form.startMonthYm}
              onChange={(e) => setForm((prev) => ({ ...prev, startMonthYm: e.target.value }))}
            />
          </label>
          <label className="operator-ledger-recurring__checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <span>{FM_RECURRING.ACTIVE}</span>
          </label>
        </div>
      </UnifiedModal>
    </section>
  );
};

MonthlyRecurringExpensesPanel.propTypes = {
  onRulesChanged: PropTypes.func,
  panelRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ])
};

export default MonthlyRecurringExpensesPanel;
