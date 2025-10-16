import React, { useState, useEffect } from 'react';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import './MappingEditModal.css';

/**
 * 매칭 수정 모달 컴포넌트
 * - 매칭의 패키지명, 가격, 총 회기 수를 수정할 수 있음
 * - ERP 연동을 통한 자동 업데이트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingEditModal = ({ isOpen, onClose, mapping, onSuccess }) => {
    const [formData, setFormData] = useState({
        packageName: '',
        packagePrice: '',
        totalSessions: ''
    });
    const [packageOptions, setPackageOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 매칭 데이터가 변경될 때 폼 초기화
    useEffect(() => {
        if (mapping && isOpen) {
            setFormData({
                packageName: mapping.packageName || '',
                packagePrice: mapping.packagePrice || '',
                totalSessions: mapping.totalSessions || ''
            });
            setErrors({});
        }
    }, [mapping, isOpen]);

    // 패키지 옵션 로드
    useEffect(() => {
        if (isOpen) {
            loadPackageOptions();
        }
    }, [isOpen]);

    /**
     * 패키지 옵션 로드
     */
    const loadPackageOptions = async () => {
        try {
            console.log('🔍 패키지 옵션 로드 시작');
            const codes = await getCommonCodes('CONSULTATION_PACKAGE');
            console.log('📋 로드된 패키지 옵션:', codes);
            
            const options = codes.map(code => ({
                value: code.codeValue,
                label: code.koreanName || code.codeLabel,
                sessions: getSessionCount(code.codeValue),
                price: getPackagePrice(code.codeValue)
            }));
            
            setPackageOptions(options);
            console.log('✅ 패키지 옵션 설정 완료:', options);
        } catch (error) {
            console.error('❌ 패키지 옵션 로드 실패:', error);
            notificationManager.show('패키지 옵션을 불러오는데 실패했습니다.', 'error');
        }
    };

    /**
     * 패키지 코드에서 회기 수 추출
     */
    const getSessionCount = (codeValue) => {
        if (codeValue === 'BASIC' || codeValue === 'STANDARD' || 
            codeValue === 'PREMIUM' || codeValue === 'VIP') {
            return 20;
        } else if (codeValue.startsWith('SINGLE_')) {
            return 1;
        }
        return 20; // 기본값
    };

    /**
     * 패키지 코드에서 가격 추출
     */
    const getPackagePrice = (codeValue) => {
        const priceMap = {
            'BASIC': 200000,
            'STANDARD': 400000,
            'PREMIUM': 600000,
            'VIP': 1000000
        };

        if (priceMap[codeValue]) {
            return priceMap[codeValue];
        } else if (codeValue.startsWith('SINGLE_')) {
            const priceStr = codeValue.replace('SINGLE_', '');
            const price = parseInt(priceStr, 10);
            return isNaN(price) ? 30000 : price;
        }
        return 200000; // 기본값
    };

    /**
     * 폼 데이터 변경 처리
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 에러 초기화
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // 패키지 선택 시 자동으로 가격과 회기 수 설정
        if (name === 'packageName') {
            const selectedPackage = packageOptions.find(pkg => pkg.value === value);
            if (selectedPackage) {
                setFormData(prev => ({
                    ...prev,
                    packagePrice: selectedPackage.price,
                    totalSessions: selectedPackage.sessions
                }));
            }
        }
    };

    /**
     * 폼 유효성 검사
     */
    const validateForm = () => {
        const newErrors = {};

        // 패키지 선택 검사만 수행 (가격과 회기 수는 자동 설정되므로)
        if (!formData.packageName.trim()) {
            newErrors.packageName = '패키지를 선택해주세요.';
        }

        // 패키지가 선택되었는지 확인
        if (formData.packageName && (!formData.packagePrice || !formData.totalSessions)) {
            newErrors.packageName = '패키지 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * 매칭 수정 처리
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            console.log('🔄 매칭 수정 요청:', {
                mappingId: mapping.id,
                formData
            });

            // PUT 요청으로 매칭 수정 (백엔드의 @PutMapping("/mappings/{id}") 엔드포인트 사용)
            const response = await fetch(`/api/admin/mappings/${mapping.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    packageName: formData.packageName,
                    packagePrice: parseFloat(formData.packagePrice),
                    totalSessions: parseInt(formData.totalSessions)
                })
            });

            const result = await response.json();

            if (result.success) {
                notificationManager.show(result.message || '매칭 정보가 성공적으로 수정되었습니다.', 'success');
                onSuccess && onSuccess(result.data);
                onClose();
            } else {
                notificationManager.show(result.message || '매칭 수정에 실패했습니다.', 'error');
            }

        } catch (error) {
            console.error('❌ 매칭 수정 실패:', error);
            notificationManager.show('매칭 수정 중 오류가 발생했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        if (!loading) {
            setFormData({
                packageName: '',
                packagePrice: '',
                totalSessions: ''
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen || !mapping) {
        return null;
    }

    return (
        <div className="mapping-edit-modal-overlay">
            <div className="mapping-edit-modal">
                <div className="mapping-edit-modal-header">
                    <h2>매칭 정보 수정</h2>
                    <button 
                        className="close-btn" 
                        onClick={handleClose}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                <div className="mapping-edit-modal-body">
                    {/* 매칭 정보 표시 */}
                    <div className="mapping-info-display">
                        <div className="info-row">
                            <span className="label">상담사:</span>
                            <span className="value">{mapping.consultantName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">내담자:</span>
                            <span className="value">{mapping.clientName}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">현재 상태:</span>
                            <span className="value">{mapping.status}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 패키지 선택 */}
                        <div className="form-group">
                            <label htmlFor="packageName">패키지 *</label>
                            <select
                                id="packageName"
                                name="packageName"
                                value={formData.packageName}
                                onChange={handleInputChange}
                                className={errors.packageName ? 'error' : ''}
                                disabled={loading}
                            >
                                <option value="">패키지를 선택해주세요</option>
                                {packageOptions.map(pkg => (
                                    <option key={pkg.value} value={pkg.value}>
                                        {pkg.label} ({pkg.sessions}회기, {pkg.price.toLocaleString()}원)
                                    </option>
                                ))}
                            </select>
                            {errors.packageName && (
                                <span className="error-message">{errors.packageName}</span>
                            )}
                        </div>

                        {/* 패키지 가격 (읽기 전용) */}
                        <div className="form-group">
                            <label htmlFor="packagePrice">패키지 가격 *</label>
                            <div className="price-display-wrapper">
                                <input
                                    type="text"
                                    id="packagePrice"
                                    name="packagePrice"
                                    value={formData.packagePrice ? formData.packagePrice.toLocaleString() : ''}
                                    className="readonly-input"
                                    disabled={true}
                                    readOnly
                                />
                                <span className="currency">원</span>
                            </div>
                            <div className="field-description">
                                패키지 선택 시 자동으로 설정됩니다
                            </div>
                        </div>

                        {/* 총 회기 수 (읽기 전용) */}
                        <div className="form-group">
                            <label htmlFor="totalSessions">총 회기 수 *</label>
                            <div className="sessions-display-wrapper">
                                <input
                                    type="text"
                                    id="totalSessions"
                                    name="totalSessions"
                                    value={formData.totalSessions || ''}
                                    className="readonly-input"
                                    disabled={true}
                                    readOnly
                                />
                                <span className="unit">회기</span>
                            </div>
                            <div className="field-description">
                                패키지 선택 시 자동으로 설정됩니다
                            </div>
                        </div>

                        {/* 주의사항 */}
                        <div className="warning-box">
                            <div className="warning-icon">⚠️</div>
                            <div className="warning-content">
                                <strong>주의사항:</strong>
                                <ul>
                                    <li>매칭 정보 수정 시 ERP 시스템의 모든 관련 데이터가 자동으로 업데이트됩니다.</li>
                                    <li>회기 수 변경 시 남은 회기 수와 사용된 회기 수가 재계산됩니다.</li>
                                    <li>가격 변경 시 회계 데이터가 자동으로 반영됩니다.</li>
                                </ul>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mapping-edit-modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '수정 중...' : '수정 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MappingEditModal;
