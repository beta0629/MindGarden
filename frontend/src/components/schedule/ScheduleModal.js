import React, { useState, useEffect, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import ConsultantSelectionStep from './steps/ConsultantSelectionStep';
import ClientSelectionStep from './steps/ClientSelectionStep';
import TimeSlotGrid from './TimeSlotGrid';
import LoadingSpinner from '../common/LoadingSpinner';
import notificationManager from '../../utils/notification';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import './ScheduleModal.css';

/**
 * 새로운 디자인의 스케줄 생성 모달 컴포넌트
 * - CSS 클래스 상수 사용
 * - JavaScript 상수 사용
 * - 컴포넌트화 적용
 * - 현대적인 디자인
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-05
 */
const ScheduleModalNew = ({ 
    isOpen, 
    onClose, 
    selectedDate, 
    selectedInfo, 
    userRole, 
    userId, 
    onScheduleCreated 
}) => {
    const [selectedConsultant, setSelectedConsultant] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [consultationType, setConsultationType] = useState('INDIVIDUAL');
    const [selectedDuration, setSelectedDuration] = useState('50_MIN');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: 상담사 선택, 2: 내담자 선택, 3: 시간 선택, 4: 세부사항
    const [consultationTypeOptions, setConsultationTypeOptions] = useState([]);
    const [durationOptions, setDurationOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);

    // 세션 컨텍스트에서 모달 상태 관리 함수 가져오기
    const { setModalOpen } = useSession();

    useEffect(() => {
        if (isOpen) {
            // 모달이 열릴 때 세션 컨텍스트에 알림 (세션 체크 중단)
            setModalOpen(true);
            console.log('📱 스케줄 모달 열림 - 세션 체크 일시 중단');
        } else {
            // 모달이 닫힐 때 세션 컨텍스트에 알림 (세션 체크 재개)
            setModalOpen(false);
            console.log('📱 스케줄 모달 닫힘 - 세션 체크 재개');
        }

        // 컴포넌트 언마운트 시에도 모달 상태 해제
        return () => {
            setModalOpen(false);
            console.log('📱 스케줄 모달 언마운트 - 세션 체크 재개');
        };
    }, [isOpen, setModalOpen]);

    // 상담 유형 코드 로드
    useEffect(() => {
        const loadConsultationTypeCodes = async () => {
            try {
                setLoadingCodes(true);
                const response = await apiGet('/api/admin/common-codes/values?groupCode=CONSULTATION_TYPE');
                if (response && response.length > 0) {
                    const options = response.map(code => ({
                        value: code.codeValue,
                        label: code.codeLabel,
                        icon: code.icon,
                        color: code.colorCode,
                        durationMinutes: code.durationMinutes
                    }));
                    setConsultationTypeOptions(options);
                }
            } catch (error) {
                console.error('상담 유형 코드 로드 실패:', error);
                // 실패 시 기본값 설정
                setConsultationTypeOptions([
                    { value: 'INDIVIDUAL', label: '개인상담', icon: '👤', color: '#3b82f6', durationMinutes: 50 },
                    { value: 'FAMILY', label: '가족상담', icon: '👨‍👩‍👧‍👦', color: '#10b981', durationMinutes: 100 },
                    { value: 'INITIAL', label: '초기상담', icon: '🎯', color: '#f59e0b', durationMinutes: 60 },
                    { value: 'COUPLE', label: '부부상담', icon: '👫', color: '#ec4899', durationMinutes: 80 },
                    { value: 'GROUP', label: '집단상담', icon: '👥', color: '#8b5cf6', durationMinutes: 90 }
                ]);
            } finally {
                setLoadingCodes(false);
            }
        };

        loadConsultationTypeCodes();
    }, []);

    // 상담 시간 코드 로드
    useEffect(() => {
        const loadDurationCodes = async () => {
            try {
                setLoadingCodes(true);
                const response = await apiGet('/api/admin/common-codes/values?groupCode=DURATION');
                if (response && response.length > 0) {
                    const options = response.map(code => ({
                        value: code.codeValue,
                        label: code.codeLabel,
                        icon: code.icon,
                        color: code.colorCode,
                        durationMinutes: code.durationMinutes || parseInt(code.codeValue.replace('_MIN', '')),
                        description: code.codeDescription
                    }));
                    setDurationOptions(options);
                    // 기본값 설정
                    if (!selectedDuration && options.length > 0) {
                        setSelectedDuration(options[0].value);
                    }
                }
            } catch (error) {
                console.error('상담 시간 코드 로드 실패:', error);
                // 실패 시 기본값 설정
                const defaultOptions = [
                    { value: '30_MIN', label: '30분', icon: '⏰', color: '#f59e0b', durationMinutes: 30, description: '30분 상담' },
                    { value: '50_MIN', label: '50분', icon: '⏰', color: '#3b82f6', durationMinutes: 50, description: '50분 상담' },
                    { value: '60_MIN', label: '60분', icon: '⏰', color: '#10b981', durationMinutes: 60, description: '60분 상담' },
                    { value: '80_MIN', label: '80분', icon: '⏰', color: '#ec4899', durationMinutes: 80, description: '80분 상담' },
                    { value: '90_MIN', label: '90분', icon: '⏰', color: '#8b5cf6', durationMinutes: 90, description: '90분 상담' },
                    { value: '100_MIN', label: '100분', icon: '⏰', color: '#f97316', durationMinutes: 100, description: '100분 상담' },
                    { value: '120_MIN', label: '120분', icon: '⏰', color: '#ef4444', durationMinutes: 120, description: '120분 상담' },
                    { value: 'CUSTOM', label: '사용자 정의', icon: '⚙️', color: '#6b7280', durationMinutes: 0, description: '사용자가 직접 설정하는 상담 시간' }
                ];
                setDurationOptions(defaultOptions);
                // 기본값 설정
                if (!selectedDuration) {
                    setSelectedDuration('60_MIN');
                }
            } finally {
                setLoadingCodes(false);
            }
        };

        loadDurationCodes();
    }, []);

    /**
     * 상담 유형별 기본 시간 반환
     */
    const getConsultationDuration = (type) => {
        // 동적으로 로드된 상담 유형 옵션에서 찾기
        const typeOption = consultationTypeOptions.find(option => option.value === type);
        
        if (typeOption) {
            return typeOption.durationMinutes;
        }
        
        // 기본값
        return 50;
    };

    /**
     * 상담 시간 옵션에서 시간 반환
     */
    const getDurationFromCode = (durationCode) => {
        console.log('🔍 getDurationFromCode 호출:', { 
            durationCode, 
            durationOptionsLength: durationOptions.length,
            durationOptions: durationOptions.map(opt => ({ value: opt.value, durationMinutes: opt.durationMinutes }))
        });
        
        if (!durationCode) {
            console.log('⚠️ durationCode가 없음, 기본값 60분 사용');
            return 60;
        }
        
        const durationOption = durationOptions.find(option => option.value === durationCode);
        
        if (durationOption) {
            console.log('✅ durationOption 찾음:', durationOption);
            return durationOption.durationMinutes;
        }
        
        console.log('⚠️ durationOption을 찾지 못함, 기본값 60분 사용');
        console.log('🔍 찾는 값:', durationCode);
        console.log('🔍 사용 가능한 값들:', durationOptions.map(opt => opt.value));
        // 기본값
        return 60;
    };

    /**
     * 상담 유형을 한글로 변환
     */
    const convertConsultationTypeToKorean = (consultationType) => {
        // 동적으로 로드된 상담 유형 옵션에서 찾기
        const typeOption = consultationTypeOptions.find(option => option.value === consultationType);
        
        if (typeOption) {
            return typeOption.label;
        }
        
        // 기본값
        return consultationType || "알 수 없음";
    };

    /**
     * 상담사 드래그 앤 드롭 핸들러
     */
    const handleConsultantDrop = (consultant) => {
        console.log('👨‍⚕️ 상담사 선택:', consultant);
        setSelectedConsultant(consultant);
        setStep(2); // 내담자 선택 단계로
    };

    /**
     * 내담자 드래그 앤 드롭 핸들러
     */
    const handleClientDrop = (client) => {
        console.log('👤 내담자 선택:', client);
        setSelectedClient(client);
        setStep(3); // 시간 선택 단계로
    };

    /**
     * 시간 슬롯 선택 핸들러
     */
    const handleTimeSlotSelect = (timeSlot) => {
        console.log('⏰ 시간 선택:', timeSlot);
        setSelectedTimeSlot(timeSlot);
        setStep(4); // 세부사항 입력 단계로
    };

    /**
     * 스케줄 생성
     */
    const handleCreateSchedule = async () => {
        if (!selectedConsultant || !selectedClient || !selectedTimeSlot) {
            notificationManager.error('모든 항목을 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const duration = getDurationFromCode(selectedDuration);
            console.log('🔍 스케줄 생성 데이터:', { selectedDuration, duration, selectedTimeSlot });
            
            if (!duration || isNaN(duration)) {
                console.error('❌ duration이 유효하지 않음:', duration);
                notificationManager.error('상담 시간을 선택해주세요.');
                return;
            }
            
            const startTime = selectedTimeSlot.time;
            const [hour, minute] = startTime.split(':').map(Number);
            const endMinute = minute + duration;
            const endHour = hour + Math.floor(endMinute / 60);
            const finalMinute = endMinute % 60;
            const endTime = `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
            
            console.log('🔍 시간 계산 결과:', { startTime, duration, endTime });

            // 날짜를 로컬 시간대로 처리하여 시간대 변환 문제 방지
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            const scheduleData = {
                consultantId: selectedConsultant.originalId || selectedConsultant.id,
                clientId: selectedClient.originalId || selectedClient.id,
                date: dateString,
                startTime: startTime,
                endTime: endTime,
                title: title || `${selectedConsultant.name} - ${selectedClient.name}`,
                description: description,
                scheduleType: 'CONSULTATION',
                consultationType: consultationType
            };

            console.log('📝 스케줄 생성 데이터:', scheduleData);

            const response = await fetch('/api/schedules/consultant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(scheduleData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ 스케줄 생성 성공:', result);
                notificationManager.success(result.message || '스케줄이 성공적으로 생성되었습니다!');
                onScheduleCreated(); // 캘린더 새로고침 트리거
            } else {
                const error = await response.json();
                console.error('❌ 스케줄 생성 실패:', error);
                notificationManager.error(error.message || '스케줄 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('스케줄 생성 오류:', error);
            notificationManager.error('스케줄 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 이전 단계로
     */
    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 2) setSelectedConsultant(null);
            if (step === 3) setSelectedClient(null);
            if (step === 4) setSelectedTimeSlot(null);
        }
    };

    /**
     * 모달 리셋
     */
    const resetModal = () => {
        setStep(1);
        setSelectedConsultant(null);
        setSelectedClient(null);
        setSelectedTimeSlot(null);
        setTitle('');
        setDescription('');
        setConsultationType('INDIVIDUAL');
    };

    /**
     * 모달 닫기
     */
    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={COMPONENT_CSS.SCHEDULE_MODAL.OVERLAY} onClick={handleClose}>
            <div className={COMPONENT_CSS.SCHEDULE_MODAL.MODAL} onClick={(e) => e.stopPropagation()}>
                {/* 모달 헤더 */}
                <div className={COMPONENT_CSS.SCHEDULE_MODAL.HEADER}>
                    <div className={COMPONENT_CSS.SCHEDULE_MODAL.HEADER_LEFT}>
                        <h3 className={COMPONENT_CSS.SCHEDULE_MODAL.TITLE}>📅 스케줄 생성</h3>
                    </div>
                    <div className={COMPONENT_CSS.SCHEDULE_MODAL.HEADER_CENTER}>
                        <div className={COMPONENT_CSS.SCHEDULE_MODAL.SELECTED_DATE}>
                            {selectedDate?.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            })}
                        </div>
                    </div>
                    <div className={COMPONENT_CSS.SCHEDULE_MODAL.HEADER_RIGHT}>
                        <button 
                            className={COMPONENT_CSS.SCHEDULE_MODAL.CLOSE_BTN} 
                            onClick={handleClose}
                            aria-label="모달 닫기"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* 모달 콘텐츠 */}
                <div className={COMPONENT_CSS.SCHEDULE_MODAL.CONTENT}>
                    <StepIndicator 
                        currentStep={step} 
                        totalSteps={4}
                        steps={[
                            { id: 1, title: '상담사 선택', icon: '👨‍⚕️' },
                            { id: 2, title: '내담자 선택', icon: '👤' },
                            { id: 3, title: '시간 선택', icon: '⏰' },
                            { id: 4, title: '세부사항', icon: '📝' }
                        ]}
                    />
                    
                    {/* 1단계: 상담사 선택 */}
                    {step === 1 && (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            <ConsultantSelectionStep
                                onConsultantSelect={handleConsultantDrop}
                                selectedConsultant={selectedConsultant}
                                selectedDate={selectedDate}
                            />
                        </div>
                    )}

                    {/* 2단계: 내담자 선택 */}
                    {step === 2 && (
                        <ClientSelectionStep
                            onClientSelect={handleClientDrop}
                            selectedClient={selectedClient}
                            selectedConsultant={selectedConsultant}
                        />
                    )}

                    {/* 3단계: 시간 선택 */}
                    {step === 3 && (
                        <div className="time-selection">
                            <h4>⏰ 시간을 선택하세요</h4>
                            <div className="consultation-type-selector">
                                <label>상담 유형:</label>
                                <select 
                                    value={consultationType} 
                                    onChange={(e) => setConsultationType(e.target.value)}
                                    disabled={loadingCodes}
                                >
                                    {consultationTypeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.icon} {option.label} ({option.value})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="duration-selector">
                                <label>상담 시간:</label>
                                <select 
                                    value={selectedDuration} 
                                    onChange={(e) => setSelectedDuration(e.target.value)}
                                    disabled={loadingCodes}
                                >
                                    {durationOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.icon} {option.label} ({option.durationMinutes}분) ({option.value})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <TimeSlotGrid
                                date={selectedDate}
                                consultantId={selectedConsultant?.originalId || selectedConsultant?.id}
                                duration={getDurationFromCode(selectedDuration)}
                                onTimeSlotSelect={handleTimeSlotSelect}
                                selectedTimeSlot={selectedTimeSlot}
                            />
                        </div>
                    )}

                    {/* 4단계: 세부사항 */}
                    {step === 4 && (
                        <div className="schedule-details">
                            <h4>📝 스케줄 세부사항</h4>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                padding: '16px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <strong style={{ color: '#495057', fontSize: '14px' }}>상담사:</strong>
                                    <span style={{ color: '#495057', fontSize: '14px' }}>{selectedConsultant?.name}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <strong style={{ color: '#495057', fontSize: '14px' }}>내담자:</strong>
                                    <span style={{ color: '#495057', fontSize: '14px' }}>{selectedClient?.name}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <strong style={{ color: '#495057', fontSize: '14px' }}>시간:</strong>
                                    <span style={{ color: '#495057', fontSize: '14px' }}>
                                        {selectedTimeSlot?.time} - {selectedTimeSlot?.endTime} ({getDurationFromCode(selectedDuration)}분)
                                        {/* 디버깅용 로그 */}
                                        {console.log('🔍 스케줄 세부사항 시간 표시:', {
                                            selectedTimeSlot,
                                            selectedDuration,
                                            durationFromCode: getDurationFromCode(selectedDuration),
                                            durationOptions
                                        })}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0'
                                }}>
                                    <strong style={{ color: '#495057', fontSize: '14px' }}>유형:</strong>
                                    <span style={{ color: '#495057', fontSize: '14px' }}>{convertConsultationTypeToKorean(consultationType)}</span>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>제목:</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="스케줄 제목 (선택사항)"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#495057',
                                        backgroundColor: '#ffffff',
                                        outline: 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>설명:</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="추가 설명 (선택사항)"
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        color: '#495057',
                                        backgroundColor: '#ffffff',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#667eea';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 모달 푸터 */}
                <div className={COMPONENT_CSS.SCHEDULE_MODAL.FOOTER}>
                    {step > 1 && (
                        <button 
                            className="btn btn-secondary" 
                            onClick={handlePrevStep}
                            disabled={loading}
                        >
                            이전
                        </button>
                    )}
                    
                    {step < 4 ? (
                        <button 
                            className="btn btn-primary" 
                            onClick={() => {
                                if (step === 1 && selectedConsultant) setStep(2);
                                else if (step === 2 && selectedClient) setStep(3);
                                else if (step === 3 && selectedTimeSlot) setStep(4);
                            }}
                            disabled={
                                (step === 1 && !selectedConsultant) ||
                                (step === 2 && !selectedClient) ||
                                (step === 3 && !selectedTimeSlot)
                            }
                        >
                            다음
                        </button>
                    ) : (
                        <button 
                            className="btn btn-success" 
                            onClick={handleCreateSchedule}
                            disabled={loading}
                        >
                            {loading ? '생성 중...' : '스케줄 생성'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleModalNew;
