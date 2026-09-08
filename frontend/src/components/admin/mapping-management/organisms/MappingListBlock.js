/**
 * MappingListBlock - 배정 목록 스테이지 (list|card)
 * list = MappingTableView, card = MappingListRow. calendar 이 페이지에서 제거.
 *
 * @author Core Solution
 * @since 2025-02-22
 * @updated 2026-09-08 — Clinic-OS TO-BE list|card only
 */

import React from 'react';
import {
  buildViewModeStorageKey,
  resolveViewModeStorageScope,
  useViewModePreference
} from '../../../../hooks/useViewModePreference';
import PropTypes from 'prop-types';
import { Link2 } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import { ViewModeToggle } from '../../../common';
import MGButton from '../../../common/MGButton';
import MappingListRow from './MappingListRow';
import MappingTableView from './MappingTableView';
import { MAPPING_MESSAGES } from '../../../../constants/mapping';
import {
  MAPPING_LIST_ALLOWED_VIEW_MODES,
  MAPPING_LIST_DEFAULT_VIEW_MODE,
  MAPPING_LIST_VIEW_MODE_OPTIONS,
  MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID,
  normalizeMappingListViewMode
} from '../../../../constants/mappingManagementSavedViewConstants';
import './MappingListBlock.css';

export { MAPPING_LIST_DEFAULT_VIEW_MODE };

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
  onChangePendingPackage,
  onCancelPendingMapping,
  cancelPendingProcessing,
  onCreateClick,
  viewMode: controlledViewMode,
  onViewModeChange
}) => {
  const isViewModeControlled = controlledViewMode != null && typeof onViewModeChange === 'function';
  const internalViewMode = useViewModePreference({
    storageKey: buildViewModeStorageKey(
      resolveViewModeStorageScope(),
      MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID
    ),
    defaultMode: MAPPING_LIST_DEFAULT_VIEW_MODE,
    allowedModes: MAPPING_LIST_ALLOWED_VIEW_MODES
  });
  const rawViewMode = isViewModeControlled ? controlledViewMode : internalViewMode.viewMode;
  const viewMode = normalizeMappingListViewMode(rawViewMode);
  const setViewMode = isViewModeControlled ? onViewModeChange : internalViewMode.setViewMode;
  const isEmpty = !mappings || mappings.length === 0;

  const renderContent = () => {
    if (isEmpty) {
      return (
        <div className="mg-v2-mapping-list-block__empty">
          <div className="mg-v2-mapping-list-block__empty-icon" aria-hidden="true">
            <Link2 size={48} />
          </div>
          <h3 className="mg-v2-mapping-list-block__empty-title">{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
          <p className="mg-v2-mapping-list-block__empty-desc">{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
          {onCreateClick && (
            <MGButton
              variant="primary"
              onClick={onCreateClick}
              className="mg-v2-mapping-list-block__empty-btn"
              preventDoubleClick={false}
            >
              새 배정
            </MGButton>
          )}
        </div>
      );
    }

    if (viewMode === 'list') {
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
          onChangePendingPackage={onChangePendingPackage}
          onCancelPendingMapping={onCancelPendingMapping}
          cancelPendingProcessing={cancelPendingProcessing}
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
            onChangePendingPackage={onChangePendingPackage}
            onCancelPendingMapping={onCancelPendingMapping}
            cancelPendingProcessing={cancelPendingProcessing}
          />
        ))}
      </div>
    );
  };

  return (
    <ContentSection noCard className="mg-v2-mapping-list-block">
      <ContentCard className="mg-v2-mapping-list-block__card">
        <div className="mg-v2-mapping-list-block__header">
          <div className="mg-v2-mapping-list-block__title">배정 리스트</div>
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            options={MAPPING_LIST_VIEW_MODE_OPTIONS}
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
  onChangePendingPackage: PropTypes.func,
  onCancelPendingMapping: PropTypes.func,
  cancelPendingProcessing: PropTypes.bool,
  onCreateClick: PropTypes.func,
  viewMode: PropTypes.string,
  onViewModeChange: PropTypes.func
};

export default MappingListBlock;
