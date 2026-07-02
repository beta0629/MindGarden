/**
 * MappingListRow - 매칭 목록 행 (카드 뷰)
 * Primary: 행 클릭 → 상세. Overflow: EntityRowActions ⋮
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { StatusBadge, ENTITY_ROW_ACTIONS_LAYOUT } from '../../../common';
import MappingEntityRowActions from '../molecules/MappingEntityRowActions';
import SessionProgressIndicator from '../molecules/SessionProgressIndicator';
import './MappingListRow.css';
import { useTranslation } from 'react-i18next';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

const formatAmount = (amount) => {
  if (!amount) return 'N/A';
  return `${Number(amount).toLocaleString()}원`;
};

const MappingListRow = ({
  mapping,
  statusInfo = {},
  getStatusIconComponent,
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleRowClick = useCallback(() => {
    if (onView) {
      onView(mapping);
    }
  }, [onView, mapping]);

  const handleRowKeyDown = useCallback(
    (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && onView) {
        event.preventDefault();
        onView(mapping);
      }
    },
    [onView, mapping]
  );

  const isErpIntegrated =
    mapping.status === 'ACTIVE' ||
    mapping.status === 'DEPOSIT_PENDING' ||
    mapping.depositConfirmed === true ||
    mapping.erpIntegrated === true ||
    mapping.erpSyncStatus === 'SYNCED' ||
    mapping.erpTransactionId ||
    mapping.paymentConfirmed === true;

  const statusLabel = statusInfo.label || mapping.status || 'N/A';
  const badgeVariant = statusInfo.variant === 'secondary' ? 'neutral' : (statusInfo.variant || undefined);

  return (
    <div
      className="mg-v2-mapping-list-row"
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
    >
      <div className="mg-v2-mapping-list-row__content">
        <div className="mg-v2-mapping-list-row__primary">
          <div className="mg-v2-mapping-list-row__participants">
            <div className="mg-v2-mapping-list-row__party">
              <span>{mapping.consultantName || 'N/A'}</span>
            </div>
            <span className="mg-v2-mapping-list-row__arrow">→</span>
            <div className="mg-v2-mapping-list-row__party">
              <span>{mapping.clientName || 'N/A'}</span>
            </div>
          </div>
          <div className="mg-v2-mapping-list-row__package">
            <span>{mapping.packageName || 'N/A'}</span>
          </div>
        </div>

        <div className="mg-v2-mapping-list-row__meta">
          <div className="mg-v2-mapping-list-row__status-col">
            <StatusBadge
              status={mapping.status}
              variant={badgeVariant}
              className="mg-v2-mapping-list-row__status"
            >
              {statusLabel}
            </StatusBadge>
            {isErpIntegrated && (
              <span className="mg-v2-mapping-list-row__erp">
                ERP
              </span>
            )}
          </div>
          <div className="mg-v2-mapping-list-row__amount">
            {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
          </div>
          <div className="mg-v2-mapping-list-row__sessions">
            <SessionProgressIndicator 
              used={mapping.usedSessions} 
              total={mapping.totalSessions} 
            />
          </div>
          <div className="mg-v2-mapping-list-row__date">
            {formatDate(mapping.startDate || mapping.createdAt)}
          </div>
          {mapping.totalSessions > 0 && (
            <div className="mg-v2-mapping-list-row__schedule">
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'outline',
                  size: 'sm',
                  loading: false,
                  className: 'mg-v2-mapping-list-row__schedule-link'
                })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/admin/schedules?consultantId=${mapping.consultantId}&clientId=${mapping.clientId}`);
                }}
                title="스케줄 보기"
                preventDoubleClick={false}
              >
                {t('common.labels.schedule')}
              </MGButton>
            </div>
          )}
        </div>
      </div>
      <div className="mg-v2-mapping-list-row__actions">
        <MappingEntityRowActions
          mapping={mapping}
          layout={ENTITY_ROW_ACTIONS_LAYOUT.CARD}
          menuId={`mapping-row-actions-${mapping.id}`}
          onView={onView}
          onEdit={onEdit}
          onRefund={onRefund}
          onConfirmPayment={onConfirmPayment}
          onConfirmDeposit={onConfirmDeposit}
          onApprove={onApprove}
        />
      </div>
    </div>
  );
};

export default MappingListRow;
