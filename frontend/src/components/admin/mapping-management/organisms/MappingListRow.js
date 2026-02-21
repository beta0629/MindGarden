/**
 * MappingListRow - 매칭 목록 행 (테이블 스타일)
 * lucide-react 아이콘, 기존 MappingCard와 동일 액션 지원
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React, { useState } from 'react';
import {
  User,
  Package,
  CreditCard,
  Calendar,
  Eye,
  Edit,
  XCircle,
  CheckCircle,
  DollarSign,
  Database
} from 'lucide-react';
import MGButton from '../../../common/MGButton';
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
  onView,
  onEdit,
  onRefund,
  onConfirmPayment,
  onConfirmDeposit,
  onApprove
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const isErpIntegrated =
    mapping.status === 'ACTIVE' ||
    mapping.status === 'DEPOSIT_PENDING' ||
    mapping.depositConfirmed === true ||
    mapping.erpIntegrated === true ||
    mapping.erpSyncStatus === 'SYNCED' ||
    mapping.erpTransactionId ||
    mapping.paymentConfirmed === true;

  const statusLabel = statusInfo.label || mapping.status || 'N/A';
  const statusColor = statusInfo.color || 'var(--ad-b0kla-text-secondary)';

  return (
    <div className="mg-v2-mapping-list-row">
      <div className="mg-v2-mapping-list-row__main">
        <div className="mg-v2-mapping-list-row__status-col">
          <span
            className="mg-v2-mapping-list-row__status"
            style={{ borderColor: statusColor, color: statusColor }}
          >
            {statusInfo.icon || null} {statusLabel}
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
          {mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}회
        </div>
        <div className="mg-v2-mapping-list-row__date">
          <Calendar size={14} />
          {formatDate(mapping.startDate || mapping.createdAt)}
        </div>
      </div>
      <div className="mg-v2-mapping-list-row__actions">
        {onView && (
          <MGButton variant="primary" size="sm" onClick={() => onView(mapping)} preventDoubleClick>
            <Eye size={14} />
            상세
          </MGButton>
        )}
        {mapping.status === 'PENDING_PAYMENT' && (
          <MGButton
            variant="success"
            size="sm"
            onClick={() => setShowPaymentModal(true)}
            preventDoubleClick
          >
            <CreditCard size={14} />
            결제 확인
          </MGButton>
        )}
        {mapping.status === 'PAYMENT_CONFIRMED' && (
          <MGButton
            variant="primary"
            size="sm"
            onClick={() => setShowDepositModal(true)}
            preventDoubleClick
          >
            <DollarSign size={14} />
            입금 확인
          </MGButton>
        )}
        {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
          <MGButton
            variant="success"
            size="sm"
            onClick={() => onApprove(mapping.id)}
            preventDoubleClick
            clickDelay={1000}
          >
            <CheckCircle size={14} />
            승인
          </MGButton>
        )}
        {onEdit && (
          <MGButton variant="outline" size="sm" onClick={() => onEdit(mapping)} preventDoubleClick>
            <Edit size={14} />
            수정
          </MGButton>
        )}
        {onRefund && (
          <MGButton variant="danger" size="sm" onClick={() => onRefund(mapping)} preventDoubleClick clickDelay={1000}>
            <XCircle size={14} />
            환불
          </MGButton>
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
