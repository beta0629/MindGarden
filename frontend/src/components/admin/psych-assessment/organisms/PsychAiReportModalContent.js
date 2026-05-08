/**
 * PsychAiReportModalContent - AI 분석 결과 모달 본문 (Organism)
 * 제목은 UnifiedModal title로 전달, 본문만 담당: 로딩 | 메타 + 마크다운 블록
 *
 * @author Core Solution
 * @since 2026-03-02
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getPsychAssessmentEvidenceReasonLabel } from '../../../../constants/psychAssessmentReasonLabels';
import { PSYCH_AI_REPORT_UI } from '../../../../constants/psychAssessmentAiReportUiStrings';
import { toDisplayString } from '../../../../utils/safeDisplay';
import { parsePsychReportEvidence } from '../../../../utils/psychReportEvidenceParse';
import {
  hasSummaryAndRecommendationHeadings,
  hasTciDesignerHeadingsInOrder,
  hasMmpiDesignerHeadingsInOrder
} from '../../../../utils/psychReportHeadingChecks';
import UnifiedLoading from '../../../common/UnifiedLoading';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import PsychReportMeta from '../molecules/PsychReportMeta';
import PsychReportMarkdownBlock from '../molecules/PsychReportMarkdownBlock';
import './PsychAiReportModalContent.css';

const MIN_MARKDOWN_LEN_FOR_LEGACY = 40;

/**
 * @param {string} reportMarkdown
 * @param {ReturnType<typeof parsePsychReportEvidence>} evidenceParsed
 * @param {boolean} evidenceJsonPresent 저장된 evidence 문자열이 있는 경우에만 근거 비움 판단에 사용
 * @returns {{ recoveryPrimaryHint: string, showRegenerate: boolean }}
 */
const deriveRecoveryUx = (reportMarkdown, evidenceParsed, evidenceJsonPresent) => {
  const md = reportMarkdown && typeof reportMarkdown === 'string' ? reportMarkdown : '';
  const trimmed = md.trim();
  const v3Ok = hasTciDesignerHeadingsInOrder(md) || hasMmpiDesignerHeadingsInOrder(md);
  const missingRequiredSections = evidenceParsed.reason === 'missing_required_sections';
  const legacyLayout =
    !v3Ok &&
    trimmed.length >= MIN_MARKDOWN_LEN_FOR_LEGACY &&
    hasSummaryAndRecommendationHeadings(md);
  const highlightsEmpty = !evidenceParsed.highlights || evidenceParsed.highlights.length === 0;
  const emptyKeyHighlights =
    evidenceJsonPresent &&
    highlightsEmpty &&
    (evidenceParsed.reason === 'missing_evidence' ||
      (!evidenceParsed.hasWrappedStatus && v3Ok));

  let recoveryPrimaryHint = '';
  if (missingRequiredSections) {
    recoveryPrimaryHint = PSYCH_AI_REPORT_UI.MISSING_SECTIONS_HINT;
  } else if (legacyLayout) {
    recoveryPrimaryHint = PSYCH_AI_REPORT_UI.LEGACY_HEADING_HINT;
  } else if (emptyKeyHighlights) {
    recoveryPrimaryHint = PSYCH_AI_REPORT_UI.EMPTY_KEY_HIGHLIGHTS_HINT;
  }

  const showRegenerate = Boolean(recoveryPrimaryHint);
  return { recoveryPrimaryHint, showRegenerate };
};

