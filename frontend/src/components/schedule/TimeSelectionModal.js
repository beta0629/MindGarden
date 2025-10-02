import React, { useState, useEffect } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';
import CustomSelect from '../common/CustomSelect';

/**
 * 드래그앤드롭 시 시간 선택 모달 컴포넌트
 * - 상담 유형 선택
 * - 상담 시간 선택
 * - 사용 가능한 시간대 표시
 * - 시간대 선택 기능
 * 
 * @param {object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {object} props.selectedSchedule - 선택된 스케줄 데이터
 * @param {function} props.onScheduleUpdate - 스케줄 업데이트 핸들러
 * @param {array} props.availableTimes - 사용 가능한 시간대 목록
 * @param {function} props.isTimeSlotBooked - 시간대 예약 여부 확인 함수
 * @param {function} props.onConfirm - 확인 버튼 클릭 핸들러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-02
 */
const TimeSelectionModal = ({
    isOpen,
    onClose,
    selectedSchedule,
    onScheduleUpdate,
    availableTimes = [],
    isTimeSlotBooked,
    onConfirm
}) => {
    const [localSchedule, setLocalSchedule] = useState(selectedSchedule || {});

    useEffect(() => {
        if (selectedSchedule) {
            setLocalSchedule(selectedSchedule);
        }
    }, [selectedSchedule]);

    // 상담 유형 옵션
    const consultationTypeOptions = [
        { value: 'INDIVIDUAL', label: '개인상담 (INDIVIDUAL)' },
        { value: 'COUPLE', label: '부부상담 (COUPLE)' },
        { value: 'FAMILY', label: '가족상담 (FAMILY)' },
        { value: 'INITIAL', label: '초기상담 (INITIAL)' },
        { value: 'GROUP', label: '그룹상담 (GROUP)' }
    ];

    // 상담 시간 옵션
    const durationOptions = [
        { value: '30', label: '30분 (30분)' },
        { value: '50', label: '50분 (50분)' },
        { value: '80', label: '80분 (80분)' },
        { value: '100', label: '100분 (100분)' }
    ];

    /**
     * 상담 유형 변경 핸들러
     */
    const handleConsultationTypeChange = (value) => {
        const updatedSchedule = {
            ...localSchedule,
            consultationType: value
        };
        setLocalSchedule(updatedSchedule);
        onScheduleUpdate?.(updatedSchedule);
    };

    /**
     * 상담 시간 변경 핸들러
     */
    const handleDurationChange = (value) => {
        const updatedSchedule = {
            ...localSchedule,
            duration: value
        };
        setLocalSchedule(updatedSchedule);
        onScheduleUpdate?.(updatedSchedule);
    };

    /**
     * 시간대 선택 핸들러
     */
    const handleTimeSlotSelect = (timeSlot) => {
        const isBooked = isTimeSlotBooked?.(timeSlot.startTime, timeSlot.endTime);
        
        if (!isBooked) {
            const updatedSchedule = {
                ...localSchedule,
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime
            };
            setLocalSchedule(updatedSchedule);
            onScheduleUpdate?.(updatedSchedule);
        }
    };

    /**
     * 확인 버튼 클릭 핸들러
     */
    const handleConfirm = () => {
        onConfirm?.(localSchedule);
    };

    if (!isOpen || !selectedSchedule) {
        return null;
    }

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title="시간을 선택하세요"
            size="medium"
        >
            {/* 상담 유형 선택 */}
            <div className="time-selection-field">
                <label className="time-selection-label">상담 유형</label>
                <CustomSelect
                    value={localSchedule.consultationType || 'INDIVIDUAL'}
                    onChange={handleConsultationTypeChange}
                    options={consultationTypeOptions}
                    placeholder="상담 유형을 선택하세요"
                />
            </div>

            {/* 상담 시간 선택 */}
            <div className="time-selection-field">
                <label className="time-selection-label">상담 시간</label>
                <CustomSelect
                    value={localSchedule.duration || '50'}
                    onChange={handleDurationChange}
                    options={durationOptions}
                    placeholder="상담 시간을 선택하세요"
                />
            </div>

            {/* 사용 가능한 시간대 */}
            <div className="time-selection-field">
                <label className="time-selection-label">사용 가능한 시간대</label>
                <div className="time-slot-grid">
                    {availableTimes.map((timeSlot) => {
                        const isBooked = isTimeSlotBooked?.(timeSlot.startTime, timeSlot.endTime);
                        const isSelected = localSchedule.startTime === timeSlot.startTime;
                        
                        return (
                            <div
                                key={`${timeSlot.startTime}-${timeSlot.endTime}`}
                                className={`time-slot-card ${isSelected ? 'time-slot-card--selected' : ''} ${isBooked ? 'time-slot-card--booked' : ''}`}
                                onClick={() => handleTimeSlotSelect(timeSlot)}
                            >
                                <div className="time-slot-card__header">
                                    <div className={`time-slot-indicator ${isBooked ? 'time-slot-indicator--booked' : ''}`}>
                                        <span className="time-slot-indicator__text">
                                            {isBooked ? '×' : '가'}
                                        </span>
                                    </div>
                                    <span className="time-slot-time">
                                        {timeSlot.startTime}
                                    </span>
                                </div>
                                <div className="time-slot-duration">
                                    {localSchedule.duration || '50'}분
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className="mg-modal__actions mg-modal__actions--horizontal">
                <button
                    className="mg-btn mg-btn--secondary"
                    onClick={onClose}
                >
                    취소
                </button>
                <button
                    className="mg-btn mg-btn--primary"
                    onClick={handleConfirm}
                >
                    확인
                </button>
            </div>
        </UnifiedModal>
    );
};

export default TimeSelectionModal;
