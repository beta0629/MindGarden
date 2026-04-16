/**
 * MappingListRow - 매칭 목록 행 (테이블 스타일)
 * 기존 MappingCard와 동일 액션(버튼·텍스트만)
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MGButton from '../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import MappingPaymentModal from '../../mapping/MappingPaymentModal';
import MappingDepositModal from '../../mapping/MappingDepositModal';
import { ActionButton, StatusBadge } from '../../../common';
import './MappingListRow.css';

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
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCriticalAction = useCallback(
    async(fn) => {
      if (processing) return;
      setProcessing(true);
      try {
        if (fn) await fn();
      } finally {
        setTimeout(() => setProcessing(false), 1000);
      }
    },
    [processing]
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
    <div className="mg-v2-mapping-list-row">
      <div className="mg-v2-mapping-list-row__main">
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
        <div className="mg-v2-mapping-list-row__amount">
          {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
        </div>
        <div className="mg-v2-mapping-list-row__sessions">
          <span>{mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}회</span>
          {mapping.totalSessions > 0 && (
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
              onClick={() => navigate(`/admin/schedules?consultantId=${mapping.consultantId}&clientId=${mapping.clientId}`)}
              title="스케줄 보기"
              preventDoubleClick={false}
            >
              스케줄
            </MGButton>
          )}
        </div>
        <div className="mg-v2-mapping-list-row__date">
          {formatDate(mapping.startDate || mapping.createdAt)}
        </div>
      </div>
      <div className="mg-v2-mapping-list-row__actions">
        {onView && (
          <ActionButton
            variant="primary"
            size="small"
            onClick={() => onView(mapping)}
          >
            상세
          </ActionButton>
        )}
        {mapping.status === 'PENDING_PAYMENT' && (
          <ActionButton
            variant="success"
            size="small"
            onClick={() => setShowPaymentModal(true)}
          >
            결제 확인
          </ActionButton>
        )}
        {mapping.status === 'PAYMENT_CONFIRMED' && (
          <ActionButton
            variant="primary"
            size="small"
            onClick={() => setShowDepositModal(true)}
          >
            입금 확인
          </ActionButton>
        )}
        {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
          <ActionButton
            variant="success"
            size="small"
            onClick={() => handleCriticalAction(() => onApprove(mapping.id))}
            disabled={processing}
          >
            승인
          </ActionButton>
        )}
        {onEdit && (
          <ActionButton
            variant="outline"
            size="small"
            onClick={() => onEdit(mapping)}
          >
            수정
          </ActionButton>
        )}
        {onRefund && (
          <ActionButton
            variant="danger"
            size="small"
            onClick={() => handleCriticalAction(() => onRefund(mapping))}
            disabled={processing}
          >
            환불
          </ActionButton>
        )}
      </div>

      {showPaymentModal && (
        <MappingPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          mapping={mapping}
          onPaymentConfirmed={() => {
            setShowPaymentModal(false);
            onConfirmPayment && onConfirmPayment();
          }}
        />
      )}
      {showDepositModal && (
        <MappingDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          mapping={mapping}
          onDepositConfirmed={() => {
            setShowDepositModal(false);
            onConfirmDeposit && onConfirmDeposit();
          }}
        />
      )}
    </div>
  );
};

export default MappingListRow;
