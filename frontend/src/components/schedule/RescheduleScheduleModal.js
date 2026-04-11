import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import {
  buildScheduleDatetimeUpdateBody,
  combineDateAndTimeHm,
  hasConsultantScheduleTimeOverlap,
  isPastDateOnly
} from '../../utils/scheduleRescheduleUtils';
import ScheduleTimeSelectionPanel from './ScheduleTimeSelectionPanel';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';

const TITLE = '예약 변경';
const LABEL_DATE = '날짜';
const BTN_SAVE = '저장';
const BTN_CANCEL = '취소';
const SUCCESS_MSG = '예약 시간이 변경되었습니다.';
const ERR_END_BEFORE_START = '종료 시간은 시작 시간보다 이후여야 합니다.';
const ERR_PAST_DATE = '과거 날짜로는 예약을 변경할 수 없습니다.';
const ERR_CONFLICT = '해당 시간대에 이미 예약 또는 휴가가 있어 변경할 수 없습니다.';
const ERR_INCOMPLETE = '일정 정보가 불완전합니다. 캘린더에서 다시 열어주세요.';
const ERR_SLOT_REQUIRED = '시간대를 선택해주세요.';
const SAVING = '저장 중…';
const HM_LEN = 5;
const DEFAULT_DURATION_CODE = '50_MIN';

/**
 * @param {string} ymd YYYY-MM-DD
 * @returns {Date} 로컬 자정 기준 Date
 */
function parseYmdToLocalDate(ymd) {
  const parts = String(ymd || '').split('-');
  if (parts.length !== 3) return new Date();
  const y = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return new Date();
  return new Date(y, mo - 1, d);
}

function hmToMinutes(hm) {
  const [h, m] = String(hm || '00:00').split(':').map((n) => parseInt(n, 10));
  const hh = Number.isFinite(h) ? h : 0;
  const mm = Number.isFinite(m) ? m : 0;
  return hh * 60 + mm;
}

function hmRangeMinutes(startHm, endHm) {
  return Math.max(0, hmToMinutes(endHm) - hmToMinutes(startHm));
}

function pickDurationCodeFromMinutes(minutes, durationOptions) {
  if (!durationOptions?.length) return DEFAULT_DURATION_CODE;
  const exact = durationOptions.find((o) => o.durationMinutes === minutes);
  if (exact) return exact.value;
  let closest = durationOptions[0];
  let bestDiff = Math.abs((closest.durationMinutes ?? 0) - minutes);
  for (let i = 1; i < durationOptions.length; i += 1) {
    const o = durationOptions[i];
    const diff = Math.abs((o.durationMinutes ?? 0) - minutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = o;
    }
  }
  return closest.value;
}

/**
 * 관리자·지점수퍼관리자용 스케줄 재예약 폼 (UnifiedModal + B0KlA)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {Object|null} props.schedulePayload handleEventClick에서 채운 객체 (id, consultantId, apiDate, apiStartTime, apiEndTime, title)
 * @param {Array} props.events 캘린더 이벤트 (충돌 검사)
 * @param {function} props.onSuccess 저장 성공 후 콜백 (목록 갱신 등)
 * @author CoreSolution
 * @since 2026-04-02
 */
