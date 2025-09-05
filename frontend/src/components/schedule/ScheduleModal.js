import React, { useState, useEffect, useCallback } from 'react';
import StepIndicator from './components/StepIndicator';
import ConsultantSelectionStep from './steps/ConsultantSelectionStep';
import ClientSelectionStep from './steps/ClientSelectionStep';
import TimeSlotGrid from './TimeSlotGrid';
import notificationManager from '../../utils/notification';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
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
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: 상담사 선택, 2: 내담자 선택, 3: 시간 선택, 4: 세부사항

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

    /**
     * 상담 유형별 기본 시간 반환
     */
    const getConsultationDuration = (type) => {
        const durationMap = {
            'INDIVIDUAL': 50,
            'FAMILY': 100,
            'INITIAL': 60,
            'COUPLE': 80,
            'GROUP': 90
        };
        return durationMap[type] || 50;
    };

    /**
     * 상담 유형을 한글로 변환
     */
    const convertConsultationTypeToKorean = (consultationType) => {
        const typeMap = {
            'INDIVIDUAL': '개인상담',
            'COUPLE': '부부상담',
            'FAMILY': '가족상담',
            'INITIAL': '초기상담',
            'GROUP': '그룹상담'
        };
        return typeMap[consultationType] || consultationType || "알 수 없음";
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
            const duration = getConsultationDuration(consultationType);
            const startTime = selectedTimeSlot.time;
            const [hour, minute] = startTime.split(':').map(Number);
            const endMinute = minute + duration;
            const endHour = hour + Math.floor(endMinute / 60);
            const finalMinute = endMinute % 60;
            const endTime = `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;

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
                    {/* 1단계: 상담사 선택 */}
                    {step === 1 && (
                        <ConsultantSelectionStep
                            onConsultantSelect={handleConsultantDrop}
                            selectedConsultant={selectedConsultant}
                            selectedDate={selectedDate}
                        />
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
                                >
                                    <option value="INDIVIDUAL">개인상담 (50분)</option>
                                    <option value="FAMILY">가족상담 (100분)</option>
                                    <option value="INITIAL">초기상담 (60분)</option>
                                    <option value="COUPLE">부부상담 (80분)</option>
                                    <option value="GROUP">집단상담 (90분)</option>
                                </select>
                            </div>
                            <TimeSlotGrid
                                date={selectedDate}
                                consultantId={selectedConsultant?.originalId || selectedConsultant?.id}
                                duration={getConsultationDuration(consultationType)}
                                onTimeSlotSelect={handleTimeSlotSelect}
                                selectedTimeSlot={selectedTimeSlot}
                            />
                        </div>
                    )}

                    {/* 4단계: 세부사항 */}
                    {step === 4 && (
                        <div className="schedule-details">
                            <h4>📝 스케줄 세부사항</h4>
                            <div className="schedule-summary">
                                <div className="summary-item">
                                    <strong>상담사:</strong> {selectedConsultant?.name}
                                </div>
                                <div className="summary-item">
                                    <strong>내담자:</strong> {selectedClient?.name}
                                </div>
                                <div className="summary-item">
                                    <strong>시간:</strong> {selectedTimeSlot?.time} ({getConsultationDuration(consultationType)}분)
                                </div>
                                <div className="summary-item">
                                    <strong>유형:</strong> {convertConsultationTypeToKorean(consultationType)}
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>제목:</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="스케줄 제목 (선택사항)"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>설명:</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="추가 설명 (선택사항)"
                                    rows="3"
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
