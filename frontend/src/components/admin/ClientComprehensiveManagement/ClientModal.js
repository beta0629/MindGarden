import React from 'react';
import MGButton from '../../common/MGButton';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { FaTimes } from 'react-icons/fa';

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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
        // formData의 모든 필드에 기본값 설정 (undefined 방지)
        const safeFormData = {
            username: formData.username || '',
            name: formData.name || '',
            email: formData.email || '',
            password: formData.password || '',
            phone: formData.phone || '',
            status: formData.status || 'ACTIVE',
            grade: formData.grade || 'BRONZE',
            notes: formData.notes || ''
        };

        return (
            <form onSubmit={handleSubmit} className="mg-v2-form">
                <div className="mg-v2-form-group">
                    <label htmlFor="username" className="mg-v2-form-label">아이디 *</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={safeFormData.username}
                        onChange={handleInputChange}
                        required
                        placeholder="로그인 아이디"
                        className="mg-v2-form-input"
                    />
                </div>
                
                <div className="mg-v2-form-group">
                    <label htmlFor="name" className="mg-v2-form-label">이름 *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={safeFormData.name}
                        onChange={handleInputChange}
                        required
                        className="mg-v2-form-input"
                    />
                </div>
                
                <div className="mg-v2-form-group">
                    <label htmlFor="email" className="mg-v2-form-label">이메일 *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={safeFormData.email}
                        onChange={handleInputChange}
                        required
                        className="mg-v2-form-input"
                    />
                </div>
                
                <div className="mg-v2-form-group">
                    <label htmlFor="password" className="mg-v2-form-label">비밀번호 *</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={safeFormData.password}
                        onChange={handleInputChange}
                        required={type === 'create'}
                        placeholder={type === 'edit' ? '변경 시에만 입력' : '로그인 비밀번호'}
                        className="mg-v2-form-input"
                    />
                </div>
                
                <div className="mg-v2-form-group">
                    <label htmlFor="phone" className="mg-v2-form-label">전화번호 *</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={safeFormData.phone}
                        onChange={handleInputChange}
                        required
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

    return (
        <UnifiedModal
            isOpen={true}
            onClose={onClose}
            title={getTitle()}
            size="medium"
        >
            {type === 'delete' ? renderDeleteContent() : renderFormContent()}
            
            <div className="mg-modal__actions">
                <MGButton
                    variant="outline"
                    onClick={onClose}
                >
                    취소
                </MGButton>
                <MGButton
                    variant={type === 'delete' ? 'danger' : 'primary'}
                    onClick={type === 'delete' ? () => onSave(formData) : handleSubmit}
                >
                    {getSubmitText()}
                </MGButton>
            </div>
        </UnifiedModal>
    );
};

export default ClientModal;
