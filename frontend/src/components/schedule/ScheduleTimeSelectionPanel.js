import React, { useState, useEffect, useCallback, useRef } from 'react';
import BadgeSelect from '../common/BadgeSelect';
import TimeSlotGrid from './TimeSlotGrid';
import StandardizedApi from '../../utils/standardizedApi';
import { toDisplayString } from '../../utils/safeDisplay';
import './ScheduleB0KlA.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';

/**
 * 스케줄 생성·재예약 공통: 상담 유형·상담 시간(BadgeSelect) + B0KlA TimeSlotGrid
 *
 * @param {boolean} props.isActive — true일 때 공통코드 로드
 * @param {Date} props.date — 로컬 날짜 Date (문자열 금지)
 * @param {string|number} props.consultantId
 * @param {string} props.consultationType
 * @param {function(string): void} props.onConsultationTypeChange
 * @param {string} props.selectedDuration — DURATION 코드값
 * @param {function(string): void} props.onDurationChange
 * @param {Object|null} props.selectedTimeSlot
 * @param {function(Object): void} props.onTimeSlotSelect
 * @param {string|number} [props.excludeScheduleId] — 재예약 시 본인 일정 충돌 제외
 * @param {function({consultationTypeOptions: Array, durationOptions: Array}): void} [props.onCodeOptionsLoaded]
 * @author CoreSolution
 * @since 2026-04-02
 */
