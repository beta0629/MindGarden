/**
 * PsychKpiSection - 심리검사 KPI 카드 영역
 * ContentSection noCard + MappingKpiSection 패턴
 * stats: { documentsTotal, extractionsTotal, reportsTotal }
 *
 * @author Core Solution
 * @since 2026-02-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import MGButton from '../../../common/MGButton';
import './PsychKpiSection.css';
import SafeText from '../../../common/SafeText';

const KPI_ITEMS = [
  {
    id: 'upload',
    label: '업로드',
    key: 'documentsTotal',
    iconVariant: 'green',
    iconText: '업'
  },
  {
    id: 'extraction',
    label: '추출',
    key: 'extractionsTotal',
    iconVariant: 'orange',
    iconText: '\uCD94'
  },
  {
    id: 'report',
    label: '리포트',
    key: 'reportsTotal',
    iconVariant: 'blue',
    iconText: '리'
  }
];

const PsychKpiSection = ({ stats = {}, onStatCardClick }) => {
  return (
    <ContentSection noCard className="mg-v2-psych-kpi-section">
      <div className="mg-v2-psych-kpi-section__grid">
        {KPI_ITEMS.map((item) => {
          const value = stats[item.key] ?? 0;
          return (
            <MGButton
              key={item.id}
              type="button"
              variant="outline"
              className="mg-v2-psych-kpi-section__card"
              onClick={() => onStatCardClick && onStatCardClick(item)}
              preventDoubleClick={false}
            >
              <div className={`mg-v2-psych-kpi-section__icon mg-v2-psych-kpi-section__icon--${item.iconVariant}`}>
                <span className="mg-v2-psych-kpi-section__icon-text" aria-hidden="true">{item.iconText}</span>
              </div>
              <div className="mg-v2-psych-kpi-section__info">
                <span className="mg-v2-psych-kpi-section__label"><SafeText>{item.label}</SafeText></span>
                <span className="mg-v2-psych-kpi-section__value">{value.toLocaleString()}</span>
              </div>
            </MGButton>
          );
        })}
      </div>
    </ContentSection>
  );
};

PsychKpiSection.propTypes = {
  stats: PropTypes.shape({
    documentsTotal: PropTypes.number,
    extractionsTotal: PropTypes.number,
    reportsTotal: PropTypes.number
  }),
  onStatCardClick: PropTypes.func
};

export default PsychKpiSection;
