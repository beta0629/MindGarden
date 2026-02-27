/**
 * PsychDocumentListBlock - 최근 업로드 문서 목록
 * ContentSection noCard + ContentCard, MappingListBlock 패턴
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FileText, LayoutGrid, List, PlayCircle, FileSearch } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import './PsychDocumentListBlock.css';

const getStatusVariant = (status) => {
  if (!status) return 'secondary';
  const s = String(status).toUpperCase();
  if (s.includes('COMPLETE') || s.includes('DONE') || s.includes('SUCCESS')) return 'success';
  if (s.includes('PENDING') || s.includes('PROCESSING') || s.includes('EXTRACTING')) return 'warning';
  if (s.includes('FAIL') || s.includes('ERROR')) return 'error';
  return 'info';
};

const PsychDocumentListBlock = ({
  documents = [],
  onGenerateReport,
  onViewReport,
  listLoadError = false
}) => {
  const [viewMode, setViewMode] = useState('table');
  const isEmpty = !documents || documents.length === 0;

  const renderEmpty = () => (
    <div className="mg-v2-psych-document-list-block__empty">
      <div className="mg-v2-psych-document-list-block__empty-icon">
        <FileText size={48} />
      </div>
      <h3 className="mg-v2-psych-document-list-block__empty-title">
        {listLoadError ? '목록을 불러오지 못했습니다' : '최근 업로드된 문서가 없습니다'}
      </h3>
      <p className="mg-v2-psych-document-list-block__empty-desc">
        {listLoadError ? '잠시 후 다시 시도해 주세요.' : 'PDF를 업로드하면 여기에 표시됩니다.'}
      </p>
    </div>
  );

  const renderTable = () => (
    <div className="mg-table-wrapper">
      <table className="mg-table">
        <thead>
          <tr>
            <th>검사</th>
            <th>상태</th>
            <th>파일</th>
            <th>생성</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.documentId}>
              <td data-label="검사">{d.assessmentType || '-'}</td>
              <td data-label="상태">
                <span className={`mg-v2-badge ${getStatusVariant(d.status)}`}>
                  {d.status || '-'}
                </span>
              </td>
              <td data-label="파일">{d.originalFilename || '파일명 없음'}</td>
              <td data-label="생성">{d.createdAt || '-'}</td>
              <td data-label="액션">
                {onViewReport && (
                  <button
                    type="button"
                    className="mg-v2-button mg-v2-button-outline mg-v2-button-sm mg-v2-psych-document-list-block__action"
                    onClick={() => onViewReport(d.documentId)}
                    title="AI 분석 결과 보기"
                  >
                    <FileSearch size={16} /> 리포트 보기
                  </button>
                )}
                <button
                  type="button"
                  className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
                  onClick={() => onGenerateReport?.(d.documentId)}
                  title="리포트 생성"
                >
                  <PlayCircle size={16} /> 리포트 생성
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCard = () => (
    <div className="mg-v2-psych-document-list-block__grid">
      {documents.map((d) => (
        <div key={d.documentId} className="mg-v2-psych-document-list-block__card-item">
          <div className="mg-v2-psych-document-list-block__card-header">
            <span className="mg-v2-psych-document-list-block__card-type">{d.assessmentType || '-'}</span>
            <span className={`mg-v2-badge ${getStatusVariant(d.status)}`}>
              {d.status || '-'}
            </span>
          </div>
          <p className="mg-v2-psych-document-list-block__card-filename">{d.originalFilename || '파일명 없음'}</p>
          <p className="mg-v2-psych-document-list-block__card-date">{d.createdAt || '-'}</p>
          <div className="mg-v2-psych-document-list-block__card-actions">
            {onViewReport && (
              <button
                type="button"
                className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
                onClick={() => onViewReport(d.documentId)}
                title="AI 분석 결과 보기"
              >
                <FileSearch size={16} /> 리포트 보기
              </button>
            )}
            <button
              type="button"
              className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
              onClick={() => onGenerateReport?.(d.documentId)}
              title="리포트 생성"
            >
              <PlayCircle size={16} /> 리포트 생성
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isEmpty) return renderEmpty();
    if (viewMode === 'card') return renderCard();
    return renderTable();
  };

  return (
    <ContentSection noCard className="mg-v2-psych-document-list-block">
      <ContentCard className="mg-v2-psych-document-list-block__card">
        <div className="mg-v2-psych-document-list-block__header">
          <div className="mg-v2-psych-document-list-block__title">최근 업로드(최대 20개)</div>
          <div className="mg-v2-ad-b0kla__pill-toggle">
            <button
              type="button"
              className={`mg-v2-ad-b0kla__pill ${viewMode === 'table' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
              onClick={() => setViewMode('table')}
              title="테이블 뷰"
            >
              <List size={16} />
              테이블
            </button>
            <button
              type="button"
              className={`mg-v2-ad-b0kla__pill ${viewMode === 'card' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
              onClick={() => setViewMode('card')}
              title="카드 뷰"
            >
              <LayoutGrid size={16} />
              카드
            </button>
          </div>
        </div>
        {renderContent()}
      </ContentCard>
    </ContentSection>
  );
};

PsychDocumentListBlock.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      assessmentType: PropTypes.string,
      status: PropTypes.string,
      originalFilename: PropTypes.string,
      createdAt: PropTypes.string
    })
  ),
  onGenerateReport: PropTypes.func,
  onViewReport: PropTypes.func,
  listLoadError: PropTypes.bool
};

export default PsychDocumentListBlock;
