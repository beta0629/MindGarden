/**
 * MappingListBlock - 매칭 목록 그리드 (MappingListRow 사용)
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import { ActionButton, ViewModeToggle } from '../../../common';
import MappingListRow from './MappingListRow';
import MappingTableView from './MappingTableView';
import MappingCalendarView from './MappingCalendarView';
import { MAPPING_MESSAGES } from '../../../../constants/mapping';
import './MappingListBlock.css';

/** 매칭 리스트 보기 전환 옵션: 카드 / 테이블 / 캘린더 */
const MAPPING_VIEW_MODE_OPTIONS = [
  { value: 'card', label: '카드 뷰' },
  { value: 'table', label: '테이블 뷰' },
  { value: 'calendar', label: '캘린더 뷰' }
];

const MappingListBlock = ({
  mappings = [],
  mappingStatusInfo = {},
  getStatusKoreanName,
  getStatusColor,
  getStatusIcon,
  getStatusIconComponent,
  getStatusVariant,
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
          <div className="mg-v2-mapping-list-block__empty-icon" aria-hidden="true">
            🔗
          </div>
          <h3 className="mg-v2-mapping-list-block__empty-title">{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
          <p className="mg-v2-mapping-list-block__empty-desc">{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
          {onCreateClick && (
            <ActionButton
              variant="primary"
              onClick={onCreateClick}
              className="mg-v2-mapping-list-block__empty-btn"
            >
              매칭 생성
            </ActionButton>
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
          getStatusIconComponent={getStatusIconComponent}
          getStatusVariant={getStatusVariant}
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
            statusInfo={{
              ...(mappingStatusInfo[mapping.status] || {
                label: getStatusKoreanName(mapping.status),
                color: getStatusColor(mapping.status),
                icon: null
              }),
              variant: getStatusVariant ? getStatusVariant(mapping.status) : 'secondary'
            }}
            getStatusIconComponent={getStatusIconComponent}
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
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            options={MAPPING_VIEW_MODE_OPTIONS}
            className="mg-v2-mapping-list-block__toggle"
            ariaLabel="목록 보기 전환"
          />
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
  getStatusIconComponent: PropTypes.func,
  getStatusVariant: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onRefund: PropTypes.func,
  onConfirmPayment: PropTypes.func,
  onConfirmDeposit: PropTypes.func,
  onApprove: PropTypes.func,
  onCreateClick: PropTypes.func
};

export default MappingListBlock;
