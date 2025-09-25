import React, { useState, useEffect } from 'react';
import { apiGet, apiPut } from '../../utils/ajax';
import { showNotification } from '../../utils/notification';
import LoadingSpinner from '../common/LoadingSpinner';

/**
 * 급여 설정 관리 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 함수
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
const SalaryConfigModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        baseDateSettings: [],
        batchCycleSettings: [],
        calculationMethods: [],
        taxMethods: [],
        currentSettings: {}
    });
    
    const [formData, setFormData] = useState({
        baseDayType: 'LAST_DAY',
        paymentDay: 5,
        cutoffDayType: 'LAST_DAY',
        ratePerConsultation: 30000,
        defaultHourlyRate: 25000
    });

    // 급여 설정 조회
    const loadSalarySettings = async () => {
        if (!isOpen) return;
        
        setLoading(true);
        try {
            const response = await apiGet('/api/admin/salary-config/settings');
            if (response.success) {
                setSettings(response.data);
                
                // 현재 설정값으로 폼 초기화
                const currentSettings = response.data.currentSettings;
                if (currentSettings) {
                    setFormData(prev => ({
                        ...prev,
                        // 기본값 유지하되 필요시 업데이트
                    }));
                }
            } else {
                showNotification(response.message || '급여 설정 조회에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('급여 설정 조회 실패:', error);
            showNotification('급여 설정 조회에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여 기산일 설정 변경
    const updateBaseDate = async () => {
        setLoading(true);
        try {
            const response = await apiPut('/api/admin/salary-config/base-date', {
                baseDayType: formData.baseDayType,
                paymentDay: formData.paymentDay,
                cutoffDayType: formData.cutoffDayType
            });
            
            if (response.success) {
                showNotification('급여 기산일이 변경되었습니다.', 'success');
                loadSalarySettings(); // 설정 다시 로드
            } else {
                showNotification(response.message || '급여 기산일 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('급여 기산일 변경 실패:', error);
            showNotification('급여 기산일 변경에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 급여 계산 방식 설정 변경
    const updateCalculationMethod = async () => {
        setLoading(true);
        try {
            const response = await apiPut('/api/admin/salary-config/calculation-method', {
                methodCode: 'CONSULTATION_COUNT',
                ratePerConsultation: formData.ratePerConsultation,
                defaultHourlyRate: formData.defaultHourlyRate
            });
            
            if (response.success) {
                showNotification('급여 계산 방식이 변경되었습니다.', 'success');
                loadSalarySettings(); // 설정 다시 로드
            } else {
                showNotification(response.message || '급여 계산 방식 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('급여 계산 방식 변경 실패:', error);
            showNotification('급여 계산 방식 변경에 실패했습니다.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 입력값 변경 처리
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 설정 저장
    const handleSave = async () => {
        await updateBaseDate();
        await updateCalculationMethod();
    };

    useEffect(() => {
        loadSalarySettings();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={modalOverlayStyle}>
            <div className="modal-content" style={modalContentStyle}>
                <div className="modal-header" style={modalHeaderStyle}>
                    <h3 style={modalTitleStyle}>급여 설정 관리</h3>
                    <button 
                        onClick={onClose} 
                        style={closeButtonStyle}
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body" style={modalBodyStyle}>
                    {loading ? (
                        <LoadingSpinner />
                    ) : (
                        <div style={formContainerStyle}>
                            {/* 급여 기산일 설정 */}
                            <div style={sectionStyle}>
                                <h4 style={sectionTitleStyle}>급여 기산일 설정</h4>
                                
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>급여 계산 기준일:</label>
                                    <select
                                        value={formData.baseDayType}
                                        onChange={(e) => handleInputChange('baseDayType', e.target.value)}
                                        style={selectStyle}
                                    >
                                        <option value="LAST_DAY">매월 말일</option>
                                        <option value="25">매월 25일</option>
                                        <option value="20">매월 20일</option>
                                        <option value="15">매월 15일</option>
                                        <option value="10">매월 10일</option>
                                        <option value="5">매월 5일</option>
                                        <option value="1">매월 1일</option>
                                    </select>
                                </div>
                                
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>급여 지급일 (익월):</label>
                                    <select
                                        value={formData.paymentDay}
                                        onChange={(e) => handleInputChange('paymentDay', parseInt(e.target.value))}
                                        style={selectStyle}
                                    >
                                        <option value={1}>매월 1일</option>
                                        <option value={5}>매월 5일</option>
                                        <option value={10}>매월 10일</option>
                                        <option value={15}>매월 15일</option>
                                        <option value={20}>매월 20일</option>
                                        <option value={25}>매월 25일</option>
                                    </select>
                                </div>
                                
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>급여 마감일:</label>
                                    <select
                                        value={formData.cutoffDayType}
                                        onChange={(e) => handleInputChange('cutoffDayType', e.target.value)}
                                        style={selectStyle}
                                    >
                                        <option value="LAST_DAY">매월 말일</option>
                                        <option value="25">매월 25일</option>
                                        <option value="20">매월 20일</option>
                                        <option value="15">매월 15일</option>
                                        <option value="10">매월 10일</option>
                                        <option value="5">매월 5일</option>
                                        <option value="1">매월 1일</option>
                                    </select>
                                </div>
                            </div>

                            {/* 급여 계산 방식 설정 */}
                            <div style={sectionStyle}>
                                <h4 style={sectionTitleStyle}>급여 계산 방식 설정</h4>
                                
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>상담 건당 요율:</label>
                                    <div style={inputGroupStyle}>
                                        <input
                                            type="number"
                                            value={formData.ratePerConsultation}
                                            onChange={(e) => handleInputChange('ratePerConsultation', parseInt(e.target.value))}
                                            style={inputStyle}
                                            min="0"
                                            step="1000"
                                        />
                                        <span style={unitStyle}>원</span>
                                    </div>
                                </div>
                                
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>기본 시간당 요율:</label>
                                    <div style={inputGroupStyle}>
                                        <input
                                            type="number"
                                            value={formData.defaultHourlyRate}
                                            onChange={(e) => handleInputChange('defaultHourlyRate', parseInt(e.target.value))}
                                            style={inputStyle}
                                            min="0"
                                            step="1000"
                                        />
                                        <span style={unitStyle}>원</span>
                                    </div>
                                </div>
                            </div>

                            {/* 현재 설정 정보 */}
                            <div style={sectionStyle}>
                                <h4 style={sectionTitleStyle}>현재 설정 정보</h4>
                                <div style={infoBoxStyle}>
                                    <p><strong>이번 달 급여 기산일:</strong> {settings.currentSettings.baseDate}</p>
                                    <p><strong>급여 지급 예정일:</strong> {settings.currentSettings.paymentDate}</p>
                                    <p><strong>급여 마감일:</strong> {settings.currentSettings.cutoffDate}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={modalFooterStyle}>
                    <button 
                        onClick={onClose} 
                        style={cancelButtonStyle}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSave} 
                        style={saveButtonStyle}
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '설정 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// 스타일 정의
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
};

const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee'
};

const modalTitleStyle = {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
};

const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const modalBodyStyle = {
    padding: '20px',
    maxHeight: '400px',
    overflowY: 'auto'
};

const formContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
};

const sectionStyle = {
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '6px',
    backgroundColor: '#f9f9f9'
};

const sectionTitleStyle = {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
};

const formGroupStyle = {
    marginBottom: '15px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555'
};

const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
};

const inputGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const inputStyle = {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
};

const unitStyle = {
    fontSize: '14px',
    color: '#666'
};

const infoBoxStyle = {
    padding: '15px',
    backgroundColor: '#f0f8ff',
    border: '1px solid #d0e7ff',
    borderRadius: '4px',
    fontSize: '14px'
};

const modalFooterStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '20px',
    borderTop: '1px solid #eee'
};

const cancelButtonStyle = {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px'
};

const saveButtonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px'
};

export default SalaryConfigModal;
