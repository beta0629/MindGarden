/**
 * 상담일지 조회 - 목록(카드) 블록
 * 카드 클릭 시 recordId로 ConsultationLogModal 오픈.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import MGButton from '../../common/MGButton';

const EMPTY_TITLE = '등록된 상담일지가 없습니다.';
const EMPTY_DESC = '다른 필터를 적용해 보시거나, 스케줄에서 상담일지를 작성해 주세요.';
const BADGE_COMPLETED = '완료';
const BADGE_INCOMPLETE = '미완료';
const SESSION_SUFFIX = '회기';

const formatDate = (val) => {
  if (!val) return '-';
  if (typeof val === 'string') return val.split('T')[0];
  return val;
};

const ConsultationLogListBlock = ({ records, clientNameMap, consultantNameMap, onCardClick }) => {
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
        </div>
      );
    }

    return (
      <div className="mg-v2-consultation-log-list-block__grid">
        {records.map((record) => {
          const sessionDate = record.sessionDate ?? record.consultationDate;
          const sessionNumber = record.sessionNumber ?? 0;
          const clientName = (record.clientName ?? (record.clientId && clientNameMap ? clientNameMap[Number(record.clientId)] : null)) || `내담자 #${record.clientId}`;
          const consultantName = (record.consultantName ?? (record.consultantId && consultantNameMap ? consultantNameMap[Number(record.consultantId)] : null)) || `상담사 #${record.consultantId}`;
          const isCompleted = record.isSessionCompleted === true;
          const updatedAt = record.updatedAt ?? record.createdAt;

          return (
            <MGButton
              key={record.id}
              type="button"
              variant="outline"
              className="mg-v2-consultation-log-list-block__card"
              onClick={() => onCardClick(record.id)}
              tabIndex={0}
              aria-label={`상담일지 ${sessionDate} ${clientName} 수정`}
              preventDoubleClick={false}
            >
              <div className="mg-v2-consultation-log-list-block__card-inner">
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--date">
                  {formatDate(sessionDate)}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row">
                  {sessionNumber}{SESSION_SUFFIX}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--name">
                  {clientName}
                </div>
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--secondary">
                  {consultantName}
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
                <div className="mg-v2-consultation-log-list-block__card-row mg-v2-consultation-log-list-block__card-row--meta">
                  {formatDate(updatedAt)}
                </div>
              </div>
            </MGButton>
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

ConsultationLogListBlock.propTypes = {
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
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ),
  clientNameMap: PropTypes.object,
  consultantNameMap: PropTypes.object,
  onCardClick: PropTypes.func.isRequired
};

export default ConsultationLogListBlock;
