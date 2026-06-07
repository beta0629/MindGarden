/**
 * MeditationGuide — 오디오 명상 가이드
 *
 * 카테고리 탭(호흡/마음챙김/수면/자연소리), 콘텐츠 카드,
 * HTML5 오디오 플레이어(재생/일시정지, 시크, 남은시간),
 * 즐겨찾기 하트, 수련 이력(총 시간·연속일·이번주),
 * 미니 플레이어(하단 고정).
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Pause, Heart, SkipBack, SkipForward,
  Headphones, Wind, Moon, TreePine, Brain
} from 'lucide-react';
import MiniPlayer from './MiniPlayer';
import SegmentedTabs from '../common/SegmentedTabs';
import CitationBlock from '../common/CitationBlock';
import './MeditationGuide.css';

const CATEGORIES = [
  { key: 'all', label: '전체', icon: Headphones },
  { key: 'breathing', label: '호흡', icon: Wind },
  { key: 'mindfulness', label: '마음챙김', icon: Brain },
  { key: 'sleep', label: '수면', icon: Moon },
  { key: 'nature', label: '자연소리', icon: TreePine },
  { key: 'favorites', label: '즐겨찾기', icon: Heart }
];

const SOURCE_WHO_BREATHING = {
  label: 'WHO Doing What Matters in Times of Stress (illustrated guide)',
  url: 'https://www.who.int/publications/i/item/9789240003927',
  author: 'World Health Organization',
  publishedYear: 2020
};
const SOURCE_APA_MINDFULNESS = {
  label: 'What are the benefits of mindfulness? (APA review)',
  url: 'https://www.apa.org/monitor/2012/07-08/ce-corner',
  author: 'American Psychological Association · Davis & Hayes',
  publishedYear: 2012
};

const MOCK_TRACKS = [
  { id: 1, title: '깊은 호흡 명상', category: 'breathing', categoryLabel: '호흡', duration: 600, source: SOURCE_WHO_BREATHING },
  { id: 2, title: '4-7-8 호흡법', category: 'breathing', categoryLabel: '호흡', duration: 480, source: SOURCE_WHO_BREATHING },
  { id: 3, title: '바디 스캔 마음챙김', category: 'mindfulness', categoryLabel: '마음챙김', duration: 900, source: SOURCE_APA_MINDFULNESS },
  { id: 4, title: '지금 이 순간에 집중하기', category: 'mindfulness', categoryLabel: '마음챙김', duration: 720, source: SOURCE_APA_MINDFULNESS },
  { id: 5, title: '수면 유도 명상', category: 'sleep', categoryLabel: '수면', duration: 1200 },
  { id: 6, title: '잠들기 전 이완', category: 'sleep', categoryLabel: '수면', duration: 1800 },
  { id: 7, title: '빗소리 자연 명상', category: 'nature', categoryLabel: '자연소리', duration: 1500 },
  { id: 8, title: '파도 소리', category: 'nature', categoryLabel: '자연소리', duration: 1200 },
  { id: 9, title: '새벽 숲 소리', category: 'nature', categoryLabel: '자연소리', duration: 900 },
  { id: 10, title: '아침 호흡 루틴', category: 'breathing', categoryLabel: '호흡', duration: 300, source: SOURCE_WHO_BREATHING }
];

const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const MeditationGuide = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mg_meditation_favs') || '[]');
    } catch { return []; }
  });
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [loading, setLoading] = useState(true);

  const practiceStats = {
    totalMinutes: 42,
    streak: 3,
    weekMinutes: 15
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('mg_meditation_favs', JSON.stringify(favorites));
  }, [favorites]);

  const getFilteredTracks = () => {
    if (activeCategory === 'all') return MOCK_TRACKS;
    if (activeCategory === 'favorites') return MOCK_TRACKS.filter((t) => favorites.includes(t.id));
    return MOCK_TRACKS.filter((t) => t.category === activeCategory);
  };
  const filteredTracks = getFilteredTracks();

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const playTrack = (track) => {
    setCurrentTrack(track);
    setShowPlayer(true);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const closeMiniPlayer = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    setShowPlayer(false);
    setCurrentTime(0);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            setIsPlaying(false);
            return currentTrack.duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
  };

  const progress = currentTrack
    ? (currentTime / currentTrack.duration) * 100
    : 0;

  const skipBack = () => setCurrentTime((prev) => Math.max(prev - 15, 0));
  const skipForward = () =>
    setCurrentTime((prev) => Math.min(prev + 15, currentTrack?.duration || 0));

  if (loading) {
    return (
      <div className="meditation">
        <div className="meditation__skeleton">
          <div className="meditation__skeleton-block" />
          <div className="meditation__skeleton-block meditation__skeleton-block--tall" />
          <div className="meditation__skeleton-block" />
        </div>
      </div>
    );
  }

  return (
    <div className="meditation">
      {/* 수련 이력 */}
      <div className="meditation__stats">
        <div className="meditation__stat-card">
          <span className="meditation__stat-value">{practiceStats.totalMinutes}분</span>
          <span className="meditation__stat-label">총 수련 시간</span>
        </div>
        <div className="meditation__stat-card">
          <span className="meditation__stat-value">{practiceStats.streak}일</span>
          <span className="meditation__stat-label">연속 수련</span>
        </div>
        <div className="meditation__stat-card">
          <span className="meditation__stat-value">{practiceStats.weekMinutes}분</span>
          <span className="meditation__stat-label">이번 주</span>
        </div>
      </div>

      {/* 카테고리 탭 — MGButton SSOT */}
      <SegmentedTabs
        ariaLabel="명상 카테고리"
        items={CATEGORIES.map((cat) => ({ value: cat.key, label: cat.label }))}
        activeValue={activeCategory}
        onChange={setActiveCategory}
        size="sm"
        className="meditation__categories"
      />

      {/* 플레이어 (열려있을 때) */}
      {showPlayer && currentTrack && (
        <div className="meditation__player">
          <div className="meditation__player-title">{currentTrack.title}</div>
          <div className="meditation__player-category">{currentTrack.categoryLabel}</div>

          <input
            type="range"
            className="meditation__player-seek"
            min={0}
            max={currentTrack.duration}
            value={currentTime}
            onChange={handleSeek}
            aria-label="재생 위치"
          />
          <div className="meditation__player-times">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(currentTrack.duration - currentTime)}</span>
          </div>

          <div className="meditation__player-controls">
            <button
              type="button"
              className="meditation__player-btn meditation__player-btn--small"
              onClick={skipBack}
              aria-label="15초 뒤로"
            >
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              className="meditation__player-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? '일시정지' : '재생'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              type="button"
              className="meditation__player-btn meditation__player-btn--small"
              onClick={skipForward}
              aria-label="15초 앞으로"
            >
              <SkipForward size={18} />
            </button>
          </div>
          <CitationBlock
            source={currentTrack.source}
            testId="meditation-citation"
            className="meditation__citation"
          />
        </div>
      )}

      {/* 콘텐츠 카드 리스트 */}
      {filteredTracks.length > 0 ? (
        <div className="meditation__list">
          {filteredTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`meditation__card${isCurrent && isPlaying ? ' meditation__card--playing' : ''}`}
                onClick={() => playTrack(track)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && playTrack(track)}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="meditation__card-play">
                  {isCurrent && isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </div>
                <div className="meditation__card-info">
                  <div className="meditation__card-title">{track.title}</div>
                  <div className="meditation__card-meta">
                    <span className="meditation__card-duration">{formatTime(track.duration)}</span>
                    <span className="meditation__card-tag">{track.categoryLabel}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`meditation__card-fav${favorites.includes(track.id) ? ' meditation__card-fav--active' : ''}`}
                  onClick={(e) => toggleFavorite(track.id, e)}
                  aria-label={favorites.includes(track.id) ? '즐겨찾기 해제' : '즐겨찾기'}
                >
                  <Heart size={20} fill={favorites.includes(track.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="meditation__empty">
          <div className="meditation__empty-icon">
            <Headphones size={28} />
          </div>
          <p className="meditation__empty-text">
            {activeCategory === 'favorites'
              ? '즐겨찾기한 명상이 없어요'
              : '아직 명상을 시작하지 않았어요'}
          </p>
          {activeCategory === 'favorites' && (
            <button
              type="button"
              className="meditation__empty-btn"
              onClick={() => setActiveCategory('all')}
            >
              명상 둘러보기
            </button>
          )}
          {activeCategory !== 'favorites' && (
            <button
              type="button"
              className="meditation__empty-btn"
              onClick={() => filteredTracks.length > 0 && playTrack(filteredTracks[0])}
            >
              첫 명상 시작하기
            </button>
          )}
        </div>
      )}

      {/* 미니 플레이어 */}
      {currentTrack && !showPlayer && (
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          onTogglePlay={togglePlay}
          onClose={closeMiniPlayer}
        />
      )}
    </div>
  );
};

export default MeditationGuide;
