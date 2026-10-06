import React, { useState, useEffect } from 'react';
import { getPasswordPolicyApiErrorMessage } from '../../utils/loginPasswordPolicy';
import usePasswordPolicyField from '../../hooks/usePasswordPolicyField';
import PasswordPolicyInput, { PasswordPolicyError } from '../common/PasswordPolicyInput';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './PasswordResetModal.css';
import { useTranslation } from 'react-i18next';

const RESET_INPUT_ERROR_CLASS = 'mg-v2-form-input-error';
const RESET_ERROR_CLASS = 'mg-v2-form-error';

/**
 * 비밀번호 초기화 모달 컴포넌트
 */
const PasswordResetModal = ({
    user,
    userType, // 'client' or 'consultant'
    onClose,
    onConfirm
}) => {
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const passwordField = usePasswordPolicyField({ requireConfirm: true });
    const { clearError: clearPasswordError } = passwordField;
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        clearPasswordError();
        setSubmitError('');
    }, [user?.id, clearPasswordError]);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setSubmitError('');

        if (!passwordField.validate(newPassword, confirmPassword)) return;

        setIsSubmitting(true);
        try {
            await onConfirm(newPassword);
        } catch (error) {
            console.error('비밀번호 초기화 요청 오류:', error);
            setSubmitError(getPasswordPolicyApiErrorMessage(error));
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
            title="비밀번호 초기화"
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
                        비밀번호 초기화
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                <p className="mg-v2-info-text">
                    <strong>{userName}</strong> {userTypeLabel}의 비밀번호를 초기화합니다.
                </p>
                <p className="mg-v2-info-text">
                    {passwordField.hint}
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
                <div className="mg-v2-form-group">
                    <label htmlFor="newPassword" className="mg-v2-form-label">
                        새 비밀번호
                    </label>
                    <div className="mg-v2-form-input-wrapper">
                        <PasswordPolicyInput
                            field={passwordField}
                            revealed={showPassword}
                            showHint={false}
                            showError={false}
                            id="newPassword"
                            errorInputClassName={RESET_INPUT_ERROR_CLASS}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setSubmitError('');
                                clearPasswordError();
                            }}
                        />
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-form-input-toggle`}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : t('admin:PasswordResetModal.t_8f3ebd49')}
                            preventDoubleClick={false}
                        >
                            {showPassword ? '비밀번호 숨기기' : t('admin:PasswordResetModal.t_8f3ebd49')}
                        </MGButton>
                    </div>
                    <PasswordPolicyError field={passwordField} id="newPassword" className={RESET_ERROR_CLASS} />
                </div>

                <div className="mg-v2-form-group">
                    <label htmlFor="confirmPassword" className="mg-v2-form-label">
                        비밀번호 확인
                    </label>
                    <div className="mg-v2-form-input-wrapper">
                        <PasswordPolicyInput
                            field={passwordField}
                            confirm
                            revealed={showPassword}
                            showError={false}
                            id="confirmPassword"
                            errorInputClassName={RESET_INPUT_ERROR_CLASS}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setSubmitError('');
                                clearPasswordError();
                            }}
                            placeholder="비밀번호를 다시 입력하세요"
                        />
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-form-input-toggle`}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : t('admin:PasswordResetModal.t_8f3ebd49')}
                            preventDoubleClick={false}
                        >
                            {showPassword ? '비밀번호 숨기기' : t('admin:PasswordResetModal.t_8f3ebd49')}
                        </MGButton>
                    </div>
                    <PasswordPolicyError field={passwordField} confirm id="confirmPassword" className={RESET_ERROR_CLASS} />
                </div>
            </form>
        </UnifiedModal>
    );
};

export default PasswordResetModal;
