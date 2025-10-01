import React, { useState } from 'react';
import notificationManager from '../../../utils/notification';

/**
 * 매핑 입금 확인 모달 컴포넌트
 * - 입금 확인 처리
 * - 입금 참조번호 입력
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-30
 */
const MappingDepositModal = ({ 
    isOpen, 
    onClose, 
    mapping, 
    onDepositConfirmed 
}) => {
    const [depositReference, setDepositReference] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!depositReference.trim()) {
            notificationManager.error('입금 참조번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch(`/api/admin/mappings/${mapping.id}/confirm-deposit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    depositReference: depositReference.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                notificationManager.success('입금이 성공적으로 확인되었습니다.');
                onDepositConfirmed?.(mapping.id);
                handleClose();
            } else {
                notificationManager.error(result.message || '입금 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('입금 확인 오류:', error);
            notificationManager.error('입금 확인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setDepositReference('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                width: '400px',
                maxWidth: '90vw',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: '600',
                        color: '#333'
                    }}>
                        💰 입금 확인
                    </h3>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 'var(--font-size-xl)',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '4px'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginBottom: '4px' }}>
                            상담사: {mapping.consultant?.username || 'N/A'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginBottom: '4px' }}>
                            내담자: {mapping.client?.username || 'N/A'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', marginBottom: '4px' }}>
                            패키지: {mapping.packageName || 'N/A'}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: '#666', fontWeight: '600' }}>
                            금액: {mapping.paymentAmount ? `${mapping.paymentAmount.toLocaleString()}원` : 'N/A'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#333',
                                marginBottom: '8px'
                            }}>
                                입금 참조번호 *
                            </label>
                            <input
                                type="text"
                                value={depositReference}
                                onChange={(e) => setDepositReference(e.target.value)}
                                placeholder="입금 확인 번호를 입력하세요"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: 'var(--font-size-sm)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                type="button"
                                onClick={handleClose}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '500'
                                }}
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: isLoading ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {isLoading ? '처리 중...' : '입금 확인'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MappingDepositModal;
