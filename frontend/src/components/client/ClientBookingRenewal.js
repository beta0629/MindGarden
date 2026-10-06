/**
 * ClientBookingRenewal — 예약하기 리뉴얼 (4단계 스텝 플로우)
 *
 * Step 1: 상담사 선택, Step 2: 시간 선택, Step 3: 신청 확인, Step 4: 완료
 * ClientAppShell 레이아웃 내에서 렌더링.
 * 내담자 직접 예약은 가예약으로 접수되고 센터 확정 후 확정된다. 회기 차감은 결제 후에만.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Check, Calendar, Search
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeUtils';
import {
  buildClientBookingPayload,
  expandAvailabilityForDate,
  pickDefaultConsultationType
} from '../../utils/clientBookingRequest';
import { CLIENT_BOOKING_API } from '../../constants/api';
import { CONSULTATION_TYPE_CODE_GROUP } from '../../constants/schedule';
import Avatar from '../common/Avatar';
import './ClientBookingRenewal.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTANTS = '/api/v1/consultants';

const STEP_LABELS = ['상담사 선택', '시간 선택', '신청 확인', '완료'];
const SPECIALTY_FILTERS = ['전체', '우울', '불안', '대인관계', '자존감', '스트레스', '진로'];
const SORT_OPTIONS = [
  { key: 'rating', label: '평점순' },
  { key: 'name', label: '이름순' }
];

const toLocalDateStr = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const generateDateRange = (days = 7) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateStr: toLocalDateStr(d),
      weekday: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      day: d.getDate()
    });
  }
  return dates;
};

const ClientBookingRenewal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [specialtyFilter, setSpecialtyFilter] = useState('전체');
  const [sortBy, setSortBy] = useState('rating');

  const [dateRange] = useState(() => generateDateRange(7));
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [consultationType, setConsultationType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadConsultants = useCallback(async() => {
    try {
      setLoading(true);
      const res = await TenantAwareApiClient.get(API_CONSULTANTS, { status: 'ACTIVE' });
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      setConsultants(data);
    } catch (err) {
      console.error('상담사 목록 로드 실패:', err);
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultants();
  }, [loadConsultants]);

  useEffect(() => {
    let cancelled = false;
    getCommonCodes(CONSULTATION_TYPE_CODE_GROUP)
      .then((codes) => {
        if (!cancelled) setConsultationType(pickDefaultConsultationType(codes));
      })
      .catch(() => {
        if (!cancelled) setConsultationType(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTimeSlots = useCallback(async(consultantId, dateStr) => {
    if (!consultantId || !dateStr) return;
    try {
      const res = await TenantAwareApiClient.get(
        `/api/v1/consultants/${consultantId}/availability`
      );
      setTimeSlots(expandAvailabilityForDate(res, dateStr));
    } catch (err) {
      console.error('상담 가능 시간 로드 실패:', err);
      setTimeSlots([]);
    }
  }, []);

  useEffect(() => {
    setSelectedSlot(null);
    if (selectedConsultant && selectedDate) {
      const cId = selectedConsultant.id || selectedConsultant.consultantId;
      loadTimeSlots(cId, selectedDate);
    }
  }, [selectedConsultant, selectedDate, loadTimeSlots]);

  const filteredConsultants = consultants
    .filter((c) => {
      if (specialtyFilter === '전체') return true;
      const spec = c.specialization || c.specialty || '';
      return spec.includes(specialtyFilter);
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleSubmit = async() => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const cId = selectedConsultant?.id || selectedConsultant?.consultantId;
      await StandardizedApi.post(
        CLIENT_BOOKING_API.CREATE,
        buildClientBookingPayload({
          consultantId: cId,
          date: selectedDate,
          slot: selectedSlot,
          consultationType: consultationType?.value
        })
      );
      showToast({ message: '예약 신청이 접수되었습니다. 센터 확정 후 안내드립니다.', type: 'success' });
      setStep(4);
    } catch (err) {
      console.error('예약 신청 실패:', err);
      showToast({
        message: err?.message || '예약 신청에 실패했습니다. 다시 시도해주세요.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!selectedConsultant;
    if (step === 2) return !!selectedDate && !!selectedSlot;
    if (step === 3) return !!consultationType?.value && !!selectedSlot;
    return false;
  };

  const progressPercent = (step / STEP_LABELS.length) * 100;

  const renderSkeleton = () => (
    <div className="client-booking__skeleton" aria-busy="true">
      <div className="client-booking__skeleton-block client-booking__skeleton-card" />
      <div className="client-booking__skeleton-block client-booking__skeleton-card" />
      <div className="client-booking__skeleton-block client-booking__skeleton-card" />
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 className="client-booking__step-title">상담사를 선택해주세요</h2>

      <div className="client-booking__filter-row" role="toolbar" aria-label="전문분야 필터">
        {SPECIALTY_FILTERS.map((f) => (
          <button
            key={f}
            className={`client-booking__filter-chip ${
              specialtyFilter === f ? 'client-booking__filter-chip--active' : ''
            }`}
            onClick={() => setSpecialtyFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="client-booking__sort-row">
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.key}
            className={`client-booking__sort-btn ${
              sortBy === s.key ? 'client-booking__sort-btn--active' : ''
            }`}
            onClick={() => setSortBy(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && renderSkeleton()}
      {!loading && filteredConsultants.length === 0 && (
        <div className="client-booking__empty">
          <Search size={48} className="client-booking__empty-icon" aria-hidden />
          <p>해당 분야의 상담사가 없습니다</p>
        </div>
      )}
      {!loading && filteredConsultants.length > 0 && (
        <div className="client-booking__consultant-list" role="radiogroup" aria-label="상담사 목록">
          {filteredConsultants.map((c) => {
            const cId = c.id || c.consultantId;
            const selected = selectedConsultant && (selectedConsultant.id || selectedConsultant.consultantId) === cId;
            return (
              <div
                key={cId}
                className={`client-booking__consultant-card ${
                  selected ? 'client-booking__consultant-card--selected' : ''
                }`}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => setSelectedConsultant(c)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedConsultant(c)}
              >
                <div className="client-booking__consultant-top">
                  <div className="client-booking__consultant-avatar">
                    <Avatar
                      profileImageUrl={c.profileImageUrl}
                      displayName={c.name || c.consultantName || '상담사'}
                      alt={c.name || '상담사'}
                    />
                  </div>
                  <div className="client-booking__consultant-info">
                    <h3 className="client-booking__consultant-name">
                      {c.name || c.consultantName || '상담사'}
                    </h3>
                    <div className="client-booking__consultant-rating">
                      <Star size={14} fill="currentColor" aria-hidden />
                      {(c.rating || 0).toFixed(1)}
                      <span className="client-booking__consultant-rating-count">
                        ({c.reviewCount || 0}개 리뷰)
                      </span>
                    </div>
                  </div>
                </div>
                <p className="client-booking__consultant-specialty">
                  전문분야: {c.specialization || c.specialty || '상담'}
                </p>
                {c.introduction && (
                  <p className="client-booking__consultant-intro">{c.introduction}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const getFooterLabel = () => {
    if (step === 3) return submitting ? '처리 중...' : '예약 신청';
    return '다음 단계로';
  };

  const renderStep2 = () => (
    <div>
      <h2 className="client-booking__step-title">
        날짜와 시간을 선택해주세요
      </h2>

      <div className="client-booking__date-scroll" role="radiogroup" aria-label="날짜 선택">
        {dateRange.map((d) => (
          <button
            key={d.dateStr}
            className={`client-booking__date-item ${
              selectedDate === d.dateStr ? 'client-booking__date-item--selected' : ''
            }`}
            role="radio"
            aria-checked={selectedDate === d.dateStr}
            onClick={() => {
              setSelectedDate(d.dateStr);
            }}
          >
            <span className="client-booking__date-weekday">{d.weekday}</span>
            <span className="client-booking__date-day">{d.day}</span>
          </button>
        ))}
      </div>

      {selectedDate && (
        <>
          <p className="client-booking__time-label">가용 시간</p>
          <div className="client-booking__time-slots" role="radiogroup" aria-label="시간 선택">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  className={`client-booking__time-chip ${
                    isSelected ? 'client-booking__time-chip--selected' : ''
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.startTime}
                </button>
              );
            })}
          </div>
          {timeSlots.length === 0 && (
            <p className="client-booking__empty-slots">선택한 날짜에 상담 가능한 시간이 없습니다.</p>
          )}
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 className="client-booking__step-title">예약 확인</h2>

      <div className="client-booking__summary-card">
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">{t('common.labels.consultant')}</span>
          <span className="client-booking__summary-value">
            {selectedConsultant?.name || selectedConsultant?.consultantName || '-'}
          </span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">날짜</span>
          <span className="client-booking__summary-value">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })
              : '-'}
          </span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">시간</span>
          <span className="client-booking__summary-value">
            {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : '-'}
          </span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">상담 유형</span>
          <span className="client-booking__summary-value">{consultationType?.label || '-'}</span>
        </div>
      </div>

      <p className="client-booking__notice">
        예약 신청은 가예약으로 접수되며 센터 확정 후 예약이 확정됩니다. 회기는 결제 완료 후에 차감됩니다.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="client-booking__complete">
      <div className="client-booking__check-circle">
        <Check size={40} aria-hidden />
      </div>
      <h2 className="client-booking__complete-title">예약 신청이 접수되었습니다</h2>
      <p className="client-booking__notice">센터 확정 후 예약이 확정됩니다.</p>

      <div className="client-booking__complete-info">
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">{t('common.labels.consultant')}</span>
          <span className="client-booking__summary-value">
            {selectedConsultant?.name || selectedConsultant?.consultantName || '-'}
          </span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">일시</span>
          <span className="client-booking__summary-value">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })
              : '-'}{' '}
            {selectedSlot?.startTime || ''}
          </span>
        </div>
      </div>

      <div className="client-booking__complete-actions">
        <button
          className="client-booking__complete-btn client-booking__complete-btn--primary"
          onClick={() => navigate('/client/session-management')}
        >
          <Calendar size={18} aria-hidden /> 캘린더에 추가
        </button>
        <button
          className="client-booking__complete-btn client-booking__complete-btn--outline"
          onClick={() => navigate('/client/dashboard')}
        >
          홈으로
        </button>
      </div>
    </div>
  );

  return (
    <div className="client-booking">
      {step < 4 && (
        <div className="client-booking__stepper">
          <div className="client-booking__progress-bar">
            <div
              className="client-booking__progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="client-booking__step-labels">
            {STEP_LABELS.map((label, idx) => {
              let stepClass = '';
              if (idx + 1 === step) stepClass = 'client-booking__step-label--active';
              else if (idx + 1 < step) stepClass = 'client-booking__step-label--done';
              return (
                <span
                  key={label}
                  className={`client-booking__step-label ${stepClass}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="client-booking__content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {step < 4 && (
        <div className="client-booking__footer">
          <button
            className="client-booking__footer-btn"
            disabled={!canProceed() || submitting}
            onClick={step === 3 ? handleSubmit : handleNext}
          >
            {getFooterLabel()}
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientBookingRenewal;
