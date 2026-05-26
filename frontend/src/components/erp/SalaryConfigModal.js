import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
import UnifiedModal from '../common/modals/UnifiedModal';
import './SalaryConfigModal.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import { ErpSafeText } from './common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from './common/erpMgButtonProps';
import UnifiedLoading from '../common/UnifiedLoading';
import { useTranslation } from 'react-i18next';

const SalaryConfigModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState({
    monthlyBaseDay: 'LAST_DAY',
    paymentDay: 5,
    cutoffDay: 'LAST_DAY',
    batchCycle: 'MONTHLY',
    calculationMethod: 'CONSULTATION_COUNT'
  });
  const [options, setOptions] = useState({
    monthlyBaseDays: [],
    paymentDays: [],
    cutoffDays: [],
    batchCycles: [],
    calculationMethods: []
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    let cancelled = false;
    const str = (v) => (v == null ? '' : String(v).trim());
    const num = (v, fallback) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    (async() => {
      setDataLoading(true);
      setError('');
      try {
        const [raw, data] = await Promise.all([
          StandardizedApi.get(SALARY_API_ENDPOINTS.CONFIGS),
          StandardizedApi.get(SALARY_API_ENDPOINTS.CONFIG_OPTIONS)
        ]);
        if (cancelled) {
          return;
        }
        if (raw && typeof raw === 'object') {
          setConfigs({
            monthlyBaseDay: str(raw.SALARY_BASE_DATE) || 'LAST_DAY',
            paymentDay: num(raw.SALARY_PAYMENT_DAY, 5),
            cutoffDay: str(raw.SALARY_CUTOFF_DAY) || 'LAST_DAY',
            batchCycle: str(raw.SALARY_BATCH_CYCLE) || 'MONTHLY',
            calculationMethod: str(raw.SALARY_CALCULATION_METHOD) || 'CONSULTATION_COUNT'
          });
        }
        if (data && typeof data === 'object') {
          setOptions({
            monthlyBaseDays: Array.isArray(data.monthlyBaseDays) ? data.monthlyBaseDays : [],
            paymentDays: Array.isArray(data.paymentDays) ? data.paymentDays : [],
            cutoffDays: Array.isArray(data.cutoffDays) ? data.cutoffDays : [],
            batchCycles: Array.isArray(data.batchCycles) ? data.batchCycles : [],
            calculationMethods: Array.isArray(data.calculationMethods) ? data.calculationMethods : []
          });
        }
      } catch (loadErr) {
        console.error('설정/옵션 로드 오류:', loadErr);
        if (!cancelled) {
          setError('설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setConfigs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async() => {
    try {
      setSaving(true);
      setError('');

      // 각 설정을 개별적으로 저장
      const configUpdates = [
        {
          configType: 'SALARY_BASE_DATE',
          configValue: configs.monthlyBaseDay,
          description: `매월 ${configs.monthlyBaseDay === 'LAST_DAY' ? '말일' : `${configs.monthlyBaseDay}일`} 급여 기산일`
        },
        {
          configType: 'SALARY_PAYMENT_DAY',
          configValue: configs.paymentDay.toString(),
          description: `익월 ${configs.paymentDay}일 급여 지급`
        },
        {
          configType: 'SALARY_CUTOFF_DAY',
          configValue: configs.cutoffDay,
          description: `매월 ${configs.cutoffDay === 'LAST_DAY' ? '말일' : `${configs.cutoffDay}일`} 급여 마감`
        },
        {
          configType: 'SALARY_BATCH_CYCLE',
          configValue: configs.batchCycle,
          description: `${configs.batchCycle === 'MONTHLY' ? '월별' : configs.batchCycle === 'SEMI_MONTHLY' ? '반월별' : '주별'} 배치 실행`
        }
      ];

      await Promise.all(
        configUpdates.map((config) => StandardizedApi.post(SALARY_API_ENDPOINTS.CONFIG, config))
      );
      
      onSave && onSave();
      onClose();
      
    } catch (saveErr) {
      console.error('설정 저장 오류:', saveErr);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('erp:SalaryConfigModal.t_a1802bde')}
      size="medium"
      className="mg-v2-ad-b0kla salary-config-modal"
    >
      <div className="salary-config-modal-body" aria-busy={dataLoading || saving}>
        {dataLoading ? (
          <UnifiedLoading
            type="inline"
            text={WIDGET_CONSTANTS.LOADING_MESSAGES.DEFAULT}
            variant="pulse"
          />
        ) : (
          <>
          <ErpSafeText
            tag="p"
            className="salary-config-modal-intro"
            value="아래 설정은 급여 계산 기간과 지급·마감 일자를 정하는 데 사용됩니다. 저장 후 급여 계산·세금 조회 시 반영되므로, 한 번 설정해 두시면 됩니다."
          />
          {error && (
            <SafeErrorDisplay error={error} variant="inline" className="error-message" />
          )}

          <div className="config-section">
            <h4>{t('erp:SalaryConfigModal.t_a1802bde')}</h4>
            <p className="config-section-desc">{t('erp:SalaryConfigModal.t_495add23')}</p>
            <div className="config-item">
              <label>{t('erp:SalaryConfigModal.t_78ec5cce')}</label>
              <BadgeSelect
                value={configs.monthlyBaseDay}
                onChange={(val) => handleInputChange('monthlyBaseDay', val)}
                options={options.monthlyBaseDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder={t('common.messages.pleaseSelect')}
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="config-item">
              <label>{t('erp:SalaryConfigModal.t_41604b0b')}</label>
              <span className="config-item-hint">{t('erp:SalaryConfigModal.t_cd31fe36')}</span>
              <BadgeSelect
                value={configs.paymentDay}
                onChange={(val) => handleInputChange('paymentDay', Number(val))}
                options={options.paymentDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder={t('common.messages.pleaseSelect')}
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="config-item">
              <label>{t('erp:SalaryConfigModal.t_c260dfde')}</label>
              <span className="config-item-hint">{t('erp:SalaryConfigModal.t_8b2e3d73')}</span>
              <BadgeSelect
                value={configs.cutoffDay}
                onChange={(val) => handleInputChange('cutoffDay', val)}
                options={options.cutoffDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder={t('common.messages.pleaseSelect')}
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-section">
            <h4>{t('erp:SalaryConfigModal.t_b4be4900')}</h4>
            
            <div className="config-item">
              <label>{t('erp:SalaryConfigModal.t_1ea0bbdd')}</label>
              <BadgeSelect
                value={configs.batchCycle}
                onChange={(val) => handleInputChange('batchCycle', val)}
                options={options.batchCycles.map(option => ({ value: option.value, label: option.label }))}
                placeholder={t('common.messages.pleaseSelect')}
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-section">
            <h4>{t('erp:SalaryConfigModal.t_fd1fdee1')}</h4>
            <p className="config-section-desc">{t('erp:SalaryConfigModal.t_6b0a032e')}</p>
            <div className="config-item">
              <label>{t('erp:SalaryConfigModal.t_516c6018')}</label>
              <BadgeSelect
                value={configs.calculationMethod}
                onChange={(val) => handleInputChange('calculationMethod', val)}
                options={options.calculationMethods.map(option => ({ value: option.value, label: option.label }))}
                placeholder={t('common.messages.pleaseSelect')}
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-preview">
            <h4>{t('erp:SalaryConfigModal.t_d2776aa0')}</h4>
            <div className="preview-item">
              <span>{t('erp:SalaryConfigModal.t_c1b19919')}</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.monthlyBaseDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.monthlyBaseDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>{t('erp:SalaryConfigModal.t_76c14995')}</span>
              <ErpSafeText
                className="preview-item__value"
                value={`익월 ${configs.paymentDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>{t('erp:SalaryConfigModal.t_7410b88d')}</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.cutoffDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.cutoffDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>{t('erp:SalaryConfigModal.t_b81fc18d')}</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.batchCycle === 'MONTHLY' ? '월별' : configs.batchCycle === 'SEMI_MONTHLY' ? '반월별' : '주별'}
              />
            </div>
          </div>
          </>
        )}
        </div>

      <div className="mg-modal__footer salary-config-modal-footer">
        <MGButton
          type="button"
          variant="outline"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onClose}
          disabled={dataLoading || saving}
          preventDoubleClick={false}
        >
          {t('common.actions.cancel')}
        </MGButton>
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', loading: saving })}
          onClick={handleSave}
          loading={saving}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          preventDoubleClick
        >
          {t('common.actions.save')}
        </MGButton>
      </div>
    </UnifiedModal>
  );
};

export default SalaryConfigModal;