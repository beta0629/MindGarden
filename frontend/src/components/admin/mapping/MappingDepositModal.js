import React, { useState } from 'react';
import notificationManager from '../../../utils/notification';
import csrfTokenManager from '../../../utils/csrfTokenManager';
import './MappingDepositModal.css';

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
            const response = await csrfTokenManager.post(`/api/admin/mappings/${mapping.id}/confirm-deposit`, {
                depositReference: depositReference.trim()
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
        <div className="mapping-deposit-modal-overlay">
            <div className="mapping-deposit-modal-content">
                <div className="mapping-deposit-modal-header">
                    <h3 className="mapping-deposit-modal-title">
                        💰 입금 확인
                    </h3>
                    <button
                        onClick={handleClose}
                        className="mapping-deposit-modal-close-btn"
                    >
                        ×
                    </button>
                </div>

                <div className="mapping-deposit-modal-body">
                    <div className="mapping-deposit-info-box">
                        <div className="mapping-deposit-info-item">
                            상담사: {mapping.consultant?.username || 'N/A'}
                        </div>
                        <div className="mapping-deposit-info-item">
                            내담자: {mapping.client?.username || 'N/A'}
                        </div>
                        <div className="mapping-deposit-info-item">
                            패키지: {mapping.packageName || 'N/A'}
                        </div>
                        <div className="mapping-deposit-info-item mapping-deposit-info-item--amount">
                            금액: {mapping.paymentAmount ? `${mapping.paymentAmount.toLocaleString()}원` : 'N/A'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mapping-deposit-form-group">
                            <label className="mapping-deposit-label">
                                입금 참조번호 *
                            </label>
                            <input
                                type="text"
                                value={depositReference}
                                onChange={(e) => setDepositReference(e.target.value)}
                                placeholder="입금 확인 번호를 입력하세요"
                                className="mapping-deposit-input"
                            />
                        </div>

                        <div className="mapping-deposit-button-group">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mapping-deposit-button mapping-deposit-button--cancel"
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mapping-deposit-button mapping-deposit-button--submit"
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
