import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { XCircle, User, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import MGButton from '../../common/MGButton';
import { apiGet } from '../../../utils/ajax';

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
            phone: formData.phone || '',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            status: formData.status || 'ACTIVE',
            grade: formData.grade || 'BRONZE',
            notes: formData.notes || ''
        };

        return (
            <form onSubmit={handleSubmit} className="mg-v2-form">
                {type === 'create' && (
                    <div className="mg-v2-info-box" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-background-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
                        <p className="mg-v2-info-text" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                            💡 이름과 이메일 주소를 입력하시면 됩니다. 아이디와 비밀번호는 자동으로 생성됩니다.
                        </p>
                    </div>
                )}
                
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={safeFormData.email}
                            onChange={handleInputChange}
                            required
                            placeholder="example@email.com"
                            className="mg-v2-form-input"
                            style={{ flex: 1 }}
                            disabled={type === 'edit'} // 수정 시에는 이메일 변경 불가
                        />
                        {type === 'create' && (
                            <button
                                type="button"
                                onClick={handleEmailDuplicateCheck}
                                disabled={isCheckingEmail || !safeFormData.email?.trim()}
                                className="mg-v2-button mg-v2-button-secondary"
                                style={{ 
                                    whiteSpace: 'nowrap',
                                    minWidth: '100px',
                                    opacity: (isCheckingEmail || !safeFormData.email?.trim()) ? 0.6 : 1,
                                    cursor: (isCheckingEmail || !safeFormData.email?.trim()) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isCheckingEmail ? '확인 중...' : '중복확인'}
                            </button>
                        )}
                    </div>
                    {type === 'edit' && (
                        <small className="mg-v2-form-help">이메일은 변경할 수 없습니다.</small>
                    )}
                    {type === 'create' && emailCheckStatus === 'duplicate' && (
                        <small className="mg-v2-form-help" style={{ color: 'var(--color-error)' }}>
                            ⚠️ 이미 사용 중인 이메일입니다.
                        </small>
                    )}
                    {type === 'create' && emailCheckStatus === 'available' && (
                        <small className="mg-v2-form-help" style={{ color: 'var(--color-success)' }}>
                            ✅ 사용 가능한 이메일입니다.
                        </small>
                    )}
                </div>
                
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
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                <option value="ACTIVE">활성</option>
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                <option value="INACTIVE">비활성</option>
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
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

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={onClose}>
            <div className="mg-v2-modal" onClick={(e) => e.stopPropagation()}>
                <div className="mg-v2-modal-header">
                    <h3 className="mg-v2-modal-title">
                        <User size={24} />
                        {getTitle()}
                    </h3>
                    <button
                        onClick={onClose}
                        className="mg-v2-modal-close"
                        aria-label="닫기"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    {type === 'delete' ? renderDeleteContent() : renderFormContent()}
                </div>

                <div className="mg-v2-modal-footer">
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
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default ClientModal;
