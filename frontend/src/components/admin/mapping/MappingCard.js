import React, { useState } from 'react';
import { User, Calendar, Package, CreditCard, Clock, CheckCircle, Database } from 'lucide-react';
import MappingPaymentModal from './MappingPaymentModal';
import MappingDepositModal from './MappingDepositModal';

/**
 * 매칭 카드 컴포넌트 - 글래스모피즘 디자인
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
        // 입금 확인 완료되거나 ACTIVE 상태일 때 ERP 연동됨으로 간주
        return mapping.status === 'ACTIVE' || 
               mapping.status === 'DEPOSIT_PENDING' ||
               mapping.depositConfirmed === true ||
               mapping.erpIntegrated === true || 
               mapping.erpSyncStatus === 'SYNCED' || 
               mapping.erpTransactionId ||
               mapping.paymentConfirmed === true;
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(139, 69, 19, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        borderRadius: '50px',
                        background: statusInfo.color === 'var(--color-danger)' ? 'var(--color-danger)' : 'var(--mint-green)',
                        color: statusInfo.color === 'var(--color-danger)' ? 'white' : 'var(--dark-gray)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid rgba(139, 69, 19, 0.1)'
                    }}>
                        {statusInfo.icon} {statusInfo.label}
                    </span>
                    
                    {isErpIntegrated() && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--color-info)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-medium)'
                        }}>
                            <Database size={12} />
                            ERP 연동
                        </span>
                    )}
                </div>
                
                {onView && (
                    <button 
                        className="mg-button mg-button-sm mg-button-primary"
                        onClick={() => onView(mapping)}
                    >
                        상세보기
                    </button>
                )}
            </div>

            {/* Body */}
            <div style={{ padding: 'var(--spacing-md)', flex: 1 }}>
                {/* Participants */}
                <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <User size={16} style={{ color: 'var(--olive-green)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}>상담사</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word' }}>
                                {mapping.consultantName || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <User size={16} style={{ color: 'var(--olive-green)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}>내담자</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)', wordBreak: 'break-word' }}>
                                {mapping.clientName || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Package & Amount */}
                <div style={{ 
                    display: 'flex', 
                    gap: 'var(--spacing-md)', 
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Package size={16} style={{ color: 'var(--olive-green)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}>패키지</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}>
                                {mapping.packageName || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '0', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <CreditCard size={16} style={{ color: 'var(--olive-green)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--medium-gray)' }}>금액</div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--olive-green)', fontWeight: 'var(--font-weight-bold)' }}>
                                {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div style={{ 
                    borderTop: '1px solid rgba(139, 69, 19, 0.1)', 
                    paddingTop: 'var(--spacing-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)'
                }}>
                    {mapping.startDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}>
                            <Calendar size={14} style={{ color: 'var(--medium-gray)' }} />
                            <span style={{ color: 'var(--medium-gray)', fontWeight: 'var(--font-weight-medium)' }}>시작일:</span>
                            <span style={{ color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}>{formatDate(mapping.startDate)}</span>
                        </div>
                    )}
                    
                    {mapping.createdAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}>
                            <Clock size={14} style={{ color: 'var(--medium-gray)' }} />
                            <span style={{ color: 'var(--medium-gray)', fontWeight: 'var(--font-weight-medium)' }}>생성일:</span>
                            <span style={{ color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}>{formatDate(mapping.createdAt)}</span>
                        </div>
                    )}
                    
                    {mapping.adminApprovalDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)' }}>
                            <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                            <span style={{ color: 'var(--medium-gray)', fontWeight: 'var(--font-weight-medium)' }}>승인일:</span>
                            <span style={{ color: 'var(--dark-gray)', fontWeight: 'var(--font-weight-semibold)' }}>{formatDate(mapping.adminApprovalDate)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderTop: '1px solid rgba(139, 69, 19, 0.1)',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                    {mapping.status === 'PENDING_PAYMENT' && (
                        <button 
                            className="mg-button mg-button-sm mg-button-success"
                            onClick={() => setShowPaymentModal(true)}
                        >
                            결제 확인
                        </button>
                    )}
                    
                    {mapping.status === 'PAYMENT_CONFIRMED' && (
                        <button 
                            className="mg-button mg-button-sm mg-button-primary"
                            onClick={() => setShowDepositModal(true)}
                        >
                            입금 확인
                        </button>
                    )}
                    
                    {mapping.status === 'DEPOSIT_PENDING' && onApprove && (
                        <button 
                            className="mg-button mg-button-sm mg-button-success"
                            onClick={() => onApprove(mapping)}
                        >
                            최종 승인
                        </button>
                    )}
                    
                    {onEdit && (
                        <button 
                            className="mg-button mg-button-sm mg-button-outline"
                            onClick={() => onEdit(mapping)}
                        >
                            수정
                        </button>
                    )}
                    
                    {onRefund && (
                        <button 
                            className="mg-button mg-button-sm mg-button-danger"
                            onClick={() => onRefund(mapping)}
                        >
                            환불
                        </button>
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
