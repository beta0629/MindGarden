import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 미작성 상담일지 알림 컴포넌트
 */
const IncompleteRecordsAlert = ({
  count,
  schedules = [],
  onAction,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div
        className={`mg-v2-alert mg-v2-alert--warning consultant-dashboard-v2__alert consultant-dashboard-v2__alert--loading ${className}`}
        aria-live="polite"
        aria-busy="true"
      >
        <SafeText tag="span">미작성 일지를 확인하는 중...</SafeText>
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <div
      className={`mg-v2-alert mg-v2-alert--warning consultant-dashboard-v2__alert ${className}`}
      role="status"
    >
      <div className="mg-v2-alert__content">
        <Icon name="ALERT_TRIANGLE" size="XXL" color="TRANSPARENT" className="mg-v2-alert__icon" aria-hidden />
        <div className="mg-v2-alert__text">
          <div className="mg-v2-alert__text-title">
            <SafeText tag="span">미작성 상담일지 {toDisplayString(count, '0')}건</SafeText>
          </div>
          <div className="mg-v2-alert__text-subtitle">
            <SafeText tag="span">완료된 상담의 일지를 작성해 주세요.</SafeText>
          </div>
        </div>
      </div>
      <div className="mg-v2-alert__action">
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'mg-v2-btn mg-v2-btn-primary mg-v2-btn-md'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onAction}
          preventDoubleClick={false}
          aria-label={`미작성 상담일지 ${count}건 작성하기`}
        >
          <span>바로 작성하기</span>
        </MGButton>
      </div>
    </div>
  );
};

IncompleteRecordsAlert.propTypes = {
  count: PropTypes.number.isRequired,
  schedules: PropTypes.arrayOf(
    PropTypes.shape({
      scheduleId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      clientName: PropTypes.string.isRequired,
      sessionDate: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      consultationDate: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
      elapsedHours: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sessionNumber: PropTypes.number
    })
  ),
  onAction: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default IncompleteRecordsAlert;