const ScheduleTimeSelectionPanel = ({
  isActive,
  date,
  consultantId,
  consultationType,
  onConsultationTypeChange,
  selectedDuration,
  onDurationChange,
  selectedTimeSlot,
  onTimeSlotSelect,
  excludeScheduleId,
  onCodeOptionsLoaded
}) => {
  const [consultationTypeOptions, setConsultationTypeOptions] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const onCodeOptionsLoadedRef = useRef(onCodeOptionsLoaded);
  onCodeOptionsLoadedRef.current = onCodeOptionsLoaded;

  const getDurationFromCode = useCallback(
    (durationCode) => {
      if (!durationCode) return 60;
      const durationOption = durationOptions.find((option) => option.value === durationCode);
      if (durationOption) return durationOption.durationMinutes;
      return 60;
    },
    [durationOptions]
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    let cancelled = false;

    const FALLBACK_CONSULTATION = [
      { value: 'INDIVIDUAL', label: '개인상담', icon: null, color: 'var(--mg-primary-500)', durationMinutes: 50 },
      { value: 'FAMILY', label: '가족상담', icon: null, color: 'var(--mg-success-500)', durationMinutes: 100 },
      { value: 'INITIAL', label: '초기상담', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 60 },
      { value: 'COUPLE', label: '부부상담', icon: null, color: 'var(--mg-pink-500)', durationMinutes: 80 },
      { value: 'GROUP', label: '집단상담', icon: null, color: 'var(--mg-purple-500)', durationMinutes: 90 }
    ];

    const FALLBACK_DURATION = [
      { value: '30_MIN', label: '30분', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 30, description: '30분 상담' },
      { value: '50_MIN', label: '50분', icon: null, color: 'var(--mg-primary-500)', durationMinutes: 50, description: '50분 상담' },
      { value: '60_MIN', label: '60분', icon: null, color: 'var(--mg-success-500)', durationMinutes: 60, description: '60분 상담' },
      { value: '80_MIN', label: '80분', icon: null, color: 'var(--mg-pink-500)', durationMinutes: 80, description: '80분 상담' },
      { value: '90_MIN', label: '90분', icon: null, color: 'var(--mg-purple-500)', durationMinutes: 90, description: '90분 상담' },
      { value: '100_MIN', label: '100분', icon: null, color: 'var(--mg-warning-500)', durationMinutes: 100, description: '100분 상담' },
      { value: '120_MIN', label: '120분', icon: null, color: 'var(--mg-error-500)', durationMinutes: 120, description: '120분 상담' },
      { value: 'CUSTOM', label: '사용자 정의', icon: null, color: 'var(--mg-gray-500)', durationMinutes: 0, description: '사용자가 직접 설정하는 상담 시간' }
    ];

    const mapConsultationResponse = (response) => {
      if (!response || response.length === 0) return FALLBACK_CONSULTATION;
      return response.map((code) => {
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
    };

    const mapDurationResponse = (response) => {
      if (!response || response.length === 0) return FALLBACK_DURATION;
      return response.map((code) => {
        let durationMinutes = 60;
        if (code.extraData) {
          try {
            const extraData = JSON.parse(code.extraData);
            durationMinutes =
              extraData.durationMinutes || parseInt(code.codeValue.replace('_MIN', ''), 10) || 60;
          } catch (e) {
            console.warn('extraData 파싱 실패:', code.extraData);
            durationMinutes = parseInt(code.codeValue.replace('_MIN', ''), 10) || 60;
          }
        } else {
          durationMinutes = parseInt(code.codeValue.replace('_MIN', ''), 10) || 60;
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
    };

    const loadAll = async () => {
      setLoadingCodes(true);
      let nextConsultation = FALLBACK_CONSULTATION;
      let nextDuration = FALLBACK_DURATION;
      try {
        const [typeRes, durRes] = await Promise.all([
          StandardizedApi.get('/api/v1/common-codes/groups/CONSULTATION_TYPE'),
          StandardizedApi.get('/api/v1/common-codes/groups/DURATION')
        ]);
        if (cancelled) return;
        try {
          nextConsultation = mapConsultationResponse(typeRes);
        } catch (e) {
          console.error('상담 유형 코드 매핑 실패:', e);
        }
        try {
          nextDuration = mapDurationResponse(durRes);
        } catch (e) {
          console.error('상담 시간 코드 매핑 실패:', e);
        }
      } catch (error) {
        console.error('공통코드 로드 실패:', error);
      } finally {
        // no-unsafe-finally: finally 안에서는 return 금지 — 언마운트 시 상태 갱신만 생략
        if (!cancelled) {
          setConsultationTypeOptions(nextConsultation);
          setDurationOptions(nextDuration);
          if (onCodeOptionsLoadedRef.current) {
            onCodeOptionsLoadedRef.current({
              consultationTypeOptions: nextConsultation,
              durationOptions: nextDuration
            });
          }
        }
        setLoadingCodes(false);
      }
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="mg-v2-ad-time-step">
      <div className="mg-v2-ad-time-step__intro">
        <p className="mg-v2-ad-time-step__subtitle">상담 유형과 시간을 선택한 뒤 시간대를 골라주세요.</p>
        <p className="mg-v2-ad-time-step__note">휴가·기존 일정과 겹치지 않는 시간만 표시됩니다.</p>
      </div>
      <div className="mg-v2-ad-time-step__form-row">
        <div className="mg-v2-ad-time-step__form-group">
          <label className="mg-v2-ad-time-step__label" htmlFor="schedule-consultation-type">상담 유형</label>
          <BadgeSelect
            value={consultationType}
            onChange={(val) => onConsultationTypeChange(val)}
            options={consultationTypeOptions.map((option) => ({
              value: option.value,
              label: `${toDisplayString(option.label, '—')} (${toDisplayString(option.value, '')})`
            }))}
            placeholder="선택하세요"
            disabled={loadingCodes}
            className="mg-v2-form-badge-select mg-v2-ad-time-step__select"
          />
        </div>
        <div className="mg-v2-ad-time-step__form-group">
          <label className="mg-v2-ad-time-step__label" htmlFor="schedule-duration">상담 시간</label>
          <BadgeSelect
            value={selectedDuration}
            onChange={(val) => onDurationChange(val)}
            options={durationOptions.map((option) => ({
              value: option.value,
              label: `${toDisplayString(option.label, '—')} (${toDisplayString(option.durationMinutes, '0')}분)`
            }))}
            placeholder="선택하세요"
            disabled={loadingCodes}
            className="mg-v2-form-badge-select mg-v2-ad-time-step__select"
          />
        </div>
      </div>
      <TimeSlotGrid
        date={date}
        consultantId={consultantId}
        duration={getDurationFromCode(selectedDuration)}
        onTimeSlotSelect={onTimeSlotSelect}
        selectedTimeSlot={selectedTimeSlot}
        variant="b0kla"
        excludeScheduleId={excludeScheduleId}
      />
    </div>
  );
};

export default ScheduleTimeSelectionPanel;
