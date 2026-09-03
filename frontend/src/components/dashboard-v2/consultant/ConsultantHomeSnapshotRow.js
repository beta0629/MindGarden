/**
 * ConsultantHomeSnapshotRow — 최근 메시지 · 급여 정산 스냅샷 (Expo Home parity)
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CONSULTANT_DASHBOARD_HOME_COPY as COPY,
  CONSULTANT_DASHBOARD_SNAPSHOT_TEST_ID
} from '../../../constants/consultantDashboardConstants';

/**
 * @param {{
 *   message?: { partnerName?: string, lastMessage?: string }|null,
 *   salary?: { periodLabel?: string, netLabel?: string }|null,
 *   onPressMessage?: () => void,
 *   onPressSalary?: () => void,
 *   className?: string
 * }} props
 */
const ConsultantHomeSnapshotRow = ({
  message = null,
  salary = null,
  onPressMessage,
  onPressSalary,
  className = ''
}) => {
  const messageTitle = message?.partnerName
    ? toDisplayString(message.partnerName, COPY.SNAPSHOT_MESSAGE_TITLE)
    : COPY.SNAPSHOT_MESSAGE_TITLE;
  const messageSub = message?.lastMessage
    ? toDisplayString(message.lastMessage, COPY.SNAPSHOT_MESSAGE_EMPTY)
    : COPY.SNAPSHOT_MESSAGE_EMPTY;
  const salaryTitle = COPY.SNAPSHOT_SALARY_TITLE;
  const salarySub = salary
    ? [
      toDisplayString(salary.periodLabel, ''),
      toDisplayString(salary.netLabel, '')
    ].filter(Boolean).join(' · ') || COPY.SNAPSHOT_SALARY_EMPTY
    : COPY.SNAPSHOT_SALARY_EMPTY;

  return (
    <section
      className={`consultant-home-snapshot ${className}`.trim()}
      aria-label="활동 스냅샷"
      data-testid={CONSULTANT_DASHBOARD_SNAPSHOT_TEST_ID}
    >
      <MGButton
        type="button"
        variant="ghost"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'md',
          loading: false,
          className: 'consultant-home-snapshot__tile'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onPressMessage}
        preventDoubleClick={false}
        aria-label={COPY.SNAPSHOT_MESSAGE_TITLE}
      >
        <span className="consultant-home-snapshot__tile-title">
          <SafeText tag="span">{messageTitle}</SafeText>
        </span>
        <span className="consultant-home-snapshot__tile-sub">
          <SafeText tag="span">{messageSub}</SafeText>
        </span>
      </MGButton>
      <MGButton
        type="button"
        variant="ghost"
        size="medium"
        className={buildErpMgButtonClassName({
          variant: 'ghost',
          size: 'md',
          loading: false,
          className: 'consultant-home-snapshot__tile'
        })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        onClick={onPressSalary}
        preventDoubleClick={false}
        aria-label={COPY.SNAPSHOT_SALARY_TITLE}
      >
        <span className="consultant-home-snapshot__tile-title">
          <SafeText tag="span">{salaryTitle}</SafeText>
        </span>
        <span className="consultant-home-snapshot__tile-sub">
          <SafeText tag="span">{salarySub}</SafeText>
        </span>
      </MGButton>
    </section>
  );
};

ConsultantHomeSnapshotRow.propTypes = {
  message: PropTypes.shape({
    partnerName: PropTypes.string,
    lastMessage: PropTypes.string
  }),
  salary: PropTypes.shape({
    periodLabel: PropTypes.string,
    netLabel: PropTypes.string
  }),
  onPressMessage: PropTypes.func,
  onPressSalary: PropTypes.func,
  className: PropTypes.string
};

export default ConsultantHomeSnapshotRow;
