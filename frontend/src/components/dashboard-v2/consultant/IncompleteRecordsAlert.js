import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Icon from '../../ui/Icon/Icon';

/**
 * 미작성 상담일지 알림 컴포넌트
 * 
 * @description 미작성 상담일지 개수를 표시하고 바로 작성하기 버튼 제공
 * @param {number} count - 미작성 일지 개수
 * @param {Array} schedules - 미작성 일지 목록 (선택)
 * @param {Function} onAction - "바로 작성하기" 클릭 시 동작
 * @param {string} className - 추가 CSS 클래스
 */
const IncompleteRecordsAlert = ({ 
  count, 
  schedules = [], 
  onAction, 
  className = '' 
}) => {
  if (count === 0) return null;

  return (
    <div className={`mg-v2-alert mg-v2-alert--warning ${className}`}>
      <div className="mg-v2-alert__content">
        <Icon name="ALERT_TRIANGLE" size="XXL" color="TRANSPARENT" className="mg-v2-alert__icon" />
        <div className="mg-v2-alert__text">
          <div className="mg-v2-alert__text-title">
            미작성 상담일지 {count}건
          </div>
          <div className="mg-v2-alert__text-subtitle">
            완료된 상담의 일지를 작성해 주세요.
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
  className: PropTypes.string
};

export default IncompleteRecordsAlert;
