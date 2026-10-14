import React, { useState } from 'react';
import { resolveUserFacingApiErrorMessage } from '../../utils/userFacingApiErrorMessage';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './PasswordResetModal.css';
import { useTranslation } from 'react-i18next';

/**
 * 관리자 임시 비밀번호 문자 발송 모달. 비밀번호는 입력하지 않는다.
 */
const PasswordResetModal = ({
    user,
    userType,
    onClose,
    onConfirm
}) => {
    const { t } = useTranslation();
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('비밀번호 초기화 요청 오류:', error);
            setSubmitError(resolveUserFacingApiErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const userTypeLabel = userType === 'client' ? '내담자' : t('admin:PasswordResetModal.t_293bb79c');
    const userName = user?.name || user?.email || t('admin:PasswordResetModal.t_5c50d9e5');

    return (
        <UnifiedModal
            isOpen={!!user}
            onClose={onClose}
            title={t('auth:tempPasswordSms.resetTitle')}
            size="medium"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            actions={
                <>
                    <MGButton
                        type="button"
                        variant="secondary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onClose}
                    >
                        {t('admin.actions.cancel')}
                    </MGButton>
                    <MGButton
                        type="submit"
                        form="admin-password-reset-form"
                        variant="primary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isSubmitting })}
                        loading={isSubmitting}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                    >
                        {t('auth:tempPasswordSms.resetButton')}
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                <p className="mg-v2-info-text">
                    <strong>{userName}</strong> {userTypeLabel}의 임시 비밀번호를 문자로 보냅니다.
                </p>
                <p className="mg-v2-info-text">
                    {t('auth:tempPasswordSms.resetHelp')}
                </p>
            </div>

            <form
                id="admin-password-reset-form"
                className="mg-v2-form admin-password-reset-form"
                onSubmit={handleSubmit}
            >
                {submitError ? (
                    <p className="mg-v2-form-error mg-v2-form-error--submit" role="alert">
                        {submitError}
                    </p>
                ) : null}
            </form>
        </UnifiedModal>
    );
};

export default PasswordResetModal;
