import React, { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../../utils/ajax';
import './CommonCodeForm.css';

/**
 * 공통코드 폼 컴포넌트
 * - 공통코드 생성/수정을 위한 모달 폼
 * - 유효성 검사 및 에러 처리 포함
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeForm = ({ code, codeGroups, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        codeGroup: '',
        codeValue: '',
        codeLabel: '',
        codeDescription: '',
        sortOrder: 0,
        isActive: true,
        parentCodeGroup: '',
        parentCodeValue: '',
        extraData: ''
    });
    
    // 패키지 전용 필드 (CONSULTATION_PACKAGE 그룹일 때만 사용)
    const [packageSessions, setPackageSessions] = useState(20);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 공통 코드 그룹 옵션 상태
    const [commonCodeGroupOptions, setCommonCodeGroupOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);

    // 공통 코드 그룹 로드
    const loadCommonCodeGroupOptions = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/COMMON_CODE_GROUP');
            if (response && response.length > 0) {
                setCommonCodeGroupOptions(response.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    icon: code.icon,
                    color: code.colorCode,
                    description: code.description
                })));
            }
        } catch (error) {
            console.error('공통 코드 그룹 옵션 로드 실패:', error);
            // 실패 시 기본값 설정
            setCommonCodeGroupOptions([
                { value: 'PACKAGE_TYPE', label: '패키지 유형', icon: '📦', color: '#3b82f6', description: '상담 패키지 유형' },
                { value: 'PAYMENT_METHOD', label: '결제 방법', icon: '💳', color: '#10b981', description: '결제 수단' },
                { value: 'RESPONSIBILITY', label: '책임', icon: '👤', color: '#f59e0b', description: '책임 및 역할' },
                { value: 'CONSULTATION_TYPE', label: '상담 유형', icon: '💬', color: '#8b5cf6', description: '상담의 유형' },
                { value: 'GENDER', label: '성별', icon: '⚧', color: '#ef4444', description: '사용자 성별' },
                { value: 'ROLE', label: '역할', icon: '👑', color: '#06b6d4', description: '사용자 역할' },
                { value: 'STATUS', label: '상태', icon: '🔄', color: '#f97316', description: '일반적인 상태' },
                { value: 'PRIORITY', label: '우선순위', icon: '⚡', color: '#dc2626', description: '우선순위 구분' },
                { value: 'NOTIFICATION_TYPE', label: '알림 유형', icon: '🔔', color: '#7c3aed', description: '알림의 유형' },
                { value: 'STATUS', label: '일정 상태', icon: '📅', color: '#059669', description: '일정의 상태' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    // 편집 모드일 때 기존 데이터 로드
    useEffect(() => {
        if (code) {
            setFormData({
                codeGroup: code.codeGroup || '',
                codeValue: code.codeValue || '',
                codeLabel: code.codeLabel || '',
                codeDescription: code.codeDescription || '',
                sortOrder: code.sortOrder || 0,
                isActive: code.isActive !== undefined ? code.isActive : true,
                parentCodeGroup: code.parentCodeGroup || '',
                parentCodeValue: code.parentCodeValue || '',
                extraData: code.extraData || ''
            });
            
            // CONSULTATION_PACKAGE 그룹일 때 회기 수 파싱
            if (code.codeGroup === 'CONSULTATION_PACKAGE' && code.extraData) {
                try {
                    const extraData = JSON.parse(code.extraData);
                    setPackageSessions(extraData.sessions || 20);
                } catch (e) {
                    console.warn('extraData 파싱 실패:', e);
                    setPackageSessions(20);
                }
            }
        }
    }, [code]);

    // 공통 코드 그룹 옵션 로드
    useEffect(() => {
        loadCommonCodeGroupOptions();
    }, [loadCommonCodeGroupOptions]);

    // 폼 데이터 변경 핸들러
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // 에러 클리어
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 유효성 검사
    const validateForm = () => {
        const newErrors = {};

        if (!formData.codeGroup.trim()) {
            newErrors.codeGroup = '코드 그룹을 입력해주세요.';
        }

        if (!formData.codeValue.trim()) {
            newErrors.codeValue = '코드 값을 입력해주세요.';
        } else if (!/^[A-Z0-9_]+$/.test(formData.codeValue)) {
            newErrors.codeValue = '코드 값은 대문자, 숫자, 언더스코어만 사용할 수 있습니다.';
        }

        if (!formData.codeLabel.trim()) {
            newErrors.codeLabel = '코드 라벨을 입력해주세요.';
        }

        if (formData.sortOrder < 0) {
            newErrors.sortOrder = '정렬 순서는 0 이상이어야 합니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 폼 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // CONSULTATION_PACKAGE 그룹일 때 회기 수를 extraData에 포함
            let submitData = { ...formData };
            if (formData.codeGroup === 'CONSULTATION_PACKAGE') {
                submitData.extraData = JSON.stringify({ sessions: packageSessions });
            }
            
            await onSubmit(submitData);
        } catch (error) {
            console.error('폼 제출 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="common-code-form-overlay">
            <div className="common-code-form-modal">
                <div className="form-header">
                    <h3>{code ? '공통코드 수정' : '새 공통코드 추가'}</h3>
                    <button 
                        className="close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        <i className="bi bi-x"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="common-code-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codeGroup">
                                코드 그룹 <span className="required">*</span>
                            </label>
                            <select
                                id="codeGroup"
                                name="codeGroup"
                                value={formData.codeGroup}
                                onChange={handleChange}
                                className={`form-select ${errors.codeGroup ? 'is-invalid' : ''}`}
                                required
                            >
                                <option value="">코드 그룹을 선택하세요</option>
                                {loadingCodes ? (
                                    <option disabled>코드 그룹을 불러오는 중...</option>
                                ) : (
                                    <>
                                        {commonCodeGroupOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.icon} {option.label}
                                            </option>
                                        ))}
                                        {codeGroups.filter(group => !commonCodeGroupOptions.some(opt => opt.value === group)).map(group => (
                                            <option key={group} value={group}>
                                                {group}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            {errors.codeGroup && (
                                <div className="invalid-feedback">
                                    {errors.codeGroup}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="codeValue">
                                코드 값 <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="codeValue"
                                name="codeValue"
                                value={formData.codeValue}
                                onChange={handleChange}
                                className={`form-control ${errors.codeValue ? 'is-invalid' : ''}`}
                                placeholder="예: BASIC_10, CARD, MENTAL_HEALTH"
                                required
                            />
                            {errors.codeValue && (
                                <div className="invalid-feedback">
                                    {errors.codeValue}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="codeLabel">
                            코드 라벨 <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="codeLabel"
                            name="codeLabel"
                            value={formData.codeLabel}
                            onChange={handleChange}
                            className={`form-control ${errors.codeLabel ? 'is-invalid' : ''}`}
                            placeholder="예: 기본 10회기 패키지, 신용카드, 정신건강 상담"
                            required
                        />
                        {errors.codeLabel && (
                            <div className="invalid-feedback">
                                {errors.codeLabel}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="codeDescription">설명</label>
                        <textarea
                            id="codeDescription"
                            name="codeDescription"
                            value={formData.codeDescription}
                            onChange={handleChange}
                            className="form-control"
                            rows="3"
                            placeholder="코드에 대한 상세 설명을 입력하세요"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sortOrder">정렬 순서</label>
                            <input
                                type="number"
                                id="sortOrder"
                                name="sortOrder"
                                value={formData.sortOrder}
                                onChange={handleChange}
                                className={`form-control ${errors.sortOrder ? 'is-invalid' : ''}`}
                                min="0"
                            />
                            {errors.sortOrder && (
                                <div className="invalid-feedback">
                                    {errors.sortOrder}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                />
                                <span className="checkmark"></span>
                                활성 상태
                            </label>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="parentCodeGroup">상위 코드 그룹</label>
                            <input
                                type="text"
                                id="parentCodeGroup"
                                name="parentCodeGroup"
                                value={formData.parentCodeGroup}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="계층 구조용 상위 그룹"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="parentCodeValue">상위 코드 값</label>
                            <input
                                type="text"
                                id="parentCodeValue"
                                name="parentCodeValue"
                                value={formData.parentCodeValue}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="계층 구조용 상위 값"
                            />
                        </div>
                    </div>

                    {/* CONSULTATION_PACKAGE 그룹일 때 회기 수 입력 필드 */}
                    {formData.codeGroup === 'CONSULTATION_PACKAGE' && (
                        <div className="form-group">
                            <label htmlFor="packageSessions">회기 수</label>
                            <input
                                type="number"
                                id="packageSessions"
                                value={packageSessions}
                                onChange={(e) => setPackageSessions(parseInt(e.target.value) || 20)}
                                className="form-control"
                                min="1"
                                max="100"
                                placeholder="20"
                            />
                            <small className="form-text text-muted">
                                패키지에 포함된 상담 회기 수를 입력하세요.
                            </small>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="extraData">추가 데이터 (JSON)</label>
                        <textarea
                            id="extraData"
                            name="extraData"
                            value={formData.extraData}
                            onChange={handleChange}
                            className="form-control"
                            rows="2"
                            placeholder='{"sessions": 10, "price": 500000}'
                            disabled={formData.codeGroup === 'CONSULTATION_PACKAGE'}
                        />
                        {formData.codeGroup === 'CONSULTATION_PACKAGE' && (
                            <small className="form-text text-muted">
                                패키지 그룹의 경우 회기 수 필드를 사용하세요.
                            </small>
                        )}
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '처리 중...' : (code ? '수정' : '생성')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommonCodeForm;
