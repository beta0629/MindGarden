/**
 * 상담일지 표. 행의 상담일 버튼이 상세를 연다.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-10-10 — 열 5개, 선택 행, 이름 없음
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import ListTableView from '../../common/ListTableView';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ConsultationLogStatusBadge from './ConsultationLogStatusBadge';
import {
  formatDisplayDate,
  resolvePersonName,
  resolveSummaryText,
  visibleSessionNumber
} from './consultationLogQuery';
import '../../../i18n';
import './ConsultationLogTableBlock.css';

const NS = 'adminConsultationLogs';

const ConsultationLogTableBlock = ({
  records = [],
  clientNameMap = {},
  consultantNameMap = {},
  selectedLogId = null,
  onOpenRow
}) => {
  const { t } = useTranslation(NS);
  const columns = [
    { key: 'date', label: t('table.colDate') },
    { key: 'clientName', label: t('table.colClient') },
    { key: 'consultantName', label: t('table.colConsultant') },
    { key: 'status', label: t('table.colStatus') },
    { key: 'summary', label: t('table.colSummary') }
  ];
  const unknownName = t('people.unknownName');

  const data = (records || []).map((record) => {
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
      summaryText: resolveSummaryText(record),
      sessionCount: visibleSessionNumber(record.sessionNumber)
    };
  });

  const renderCell = (columnKey, item) => {
    if (columnKey === 'date') {
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
    if (columnKey === 'status') {
      return (
        <ConsultationLogStatusBadge
          done={item.isSessionCompleted === true}
          doneLabel={t('status.done')}
          pendingLabel={t('status.pending')}
        />
      );
    }
    if (columnKey === 'summary') {
      return (
        <span className="mg-v2-consultation-log-summary" title={item.summaryText}>
          {item.summaryText}
        </span>
      );
    }
    return item[columnKey] || unknownName;
  };

  return (
    <ContentSection noCard className="mg-v2-consultation-log-table-block">
      <ContentCard className="mg-v2-consultation-log-table-block__card">
        <ListTableView
          columns={columns}
          data={data}
          renderCell={renderCell}
          caption={t('table.caption')}
          selectedRowKey={selectedLogId}
          className="mg-v2-consultation-log-table"
          rowKeyField="id"
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
  onOpenRow: PropTypes.func.isRequired
};

export default ConsultationLogTableBlock;
