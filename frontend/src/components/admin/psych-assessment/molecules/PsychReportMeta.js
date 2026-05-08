/**
 * PsychReportMeta - AI 리포트 메타 (모델명, 생성일)
 * Molecule: 캡션 스타일 메타 한 줄
 *
 * @author Core Solution
 * @since 2026-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../utils/safeDisplay';
import './PsychReportMeta.css';

const PsychReportMeta = ({ modelName, createdAt }) => {
  const modelSafe = toDisplayString(modelName, '');
  const createdSafe = toDisplayString(createdAt, '');
  if (!modelSafe && !createdSafe) return null;
  const parts = [];
  if (modelSafe) parts.push(`모델: ${modelSafe}`);
  if (createdSafe) parts.push(`생성: ${createdSafe}`);
  return (
    <p className="mg-v2-psych-report-meta">
      {parts.join(' · ')}
    </p>
  );
};

PsychReportMeta.propTypes = {
  modelName: PropTypes.string,
  createdAt: PropTypes.string
};

export default PsychReportMeta;
