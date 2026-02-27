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
import { Upload, FileSearch, FileCheck2 } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import './PsychKpiSection.css';

const ICON_SIZE = 24;

const KPI_ITEMS = [
  {
    id: 'upload',
    label: '업로드',
    key: 'documentsTotal',
    icon: Upload,
    iconVariant: 'green'
  },
  {
    id: 'extraction',
    label: '추출',
    key: 'extractionsTotal',
    icon: FileSearch,
    iconVariant: 'orange'
  },
  {
    id: 'report',
    label: '리포트',
    key: 'reportsTotal',
    icon: FileCheck2,
    iconVariant: 'blue'
  }
];

const PsychKpiSection = ({ stats = {}, onStatCardClick }) => {
  return (
    <ContentSection noCard className="mg-v2-psych-kpi-section">
      <div className="mg-v2-psych-kpi-section__grid">
        {KPI_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = stats[item.key] ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              className="mg-v2-psych-kpi-section__card"
              onClick={() => onStatCardClick && onStatCardClick(item)}
            >
              <div className={`mg-v2-psych-kpi-section__icon mg-v2-psych-kpi-section__icon--${item.iconVariant}`}>
                <Icon size={ICON_SIZE} />
              </div>
              <div className="mg-v2-psych-kpi-section__info">
                <span className="mg-v2-psych-kpi-section__label">{item.label}</span>
                <span className="mg-v2-psych-kpi-section__value">{value.toLocaleString()}</span>
              </div>
            </button>
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
