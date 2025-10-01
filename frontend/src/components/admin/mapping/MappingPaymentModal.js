import React, { useState, useEffect } from 'react';
import { apiPost } from '../../../utils/ajax';
import notificationManager from '../../../utils/notification';

/**
 * 매핑 입금확인 모달 컴포넌트
 * - 결제 방법 선택 (계좌이체, 신용카드, 현금)
 * - 결제 참조번호 자동 생성 및 수정 가능
 * - 입금확인 처리
 * 
 * @author MindGarden
 * @version 1.0.0
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
            const response = await apiPost(`/api/admin/mappings/${mapping.id}/confirm-payment`, {
                paymentMethod: paymentData.paymentMethod,
                paymentReference: paymentData.paymentMethod === 'CASH' ? null : paymentData.paymentReference,
                paymentAmount: paymentData.paymentAmount
            });

            if (response.success) {
                notificationManager.success('✅ 결제 확인 완료! ERP 시스템에 미수금 거래가 자동 등록되었습니다.');
                onPaymentConfirmed?.(mapping.id);
                onClose();
            } else {
                notificationManager.error('결제 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('결제 확인 실패:', error);
            notificationManager.error('결제 확인에 실패했습니다.');
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
        <div className="mapping-payment-modal-overlay"
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            '--input-bg': '#ffffff',
            '--input-color': '#333333',
            '--input-border': '#e1e8ed'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                width: '400px',
                maxWidth: '90vw',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
                <h3 style={{
                    margin: '0 0 20px 0',
                    color: '#2c5aa0',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600'
                }}>
                    💰 결제 확인
                </h3>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#6c757d', marginBottom: '4px' }}>
                            매핑 정보
                        </div>
                        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '600' }}>
                            {mapping.consultantName} → {mapping.clientName}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#6c757d', marginTop: '4px' }}>
                            {mapping.packageName} - {mapping.packagePrice?.toLocaleString()}원
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: '#333'
                    }}>
                        결제 방법
                    </label>
                    <select
                        value={paymentData.paymentMethod}
                        onChange={(e) => handlePaymentMethodChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            cursor: 'pointer',
                            backgroundColor: '#ffffff',
                            color: '#333333',
                            border: '2px solid #e1e8ed',
                            outline: 'none',
                            boxSizing: 'border-box',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none'
                        }}
                    >
                        <option value="BANK_TRANSFER">계좌이체</option>
                        <option value="CARD">신용카드</option>
                        <option value="CASH">현금</option>
                    </select>
                </div>

                {paymentData.paymentMethod !== 'CASH' && (
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500',
                            color: '#333'
                        }}>
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
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                fontSize: 'var(--font-size-sm)',
                                backgroundColor: 'var(--input-bg, #ffffff)',
                                color: 'var(--input-color, #333333)',
                                border: '2px solid var(--input-border, #e1e8ed)',
                                outline: 'none',
                                boxSizing: 'border-box',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                appearance: 'none',
                                background: 'var(--input-bg, #ffffff)',
                                backgroundImage: 'none',
                                backgroundClip: 'padding-box',
                                WebkitBackgroundClip: 'padding-box',
                                MozBackgroundClip: 'padding-box'
                            }}
                        />
                        <small style={{
                            display: 'block',
                            marginTop: '4px',
                            fontSize: 'var(--font-size-xs)',
                            color: '#6c757d'
                        }}>
                            자동으로 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                        </small>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: '#333'
                    }}>
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
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            backgroundColor: '#ffffff',
                            color: '#333333',
                            border: '2px solid #e1e8ed',
                            outline: 'none',
                            boxSizing: 'border-box',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none'
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            color: '#666',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500'
                        }}
                    >
                        {loading ? '처리 중...' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MappingPaymentModal;
