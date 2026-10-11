/**
 * 상담일지 표. 행의 상담일 버튼이 상세를 연다.
 * 묶음은 consultationLogGrouping 한 함수를 쓴다.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-10-11 — 그룹 표기
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import ListTableView from '../../common/ListTableView';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ConsultationLogStatusBadge from './ConsultationLogStatusBadge';
import ConsultationLogClientSummary from './ConsultationLogClientSummary';
import {
  CONSULTATION_LOG_COLUMN,
  CONSULTATION_LOG_GROUP_MODE,
  buildConsultationLogGroupView,
  consultationLogGroupModeFromFilters
} from './consultationLogGrouping';
import {
  formatDisplayDate,
  resolvePersonName,
  resolveSummaryText,
  visibleSessionNumber
} from './consultationLogQuery';
import '../../../i18n';
import './ConsultationLogTableBlock.css';

const NS = 'adminConsultationLogs';

const flatRows = (view) => view.sections.flatMap((section) => section.rows.map((entry, index) => ({
  ...entry.row,
  sectionKey: section.key,
  sectionHeader: index === 0 ? section.header : null,
  repeatClient: entry.repeatClient,
  accessibleClientName: entry.accessibleClientName,
  clientNameMissing: entry.clientNameMissing,
  consultantNameMissing: entry.consultantNameMissing
})));

const ConsultationLogTableBlock = ({
  records,
  clientNameMap,
  consultantNameMap,
  selectedLogId,
  onOpenRow,
  grouping
}) => {
  const { t } = useTranslation(NS);
  const columns = [
    { key: CONSULTATION_LOG_COLUMN.DATE, label: t('table.colDate') },
    { key: CONSULTATION_LOG_COLUMN.CLIENT, label: t('table.colClient') },
    { key: CONSULTATION_LOG_COLUMN.CONSULTANT, label: t('table.colConsultant') },
    { key: CONSULTATION_LOG_COLUMN.STATUS, label: t('table.colStatus') },
    { key: CONSULTATION_LOG_COLUMN.SUMMARY, label: t('table.colSummary') }
  ];
  const unknownName = t('people.unknownName');
  const mode = grouping
    ? consultationLogGroupModeFromFilters(grouping.clientId, grouping.consultantId)
    : null;

  const data = useMemo(() => (records || []).map((record) => {
    const sessionDate = formatDisplayDate(record.sessionDate ?? record.consultationDate);
    const clientName = resolvePersonName(record.clientName, record.clientId, clientNameMap, unknownName);
    const consultantName = resolvePersonName(
      record.consultantName,
      record.consultantId,
      consultantNameMap,
      unknownName
    );
    return {
      ...record,
      sessionDate,
      clientName,
      consultantName,
      clientNameMissing: clientName === unknownName,
      consultantNameMissing: consultantName === unknownName,
      summaryText: resolveSummaryText(record),
      sessionCount: visibleSessionNumber(record.sessionNumber)
    };
  }), [records, clientNameMap, consultantNameMap, unknownName]);

  const view = useMemo(() => {
    if (!mode) {
      return null;
    }
    return buildConsultationLogGroupView({
      mode,
      rows: data,
      missingNameLabel: unknownName,
      preserveOrder: true,
      periodSummary: grouping.summary || null,
      clientPeriods: grouping.summary && Array.isArray(grouping.summary.clients)
        ? grouping.summary.clients
        : [],
      periodFrom: grouping.periodFrom,
      periodTo: grouping.periodTo
    });
  }, [mode, data, unknownName, grouping]);

  const tableRows = view ? flatRows(view) : data;
  const captionName = view && view.summary && view.summary.clientName
    ? view.summary.clientName
    : (tableRows.find((item) => item.clientName && !item.clientNameMissing) || {}).clientName || unknownName;
  const captionConsultant = (tableRows.find((item) => item.consultantName && !item.consultantNameMissing) || {})
    .consultantName || unknownName;
  let caption = t('table.caption');
  if (view && view.captionKind === 'client') {
    caption = t('group.caption.client', { name: captionName });
  } else if (view && view.captionKind === 'counselor') {
    caption = t('group.caption.counselor', { name: captionConsultant });
  } else if (view && view.captionKind === 'repeat') {
    caption = t('group.caption.repeat');
  }

  const renderName = (name, missing) => (
    missing
      ? <span className="mg-v2-consultation-log-name-missing">{name}</span>
      : name
  );

  const renderCell = (columnKey, item) => {
    if (columnKey === CONSULTATION_LOG_COLUMN.DATE) {
      const sessionLabel = item.sessionCount == null
        ? ''
        : t('table.sessionN', { n: item.sessionCount });
      return (
        <MGButton
          type="button"
          variant="ghost"
          size="small"
          id={`consultation-log-row-${item.id}`}
          className={buildErpMgButtonClassName({
            variant: 'ghost',
            size: 'sm',
            loading: false,
            className: 'mg-v2-consultation-log-date-button'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          aria-label={t('table.openRow', { date: item.sessionDate, name: item.clientName })}
          onClick={() => onOpenRow(item.id)}
          preventDoubleClick={false}
        >
          <span>{item.sessionDate}</span>
          {sessionLabel ? <span className="mg-v2-consultation-log-date-button__session">{sessionLabel}</span> : null}
        </MGButton>
      );
    }
    if (columnKey === CONSULTATION_LOG_COLUMN.STATUS) {
      return (
        <ConsultationLogStatusBadge
          done={item.isSessionCompleted === true}
          doneLabel={t('status.done')}
          pendingLabel={t('status.pending')}
        />
      );
    }
    if (columnKey === CONSULTATION_LOG_COLUMN.SUMMARY) {
      return (
        <span className="mg-v2-consultation-log-summary" title={item.summaryText}>
          {item.summaryText}
        </span>
      );
    }
    if (columnKey === CONSULTATION_LOG_COLUMN.CLIENT) {
      return renderName(item.clientName, item.clientNameMissing);
    }
    if (columnKey === CONSULTATION_LOG_COLUMN.CONSULTANT) {
      return renderName(item.consultantName, item.consultantNameMissing);
    }
    return item[columnKey] || unknownName;
  };

  const renderGroupHeader = (_groupKey, items) => {
    const header = items[0] && items[0].sectionHeader;
    if (!header) {
      return null;
    }
    if (header.kind === 'counselorChange') {
      const text = t('group.counselorChange', { name: header.name });
      return header.nameMissing
        ? <span className="mg-v2-consultation-log-name-missing">{text}</span>
        : text;
    }
    return (
      <span className="mg-v2-consultation-log-group-head">
        {header.nameMissing
          ? <span className="mg-v2-consultation-log-name-missing">{header.name}</span>
          : <span className="mg-v2-consultation-log-group-head__name">{header.name}</span>}
        {header.countsReady ? (
          <span className="mg-v2-consultation-log-group-head__meta">
            <span className="mg-v2-consultation-log-group-head__rule" aria-hidden="true" />
            <span>
              {t('group.head.sessions', { n: header.sessionCount })}
              {t('group.head.joiner')}
              {t('group.head.last', { date: header.lastSessionDate })}
            </span>
          </span>
        ) : null}
      </span>
    );
  };

  const tableClass = [
    'mg-v2-consultation-log-table',
    mode ? `mg-v2-consultation-log-table--${mode}` : ''
  ].filter(Boolean).join(' ');

  return (
    <ContentSection noCard className="mg-v2-consultation-log-table-block">
      {view ? <ConsultationLogClientSummary summary={view.summary} /> : null}
      <ContentCard className="mg-v2-consultation-log-table-block__card">
        <ListTableView
          columns={columns}
          data={tableRows}
          renderCell={renderCell}
          caption={caption}
          selectedRowKey={selectedLogId}
          className={tableClass}
          rowKeyField="id"
          hiddenColumnKeys={view ? view.hiddenColumnKeys : []}
          groupBy={view ? (item) => item.sectionKey : null}
          renderGroupHeader={view ? renderGroupHeader : null}
          groupHeaderClassName={view ? (_groupKey, items) => {
            const header = items[0] && items[0].sectionHeader;
            if (!header) {
              return '';
            }
            return header.kind === 'counselorChange'
              ? 'mg-v2-consultation-log-counselor-change'
              : 'mg-v2-consultation-log-group-row';
          } : null}
          isRepeatCell={view ? (columnKey, item) => (
            columnKey === CONSULTATION_LOG_COLUMN.CLIENT && item.repeatClient === true
          ) : null}
          renderRepeatCell={view ? (columnKey, item) => (
            <>
              <span className="sr-only">{item.accessibleClientName}</span>
              <span className="mg-v2-consultation-log-repeat-tick" aria-hidden="true" />
            </>
          ) : null}
          rowClassName={view ? (item) => (
            item.repeatClient ? 'mg-v2-consultation-log-row--repeat' : ''
          ) : null}
        />
      </ContentCard>
    </ContentSection>
  );
};

ConsultationLogTableBlock.propTypes = {
  records: PropTypes.arrayOf(PropTypes.object),
  clientNameMap: PropTypes.object,
  consultantNameMap: PropTypes.object,
  selectedLogId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onOpenRow: PropTypes.func.isRequired,
  grouping: PropTypes.shape({
    clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    consultantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    periodFrom: PropTypes.string,
    periodTo: PropTypes.string,
    summary: PropTypes.object
  })
};

ConsultationLogTableBlock.defaultProps = {
  records: [],
  clientNameMap: {},
  consultantNameMap: {},
  selectedLogId: null,
  grouping: null
};

export default ConsultationLogTableBlock;
