import React, { useState, useEffect } from 'react';
import { DollarSign, XCircle, CheckCircle } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import { apiPost } from '../../../utils/ajax';
import UnifiedModal from '../../common/modals/UnifiedModal';

/**
 * 매칭 입금 확인 모달 컴포넌트
/**
 * - 입금 확인 처리
/**
 * - 입금 참조번호 입력
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
            
            // 디버깅: 매칭 데이터 구조 확인
            console.log('🔍 MappingDepositModal 매칭 데이터:', {
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
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (!depositReference.trim()) {
            notificationManager.error('입금 참조번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        
        try {
            // 표준화 2025-12-08: API 경로 표준화 및 apiPost 사용
            const response = await apiPost(`/api/v1/admin/mappings/${mapping.id}/confirm-deposit`, {
                depositReference: depositReference.trim()
            });

            // apiPost는 ApiResponse의 data만 반환하므로, response가 존재하면 성공
            if (response) {
                notificationManager.success('✅ 입금이 성공적으로 확인되었습니다.');
                onDepositConfirmed?.(mapping.id);
                handleClose();
            } else {
                notificationManager.error('입금 확인에 실패했습니다.');
            }
        } catch (error) {
            console.error('입금 확인 오류:', error);
            const errorMessage = error.message || '입금 확인 중 오류가 발생했습니다.';
            notificationManager.error(errorMessage);
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
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title="입금 확인"
            size="auto"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            loading={isLoading}
            actions={
                <>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-outline"
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            handleClose();
                        }}
                        disabled={isLoading}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-primary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        <CheckCircle size={18} />
                        입금 확인
                    </button>
                </>
            }
        >
                <div className="mg-v2-modal-body">
                    <div className="mg-v2-ad-b0kla__card mg-v2-info-box">
                        <div className="mg-v2-info-row">
                            <span className="mg-v2-info-label">상담사:</span>
                            <span className="mg-v2-info-value">
                                {mapping.consultantName || mapping.consultant?.name || mapping.consultant?.userId || 'N/A'}
                            </span>
                        </div>
                        <div className="mg-v2-info-row">
                            <span className="mg-v2-info-label">내담자:</span>
                            <span className="mg-v2-info-value">
                                {mapping.clientName || mapping.client?.name || mapping.client?.userId || 'N/A'}
                            </span>
                        </div>
                        <div className="mg-v2-info-row">
                            <span className="mg-v2-info-label">패키지:</span>
                            <span className="mg-v2-info-value">{mapping.packageName || 'N/A'}</span>
                        </div>
                        <div className="mg-v2-info-row mg-info-row-highlight">
                            <span className="mg-v2-info-label">금액:</span>
                            <span className="mg-v2-info-value">
                                {(mapping.packagePrice || mapping.paymentAmount) ? `${(mapping.packagePrice || mapping.paymentAmount).toLocaleString()}원` : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="mg-v2-form-group">
                            <label className="mg-v2-label">
                                입금 참조번호 *
                            </label>
                            <input
                                type="text"
                                value={depositReference}
                                onChange={(e) => setDepositReference(e.target.value)}
                                placeholder="자동 생성됩니다 (수정 가능)"
                                className="mg-v2-input"
                                required
                            />
                            <small className="mg-v2-form-help">
                                자동으로 입금 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                            </small>
                        </div>
                    </div>
                </div>
        </UnifiedModal>
    );
};

export default MappingDepositModal;
