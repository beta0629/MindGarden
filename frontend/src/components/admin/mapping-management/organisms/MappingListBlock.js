/**
 * MappingListBlock - 매칭 목록 그리드 (MappingListRow 사용)
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Link2, LayoutGrid, List, Calendar } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import MappingListRow from './MappingListRow';
import MappingTableView from './MappingTableView';
import MappingCalendarView from './MappingCalendarView';
import { MAPPING_MESSAGES } from '../../../../constants/mapping';
import './MappingListBlock.css';

const MappingListBlock = ({
  mappings = [],
  mappingStatusInfo = {},
  getStatusKoreanName,
  getStatusColor,
  getStatusIcon,
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove,
  onCreateClick
}) => {
  const [viewMode, setViewMode] = useState('card'); // 'card', 'table', 'calendar'
  const isEmpty = !mappings || mappings.length === 0;

  const renderContent = () => {
    if (isEmpty) {
      return (
        <div className="mg-v2-mapping-list-block__empty">
          <div className="mg-v2-mapping-list-block__empty-icon">
            <Link2 size={48} />
          </div>
          <h3 className="mg-v2-mapping-list-block__empty-title">{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
          <p className="mg-v2-mapping-list-block__empty-desc">{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
          {onCreateClick && (
            <button
              type="button"
              className="mg-v2-button mg-v2-button-primary mg-v2-mapping-list-block__empty-btn"
              onClick={onCreateClick}
            >
              <Plus size={20} />
              매칭 생성
            </button>
          )}
        </div>
      );
    }

    if (viewMode === 'table') {
      return (
        <MappingTableView
          mappings={mappings}
          mappingStatusInfo={mappingStatusInfo}
          getStatusKoreanName={getStatusKoreanName}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          onView={onView}
          onEdit={onEdit}
          onRefund={onRefund}
          onConfirmPayment={onConfirmPayment}
          onConfirmDeposit={onConfirmDeposit}
          onApprove={onApprove}
        />
      );
    }

    if (viewMode === 'calendar') {
      return (
        <MappingCalendarView
          mappings={mappings}
          getStatusColor={getStatusColor}
          onView={onView}
        />
      );
    }

    return (
      <div className="mg-v2-mapping-list-block__grid">
        {mappings.map((mapping) => (
          <MappingListRow
            key={mapping.id}
            mapping={mapping}
            statusInfo={
              mappingStatusInfo[mapping.status] || {
                label: getStatusKoreanName(mapping.status),
                color: getStatusColor(mapping.status),
                icon: getStatusIcon(mapping.status)
              }
            }
            onView={onView}
            onEdit={onEdit}
            onRefund={onRefund}
            onConfirmPayment={onConfirmPayment}
            onConfirmDeposit={onConfirmDeposit}
            onApprove={onApprove}
          />
        ))}
      </div>
    );
  };

  return (
    <ContentSection noCard className="mg-v2-mapping-list-block">
      <ContentCard className="mg-v2-mapping-list-block__card">
        <div className="mg-v2-mapping-list-block__header">
          <div className="mg-v2-mapping-list-block__title">매칭 리스트</div>
          <div className="mg-v2-ad-b0kla__pill-toggle mg-v2-mapping-list-block__toggle">
            <button
              type="button"
              className={`mg-v2-ad-b0kla__pill ${viewMode === 'card' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
              onClick={() => setViewMode('card')}
              title="카드 뷰"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`mg-v2-ad-b0kla__pill ${viewMode === 'table' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
              onClick={() => setViewMode('table')}
              title="테이블 뷰"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`mg-v2-ad-b0kla__pill ${viewMode === 'calendar' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="캘린더 뷰"
            >
              <Calendar size={16} />
            </button>
          </div>
        </div>
        {renderContent()}
      </ContentCard>
    </ContentSection>
  );
};

MappingListBlock.propTypes = {
  mappings: PropTypes.array,
  mappingStatusInfo: PropTypes.object,
  getStatusKoreanName: PropTypes.func,
  getStatusColor: PropTypes.func,
  getStatusIcon: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCreateClick: PropTypes.func
};

export default MappingListBlock;
