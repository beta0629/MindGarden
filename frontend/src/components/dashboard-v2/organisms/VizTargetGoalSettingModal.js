/**
 * VizTargetGoalSettingModal — 목표 달성률 KPI 목표 건수 설정 (UnifiedModal)
 *
 * SSOT: docs/design-system/ADMIN_DASHBOARD_TARGET_GOAL_SETTING_SPEC.md
 *
 * @author CoreSolution
 * @since 2026-07-28
 */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import BadgeSelect from '../../common/BadgeSelect';
import FormInput from '../../common/FormInput';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import {
  DASHBOARD_VIZ_TARGET_COMPLETED,
  DASHBOARD_VIZ_TARGET_MAX_COMPLETED,
  DASHBOARD_VIZ_TARGET_MIN_COMPLETED,
  DASHBOARD_VIZ_TARGET_MODES,
  DASHBOARD_VIZ_TARGET_PRESETS,
  DASHBOARD_VIZ_TARGET_QUICK_ADD_OPTIONS
} from '../../../constants/charts';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import {
  calcQuickAddTarget,
  parseVizTargetCustomInput
} from '../utils/dashboardVizTargetStorage';
import './VizTargetGoalSettingModal.css';

/**
 * @param {string} raw
 * @param {function} t
 * @returns {string}
 */