const PsychAiReportModalContent = ({
  loading,
  reportContent,
  reportDocumentId,
  onRegenerateReport,
  regenerateLoading = false,
  regenerateDisabled = false
}) => {
  if (loading) {
    return <UnifiedLoading type="inline" text={PSYCH_AI_REPORT_UI.LOADING} />;
  }
  if (!reportContent?.reportMarkdown) {
    return null;
  }

  const evidenceTrimmed =
    reportContent.evidenceJson && typeof reportContent.evidenceJson === 'string'
      ? reportContent.evidenceJson.trim()
      : '';
  const evidenceJsonPresent = evidenceTrimmed.length > 0;
  const evidenceParsed = parsePsychReportEvidence(
    evidenceJsonPresent ? reportContent.evidenceJson : null
  );
  const { aiStatus, reason } = evidenceParsed;
  const aiFailed = aiStatus === 'failed' || aiStatus === 'rejected' || aiStatus === 'disabled';
  const aiSkipped = aiStatus === 'skipped';
  const reasonLabel = getPsychAssessmentEvidenceReasonLabel(reason);
  const showFailedNetwork = aiStatus === 'failed' || aiStatus === 'disabled';
  const skippedBannerText = reasonLabel
    ? toDisplayString(reasonLabel, PSYCH_AI_REPORT_UI.SKIPPED_FALLBACK)
    : PSYCH_AI_REPORT_UI.SKIPPED_FALLBACK;

  const { recoveryPrimaryHint, showRegenerate } = deriveRecoveryUx(
    reportContent.reportMarkdown,
    evidenceParsed,
    evidenceJsonPresent
  );
  const canRegenerate =
    showRegenerate &&
    reportDocumentId != null &&
    reportDocumentId !== '' &&
    typeof onRegenerateReport === 'function';

  return (
    <div className="mg-v2-psych-ai-report-modal-content">
      {aiSkipped && (
        <div className="mg-v2-psych-ai-report-alert mg-v2-psych-ai-report-alert--info">
          {skippedBannerText}
        </div>
      )}
      {aiFailed && (
        <div
          className={
            showFailedNetwork
              ? 'mg-v2-psych-ai-report-alert mg-v2-psych-ai-report-alert--danger'
              : 'mg-v2-psych-ai-report-alert mg-v2-psych-ai-report-alert--warning'
          }
        >
          <p className="mg-v2-psych-ai-report-alert__hint">
            {showFailedNetwork ? PSYCH_AI_REPORT_UI.FAILED_NETWORK : PSYCH_AI_REPORT_UI.FAILED_VALIDATION_INTRO}
          </p>
          {reasonLabel ? (
            <p className="mg-v2-psych-ai-report-alert__hint">{toDisplayString(reasonLabel)}</p>
          ) : null}
        </div>
      )}
      {canRegenerate && (
        <div className="mg-v2-psych-ai-report-alert mg-v2-psych-ai-report-alert--info">
          <p className="mg-v2-psych-ai-report-alert__hint">{recoveryPrimaryHint}</p>
          <div className="mg-v2-psych-ai-report-alert__actions">
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: regenerateLoading,
                className: ''
              })}
              onClick={() => onRegenerateReport(reportDocumentId)}
              loading={regenerateLoading}
              disabled={regenerateDisabled || regenerateLoading}
              preventDoubleClick={true}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              title={regenerateDisabled ? PSYCH_AI_REPORT_UI.REGENERATE_DISABLED_TITLE : undefined}
            >
              {PSYCH_AI_REPORT_UI.REGENERATE_BUTTON}
            </MGButton>
          </div>
        </div>
      )}
      <PsychReportMeta modelName={reportContent.modelName} createdAt={reportContent.createdAt} />
      <PsychReportMarkdownBlock content={reportContent.reportMarkdown} />
    </div>
  );
};

PsychAiReportModalContent.propTypes = {
  loading: PropTypes.bool,
  reportDocumentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onRegenerateReport: PropTypes.func,
  regenerateLoading: PropTypes.bool,
  regenerateDisabled: PropTypes.bool,
  reportContent: PropTypes.shape({
    modelName: PropTypes.string,
    createdAt: PropTypes.string,
    reportMarkdown: PropTypes.string,
    evidenceJson: PropTypes.string
  })
};

export default PsychAiReportModalContent;
