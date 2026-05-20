/**
 * ClientConsultationsRenewal — 내 상담 리뉴얼
 *
 * 예정/완료 탭 + 상담일지 열람 + 상담사 평가(바텀시트)
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Star, FileText, Clock } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { useToast } from '../../contexts/ToastContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ClientConsultationsRenewal.css';
import { USER_ROLES } from '../../constants/roles';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_SCHEDULES = '/api/v1/schedules';
const API_RATINGS = '/api/v1/ratings';


const TABS = [
  { key: 'upcoming', label: '예정' },
  { key: 'completed', label: '완료' },
];

const REVIEW_TAGS = [
  '공감적', '전문적', '편안한', '따뜻한', '명확한', '경청을 잘하는',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const groupByDate = (items) => {
  const groups = {};
  items.forEach((item) => {
    const key = item.date || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => (a > b ? -1 : 1));
};

const ClientConsultationsRenewal = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [ratingModal, setRatingModal] = useState(null);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const loadConsultations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await TenantAwareApiClient.get(API_SCHEDULES, {
        userId: user.id,
        userRole: USER_ROLES.CLIENT,
      });
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      setConsultations(data);
    } catch (err) {
      console.error('상담 목록 로드 실패:', err);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const upcomingList = consultations
    .filter((c) => c.status === 'CONFIRMED' || c.status === 'PENDING')
    .sort((a, b) => {
      const keyA = `${a.date}T${a.startTime || '00:00'}`;
      const keyB = `${b.date}T${b.startTime || '00:00'}`;
      return keyA < keyB ? -1 : 1;
    });

  const completedList = consultations
    .filter((c) => c.status === 'COMPLETED' || c.status === '완료')
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const completedGroups = tab === 'completed' ? groupByDate(completedList) : [];

  const handleCancel = async (consultationId) => {
    if (!globalThis.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await TenantAwareApiClient.put(`/api/v1/consultations/${consultationId}/cancel`);
      loadConsultations();
    } catch (err) {
      console.error('예약 취소 실패:', err);
    }
  };

  const handleOpenRating = (consultation) => {
    setRatingModal(consultation);
    setRating(0);
    setSelectedTags([]);
    setComment('');
  };

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || rating === 0) return;
    try {
      setSubmittingRating(true);
      const consultationId = ratingModal.id || ratingModal.consultationId;
      await TenantAwareApiClient.post(API_RATINGS, {
        consultationId,
        rating,
        tags: selectedTags,
        comment: comment || null,
        clientId: user?.id,
      });
      showToast({ message: '평가가 저장되었습니다.', type: 'success' });
      setRatingModal(null);
      loadConsultations();
    } catch (err) {
      console.error('평가 저장 실패:', err);
      showToast({ message: '평가 저장에 실패했습니다.', type: 'error' });
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderCard = (item, isUpcoming = true) => {
    const id = item.id || item.consultationId;
    let statusText = '완료';
    if (isUpcoming) {
      statusText = item.status === 'PENDING' ? '대기 중' : '예정';
    }
    const badgeClass = isUpcoming
      ? 'client-consult__card-badge--upcoming'
      : 'client-consult__card-badge--completed';

    return (
      <article key={id} className="client-consult__card">
        <div className="client-consult__card-header">
          <span className={`client-consult__card-badge ${badgeClass}`}>
            {statusText}
          </span>
          <span className="client-consult__card-time">
            {formatDate(item.date)} {item.startTime || ''}
          </span>
        </div>

        <div className="client-consult__card-body">
          <div className="client-consult__card-avatar">
            <User size={20} aria-hidden />
          </div>
          <div className="client-consult__card-info">
            <h3 className="client-consult__card-name">
              {item.consultantName || item.title || '상담'}
            </h3>
            <p className="client-consult__card-time">
              {item.startTime && item.endTime
                ? `${item.startTime} - ${item.endTime}`
                : ''}
            </p>
          </div>
        </div>

        <div className="client-consult__card-actions">
          {isUpcoming ? (
            <>
              <button
                className="client-consult__card-btn client-consult__card-btn--outline"
                onClick={() => navigate(`/client/schedule`)}
              >
                상세 보기
              </button>
              <button
                className="client-consult__card-btn client-consult__card-btn--danger"
                onClick={() => handleCancel(id)}
              >
                취소
              </button>
            </>
          ) : (
            <>
              {item.hasSharedRecord && (
                <button
                  className="client-consult__card-btn client-consult__card-btn--outline"
                  onClick={() =>
                    navigate(`/consultant/consultation-record-view/${id}`)
                  }
                >
                  <FileText size={14} aria-hidden /> 일지
                </button>
              )}
              <button
                className="client-consult__card-btn client-consult__card-btn--primary"
                onClick={() => handleOpenRating(item)}
              >
                <Star size={14} aria-hidden /> 평가하기
              </button>
            </>
          )}
        </div>
      </article>
    );
  };

  if (loading) {
    return (
      <div className="client-consult">
        <div className="client-consult__tabs">
          {TABS.map((t) => (
            <button key={t.key} className="client-consult__tab" disabled>
              {t.label}
            </button>
          ))}
        </div>
        <div className="client-consult__skeleton" aria-busy="true">
          <div className="client-consult__skeleton-block" />
          <div className="client-consult__skeleton-block" />
          <div className="client-consult__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="client-consult">
      <div className="client-consult__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`client-consult__tab ${
              tab === t.key ? 'client-consult__tab--active' : ''
            }`}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="client-consult__content" role="tabpanel">
        {tab === 'upcoming' && (
          <>
            {upcomingList.length > 0 ? (
              <div className="client-consult__list">
                {upcomingList.map((item) => renderCard(item, true))}
              </div>
            ) : (
              <div className="client-consult__empty">
                <Calendar size={48} className="client-consult__empty-icon" aria-hidden />
                <h3 className="client-consult__empty-title">예정된 상담이 없어요</h3>
                <p className="client-consult__empty-desc">
                  새로운 상담을 예약하고 전문가의 도움을 받아보세요.
                </p>
                <button
                  className="client-consult__empty-cta"
                  onClick={() => navigate('/client/booking')}
                >
                  <Calendar size={18} aria-hidden /> 상담 예약하기
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'completed' && (
          <>
            {completedGroups.length > 0 ? (
              completedGroups.map(([dateKey, items]) => (
                <div key={dateKey} className="client-consult__date-group">
                  <p className="client-consult__date-label">{formatDate(dateKey)}</p>
                  <div className="client-consult__list">
                    {items.map((item) => renderCard(item, false))}
                  </div>
                </div>
              ))
            ) : (
              <div className="client-consult__empty">
                <Clock size={48} className="client-consult__empty-icon" aria-hidden />
                <h3 className="client-consult__empty-title">완료된 상담이 없어요</h3>
                <p className="client-consult__empty-desc">
                  상담이 완료되면 이곳에서 이력을 확인할 수 있어요.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 평가 바텀시트 */}
      {ratingModal && (
        <div
          className="client-consult__rating-overlay"
          onClick={() => setRatingModal(null)}
          onKeyDown={(e) => e.key === 'Escape' && setRatingModal(null)}
          aria-label="상담사 평가"
        >
          <div
            className="client-consult__rating-sheet"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="client-consult__rating-handle" />
            <h2 className="client-consult__rating-title">상담은 어떠셨나요?</h2>

            <div className="client-consult__rating-stars" role="radiogroup" aria-label="별점">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  className="client-consult__rating-star"
                  onClick={() => setRating(val)}
                  aria-label={`${val}점`}
                >
                  <Star
                    size={36}
                    fill={val <= rating ? 'var(--mg-client-primary-light)' : 'none'}
                    color={val <= rating ? 'var(--mg-client-primary-light)' : 'var(--mg-warm-gray-300)'}
                  />
                </button>
              ))}
            </div>

            <div className="client-consult__rating-tags">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  className={`client-consult__rating-tag ${
                    selectedTags.includes(tag)
                      ? 'client-consult__rating-tag--selected'
                      : ''
                  }`}
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              className="client-consult__rating-textarea"
              placeholder="한줄평을 남겨주세요 (선택)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
            />

            <button
              className="client-consult__rating-submit"
              onClick={handleSubmitRating}
              disabled={rating === 0 || submittingRating}
            >
              {submittingRating ? '저장 중...' : '평가 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConsultationsRenewal;
