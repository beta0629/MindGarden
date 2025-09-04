import React, { useState, useEffect } from 'react';
import { FaTimes, FaEnvelope, FaKey, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './AccountIntegrationModal.css';

/**
 * 계정 통합 모달 컴포넌트
 * SNS 계정과 기존 계정을 통합하는 기능을 제공
 */
const AccountIntegrationModal = ({ 
    isOpen, 
    onClose, 
    socialUserInfo, 
    onIntegrationSuccess 
}) => {
    const [step, setStep] = useState(1); // 1: 이메일 입력, 2: 인증 코드, 3: 비밀번호 확인, 4: 완료
    const [formData, setFormData] = useState({
        existingEmail: '',
        existingPassword: '',
        verificationCode: '',
        finalEmail: '',
        finalName: '',
        finalNickname: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // 소셜 사용자 정보로 초기값 설정
    useEffect(() => {
        if (socialUserInfo && isOpen) {
            setFormData(prev => ({
                ...prev,
                finalEmail: socialUserInfo.email || '',
                finalName: socialUserInfo.name || '',
                finalNickname: socialUserInfo.nickname || ''
            }));
        }
    }, [socialUserInfo, isOpen]);

    // 카운트다운 타이머
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendVerificationCode = async () => {
        if (!formData.existingEmail) {
            notificationManager.showToast('이메일을 입력해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiPost('/api/account-integration/send-verification-code', null, {
                email: formData.existingEmail
            });

            if (response.success) {
                setCodeSent(true);
                setCountdown(600); // 10분
                notificationManager.showToast('인증 코드가 발송되었습니다.', 'success');
                setStep(2);
            } else {
                notificationManager.showToast(response.message || '인증 코드 발송에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('인증 코드 발송 실패:', error);
            notificationManager.showToast('인증 코드 발송 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.verificationCode) {
            notificationManager.showToast('인증 코드를 입력해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiPost('/api/account-integration/verify-code', null, {
                email: formData.existingEmail,
                code: formData.verificationCode
            });

            if (response.success) {
                notificationManager.showToast('인증 코드가 확인되었습니다.', 'success');
                setStep(3);
            } else {
                notificationManager.showToast(response.message || '인증 코드가 올바르지 않습니다.', 'error');
            }
        } catch (error) {
            console.error('인증 코드 검증 실패:', error);
            notificationManager.showToast('인증 코드 검증 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIntegrateAccounts = async () => {
        if (!formData.existingPassword) {
            notificationManager.showToast('기존 계정 비밀번호를 입력해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const requestData = {
                existingEmail: formData.existingEmail,
                existingPassword: formData.existingPassword,
                verificationCode: formData.verificationCode,
                provider: socialUserInfo.provider,
                providerUserId: socialUserInfo.providerUserId,
                socialEmail: socialUserInfo.email,
                finalEmail: formData.finalEmail,
                finalName: formData.finalName,
                finalNickname: formData.finalNickname
            };

            const response = await apiPost('/api/account-integration/integrate', requestData);

            if (response.success) {
                notificationManager.showToast('계정 통합이 완료되었습니다!', 'success');
                setStep(4);
                
                // 통합 성공 후 콜백 호출
                if (onIntegrationSuccess) {
                    onIntegrationSuccess(response);
                }
            } else {
                notificationManager.showToast(response.message || '계정 통합에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('계정 통합 실패:', error);
            notificationManager.showToast('계정 통합 중 오류가 발생했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setFormData({
            existingEmail: '',
            existingPassword: '',
            verificationCode: '',
            finalEmail: '',
            finalName: '',
            finalNickname: ''
        });
        setCodeSent(false);
        setCountdown(0);
        onClose();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="account-integration-modal-overlay">
            <div className="account-integration-modal">
                <div className="account-integration-modal-header">
                    <h3>
                        {step === 1 && '🔗 계정 통합'}
                        {step === 2 && '📧 이메일 인증'}
                        {step === 3 && '🔐 비밀번호 확인'}
                        {step === 4 && '✅ 통합 완료'}
                    </h3>
                    <button className="account-integration-modal-close" onClick={handleClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="account-integration-modal-body">
                    {step === 1 && (
                        <div className="integration-step">
                            <div className="step-description">
                                <FaExclamationTriangle className="warning-icon" />
                                <p>
                                    <strong>{socialUserInfo?.provider}</strong> 계정으로 로그인하려고 하는데, 
                                    기존 계정과 연결하시겠습니까?
                                </p>
                                <p className="sub-description">
                                    기존 계정의 이메일을 입력하면 인증을 통해 계정을 통합할 수 있습니다.
                                </p>
                            </div>

                            <div className="social-info">
                                <h4>소셜 계정 정보</h4>
                                <div className="info-item">
                                    <span className="label">이메일:</span>
                                    <span className="value">{socialUserInfo?.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">이름:</span>
                                    <span className="value">{socialUserInfo?.name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">닉네임:</span>
                                    <span className="value">{socialUserInfo?.nickname}</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="existingEmail">
                                    <FaEnvelope /> 기존 계정 이메일
                                </label>
                                <input
                                    type="email"
                                    id="existingEmail"
                                    name="existingEmail"
                                    value={formData.existingEmail}
                                    onChange={handleInputChange}
                                    placeholder="기존 계정의 이메일을 입력하세요"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleClose}
                                >
                                    취소
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleSendVerificationCode}
                                    disabled={isLoading || !formData.existingEmail}
                                >
                                    {isLoading ? '발송 중...' : '인증 코드 발송'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="integration-step">
                            <div className="step-description">
                                <FaEnvelope className="step-icon" />
                                <p>
                                    <strong>{formData.existingEmail}</strong>로 인증 코드를 발송했습니다.
                                </p>
                                <p className="sub-description">
                                    이메일을 확인하고 인증 코드를 입력해주세요.
                                </p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="verificationCode">
                                    <FaCheck /> 인증 코드
                                </label>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    name="verificationCode"
                                    value={formData.verificationCode}
                                    onChange={handleInputChange}
                                    placeholder="6자리 인증 코드를 입력하세요"
                                    maxLength="6"
                                    required
                                />
                                {countdown > 0 && (
                                    <small className="countdown">
                                        남은 시간: {formatTime(countdown)}
                                    </small>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setStep(1)}
                                >
                                    이전
                                </button>
                                <button 
                                    className="btn btn-link" 
                                    onClick={handleSendVerificationCode}
                                    disabled={countdown > 0}
                                >
                                    {countdown > 0 ? `재발송 (${formatTime(countdown)})` : '인증 코드 재발송'}
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleVerifyCode}
                                    disabled={isLoading || !formData.verificationCode}
                                >
                                    {isLoading ? '확인 중...' : '인증 확인'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="integration-step">
                            <div className="step-description">
                                <FaKey className="step-icon" />
                                <p>
                                    마지막으로 기존 계정의 비밀번호를 입력해주세요.
                                </p>
                                <p className="sub-description">
                                    보안을 위해 기존 계정의 비밀번호 확인이 필요합니다.
                                </p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="existingPassword">
                                    <FaKey /> 기존 계정 비밀번호
                                </label>
                                <input
                                    type="password"
                                    id="existingPassword"
                                    name="existingPassword"
                                    value={formData.existingPassword}
                                    onChange={handleInputChange}
                                    placeholder="기존 계정의 비밀번호를 입력하세요"
                                    required
                                />
                            </div>

                            <div className="final-info">
                                <h4>통합 후 정보</h4>
                                <div className="form-group">
                                    <label htmlFor="finalEmail">이메일</label>
                                    <input
                                        type="email"
                                        id="finalEmail"
                                        name="finalEmail"
                                        value={formData.finalEmail}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="finalName">이름</label>
                                    <input
                                        type="text"
                                        id="finalName"
                                        name="finalName"
                                        value={formData.finalName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="finalNickname">닉네임</label>
                                    <input
                                        type="text"
                                        id="finalNickname"
                                        name="finalNickname"
                                        value={formData.finalNickname}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setStep(2)}
                                >
                                    이전
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleIntegrateAccounts}
                                    disabled={isLoading || !formData.existingPassword}
                                >
                                    {isLoading ? '통합 중...' : '계정 통합'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="integration-step success-step">
                            <div className="success-icon">
                                <FaCheck />
                            </div>
                            <div className="success-message">
                                <h4>계정 통합이 완료되었습니다!</h4>
                                <p>
                                    이제 <strong>{socialUserInfo?.provider}</strong> 계정으로 
                                    기존 계정에 로그인할 수 있습니다.
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleClose}
                                >
                                    완료
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountIntegrationModal;
