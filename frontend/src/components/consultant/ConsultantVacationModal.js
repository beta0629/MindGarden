import React, { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import { apiGet } from '../../utils/ajax';
import { API_BASE_URL } from '../../constants/api';
import csrfTokenManager from '../../utils/csrfTokenManager';
import UnifiedModal from '../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import BadgeSelect from '../common/BadgeSelect';

/**
 * 상담사용 휴가 등록 모달
/**
 * - 자신의 휴가만 등록 가능
/**
 * - 관리자용 VacationManagementModal과 별도
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-10-27
 */
const ConsultantVacationModal = ({ 
    isOpen, 
    onClose, 
    selectedDate,
    consultantId,
    onVacationUpdated 
}) => {
    const [vacationData, setVacationData] = useState({
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        type: 'MORNING_HALF_DAY',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [vacationTypeOptions, setVacationTypeOptions] = useState([]);

    // selectedDate가 변경될 때 vacationData의 날짜 업데이트
    useEffect(() => {
        if (selectedDate) {
            setVacationData(prev => ({
                ...prev,
                date: selectedDate.toISOString().split('T')[0]
            }));
        }
    }, [selectedDate]);

    // 휴가 유형 코드 로드
    useEffect(() => {
        const loadVacationTypeCodes = async() => {
            try {
                const response = await apiGet('/api/v1/common-codes?codeGroup=VACATION_TYPE');
                if (response && response.length > 0) {
                    const allowedTypes = [
                        'MORNING_HALF_DAY',
                        'AFTERNOON_HALF_DAY',
                        'MORNING_HALF_1',
                        'MORNING_HALF_2',
                        'AFTERNOON_HALF_1',
                        'AFTERNOON_HALF_2',
                        'ALL_DAY'
                    ];
                    
                    const uniqueCodes = response.filter(code => 
                        allowedTypes.includes(code.codeValue)
                    );
                    
                    const sortedCodes = uniqueCodes.sort((a, b) => {
                        const order = allowedTypes.indexOf(a.codeValue) - allowedTypes.indexOf(b.codeValue);
                        return order;
                    });
                    
                    const options = sortedCodes.map(code => ({
                        value: code.codeValue,
                        label: code.codeLabel,
                        description: code.description
                    }));
                    setVacationTypeOptions(options);
                }
            } catch (error) {
                console.error('휴가 유형 코드 로드 실패:', error);
                setVacationTypeOptions([]);
            }
        };
        loadVacationTypeCodes();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setVacationData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async() => {
        if (!vacationData.reason.trim()) {
            notificationManager.error('휴가 사유를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                consultantId: consultantId,
                date: vacationData.date,
                type: vacationData.type,
                reason: vacationData.reason
            };

            console.log('🏖️ 휴가 등록 요청:', requestData);

            const response = await csrfTokenManager.post('/api/v1/consultant/vacation', requestData);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ 휴가 등록 성공:', result);
                notificationManager.success('휴가가 성공적으로 등록되었습니다.');
                onVacationUpdated?.();
                onClose();
            } else {
                const error = await response.json();
                console.error('❌ 휴가 등록 실패:', error);
                notificationManager.error(error.message || '휴가 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('휴가 등록 오류:', error);
            notificationManager.error('휴가 등록 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    if (!isOpen) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title="휴가 등록"
            subtitle={selectedDate ? formatDate(selectedDate) : ''}
            size="auto"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            loading={loading}
            actions={
                <>
                    <MGButton
                        variant="outline"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onClose}
                        disabled={loading}
                        preventDoubleClick={false}
                    >
                        취소
                    </MGButton>
                    <MGButton
                        variant="primary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleSubmit}
                        disabled={loading}
                        loading={loading}
                        preventDoubleClick={false}
                    >
                        휴가 등록
                    </MGButton>
                </>
            }
        >
                <div className="mg-v2-modal-body">
                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">
                            휴가 유형 <span className="mg-v2-form-label-required">*</span>
                        </label>
                        <BadgeSelect
                            className="mg-v2-form-badge-select"
                            value={vacationData.type}
                            onChange={(val) => setVacationData(prev => ({ ...prev, type: val }))}
                            options={vacationTypeOptions.map(option => ({
                                value: option.value,
                                label: option.label
                            }))}
                            placeholder="선택하세요"
                            disabled={loading}
                        />
                    </div>

                    <div className="mg-v2-form-group">
                        <label className="mg-v2-form-label">
                            휴가 사유 <span className="mg-v2-form-label-required">*</span>
                        </label>
                        <textarea
                            className="mg-v2-form-textarea"
                            name="reason"
                            value={vacationData.reason}
                            onChange={handleInputChange}
                            placeholder="휴가 사유를 입력해주세요"
                            rows="4"
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
        </UnifiedModal>
    );
};

export default ConsultantVacationModal;
