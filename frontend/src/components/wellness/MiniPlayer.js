/**
 * MiniPlayer — 하단 고정 미니 오디오 플레이어
 *
 * 현재 재생 중인 명상 제목 + 재생/정지 + 닫기.
 * 바텀 네비게이션 위에 반투명 배경 + 블러로 표시.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React from 'react';
import { Play, Pause, X } from 'lucide-react';
import './MiniPlayer.css';

const MiniPlayer = ({ track, isPlaying, progress, onTogglePlay, onClose }) => {
  if (!track) return null;

  return (
    <div className="mini-player" role="region" aria-label="미니 플레이어">
      <div className="mini-player__info">
        <span className="mini-player__title">{track.title}</span>
        <span className="mini-player__category">{track.category}</span>
      </div>

      <div className="mini-player__controls">
        <button
          type="button"
          className="mini-player__btn"
          onClick={onTogglePlay}
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          className="mini-player__btn mini-player__btn--close"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div
        className="mini-player__progress"
        style={{ width: `${progress || 0}%` }}
        role="progressbar"
        aria-valuenow={progress || 0}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default MiniPlayer;
