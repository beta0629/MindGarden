/**
 * 내담자를 고른 상담일지 조회의 기간 요약.
 * 건수·첫·최근 일은 서버가 같은 필터로 집계한 값만 보여 준다.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ContentCard from '../../dashboard-v2/content/ContentCard';
import '../../../i18n';

const NS = 'adminConsultationLogs';

const ConsultationLogClientSummary = ({ summary }) => {
  const { t } = useTranslation(NS);
  if (!summary || !summary.countsReady) {
    return null;
  }
  const nameClass = summary.clientNameMissing
    ? 'mg-v2-consultation-log-summary-strip__name mg-v2-consultation-log-name-missing'
    : 'mg-v2-consultation-log-summary-strip__name';
  return (
    <ContentCard className="mg-v2-consultation-log-summary-strip">
      <section aria-label={t('group.summary.label')}>
        <p className="mg-v2-consultation-log-summary-strip__period">
          {t('group.summary.period', { from: summary.periodFrom, to: summary.periodTo })}
        </p>
        <p className="sr-only" role="status">
          {t('group.summary.announce', { name: summary.clientName, n: summary.sessionCount })}
        </p>
        <dl className="mg-v2-consultation-log-summary-strip__list">
          <div className="mg-v2-consultation-log-summary-strip__item mg-v2-consultation-log-summary-strip__item--name">
            <dt>{t('group.summary.client')}</dt>
            <dd className={nameClass}>{summary.clientName}</dd>
          </div>
          <div className="mg-v2-consultation-log-summary-strip__item">
            <dt>{t('group.summary.sessions')}</dt>
            <dd>{t('group.summary.count', { n: summary.sessionCount })}</dd>
          </div>
          <div className="mg-v2-consultation-log-summary-strip__item">
            <dt>{t('group.summary.first')}</dt>
            <dd>{summary.firstSessionDate}</dd>
          </div>
          <div className="mg-v2-consultation-log-summary-strip__item">
            <dt>{t('group.summary.last')}</dt>
            <dd>{summary.lastSessionDate}</dd>
          </div>
        </dl>
      </section>
    </ContentCard>
  );
};

ConsultationLogClientSummary.propTypes = {
  summary: PropTypes.shape({
    countsReady: PropTypes.bool,
    clientName: PropTypes.string,
    clientNameMissing: PropTypes.bool,
    periodFrom: PropTypes.string,
    periodTo: PropTypes.string,
    sessionCount: PropTypes.number,
    firstSessionDate: PropTypes.string,
    lastSessionDate: PropTypes.string
  })
};

ConsultationLogClientSummary.defaultProps = {
  summary: null
};

export default ConsultationLogClientSummary;
