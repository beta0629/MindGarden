import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validatePassword = () => {
        const newErrors = {};

        if (!newPassword || newPassword.trim().length === 0) {
            newErrors.newPassword = '새 비밀번호를 입력해주세요.';
        } else if (newPassword.length < 8) {
            newErrors.newPassword = '비밀번호는 최소 8자 이상이어야 합니다.';
        } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
            newErrors.newPassword = '비밀번호는 영문과 숫자를 포함해야 합니다.';
        }

        if (!confirmPassword || confirmPassword.trim().length === 0) {
            newErrors.confirmPassword = '비밀번호 확인란에 위와 동일한 비밀번호를 입력해주세요.';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = '위 비밀번호와 일치하지 않습니다. 다시 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(newPassword);
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
                    <button
                        type="button"
                        className="mg-v2-button mg-v2-button-secondary"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <MGButton
                        type="submit"
                        form="admin-password-reset-form"
                        variant="primary"
                        loading={isSubmitting}
                        loadingText="처리 중..."
                        preventDoubleClick
                    >
                        비밀번호 초기화
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                <AlertTriangle size={20} aria-hidden />
                <p className="mg-v2-info-text">
                    <strong>{userName}</strong> {userTypeLabel}의 비밀번호를 초기화합니다.
                </p>
                <p className="mg-v2-info-text">
                    새 비밀번호는 최소 8자 이상이며, 영문과 숫자를 포함해야 합니다.
                </p>
            </div>

            <form
                id="admin-password-reset-form"
                className="mg-v2-form admin-password-reset-form"
                onSubmit={handleSubmit}
            >
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
                                if (errors.newPassword) {
                                    setErrors(prev => ({ ...prev, newPassword: null }));
                                }
                            }}
                            placeholder="새 비밀번호를 입력하세요"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="mg-v2-form-input-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                        >
                            {showPassword ? (
                                <EyeOff size={18} aria-hidden />
                            ) : (
                                <Eye size={18} aria-hidden />
                            )}
                        </button>
                    </div>
                    {errors.newPassword && (
                        <span className="mg-v2-form-error" role="alert">
                            <AlertTriangle size={16} aria-hidden />
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
                                if (errors.confirmPassword) {
                                    setErrors(prev => ({ ...prev, confirmPassword: null }));
                                }
                            }}
                            placeholder="비밀번호를 다시 입력하세요"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="mg-v2-form-input-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                        >
                            {showPassword ? (
                                <EyeOff size={18} aria-hidden />
                            ) : (
                                <Eye size={18} aria-hidden />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <span className="mg-v2-form-error" role="alert">
                            <AlertTriangle size={16} aria-hidden />
                            {errors.confirmPassword}
                        </span>
                    )}
                </div>
            </form>
        </UnifiedModal>
    );
};

export default PasswordResetModal;
