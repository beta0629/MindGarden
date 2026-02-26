/**
 * MappingListRow - 매칭 목록 행 (테이블 스타일)
 * lucide-react 아이콘, 기존 MappingCard와 동일 액션 지원
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Package,
  CreditCard,
  Calendar,
  CalendarClock,
  Eye,
  Edit,
  XCircle,
  CheckCircle,
  DollarSign,
  Database
} from 'lucide-react';
import MappingPaymentModal from '../../mapping/MappingPaymentModal';
import MappingDepositModal from '../../mapping/MappingDepositModal';
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
    async (fn) => {
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
  const badgeVariant = statusInfo.variant || 'secondary';
  const StatusIcon = getStatusIconComponent && mapping.status ? getStatusIconComponent(mapping.status) : null;

  return (
    <div className="mg-v2-mapping-list-row">
      <div className="mg-v2-mapping-list-row__main">
        <div className="mg-v2-mapping-list-row__status-col">
          <span
            className={`mg-v2-mapping-list-row__status mg-v2-badge ${badgeVariant}`}
            role="status"
            aria-label={statusLabel}
          >
            {StatusIcon ? <StatusIcon size={12} className="mg-v2-mapping-list-row__status-icon" aria-hidden /> : null}
            {statusLabel}
          </span>
          {isErpIntegrated && (
            <span className="mg-v2-mapping-list-row__erp">
              <Database size={12} />
              ERP
            </span>
          )}
        </div>
        <div className="mg-v2-mapping-list-row__participants">
          <div className="mg-v2-mapping-list-row__party">
            <User size={16} />
            <span>{mapping.consultantName || 'N/A'}</span>
          </div>
          <span className="mg-v2-mapping-list-row__arrow">→</span>
          <div className="mg-v2-mapping-list-row__party">
            <User size={16} />
            <span>{mapping.clientName || 'N/A'}</span>
          </div>
        </div>
        <div className="mg-v2-mapping-list-row__package">
          <Package size={14} />
          <span>{mapping.packageName || 'N/A'}</span>
        </div>
        <div className="mg-v2-mapping-list-row__amount">
          {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
        </div>
        <div className="mg-v2-mapping-list-row__sessions">
          <span>{mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}회</span>
          {mapping.totalSessions > 0 && (
            <button
              type="button"
              className="mg-v2-mapping-list-row__schedule-link"
              onClick={() => navigate(`/admin/schedules?consultantId=${mapping.consultantId}&clientId=${mapping.clientId}`)}
              title="스케줄 보기"
            >
              <CalendarClock size={14} />
            </button>
          )}
        </div>
        <div className="mg-v2-mapping-list-row__date">
          <Calendar size={14} />
          {formatDate(mapping.startDate || mapping.createdAt)}
        </div>
      </div>
      <div className="mg-v2-mapping-list-row__actions">
        {onView && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-primary mg-v2-button-sm"
            onClick={() => onView(mapping)}
          >
            <Eye size={14} />
            상세
          </button>
        )}
        {mapping.status === 'PENDING_PAYMENT' && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-success mg-v2-button-sm"
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard size={14} />
            결제 확인
          </button>
        )}
        {mapping.status === 'PAYMENT_CONFIRMED' && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-primary mg-v2-button-sm"
            onClick={() => setShowDepositModal(true)}
          >
            <DollarSign size={14} />
            입금 확인
          </button>
        )}
        {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-success mg-v2-button-sm"
            onClick={() => handleCriticalAction(() => onApprove(mapping.id))}
            disabled={processing}
          >
            <CheckCircle size={14} />
            승인
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
            onClick={() => onEdit(mapping)}
          >
            <Edit size={14} />
            수정
          </button>
        )}
        {onRefund && (
          <button
            type="button"
            className="mg-v2-button mg-v2-button-danger mg-v2-button-sm"
            onClick={() => handleCriticalAction(() => onRefund(mapping))}
            disabled={processing}
          >
            <XCircle size={14} />
            환불
          </button>
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
