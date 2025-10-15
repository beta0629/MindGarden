import React, { useState } from 'react';
import { User, Calendar, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import MappingPaymentModal from './MappingPaymentModal';
import MappingDepositModal from './MappingDepositModal';

/**
 * 매핑 카드 컴포넌트 (디자인 시스템 v2.0 적용)
 * - 개별 매핑 정보를 카드 형태로 표시
 * - 매핑 상태, 참여자 정보, 세션 정보 등 표시
 * - 디자인 시스템 클래스 사용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 * @updated 2025-10-15 - 디자인 시스템 v2.0 적용
 */
const MappingCard = ({ 
    mapping, 
    statusInfo = {
        label: mapping?.status || 'UNKNOWN',
        color: 'var(--color-text-secondary, #424245)',
        icon: '📋'
    },
    onApprove, 
    onReject, 
    onConfirmPayment,
    onConfirmDeposit,
    onEdit, 
    onView,
    onTransfer,
    onViewTransferHistory,
    onRefund,
    onDelete
}) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    
    // 상태별 색상 (props에서 받은 데이터 사용)
    const getStatusColor = (status) => {
        return statusInfo.color;
    };

    // 상태별 한글명 (props에서 받은 데이터 사용)
    const getStatusLabel = (status) => {
        return statusInfo.label;
    };

    // 상태별 아이콘 (props에서 받은 데이터 사용)
    const getStatusIcon = (status) => {
        return statusInfo.icon;
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('ko-KR');
        } catch (error) {
            return '날짜 오류';
        }
    };

    // 금액 포맷팅 함수
    const formatAmount = (amount) => {
        if (!amount) return 'N/A';
        return `${amount.toLocaleString()}원`;
    };

    return (
        <div className="mg-card mg-mapping-card">
            {/* 카드 헤더 */}
            <div className="mg-card-header">
                <div className="mg-mapping-status">
                    <span 
                        className="mg-status-badge"
                        style={{ '--status-color': getStatusColor(mapping.status) }}
                    >
                        {getStatusIcon(mapping.status)}
                        {getStatusLabel(mapping.status)}
                    </span>
                </div>
                <div className="mg-mapping-actions">
                    {onView && (
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--primary"
                            onClick={() => onView(mapping)}
                        >
                            상세보기
                        </button>
                    )}
                </div>
            </div>

            {/* 카드 본문 */}
            <div className="mg-card-body">
                {/* 매핑 정보 */}
                <div className="mg-mapping-info">
                    <div className="mg-info-row">
                        <div className="mg-info-item">
                            <User size={16} className="mg-info-icon" />
                            <div className="mg-info-content">
                                <span className="mg-info-label">상담사</span>
                                <span className="mg-info-value">
                                    {mapping.consultantName || mapping.consultant?.name || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="mg-info-item">
                            <User size={16} className="mg-info-icon" />
                            <div className="mg-info-content">
                                <span className="mg-info-label">내담자</span>
                                <span className="mg-info-value">
                                    {mapping.clientName || mapping.client?.name || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mg-info-row">
                        <div className="mg-info-item">
                            <DollarSign size={16} className="mg-info-icon" />
                            <div className="mg-info-content">
                                <span className="mg-info-label">패키지</span>
                                <span className="mg-info-value">
                                    {mapping.packageName || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="mg-info-item">
                            <DollarSign size={16} className="mg-info-icon" />
                            <div className="mg-info-content">
                                <span className="mg-info-label">금액</span>
                                <span className="mg-info-value mg-info-value--highlight">
                                    {formatAmount(mapping.packagePrice || mapping.paymentAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 날짜 정보 */}
                <div className="mg-mapping-dates">
                    {mapping.startDate && (
                        <div className="mg-date-item">
                            <Calendar size={14} className="mg-date-icon" />
                            <span className="mg-date-label">시작일:</span>
                            <span className="mg-date-value">{formatDate(mapping.startDate)}</span>
                        </div>
                    )}
                    
                    {mapping.createdAt && (
                        <div className="mg-date-item">
                            <Clock size={14} className="mg-date-icon" />
                            <span className="mg-date-label">생성일:</span>
                            <span className="mg-date-value">{formatDate(mapping.createdAt)}</span>
                        </div>
                    )}
                    
                    {mapping.adminApprovalDate && (
                        <div className="mg-date-item">
                            <CheckCircle size={14} className="mg-date-icon mg-date-icon--success" />
                            <span className="mg-date-label">승인일:</span>
                            <span className="mg-date-value">{formatDate(mapping.adminApprovalDate)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 카드 푸터 */}
            <div className="mg-card-footer">
                <div className="mg-mapping-actions">
                    {mapping.status === 'PENDING_PAYMENT' && (
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--success"
                            onClick={() => setShowPaymentModal(true)}
                        >
                            결제 확인
                        </button>
                    )}
                    
                    {mapping.status === 'PAYMENT_CONFIRMED' && (
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--info"
                            onClick={() => setShowDepositModal(true)}
                        >
                            입금 확인
                        </button>
                    )}
                    
                    {onEdit && (
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--warning"
                            onClick={() => onEdit(mapping)}
                        >
                            수정
                        </button>
                    )}
                    
                    {onRefund && (
                        <button 
                            className="mg-btn mg-btn--sm mg-btn--danger"
                            onClick={() => onRefund(mapping)}
                        >
                            환불
                        </button>
                    )}
                </div>
            </div>

            {/* 모달들 */}
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