import React, { useState, useEffect } from 'react';
import { User, Link2, UserCircle } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import { toDisplayString } from '../../../utils/safeDisplay';
import SafeText from '../../common/SafeText';
import StandardizedApi from '../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import UnifiedModal from '../../common/modals/UnifiedModal';
import ActionBar from '../../common/ActionBar';
import ActionBarButton from '../../common/ActionBarButton';
import '../MappingCreationModal.css';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
        }
    }, [isOpen, mapping]);

    const handleSubmit = async(e) => {
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
            const response = await StandardizedApi.post(
              API_ENDPOINTS.ADMIN.MAPPINGS.CONFIRM_DEPOSIT(mapping.id),
              {
                depositReference: depositReference.trim()
              }
            );

            if (response?.success !== false) {
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
            size="medium"
            className="mg-v2-ad-b0kla mg-v2-deposit-modal"
            backdropClick
            showCloseButton
            loading={isLoading}
            actions={
                <ActionBar align="end" gap="md">
                    <ActionBarButton
                        variant="outline"
                        onClick={(e) => {
                            e?.preventDefault();
                            e?.stopPropagation();
                            handleClose();
                        }}
                        disabled={isLoading}
                    >
                        {t('admin.actions.cancel')}
                    </ActionBarButton>
                    <ActionBarButton variant="primary" onClick={handleSubmit} loading={isLoading}>
                        입금 확인
                    </ActionBarButton>
                </ActionBar>
            }
        >
            <div className="mg-v2-mapping-creation-modal-wrapper">
                <div className="mg-v2-ad-b0kla mg-v2-mapping-creation-modal">
                    <div className="mg-v2-mapping-creation-modal__summary-bar">
                        <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                            <User size={16} /> <SafeText fallback="N/A">{mapping.consultantName ?? mapping.consultant?.name ?? mapping.consultant?.userId}</SafeText>
                        </span>
                        <span className="mg-v2-mapping-creation-modal__summary-divider" aria-hidden="true">
                            <Link2 size={16} />
                        </span>
                        <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--person">
                            <UserCircle size={16} /> <SafeText fallback="N/A">{mapping.clientName ?? mapping.client?.name ?? mapping.client?.userId}</SafeText>
                        </span>
                        <span className="mg-v2-mapping-creation-modal__summary-separator">|</span>
                        <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--product">
                            <SafeText fallback="N/A">{mapping.packageName}</SafeText>
                        </span>
                        <span className="mg-v2-mapping-creation-modal__summary-segment mg-v2-mapping-creation-modal__summary-segment--amount">
                            {(mapping.packagePrice != null || mapping.paymentAmount != null)
                                ? `${Number(mapping.packagePrice || mapping.paymentAmount).toLocaleString()}원`
                                : toDisplayString('N/A')}
                        </span>
                    </div>
                    <div className="mg-v2-mapping-creation-modal__form-group">
                        <label>입금 참조번호 *</label>
                        <input
                            type="text"
                            value={depositReference}
                            onChange={(e) => setDepositReference(e.target.value)}
                            placeholder="자동 생성됩니다 (수정 가능)"
                            className="mg-v2-mapping-creation-modal__input"
                            required
                        />
                        <small className="mg-v2-mapping-creation-modal__form-help">
                            자동으로 입금 참조번호가 생성됩니다. 필요시 수정할 수 있습니다.
                        </small>
                    </div>
                </div>
            </div>
        </UnifiedModal>
    );
};

export default MappingDepositModal;
