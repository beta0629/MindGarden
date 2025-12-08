import React, { useState } from 'react';
import { User, Calendar, Package, CreditCard, Clock, CheckCircle, Database, Eye, Edit, XCircle, DollarSign } from 'lucide-react';
import MappingPaymentModal from './MappingPaymentModal';
import MappingDepositModal from './MappingDepositModal';
import MGButton from '../../common/MGButton';

/**
 * 매칭 카드 컴포넌트 - 글래스모피즘 디자인
/**
 * SessionManagement 디자인 시스템 기반
 */
const MappingCard = ({ 
    mapping, 
    statusInfo = {
        label: mapping?.status || 'UNKNOWN',
        color: 'var(--medium-gray)',
        icon: '📋'
    },
    onView,
    onEdit, 
    onConfirmPayment,
    onConfirmDeposit,
    onApprove,
    onRefund
}) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    
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
        return `${amount.toLocaleString()}원`;
    };

    const isErpIntegrated = () => {
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
        return mapping.status === 'ACTIVE' || 
               mapping.status === 'DEPOSIT_PENDING' ||
               mapping.depositConfirmed === true ||
               mapping.erpIntegrated === true || 
               mapping.erpSyncStatus === 'SYNCED' || 
               mapping.erpTransactionId ||
               mapping.paymentConfirmed === true;
    };

    return (
        <div className="mg-v2-card mg-v2-card-glass">
            {/* Header */}
            <div className="mg-v2-card-header">
                <div className="mg-v2-mapping-card-header-left">
                    <span className={`mg-v2-badge ${statusInfo.color === 'var(--color-danger)' ? 'mg-v2-badge-danger' : 'mg-v2-badge-success'}`}>
                        {statusInfo.icon} {statusInfo.label}
                    </span>
                    
                    {isErpIntegrated() && (
                        <span className="mg-v2-badge mg-v2-badge-info">
                            <Database size={12} />
                            ERP 연동
                        </span>
                    )}
                </div>
                
                {onView && (
                    <MGButton
                        variant="primary"
                        size="sm"
                        onClick={() => onView(mapping)}
                        preventDoubleClick={true}
                    >
                        <Eye size={16} />
                        상세보기
                    </MGButton>
                )}
            </div>

            {/* Body */}
            <div className="mg-v2-mapping-card-body">
                {/* Participants */}
                <div className="mg-v2-mapping-participants">
                    <div className="mg-v2-mapping-participant">
                        <User size={16} className="mg-v2-mapping-icon" />
                        <div className="mg-v2-mapping-participant-info">
                            <div className="mg-v2-mapping-participant-label">상담사</div>
                            <div className="mg-v2-mapping-participant-name">
                                {mapping.consultantName || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mg-v2-mapping-package-item">
                        <User size={16} className="mg-v2-mapping-icon" />
                        <div className="mg-v2-mapping-participant-info">
                            <div className="mg-v2-mapping-participant-label">내담자</div>
                            <div className="mg-v2-mapping-participant-name">
                                {mapping.clientName || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Package & Amount */}
                <div className="mg-v2-mapping-package-section">
                    <div className="mg-v2-mapping-package-row">
                        <Package size={16} className="mg-v2-mapping-icon" />
                        <div className="mg-v2-mapping-package-info-item">
                            <div className="mg-v2-mapping-package-label">패키지</div>
                            <div className="mg-v2-mapping-package-name">
                                {mapping.packageName || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mg-v2-mapping-package-row">
                        <CreditCard size={16} className="mg-v2-mapping-icon" />
                        <div className="mg-v2-mapping-package-info-item">
                            <div className="mg-v2-mapping-package-label">금액</div>
                            <div className="mg-v2-mapping-amount">
                                {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="mg-v2-mapping-dates-section">
                    {mapping.startDate && (
                        <div className="mg-v2-mapping-date-item">
                            <Calendar size={14} className="mg-v2-mapping-date-icon" />
                            <span className="mg-v2-mapping-date-label">시작일:</span>
                            <span className="mg-v2-mapping-date-value">{formatDate(mapping.startDate)}</span>
                        </div>
                    )}
                    
                    {mapping.createdAt && (
                        <div className="mg-v2-mapping-date-item">
                            <Clock size={14} className="mg-v2-mapping-date-icon" />
                            <span className="mg-v2-mapping-date-label">생성일:</span>
                            <span className="mg-v2-mapping-date-value">{formatDate(mapping.createdAt)}</span>
                        </div>
                    )}
                    
                    {mapping.adminApprovalDate && (
                        <div className="mg-v2-mapping-date-item">
                            <CheckCircle size={14} className="mg-v2-mapping-approval-icon" />
                            <span className="mg-v2-mapping-date-label">승인일:</span>
                            <span className="mg-v2-mapping-date-value">{formatDate(mapping.adminApprovalDate)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mg-v2-card-footer">
                <div className="mg-v2-mapping-card-footer-left">
                    {mapping.status === 'PENDING_PAYMENT' && (
                        <MGButton
                            variant="success"
                            size="sm"
                            onClick={() => setShowPaymentModal(true)}
                            preventDoubleClick={true}
                        >
                            <CreditCard size={16} />
                            결제 확인
                        </MGButton>
                    )}
                    
                    {mapping.status === 'PAYMENT_CONFIRMED' && (
                        <MGButton
                            variant="primary"
                            size="sm"
                            onClick={() => setShowDepositModal(true)}
                            preventDoubleClick={true}
                        >
                            <DollarSign size={16} />
                            입금 확인
                        </MGButton>
                    )}
                    
                    {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
                        <MGButton
                            variant="success"
                            size="sm"
                            onClick={() => onApprove(mapping)}
                            preventDoubleClick={true}
                            clickDelay={1000}
                        >
                            <CheckCircle size={18} />
                            최종 승인
                        </MGButton>
                    )}
                    
                    {onEdit && (
                        <MGButton
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(mapping)}
                            preventDoubleClick={true}
                        >
                            <Edit size={16} />
                            수정
                        </MGButton>
                    )}
                    
                    {onRefund && (
                        <MGButton
                            variant="danger"
                            size="sm"
                            onClick={() => onRefund(mapping)}
                            preventDoubleClick={true}
                            clickDelay={1000}
                        >
                            <XCircle size={16} />
                            환불
                        </MGButton>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showPaymentModal && (
                <MappingPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    mapping={mapping}
                    onPaymentConfirmed={onConfirmPayment}
                />
            )}

            {showDepositModal && (
                <MappingDepositModal
                    isOpen={showDepositModal}
                    onClose={() => setShowDepositModal(false)}
                    mapping={mapping}
                    onDepositConfirmed={onConfirmDeposit}
                />
            )}
        </div>
    );
};

export default MappingCard;
