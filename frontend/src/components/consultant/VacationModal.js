import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiPost } from '../../utils/ajax';
import './VacationModal.css';
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

  return (
    <div className="modal-overlay vacation-modal-overlay">
      <div className="vacation-modal">
        <div className="vacation-modal-header">
          <h2 className="vacation-modal-title">
            <i className="bi bi-calendar-x"></i>
            휴무 설정
          </h2>
          <button 
            className="vacation-modal-close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="vacation-modal-body">
          <div className="vacation-date-info">
            <div className="vacation-date-label">선택된 날짜</div>
            <div className="vacation-date-value">
              {formatDate(selectedDate)}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">휴무 유형 *</label>
            <div className="vacation-type-options">
              {vacationTypes.map(type => (
                <label key={type.value} className="vacation-type-option">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleInputChange}
                    className="vacation-type-radio"
                  />
                  <div className="vacation-type-content">
                    <span className="vacation-type-icon">{type.icon}</span>
                    <span className="vacation-type-label">{type.label}</span>
                    <span 
                      className="vacation-type-color" 
                      data-color={type.color}
                    ></span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 사용자 정의 시간 설정 */}
          {formData.type === VACATION_TYPES.CUSTOM_TIME && (
            <div className="form-group">
              <label className="form-label">휴무 시간 설정</label>
              <div className="time-input-group">
                <div className="time-input">
                  <label>시작 시간</label>
                  <input
                    type="time"
                    name="customStartTime"
                    value={formData.customStartTime}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                <div className="time-separator">~</div>
                <div className="time-input">
                  <label>종료 시간</label>
                  <input
                    type="time"
                    name="customEndTime"
                    value={formData.customEndTime}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">휴무 사유 *</label>
            <div className="reason-options">
              {DEFAULT_VACATION_REASONS.map((reason, index) => (
                <button
                  key={index}
                  type="button"
                  className={`reason-option ${formData.reason === reason ? 'selected' : ''}`}
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
              className="form-control vacation-reason-textarea"
              placeholder="직접 입력하거나 위의 옵션을 선택하세요"
              rows="3"
              required
            />
          </div>

          {error && (
            <div className="vacation-error">
              <i className="bi bi-exclamation-triangle"></i>
              {error}
            </div>
          )}
        </form>
        
        <div className="vacation-modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            <i className="bi bi-x-circle"></i>
            취소
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split"></i>
                설정 중...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle"></i>
                휴무 설정
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacationModal;
