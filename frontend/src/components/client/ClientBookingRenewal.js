/**
 * ClientBookingRenewal — 예약하기 리뉴얼 (4단계 스텝 플로우)
 *
 * Step 1: 상담사 선택, Step 2: 시간 선택, Step 3: 결제/확인, Step 4: 완료
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Star, Check, Calendar, Search
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ClientBookingRenewal.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTANTS = '/api/v1/consultants';
const API_CONSULTATIONS = '/api/v1/consultations';


const STEP_LABELS = ['상담사 선택', '시간 선택', '결제 확인', '완료'];
const SPECIALTY_FILTERS = ['전체', '우울', '불안', '대인관계', '자존감', '스트레스', '진로'];
const SORT_OPTIONS = [
  { key: 'rating', label: '평점순' },
  { key: 'name', label: '이름순' },
];

const PAYMENT_OPTIONS = [
  { key: 'session', label: '보유 회기 차감' },
  { key: 'card', label: '카드 결제' },
];

const generateDateRange = (days = 7) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      dateStr: d.toISOString().split('T')[0],
      weekday: d.toLocaleDateString('ko-KR', { weekday: 'short' }),
      day: d.getDate(),
    });
  }
  return dates;
};

const ClientBookingRenewal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
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
  const [selectedTime, setSelectedTime] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('session');
  const [submitting, setSubmitting] = useState(false);

  const loadConsultants = useCallback(async () => {
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

  const loadTimeSlots = useCallback(async (consultantId, dateStr) => {
    if (!consultantId || !dateStr) return;
    try {
      const res = await TenantAwareApiClient.get(
        `/api/v1/consultants/${consultantId}/availability`,
        { date: dateStr },
      );
      const slots = Array.isArray(res) ? res : res?.data || res?.content || [];
      if (slots.length > 0) {
        setTimeSlots(slots.map((s) => s.startTime || s.time || s));
      } else {
        setTimeSlots(['10:00', '11:00', '14:00', '15:00', '16:00']);
      }
    } catch {
      setTimeSlots(['10:00', '11:00', '14:00', '15:00', '16:00']);
    }
  }, []);

  useEffect(() => {
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

  const handleSubmit = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const cId = selectedConsultant?.id || selectedConsultant?.consultantId;
      await TenantAwareApiClient.post(API_CONSULTATIONS, {
        consultantId: cId,
        date: selectedDate,
        startTime: selectedTime,
        paymentMethod,
        clientId: user?.id,
      });
      showToast({ message: '예약이 완료되었습니다.', type: 'success' });
      setStep(4);
    } catch (err) {
      console.error('예약 실패:', err);
      showToast({ message: '예약에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!selectedConsultant;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return !!paymentMethod;
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
                    {c.profileImageUrl ? (
                      <img src={c.profileImageUrl} alt={c.name || '상담사'} />
                    ) : (
                      <User size={24} aria-hidden />
                    )}
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
    if (step === 3) return submitting ? '처리 중...' : '결제하기';
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
              setSelectedTime(null);
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
            {timeSlots.map((t) => (
              <button
                key={t}
                className={`client-booking__time-chip ${
                  selectedTime === t ? 'client-booking__time-chip--selected' : ''
                }`}
                role="radio"
                aria-checked={selectedTime === t}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 className="client-booking__step-title">예약 확인</h2>

      <div className="client-booking__summary-card">
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">{t('common.labels.consultant', '상담사')}</span>
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
                  weekday: 'short',
                })
              : '-'}
          </span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">시간</span>
          <span className="client-booking__summary-value">{selectedTime || '-'}</span>
        </div>
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">비용</span>
          <span className="client-booking__summary-value">50,000원</span>
        </div>
      </div>

      <div className="client-booking__payment-section">
        <h3 className="client-booking__payment-title">결제 수단</h3>
        <div className="client-booking__payment-options">
          {PAYMENT_OPTIONS.map((opt) => (
            <div
              key={opt.key}
              className={`client-booking__payment-option ${
                paymentMethod === opt.key ? 'client-booking__payment-option--selected' : ''
              }`}
              role="radio"
              aria-checked={paymentMethod === opt.key}
              tabIndex={0}
              onClick={() => setPaymentMethod(opt.key)}
              onKeyDown={(e) => e.key === 'Enter' && setPaymentMethod(opt.key)}
            >
              <div
                className={`client-booking__payment-radio ${
                  paymentMethod === opt.key ? 'client-booking__payment-radio--checked' : ''
                }`}
              />
              <span className="client-booking__payment-text">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="client-booking__complete">
      <div className="client-booking__check-circle">
        <Check size={40} aria-hidden />
      </div>
      <h2 className="client-booking__complete-title">예약이 완료되었습니다!</h2>

      <div className="client-booking__complete-info">
        <div className="client-booking__summary-row">
          <span className="client-booking__summary-label">{t('common.labels.consultant', '상담사')}</span>
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
                  weekday: 'short',
                })
              : '-'}{' '}
            {selectedTime || ''}
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
