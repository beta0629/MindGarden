/**
 * ConsultantRecordCard — 상담 일지 카드 (records·logs 공유)
 * 일시 · 회기 · 내담자 · slate 상태칩 · ghost h36 액션. 틸/초록 뱃지·primary 없음.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import StatusBadge from '../../common/StatusBadge';
import SafeText from '../../common/SafeText';
import ConsultantSuiteButton from './ConsultantSuiteButton';
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
  const updatedAt = record.updatedAt ?? record.createdAt;
  const sessionLabel = sessionNumber > 0
    ? t('records.sessionUnit', { count: sessionNumber })
    : toDisplayString(record.title, t('records.untitled'));
  const clientName = toDisplayString(record.clientName, t('records.unassignedClient'));
  const dateLabel = toRecordDateLabel(sessionDate);

  return (
    <article
      className={CONSULTANT_SUITE_CLASS.RECORD_CARD}
      data-testid={CONSULTANT_SUITE_TEST_ID.RECORD_CARD}
    >
      <header className="consultant-suite-record-card__head">
        <time className="consultant-suite-record-card__date" dateTime={dateLabel}>{dateLabel}</time>
        <StatusBadge variant="neutral" className={CONSULTANT_SUITE_CLASS.STATUS}>
          {isCompleted ? t('records.completed') : t('records.incomplete')}
        </StatusBadge>
      </header>
      <dl className="consultant-suite-record-card__body">
        <div className="consultant-suite-record-card__row">
          <dt>{t('records.sessionLabel')}</dt>
          <dd><SafeText>{sessionLabel}</SafeText></dd>
        </div>
        {showClient ? (
          <div className="consultant-suite-record-card__row">
            <dt>{t('records.clientLabel')}</dt>
            <dd className="consultant-suite-record-card__client"><SafeText>{clientName}</SafeText></dd>
          </div>
        ) : null}
        {updatedAt ? (
          <div className="consultant-suite-record-card__row consultant-suite-record-card__row--meta">
            <dt>{t('records.updatedLabel')}</dt>
            <dd>{toRecordDateLabel(updatedAt)}</dd>
          </div>
        ) : null}
      </dl>
      <footer className="consultant-suite-record-card__foot">
        <ConsultantSuiteButton
          icon={<FileText size={ACTION_ICON_SIZE} aria-hidden />}
          onClick={() => onOpen(record.id)}
          ariaLabel={t('records.openAria', { date: dateLabel, client: clientName })}
        >
          {isCompleted ? t('actions.viewLog') : t('actions.writeLog')}
        </ConsultantSuiteButton>
      </footer>
    </article>
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
