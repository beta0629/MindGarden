/**
 * 내담자·상담사를 고른 상담일지 타임라인.
 * 선택이 없을 때의 표는 이 블록을 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import Timeline from '../../common/timeline/Timeline';
import SessionCard from '../../common/timeline/SessionCard';
import ConsultationLogClientSummary from './ConsultationLogClientSummary';
import ConsultationLogStatusBadge from './ConsultationLogStatusBadge';
import {
  CONSULTATION_LOG_GROUP_MODE,
  consultationLogGroupModeFromFilters
} from './consultationLogGrouping';
import {
  CONSULTATION_LOG_TIMELINE_SORT,
  buildConsultationLogTimelineView
} from './consultationLogTimeline';
import {
  formatDisplayDate,
  resolvePersonName,
  resolveSummaryText,
  visibleSessionNumber
} from './consultationLogQuery';
import '../../../i18n';
import './ConsultationLogTimelineBlock.css';

const NS = 'adminConsultationLogs';

const ConsultationLogTimelineBlock = ({
  records,
  clientNameMap,
  consultantNameMap,
  selectedLogId,
  onOpenRow,
  grouping,
  sort,
  onSortChange,
  preceding,
  detailPanelId
}) => {
  const { t } = useTranslation(NS);
  const unknownName = t('people.unknownName');
  const mode = grouping
    ? consultationLogGroupModeFromFilters(grouping.clientId, grouping.consultantId)
    : CONSULTATION_LOG_GROUP_MODE.NONE;

  const rows = useMemo(() => (records || []).map((record) => {
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

  const view = useMemo(() => buildConsultationLogTimelineView({
    mode,
    sort,
    rows,
    missingNameLabel: unknownName,
    preserveOrder: true,
    periodSummary: grouping && grouping.summary ? grouping.summary : null,
    clientPeriods: grouping && grouping.summary && Array.isArray(grouping.summary.clients)
      ? grouping.summary.clients
      : [],
    periodFrom: grouping ? grouping.periodFrom : '',
    periodTo: grouping ? grouping.periodTo : '',
    preceding
  }), [mode, sort, rows, unknownName, grouping, preceding]);

  const summaryName = view.summary && view.summary.clientName ? view.summary.clientName : unknownName;
  const counselorName = (rows.find((item) => item.consultantName && !item.consultantNameMissing) || {})
    .consultantName || unknownName;
  const boardLabel = mode === CONSULTATION_LOG_GROUP_MODE.COUNSELOR
    ? t('group.timeline.captionCounselor', { name: counselorName })
    : t(
      view.sort === CONSULTATION_LOG_TIMELINE_SORT.SESSION
        ? 'group.timeline.captionClientSession'
        : 'group.timeline.captionClient',
      { name: summaryName }
    );

  const labelText = (label) => {
    if (!label) {
      return '';
    }
    if (label.kind === 'change') {
      return t('group.timeline.change', { from: label.fromName, to: label.name });
    }
    return t('group.timeline.start', { name: label.name });
  };

  const renderSortButton = (value, label) => (
    <MGButton
      type="button"
      variant="outline"
      size="small"
      className={buildErpMgButtonClassName({
        variant: 'outline',
        size: 'sm',
        loading: false,
        className: 'mg-v2-consultation-log-timeline__sort-button'
      })}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      aria-pressed={view.sort === value}
      onClick={() => onSortChange(value)}
      preventDoubleClick={false}
    >
      {label}
    </MGButton>
  );

  return (
    <ContentSection noCard className="mg-v2-consultation-log-timeline">
      <ConsultationLogClientSummary summary={view.summary} />
      {view.showSort ? (
        <div className="mg-v2-consultation-log-timeline__toolbar">
          <span id="consultation-log-timeline-sort" className="mg-v2-consultation-log-timeline__sort-label">
            {t('group.timeline.sortLabel')}
          </span>
          <div
            className="mg-v2-consultation-log-timeline__sort-group"
            role="group"
            aria-labelledby="consultation-log-timeline-sort"
          >
            {renderSortButton(CONSULTATION_LOG_TIMELINE_SORT.RECENT, t('group.timeline.sortRecent'))}
            {renderSortButton(CONSULTATION_LOG_TIMELINE_SORT.SESSION, t('group.timeline.sortSession'))}
          </div>
        </div>
      ) : null}
      <div className="mg-v2-consultation-log-timeline__board" role="region" aria-label={boardLabel}>
        {view.groups.map((group) => {
          const headId = `consultation-log-timeline-group-${group.key}`;
          const listName = group.head ? group.head.name : summaryName;
          const listLabel = t('group.timeline.listLabel', { name: listName });
          return (
            <section
              key={group.key}
              className="mg-v2-consultation-log-timeline__group"
              aria-labelledby={group.head ? headId : undefined}
            >
              {group.head ? (
                <header className="mg-v2-consultation-log-timeline__group-head">
                  <h2 id={headId} className="mg-v2-consultation-log-timeline__group-name">
                    {group.head.nameMissing
                      ? <span className="mg-v2-consultation-log-name-missing">{group.head.name}</span>
                      : group.head.name}
                  </h2>
                  {group.head.countsReady ? (
                    <p className="mg-v2-consultation-log-timeline__group-meta">
                      <span className="mg-v2-consultation-log-timeline__group-rule" aria-hidden="true" />
                      <span>
                        {t('group.head.sessions', { n: group.head.sessionCount })}
                        {t('group.head.joiner')}
                        {t('group.head.last', { date: group.head.lastSessionDate })}
                      </span>
                    </p>
                  ) : null}
                </header>
              ) : null}
              <Timeline ariaLabel={listLabel}>
                {group.items.map((item) => {
                  const sessionLabel = item.row.sessionCount == null
                    ? ''
                    : t('table.sessionN', { n: item.row.sessionCount });
                  const text = labelText(item.label);
                  return (
                    <Timeline.Item
                      key={item.key}
                      label={text}
                      labelMissing={Boolean(item.label && item.label.nameMissing && item.label.kind !== 'change')}
                    >
                      <SessionCard
                        buttonId={`consultation-log-row-${item.row.id}`}
                        dateText={item.row.sessionDate}
                        sessionText={sessionLabel}
                        summary={item.row.summaryText}
                        selected={selectedLogId === item.row.id}
                        controlsId={detailPanelId}
                        onSelect={() => onOpenRow(item.row.id)}
                        srText={t('group.timeline.srCounselor', { name: item.row.consultantName })}
                        status={(
                          <ConsultationLogStatusBadge
                            done={item.row.isSessionCompleted === true}
                            doneLabel={t('status.done')}
                            pendingLabel={t('status.pending')}
                          />
                        )}
                      />
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </section>
          );
        })}
      </div>
    </ContentSection>
  );
};

ConsultationLogTimelineBlock.propTypes = {
  records: PropTypes.arrayOf(PropTypes.object),
  clientNameMap: PropTypes.object,
  consultantNameMap: PropTypes.object,
  selectedLogId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onOpenRow: PropTypes.func.isRequired,
  grouping: PropTypes.shape({
    clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    consultantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    periodFrom: PropTypes.string,
    periodTo: PropTypes.string,
    summary: PropTypes.object
  }),
  sort: PropTypes.oneOf([CONSULTATION_LOG_TIMELINE_SORT.RECENT, CONSULTATION_LOG_TIMELINE_SORT.SESSION]),
  onSortChange: PropTypes.func,
  preceding: PropTypes.shape({
    consultantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    consultantName: PropTypes.string,
    consultantNameMissing: PropTypes.bool,
    clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }),
  detailPanelId: PropTypes.string
};

ConsultationLogTimelineBlock.defaultProps = {
  records: [],
  clientNameMap: {},
  consultantNameMap: {},
  selectedLogId: null,
  grouping: null,
  sort: CONSULTATION_LOG_TIMELINE_SORT.RECENT,
  onSortChange: () => {},
  preceding: null,
  detailPanelId: 'consultation-log-detail-panel'
};

export default ConsultationLogTimelineBlock;
