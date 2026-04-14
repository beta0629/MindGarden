/**
 * MappingListSection - 매칭 목록 또는 빈 상태
 * ContentSection + MappingCard 그리드 또는 EmptyState
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React from 'react';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import MappingCard from '../../mapping/MappingCard';
import { ActionButton } from '../../../common';
import { MAPPING_MESSAGES } from '../../../../constants/mapping';
import './MappingListSection.css';

const MappingListSection = ({
  mappings,
  mappingStatusInfo,
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
  const isEmpty = !mappings || mappings.length === 0;

  return (
    <div className="mg-v2-mapping-list-section">
      <ContentCard className="mg-v2-mapping-list-card">
        {isEmpty ? (
          <div className="mg-v2-ad-b0kla__chart-placeholder mg-v2-mapping-empty">
            <div className="mg-v2-mapping-empty__icon">🔗</div>
            <h3 className="mg-v2-mapping-empty__title">{MAPPING_MESSAGES.NO_MAPPINGS}</h3>
            <p className="mg-v2-ad-b0kla__chart-empty-desc mg-v2-mapping-empty__desc">{MAPPING_MESSAGES.NO_MAPPINGS_DESC}</p>
            {onCreateClick && (
              <ActionButton
                variant="primary"
                onClick={onCreateClick}
                className="mg-v2-mapping-empty__action"
              >
                매칭 생성하기
              </ActionButton>
            )}
          </div>
        ) : (
          <div className="mg-v2-mapping-list-grid">
            {mappings.map((mapping) => (
              <MappingCard
                key={mapping.id}
                mapping={mapping}
                statusInfo={
                  mappingStatusInfo[mapping.status] || {
                    label: getStatusKoreanName(mapping.status),
                    color: getStatusColor(mapping.status),
                    icon: getStatusIcon(mapping.status)
                  }
                }
                onView={() => onView(mapping)}
                onEdit={() => onEdit(mapping)}
                onRefund={() => onRefund(mapping)}
                onConfirmPayment={() => onConfirmPayment(mapping)}
                onConfirmDeposit={() => onConfirmDeposit(mapping)}
                onApprove={() => onApprove(mapping.id)}
              />
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  );
};

export default MappingListSection;
