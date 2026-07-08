import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';
import { useTranslation } from 'react-i18next';

/**
 * 다음 상담 준비 카드 컴포넌트
 */
const NextConsultationCard = ({
  consultation,
  onViewPreviousRecords,
  onViewDetails,
  loading = false,
  className = ''
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        className={`mg-v2-next-consultation-card consultant-dashboard-v2__next-card consultant-dashboard-v2__next-card--loading ${className}`}
        aria-live="polite"
        aria-busy="true"
      >
        <SafeText tag="span">다음 상담 정보를 불러오는 중...</SafeText>
      </div>
    );
  }

  if (!consultation) return null;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return toDisplayString(isoString, '');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const clientName = toDisplayString(consultation.clientName, '내담자');
  const sessionNumber = toDisplayString(consultation.sessionNumber, '—');

  return (
    <div className={`mg-v2-next-consultation-card consultant-dashboard-v2__next-card ${className}`}>
      <div className="mg-v2-next-consultation-card__header">
        <div className="mg-v2-next-consultation-card__title">
          <Icon name="CALENDAR" size="MD" color="TRANSPARENT" aria-hidden />
          다음 상담 준비
        </div>
        <div className="mg-v2-badge mg-v2-badge--primary">
          {consultation.isToday ? '오늘' : '내일'}
        </div>
      </div>

      <div className="mg-v2-next-consultation-card__body">
        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">{t('admin.labels.client')}</div>
          <div className="mg-v2-info-block__value">
            <SafeText tag="span">{clientName}</SafeText>
          </div>
        </div>

        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">시간</div>
          <div className="mg-v2-info-block__value">
            <SafeText tag="span">
              {`${formatTime(consultation.startTime)} - ${formatTime(consultation.endTime)}`}
            </SafeText>
          </div>
        </div>

        <div className="mg-v2-info-block">
          <div className="mg-v2-info-block__label">회기</div>
          <div className="mg-v2-info-block__value">
            <SafeText tag="span">{`${sessionNumber}회기`}</SafeText>
          </div>
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
          aria-label={`${clientName} 이전 일지 보기`}
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
          aria-label={`${clientName} 상담 상세보기`}
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
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default NextConsultationCard;
