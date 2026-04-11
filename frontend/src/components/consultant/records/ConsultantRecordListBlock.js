/**
 * 상담사 전용 상담일지 조회 - 목록(카드) 블록 (Organism)
 * 아토믹 디자인 패턴에 따라 목록 렌더링을 담당합니다.
 *
 * @author Core Solution
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import MGButton from '../../common/MGButton';

const EMPTY_TITLE = '등록된 상담일지가 없습니다.';
const EMPTY_DESC = '아직 작성된 상담 기록이 없습니다. 상담 기록은 일정 관리에서 작성할 수 있습니다.';
const BADGE_COMPLETED = '완료';
const BADGE_INCOMPLETE = '미완료';
const SESSION_SUFFIX = '회기';

const formatDate = (val) => {
  if (!val) return '-';
  if (typeof val === 'string') return val.split('T')[0];
  return val;
};

const ConsultantRecordListBlock = ({ records, onViewRecord, onWriteRecord, onNavigateSchedule }) => {
  const isEmpty = !records || records.length === 0;

  const renderContent = () => {
    if (isEmpty) {
      return (
        <div className="mg-v2-consultation-log-list-block__empty">
          <div className="mg-v2-consultation-log-list-block__empty-icon">
            <FileText size={48} />
          </div>
          <h3 className="mg-v2-consultation-log-list-block__empty-title">{EMPTY_TITLE}</h3>
          <p className="mg-v2-consultation-log-list-block__empty-desc">{EMPTY_DESC}</p>
          <MGButton 
            variant="outline"
            onClick={onNavigateSchedule}
            style={{ marginTop: '1rem' }}
          >
            <i className="bi bi-calendar" /> 일정 관리로 이동
          </MGButton>
        </div>
      );
    }

    return (
      <div className="mg-v2-consultation-log-list-block__grid">
        {records.map((record) => {
          const sessionDate = record.sessionDate ?? record.consultationDate;
          const sessionNumber = record.sessionNumber ?? 0;
          const clientName = record.clientName ?? '미지정';
          const isCompleted = record.isSessionCompleted === true;
          const updatedAt = record.updatedAt ?? record.createdAt;

          return (
            <div key={record.id} className="mg-v2-consultation-log-list-block__card" style={{ display: 'flex', flexDirection: 'column', cursor: 'default' }}>
              <div className="mg-v2-consultation-log-list-block__card-inner" style={{ flexGrow: 1 }}>
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--date">
                  {formatDate(sessionDate)}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row">
                  {sessionNumber > 0 ? `${sessionNumber}${SESSION_SUFFIX}` : record.title || '제목 없음'}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--name">
                  {clientName}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row">
                  <span
                    className={
                      isCompleted
                        ? 'mg-v2-badge mg-v2-badge--success'
                        : 'mg-v2-badge mg-v2-badge--warning'
                    }
                  >
                    {isCompleted ? BADGE_COMPLETED : BADGE_INCOMPLETE}
                  </span>
                </div>
                {updatedAt && (
                  <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--meta">
                    수정일: {formatDate(updatedAt)}
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid var(--mg-gray-200)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                {isCompleted ? (
                  <MGButton
                    variant="outline"
                    size="small"
                    onClick={() => onViewRecord(record.id)}
                  >
                    <i className="bi bi-eye" /> 상담일지 조회
                  </MGButton>
                ) : (
                  <MGButton
                    variant="primary"
                    size="small"
                    onClick={() => onWriteRecord(record.id)}
                  >
                    <i className="bi bi-pencil-square" /> 상담일지 작성
                  </MGButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ContentSection noCard className="mg-v2-consultation-log-list-block">
      <ContentCard className="mg-v2-consultation-log-list-block__card-wrap">
        {renderContent()}
      </ContentCard>
    </ContentSection>
  );
};

ConsultantRecordListBlock.propTypes = {
  records: PropTypes.array.isRequired,
  onViewRecord: PropTypes.func.isRequired,
  onWriteRecord: PropTypes.func.isRequired,
  onNavigateSchedule: PropTypes.func.isRequired
};

export default ConsultantRecordListBlock;
