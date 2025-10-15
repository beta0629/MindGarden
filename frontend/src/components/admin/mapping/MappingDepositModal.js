import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DollarSign, X, CheckCircle } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import csrfTokenManager from '../../../utils/csrfTokenManager';

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

    // 입금 참조번호 자동 생성 함수
    const generateDepositReference = () => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        return `DEPOSIT_${timestamp}`;
    };

    // 모달이 열릴 때 입금 참조번호 자동 생성
    useEffect(() => {
        if (isOpen && mapping) {
            const referenceNumber = generateDepositReference();
            setDepositReference(referenceNumber);
            
            // 디버깅: 매핑 데이터 구조 확인
            console.log('🔍 MappingDepositModal 매핑 데이터:', {
                mapping,
                consultantName: mapping.consultantName,
                clientName: mapping.clientName,
                consultant: mapping.consultant,
                client: mapping.client,
                packageName: mapping.packageName,
                packagePrice: mapping.packagePrice,
                paymentAmount: mapping.paymentAmount
            });
        }
    }, [isOpen, mapping]);

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

    // document.body가 준비되지 않았을 때를 대비한 안전한 처리
    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={handleClose}>
            <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
                <div className="mg-modal-header">
                    <h3 className="mg-modal-title">
                        <DollarSign size={24} />
                        입금 확인
                    </h3>
                    <button
                        onClick={handleClose}
                        className="mg-modal-close"
                        aria-label="닫기"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mg-modal-body">
                    <div className="mg-info-box">
                        <div className="mg-info-row">
                            <span className="mg-info-label">상담사:</span>
                            <span className="mg-info-value">
                                {mapping.consultantName || mapping.consultant?.name || mapping.consultant?.username || 'N/A'}
                            </span>
                        </div>
                        <div className="mg-info-row">
                            <span className="mg-info-label">내담자:</span>
                            <span className="mg-info-value">
                                {mapping.clientName || mapping.client?.name || mapping.client?.username || 'N/A'}
                            </span>
                        </div>
                        <div className="mg-info-row">
                            <span className="mg-info-label">패키지:</span>
                            <span className="mg-info-value">{mapping.packageName || 'N/A'}</span>
                        </div>
                        <div className="mg-info-row mg-info-row-highlight">
                            <span className="mg-info-label">금액:</span>
                            <span className="mg-info-value">
                                {(mapping.packagePrice || mapping.paymentAmount) ? `${(mapping.packagePrice || mapping.paymentAmount).toLocaleString()}원` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mg-form-group">
                            <label className="mg-label">
                                입금 참조번호 *
                            </label>
                            <input
                                type="text"
                                value={depositReference}
                                onChange={(e) => setDepositReference(e.target.value)}
                                placeholder="자동 생성됩니다 (수정 가능)"
                                className="mg-input"
                                required
                            />
                            <small className="mg-form-help">
                                자동으로 입금 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                            </small>
                        </div>

                        <div className="mg-modal-footer">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="mg-button mg-button-secondary"
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mg-button mg-button-success"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="mg-spinner"></span>
                                        처리 중...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        입금 확인
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default MappingDepositModal;
