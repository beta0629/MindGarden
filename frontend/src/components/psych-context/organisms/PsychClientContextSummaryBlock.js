import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import StandardizedApi from '../../../utils/standardizedApi';
import { toDisplayString, toErrorMessage } from '../../../utils/safeDisplay';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import {
  psychClientSummaryEndpoint,
  getPsychAssessmentTypeUi
} from '../../../constants/psychAssessmentClientConstants';
import { renderConsultationLogKeywordHighlight } from '../../consultant/utils/renderConsultationLogKeywordHighlight';
import './PsychClientContextSummaryBlock.css';

/**
 * TCI/MMPI 심리 요약 — 데이터·로딩 종료 후 노출 조건 충족 시에만 DOM(제목 포함) 생성.
 *
 * @param {number|string|null|undefined} clientId
 * @param {'compact'|'section'|'clientModal'} variant compact=상담일지, section=전체 폭 카드, clientModal=내담자 모달
 */
const PsychClientContextSummaryBlock = ({ clientId, variant = 'section' }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const normalizedId = (() => {
    if (clientId == null || clientId === '') return null;
    const n = typeof clientId === 'number' ? clientId : Number.parseInt(String(clientId), 10);
    return Number.isNaN(n) ? null : n;
  })();

  const load = useCallback(async() => {
    if (normalizedId == null) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await StandardizedApi.get(psychClientSummaryEndpoint(normalizedId));
      const data = res?.data ?? res;
      setSummary(data && typeof data === 'object' ? data : null);
    } catch (e) {
      notificationManager.show(toErrorMessage(e, '심리검사 요약을 불러오지 못했습니다.'), 'error');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [normalizedId]);

  useEffect(() => {
    load();
  }, [load]);

  if (normalizedId == null) {
    return null;
  }
  if (loading) {
    return null;
  }

  const hasData = summary?.hasPsychData === true
    && Array.isArray(summary.documents)
    && summary.documents.length > 0;

  if (!hasData) {
    return null;
  }

  const docs = summary.documents;
  const isCompactLayout = variant === 'compact';
  const rootClass = [
    isCompactLayout ? 'mg-v2-psych-context-summary--compact' : 'mg-v2-psych-context-summary--section',
    variant === 'clientModal' ? 'mg-v2-psych-context-summary--client-modal' : ''
  ].filter(Boolean).join(' ');

  const titleText = variant === 'section' ? '심리검사 리포트' : '심리검사 요약';

  const adminHref = (documentId) =>
    `${ADMIN_ROUTES.PSYCH_ASSESSMENTS}?documentId=${encodeURIComponent(String(documentId))}`;

  return (
    <section className={rootClass} aria-label={titleText}>
      <h3 className="mg-v2-psych-context-summary__accent-title">
        <span className="mg-v2-psych-context-summary__accent-bar" aria-hidden="true" />
        <SafeText>{titleText}</SafeText>
      </h3>
      <ul className={isCompactLayout ? 'mg-v2-consultation-log-modal__psych-list' : 'mg-v2-psych-context-summary__list'}>
        {docs.map((doc, idx) => {
          const typeUi = getPsychAssessmentTypeUi(doc?.assessmentType);
          const summaryText = doc?.summarySection || doc?.reportSummary || null;
          const hasRisk = [summaryText, doc?.keyFindings, doc?.recommendationSection]
            .filter(Boolean)
            .some((t) => String(t).includes('위험'));
          const hasCaution = [summaryText, doc?.keyFindings, doc?.recommendationSection]
            .filter(Boolean)
            .some((t) => String(t).includes('주의'));
          const isLast = idx === docs.length - 1;
          const docId = doc?.documentId;

          if (isCompactLayout) {
            return (
              <li
                key={docId != null ? String(docId) : `idx-${idx}`}
                className={[
                  'mg-v2-consultation-log-modal__psych-list-item',
                  isLast ? 'mg-v2-consultation-log-modal__psych-list-item--last' : ''
                ].filter(Boolean).join(' ')}
              >
                <div className="mg-v2-consultation-log-modal__psych-list-head">
                  <span className="mg-v2-psych-context-summary__type-badge" aria-hidden="true">
                    <SafeText>{typeUi.shortLabel}</SafeText>
                  </span>
                  <a
                    href={adminHref(docId)}
                    className="mg-v2-consultation-log-modal__psych-link mg-v2-consultation-log-modal__psych-link--title"
                  >
                    <SafeText>
                      {toDisplayString(doc?.originalFilename, docId != null ? `문서 #${docId}` : '문서')}
                    </SafeText>
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
                {summaryText ? (
                  <p className="mg-v2-detail-content mg-v2-consultation-log-modal__psych-summary">
                    {renderConsultationLogKeywordHighlight(toDisplayString(summaryText, ''))}
                  </p>
                ) : null}
                {doc?.keyFindings ? (
                  <div className="mg-v2-consultation-log-modal__psych-block">
                    <span className="mg-v2-consultation-log-modal__psych-block-label">핵심 해석</span>
                    <p className="mg-v2-consultation-log-modal__psych-block-text mg-v2-consultation-log-modal__psych-block-text--emphasis">
                      {renderConsultationLogKeywordHighlight(toDisplayString(doc.keyFindings, ''))}
                    </p>
                  </div>
                ) : null}
                {doc?.recommendationSection ? (
                  <div className="mg-v2-consultation-log-modal__psych-block">
                    <span className="mg-v2-consultation-log-modal__psych-block-label">권고</span>
                    <p className="mg-v2-consultation-log-modal__psych-block-text">
                      {renderConsultationLogKeywordHighlight(toDisplayString(doc.recommendationSection, ''))}
                    </p>
                  </div>
                ) : null}
                <a
                  href={adminHref(docId)}
                  className="mg-v2-consultation-log-modal__psych-link mg-v2-consultation-log-modal__psych-link--sub"
                >
                  상세 보기 →
                </a>
              </li>
            );
          }

          return (
            <li key={docId != null ? String(docId) : `idx-${idx}`}>
              <div className="mg-v2-psych-context-summary__row-head">
                <span className="mg-v2-psych-context-summary__type-badge">
                  <SafeText>{typeUi.fullLabel}</SafeText>
                </span>
                <a className="mg-v2-psych-context-summary__link" href={adminHref(docId)}>
                  <SafeText>
                    {toDisplayString(doc?.originalFilename, docId != null ? `문서 #${docId}` : '문서')}
                  </SafeText>
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
              {summaryText ? (
                <p className="mg-v2-psych-context-summary__summary-line">
                  {renderConsultationLogKeywordHighlight(toDisplayString(summaryText, ''))}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

PsychClientContextSummaryBlock.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(['compact', 'section', 'clientModal'])
};

export default PsychClientContextSummaryBlock;
