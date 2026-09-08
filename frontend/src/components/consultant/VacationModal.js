import React, { useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import StandardizedApi from '../../utils/standardizedApi';
import UnifiedModal from '../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import {
  VACATION_TYPES,
  VACATION_TYPE_LABELS,
  VACATION_TYPE_ICONS,
  VACATION_TYPE_COLORS,
  DEFAULT_VACATION_REASONS
} from '../../constants/vacation';
import { getVacationMinSelectableDate } from '../../constants/consultantAvailabilityConstants';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import { useTranslation } from 'react-i18next';

/**
 * 휴무 설정 모달 컴포넌트 (상담사 D-2 fail-closed)
 */
const VacationModal = ({ isOpen, onClose, onSuccess, selectedDate, consultantId }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    type: VACATION_TYPES.ALL_DAY,
    reason: '',
    customStartTime: '09:00',
    customEndTime: '18:00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vacationTypes = Object.values(VACATION_TYPES).map((type) => ({
    value: type,
    label: VACATION_TYPE_LABELS[type],
    icon: VACATION_TYPE_ICONS[type],
    color: VACATION_TYPE_COLORS[type]
  }));

  const resolveSelectedDateYmd = () => {
    if (!selectedDate) {
      return '';
    }
    if (typeof selectedDate === 'string') {
      return selectedDate.includes('T') ? selectedDate.split('T')[0] : selectedDate;
    }
    return formatLocalDateYmd(selectedDate);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      setError('휴무 사유를 입력해주세요.');
      return;
    }

    const dateYmd = resolveSelectedDateYmd();
    const minYmd = formatLocalDateYmd(getVacationMinSelectableDate());
    if (!dateYmd || dateYmd < minYmd) {
      setError(t('common:consultant.VacationModal.t_vacation_lead_days_denied'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const vacationData = {
        date: dateYmd,
        type: formData.type,
        reason: formData.reason.trim(),
        startTime: formData.type === VACATION_TYPES.CUSTOM_TIME ? formData.customStartTime : null,
        endTime: formData.type === VACATION_TYPES.CUSTOM_TIME ? formData.customEndTime : null
      };

      const response = await StandardizedApi.post(
        `/api/v1/consultants/${consultantId}/vacation`,
        vacationData
      );

      if (response && response.success !== false) {
        onSuccess(response.data ?? response);
        onClose();
      } else {
        setError(response?.message || '휴무 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('휴무 설정 오류:', err);
      setError(err?.message || '휴무 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        type: VACATION_TYPES.ALL_DAY,
        reason: '',
        customStartTime: '09:00',
        customEndTime: '18:00'
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="휴무 설정"
      size="large"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.actions.cancel')}
          </MGButton>
          <MGButton
            type="submit"
            form="vacation-modal-form"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={loading}
            loading={loading}
          >
            휴무 설정
          </MGButton>
        </>
      }
    >
      <form id="vacation-modal-form" onSubmit={handleSubmit} className="mg-v2-modal-body">
        <div className="mg-v2-info-box">
          <div className="mg-v2-info-row">
            <span className="mg-v2-info-label">선택된 날짜</span>
            <span className="mg-v2-info-value">{formatDate(selectedDate)}</span>
          </div>
        </div>

        <div className="mg-v2-form-group">
          <label className="mg-v2-form-label">휴무 유형 <span className="mg-v2-form-label-required">*</span></label>
          <div className="mg-v2-radio-group">
            {vacationTypes.map((type) => (
              <label key={type.value} className="mg-v2-radio-option">
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={handleInputChange}
                  className="mg-v2-radio"
                />
                <div className="mg-v2-radio-content">
                  <span className="mg-v2-radio-icon">{type.icon}</span>
                  <span className="mg-v2-radio-label"><SafeText>{type.label}</SafeText></span>
                  <span
                    className="mg-v2-radio-color"
                    data-color={type.color}
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {formData.type === VACATION_TYPES.CUSTOM_TIME && (
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              <Clock size={16} className="mg-v2-form-label-icon" />
              휴무 시간 설정
            </label>
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">시작 시간</label>
                <input
                  type="time"
                  name="customStartTime"
                  value={formData.customStartTime}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                />
              </div>
              <div className="mg-v2-time-separator">~</div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">종료 시간</label>
                <input
                  type="time"
                  name="customEndTime"
                  value={formData.customEndTime}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mg-v2-form-group">
          <label className="mg-v2-form-label">휴무 사유 <span className="mg-v2-form-label-required">*</span></label>
          <div className="mg-v2-chip-group">
            {DEFAULT_VACATION_REASONS.map((reason, index) => (
              <MGButton
                key={index}
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: `mg-v2-chip ${formData.reason === reason ? 'mg-v2-chip--selected' : ''}`
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setFormData((prev) => ({ ...prev, reason }))}
                preventDoubleClick={false}
              >
                {reason}
              </MGButton>
            ))}
          </div>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            className="mg-v2-form-textarea"
            placeholder="직접 입력하거나 위의 옵션을 선택하세요"
            rows="3"
            required
          />
        </div>

        {error && (
          <div className="mg-v2-alert mg-v2-alert--error">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}
      </form>
    </UnifiedModal>
  );
};

export default VacationModal;
