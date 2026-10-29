/**
 * 상담사 웹 태블릿 일지 목록 — 1열 터치 행 · slate 작성상태 칩 · 빈 상태
 * UI/레이아웃만. API·저장 로직 변경 없음.
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  CONSULTATION_LOG_STATUS_ALL,
  CONSULTATION_LOG_STATUS_DONE,
  CONSULTATION_LOG_STATUS_PENDING,
  formatDisplayDate,
  visibleSessionNumber
} from '../../admin/consultation-log-view/consultationLogQuery';
import {
  CONSULTANT_JOURNAL_STATUS_CHIP,
  CONSULTANT_JOURNAL_TABLET_CLASS as C,
  CONSULTANT_JOURNAL_TABLET_TEST_ID
} from './consultantJournalTabletConstants';
import { CONSULTANT_SUITE_NS } from '../../../constants/consultantSuite';
import './ConsultantJournalTabletList.css';

const META_SEP = ' · ';
const EMPTY_DASH = '—';

/**
 * @param {Object} record
 * @returns {string}
 */
const resolveMethodLabel = (record) => {
  const raw = record?.sessionType
    || record?.consultationType
    || record?.consultationMethod
    || record?.method
    || '';
  return String(raw).trim();
};

/**
 * @param {Object} record
 * @param {Function} t
 * @returns {string}
 */
const buildRowMeta = (record, t) => {
  const dateLabel = formatDisplayDate(record.sessionDate ?? record.consultationDate) || EMPTY_DASH;
  const sessionN = visibleSessionNumber(record.sessionNumber);
  const sessionLabel = sessionN != null
    ? t('journalTablet.sessionUnit', { count: sessionN })
    : '';
  const method = resolveMethodLabel(record);
  return [dateLabel, sessionLabel, method].filter(Boolean).join(META_SEP);
};

/**
 * API status ↔ 칩 키
 *
 * @param {string} status
 * @returns {string}
 */
export const statusToChipKey = (status) => {
  if (status === CONSULTATION_LOG_STATUS_DONE) {
    return CONSULTANT_JOURNAL_STATUS_CHIP.DONE;
  }
  if (status === CONSULTATION_LOG_STATUS_PENDING) {
    return CONSULTANT_JOURNAL_STATUS_CHIP.PENDING;
  }
  return CONSULTANT_JOURNAL_STATUS_CHIP.ALL;
};

/**
 * @param {string} chipKey
 * @returns {string}
 */
export const chipKeyToStatus = (chipKey) => {
  if (chipKey === CONSULTANT_JOURNAL_STATUS_CHIP.DONE) {
    return CONSULTATION_LOG_STATUS_DONE;
  }
  if (chipKey === CONSULTANT_JOURNAL_STATUS_CHIP.PENDING) {
    return CONSULTATION_LOG_STATUS_PENDING;
  }
  return CONSULTATION_LOG_STATUS_ALL;
};

const ConsultantJournalTabletList = ({
  records,
  status,
  onStatusChange,
  onOpenRecord,
  clientNameMap
}) => {
  const { t } = useTranslation(CONSULTANT_SUITE_NS);
  const activeChip = statusToChipKey(status);

  const chips = useMemo(() => ([
    { key: CONSULTANT_JOURNAL_STATUS_CHIP.ALL, label: t('journalTablet.filterAll') },
    { key: CONSULTANT_JOURNAL_STATUS_CHIP.PENDING, label: t('journalTablet.filterPending') },
    { key: CONSULTANT_JOURNAL_STATUS_CHIP.DONE, label: t('journalTablet.filterDone') }
  ]), [t]);

  const isPendingEmpty = activeChip === CONSULTANT_JOURNAL_STATUS_CHIP.PENDING
    && (!records || records.length === 0);

  const handleChip = (chipKey) => {
    onStatusChange(chipKeyToStatus(chipKey));
  };

  return (
    <div className={C.ROOT} data-testid={CONSULTANT_JOURNAL_TABLET_TEST_ID.LIST}>
      <div
        className={C.CHIPS}
        role="tablist"
        aria-label={t('journalTablet.statusFilterAria')}
        data-testid={CONSULTANT_JOURNAL_TABLET_TEST_ID.STATUS_CHIPS}
      >
        {chips.map((chip) => {
          const isOn = chip.key === activeChip;
          const chipClass = [C.CHIP, isOn ? C.CHIP_ON : ''].filter(Boolean).join(' ');
          return (
            <MGButton
              key={chip.key}
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: chipClass
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              aria-pressed={isOn}
              onClick={() => handleChip(chip.key)}
              preventDoubleClick={false}
            >
              {chip.label}
            </MGButton>
          );
        })}
      </div>

      {(!records || records.length === 0) ? (
        <div className={C.EMPTY} role="status">
          <p className={C.EMPTY_TITLE}>
            {isPendingEmpty
              ? t('journalTablet.emptyPendingTitle')
              : t('journalTablet.emptyTitle')}
          </p>
          <p className={C.EMPTY_CAP}>
            {isPendingEmpty
              ? t('journalTablet.emptyPendingDescription')
              : t('journalTablet.emptyDescription')}
          </p>
          {isPendingEmpty ? (
            <MGButton
              type="button"
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false,
                className: C.EMPTY_ACTION
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => handleChip(CONSULTANT_JOURNAL_STATUS_CHIP.ALL)}
              preventDoubleClick={false}
            >
              {t('journalTablet.viewAll')}
            </MGButton>
          ) : null}
        </div>
      ) : (
        <ul className={C.LIST} aria-label={t('journalTablet.listAria')}>
          {records.map((record) => {
            const clientName = toDisplayString(
              record.clientName
                ?? (record.clientId != null ? clientNameMap?.[Number(record.clientId)] : undefined),
              t('records.unassignedClient')
            );
            const done = record.isSessionCompleted === true;
            const pillClass = [C.PILL, done ? C.PILL_DONE : C.PILL_OPEN].join(' ');
            return (
              <li key={record.id}>
                <button
                  type="button"
                  className={C.ROW}
                  data-testid={CONSULTANT_JOURNAL_TABLET_TEST_ID.ROW}
                  onClick={() => onOpenRecord(record)}
                  aria-label={t('journalTablet.openAria', {
                    client: clientName,
                    date: formatDisplayDate(record.sessionDate ?? record.consultationDate) || EMPTY_DASH
                  })}
                >
                  <div className={C.ROW_MAIN}>
                    <SafeText tag="span" className={C.ROW_NAME}>{clientName}</SafeText>
                    <span className={C.ROW_META}>{buildRowMeta(record, t)}</span>
                  </div>
                  <span className={pillClass}>
                    {done ? t('journalTablet.badgeDone') : t('journalTablet.badgePending')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

ConsultantJournalTabletList.propTypes = {
  records: PropTypes.arrayOf(PropTypes.object),
  status: PropTypes.string,
  onStatusChange: PropTypes.func.isRequired,
  onOpenRecord: PropTypes.func.isRequired,
  clientNameMap: PropTypes.object
};

ConsultantJournalTabletList.defaultProps = {
  records: [],
  status: CONSULTATION_LOG_STATUS_ALL,
  clientNameMap: {}
};

export default ConsultantJournalTabletList;
