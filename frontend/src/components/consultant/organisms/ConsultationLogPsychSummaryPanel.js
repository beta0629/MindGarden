import React from 'react';
import { renderConsultationLogKeywordHighlight } from '../utils/renderConsultationLogKeywordHighlight';

/**
 * 심리검사 문서 요약 — 데이터 없으면 null
 * @param {Object} props
 * @param {Array} props.psychDocuments
 * @param {boolean} props.loadingPsych
 */
const ConsultationLogPsychSummaryPanel = ({ psychDocuments = [], loadingPsych = false }) => {
  if (loadingPsych) {
    return (
      <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-consultation-log-modal__psych-loading">
        로딩 중...
      </p>
    );
  }
  if (!psychDocuments.length) {
    return null;
  }

  return (
    <ul className="mg-v2-consultation-log-modal__psych-list">
      {psychDocuments.map((doc, idx) => {
        const summaryText = doc.summarySection || doc.reportSummary || null;
        const hasRisk = [summaryText, doc.keyFindings, doc.recommendationSection]
          .filter(Boolean)
          .some((t) => String(t).includes('위험'));
        const hasCaution = [summaryText, doc.keyFindings, doc.recommendationSection]
          .filter(Boolean)
          .some((t) => String(t).includes('주의'));
        const isLast = idx === psychDocuments.length - 1;
        return (
          <li
            key={doc.documentId}
            className={[
              'mg-v2-consultation-log-modal__psych-list-item',
              isLast ? 'mg-v2-consultation-log-modal__psych-list-item--last' : ''
            ].filter(Boolean).join(' ')}
          >
            <div className="mg-v2-consultation-log-modal__psych-list-head">
              <a
                href={`/admin/psych-assessment?documentId=${doc.documentId}`}
                className="mg-v2-consultation-log-modal__psych-link mg-v2-consultation-log-modal__psych-link--title"
              >
                {doc.originalFilename || `심리검사 문서 #${doc.documentId}`}
              </a>
              {hasRisk && (
                <span className="mg-v2-consultation-log-modal__psych-badge mg-v2-consultation-log-modal__psych-badge--danger">
                  위험
                </span>
              )}
              {hasCaution && !hasRisk && (
                <span className="mg-v2-consultation-log-modal__psych-badge mg-v2-consultation-log-modal__psych-badge--warning">
                  주의
                </span>
              )}
            </div>
            {summaryText && (
              <p className="mg-v2-detail-content mg-v2-consultation-log-modal__psych-summary">
                {renderConsultationLogKeywordHighlight(summaryText)}
              </p>
            )}
            {doc.keyFindings && (
              <div className="mg-v2-consultation-log-modal__psych-block">
                <span className="mg-v2-consultation-log-modal__psych-block-label">핵심 해석</span>
                <p className="mg-v2-consultation-log-modal__psych-block-text mg-v2-consultation-log-modal__psych-block-text--emphasis">
                  {renderConsultationLogKeywordHighlight(doc.keyFindings)}
                </p>
              </div>
            )}
            {doc.recommendationSection && (
              <div className="mg-v2-consultation-log-modal__psych-block">
                <span className="mg-v2-consultation-log-modal__psych-block-label">권고</span>
                <p className="mg-v2-consultation-log-modal__psych-block-text">
                  {renderConsultationLogKeywordHighlight(doc.recommendationSection)}
                </p>
              </div>
            )}
            <a
              href={`/admin/psych-assessment?documentId=${doc.documentId}`}
              className="mg-v2-consultation-log-modal__psych-link mg-v2-consultation-log-modal__psych-link--sub"
            >
              상세 보기 →
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default ConsultationLogPsychSummaryPanel;
