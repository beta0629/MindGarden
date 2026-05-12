/**
 * ClientWellnessRenewal — 웰니스 허브 리뉴얼
 *
 * 감정 일기 · 자가 심리검사 · 마음챙김 가이드 · 힐링 콘텐츠 피드
 * ClientAppShell 레이아웃 내에서 렌더링.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smile, BookOpen,
  ChevronRight, Heart, Brain, Activity
} from 'lucide-react';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ClientWellnessRenewal.css';

const MOOD_EMOJIS = [
  { value: 1, emoji: '😢', label: '매우 나쁨' },
  { value: 2, emoji: '😟', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
];

const SELF_ASSESSMENTS = [
  {
    key: 'PHQ9',
    name: 'PHQ-9 우울 검사',
    desc: '우울 증상 자가 평가 (9문항)',
    iconClass: 'client-wellness__test-icon--depression',
    IconComp: Heart,
  },
  {
    key: 'GAD7',
    name: 'GAD-7 불안 검사',
    desc: '불안 증상 자가 평가 (7문항)',
    iconClass: 'client-wellness__test-icon--anxiety',
    IconComp: Brain,
  },
  {
    key: 'PSS',
    name: 'PSS 스트레스 검사',
    desc: '스트레스 수준 자가 평가 (10문항)',
    iconClass: 'client-wellness__test-icon--stress',
    IconComp: Activity,
  },
];

const GUIDE_ITEMS = [
  { key: 'breathing', emoji: '🌬️', name: '호흡법' },
  { key: 'muscle', emoji: '💆', name: '근육 이완' },
  { key: 'mindfulness', emoji: '🧘', name: '마인드풀니스' },
  { key: 'grounding', emoji: '🌿', name: '그라운딩' },
];

const ClientWellnessRenewal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healingContent, setHealingContent] = useState([]);

  const loadWellnessData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TenantAwareApiClient.get('/api/v1/healing/content', {
        page: 0,
        size: 5,
      });
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      setHealingContent(data);
    } catch (err) {
      console.error('웰니스 콘텐츠 로드 실패:', err);
      setHealingContent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWellnessData();
  }, [loadWellnessData]);

  if (loading) {
    return (
      <div className="client-wellness__skeleton" aria-busy="true">
        <div className="client-wellness__skeleton-block client-wellness__skeleton-hero" />
        <div className="client-wellness__skeleton-block client-wellness__skeleton-card" />
        <div className="client-wellness__skeleton-block client-wellness__skeleton-card" />
        <div className="client-wellness__skeleton-block client-wellness__skeleton-card" />
      </div>
    );
  }

  return (
    <div className="client-wellness">
      {/* 감정 일기 섹션 */}
      <section aria-label="오늘의 기분 기록">
        <article
          className="client-wellness__mood-card"
          onClick={() => navigate('/client/mood-journal')}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/client/mood-journal')}
        >
          <div className="client-wellness__mood-header">
            <h2 className="client-wellness__mood-title">오늘의 기분 기록</h2>
            <Smile size={22} aria-hidden />
          </div>
          <div className="client-wellness__mood-emojis" aria-label="기분 선택">
            {MOOD_EMOJIS.map((m) => (
              <button
                key={m.value}
                className="client-wellness__mood-emoji"
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
          <p className="client-wellness__mood-cta">
            탭하여 감정 일기를 작성해보세요
          </p>
        </article>
      </section>

      {/* 자가 심리검사 섹션 */}
      <section aria-label="자가 심리검사">
        <h2 className="client-wellness__section-title">자가 심리검사</h2>
        <div className="client-wellness__test-list">
          {SELF_ASSESSMENTS.map((test) => {
            const IconComp = test.IconComp;
            return (
              <article
                key={test.key}
                className="client-wellness__test-card"
                onClick={() => navigate(`/client/self-assessment?type=${test.key}`)}
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  navigate(`/client/self-assessment?type=${test.key}`)
                }
              >
                <div className={`client-wellness__test-icon ${test.iconClass}`}>
                  <IconComp size={22} aria-hidden />
                </div>
                <div className="client-wellness__test-info">
                  <h3 className="client-wellness__test-name">{test.name}</h3>
                  <p className="client-wellness__test-desc">{test.desc}</p>
                </div>
                <ChevronRight
                  size={20}
                  className="client-wellness__test-arrow"
                  aria-hidden
                />
              </article>
            );
          })}
        </div>
      </section>

      {/* 마음챙김 가이드 */}
      <section aria-label="마음챙김 가이드">
        <h2 className="client-wellness__section-title">마음챙김 가이드</h2>
        <div className="client-wellness__guide-grid">
          {GUIDE_ITEMS.map((item) => (
            <article
              key={item.key}
              className="client-wellness__guide-card"
              onClick={() => navigate('/client/mindfulness-guide')}
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && navigate('/client/mindfulness-guide')
              }
            >
              <div className="client-wellness__guide-icon">{item.emoji}</div>
              <h3 className="client-wellness__guide-name">{item.name}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* 힐링 콘텐츠 피드 */}
      <section aria-label="힐링 콘텐츠">
        <h2 className="client-wellness__section-title">힐링 콘텐츠</h2>
        {healingContent.length > 0 ? (
          <div className="client-wellness__feed-list">
            {healingContent.map((item, idx) => (
              <article
                key={item.id || idx}
                className="client-wellness__feed-card"
                onClick={() =>
                  navigate(`/client/wellness/${item.id || idx}`)
                }
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  navigate(`/client/wellness/${item.id || idx}`)
                }
              >
                <p className="client-wellness__feed-category">
                  {item.category || '마음 돌봄'}
                </p>
                <h3 className="client-wellness__feed-title">
                  {item.title || '힐링 콘텐츠'}
                </h3>
                <p className="client-wellness__feed-summary">
                  {item.summary || item.content?.substring(0, 80) || ''}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="client-wellness__empty">
            <BookOpen size={36} className="client-wellness__empty-icon" aria-hidden />
            <p className="client-wellness__empty-text">
              아직 등록된 힐링 콘텐츠가 없어요
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ClientWellnessRenewal;
