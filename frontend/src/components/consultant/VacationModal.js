import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { CalendarX, XCircle, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiPost } from '../../utils/ajax';
import { 
  VACATION_TYPES, 
  VACATION_TYPE_LABELS, 
  VACATION_TYPE_ICONS,
  VACATION_TYPE_COLORS,
  TIME_SLOTS,
  DEFAULT_VACATION_REASONS
} from '../../constants/vacation';

/**
 * 휴무 설정 모달 컴포넌트
 */
const VacationModal = ({ isOpen, onClose, onSuccess, selectedDate, consultantId }) => {
  const [formData, setFormData] = useState({
    type: VACATION_TYPES.ALL_DAY,
    reason: '',
    customStartTime: '09:00',
    customEndTime: '18:00'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 휴무 타입 옵션 생성
  const vacationTypes = Object.values(VACATION_TYPES).map(type => ({
    value: type,
    label: VACATION_TYPE_LABELS[type],
    icon: VACATION_TYPE_ICONS[type],
    color: VACATION_TYPE_COLORS[type]
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      setError('휴무 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const vacationData = {
        date: selectedDate,
        type: formData.type,
        reason: formData.reason.trim(),
        startTime: formData.type === VACATION_TYPES.CUSTOM_TIME ? formData.customStartTime : null,
        endTime: formData.type === VACATION_TYPES.CUSTOM_TIME ? formData.customEndTime : null
      };

      console.log('휴무 설정 요청:', vacationData);
      console.log('API 엔드포인트:', `/api/consultant/${consultantId}/vacation`);

      const response = await apiPost(`/api/consultant/${consultantId}/vacation`, vacationData);
      console.log('API 응답:', response);
      
      if (response.success) {
        console.log('휴무 설정 성공:', response.data);
        onSuccess(response.data);
        onClose();
      } else {
        setError(response.message || '휴무 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('휴무 설정 오류:', err);
      setError('휴무 설정 중 오류가 발생했습니다.');
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <CalendarX size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">휴무 설정</h2>
          </div>
          <button 
            className="mg-v2-modal-close" 
            onClick={handleClose}
            disabled={loading}
            aria-label="닫기"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        {/* 본문 */}
        <form onSubmit={handleSubmit} className="mg-v2-modal-body">
          <div className="mg-v2-info-box">
            <div className="mg-v2-info-row">
              <span className="mg-v2-info-label">선택된 날짜</span>
              <span className="mg-v2-info-value">{formatDate(selectedDate)}</span>
            </div>
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">휴무 유형 <span className="mg-v2-form-label-required">*</span></label>
            <div className="mg-v2-radio-group">
              {vacationTypes.map(type => (
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
                    <span className="mg-v2-radio-label">{type.label}</span>
                    <span 
                      className="mg-v2-radio-color"
                      data-color={type.color}
                    ></span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 사용자 정의 시간 설정 */}
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
                <button
                  key={index}
                  type="button"
                  className={`mg-v2-chip ${formData.reason === reason ? 'mg-v2-chip--selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, reason }))}
                >
                  {reason}
                </button>
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
        
        {/* 푸터 */}
        <div className="mg-v2-modal-footer">
          <button 
            type="button" 
            className="mg-v2-btn mg-v2-btn--secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </button>
          <button 
            type="submit" 
            className="mg-v2-btn mg-v2-btn--primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <UnifiedLoading />
                설정 중...
              </>
            ) : (
              <>
                <CheckCircle size={20} className="mg-v2-icon-inline" />
                휴무 설정
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};

export default VacationModal;