const RescheduleScheduleModal = ({
  isOpen,
  onClose,
  schedulePayload,
  events = [],
  onSuccess
}) => {
  const [dateStr, setDateStr] = useState('');
  const [consultationType, setConsultationType] = useState('INDIVIDUAL');
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION_CODE);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const schedulePayloadRef = useRef(schedulePayload);
  schedulePayloadRef.current = schedulePayload;

  const toHm = useCallback((v) => {
    if (v == null || v === '') {
      return '09:00';
    }
    const s = String(v);
    const part = s.includes('T') ? s.split('T')[1] || '' : s;
    const noMs = part.split('.')[0];
    const hm = noMs.slice(0, HM_LEN);
    return /^\d{2}:\d{2}$/.test(hm) ? hm : '09:00';
  }, []);

  useEffect(() => {
    if (!isOpen || !schedulePayload) {
      return;
    }
    const d = schedulePayload.apiDate || schedulePayload.date || schedulePayload.sessionDate || '';
    setDateStr(d);
    setConsultationType(schedulePayload.consultationTypeCode || 'INDIVIDUAL');
    const sHm = toHm(schedulePayload.apiStartTime ?? schedulePayload.startTime);
    const eHm = toHm(schedulePayload.apiEndTime ?? schedulePayload.endTime);
    setSelectedTimeSlot({ id: `slot-${sHm}`, time: sHm, endTime: eHm });
    setSelectedDuration(DEFAULT_DURATION_CODE);
    setErrors([]);
  }, [isOpen, schedulePayload, toHm]);

  const handleCodeOptionsLoaded = useCallback(({ durationOptions }) => {
    const p = schedulePayloadRef.current;
    if (!p?.id || !durationOptions?.length) return;
    const sHm = toHm(p.apiStartTime ?? p.startTime);
    const eHm = toHm(p.apiEndTime ?? p.endTime);
    const minutes = hmRangeMinutes(sHm, eHm);
    if (minutes <= 0) return;
    setSelectedDuration(pickDurationCodeFromMinutes(minutes, durationOptions));
  }, [toHm]);

  const handleDurationChange = useCallback((val) => {
    setSelectedDuration(val);
    setSelectedTimeSlot(null);
  }, []);

  const handleConsultationTypeChange = useCallback((val) => {
    setConsultationType(val);
    setSelectedTimeSlot(null);
  }, []);

  const gridDate = useMemo(() => parseYmdToLocalDate(dateStr), [dateStr]);

  const validate = useCallback(() => {
    const next = [];
    if (!schedulePayload?.id || !dateStr) {
      next.push(ERR_INCOMPLETE);
      return next;
    }
    if (!selectedTimeSlot?.time || !selectedTimeSlot?.endTime) {
      next.push(ERR_SLOT_REQUIRED);
      return next;
    }
    const startD = combineDateAndTimeHm(dateStr, selectedTimeSlot.time);
    const endD = combineDateAndTimeHm(dateStr, selectedTimeSlot.endTime);
    if (Number.isNaN(startD.getTime()) || Number.isNaN(endD.getTime())) {
      next.push(ERR_INCOMPLETE);
      return next;
    }
    if (isPastDateOnly(startD)) {
      next.push(ERR_PAST_DATE);
    }
    if (endD.getTime() <= startD.getTime()) {
      next.push(ERR_END_BEFORE_START);
    }
    if (
      hasConsultantScheduleTimeOverlap(
        events,
        schedulePayload.id,
        schedulePayload.consultantId,
        startD,
        endD
      )
    ) {
      next.push(ERR_CONFLICT);
    }
    return next;
  }, [schedulePayload, dateStr, selectedTimeSlot, events]);

  async function handleSave() {
    const v = validate();
    setErrors(v);
    if (v.length > 0) {
      return;
    }
    const startD = combineDateAndTimeHm(dateStr, selectedTimeSlot.time);
    const endD = combineDateAndTimeHm(dateStr, selectedTimeSlot.endTime);
    const body = buildScheduleDatetimeUpdateBody(startD, endD);
    setSaving(true);
    try {
      await StandardizedApi.put(`/api/v1/schedules/${schedulePayload.id}`, body);
      notificationManager.success(SUCCESS_MSG);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      console.error('예약 변경 실패:', e);
      notificationManager.error(e?.message || '예약 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const subtitleTitle = schedulePayload ? toDisplayString(schedulePayload.title, '') : '';

  if (!isOpen || !schedulePayload) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title={TITLE}
      subtitle={subtitleTitle ? String(subtitleTitle) : undefined}
      size="large"
      variant="form"
      backdropClick={!saving}
      showCloseButton={!saving}
      zIndex={1200}
      className="mg-v2-ad-b0kla"
      loading={saving}
      actions={
        <>
          <MGButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="mg-v2-btn--outline"
            preventDoubleClick={false}
          >
            {BTN_CANCEL}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            loading={saving}
            loadingText={SAVING}
            className="mg-v2-btn--primary"
          >
            {BTN_SAVE}
          </MGButton>
        </>
      }
    >
      <div className="mg-v2-reschedule-modal mg-v2-ad-b0kla__card mg-v2-ad-modal__section">
        <div
          id="reschedule-modal-error-summary"
          className="mg-v2-ad-modal__section"
          aria-live="polite"
          role="alert"
        >
          {errors.length > 0 && (
            <ul className="mg-v2-reschedule-modal__errors">
              {errors.map((msg) => (
                <li key={msg}><SafeText>{msg}</SafeText></li>
              ))}
            </ul>
          )}
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="reschedule-modal-date">{LABEL_DATE}</label>
          <input
            id="reschedule-modal-date"
            type="date"
            className="mg-v2-input"
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value);
              setSelectedTimeSlot(null);
              setErrors([]);
            }}
            disabled={saving}
          />
        </div>
        <div className="mg-v2-ad-section-block mg-v2-ad-modal__section">
          <div className="mg-v2-ad-section-block__header">
            <h3 className="mg-v2-ad-section-block__title">시간 선택</h3>
          </div>
          <div className="mg-v2-ad-section-block__content">
            <ScheduleTimeSelectionPanel
              isActive={isOpen && Boolean(schedulePayload)}
              date={gridDate}
              consultantId={schedulePayload.consultantId}
              consultationType={consultationType}
              onConsultationTypeChange={handleConsultationTypeChange}
              selectedDuration={selectedDuration}
              onDurationChange={handleDurationChange}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotSelect={(slot) => {
                setSelectedTimeSlot(slot);
                setErrors([]);
              }}
              excludeScheduleId={schedulePayload.id}
              onCodeOptionsLoaded={handleCodeOptionsLoaded}
            />
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
};

export default RescheduleScheduleModal;
