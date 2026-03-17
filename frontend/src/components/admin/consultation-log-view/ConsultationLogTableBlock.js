/**
 * 상담일지 조회 - 테이블 뷰 블록 (ListTableView 기반)
 * 컬럼: 세션일자, 회기, 내담자명, 상담사명, 완료여부, 요약(50자), 작성일. 행 클릭 시 모달.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import ListTableView from '../../common/ListTableView';
import EmptyState from '../../common/EmptyState';
import './ConsultationLogTableBlock.css';

const EMPTY_TITLE = '등록된 상담일지가 없습니다.';
const EMPTY_DESC = '다른 필터를 적용해 보시거나, 스케줄에서 상담일지를 작성해 주세요.';
const BADGE_COMPLETED = '완료';
const BADGE_INCOMPLETE = '미완료';
const SESSION_SUFFIX = '회기';
const SUMMARY_MAX_LEN = 50;
const MOBILE_HINT = '가로 스크롤하여 전체 컬럼을 확인할 수 있습니다.';

const COLUMNS = [
  { key: 'sessionDate', label: '세션일자' },
  { key: 'sessionNumber', label: '회기' },
  { key: 'clientName', label: '내담자명' },
  { key: 'consultantName', label: '상담사명' },
  { key: 'isSessionCompleted', label: '완료여부' },
  { key: 'summary', label: '요약' },
  { key: 'createdAt', label: '작성일' }
];

const formatDate = (val) => {
  if (!val) return '-';
  if (typeof val === 'string') return val.split('T')[0];
  return val;
};

const truncate = (str, maxLen) => {
  if (!str || typeof str !== 'string') return '-';
  const trimmed = str.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}…`;
};

const ConsultationLogTableBlock = ({
  records,
  clientNameMap,
  consultantNameMap,
  onRowClick
}) => {
  const isEmpty = !records || records.length === 0;

  if (isEmpty) {
    return (
      <ContentSection noCard className="mg-v2-consultation-log-table-block">
        <ContentCard className="mg-v2-consultation-log-table-block__card">
          <EmptyState
            className="mg-v2-consultation-log-table-block__empty"
            icon={<FileText size={48} />}
            title={EMPTY_TITLE}
            description={EMPTY_DESC}
          />
        </ContentCard>
      </ContentSection>
    );
  }

  const data = records.map((record) => {
    const sessionDate = record.sessionDate ?? record.consultationDate;
    const clientName =
      record.clientName ??
      (record.clientId && clientNameMap
        ? clientNameMap[Number(record.clientId)]
        : null) ??
      `내담자 #${record.clientId}`;
    const consultantName =
      record.consultantName ??
      (record.consultantId && consultantNameMap
        ? consultantNameMap[Number(record.consultantId)]
        : null) ??
      `상담사 #${record.consultantId}`;
    return {
      ...record,
      sessionDate,
      sessionNumber: record.sessionNumber ?? 0,
      clientName,
      consultantName,
      summary: truncate(record.clientCondition, SUMMARY_MAX_LEN),
      createdAt: record.createdAt ?? record.updatedAt
    };
  });

  const renderCell = (columnKey, item) => {
    switch (columnKey) {
      case 'sessionDate':
        return formatDate(item.sessionDate);
      case 'sessionNumber':
        return `${item.sessionNumber}${SESSION_SUFFIX}`;
      case 'clientName':
        return item.clientName;
      case 'consultantName':
        return item.consultantName;
      case 'isSessionCompleted': {
        const isCompleted = item.isSessionCompleted === true;
        return (
          <span
            className={
              isCompleted
                ? 'mg-v2-badge mg-v2-badge--success'
                : 'mg-v2-badge mg-v2-badge--warning'
            }
          >
            {isCompleted ? BADGE_COMPLETED : BADGE_INCOMPLETE}
          </span>
        );
      }
      case 'summary':
        return <span className="mg-v2-consultation-log-table__summary">{item.summary}</span>;
      case 'createdAt':
        return formatDate(item.createdAt);
      default:
        return item[columnKey] ?? '-';
    }
  };

  return (
    <ContentSection noCard className="mg-v2-consultation-log-table-block">
      <ContentCard className="mg-v2-consultation-log-table-block__card">
        <p className="mg-v2-consultation-log-table-block__mobile-hint" aria-hidden="true">
          {MOBILE_HINT}
        </p>
        <div className="mg-v2-consultation-log-table-block__scroll">
          <ListTableView
            columns={COLUMNS}
            data={data}
            renderCell={renderCell}
            onRowClick={(item) => onRowClick(item.id)}
            className="mg-v2-consultation-log-table"
            rowKeyField="id"
          />
        </div>
      </ContentCard>
    </ContentSection>
  );
};

ConsultationLogTableBlock.propTypes = {
  records: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      sessionDate: PropTypes.string,
      consultationDate: PropTypes.string,
      sessionNumber: PropTypes.number,
      clientId: PropTypes.number,
      clientName: PropTypes.string,
      consultantId: PropTypes.number,
      consultantName: PropTypes.string,
      isSessionCompleted: PropTypes.bool,
      clientCondition: PropTypes.string,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ),
  clientNameMap: PropTypes.object,
  consultantNameMap: PropTypes.object,
  onRowClick: PropTypes.func.isRequired
};

export default ConsultationLogTableBlock;
