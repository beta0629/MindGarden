import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Building, XCircle, Search, MapPin, Phone, Mail, Clock, Users, FileText, Save, Plus } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 지점 등록 모달 컴포넌트
 * - 새 지점 등록 기능
 * - 지점 정보 입력 폼
 * - 유효성 검사 및 등록 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-26
 */
const BranchRegistrationModal = ({ show, onHide, onBranchAdded }) => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        branchName: '',
        branchCode: '',
        branchType: 'FRANCHISE',
        address: '',
        addressDetail: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        websiteUrl: '',
        operatingStartTime: '09:00',
        operatingEndTime: '18:00',
        closedDays: [],
        maxConsultants: 10,
        maxClients: 100,
        description: ''
    });
    const [errors, setErrors] = useState({});

    // 카카오 주소 API 함수
    const openAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function(data) {
                    // 우편번호와 주소 정보를 해당 필드에 넣는다.
                    setFormData(prev => ({
                        ...prev,
                        postalCode: data.zonecode,
                        address: data.address,
                        addressDetail: ''
                    }));
                    
                    // 에러 메시지 제거
                    setErrors(prev => ({
                        ...prev,
                        postalCode: '',
                        address: ''
                    }));
                }
            }).open();
        } else {
            notificationManager.warning('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        }
    };

// 폼 데이터 변경 핸들러
const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
        const newClosedDays = checked 
            ? [...formData.closedDays, value]
            : formData.closedDays.filter(day => day !== value);
        setFormData(prev => ({ ...prev, closedDays: newClosedDays }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 에러 메시지 제거
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
    }
};

// 유효성 검사
const validateForm = () => {
    const newErrors = {};

    if (!formData.branchName.trim()) {
        newErrors.branchName = '지점명을 입력해주세요.';
    }

    if (!formData.branchCode.trim()) {
        newErrors.branchCode = '지점코드를 입력해주세요.';
    } else if (!/^[A-Z0-9_]+$/.test(formData.branchCode)) {
        newErrors.branchCode = '지점코드는 영문 대문자, 숫자, 언더스코어만 사용 가능합니다.';
    }

    if (!formData.address.trim()) {
        newErrors.address = '주소를 입력해주세요.';
    }

    // 우편번호 유효성 검사 (5자리 숫자)
    if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
        newErrors.postalCode = '우편번호는 5자리 숫자여야 합니다.';
    }

    if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = '전화번호를 입력해주세요.';
    } else if (!/^[0-9-]+$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = '올바른 전화번호 형식을 입력해주세요.';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (parseInt(formData.maxConsultants) < 1) {
        newErrors.maxConsultants = '최소 1명 이상이어야 합니다.';
    }

    if (parseInt(formData.maxClients) < 1) {
        newErrors.maxClients = '최소 1명 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

// 지점 등록 처리
const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    setLoading(true);
    try {
        const response = await apiPost('/api/hq/branches', {
            branchName: formData.branchName,
            branchCode: formData.branchCode,
            branchType: formData.branchType,
            address: formData.address,
            addressDetail: formData.addressDetail,
            postalCode: formData.postalCode,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            websiteUrl: formData.websiteUrl,
            operatingStartTime: formData.operatingStartTime,
            operatingEndTime: formData.operatingEndTime,
            closedDays: formData.closedDays.join(','),
            maxConsultants: parseInt(formData.maxConsultants),
            maxClients: parseInt(formData.maxClients),
            description: formData.description
        });

        notificationManager.success('지점이 성공적으로 등록되었습니다.');
        onBranchAdded(response.data);
        handleClose();
        
    } catch (error) {
        console.error('지점 등록 실패:', error);
        notificationManager.error('지점 등록에 실패했습니다.');
    } finally {
        setLoading(false);
    }
};

// 모달 닫기
const handleClose = () => {
    setFormData({
        branchName: '',
        branchCode: '',
        branchType: 'FRANCHISE',
        address: '',
        addressDetail: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        websiteUrl: '',
        operatingStartTime: '09:00',
        operatingEndTime: '18:00',
        closedDays: [],
        maxConsultants: 10,
        maxClients: 100,
        description: ''
    });
    setErrors({});
    onHide();
};

if (!show) return null;

const portalTarget = document.body || document.createElement('div');

return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onHide}>
        <div className="mg-v2-modal mg-v2-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="mg-v2-modal-header">
                <div className="mg-v2-modal-title-wrapper">
                    <Building size={28} className="mg-v2-modal-title-icon" />
                    <h2 className="mg-v2-modal-title">새 지점 등록</h2>
                </div>
                <button className="mg-v2-modal-close" onClick={handleClose} disabled={loading} aria-label="닫기">
                    <XCircle size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mg-v2-modal-body">
                    <div className="mg-v2-info-box mg-v2-mb-lg">
                        <Building size={20} className="mg-v2-section-title-icon" />
                        <p>새 지점을 등록합니다. 모든 필수 정보를 입력해주세요.</p>
                    </div>

                    {/* 기본 정보 */}
                    <div className="mg-v2-form-section">
                        <h3 className="mg-v2-section-title mg-v2-mb-md">기본 정보</h3>
                        
                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="branchName" className="mg-v2-form-label">
                                    지점명 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="branchName"
                                    name="branchName"
                                    value={formData.branchName}
                                    onChange={handleInputChange}
                                    placeholder="예: 강남점"
                                    className={`mg-v2-form-input ${errors.branchName ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.branchName && <span className="mg-v2-form-error">{errors.branchName}</span>}
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="branchCode" className="mg-v2-form-label">
                                    지점코드 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="branchCode"
                                    name="branchCode"
                                    value={formData.branchCode}
                                    onChange={handleInputChange}
                                    placeholder="예: GANGNAM"
                                    className={`mg-v2-form-input ${errors.branchCode ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.branchCode && <span className="mg-v2-form-error">{errors.branchCode}</span>}
                            </div>
                        </div>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="branchType" className="mg-v2-form-label">지점 유형</label>
                                <select
                                    id="branchType"
                                    name="branchType"
                                    value={formData.branchType}
                                    onChange={handleInputChange}
                                    className="mg-v2-form-select"
                                >
                                    <option value="FRANCHISE">가맹점</option>
                                    <option value="MAIN">본사</option>
                                    <option value="DIRECT">직영점</option>
                                    <option value="PARTNER">파트너</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 주소 정보 */}
                    <div className="mg-v2-form-section mg-v2-mt-lg">
                        <h3 className="mg-v2-section-title mg-v2-mb-md">
                            <MapPin size={20} className="mg-v2-section-title-icon" />
                            주소 정보
                        </h3>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group mg-v2-form-group--flex">
                                <label htmlFor="address" className="mg-v2-form-label">
                                    주소 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <div className="mg-v2-form-input-group">
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="예: 서울시 강남구 테헤란로 123"
                                        className={`mg-v2-form-input mg-v2-form-input--flex-1 ${errors.address ? 'mg-v2-form-input--error' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        className="mg-v2-btn mg-v2-btn--icon"
                                        onClick={openAddressSearch}
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                                {errors.address && <span className="mg-v2-form-error">{errors.address}</span>}
                            </div>
                        </div>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="addressDetail" className="mg-v2-form-label">상세주소</label>
                                <input
                                    type="text"
                                    id="addressDetail"
                                    name="addressDetail"
                                    value={formData.addressDetail}
                                    onChange={handleInputChange}
                                    placeholder="예: 456호"
                                    className="mg-v2-form-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 연락처 정보 */}
                    <div className="mg-v2-form-section mg-v2-mt-lg">
                        <h3 className="mg-v2-section-title mg-v2-mb-md">
                            <Phone size={20} className="mg-v2-section-title-icon" />
                            연락처 정보
                        </h3>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="phoneNumber" className="mg-v2-form-label">
                                    전화번호 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="예: 02-1234-5678"
                                    className={`mg-v2-form-input ${errors.phoneNumber ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.phoneNumber && <span className="mg-v2-form-error">{errors.phoneNumber}</span>}
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="email" className="mg-v2-form-label">
                                    <Mail size={16} className="mg-v2-form-label-icon" />
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="예: branch@mindgarden.com"
                                    className={`mg-v2-form-input ${errors.email ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.email && <span className="mg-v2-form-error">{errors.email}</span>}
                            </div>
                        </div>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="websiteUrl" className="mg-v2-form-label">웹사이트 URL</label>
                                <input
                                    type="url"
                                    id="websiteUrl"
                                    name="websiteUrl"
                                    value={formData.websiteUrl}
                                    onChange={handleInputChange}
                                    placeholder="예: https://branch.mindgarden.com"
                                    className="mg-v2-form-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 운영 정보 */}
                    <div className="mg-v2-form-section mg-v2-mt-lg">
                        <h3 className="mg-v2-section-title mg-v2-mb-md">
                            <Clock size={20} className="mg-v2-section-title-icon" />
                            운영 정보
                        </h3>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="operatingStartTime" className="mg-v2-form-label">운영 시작 시간</label>
                                <input
                                    type="time"
                                    id="operatingStartTime"
                                    name="operatingStartTime"
                                    value={formData.operatingStartTime}
                                    onChange={handleInputChange}
                                    className="mg-v2-form-input"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="operatingEndTime" className="mg-v2-form-label">운영 종료 시간</label>
                                <input
                                    type="time"
                                    id="operatingEndTime"
                                    name="operatingEndTime"
                                    value={formData.operatingEndTime}
                                    onChange={handleInputChange}
                                    className="mg-v2-form-input"
                                />
                            </div>
                        </div>

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-form-label">휴무일</label>
                            <div className="mg-v2-form-checkbox-group">
                                {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                                    <label key={day} className="mg-v2-form-checkbox">
                                        <input
                                            type="checkbox"
                                            value={day}
                                            checked={formData.closedDays.includes(day)}
                                            onChange={handleInputChange}
                                        />
                                        <span>{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 제한 정보 */}
                    <div className="mg-v2-form-section mg-v2-mt-lg">
                        <h3 className="mg-v2-section-title mg-v2-mb-md">
                            <Users size={20} className="mg-v2-section-title-icon" />
                            제한 정보
                        </h3>

                        <div className="mg-v2-form-row">
                            <div className="mg-v2-form-group">
                                <label htmlFor="maxConsultants" className="mg-v2-form-label">
                                    최대 상담사 수 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="maxConsultants"
                                    name="maxConsultants"
                                    value={formData.maxConsultants}
                                    onChange={handleInputChange}
                                    min="1"
                                    className={`mg-v2-form-input ${errors.maxConsultants ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.maxConsultants && <span className="mg-v2-form-error">{errors.maxConsultants}</span>}
                            </div>
                            <div className="mg-v2-form-group">
                                <label htmlFor="maxClients" className="mg-v2-form-label">
                                    최대 내담자 수 <span className="mg-v2-form-label-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="maxClients"
                                    name="maxClients"
                                    value={formData.maxClients}
                                    onChange={handleInputChange}
                                    min="1"
                                    className={`mg-v2-form-input ${errors.maxClients ? 'mg-v2-form-input--error' : ''}`}
                                />
                                {errors.maxClients && <span className="mg-v2-form-error">{errors.maxClients}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 설명 */}
                    <div className="mg-v2-form-section mg-v2-mt-lg">
                        <div className="mg-v2-form-group">
                            <label htmlFor="description" className="mg-v2-form-label">
                                <FileText size={16} className="mg-v2-form-label-icon" />
                                설명
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="지점에 대한 추가 설명을 입력해주세요."
                                className="mg-v2-form-textarea"
                            />
                        </div>
                    </div>
                </div>

                <div className="mg-v2-modal-footer">
                    <button 
                        type="button"
                        className="mg-v2-btn mg-v2-btn--secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        <XCircle size={20} className="mg-v2-icon-inline" />
                        취소
                    </button>
                    <button 
                        type="submit"
                        className="mg-v2-btn mg-v2-btn--primary"
                        disabled={loading}
                    >
                        {loading ? <UnifiedLoading variant="dots" size="small" type="inline" /> : (
                            <>
                                <Plus size={20} className="mg-v2-icon-inline" />
                                지점 등록
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>,
    portalTarget
);
};

export default BranchRegistrationModal;
