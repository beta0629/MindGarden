import React, { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import MGButton from '../../common/MGButton';
import ProfileImageInput from '../../common/ProfileImageInput';
import { apiGet } from '../../../utils/ajax';
import UnifiedModal from '../../common/modals/UnifiedModal';

/**
 * 내담자 모달 컴포넌트
 */
const ClientModal = ({
    type,
    client,
    formData,
    setFormData,
    onClose,
    onSave,
    userStatusOptions
}) => {
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 이메일 입력 시 중복 확인 상태 초기화
        if (name === 'email') {
            setEmailCheckStatus(null);
        }
    };
    
    const handleEmailDuplicateCheck = async () => {
        const email = formData.email?.trim();
        if (!email) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '이메일을 입력해주세요.', type: 'warning' }
            }));
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '올바른 이메일 형식을 입력해주세요.', type: 'warning' }
            }));
            return;
        }
        
        setIsCheckingEmail(true);
        setEmailCheckStatus('checking');
        
        try {
            const response = await apiGet(`/api/v1/admin/duplicate-check/email?email=${encodeURIComponent(email)}`);
            console.log('📧 이메일 중복 확인 응답:', response);
            
            if (response && typeof response.isDuplicate === 'boolean') {
                if (response.isDuplicate) {
                    setEmailCheckStatus('duplicate');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '이미 사용 중인 이메일입니다.', type: 'error' }
                    }));
                } else {
                    setEmailCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: '사용 가능한 이메일입니다.', type: 'success' }
                    }));
                }
            } else {
                setEmailCheckStatus(null);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: '이메일 중복 확인 중 오류가 발생했습니다.', type: 'error' }
                }));
            }
        } catch (error) {
            console.error('❌ 이메일 중복 확인 오류:', error);
            setEmailCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: '이메일 중복 확인 중 오류가 발생했습니다.', type: 'error' }
            }));
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const getTitle = () => {
        switch (type) {
            case 'create': return '새 내담자 등록';
            case 'edit': return '내담자 정보 수정';
            case 'delete': return '내담자 삭제';
            default: return '내담자 관리';
        }
    };

    const getSubmitText = () => {
        switch (type) {
            case 'create': return '등록';
            case 'edit': return '수정';
            case 'delete': return '삭제';
            default: return '저장';
        }
    };

    const renderDeleteContent = () => (
        <div className="mg-v2-modal-content">
            <div className="mg-v2-delete-confirmation">
                <h3>정말로 삭제하시겠습니까?</h3>
                <p>다음 내담자의 정보가 영구적으로 삭제됩니다:</p>
                <div className="mg-v2-client-info">
                    <p><strong>이름:</strong> {client?.name}</p>
                    <p><strong>이메일:</strong> {client?.email}</p>
                    <p><strong>전화번호:</strong> {client?.phone}</p>
                </div>
                <p className="mg-v2-warning-text">
                    ⚠️ 이 작업은 되돌릴 수 없습니다.
                </p>
            </div>
        </div>
    );

    const renderFormContent = () => {
        const safeFormData = {
            name: formData.name || '',
            email: formData.email || '',
            password: formData.password || '',
            phone: formData.phone || '',
            status: formData.status || 'ACTIVE',
            grade: formData.grade || 'BRONZE',
            notes: formData.notes || '',
            profileImageUrl: formData.profileImageUrl || ''
        };

        return (
            <form onSubmit={handleSubmit} className="mg-v2-form">
                {type === 'create' && (
                    <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                        <p className="mg-v2-info-text">
                            💡 비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.
                        </p>
                    </div>
                )}
                <ProfileImageInput
                    value={formData.profileImageUrl || ''}
                    onChange={(url) => setFormData(prev => ({ ...prev, profileImageUrl: url || '' }))}
                    maxBytes={2 * 1024 * 1024}
                    cropSize={400}
                    maxSize={512}
                    quality={0.85}
                    helpText="이미지 파일만 가능, 최대 2MB (리사이즈·크롭 적용)"
                />
                <div className="mg-v2-form-group">
                    <label htmlFor="name" className="mg-v2-form-label">이름 {type === 'create' && '*'}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={safeFormData.name}
                        onChange={handleInputChange}
                        required={type === 'create'}
                        placeholder="내담자 이름"
                        className="mg-v2-form-input"
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="email" className="mg-v2-form-label">이메일 *</label>
                    <div className="mg-v2-form-email-row">
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={safeFormData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="example@email.com"
                            className="mg-v2-form-input"
                            disabled={type === 'edit'}
                        />
                        {type === 'create' && (
                            <button
                                type="button"
                                onClick={handleEmailDuplicateCheck}
                                disabled={isCheckingEmail || !safeFormData.email?.trim()}
                                className="mg-v2-button mg-v2-button-secondary"
                            >
                                {isCheckingEmail ? '확인 중...' : '중복확인'}
                            </button>
                        )}
                    </div>
                    {type === 'edit' && (
                        <small className="mg-v2-form-help">이메일은 변경할 수 없습니다.</small>
                    )}
                    {type === 'create' && emailCheckStatus === 'duplicate' && (
                        <small className="mg-v2-form-help mg-v2-form-help--error">⚠️ 이미 사용 중인 이메일입니다.</small>
                    )}
                    {type === 'create' && emailCheckStatus === 'available' && (
                        <small className="mg-v2-form-help mg-v2-form-help--success">✅ 사용 가능한 이메일입니다.</small>
                    )}
                </div>
                {type === 'create' && (
                    <div className="mg-v2-form-group">
                        <label htmlFor="password" className="mg-v2-form-label">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={safeFormData.password}
                            onChange={handleInputChange}
                            placeholder="비밀번호를 입력하지 않으면 자동 생성됩니다"
                            className="mg-v2-form-input"
                        />
                        <small className="mg-v2-form-help">비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.</small>
                    </div>
                )}
                <div className="mg-v2-form-group">
                    <label htmlFor="phone" className="mg-v2-form-label">전화번호</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={safeFormData.phone}
                        onChange={handleInputChange}
                        placeholder="010-1234-5678"
                        className="mg-v2-form-input"
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="status" className="mg-v2-form-label">상태</label>
                    <select
                        id="status"
                        name="status"
                        value={safeFormData.status}
                        onChange={handleInputChange}
                        className="mg-v2-form-select"
                    >
                        {userStatusOptions && userStatusOptions.length > 0 ? (
                            userStatusOptions.map(option => (
                                <option key={option.codeValue || option.code} value={option.codeValue || option.code}>
                                    {option.codeLabel || option.name || option.codeValue || option.code}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value="ACTIVE">활성</option>
                                <option value="INACTIVE">비활성</option>
                                <option value="PENDING">대기</option>
                            </>
                        )}
                    </select>
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="grade" className="mg-v2-form-label">등급</label>
                    <select
                        id="grade"
                        name="grade"
                        value={safeFormData.grade}
                        onChange={handleInputChange}
                        className="mg-v2-form-select"
                    >
                        <option value="BRONZE">브론즈</option>
                        <option value="SILVER">실버</option>
                        <option value="GOLD">골드</option>
                        <option value="PLATINUM">플래티넘</option>
                        <option value="DIAMOND">다이아몬드</option>
                    </select>
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="notes" className="mg-v2-form-label">메모</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={safeFormData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="mg-v2-form-textarea"
                    />
                </div>
            </form>
        );
    };

    if (!type) return null;

    return (
        <UnifiedModal
            isOpen={!!type}
            onClose={onClose}
            title={getTitle()}
            size="large"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            actions={
                <>
                    <MGButton
                        variant="secondary"
                        onClick={onClose}
                        preventDoubleClick={true}
                    >
                        취소
                    </MGButton>
                    <MGButton
                        variant={type === 'delete' ? 'danger' : 'primary'}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (type === 'delete') {
                                onSave(formData);
                            } else {
                                handleSubmit(e);
                            }
                        }}
                        preventDoubleClick={true}
                        clickDelay={1000}
                    >
                        {type === 'delete' ? (
                            <AlertTriangle size={18} />
                        ) : (
                            <CheckCircle size={18} />
                        )}
                        {getSubmitText()}
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-modal-body">
                {type === 'delete' ? renderDeleteContent() : renderFormContent()}
            </div>
        </UnifiedModal>
    );
};

export default ClientModal;
