import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { XCircle, Lock, AlertTriangle } from 'lucide-react';
import MGButton from '../common/MGButton';

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
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validatePassword()) {
            onConfirm(newPassword);
        }
    };

    const userTypeLabel = userType === 'client' ? '내담자' : '상담사';
    const userName = user?.name || user?.email || '사용자';

    return ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={onClose}>
            <div className="mg-modal-content mg-modal-content--password-reset" onClick={(e) => e.stopPropagation()}>
                <div className="mg-modal-header">
                    <div className="mg-modal-header-content">
                        <Lock className="mg-modal-icon" size={24} />
                        <h2 className="mg-modal-title">비밀번호 초기화</h2>
                    </div>
                    <button
                        className="mg-modal-close"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-modal-body">
                    <div className="mg-password-reset-info">
                        <AlertTriangle className="mg-info-icon" size={20} />
                        <p>
                            <strong>{userName}</strong> {userTypeLabel}의 비밀번호를 초기화합니다.
                        </p>
                        <p className="mg-info-text">
                            새 비밀번호는 최소 8자 이상이며, 영문과 숫자를 포함해야 합니다.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mg-password-reset-form">
                        <div className="mg-form-group">
                            <label htmlFor="newPassword" className="mg-form-label">
                                새 비밀번호
                            </label>
                            <div className="mg-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    className={`mg-input ${errors.newPassword ? 'mg-input-error' : ''}`}
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
                                    className="mg-input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <span className="mg-form-error">{errors.newPassword}</span>
                            )}
                        </div>

                        <div className="mg-form-group">
                            <label htmlFor="confirmPassword" className="mg-form-label">
                                비밀번호 확인
                            </label>
                            <div className="mg-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    className={`mg-input ${errors.confirmPassword ? 'mg-input-error' : ''}`}
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
                            </div>
                            {errors.confirmPassword && (
                                <span className="mg-form-error">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <div className="mg-modal-footer">
                            <MGButton
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                preventDoubleClick={true}
                            >
                                취소
                            </MGButton>
                            <MGButton
                                type="submit"
                                variant="primary"
                                preventDoubleClick={true}
                            >
                                비밀번호 초기화
                            </MGButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PasswordResetModal;
