import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../../constants/icons';

const CheckIcon = ICONS.CHECK;
import ConsultantSelectionStep from './steps/ConsultantSelectionStep';
import ClientSelectionStep from './steps/ClientSelectionStep';
import ScheduleTimeSelectionPanel from './ScheduleTimeSelectionPanel';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import '../../styles/modules/schedule-modal.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * 새로운 디자인의 스케줄 생성 모달 컴포넌트
 * - CSS 클래스 상수 사용
 * - JavaScript 상수 사용
 * - 컴포넌트화 적용
 * - 현대적인 디자인
 * 
 * @author Core Solution
 * @version 2.0.0
 * @since 2025-01-05
 */
/**
 * @param {Object} [preFilledMapping] - 매칭 통합 화면에서 전달 시 상담사/내담자 자동 채움. { consultantId, clientId, consultantName?, clientName? }
 */
const ScheduleModalNew = ({
    isOpen,
    onClose,
    selectedDate,
    selectedInfo,
    userRole,
    userId,
    onScheduleCreated,
    preFilledMapping
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

    const handleCodeOptionsLoaded = useCallback(({ consultationTypeOptions: c, durationOptions: d }) => {
        setConsultationTypeOptions(c);
        setDurationOptions(d);
    }, []);

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

    // 통합 화면에서 열 때 날짜 미전달 방지: 항상 유효한 Date 사용
    const effectiveSelectedDate = selectedDate instanceof Date
        ? selectedDate
        : (selectedDate ? new Date(selectedDate) : new Date());

    // 매칭 통합 화면에서 열 때 상담사/내담자 Pre-filled, 3단계(시간 선택)부터 표시
    useEffect(() => {
        if (!isOpen) return;
        if (preFilledMapping && preFilledMapping.consultantId && preFilledMapping.clientId) {
            setSelectedConsultant({
                id: preFilledMapping.consultantId,
                originalId: preFilledMapping.consultantId,
                name: preFilledMapping.consultantName || '상담사'
            });
            setSelectedClient({
                id: preFilledMapping.clientId,
                originalId: preFilledMapping.clientId,
                name: preFilledMapping.clientName || '내담자'
            });
            setStep(3);
        } else {
            setStep(1);
        }
    }, [isOpen, preFilledMapping?.consultantId, preFilledMapping?.clientId]);

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

    const handleCreateSchedule = async() => {
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
            
            const year = effectiveSelectedDate.getFullYear();
            const month = String(effectiveSelectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(effectiveSelectedDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            
            const scheduleData = {
                consultantId: selectedConsultant.originalId || selectedConsultant.id,
                clientId: selectedClient.originalId || selectedClient.id,
                date: dateString,
                startTime: startTime,
                endTime: endTime,
                title: title || `${toDisplayString(selectedConsultant?.name, '—')} - ${toDisplayString(selectedClient?.name, '—')}`,
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

    const formatSubtitle = () => {
      const d = effectiveSelectedDate;
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    };

    const renderActions = () => (
      <>
        {step > 1 && (
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn--outline'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
            onClick={handlePrevStep}
            disabled={loading}
          >
            이전
          </MGButton>
        )}
        {step < 4 ? (
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: false,
              className: 'mg-v2-btn--primary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
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
          </MGButton>
        ) : (
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading,
              className: 'mg-v2-btn--primary'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleCreateSchedule}
            loading={loading}
            preventDoubleClick={false}
          >
            스케줄 생성
          </MGButton>
        )}
      </>
    );

    const renderStepper = () => {
        const steps = [
            { id: 1, title: '상담사 선택', icon: ICONS.USER_SQUARE },
            { id: 2, title: '내담자 선택', icon: ICONS.USERS },
            { id: 3, title: '시간 선택', icon: ICONS.CLOCK },
            { id: 4, title: '세부사항', icon: ICONS.FILE_TEXT }
        ];

        return (
            <div className="mg-v2-ad-stepper">
                {steps.map((s, index) => {
                    const StepIcon = s.icon;
                    const isCompleted = step > s.id;
                    const isCurrent = step === s.id;
                    
                    let statusClass = 'pending';
                    if (isCompleted) statusClass = 'completed';
                    if (isCurrent) statusClass = 'current';

                    return (
                        <React.Fragment key={s.id}>
                            <div className={`mg-v2-ad-stepper__item ${statusClass}`}>
                                <div className="mg-v2-ad-stepper__icon">
                                    {isCompleted ? <CheckIcon size={18} strokeWidth={2.5} /> : <StepIcon size={18} strokeWidth={isCurrent ? 2.5 : 2} />}
                                </div>
                                <span className="mg-v2-ad-stepper__title"><SafeText>{s.title}</SafeText></span>
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
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title="스케줄 생성"
            subtitle={formatSubtitle()}
            size="large"
            backdropClick={true}
            showCloseButton={true}
            loading={loading}
            className="mg-v2-ad-b0kla"
            actions={renderActions()}
        >
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
                                    selectedDate={effectiveSelectedDate}
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

                    {/* 3단계: 시간 선택 (B0KlA 아토믹) */}
                    {step === 3 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">시간 선택</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <ScheduleTimeSelectionPanel
                                    isActive={isOpen && step === 3}
                                    date={effectiveSelectedDate}
                                    consultantId={selectedConsultant?.originalId || selectedConsultant?.id}
                                    consultationType={consultationType}
                                    onConsultationTypeChange={setConsultationType}
                                    selectedDuration={selectedDuration}
                                    onDurationChange={setSelectedDuration}
                                    selectedTimeSlot={selectedTimeSlot}
                                    onTimeSlotSelect={handleTimeSlotSelect}
                                    onCodeOptionsLoaded={handleCodeOptionsLoaded}
                                />
                            </div>
                        </div>
                    )}

                    {/* 4단계: 스케줄 세부사항 (B0KlA 아토믹) */}
                    {step === 4 && (
                        <div className="mg-v2-ad-section-block">
                            <div className="mg-v2-ad-section-block__header">
                                <h3 className="mg-v2-ad-section-block__title">스케줄 세부사항</h3>
                            </div>
                            <div className="mg-v2-ad-section-block__content">
                                <div className="mg-v2-ad-details-step">
                                    <div className="mg-v2-ad-details-summary">
                                        <div className="mg-v2-ad-details-summary__row">
                                            <span className="mg-v2-ad-details-summary__label">상담사:</span>
                                            <span className="mg-v2-ad-details-summary__value"><SafeText>{selectedConsultant?.name}</SafeText></span>
                                        </div>
                                        <div className="mg-v2-ad-details-summary__row">
                                            <span className="mg-v2-ad-details-summary__label">내담자:</span>
                                            <span className="mg-v2-ad-details-summary__value"><SafeText>{selectedClient?.name}</SafeText></span>
                                        </div>
                                        <div className="mg-v2-ad-details-summary__row">
                                            <span className="mg-v2-ad-details-summary__label">시간:</span>
                                            <span className="mg-v2-ad-details-summary__value">
                                                <SafeText>{selectedTimeSlot?.time}</SafeText> - <SafeText>{selectedTimeSlot?.endTime}</SafeText> ({getDurationFromCode(selectedDuration)}분)
                                            </span>
                                        </div>
                                        <div className="mg-v2-ad-details-summary__row mg-v2-ad-details-summary__row--highlight">
                                            <span className="mg-v2-ad-details-summary__label">유형:</span>
                                            <span className="mg-v2-ad-details-summary__value"><SafeText>{convertConsultationTypeToKorean(consultationType)}</SafeText></span>
                                        </div>
                                    </div>
                                    <div className="mg-v2-ad-details-step__form-group">
                                        <label className="mg-v2-ad-details-step__label" htmlFor="schedule-title">제목</label>
                                        <input
                                            id="schedule-title"
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="스케줄 제목 (선택사항)"
                                            className="mg-v2-ad-details-step__input"
                                        />
                                    </div>
                                    <div className="mg-v2-ad-details-step__form-group">
                                        <label className="mg-v2-ad-details-step__label" htmlFor="schedule-description">설명</label>
                                        <textarea
                                            id="schedule-description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="추가 설명 (선택사항)"
                                            rows={3}
                                            className="mg-v2-ad-details-step__textarea"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
        </UnifiedModal>
    );
};

export default ScheduleModalNew;