function resolveInputError(raw, t) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return toDisplayString(t('admin:dashboard.v2.viz.targetGoal.errorEmpty'));
  }
  const parsed = parseVizTargetCustomInput(trimmed);
  if (parsed == null) {
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber) && asNumber > DASHBOARD_VIZ_TARGET_MAX_COMPLETED) {
      return toDisplayString(t('admin:dashboard.v2.viz.targetGoal.errorMax', {
        max: DASHBOARD_VIZ_TARGET_MAX_COMPLETED
      }));
    }
    if (Number.isFinite(asNumber) && asNumber < DASHBOARD_VIZ_TARGET_MIN_COMPLETED) {
      return toDisplayString(t('admin:dashboard.v2.viz.targetGoal.errorMin'));
    }
    return toDisplayString(t('admin:dashboard.v2.viz.targetGoal.errorMin'));
  }
  return '';
}

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
function VizTargetGoalSettingModal({
  isOpen,
  onClose,
  currentTarget,
  countUnit,
  onSave
}) {
  const { t } = useTranslation(['admin', 'common']);
  const safeCurrent = toSafeNumber(currentTarget, DASHBOARD_VIZ_TARGET_COMPLETED);
  const [inputValue, setInputValue] = useState(String(safeCurrent));
  const [touched, setTouched] = useState(false);
  /** 'preset' | 'custom' — +10/+20·직접입력은 custom으로 저장 */
  const [pendingMode, setPendingMode] = useState(DASHBOARD_VIZ_TARGET_MODES.CUSTOM);

  useEffect(() => {
    if (isOpen) {
      const initial = toSafeNumber(currentTarget, DASHBOARD_VIZ_TARGET_COMPLETED);
      setInputValue(String(initial));
      setTouched(false);
      setPendingMode(
        DASHBOARD_VIZ_TARGET_PRESETS.includes(initial)
          ? DASHBOARD_VIZ_TARGET_MODES.PRESET
          : DASHBOARD_VIZ_TARGET_MODES.CUSTOM
      );
    }
  }, [isOpen, currentTarget]);

  const parsedValue = parseVizTargetCustomInput(inputValue);
  const errorMessage = touched ? resolveInputError(inputValue, t) : '';
  const canSave = parsedValue != null;

  const presetOptions = useMemo(
    () => DASHBOARD_VIZ_TARGET_PRESETS.map((preset) => ({
      value: String(preset),
      label: toDisplayString(t('admin:dashboard.v2.viz.targetGoal.presetBtn', {
        count: preset,
        unit: countUnit
      }))
    })),
    [t, countUnit]
  );

  const selectedPreset = parsedValue != null && DASHBOARD_VIZ_TARGET_PRESETS.includes(parsedValue)
    ? String(parsedValue)
    : '';

  const handlePresetChange = (nextValue) => {
    const next = toSafeNumber(nextValue, 0);
    if (next < DASHBOARD_VIZ_TARGET_MIN_COMPLETED) {
      return;
    }
    setTouched(true);
    setPendingMode(DASHBOARD_VIZ_TARGET_MODES.PRESET);
    setInputValue(String(next));
  };

  const handleQuickAdd = (option) => {
    const base = parsedValue != null
      ? parsedValue
      : toSafeNumber(inputValue, safeCurrent);
    const next = calcQuickAddTarget(base, option.multiplier);
    if (next == null) {
      return;
    }
    setTouched(true);
    setPendingMode(DASHBOARD_VIZ_TARGET_MODES.CUSTOM);
    setInputValue(String(next));
  };

  const handleInputChange = (event) => {
    setTouched(true);
    setPendingMode(DASHBOARD_VIZ_TARGET_MODES.CUSTOM);
    setInputValue(event.target.value);
  };

  const handleSave = () => {
    setTouched(true);
    const next = parseVizTargetCustomInput(inputValue);
    if (next == null || typeof onSave !== 'function') {
      return;
    }
    const mode = pendingMode === DASHBOARD_VIZ_TARGET_MODES.PRESET
      && DASHBOARD_VIZ_TARGET_PRESETS.includes(next)
      ? DASHBOARD_VIZ_TARGET_MODES.PRESET
      : DASHBOARD_VIZ_TARGET_MODES.CUSTOM;
    onSave(mode, next);
    onClose?.();
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={toDisplayString(t('admin:dashboard.v2.viz.targetGoal.title'))}
      size="small"
      variant="form"
      className="mg-v2-viz-target-goal-modal"
      data-testid="viz-target-goal-modal"
      actions={(
        <>
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            data-testid="viz-target-goal-cancel"
            onClick={handleCancel}
            preventDoubleClick={false}
          >
            {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.cancel'))}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={!canSave}
            data-testid="viz-target-goal-save"
            onClick={handleSave}
            preventDoubleClick={false}
          >
            {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.save'))}
          </MGButton>
        </>
      )}
    >
      <div className="mg-v2-viz-target-goal-modal__body">
        <p className="mg-v2-viz-target-goal-modal__current" data-testid="viz-target-goal-current">
          {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.currentTarget', {
            count: safeCurrent,
            unit: countUnit
          }))}
        </p>

        <section className="mg-v2-viz-target-goal-modal__section" aria-labelledby="viz-target-goal-preset-label">
          <h3 id="viz-target-goal-preset-label" className="mg-v2-viz-target-goal-modal__label">
            {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.preset'))}
          </h3>
          <BadgeSelect
            options={presetOptions}
            value={selectedPreset}
            onChange={handlePresetChange}
            size="small"
            aria-label={toDisplayString(t('admin:dashboard.v2.viz.targetGoal.preset'))}
            className="mg-v2-viz-target-goal-modal__presets"
          />
        </section>

        <section className="mg-v2-viz-target-goal-modal__section" aria-labelledby="viz-target-goal-quick-label">
          <h3 id="viz-target-goal-quick-label" className="mg-v2-viz-target-goal-modal__label">
            {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.quickAdd'))}
          </h3>
          <div className="mg-v2-viz-target-goal-modal__quick-row" role="group">
            {DASHBOARD_VIZ_TARGET_QUICK_ADD_OPTIONS.map((option) => {
              const base = parsedValue != null
                ? parsedValue
                : toSafeNumber(inputValue, safeCurrent);
              const preview = calcQuickAddTarget(base, option.multiplier);
              const previewSafe = preview != null ? preview : 0;
              return (
                <MGButton
                  key={option.id}
                  type="button"
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'mg-v2-viz-target-goal-modal__quick-btn'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={preview == null}
                  data-testid={`viz-target-goal-quick-${option.id}`}
                  onClick={() => handleQuickAdd(option)}
                  preventDoubleClick={false}
                >
                  {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.quickAddBtn', {
                    percent: option.percent,
                    count: previewSafe,
                    unit: countUnit
                  }))}
                </MGButton>
              );
            })}
          </div>
        </section>

        <section className="mg-v2-viz-target-goal-modal__section" aria-labelledby="viz-target-goal-direct-label">
          <h3 id="viz-target-goal-direct-label" className="mg-v2-viz-target-goal-modal__label">
            {toDisplayString(t('admin:dashboard.v2.viz.targetGoal.directInput'))}
          </h3>
          <FormInput
            type="number"
            name="viz-target-goal-direct"
            value={inputValue}
            onChange={handleInputChange}
            error={errorMessage}
            min={DASHBOARD_VIZ_TARGET_MIN_COMPLETED}
            max={DASHBOARD_VIZ_TARGET_MAX_COMPLETED}
            inputMode="numeric"
            data-testid="viz-target-goal-input"
            aria-invalid={Boolean(errorMessage)}
            rightElement={(
              <span className="mg-v2-viz-target-goal-modal__unit" aria-hidden="true">
                {toDisplayString(countUnit)}
              </span>
            )}
          />
        </section>
      </div>
    </UnifiedModal>
  );
}

VizTargetGoalSettingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentTarget: PropTypes.number.isRequired,
  countUnit: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired
};

export default VizTargetGoalSettingModal;
