import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';

/**
 * 미작성 상담일지 알림 — Clinic-OS 카드 크롬만 (쿼리/count 로직 변경 금지)
 */
const IncompleteRecordsAlert = ({
  count,
  schedules = [],
  onAction,
  className = ''
}) => {
  const safeCount = toSafeNumber(count, 0);
  if (safeCount === 0) return null;

  return (
    <div
      className={`consultant-incomplete-alert ${className}`.trim()}
      role="status"
      data-testid="consultant-incomplete-records-alert"
    >
      <div className="consultant-incomplete-alert__text">
        <p className="consultant-incomplete-alert__title">
          <SafeText tag="span">
            {`미작성 상담일지 ${toDisplayString(safeCount)}건`}
          </SafeText>
        </p>
        <p className="consultant-incomplete-alert__subtitle">
          <SafeText tag="span">완료된 상담의 일지를 작성해 주세요.</SafeText>
        </p>
      </div>
      <div className="consultant-incomplete-alert__action">
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'consultant-incomplete-alert__btn'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onAction}
          preventDoubleClick={false}
          aria-label={`미작성 상담일지 ${toDisplayString(safeCount)}건 작성하기`}
        >
          <SafeText tag="span">바로 작성하기</SafeText>
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
