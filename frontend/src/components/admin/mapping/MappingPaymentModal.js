import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { apiPost } from '../../../utils/ajax';
import notificationManager from '../../../utils/notification';
import UnifiedModal from '../../common/modals/UnifiedModal';
/**
 * 매칭 입금확인 모달 컴포넌트
/**
 * - 결제 방법 선택 (계좌이체, 신용카드, 현금)
/**
 * - 결제 참조번호 자동 생성 및 수정 가능
/**
 * - 입금확인 처리
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-01-16
 */
const MappingPaymentModal = ({ 
    isOpen, 
    onClose, 
    mapping, 
    onPaymentConfirmed 
}) => {
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: '',
        paymentAmount: 0
    });

    // 참조번호 생성 함수
    const generateReferenceNumber = (method = 'BANK_TRANSFER') => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        
        if (method === 'CASH') {
            return `CASH_${timestamp}`;
        } else if (method === 'CARD') {
            return `CARD_${timestamp}`;
        } else if (method === 'BANK_TRANSFER') {
            return `BANK_${timestamp}`;
        } else {
            return `${method}_${timestamp}`;
        }
    };

    // 모달이 열릴 때 초기화
    useEffect(() => {
        if (isOpen && mapping) {
            const referenceNumber = generateReferenceNumber('BANK_TRANSFER');
            
            setPaymentData({
                paymentMethod: 'BANK_TRANSFER',
                paymentReference: referenceNumber,
                paymentAmount: mapping.packagePrice || 0
            });
        }
    }, [isOpen, mapping]);

    // 결제 방법 변경 시 참조번호 자동 생성
    const handlePaymentMethodChange = (method) => {
        const reference = generateReferenceNumber(method);

        setPaymentData(prev => ({
            ...prev,
            paymentMethod: method,
            paymentReference: reference
        }));
    };

    // 입금확인 처리
    const handleConfirmPayment = async () => {
        if (!mapping) return;

        setLoading(true);
        try {
            const response = await apiPost(`/api/v1/admin/mappings/${mapping.id}/confirm-payment`, {
                paymentMethod: paymentData.paymentMethod,
                paymentReference: paymentData.paymentMethod === 'CASH' ? null : paymentData.paymentReference,
                paymentAmount: paymentData.paymentAmount
            });

            // apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공
            if (response) {
                notificationManager.success('✅ 결제 확인 완료! ERP 시스템에 미수금 거래가 자동 등록되었습니다.');
                onPaymentConfirmed?.(mapping.id);
                onClose();
            } else {
                notificationManager.error('결제 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('결제 확인 실패:', error);
            const errorMessage = error.message || '결제 확인에 실패했습니다.';
            notificationManager.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mapping) {
        return null;
    }

    // 모달이 열릴 때마다 참조번호 강제 생성
    const currentReference = paymentData.paymentReference || generateReferenceNumber(paymentData.paymentMethod);

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title="결제 확인"
            size="medium"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            loading={loading}
            actions={
                <>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-secondary"
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            onClose();
                        }}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-primary"
                        onClick={handleConfirmPayment}
                        disabled={loading}
                    >
                        <CheckCircle size={18} />
                        입금 확인
                    </button>
                </>
            }
        >
                <div className="mg-v2-modal-body">

                <div className="mg-v2-ad-b0kla__card mg-v2-mapping-info-box">
                    <div className="mg-v2-mapping-info-content">
                        <div className="mg-v2-mapping-info-label">
                            매칭 정보
                        </div>
                        <div className="mg-v2-mapping-info-title">
                            {mapping.consultantName} → {mapping.clientName}
                        </div>
                        <div className="mg-v2-mapping-info-subtitle">
                            {mapping.packageName} - {mapping.packagePrice?.toLocaleString()}원
                        </div>
                    </div>
                </div>

                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">
                        결제 방법
                    </label>
                    <select
                        value={paymentData.paymentMethod}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        className="mg-v2-form-select"
                    >
                        <option value="BANK_TRANSFER">계좌이체</option>
                        <option value="CARD">신용카드</option>
                        <option value="CASH">현금</option>
                    </select>
                </div>

                {paymentData.paymentMethod !== 'CASH' && (
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">
                            결제 참조번호
                        </label>
                        <input
                            type="text"
                            value={currentReference}
                            onChange={(e) => {
                                setPaymentData(prev => ({
                                    ...prev,
                                    paymentReference: e.target.value
                                }));
                            }}
                            placeholder="자동 생성됩니다 (수정 가능)"
                            className="mg-v2-form-input"
                        />
                        <small className="mg-v2-form-help">
                            자동으로 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                        </small>
                    </div>
                )}

                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">
                        결제 금액
                    </label>
                    <input
                        type="number"
                        value={paymentData.paymentAmount}
                        onChange={(e) => setPaymentData(prev => ({
                            ...prev,
                            paymentAmount: parseInt(e.target.value) || 0
                        }))}
                        placeholder="결제 금액을 입력하세요"
                        className="mg-v2-form-input"
                    />
                </div>

                </div>

                </div>
        </UnifiedModal>
    );
};

export default MappingPaymentModal;
