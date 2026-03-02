/**
 * PsychAiReportModalContent - AI 분석 결과 모달 본문 (Organism)
 * 제목은 MGModal title로 전달, 본문만 담당: 로딩 | 메타 + 마크다운 블록
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

const PsychAiReportModalContent = ({ loading, reportContent }) => {
  if (loading) {
    return <UnifiedLoading type="inline" text="리포트를 불러오는 중..." />;
  }
  if (!reportContent?.reportMarkdown) {
    return null;
  }
  return (
    <div className="mg-v2-psych-ai-report-modal-content">
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
    reportMarkdown: PropTypes.string
  })
};

export default PsychAiReportModalContent;
