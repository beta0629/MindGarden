import React, { useState, useEffect } from 'react';
import { X, UserSquare, Users, Clock, FileText, Check } from 'lucide-react';
import ConsultantSelectionStep from './steps/ConsultantSelectionStep';
import ClientSelectionStep from './steps/ClientSelectionStep';
import TimeSlotGrid from './TimeSlotGrid';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/modules/schedule-modal.css';

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
            setModalOpen(true);
            console.log('📱 스케줄 모달 열림 - 세션 체크 일시 중단');
        } else {
            setModalOpen(false);
            console.log('📱 스케줄 모달 닫힘 - 세션 체크 재개');
        }

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
                const response = await StandardizedApi.get('/api/v1/common-codes/groups/CONSULTATION_TYPE');
                if (response && response.length > 0) {
                    const options = response.map(code => {
                        let durationMinutes = 50;
                        if (code.extraData) {
                            try {
                                const extraData = JSON.parse(code.extraData);
                                durationMinutes = extraData.durationMinutes || 50;
                            } catch (e) {
                                console.warn('extraData 파싱 실패:', code.extraData);
                            }
                        }
                        return {
                            value: code.codeValue,
                            label: code.codeLabel,
                            icon: null,
                            color: code.colorCode || 'var(--mg-primary-500)',
                            durationMinutes: durationMinutes
                        };
                    });
                    setConsultationTypeOptions(options);
                }
            } catch (error) {
                console.error('상담 유형 코드 로드 실패:', error);
                setConsultationTypeOptions([
                    { value: 'INDIVIDUAL', label: '개인상담', icon: null, color: 'var(--mg-primary-500)', durationMinutes: 50 },
                    { value: 'FAMILY', label: '가족상담', icon: null, color: 'var(--mg-success-500)', durationMinutes: 100 },
                    { value: 'INITIAL', label: '초기상담', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 60 },
                    { value: 'COUPLE', label: '부부상담', icon: null, color: 'var(--mg-pink-500)', durationMinutes: 80 },
                    { value: 'GROUP', label: '집단상담', icon: null, color: 'var(--mg-purple-500)', durationMinutes: 90 }
                ]);
            } finally {
                setLoadingCodes(false);
            }
        };

        if (isOpen) {
            loadConsultationTypeCodes();
        }
    }, [isOpen]);

    // 상담 시간 코드 로드
    useEffect(() => {
        const loadDurationCodes = async () => {
            try {
                setLoadingCodes(true);
                const response = await StandardizedApi.get('/api/v1/common-codes/groups/DURATION');
                if (response && response.length > 0) {
                    const options = response.map(code => {
                        let durationMinutes = 60;
                        if (code.extraData) {
                            try {
                                const extraData = JSON.parse(code.extraData);
                                durationMinutes = extraData.durationMinutes || parseInt(code.codeValue.replace('_MIN', '')) || 60;
                            } catch (e) {
                                console.warn('extraData 파싱 실패:', code.extraData);
                                durationMinutes = parseInt(code.codeValue.replace('_MIN', '')) || 60;
                            }
                        } else {
                            durationMinutes = parseInt(code.codeValue.replace('_MIN', '')) || 60;
                        }
                        return {
                            value: code.codeValue,
                            label: code.codeLabel,
                            icon: null,
                            color: code.colorCode || 'var(--mg-primary-500)',
                            durationMinutes: durationMinutes,
                            description: code.codeDescription
                        };
                    });
                    setDurationOptions(options);
                    if (!selectedDuration && options.length > 0) {
                        setSelectedDuration(options[0].value);
                    }
                }
            } catch (error) {
                console.error('상담 시간 코드 로드 실패:', error);
                const defaultOptions = [
                    { value: '30_MIN', label: '30분', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 30, description: '30분 상담' },
                    { value: '50_MIN', label: '50분', icon: null, color: 'var(--mg-primary-500)', durationMinutes: 50, description: '50분 상담' },
                    { value: '60_MIN', label: '60분', icon: null, color: 'var(--mg-success-500)', durationMinutes: 60, description: '60분 상담' },
                    { value: '80_MIN', label: '80분', icon: null, color: 'var(--mg-pink-500)', durationMinutes: 80, description: '80분 상담' },
                    { value: '90_MIN', label: '90분', icon: null, color: 'var(--mg-purple-500)', durationMinutes: 90, description: '90분 상담' },
                    { value: '100_MIN', label: '100분', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 100, description: '100분 상담' },
                    { value: '120_MIN', label: '120분', icon: null, color: 'var(--mg-error-500)', durationMinutes: 120, description: '120분 상담' },
                    { value: 'CUSTOM', label: '사용자 정의', icon: null, color: 'var(--mg-gray-500)', durationMinutes: 0, description: '사용자가 직접 설정하는 상담 시간' }
                ];
                setDurationOptions(defaultOptions);
                if (!selectedDuration) {
                    setSelectedDuration('60_MIN');
                }
            } finally {
                setLoadingCodes(false);
            }
        };

        if (isOpen) {
            loadDurationCodes();
        }
    }, [isOpen, selectedDuration]);

    const getDurationFromCode = (durationCode) => {
        if (!durationCode) return 60;
        const durationOption = durationOptions.find(option => option.value === durationCode);
        if (durationOption) return durationOption.durationMinutes;
        return 60;
    };

    const convertConsultationTypeToKorean = (consultationType) => {
        const typeOption = consultationTypeOptions.find(option => option.value === consultationType);
        if (typeOption) return typeOption.label;
        return consultationType || "알 수 없음";
    };

    const handleConsultantDrop = (consultant) => {
        setSelectedConsultant(consultant);
        setStep(2);
    };

    const handleClientDrop = (client) => {
        setSelectedClient(client);
        setStep(3);
    };

    const handleTimeSlotSelect = (timeSlot) => {
        setSelectedTimeSlot(timeSlot);
        setStep(4);
    };

    const handleCreateSchedule = async () => {
        if (!selectedConsultant || !selectedClient || !selectedTimeSlot) {
            notificationManager.error('모든 항목을 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const duration = getDurationFromCode(selectedDuration);
            if (!duration || isNaN(duration)) {
                notificationManager.error('상담 시간을 선택해주세요.');
                return;
            }
            
            const startTime = selectedTimeSlot.time;
            const [hour, minute] = startTime.split(':').map(Number);
            const endMinute = minute + duration;
            const endHour = hour + Math.floor(endMinute / 60);
            const finalMinute = endMinute % 60;
            const endTime = `${endHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
            
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

            const response = await StandardizedApi.post('/api/v1/schedules/consultant', scheduleData);
            
            notificationManager.success(response?.message || '스케줄이 성공적으로 생성되었습니다!');
            onScheduleCreated();
            handleClose();
        } catch (error) {
            console.error('스케줄 생성 오류:', error);
            notificationManager.error(error.message || '스케줄 생성 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            if (step === 2) setSelectedConsultant(null);
            if (step === 3) setSelectedClient(null);
            if (step === 4) setSelectedTimeSlot(null);
        }
    };

    const resetModal = () => {
        setStep(1);
        setSelectedConsultant(null);
        setSelectedClient(null);
        setSelectedTimeSlot(null);
        setTitle('');
        setDescription('');
        setConsultationType('INDIVIDUAL');
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    if (!isOpen) return null;

    const renderStepper = () => {
        const steps = [
            { id: 1, title: '상담사 선택', icon: UserSquare },
            { id: 2, title: '내담자 선택', icon: Users },
            { id: 3, title: '시간 선택', icon: Clock },
            { id: 4, title: '세부사항', icon: FileText }
        ];

        return (
            <div className="mg-v2-ad-stepper">
                {steps.map((s, index) => {
                    const Icon = s.icon;
                    const isCompleted = step > s.id;
                    const isCurrent = step === s.id;
                    
                    let statusClass = 'pending';
                    if (isCompleted) statusClass = 'completed';
                    if (isCurrent) statusClass = 'current';

                    return (
                        <React.Fragment key={s.id}>
                            <div className={`mg-v2-ad-stepper__item ${statusClass}`}>
                                <div className="mg-v2-ad-stepper__icon">
                                    {isCompleted ? <Check size={18} strokeWidth={2.5} /> : <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />}
                                </div>
                                <span className="mg-v2-ad-stepper__title">{s.title}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`mg-v2-ad-stepper__line ${isCompleted ? 'completed' : ''}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="mg-v2-ad-modal-backdrop" onClick={handleClose}>
            <div className="mg-v2-ad-modal" onClick={(e) => e.stopPropagation()}>
                {/* 모달 헤더 */}
                <div className="mg-v2-ad-modal__header">
                    <h2 className="mg-v2-ad-modal__title">
                        스케줄 생성
                        <span className="mg-v2-text-sm mg-v2-ml-md" style={{ fontWeight: 600, color: 'var(--mg-text-secondary, #5C6B61)', marginLeft: '8px' }}>
                            {selectedDate && (selectedDate instanceof Date ? selectedDate : new Date(selectedDate)).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                            })}
                        </span>
                    </h2>
                    <button 
                        className="mg-v2-ad-modal__close-btn" 
                        onClick={handleClose}
                        aria-label="모달 닫기"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 모달 바디 */}
                <div className="mg-v2-ad-modal__body">
                    {/* 진행 단계 표시기 */}
                    {renderStepper()}

                    {/* 1단계: 상담사 선택 */}
                    {step === 1 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">상담사 선택</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <ConsultantSelectionStep
                                    onConsultantSelect={handleConsultantDrop}
                                    selectedConsultant={selectedConsultant}
                                    selectedDate={selectedDate}
                                />
                            </div>
                        </div>
                    )}

                    {/* 2단계: 내담자 선택 */}
                    {step === 2 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">내담자 선택</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <ClientSelectionStep
                                    onClientSelect={handleClientDrop}
                                    selectedClient={selectedClient}
                                    selectedConsultant={selectedConsultant}
                                />
                            </div>
                        </div>
                    )}

                    {/* 3단계: 시간 선택 */}
                    {step === 3 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">시간 선택</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="mg-v2-label">상담 유형</label>
                                        <select 
                                            value={consultationType} 
                                            onChange={(e) => setConsultationType(e.target.value)}
                                            disabled={loadingCodes}
                                            className="mg-v2-input"
                                        >
                                            {consultationTypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label} ({option.value})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <label className="mg-v2-label">상담 시간</label>
                                        <select 
                                            value={selectedDuration} 
                                            onChange={(e) => setSelectedDuration(e.target.value)}
                                            disabled={loadingCodes}
                                            className="mg-v2-input"
                                        >
                                            {durationOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label} ({option.durationMinutes}분)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <TimeSlotGrid
                                    date={selectedDate}
                                    consultantId={selectedConsultant?.originalId || selectedConsultant?.id}
                                    duration={getDurationFromCode(selectedDuration)}
                                    onTimeSlotSelect={handleTimeSlotSelect}
                                    selectedTimeSlot={selectedTimeSlot}
                                />
                            </div>
                        </div>
                    )}

                    {/* 4단계: 세부사항 */}
                    {step === 4 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">스케줄 세부사항</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--mg-bg-white, #FFFFFF)', borderRadius: '8px', border: '1px solid var(--mg-gray-200, #E8E6E1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--mg-text-secondary, #5C6B61)' }}>상담사:</span>
                                        <span style={{ fontWeight: 600, color: 'var(--mg-text-primary, #2C2C2C)' }}>{selectedConsultant?.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--mg-text-secondary, #5C6B61)' }}>내담자:</span>
                                        <span style={{ fontWeight: 600, color: 'var(--mg-text-primary, #2C2C2C)' }}>{selectedClient?.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--mg-text-secondary, #5C6B61)' }}>시간:</span>
                                        <span style={{ fontWeight: 600, color: 'var(--mg-text-primary, #2C2C2C)' }}>
                                            {selectedTimeSlot?.time} - {selectedTimeSlot?.endTime} ({getDurationFromCode(selectedDuration)}분)
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--mg-gray-200, #E8E6E1)' }}>
                                        <span style={{ color: 'var(--mg-primary-600, #2C3E34)', fontWeight: 600 }}>유형:</span>
                                        <span style={{ color: 'var(--mg-primary-600, #2C3E34)', fontWeight: 600 }}>{convertConsultationTypeToKorean(consultationType)}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="mg-v2-label">제목</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="스케줄 제목 (선택사항)"
                                        className="mg-v2-input"
                                    />
                                </div>
                                
                                <div>
                                    <label className="mg-v2-label">설명</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="추가 설명 (선택사항)"
                                        rows="3"
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                        className="mg-v2-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 모달 푸터 */}
                <div className="mg-v2-ad-modal__footer">
                    {step > 1 && (
                        <button 
                            className="mg-v2-btn--outline" 
                            onClick={handlePrevStep}
                            disabled={loading}
                        >
                            이전
                        </button>
                    )}
                    
                    {step < 4 ? (
                        <button 
                            className="mg-v2-btn--primary" 
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
                            className="mg-v2-btn--primary" 
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
