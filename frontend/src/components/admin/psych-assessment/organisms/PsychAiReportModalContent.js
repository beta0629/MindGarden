/**
 * PsychAiReportModalContent - AI 분석 결과 모달 본문 (Organism)
 * 제목은 UnifiedModal title로 전달, 본문만 담당: 로딩 | 메타 + 마크다운 블록
 *
 * @author Core Solution
 * @since 2026-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import UnifiedLoading from '../../../common/UnifiedLoading';
import PsychReportMeta from '../molecules/PsychReportMeta';
import PsychReportMarkdownBlock from '../molecules/PsychReportMarkdownBlock';
import './PsychAiReportModalContent.css';

const parseAiStatus = (evidenceJson) => {
  if (!evidenceJson || typeof evidenceJson !== 'string') return { ai: null, reason: null };
  try {
    const parsed = JSON.parse(evidenceJson);
    return { ai: parsed?.ai || null, reason: parsed?.reason || null };
  } catch {
    return { ai: null, reason: null };
  }
};

const PsychAiReportModalContent = ({ loading, reportContent }) => {
  if (loading) {
    return <UnifiedLoading type="inline" text="리포트를 불러오는 중..." />;
  }
  if (!reportContent?.reportMarkdown) {
    return null;
  }
  const { ai: aiStatus, reason } = parseAiStatus(reportContent.evidenceJson);
  const aiFailed = aiStatus === 'failed' || aiStatus === 'rejected' || aiStatus === 'disabled';

  return (
    <div className="mg-v2-psych-ai-report-modal-content">
      {aiFailed && (
        <div
          className="mg-v2-psych-ai-report-alert"
          style={{
            padding: '12px 16px',
            marginBottom: 16,
            background: 'var(--mg-warning-50)',
            border: '1px solid var(--mg-warning-300)',
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--mg-warning-800)'
          }}
        >
          AI 분석이 완료되지 않았습니다. API 설정 또는 네트워크를 확인해 주세요.
          {reason && ` (사유: ${reason})`}
        </div>
      )}
      <PsychReportMeta
        modelName={reportContent.modelName}
        createdAt={reportContent.createdAt}
      />
      <PsychReportMarkdownBlock content={reportContent.reportMarkdown} />
    </div>
  );
};

PsychAiReportModalContent.propTypes = {
  loading: PropTypes.bool,
  reportContent: PropTypes.shape({
    modelName: PropTypes.string,
    createdAt: PropTypes.string,
    reportMarkdown: PropTypes.string,
    evidenceJson: PropTypes.string
  })
};

export default PsychAiReportModalContent;
