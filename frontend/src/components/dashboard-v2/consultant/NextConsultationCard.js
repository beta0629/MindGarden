import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';

/**
 * 다음 상담 준비 카드 컴포넌트
 * 
 * @description 오늘/내일 예정된 다음 상담 정보를 표시하는 카드
 * @param {Object} consultation - 상담 정보
 * @param {Function} onViewPreviousRecords - "이전 일지 보기" 클릭 핸들러
 * @param {Function} onViewDetails - "상세보기" 클릭 핸들러
 * @param {string} className - 추가 CSS 클래스
 */
const NextConsultationCard = ({ 
  consultation, 
  onViewPreviousRecords, 
  onViewDetails, 
  className = '' 
}) => {
  if (!consultation) return null;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`mg-v2-next-consultation-card ${className}`}>
      <div className="mg-v2-next-consultation-card__header">
        <div className="mg-v2-next-consultation-card__title">
          <Icon name="CALENDAR" size="MD" color="TRANSPARENT" />
          다음 상담 준비
        </div>
        <div className="mg-v2-badge mg-v2-badge--primary">
          {consultation.isToday ? '오늘' : '내일'}
        </div>
      </div>

      <div className="mg-v2-next-consultation-card__body">
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">내담자</div>
          <div className="mg-v2-info-block__value">{consultation.clientName}</div>
        </div>
        
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">시간</div>
          <div className="mg-v2-info-block__value">
            {formatTime(consultation.startTime)} - {formatTime(consultation.endTime)}
          </div>
        </div>
        
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">회기</div>
          <div className="mg-v2-info-block__value">{consultation.sessionNumber}회기</div>
        </div>
      </div>

      <div className="mg-v2-next-consultation-card__footer">
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'mg-v2-btn mg-v2-btn-outline mg-v2-btn-sm'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onViewPreviousRecords(consultation.clientId)}
          preventDoubleClick={false}
          aria-label={`${consultation.clientName} 이전 일지 보기`}
        >
          <span>이전 일지 보기</span>
        </MGButton>
        <MGButton
          type="button"
          variant="primary"
          size="small"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'sm',
            loading: false,
            className: 'mg-v2-btn mg-v2-btn-primary mg-v2-btn-sm'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onViewDetails(consultation.scheduleId)}
          preventDoubleClick={false}
          aria-label={`${consultation.clientName} 상담 상세보기`}
        >
          <span>상세보기</span>
        </MGButton>
      </div>
    </div>
  );
};

NextConsultationCard.propTypes = {
  consultation: PropTypes.shape({
    scheduleId: PropTypes.number.isRequired,
    clientId: PropTypes.number.isRequired,
    clientName: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    sessionNumber: PropTypes.number.isRequired,
    isToday: PropTypes.bool.isRequired
  }),
  onViewPreviousRecords: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default NextConsultationCard;
