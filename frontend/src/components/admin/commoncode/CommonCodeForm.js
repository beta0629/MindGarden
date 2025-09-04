import React, { useState, useEffect } from 'react';
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
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        }
    }, [code]);

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
            await onSubmit(formData);
        } catch (error) {
            console.error('폼 제출 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 일반적인 코드 그룹 옵션들
    const commonCodeGroups = [
        'PACKAGE_TYPE',
        'PAYMENT_METHOD', 
        'RESPONSIBILITY',
        'USER_ROLE',
        'CONSULTATION_STATUS',
        'PAYMENT_STATUS',
        'MAPPING_STATUS'
    ];

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
                                {commonCodeGroups.map(group => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
                                {codeGroups.filter(group => !commonCodeGroups.includes(group)).map(group => (
                                    <option key={group} value={group}>
                                        {group}
                                    </option>
                                ))}
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
                        />
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
