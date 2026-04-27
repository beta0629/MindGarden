import React, { useState, useEffect, useCallback } from 'react';
import {
    getFirstLoginPasswordViolationMessage,
    getPasswordPolicyApiErrorMessage,
    LOGIN_PASSWORD_FIELD_PLACEHOLDER,
    LOGIN_PASSWORD_POLICY_HINT_ONE_LINE
} from '../../constants/passwordPolicyUi';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './PasswordResetModal.css';

/**
 * 비밀번호 초기화 모달 컴포넌트
 */
const PasswordResetModal = ({
    user,
    userType, // 'client' or 'consultant'
    onClose,
    onConfirm
}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setNewPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setErrors({});
        setSubmitError('');
    }, [user?.id]);

    const validatePassword = useCallback(() => {
        const newErrors = {};

        if (!newPassword || newPassword.trim().length === 0) {
            newErrors.newPassword = '새 비밀번호를 입력해주세요.';
        } else {
            const policyMsg = getFirstLoginPasswordViolationMessage(newPassword);
            if (policyMsg) {
                newErrors.newPassword = policyMsg;
            }
        }

        if (!confirmPassword || confirmPassword.trim().length === 0) {
            newErrors.confirmPassword = '비밀번호 확인란에 위와 동일한 비밀번호를 입력해주세요.';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = '위 비밀번호와 일치하지 않습니다. 다시 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [newPassword, confirmPassword]);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setSubmitError('');

        if (!validatePassword()) return;

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

    const userTypeLabel = userType === 'client' ? '내담자' : '상담사';
    const userName = user?.name || user?.email || '사용자';

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
                        취소
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
                    {LOGIN_PASSWORD_POLICY_HINT_ONE_LINE}
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
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="newPassword"
                            className={`mg-v2-form-input ${errors.newPassword ? 'mg-v2-form-input-error' : ''}`}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setSubmitError('');
                                if (errors.newPassword) {
                                    setErrors(prev => ({ ...prev, newPassword: null }));
                                }
                            }}
                            placeholder={LOGIN_PASSWORD_FIELD_PLACEHOLDER}
                            autoComplete="new-password"
                        />
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-form-input-toggle`}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            preventDoubleClick={false}
                        >
                            {showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                        </MGButton>
                    </div>
                    {errors.newPassword && (
                        <span className="mg-v2-form-error" role="alert">
                            {errors.newPassword}
                        </span>
                    )}
                </div>

                <div className="mg-v2-form-group">
                    <label htmlFor="confirmPassword" className="mg-v2-form-label">
                        비밀번호 확인
                    </label>
                    <div className="mg-v2-form-input-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            className={`mg-v2-form-input ${errors.confirmPassword ? 'mg-v2-form-input-error' : ''}`}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setSubmitError('');
                                if (errors.confirmPassword) {
                                    setErrors(prev => ({ ...prev, confirmPassword: null }));
                                }
                            }}
                            placeholder="비밀번호를 다시 입력하세요"
                            autoComplete="new-password"
                        />
                        <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-form-input-toggle`}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            preventDoubleClick={false}
                        >
                            {showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                        </MGButton>
                    </div>
                    {errors.confirmPassword && (
                        <span className="mg-v2-form-error" role="alert">
                            {errors.confirmPassword}
                        </span>
                    )}
                </div>
            </form>
        </UnifiedModal>
    );
};

export default PasswordResetModal;
