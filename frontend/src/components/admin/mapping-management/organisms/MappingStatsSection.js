/**
 * MappingStatsSection - 통계 카드 영역
 * ContentSection + MappingStats
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React from 'react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import MappingStats from '../../mapping/MappingStats';
import '../../../dashboard-v2/content/ContentKpiRow.css';
import './MappingStatsSection.css';

const MappingStatsSection = ({ mappings, onStatCardClick }) => {
  return (
    <ContentSection noCard className="mg-v2-mapping-stats-section">
      <MappingStats mappings={mappings} onStatCardClick={onStatCardClick} />
    </ContentSection>
  );
};

export default MappingStatsSection;
