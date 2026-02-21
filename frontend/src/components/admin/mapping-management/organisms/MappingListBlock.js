/**
 * MappingListBlock - 매칭 목록 그리드 (MappingListRow 사용)
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React from 'react';
import { Plus, Link2 } from 'lucide-react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import ContentCard from '../../../dashboard-v2/content/ContentCard';
import MappingListRow from './MappingListRow';
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
  const isEmpty = !mappings || mappings.length === 0;

  return (
    <ContentSection noCard className="mg-v2-mapping-list-block">
      <ContentCard className="mg-v2-mapping-list-block__card">
        {isEmpty ? (
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
        ) : (
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
        )}
      </ContentCard>
    </ContentSection>
  );
};

export default MappingListBlock;
