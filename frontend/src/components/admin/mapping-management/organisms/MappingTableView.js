/**
 * MappingTableView - 매칭 목록 테이블 뷰 (B0KlA 스타일)
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, XCircle, CheckCircle, CreditCard, DollarSign, Database, Calendar } from 'lucide-react';
import MappingPaymentModal from '../../mapping/MappingPaymentModal';
import MappingDepositModal from '../../mapping/MappingDepositModal';
import './MappingTableView.css';

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

const MappingTableView = ({
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
  onApprove
}) => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
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

  const openPaymentModal = (mapping) => {
    setSelectedMapping(mapping);
    setShowPaymentModal(true);
  };

  const openDepositModal = (mapping) => {
    setSelectedMapping(mapping);
    setShowDepositModal(true);
  };

  return (
    <div className="mg-v2-mapping-table-wrapper">
      <table className="mg-v2-mapping-table">
        <thead>
          <tr>
            <th>상태</th>
            <th>상담사</th>
            <th>내담자</th>
            <th>패키지</th>
            <th>금액</th>
            <th>회기</th>
            <th>날짜</th>
            <th className="mg-v2-mapping-table__actions-head">관리</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => {
            const statusInfo = {
              ...(mappingStatusInfo[mapping.status] || {
                label: getStatusKoreanName(mapping.status),
                color: getStatusColor(mapping.status),
                icon: null
              }),
              variant: getStatusVariant ? getStatusVariant(mapping.status) : 'secondary'
            };
            const StatusIcon = getStatusIconComponent && mapping.status ? getStatusIconComponent(mapping.status) : null;

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

            return (
              <tr key={mapping.id}>
                <td>
                  <div className="mg-v2-mapping-table__status">
                    <span className={`mg-v2-badge ${badgeVariant}`} role="status" aria-label={statusLabel}>
                      {StatusIcon ? <StatusIcon size={12} className="mg-v2-mapping-table__status-icon" aria-hidden /> : null}
                      {statusLabel}
                    </span>
                    {isErpIntegrated && (
                      <span className="mg-v2-mapping-table__erp" title="ERP 연동됨">
                        <Database size={12} />
                        ERP
                      </span>
                    )}
                  </div>
                </td>
                <td>{mapping.consultantName || 'N/A'}</td>
                <td>{mapping.clientName || 'N/A'}</td>
                <td>{mapping.packageName || 'N/A'}</td>
                <td>{formatAmount(mapping.packagePrice || mapping.paymentAmount)}</td>
                <td>
                  <span>{mapping.usedSessions ?? 0}/{mapping.totalSessions ?? 0}회</span>
                  {mapping.totalSessions > 0 && (
                    <button
                      type="button"
                      className="mg-v2-mapping-table__schedule-link"
                      onClick={() => navigate(`/admin/schedules?consultantId=${mapping.consultantId}&clientId=${mapping.clientId}`)}
                      title="스케줄 보기"
                    >
                      <Calendar size={14} />
                    </button>
                  )}
                </td>
                <td>{formatDate(mapping.startDate || mapping.createdAt)}</td>
                <td className="mg-v2-mapping-table__actions">
                  <div className="mg-v2-mapping-table__actions-inner">
                    {onView && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-primary mg-v2-button-sm"
                        onClick={() => onView(mapping)}
                        title="상세"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    {mapping.status === 'PENDING_PAYMENT' && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-success mg-v2-button-sm"
                        onClick={() => openPaymentModal(mapping)}
                        title="결제 확인"
                      >
                        <CreditCard size={14} />
                      </button>
                    )}
                    {mapping.status === 'PAYMENT_CONFIRMED' && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-primary mg-v2-button-sm"
                        onClick={() => openDepositModal(mapping)}
                        title="입금 확인"
                      >
                        <DollarSign size={14} />
                      </button>
                    )}
                    {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-success mg-v2-button-sm"
                        onClick={() => handleCriticalAction(() => onApprove(mapping.id))}
                        disabled={processing}
                        title="승인"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-outline mg-v2-button-sm"
                        onClick={() => onEdit(mapping)}
                        title="수정"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onRefund && (
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button-danger mg-v2-button-sm"
                        onClick={() => handleCriticalAction(() => onRefund(mapping))}
                        disabled={processing}
                        title="환불"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {showPaymentModal && selectedMapping && (
        <MappingPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          mapping={selectedMapping}
          onPaymentConfirmed={() => {
            setShowPaymentModal(false);
            onConfirmPayment && onConfirmPayment();
          }}
        />
      )}
      {showDepositModal && selectedMapping && (
        <MappingDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          mapping={selectedMapping}
          onDepositConfirmed={() => {
            setShowDepositModal(false);
            onConfirmDeposit && onConfirmDeposit();
          }}
        />
      )}
    </div>
  );
};

MappingTableView.propTypes = {
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
  onApprove: PropTypes.func
};

export default MappingTableView;
