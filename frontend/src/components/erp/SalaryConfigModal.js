import React, { useState, useEffect } from 'react';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import './SalaryConfigModal.css';

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

  const loadCurrentConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/salary/configs');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfigs(data.data);
        }
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigOptions = async () => {
    try {
      const response = await fetch('/api/v1/admin/salary/config-options');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOptions(data.data);
        }
      }
    } catch (error) {
      console.error('설정 옵션 로드 오류:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setConfigs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // 각 설정을 개별적으로 저장
      const configUpdates = [
        {
          configType: 'SALARY_BASE_DATE',
          configValue: configs.monthlyBaseDay,
          description: `매월 ${configs.monthlyBaseDay === 'LAST_DAY' ? '말일' : configs.monthlyBaseDay + '일'} 급여 기산일`
        },
        {
          configType: 'SALARY_PAYMENT_DAY',
          configValue: configs.paymentDay.toString(),
          description: `익월 ${configs.paymentDay}일 급여 지급`
        },
        {
          configType: 'SALARY_CUTOFF_DAY',
          configValue: configs.cutoffDay,
          description: `매월 ${configs.cutoffDay === 'LAST_DAY' ? '말일' : configs.cutoffDay + '일'} 급여 마감`
        },
        {
          configType: 'SALARY_BATCH_CYCLE',
          configValue: configs.batchCycle,
          description: `${configs.batchCycle === 'MONTHLY' ? '월별' : configs.batchCycle === 'SEMI_MONTHLY' ? '반월별' : '주별'} 배치 실행`
        }
      ];

      // 모든 설정 저장
      const savePromises = configUpdates.map(config => 
        fetch('/api/v1/admin/salary/config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config)
        })
      );

      await Promise.all(savePromises);
      
      onSave && onSave();
      onClose();
      
    } catch (error) {
      console.error('설정 저장 오류:', error);
      setError('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="salary-config-modal-overlay">
      <div className="salary-config-modal">
        <div className="salary-config-modal-header">
          <h3>급여 기산일 설정</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="salary-config-modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="config-section">
            <h4>급여 기산일 설정</h4>
            
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
              <span>{configs.monthlyBaseDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.monthlyBaseDay}일`}</span>
            </div>
            <div className="preview-item">
              <span>급여 지급일:</span>
              <span>익월 {configs.paymentDay}일</span>
            </div>
            <div className="preview-item">
              <span>급여 마감일:</span>
              <span>{configs.cutoffDay === 'LAST_DAY' ? '매월 말일' : `매월 ${configs.cutoffDay}일`}</span>
            </div>
            <div className="preview-item">
              <span>배치 주기:</span>
              <span>{configs.batchCycle === 'MONTHLY' ? '월별' : configs.batchCycle === 'SEMI_MONTHLY' ? '반월별' : '주별'}</span>
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
      </div>
    </div>
  );
};

export default SalaryConfigModal;