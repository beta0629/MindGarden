/**
 * PsychReportMarkdownBlock - AI 리포트 마크다운 본문 블록
 * Molecule: 가독성 있는 스타일 블록 (섹션 블록 스타일)
 *
 * @author Core Solution
 * @since 2026-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PsychReportMarkdownBlock.css';

const PsychReportMarkdownBlock = ({ content }) => {
  if (content == null || content === '') return null;
  return (
    <div className="mg-v2-psych-report-markdown-block">
      <pre className="mg-v2-psych-report-markdown-block__content">{content}</pre>
    </div>
  );
};

PsychReportMarkdownBlock.propTypes = {
  content: PropTypes.string
};

export default PsychReportMarkdownBlock;
