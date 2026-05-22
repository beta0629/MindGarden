/**
 * ClientHomeRenewal — 내담자 홈(피드) 리뉴얼
 *
 * 다음 상담 카운트다운 · 오늘의 기분 기록 · 웰니스 팁 · 빠른 액션 · 최근 활동 요약
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, MessageCircle, Sparkles, ChevronRight,
  CreditCard, Clock, Smile
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ClientHomeRenewal.css';
import { USER_ROLES } from '../../constants/roles';
import { SCHEDULE_API } from '../../constants/api';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_HEALING_CONTENT = '/api/v1/healing/content';
const API_ACTIVITIES = '/api/v1/activities';


const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: '매우 나쁨' },
  { value: 2, emoji: '😟', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
];

const ACTIVITY_ICON_MAP = {
  consultation: Calendar,
  message: MessageCircle,
  payment: CreditCard,
};

const formatCountdown = (dateStr, startTime) => {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(`${dateStr}T${startTime || '00:00'}`);
  const diff = target - now;
  if (diff <= 0) return '곧 시작';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `D-${days}`;
  if (hours > 0) return `${hours}시간 ${minutes}분 후`;
  return `${minutes}분 후`;
};

const formatScheduleDate = (dateStr, startTime) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = d.toLocaleDateString('ko-KR', { weekday: 'short' });
  const md = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  return startTime ? `${md} (${weekday}) ${startTime}` : `${md} (${weekday})`;
};

const ClientHomeRenewal = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [nextConsultation, setNextConsultation] = useState(null);
  const [wellnessTip, setWellnessTip] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  const loadHomeData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [schedulesRes, healingRes, activitiesRes] = await Promise.allSettled([
        TenantAwareApiClient.get(SCHEDULE_API.SCHEDULES, {
          userId: user.id,
          userRole: USER_ROLES.CLIENT,
        }),
        TenantAwareApiClient.get(API_HEALING_CONTENT, { page: 0, size: 1 }),
        TenantAwareApiClient.get(API_ACTIVITIES, { userId: user.id, size: 3 }),
      ]);

      if (schedulesRes.status === 'fulfilled') {
        const schedules = Array.isArray(schedulesRes.value)
          ? schedulesRes.value
          : schedulesRes.value?.data || schedulesRes.value?.content || [];

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const upcoming = schedules
          .filter((s) => {
            const sd = new Date(s.date);
            const dayStart = new Date(todayStr);
            dayStart.setHours(0, 0, 0, 0);
            return sd >= dayStart && s.status === 'CONFIRMED';
          })
          .sort((a, b) => {
            const keyA = `${a.date}T${a.startTime || '00:00'}`;
            const keyB = `${b.date}T${b.startTime || '00:00'}`;
            return keyA < keyB ? -1 : 1;
          });
        setNextConsultation(upcoming[0] || null);
      }

      if (healingRes.status === 'fulfilled') {
        const content = Array.isArray(healingRes.value)
          ? healingRes.value
          : healingRes.value?.data || healingRes.value?.content || [];
        setWellnessTip(content[0] || null);
      }

      if (activitiesRes.status === 'fulfilled') {
        const acts = Array.isArray(activitiesRes.value)
          ? activitiesRes.value
          : activitiesRes.value?.data || activitiesRes.value?.content || [];
        setRecentActivities(acts.slice(0, 3));
      }
    } catch (err) {
      console.error('홈 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const countdown = useMemo(
    () =>
      nextConsultation
        ? formatCountdown(nextConsultation.date, nextConsultation.startTime)
        : null,
    [nextConsultation],
  );

  if (loading) {
    return (
      <div className="client-home__skeleton" aria-busy="true" aria-live="polite">
        <div className="client-home__skeleton-block client-home__skeleton-hero" />
        <div className="client-home__skeleton-block client-home__skeleton-card" />
        <div className="client-home__skeleton-block client-home__skeleton-card" />
        <div className="client-home__skeleton-actions">
          <div className="client-home__skeleton-block client-home__skeleton-btn" />
          <div className="client-home__skeleton-block client-home__skeleton-btn" />
        </div>
        <div className="client-home__skeleton-block client-home__skeleton-card" />
      </div>
    );
  }

  return (
    <div className="client-home">
      {/* 다음 상담 카운트다운 카드 */}
      {nextConsultation ? (
        <section aria-label="다음 상담">
          <div
            className="client-home__hero-card"
            role="button"
            onClick={() => navigate('/client/session-management')}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/client/session-management')}
          >
            <div className="client-home__hero-top">
              <div className="client-home__hero-avatar">
                <Smile size={28} aria-hidden />
              </div>
              <div className="client-home__hero-info">
                <h2 className="client-home__hero-name">
                  {nextConsultation.consultantName || '상담사'}
                </h2>
                <p className="client-home__hero-specialty">
                  {nextConsultation.specialization || '전문 상담'}
                </p>
              </div>
            </div>
            <div className="client-home__hero-countdown">{countdown}</div>
            <div className="client-home__hero-datetime">
              {formatScheduleDate(nextConsultation.date, nextConsultation.startTime)}
            </div>
            <button
              className="client-home__hero-action"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/client/session-management');
              }}
            >
              {t('admin.actions.viewDetail', '상세 보기')} <ChevronRight size={16} />
            </button>
          </div>
        </section>
      ) : (
        <section aria-label="다음 상담">
          <div className="client-home__empty">
            <Calendar size={48} className="client-home__empty-icon" aria-hidden />
            <h2 className="client-home__empty-title">예정된 상담이 없어요</h2>
            <p className="client-home__empty-desc">
              새로운 상담을 예약하고 전문가의 도움을 받아보세요.
            </p>
            <button
              className="client-home__empty-cta"
              onClick={() => navigate('/client/booking')}
            >
              <Calendar size={18} aria-hidden />
              첫 상담 예약하기
            </button>
          </div>
        </section>
      )}

      {/* 오늘의 기분 기록 카드 */}
      <section aria-label="오늘의 기분">
        <div
          className="client-home__mood-card"
          role="button"
          onClick={() => navigate('/client/mood-journal')}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/client/mood-journal')}
        >
          <div className="client-home__mood-header">
            <h2 className="client-home__mood-title">오늘 기분은 어떠세요?</h2>
            <Smile size={22} color="var(--mg-client-primary)" aria-hidden />
          </div>
          <div className="client-home__mood-emojis" role="radiogroup" aria-label="기분 선택">
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.value}
                className="client-home__mood-emoji"
                aria-label={m.label}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/client/mood-journal');
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <div className="client-home__mood-cta">
            감정 일기 작성하기 <ChevronRight size={16} />
          </div>
        </div>
      </section>

      {/* 오늘의 웰니스 팁 */}
      <section aria-label="오늘의 웰니스 팁">
        {wellnessTip ? (
          <div
            className="client-home__wellness-card"
            role="button"
            onClick={() => navigate('/client/wellness-hub')}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/client/wellness-hub')}
          >
            <p className="client-home__wellness-label">오늘의 웰니스 팁</p>
            <h2 className="client-home__wellness-title">
              {wellnessTip.title || '마음 돌봄 가이드'}
            </h2>
            <p className="client-home__wellness-desc">
              {wellnessTip.summary || wellnessTip.content?.substring(0, 60) || '오늘 하루도 힘내세요'}
            </p>
            <Sparkles size={40} className="client-home__wellness-icon" aria-hidden />
          </div>
        ) : (
          <div
            className="client-home__wellness-card"
            role="button"
            onClick={() => navigate('/client/wellness-hub')}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/client/wellness-hub')}
          >
            <p className="client-home__wellness-label">오늘의 웰니스 팁</p>
            <h2 className="client-home__wellness-title">마음 돌봄 가이드</h2>
            <p className="client-home__wellness-desc">
              오늘 하루, 나를 위한 시간을 가져보세요.
            </p>
            <Sparkles size={40} className="client-home__wellness-icon" aria-hidden />
          </div>
        )}
      </section>

      {/* 빠른 액션 */}
      <section className="client-home__actions" aria-label="빠른 액션">
        <button
          className="client-home__action-btn client-home__action-btn--primary"
          onClick={() => navigate('/client/booking')}
        >
          <Calendar size={20} aria-hidden />
          예약하기
        </button>
        <button
          className="client-home__action-btn client-home__action-btn--secondary"
          onClick={() => navigate('/client/messages')}
        >
          <MessageCircle size={20} aria-hidden />
          메시지 보내기
        </button>
      </section>

      {/* 최근 활동 요약 */}
      <section className="client-home__activity" aria-label="최근 활동">
        <h2 className="client-home__section-title">최근 활동</h2>
        {recentActivities.length > 0 ? (
          <ul className="client-home__activity-list">
            {recentActivities.map((act, idx) => {
              const IconComp =
                ACTIVITY_ICON_MAP[act.type] || Clock;
              return (
                <li key={act.id || idx} className="client-home__activity-item">
                  <div className="client-home__activity-icon">
                    <IconComp size={18} aria-hidden />
                  </div>
                  <div className="client-home__activity-content">
                    <p className="client-home__activity-text">
                      {act.description || act.title || '활동'}
                    </p>
                    <span className="client-home__activity-time">
                      {act.createdAt
                        ? new Date(act.createdAt).toLocaleDateString('ko-KR')
                        : ''}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="client-home__empty client-home__empty--compact">
            <Clock size={36} className="client-home__empty-icon" aria-hidden />
            <p className="client-home__empty-desc">아직 활동 내역이 없어요</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientHomeRenewal;
