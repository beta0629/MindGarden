/**
 * ConsultantRecordCard — 상담 일지 카드 (records·logs 공유)
 * ConsultantSuiteCard 기반 · 날짜 타이틀 · 회기/내담자 body · foot 필+ghost 액션
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import SafeText from '../../common/SafeText';
import ConsultantSuiteButton from './ConsultantSuiteButton';
import ConsultantSuiteCard, { ConsultantSuitePill } from './ConsultantSuiteCard';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../../constants/consultantSuite';

const ACTION_ICON_SIZE = 16;
const EMPTY_DASH = '—';

/**
 * ISO 일시 문자열에서 날짜(yyyy-MM-dd)만 남긴다.
 *
 * @param {*} value
 * @returns {string}
 */
export const toRecordDateLabel = (value) => {
  if (!value) {
    return EMPTY_DASH;
  }
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return toDisplayString(value, EMPTY_DASH);
};

const ConsultantRecordCard = ({ record, onOpen, showClient }) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const sessionDate = record.sessionDate ?? record.consultationDate;
  const sessionNumber = Number(record.sessionNumber) || 0;
  const isCompleted = record.isSessionCompleted === true;
  const sessionLabel = sessionNumber > 0
    ? t('records.sessionUnit', { count: sessionNumber })
    : toDisplayString(record.title, t('records.untitled'));
  const clientName = toDisplayString(record.clientName, t('records.unassignedClient'));
  const dateLabel = toRecordDateLabel(sessionDate);

  return (
    <ConsultantSuiteCard
      testId={CONSULTANT_SUITE_TEST_ID.RECORD_CARD}
      className={CONSULTANT_SUITE_CLASS.RECORD_CARD}
      title={dateLabel}
      body={(
        <>
          <SafeText tag="p" className="consultant-suite-record-card__session">{sessionLabel}</SafeText>
          {showClient ? (
            <SafeText tag="p" className="consultant-suite-record-card__client">{clientName}</SafeText>
          ) : null}
        </>
      )}
      foot={(
        <>
          <ConsultantSuitePill>
            {isCompleted ? t('records.completed') : t('records.incomplete')}
          </ConsultantSuitePill>
          <ConsultantSuiteButton
            icon={<FileText size={ACTION_ICON_SIZE} aria-hidden />}
            onClick={() => onOpen(record.id)}
            ariaLabel={t('records.openAria', { date: dateLabel, client: clientName })}
          >
            {isCompleted ? t('actions.viewLog') : t('actions.writeLog')}
          </ConsultantSuiteButton>
        </>
      )}
    />
  );
};

ConsultantRecordCard.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    sessionDate: PropTypes.string,
    consultationDate: PropTypes.string,
    sessionNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    clientName: PropTypes.string,
    isSessionCompleted: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
  showClient: PropTypes.bool
};

ConsultantRecordCard.defaultProps = {
  showClient: true
};

export default ConsultantRecordCard;
