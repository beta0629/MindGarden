import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import './VacationManagementModal.css';

/**
 * 관리자용 휴가 관리 모달 컴포넌트
 * - 상담사별 휴가 등록/수정/삭제
 * - 휴가 유형별 세밀한 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-09
 */
const VacationManagementModal = ({ 
    isOpen, 
    onClose, 
    selectedConsultant,
    userRole: propUserRole,
    selectedDate,
    onVacationUpdated 
}) => {
    const { userRole: sessionUserRole } = useSession();
    const userRole = propUserRole || sessionUserRole;
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState(null);
    const [vacationData, setVacationData] = useState({
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        type: 'MORNING',
        reason: '',
        startTime: '',
        endTime: ''
    });
    const [existingVacations, setExistingVacations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // selectedDate가 변경될 때 vacationData의 날짜 업데이트
    useEffect(() => {
        if (selectedDate) {
            setVacationData(prev => ({
                ...prev,
                date: selectedDate.toISOString().split('T')[0]
            }));
        }
    }, [selectedDate]);

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        console.log('🏖️ 상담사 목록 로드 시작');
        try {
            const response = await fetch('http://localhost:8080/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            console.log('🏖️ 상담사 API 응답:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('🏖️ 상담사 API 결과:', result);
                
                // API 응답이 배열 형태로 직접 반환됨
                if (Array.isArray(result)) {
                    // 상담사만 필터링 (role이 CONSULTANT인 사용자)
                    const consultantList = result.filter(user => user.role === 'CONSULTANT');
                    console.log('🏖️ 필터링된 상담사 목록:', consultantList);
                    setConsultants(consultantList);
                } else if (result.success && result.data) {
                    // 기존 구조도 지원
                    const consultantList = result.data.filter(user => user.role === 'CONSULTANT');
                    console.log('🏖️ 필터링된 상담사 목록:', consultantList);
                    setConsultants(consultantList);
                } else {
                    console.log('🏖️ 상담사 데이터 없음');
                    setConsultants([]);
                }
            } else {
                console.log('🏖️ 상담사 API 실패:', response.status);
                setConsultants([]);
            }
        } catch (error) {
            console.error('🏖️ 상담사 목록 로드 실패:', error);
            setConsultants([]);
        }
    };

    /**
     * 휴가 목록 로드
     */
    const loadVacations = async (consultantId) => {
        if (!consultantId) return;
        
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/consultant/${consultantId}/vacation`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setExistingVacations(result.data);
                } else {
                    setExistingVacations([]);
                }
            }
        } catch (error) {
            console.error('휴가 목록 로드 실패:', error);
            setExistingVacations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            console.log('🏖️ 모달이 열림 - 상담사 목록 로드 시작');
            loadConsultants();
            if (selectedConsultant) {
                setSelectedConsultantId(selectedConsultant.id);
                loadVacations(selectedConsultant.id);
            }
        }
    }, [isOpen, selectedConsultant]);

    useEffect(() => {
        if (selectedConsultantId) {
            loadVacations(selectedConsultantId);
        }
    }, [selectedConsultantId]);

    // 관리자 권한 확인
    console.log('🏖️ 권한 확인:', { userRole, isAdmin: userRole === 'ADMIN', isSuperAdmin: userRole === 'SUPER_ADMIN' });
    
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        console.log('🏖️ 권한 없음 - 모달 렌더링하지 않음');
        return null;
    }

    /**
     * 휴가 등록/수정
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedConsultantId) {
            setMessage('상담사를 선택해주세요.');
            return;
        }

        if (!vacationData.date) {
            setMessage('휴가 날짜를 선택해주세요.');
            return;
        }

        if (!vacationData.reason.trim()) {
            setMessage('휴가 사유를 입력해주세요.');
            return;
        }

        // 휴가 유형별 필수 필드 검증
        if (vacationData.type === 'CUSTOM_TIME') {
            if (!vacationData.startTime || !vacationData.endTime) {
                setMessage('사용자 정의 휴가의 경우 시작/종료 시간을 입력해주세요.');
                return;
            }
        }

        setLoading(true);
        setMessage('');

        // 날짜 형식 변환
        let formattedDate;
        if (selectedDate) {
            // selectedDate가 Date 객체인 경우 로컬 시간대를 고려하여 YYYY-MM-DD 형식으로 변환
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
        } else if (vacationData.date) {
            // vacationData.date가 이미 문자열인 경우 그대로 사용
            formattedDate = vacationData.date;
        } else {
            setMessage('휴가 날짜를 선택해주세요.');
            setLoading(false);
            return;
        }

        // 전송할 데이터 준비
        const submitData = {
            ...vacationData,
            date: formattedDate
        };

        // 디버깅: 전송할 데이터 확인
        console.log('🏖️ 휴가 등록 데이터:', {
            selectedConsultantId,
            submitData,
            selectedDate,
            formattedDate
        });

        try {
            const response = await fetch(`http://localhost:8080/api/consultant/${selectedConsultantId}/vacation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(submitData)
            });

            const result = await response.json();
            
            if (result.success) {
                // 공통 알림 시스템 사용
                if (window.notificationManager) {
                    window.notificationManager.showSuccess('휴가가 성공적으로 등록되었습니다.');
                } else {
                    setMessage('휴가가 성공적으로 등록되었습니다.');
                }
                setVacationData({
                    date: '',
                    type: 'MORNING',
                    reason: '',
                    startTime: '',
                    endTime: ''
                });
                loadVacations(selectedConsultantId);
                if (onVacationUpdated) {
                    onVacationUpdated();
                }
            } else {
                // 공통 알림 시스템 사용
                if (window.notificationManager) {
                    window.notificationManager.showError(result.message || '휴가 등록에 실패했습니다.');
                } else {
                    setMessage(result.message || '휴가 등록에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('휴가 등록 실패:', error);
            // 공통 알림 시스템 사용
            if (window.notificationManager) {
                window.notificationManager.showError('휴가 등록 중 오류가 발생했습니다.');
            } else {
                setMessage('휴가 등록 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * 휴가 삭제
     */
    const handleDeleteVacation = async (vacationId, date) => {
        if (!window.confirm('정말로 이 휴가를 삭제하시겠습니까?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/consultant/${selectedConsultantId}/vacation/${date}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.success) {
                // 공통 알림 시스템 사용
                if (window.notificationManager) {
                    window.notificationManager.showSuccess('휴가가 삭제되었습니다.');
                } else {
                    setMessage('휴가가 삭제되었습니다.');
                }
                loadVacations(selectedConsultantId);
                if (onVacationUpdated) {
                    onVacationUpdated();
                }
            } else {
                // 공통 알림 시스템 사용
                if (window.notificationManager) {
                    window.notificationManager.showError(result.message || '휴가 삭제에 실패했습니다.');
                } else {
                    setMessage(result.message || '휴가 삭제에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('휴가 삭제 실패:', error);
            // 공통 알림 시스템 사용
            if (window.notificationManager) {
                window.notificationManager.showError('휴가 삭제 중 오류가 발생했습니다.');
            } else {
                setMessage('휴가 삭제 중 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * 휴가 유형별 시간 필드 표시 여부
     */
    const shouldShowTimeFields = () => {
        return vacationData.type === 'CUSTOM_TIME';
    };

    /**
     * 휴가 유형별 기본 시간 설정
     */
    const handleVacationTypeChange = (type) => {
        setVacationData(prev => ({
            ...prev,
            type,
            startTime: type === 'CUSTOM_TIME' ? '' : getDefaultStartTime(type),
            endTime: type === 'CUSTOM_TIME' ? '' : getDefaultEndTime(type)
        }));
    };

    const getDefaultStartTime = (type) => {
        switch (type) {
            case 'MORNING':
                return '09:00';
            case 'MORNING_HALF_1':
                return '09:00';
            case 'MORNING_HALF_2':
                return '11:00';
            case 'AFTERNOON':
                return '14:00';
            case 'AFTERNOON_HALF_1':
                return '14:00';
            case 'AFTERNOON_HALF_2':
                return '16:00';
            default:
                return '';
        }
    };

    const getDefaultEndTime = (type) => {
        switch (type) {
            case 'MORNING':
                return '13:00';
            case 'MORNING_HALF_1':
                return '11:00'; // 2시간 (09:00-11:00)
            case 'MORNING_HALF_2':
                return '13:00'; // 2시간 (11:00-13:00)
            case 'AFTERNOON':
                return '18:00';
            case 'AFTERNOON_HALF_1':
                return '16:00'; // 2시간 (14:00-16:00)
            case 'AFTERNOON_HALF_2':
                return '18:00'; // 2시간 (16:00-18:00)
            default:
                return '';
        }
    };

    /**
     * 휴가 유형명 변환
     */
    const getVacationTypeName = (type) => {
        const typeNames = {
            'ALL_DAY': '하루 종일',
            'FULL_DAY': '하루 종일',
            'MORNING': '오전 휴가',
            'MORNING_HALF': '오전 반반차',
            'AFTERNOON': '오후 휴가',
            'AFTERNOON_HALF': '오후 반반차',
            'CUSTOM_TIME': '사용자 정의'
        };
        return typeNames[type] || type;
    };

    console.log('🏖️ VacationManagementModal 렌더링:', { isOpen, userRole });
    
    if (!isOpen) {
        console.log('🏖️ 모달이 닫혀있음 - 렌더링하지 않음');
        return null;
    }

    return (
        <div className="vacation-management-modal-overlay">
            <div className="vacation-management-modal">
                <div className="modal-header">
                    <h3>🏖️ 휴가 관리</h3>
                    <button 
                        className="close-button" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-content">
                    {/* 상담사 선택 */}
                    <div className="form-group">
                        <label>상담사 선택</label>
                        <select
                            value={selectedConsultantId || ''}
                            onChange={(e) => setSelectedConsultantId(Number(e.target.value))}
                            disabled={loading}
                        >
                            <option value="">상담사를 선택하세요</option>
                            {consultants.map(consultant => (
                                <option key={consultant.id} value={consultant.id}>
                                    {consultant.name} ({consultant.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedConsultantId && (
                        <>
                            {/* 휴가 등록 폼 */}
                            <form onSubmit={handleSubmit} className="vacation-form">
                                <h4>새 휴가 등록</h4>
                                
                                <div className="form-row">
                                    {!selectedDate && (
                                        <div className="form-group">
                                            <label>휴가 날짜</label>
                                            <input
                                                type="date"
                                                value={vacationData.date}
                                                onChange={(e) => setVacationData(prev => ({ ...prev, date: e.target.value }))}
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    )}
                                    
                                    {selectedDate && (
                                        <div className="form-group">
                                            <label>휴가 날짜</label>
                                            <div className="selected-date-display">
                                                📅 {selectedDate.toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    weekday: 'long'
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>휴가 유형</label>
                                        <select
                                            value={vacationData.type}
                                            onChange={(e) => handleVacationTypeChange(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="MORNING">오전 휴가 (09:00-13:00)</option>
                                            <option value="MORNING_HALF_1">오전 반반차 1 (09:00-11:00)</option>
                                            <option value="MORNING_HALF_2">오전 반반차 2 (11:00-13:00)</option>
                                            <option value="AFTERNOON">오후 휴가 (14:00-18:00)</option>
                                            <option value="AFTERNOON_HALF_1">오후 반반차 1 (14:00-16:00)</option>
                                            <option value="AFTERNOON_HALF_2">오후 반반차 2 (16:00-18:00)</option>
                                            <option value="ALL_DAY">하루 종일</option>
                                            <option value="CUSTOM_TIME">사용자 정의</option>
                                        </select>
                                    </div>
                                </div>

                                {shouldShowTimeFields() && (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>시작 시간</label>
                                            <input
                                                type="time"
                                                value={vacationData.startTime}
                                                onChange={(e) => setVacationData(prev => ({ ...prev, startTime: e.target.value }))}
                                                disabled={loading}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>종료 시간</label>
                                            <input
                                                type="time"
                                                value={vacationData.endTime}
                                                onChange={(e) => setVacationData(prev => ({ ...prev, endTime: e.target.value }))}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>휴가 사유</label>
                                    <textarea
                                        value={vacationData.reason}
                                        onChange={(e) => setVacationData(prev => ({ ...prev, reason: e.target.value }))}
                                        disabled={loading}
                                        placeholder="휴가 사유를 입력하세요"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="submit-button"
                                        disabled={loading}
                                    >
                                        {loading ? '등록 중...' : '휴가 등록'}
                                    </button>
                                </div>
                            </form>

                            {/* 기존 휴가 목록 */}
                            <div className="existing-vacations">
                                <h4>등록된 휴가 목록</h4>
                                {loading ? (
                                    <div className="loading">로딩 중...</div>
                                ) : existingVacations.length > 0 ? (
                                    <div className="vacation-list">
                                        {existingVacations.map(vacation => (
                                            <div key={vacation.id} className="vacation-item">
                                                <div className="vacation-info">
                                                    <div className="vacation-date">{vacation.date}</div>
                                                    <div className="vacation-type">
                                                        {getVacationTypeName(vacation.type)}
                                                    </div>
                                                    <div className="vacation-time">
                                                        {vacation.startTime && vacation.endTime 
                                                            ? `${vacation.startTime} - ${vacation.endTime}`
                                                            : '하루 종일'
                                                        }
                                                    </div>
                                                    <div className="vacation-reason">{vacation.reason}</div>
                                                </div>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => handleDeleteVacation(vacation.id, vacation.date)}
                                                    disabled={loading}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-vacations">등록된 휴가가 없습니다.</div>
                                )}
                            </div>
                        </>
                    )}

                    {/* 메시지 표시 */}
                    {message && (
                        <div className={`message ${message.includes('성공') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VacationManagementModal;
