import { useEffect, useState, useCallback } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';
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
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';

const TITLE = '예약 변경';
const LABEL_DATE = '날짜';
const LABEL_START = '시작';
const LABEL_END = '종료';
const BTN_SAVE = '저장';
const BTN_CANCEL = '취소';
const SUCCESS_MSG = '예약 시간이 변경되었습니다.';
const ERR_END_BEFORE_START = '종료 시간은 시작 시간보다 이후여야 합니다.';
const ERR_PAST_DATE = '과거 날짜로는 예약을 변경할 수 없습니다.';
const ERR_CONFLICT = '해당 시간대에 이미 예약 또는 휴가가 있어 변경할 수 없습니다.';
const ERR_INCOMPLETE = '일정 정보가 불완전합니다. 캘린더에서 다시 열어주세요.';
const SAVING = '저장 중…';
const HM_LEN = 5;

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
  const [startHm, setStartHm] = useState('09:00');
  const [endHm, setEndHm] = useState('10:00');
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

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
    setStartHm(toHm(schedulePayload.apiStartTime ?? schedulePayload.startTime));
    setEndHm(toHm(schedulePayload.apiEndTime ?? schedulePayload.endTime));
    setErrors([]);
  }, [isOpen, schedulePayload, toHm]);

  const validate = useCallback(() => {
    const next = [];
    if (!schedulePayload?.id || !dateStr) {
      next.push(ERR_INCOMPLETE);
      return next;
    }
    const startD = combineDateAndTimeHm(dateStr, startHm);
    const endD = combineDateAndTimeHm(dateStr, endHm);
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
  }, [schedulePayload, dateStr, startHm, endHm, events]);

  async function handleSave() {
    const v = validate();
    setErrors(v);
    if (v.length > 0) {
      return;
    }
    const startD = combineDateAndTimeHm(dateStr, startHm);
    const endD = combineDateAndTimeHm(dateStr, endHm);
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
          <button
            type="button"
            className="mg-v2-btn--outline"
            onClick={onClose}
            disabled={saving}
          >
            {BTN_CANCEL}
          </button>
          <button
            type="button"
            className="mg-v2-btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? SAVING : BTN_SAVE}
          </button>
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
              setErrors([]);
            }}
            disabled={saving}
          />
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="reschedule-modal-start">{LABEL_START}</label>
          <input
            id="reschedule-modal-start"
            type="time"
            className="mg-v2-input"
            value={startHm}
            onChange={(e) => {
              setStartHm(e.target.value);
              setErrors([]);
            }}
            disabled={saving}
          />
        </div>
        <div className="mg-form-group">
          <label className="mg-v2-label" htmlFor="reschedule-modal-end">{LABEL_END}</label>
          <input
            id="reschedule-modal-end"
            type="time"
            className="mg-v2-input"
            value={endHm}
            onChange={(e) => {
              setEndHm(e.target.value);
              setErrors([]);
            }}
            disabled={saving}
          />
        </div>
      </div>
    </UnifiedModal>
  );
};

export default RescheduleScheduleModal;
