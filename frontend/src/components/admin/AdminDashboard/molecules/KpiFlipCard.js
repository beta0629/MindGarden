import React, { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import './KpiFlipCard.css';

/**
 * KpiFlipCard — 3D Flip KPI 카드 (Molecule)
 *
 * 클릭/탭 시 Y축 180도 회전(앞면 요약 ↔ 뒷면 상세).
 * 동시 1장만 flipped 유지 — 부모에서 flippedId 관리.
 *
 * @param {Object} props
 * @param {string} props.id - 카드 고유 ID
 * @param {string} props.label - KPI 라벨 (예: "오늘 상담 일정")
 * @param {string|number} props.value - KPI 숫자 (24px Bold)
 * @param {string} props.summary - 앞면 보조 텍스트
 * @param {React.ReactNode} props.backContent - 뒷면 상세 콘텐츠 (JSX)
 * @param {string} [props.ctaLabel] - 뒷면 CTA 라벨 (없으면 미표시)
 * @param {Function} [props.onCtaClick] - CTA 클릭 핸들러
 * @param {boolean} props.isFlipped - 현재 flip 상태
 * @param {Function} props.onFlip - flip 토글 (id) => void
 * @author CoreSolution
 * @since 2026-06-18
 */
const KpiFlipCard = ({
  id,
  label,
  value,
  summary,
  backContent,
  ctaLabel,
  onCtaClick,
  isFlipped,
  onFlip
}) => {
  const handleClick = useCallback(() => {
    onFlip?.(id);
  }, [id, onFlip]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip?.(id);
    }
  }, [id, onFlip]);

  const handleCloseClick = useCallback((e) => {
    e.stopPropagation();
    onFlip?.(null);
  }, [onFlip]);

  const handleCtaClick = useCallback((e) => {
    e.stopPropagation();
    onCtaClick?.();
  }, [onCtaClick]);

  return (
    <div
      className={`mg-v2-kpi-flip-card${isFlipped ? ' mg-v2-kpi-flip-card--flipped' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={isFlipped}
      aria-label={`${label}: ${value}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="mg-v2-kpi-flip-card__inner">
        {/* Front — 요약 */}
        <div className="mg-v2-kpi-flip-card__front" aria-hidden={isFlipped}>
          <span className="mg-v2-kpi-flip-card__label">{label}</span>
          <span className="mg-v2-kpi-flip-card__value">{value}</span>
          <p className="mg-v2-kpi-flip-card__summary">{summary}</p>
          <span className="mg-v2-kpi-flip-card__flip-hint">
            <RotateCcw size={12} aria-hidden />
            클릭하여 상세 보기
          </span>
        </div>

        {/* Back — 상세 */}
        <div className="mg-v2-kpi-flip-card__back" aria-hidden={!isFlipped}>
          <div className="mg-v2-kpi-flip-card__back-header">
            <h4 className="mg-v2-kpi-flip-card__back-title">{label}</h4>
            <button
              type="button"
              className="mg-v2-kpi-flip-card__close-btn"
              onClick={handleCloseClick}
              aria-label="카드 닫기"
              tabIndex={isFlipped ? 0 : -1}
            >
              ✕
            </button>
          </div>
          <div className="mg-v2-kpi-flip-card__back-content">
            {backContent}
          </div>
          {ctaLabel && (
            <button
              type="button"
              className="mg-v2-kpi-flip-card__cta"
              onClick={handleCtaClick}
              tabIndex={isFlipped ? 0 : -1}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiFlipCard;
