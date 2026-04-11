import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
import UnifiedModal from '../common/modals/UnifiedModal';
import './SalaryConfigModal.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import { SALARY_API_ENDPOINTS } from '../../constants/salaryConstants';
import { ErpSafeText } from './common';

const SalaryConfigModal = ({ isOpen, onClose, onSave }) => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfigs();
      loadConfigOptions();
    }
  }, [isOpen]);

  /**
   * 백엔드 GET /api/v1/admin/salary/configs 응답: data는 SALARY_CONFIG 그룹의 codeValue를 키로,
   * codeDescription(없으면 codeLabel)을 값으로 하는 객체.
   * 키: SALARY_BASE_DATE, SALARY_PAYMENT_DAY, SALARY_CUTOFF_DAY, SALARY_BATCH_CYCLE, SALARY_CALCULATION_METHOD
   */
  const loadCurrentConfigs = async() => {
    try {
      setLoading(true);
      setError('');
      const raw = await StandardizedApi.get(SALARY_API_ENDPOINTS.CONFIGS);
      if (raw && typeof raw === 'object') {
        const str = (v) => (v == null ? '' : String(v).trim());
        const num = (v, fallback) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : fallback;
        };
        setConfigs({
          monthlyBaseDay: str(raw.SALARY_BASE_DATE) || 'LAST_DAY',
          paymentDay: num(raw.SALARY_PAYMENT_DAY, 5),
          cutoffDay: str(raw.SALARY_CUTOFF_DAY) || 'LAST_DAY',
          batchCycle: str(raw.SALARY_BATCH_CYCLE) || 'MONTHLY',
          calculationMethod: str(raw.SALARY_CALCULATION_METHOD) || 'CONSULTATION_COUNT'
        });
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
      setError('설정을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigOptions = async() => {
    try {
      const data = await StandardizedApi.get(SALARY_API_ENDPOINTS.CONFIG_OPTIONS);
      if (data && typeof data === 'object') {
        setOptions({
          monthlyBaseDays: Array.isArray(data.monthlyBaseDays) ? data.monthlyBaseDays : [],
          paymentDays: Array.isArray(data.paymentDays) ? data.paymentDays : [],
          cutoffDays: Array.isArray(data.cutoffDays) ? data.cutoffDays : [],
          batchCycles: Array.isArray(data.batchCycles) ? data.batchCycles : [],
          calculationMethods: Array.isArray(data.calculationMethods) ? data.calculationMethods : []
        });
      }
    } catch (error) {
      console.error('설정 옵션 로드 오류:', error);
      setError((prev) => prev || '설정 옵션을 불러오지 못했습니다.');
    }
  };

  const handleInputChange = (field, value) => {
    setConfigs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async() => {
    try {
      setLoading(true);
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
      
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="급여 기산일 설정"
      size="medium"
      className="mg-v2-ad-b0kla salary-config-modal"
    >
      <div className="salary-config-modal-body">
          <ErpSafeText
            tag="p"
            className="salary-config-modal-intro"
            value="아래 설정은 급여 계산 기간과 지급·마감 일자를 정하는 데 사용됩니다. 저장 후 급여 계산·세금 조회 시 반영되므로, 한 번 설정해 두시면 됩니다."
          />
          {error && (
            <SafeErrorDisplay error={error} variant="inline" className="error-message" />
          )}

          <div className="config-section">
            <h4>급여 기산일 설정</h4>
            <p className="config-section-desc">매월 급여를 몇 일 기준으로 계산할지 정합니다. 선택한 날짜가 해당 월의 계산 시작일이 됩니다.</p>
            <div className="config-item">
              <label>월급여 기산일</label>
              <BadgeSelect
                value={configs.monthlyBaseDay}
                onChange={(val) => handleInputChange('monthlyBaseDay', val)}
                options={options.monthlyBaseDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder="선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="config-item">
              <label>급여 지급일</label>
              <span className="config-item-hint">해당 월 급여를 다음 달 몇 일에 지급할지 선택합니다.</span>
              <BadgeSelect
                value={configs.paymentDay}
                onChange={(val) => handleInputChange('paymentDay', Number(val))}
                options={options.paymentDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder="선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="config-item">
              <label>급여 마감일</label>
              <span className="config-item-hint">해당 월에 포함할 상담·실적을 몇 일까지로 볼지(마감일) 정합니다.</span>
              <BadgeSelect
                value={configs.cutoffDay}
                onChange={(val) => handleInputChange('cutoffDay', val)}
                options={options.cutoffDays.map(option => ({ value: option.value, label: option.label }))}
                placeholder="선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-section">
            <h4>배치 설정</h4>
            
            <div className="config-item">
              <label>배치 실행 주기</label>
              <BadgeSelect
                value={configs.batchCycle}
                onChange={(val) => handleInputChange('batchCycle', val)}
                options={options.batchCycles.map(option => ({ value: option.value, label: option.label }))}
                placeholder="선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-section">
            <h4>급여 계산 방식</h4>
            <p className="config-section-desc">상담사 급여를 어떤 기준으로 계산할지(상담 건수·시간당·고정급 등) 선택합니다.</p>
            <div className="config-item">
              <label>계산 방식</label>
              <BadgeSelect
                value={configs.calculationMethod}
                onChange={(val) => handleInputChange('calculationMethod', val)}
                options={options.calculationMethods.map(option => ({ value: option.value, label: option.label }))}
                placeholder="선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>
          </div>

          <div className="config-preview">
            <h4>설정 미리보기</h4>
            <div className="preview-item">
              <span>급여 기산일:</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.monthlyBaseDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.monthlyBaseDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>급여 지급일:</span>
              <ErpSafeText
                className="preview-item__value"
                value={`익월 ${configs.paymentDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>급여 마감일:</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.cutoffDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.cutoffDay}일`}
              />
            </div>
            <div className="preview-item">
              <span>배치 주기:</span>
              <ErpSafeText
                className="preview-item__value"
                value={configs.batchCycle === 'MONTHLY' ? '월별' : configs.batchCycle === 'SEMI_MONTHLY' ? '반월별' : '주별'}
              />
            </div>
          </div>
        </div>

      <div className="mg-modal__footer salary-config-modal-footer">
        <MGButton
          variant="outline"
          size="medium"
          onClick={onClose}
          disabled={loading}
          preventDoubleClick={false}
        >
          취소
        </MGButton>
        <MGButton
          variant="primary"
          size="medium"
          onClick={handleSave}
          loading={loading}
          loadingText="저장 중..."
          preventDoubleClick
        >
          저장
        </MGButton>
      </div>
    </UnifiedModal>
  );
};

export default SalaryConfigModal;